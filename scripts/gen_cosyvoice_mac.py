#!/usr/bin/env python3
"""
LinguaNewTab — CosyVoice TTS audio generator (Alibaba Cloud API)

Sinh file MP3 cho pinyin phonemes + HSK1 words qua **Alibaba Cloud Model Studio**
API (CosyVoice v2, giọng `longxiaochun_v2` — giọng nữ Bắc Kinh chuẩn native).

Why CosyVoice API (không phải local):
    - Chất lượng vượt xa Kokoro cho tiếng Trung (CER 0.81% vs Kokoro ~2-3%)
    - Tone 1-4 + neutral tone chính xác, không cần workaround period
    - Made-in-China → train trên data native Mandarin
    - Cloud API = không cần setup conda/GPU/model 1GB+ local
    - Free tier đủ xài (~$0.05 cho 214 files → rất rẻ kể cả paid)

Chạy 1 lần, bundle output vào extension. User cuối không cần Python.

Usage:
    # 1. Sample 10 file preview giọng (chi phí <$0.01)
    python scripts/gen_cosyvoice_mac.py --sample

    # 2. Nếu ưng giọng → full generate
    python scripts/gen_cosyvoice_mac.py --scope=all

    # Options:
    python scripts/gen_cosyvoice_mac.py --scope=phonemes    # chỉ 64 phonemes
    python scripts/gen_cosyvoice_mac.py --scope=hsk1        # chỉ 150 HSK1
    python scripts/gen_cosyvoice_mac.py --voice longwan_v2  # voice khác
    python scripts/gen_cosyvoice_mac.py --force             # overwrite

Setup:
    # 1. Register Alibaba Cloud Singapore (free tier):
    #    https://www.alibabacloud.com/ → Sign Up → Singapore region
    #
    # 2. Activate Model Studio + get API key:
    #    https://www.alibabacloud.com/help/en/model-studio/get-api-key
    #    Chọn Singapore region (KHÔNG phải Beijing).
    #
    # 3. Set API key env var:
    export DASHSCOPE_API_KEY="sk-xxx"
    #    Hoặc paste vào ~/.zshrc để persist.
    #
    # 4. Install Python deps (cd vào lingua-newtab folder trước):
    uv venv
    source .venv/bin/activate
    uv pip install dashscope

    # 5. Run generate
    python scripts/gen_cosyvoice_mac.py --sample   # preview 10 files
    python scripts/gen_cosyvoice_mac.py --scope=all

Output:
    public/audio/zh/initials/*.mp3     (21 files)
    public/audio/zh/finals/*.mp3       (38 files)
    public/audio/zh/tones/*.mp3        (5 files)
    public/audio/zh/words/*.mp3        (150 files, HSK1)
    public/audio/zh/manifest.json      (ID → path mapping)

Schema manifest.json khớp với src/services/audioService.ts:
    {
      "generated_at": "2026-04-23T...",
      "generator": "cosyvoice",
      "voice": "longxiaochun_v2",
      "total_files": 214,
      "entries": {
        "initials/zh_init_b": { "default": "initials/zh_init_b.mp3" },
        "words/zh_001":        { "default": "words/zh_001.mp3" },
        ...
      }
    }

Voices khả dụng (Singapore region, cosyvoice-v3-flash):
    longanyang       — DEFAULT, system voice, chất lượng tốt cho phát âm chuẩn
    (Voice list đầy đủ cho Singapore region:
     https://www.alibabacloud.com/help/en/model-studio/voice-list)

⚠️ Lưu ý: Singapore region chỉ support cosyvoice-v3-flash và cosyvoice-v3-plus
    (KHÔNG support cosyvoice-v2). Các voice có hậu tố `_v2` (longxiaochun_v2,
    longwan_v2...) chỉ khả dụng ở Beijing region — không dùng được với API
    key Singapore.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# ————————————————————————————————————————————
# Paths
# ————————————————————————————————————————————

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_ROOT = PROJECT_ROOT / "public" / "audio" / "zh"
PHONEMES_JSON = SCRIPT_DIR / "phonemes-source.json"
HSK1_TS = PROJECT_ROOT / "src" / "data" / "zh" / "hsk1.ts"

DEFAULT_VOICE = "longanyang"
DEFAULT_MODEL = "cosyvoice-v3-flash"

# Endpoint Singapore — KHÔNG đổi sang Beijing nếu account đăng ký quốc tế.
# Beijing endpoint dùng API key riêng, không tương thích.
SINGAPORE_WS_URL = "wss://dashscope-intl.aliyuncs.com/api-ws/v1/inference"
SINGAPORE_HTTP_URL = "https://dashscope-intl.aliyuncs.com/api/v1"

# Sample IDs for preview run — mix of initials/finals/tones/words
SAMPLE_IDS = [
    "zh_init_b", "zh_init_zh", "zh_init_c",          # tricky consonants
    "zh_fin_a", "zh_fin_uan", "zh_fin_er",           # vowels + rhotic
    "zh_tone_1", "zh_tone_3",                        # flat + dipping tones
    "zh_001", "zh_010",                              # common words 我, 不
]


# ————————————————————————————————————————————
# Logging helpers
# ————————————————————————————————————————————

def log(msg: str, end: str = "\n") -> None:
    print(msg, end=end, flush=True)


def human_size(n_bytes: int) -> str:
    for unit in ("B", "KB", "MB"):
        if n_bytes < 1024:
            return f"{n_bytes:.1f}{unit}"
        n_bytes /= 1024
    return f"{n_bytes:.1f}GB"


# ————————————————————————————————————————————
# Pre-flight checks
# ————————————————————————————————————————————

def check_ffmpeg() -> bool:
    """CosyVoice trả MP3 native nhưng ffmpeg vẫn cần cho pad/trim nếu có."""
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True, check=True,
        )
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def check_api_key() -> str | None:
    """Verify DASHSCOPE_API_KEY is set. Returns the key or None."""
    api_key = os.getenv("DASHSCOPE_API_KEY", "").strip()
    if not api_key:
        return None
    if not api_key.startswith("sk-"):
        log(f"⚠️  API key không bắt đầu bằng 'sk-'. Có thể sai format.")
        log(f"    Đọc lại: https://www.alibabacloud.com/help/en/model-studio/get-api-key")
    return api_key


# ————————————————————————————————————————————
# Data loaders — reused from Kokoro script
# ————————————————————————————————————————————

def load_phonemes() -> dict:
    """Load phonemes-source.json → flat dict of id → syllable."""
    if not PHONEMES_JSON.exists():
        log(f"❌ {PHONEMES_JSON} not found")
        sys.exit(1)

    with open(PHONEMES_JSON, encoding="utf-8") as f:
        data = json.load(f)

    phonemes = {}
    for category in ("initials", "finals", "tones"):
        for item in data.get(category, []):
            phonemes[item["id"]] = item["syllable"]
    return phonemes


def load_hsk1_words() -> dict:
    """
    Parse src/data/zh/hsk1.ts → dict of {word_id: hanzi_term}.

    Regex-based so we don't need Node.js. Only extracts id + term fields.
    """
    if not HSK1_TS.exists():
        log(f"❌ {HSK1_TS} not found")
        sys.exit(1)

    content = HSK1_TS.read_text(encoding="utf-8")
    pattern = re.compile(
        r"\{\s*id:\s*['\"](zh_\d+)['\"]\s*,.*?term:\s*['\"]([^'\"]+)['\"]",
        re.DOTALL,
    )

    words = {}
    for match in pattern.finditer(content):
        word_id, term = match.group(1), match.group(2)
        words[word_id] = term

    if not words:
        log(f"❌ No words parsed from {HSK1_TS}")
        sys.exit(1)

    return words


def phoneme_subdir(pid: str) -> str:
    """Route ID to proper subfolder."""
    if pid.startswith("zh_init_"):
        return "initials"
    if pid.startswith("zh_fin_"):
        return "finals"
    if pid.startswith("zh_tone_"):
        return "tones"
    if re.match(r"^zh_\d+$", pid):
        return "words"
    raise ValueError(f"Unknown phoneme ID prefix: {pid}")


# ————————————————————————————————————————————
# CosyVoice generation
# ————————————————————————————————————————————

def build_tts_text(pid: str, syllable: str) -> str:
    """
    Prepare the text we send to CosyVoice.

    For WORDS (HSK1): send as-is — CosyVoice handles multi-character words
    with proper tone sandhi + prosody.

    For PHONEMES (initials/finals/tones): CosyVoice is trained on sentences;
    isolated syllables like "b" or "zh" can confuse the tokenizer. We wrap
    them in a minimal carrier sentence so the model emits clean pinyin
    pronunciation. This is the key trick that also applied to Kokoro (with
    a period suffix) — but CosyVoice understands Chinese prompting natively
    so we use a descriptive Chinese lead-in instead.

    Experimentation showed that for true phonemes (b, p, m...), the best
    results come from the syllable + tone mark already embedded in the data.
    We don't need extra punctuation because CosyVoice v2 handles isolated
    pinyin much better than generic TTS.

    For tones specifically (ā, á, ǎ, à, a), the syllable already carries the
    diacritic → model reads it correctly.
    """
    # Initial consonants alone ("b", "p"...) need context — append a common
    # vowel to form a pronounceable syllable, then the model naturally says
    # just the consonant+vowel. This matches how pinyin is actually taught.
    if pid.startswith("zh_init_"):
        # Most initials don't include a trailing "o" in the data source,
        # e.g. syllable is "bo", "po", "mo" — already syllabified. Good.
        return syllable
    # Finals, tones, words — send as-is
    return syllable


def generate_one(
    pid: str,
    text: str,
    voice: str,
    model: str,
    force: bool,
) -> dict | None:
    """
    Generate 1 audio file via CosyVoice API. Returns manifest entry or None.

    Uses dashscope.audio.tts_v2.SpeechSynthesizer which returns MP3 binary
    directly — no WAV intermediate, no ffmpeg conversion needed.
    """
    from dashscope.audio.tts_v2 import SpeechSynthesizer

    subdir = phoneme_subdir(pid)
    stem = pid
    mp3_path = OUTPUT_ROOT / subdir / f"{stem}.mp3"

    if mp3_path.exists() and not force:
        return {
            "id": pid,
            "key": f"{subdir}/{pid}",
            "rel_path": f"{subdir}/{stem}.mp3",
            "text": text,
            "skipped": True,
        }

    tts_text = build_tts_text(pid, text)

    # Synthesizer is stateful — one instance per request is cleanest,
    # though you could pool them for more speed. For 214 files total,
    # the API overhead dominates so per-request instantiation is fine.
    synth = SpeechSynthesizer(model=model, voice=voice)
    audio_bytes = synth.call(tts_text)

    if audio_bytes is None or len(audio_bytes) == 0:
        raise RuntimeError(
            f"Empty audio returned for {pid!r} (text={tts_text!r}). "
            f"Check API key region matches endpoint, model, and voice."
        )

    mp3_path.write_bytes(audio_bytes)
    size = mp3_path.stat().st_size

    return {
        "id": pid,
        "key": f"{subdir}/{pid}",
        "rel_path": f"{subdir}/{stem}.mp3",
        "text": text,
        "size_bytes": size,
    }


# ————————————————————————————————————————————
# Main
# ————————————————————————————————————————————

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate CosyVoice TTS audio for LinguaNewTab (via Alibaba API)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--scope",
        choices=["phonemes", "hsk1", "all"],
        default="all",
        help="Dataset to generate: phonemes (64), hsk1 (150), or all (default)",
    )
    parser.add_argument("--sample", action="store_true",
                        help="Generate 10 file preview, ignore --scope")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite existing files")
    parser.add_argument("--voice", default=DEFAULT_VOICE,
                        help=f"Voice ID (default: {DEFAULT_VOICE})")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Model ID (default: {DEFAULT_MODEL})")
    args = parser.parse_args()

    log("🎙️  LinguaNewTab — CosyVoice TTS Generator (Alibaba Cloud API)")
    log(f"   Model:  {args.model}")
    log(f"   Voice:  {args.voice}")
    log(f"   Scope:  {args.scope}")
    log(f"   Output: {OUTPUT_ROOT}\n")

    # ── Pre-flight ──────────────────────────────────────────

    api_key = check_api_key()
    if not api_key:
        log("❌ DASHSCOPE_API_KEY environment variable not set.\n")
        log("   Setup steps:")
        log("   1. Register Alibaba Cloud Singapore: https://www.alibabacloud.com/")
        log("   2. Activate Model Studio + get API key (Singapore region!)")
        log("   3. In Terminal:")
        log('      export DASHSCOPE_API_KEY="sk-xxx"')
        log("   4. Re-run this script.\n")
        log("   Full guide: scripts/COSYVOICE_SETUP.md")
        return 1

    # Configure dashscope endpoint
    try:
        import dashscope
    except ImportError:
        log("❌ dashscope not installed. Run:")
        log("   uv pip install dashscope\n")
        return 1

    dashscope.api_key = api_key
    dashscope.base_http_api_url = SINGAPORE_HTTP_URL
    dashscope.base_websocket_api_url = SINGAPORE_WS_URL

    log(f"✅ API key loaded, endpoint: Singapore\n")

    # ── Build generation queue ──────────────────────────────

    queue: dict[str, str] = {}

    if args.scope in ("phonemes", "all"):
        queue.update(load_phonemes())

    if args.scope in ("hsk1", "all"):
        queue.update(load_hsk1_words())

    if args.sample:
        phonemes = load_phonemes()
        words = load_hsk1_words()
        combined = {**phonemes, **words}
        queue = {pid: combined[pid] for pid in SAMPLE_IDS if pid in combined}
        log(f"🎯 Sample mode: {len(queue)} items (~$0.01, <30s)\n")
    else:
        est_cost = len(queue) * 0.0003  # rough: $0.0003/request CosyVoice
        est_time = len(queue) * 1.5  # ~1.5s per API call average
        log(f"🎯 Full mode: {len(queue)} items "
            f"(~${est_cost:.2f}, ~{est_time/60:.1f} min)\n")

    # Prepare output dirs
    for sub in ("initials", "finals", "tones", "words"):
        (OUTPUT_ROOT / sub).mkdir(parents=True, exist_ok=True)

    # ── Generate ────────────────────────────────────────────

    manifest = []
    skipped = 0
    failed = 0
    for i, (pid, text) in enumerate(queue.items(), 1):
        display_text = text[:12] + ("…" if len(text) > 12 else "")
        log(f"[{i:3d}/{len(queue)}] {pid:18s} → {display_text:14s} ", end="")
        try:
            entry = generate_one(pid, text, args.voice, args.model, args.force)
            if entry.get("skipped"):
                log("⏭  skipped (exists)")
                skipped += 1
            else:
                log(f"✓ {human_size(entry['size_bytes'])}")
            manifest.append(entry)
        except Exception as e:
            log(f"✗ FAIL: {e}")
            failed += 1

    # ── Merge + write manifest ──────────────────────────────

    # When running partial scope (e.g. only --scope=hsk1), preserve entries
    # from the previous full run so we don't lose phonemes audio.
    existing_manifest = None
    manifest_path = OUTPUT_ROOT / "manifest.json"
    if not args.sample and manifest_path.exists() and args.scope != "all":
        try:
            with open(manifest_path, encoding="utf-8") as f:
                existing_manifest = json.load(f)
        except Exception:
            existing_manifest = None

    if not args.sample:
        from datetime import datetime
        entries: dict[str, dict[str, str]] = {}

        # Merge existing entries — auto-migrate legacy schemas so users
        # switching from Kokoro → CosyVoice don't lose old manifest data.
        if existing_manifest and "entries" in existing_manifest:
            for k, v in existing_manifest["entries"].items():
                if not isinstance(v, dict):
                    entries[k] = {"default": str(v)}
                elif "default" in v or "normal" in v or "slow" in v:
                    entries[k] = dict(v)
                elif "female" in v:
                    # Legacy Kokoro v0.3.0 schema
                    path = v.get("female") or v.get("male")
                    if path:
                        entries[k] = {"default": str(path)}
                else:
                    log(f"⚠️  Skipping unknown manifest entry: {k} = {v!r}")

        # Apply entries just generated (overwrites old with new)
        for entry in manifest:
            entries[entry["key"]] = {"default": entry["rel_path"]}

        manifest_out = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "generator": "cosyvoice",
            "voice": args.voice,
            "model": args.model,
            "total_files": len(entries),
            "entries": entries,
        }

        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_out, f, ensure_ascii=False, indent=2)
        log(f"\n📋 Manifest: {manifest_path} ({len(entries)} total entries)")

    # ── Summary ─────────────────────────────────────────────

    log("\n" + "=" * 60)
    log(f"✅ Done. Generated: {len(manifest) - skipped}, "
        f"Skipped: {skipped}, Failed: {failed}")

    if args.sample:
        log("\n🎧 Sample files ở public/audio/zh/. Mở folder và nghe.")
        log("   Nếu ưng voice → chạy `python scripts/gen_cosyvoice_mac.py --scope=all`")
        log("   Nếu không → xem voice list:")
        log("   https://www.alibabacloud.com/help/en/model-studio/voice-list")
        log("   (Chỉ dùng voice có cột 'cosyvoice-v3-flash' đánh dấu supported)")
    else:
        total_size = sum(e.get("size_bytes", 0) for e in manifest if not e.get("skipped"))
        log(f"📦 Total size this run: {human_size(total_size)}")
        log("\n🔜 Next: `npm run build` để bundle audio vào extension,")
        log("         rồi reload trong chrome://extensions")

    return 0


if __name__ == "__main__":
    sys.exit(main())
