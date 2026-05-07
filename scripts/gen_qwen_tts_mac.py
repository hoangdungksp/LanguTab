#!/usr/bin/env python3
"""
LinguaNewTab — Qwen-TTS audio generator (Alibaba Cloud, Singapore region)

Sinh file MP3 cho pinyin phonemes + HSK1 words + HSK1 example sentences qua
**Alibaba Qwen-TTS** (model qwen3-tts-flash, released 2026-01-22) — engine TTS
mới nhất của Alibaba, HTTP API ổn định, giọng native Mandarin chất lượng cao.

Why Qwen-TTS thay cho Kokoro/CosyVoice:
    - HTTP API đơn giản (MultiModalConversation) — không timeout như WebSocket
    - Activate tự động cùng Model Studio (không cần enable service riêng)
    - 10 ngôn ngữ + dialects tiếng Trung (Bắc Kinh, Thượng Hải, Tứ Xuyên...)
    - Chất lượng SOTA — released 01/2026
    - Giọng Cherry/Chelsie/Serena... phát âm pinyin rõ ràng

⚠️ IMPORTANT — Input strategy (pinyin vs hanzi):

    A) WORD TERMS (short 1-3 char hanzi) → feed PINYIN with tone marks
       Reason: isolated short hanzi makes Qwen-TTS emit truncated audio
       (~288ms for '你们' → barely "n" sound). Pinyin with explicit tone
       marks gives reliable full-length audio.

       Test results (word 你们):
         text='你们'              → 720ms BUT content wrong (only "n")
         text='nǐmen'             → 560ms ✓ reads "nǐmen" correctly
         text='你们。'             → 640ms, period helps slightly
         text='这个词读作：你们。' → 1.68s, reads correctly but needs trim

    B) SENTENCES (5+ char hanzi with punctuation) → feed HANZI directly
       Reason: sentences are naturally long enough that the short-hanzi
       truncate bug does NOT apply. Hanzi reads more naturally than pinyin
       for full sentences (correct prosody, natural pauses at punctuation).
       Example: '我是学生。' → ~1.5s clean audio via hanzi input.

    Umlaut exception (applies to A only):
       If pinyin contains ü-family (ǖǘǚǜü), fall back to hanzi. U+01DA
       etc. are poorly represented in training data and cause tone errors.

Usage:
    # Preview 10 file
    python scripts/gen_qwen_tts_mac.py --sample

    # Full generate (phonemes + words + sentences)
    python scripts/gen_qwen_tts_mac.py --scope=all

    # Options
    python scripts/gen_qwen_tts_mac.py --scope=phonemes    # chỉ 64 phonemes
    python scripts/gen_qwen_tts_mac.py --scope=words       # chỉ 150 HSK1 words
    python scripts/gen_qwen_tts_mac.py --scope=sentences   # chỉ 150 câu ví dụ
    python scripts/gen_qwen_tts_mac.py --voice Chelsie     # voice khác
    python scripts/gen_qwen_tts_mac.py --force             # overwrite

Setup:
    export DASHSCOPE_API_KEY="sk-xxx"
    source .venv/bin/activate
    uv pip install dashscope requests pypinyin

Output:
    public/audio/zh/initials/*.mp3     (21 files)
    public/audio/zh/finals/*.mp3       (38 files)
    public/audio/zh/tones/*.mp3        (5 files)
    public/audio/zh/words/*.mp3        (150 files, HSK1 terms)
    public/audio/zh/sentences/*.mp3    (150 files, HSK1 examples)
    public/audio/zh/manifest.json      (ID → path mapping)

Voices (Singapore region):
    Cherry    — nữ trẻ tươi sáng (DEFAULT, khuyến nghị)
    Chelsie   — nữ trưởng thành chuyên nghiệp
    Serena    — nữ điềm đạm
    Vivian    — nữ năng động
    Ethan     — nam trưởng thành
    Ryan      — nam trầm ấm

Cost ước tính:
    ~$0.0002/Chinese char × ~2700 chars (phonemes+words+sentences)
    = ~$0.54/lần full generate. Alibaba tặng $50 free credit khi register.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# ————————————————————————————————————————————
# Paths & constants
# ————————————————————————————————————————————

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_ROOT = PROJECT_ROOT / "public" / "audio" / "zh"
PHONEMES_JSON = SCRIPT_DIR / "phonemes-source.json"
HSK1_TS = PROJECT_ROOT / "src" / "data" / "zh" / "hsk1.ts"

DEFAULT_VOICE = "Cherry"
DEFAULT_MODEL = "qwen3-tts-flash"

SINGAPORE_HTTP_URL = "https://dashscope-intl.aliyuncs.com/api/v1"

# Sample IDs for --sample mode. Mix of each folder so Jason can sanity-check
# voice consistency across word terms AND example sentences. Includes zh_028
# (零 líng) — the specific short-syllable word that exposed the hallucination
# bug that drove the v0.5.9 word-style change.
SAMPLE_IDS = [
    ("initials", "zh_init_b"),
    ("initials", "zh_init_zh"),
    ("finals", "zh_fin_a"),
    ("tones", "zh_tone_3"),
    ("words", "zh_001"),   # 我 wǒ
    ("words", "zh_010"),   # 妈妈 māma
    ("words", "zh_028"),   # 零 líng — the reported bug case
    ("sentences", "zh_001"),
    ("sentences", "zh_010"),
    ("sentences", "zh_028"),
]

# Queue item type: (subdir, pid, text)
QueueItem = tuple[str, str, str]


# ————————————————————————————————————————————
# Logging helpers
# ————————————————————————————————————————————

def log(msg: str, end: str = "\n") -> None:
    print(msg, end=end, flush=True)


def human_size(n_bytes: int) -> str:
    n = float(n_bytes)
    for unit in ("B", "KB", "MB"):
        if n < 1024:
            return f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}GB"


# ————————————————————————————————————————————
# Pre-flight checks
# ————————————————————————————————————————————

def check_ffmpeg() -> bool:
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def check_api_key() -> str | None:
    api_key = os.getenv("DASHSCOPE_API_KEY", "").strip()
    if not api_key:
        return None
    if not api_key.startswith("sk-"):
        log(f"⚠️  API key không bắt đầu bằng 'sk-'. Có thể sai format.")
    return api_key


# ————————————————————————————————————————————
# Data loaders — each returns list[(subdir, pid, text)]
# ————————————————————————————————————————————

def load_phonemes() -> list[QueueItem]:
    """
    Load phonemes-source.json → list of (subdir, id, tts_text).

    We feed PINYIN (with tone marks) to Qwen-TTS instead of bare hanzi because
    isolated hanzi like '你们' can confuse the model → short/cut audio. Pinyin
    with tone marks (nǐmen, bō, mā) reads reliably.

    Umlaut exception:
      If pypinyin output contains ü-family (ǖǘǚǜü), fall back to the original
      hanzi. These codepoints cause Qwen-TTS tone errors. Hanzi goes through
      Qwen's internal romanizer which handles ü properly via j/q/x/y rule.

    Uses pypinyin to auto-convert `syllable` hanzi → pinyin. Install:
      uv pip install pypinyin
    """
    if not PHONEMES_JSON.exists():
        log(f"❌ {PHONEMES_JSON} not found")
        sys.exit(1)

    try:
        from pypinyin import pinyin, Style
    except ImportError:
        log("❌ pypinyin not installed. Run: uv pip install pypinyin")
        sys.exit(1)

    with open(PHONEMES_JSON, encoding="utf-8") as f:
        data = json.load(f)

    umlaut_chars = set("üǖǘǚǜ")

    items: list[QueueItem] = []
    for category, subdir in [("initials", "initials"), ("finals", "finals"), ("tones", "tones")]:
        for item in data.get(category, []):
            hanzi = item["syllable"]
            py_list = pinyin(hanzi, style=Style.TONE, heteronym=False)
            pinyin_str = "".join(x[0] for x in py_list)

            # Umlaut fallback: use hanzi if pinyin contains ü-family codepoints
            if any(c in umlaut_chars for c in pinyin_str):
                text = hanzi
            else:
                text = pinyin_str
            items.append((subdir, item["id"], text))
    return items


def load_hsk1_words(style: str = "hybrid") -> list[QueueItem]:
    """
    Parse src/data/zh/hsk1.ts → list of ('words', pid, tts_text).

    Input strategy (why not raw pinyin anymore):
    ─────────────────────────────────────────────
    Bare pinyin like 'líng' (4 chars) was causing Qwen-TTS to HALLUCINATE
    surrounding context — the model receives a short isolated syllable, decides
    it's a fragment of some longer phrase, and generates gibberish around it
    ("yí yu líng líng ờ tú khờ đại..."). Bare short hanzi like '零' has the
    opposite failure mode (truncation to ~200ms). Neither reliably produces a
    clean one-syllable reading.

    The `hybrid` strategy (default, v0.5.9+) feeds BOTH hanzi and pinyin with
    a Chinese comma + period:
        '零，líng。'       → model reads "líng, líng." (~1s)
        '你们，nǐmen。'    → model reads "nǐmen, nǐmen." (~1.2s)

    Why this works:
        1. Hanzi anchors the model to the exact character — no guessing which
           word this is, no hallucinating nearby syllables.
        2. The pinyin after the comma acts as repetition, reinforcing the
           pronunciation for the learner — hearing the syllable twice is
           a documented benefit for SRS flashcard learning.
        3. The Chinese period forces a clean end-of-utterance, so the model
           stops instead of continuing to generate.

    Alternate styles (for debugging / A/B):
        pinyin         — legacy: pinyin only (buggy for short syllables)
        hanzi-period   — just hanzi + Chinese period (can still truncate)
        repeat-pinyin  — 'líng，líng。' (no hanzi anchor, riskier)
        hybrid         — 'hanzi，pinyin。' (DEFAULT, most robust)

    Umlaut fallback:
        Pinyin with ü-family (ǖǘǚǜü) unreliable at Qwen level → fall back to
        hanzi-only variant. Affects words like 女儿 (nǚ'ér), 去 (qù) rare.
    """
    if not HSK1_TS.exists():
        log(f"❌ {HSK1_TS} not found")
        sys.exit(1)

    content = HSK1_TS.read_text(encoding="utf-8")
    pattern = re.compile(
        r"\{\s*id:\s*['\"](zh_\d+)['\"]\s*,"
        r".*?term:\s*['\"]([^'\"]+)['\"]\s*,"
        r".*?phonetic:\s*['\"]([^'\"]+)['\"]",
        re.DOTALL,
    )

    umlaut_chars = set("üǖǘǚǜ")

    items: list[QueueItem] = []
    for match in pattern.finditer(content):
        word_id, term, phonetic = match.group(1), match.group(2), match.group(3)
        # Escape sequences like `nǚ\\'ér` in TS → clean up to `nǚ'ér`
        phonetic = phonetic.replace("\\'", "'").replace("\\\\", "\\")
        has_umlaut = any(c in umlaut_chars for c in phonetic)

        text = build_word_text(term, phonetic, style, has_umlaut)
        items.append(("words", word_id, text))

    if not items:
        log(f"❌ No words parsed from {HSK1_TS}")
        sys.exit(1)

    return items


def build_word_text(hanzi: str, pinyin: str, style: str, has_umlaut: bool) -> str:
    """Produce the input text fed to Qwen-TTS for a single word term."""
    if style == "pinyin":
        # Legacy v0.5.8 and earlier — buggy for short syllables (hallucinates).
        return hanzi if has_umlaut else pinyin

    if style == "hanzi-period":
        return f"{hanzi}。"

    if style == "repeat-pinyin":
        if has_umlaut:
            return f"{hanzi}，{hanzi}。"
        return f"{pinyin}，{pinyin}。"

    # Default: hybrid — hanzi for semantic anchor, pinyin for reinforcement.
    if has_umlaut:
        return f"{hanzi}，{hanzi}。"
    return f"{hanzi}，{pinyin}。"

    return items


def load_hsk1_sentences() -> list[QueueItem]:
    """
    Parse src/data/zh/hsk1.ts → list of ('sentences', pid, hanzi_sentence).

    For sentences we feed HANZI directly (not pinyin):
      - Sentences are 5+ chars with punctuation — no truncate bug like short
        hanzi words have.
      - Hanzi gives natural prosody; Qwen-TTS handles tones correctly from
        context and pauses at Chinese punctuation (。？！，).
      - Pinyin of a full sentence loses semantic information that helps the
        model pick the right tone for heteronyms (e.g. 得 déi vs de).
      - No umlaut fallback needed — any ü-family chars in the sentence are
        surrounded by context that lets the Qwen romanizer resolve correctly.

    Skip entries whose `example` field is empty or missing.
    """
    if not HSK1_TS.exists():
        log(f"❌ {HSK1_TS} not found")
        sys.exit(1)

    content = HSK1_TS.read_text(encoding="utf-8")
    # Capture id + example sentence. Example field is optional in the schema
    # but every HSK1 entry ships with one — we log a warning if any is missing
    # so Jason can spot-fix data gaps.
    pattern = re.compile(
        r"\{\s*id:\s*['\"](zh_\d+)['\"]\s*,"
        r".*?example:\s*['\"]([^'\"]+)['\"]",
        re.DOTALL,
    )

    items: list[QueueItem] = []
    for match in pattern.finditer(content):
        pid, example = match.group(1), match.group(2)
        example = example.replace("\\'", "'").replace("\\\\", "\\").strip()
        if not example:
            log(f"⚠️  {pid}: empty example — skipping sentence audio")
            continue
        items.append(("sentences", pid, example))

    if not items:
        log(f"❌ No example sentences parsed from {HSK1_TS}")
        sys.exit(1)

    return items


# ————————————————————————————————————————————
# Audio conversion
# ————————————————————————————————————————————

def wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    """WAV → MP3 64kbps mono. Qwen-TTS returns 48kHz stereo WAV ~100KB/phoneme;
    after conversion ~3-5KB each (~20KB for sentences). Essential for keeping
    extension bundle small."""
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-loglevel", "error",
            "-i", str(wav_path),
            "-codec:a", "libmp3lame",
            "-b:a", "64k",
            "-ac", "1",  # force mono
            str(mp3_path),
        ],
        check=True,
    )
    wav_path.unlink()


# ————————————————————————————————————————————
# Qwen-TTS generation
# ————————————————————————————————————————————

def generate_one(
    subdir: str,
    pid: str,
    text: str,
    voice: str,
    model: str,
    force: bool,
) -> dict:
    """
    Generate 1 audio file via Qwen-TTS HTTP API.

    Flow:
        1. MultiModalConversation.call() → response.output.audio.url (OSS presigned)
        2. HTTP GET audio URL → WAV bytes
        3. ffmpeg convert WAV → MP3 (64kbps mono)
        4. Return manifest entry

    Returns schema compatible with src/services/audioService.ts:
      { "key": "initials/zh_init_b", "rel_path": "initials/zh_init_b.mp3", ... }
    """
    import requests
    from dashscope import MultiModalConversation

    mp3_path = OUTPUT_ROOT / subdir / f"{pid}.mp3"

    if mp3_path.exists() and not force:
        return {
            "subdir": subdir,
            "id": pid,
            "key": f"{subdir}/{pid}",
            "rel_path": f"{subdir}/{pid}.mp3",
            "text": text,
            "skipped": True,
        }

    # language_type="Chinese" → ensures Mandarin pronunciation with proper tones,
    # even for isolated pinyin syllables like "b" or "zh".
    response = MultiModalConversation.call(
        model=model,
        api_key=os.getenv("DASHSCOPE_API_KEY"),
        text=text,
        voice=voice,
        language_type="Chinese",
        stream=False,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"API error: status={response.status_code}, "
            f"code={getattr(response, 'code', '?')}, "
            f"message={getattr(response, 'message', '?')}"
        )

    try:
        audio_url = response.output.audio.url
    except AttributeError:
        raise RuntimeError(f"No audio URL in response: {response}")

    # Download WAV from Alibaba OSS (presigned URL, expires ~24h)
    r = requests.get(audio_url, timeout=30)
    r.raise_for_status()

    # Save temp WAV → convert to MP3
    wav_tmp = mp3_path.with_suffix(".wav")
    wav_tmp.write_bytes(r.content)
    wav_to_mp3(wav_tmp, mp3_path)

    size = mp3_path.stat().st_size
    return {
        "subdir": subdir,
        "id": pid,
        "key": f"{subdir}/{pid}",
        "rel_path": f"{subdir}/{pid}.mp3",
        "text": text,
        "size_bytes": size,
    }


# ————————————————————————————————————————————
# Main
# ————————————————————————————————————————————

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate Qwen-TTS audio for LinguaNewTab (Alibaba Cloud API)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--scope",
        choices=["phonemes", "words", "sentences", "hsk1", "all"],
        default="all",
        help=(
            "Dataset: phonemes (64), words (150 HSK1 terms), "
            "sentences (150 HSK1 examples), or all (default, 364 total). "
            "`hsk1` is a deprecated alias for `words` kept for backward compat."
        ),
    )
    parser.add_argument("--sample", action="store_true",
                        help="Generate 10 file preview (mix of phonemes, words, sentences)")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite existing files")
    parser.add_argument("--voice", default=DEFAULT_VOICE,
                        help=f"Voice (default: {DEFAULT_VOICE})")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Model (default: {DEFAULT_MODEL})")
    parser.add_argument(
        "--word-style",
        choices=["pinyin", "hanzi-period", "repeat-pinyin", "hybrid"],
        default="hybrid",
        help=(
            "Input strategy for word terms. `hybrid` (default, v0.5.9+) feeds "
            "'hanzi，pinyin。' to avoid Qwen-TTS hallucinating context around "
            "short syllables. See build_word_text() docstring for other options."
        ),
    )
    args = parser.parse_args()

    # Back-compat: old `--scope=hsk1` meant word terms only.
    scope = "words" if args.scope == "hsk1" else args.scope

    log("🎙️  LinguaNewTab — Qwen-TTS Generator (Alibaba Cloud API)")
    log(f"   Model:      {args.model}")
    log(f"   Voice:      {args.voice}")
    log(f"   Scope:      {scope}")
    log(f"   Word style: {args.word_style}")
    log(f"   Output:     {OUTPUT_ROOT}\n")

    # ── Pre-flight ──

    if not check_ffmpeg():
        log("❌ ffmpeg not found. Install: brew install ffmpeg")
        return 1

    api_key = check_api_key()
    if not api_key:
        log("❌ DASHSCOPE_API_KEY environment variable not set.")
        log('   Run: export DASHSCOPE_API_KEY="sk-xxx"')
        return 1

    try:
        import dashscope
    except ImportError:
        log("❌ dashscope not installed. Run: uv pip install dashscope requests")
        return 1

    dashscope.api_key = api_key
    dashscope.base_http_api_url = SINGAPORE_HTTP_URL

    log(f"✅ API key loaded, endpoint: Singapore\n")

    # ── Build queue ──

    queue: list[QueueItem] = []

    if scope in ("phonemes", "all"):
        queue.extend(load_phonemes())

    if scope in ("words", "all"):
        queue.extend(load_hsk1_words(style=args.word_style))

    if scope in ("sentences", "all"):
        queue.extend(load_hsk1_sentences())

    if args.sample:
        # Build a pool of ALL possible items (regardless of scope), then filter
        # by SAMPLE_IDS so the sample always shows a representative mix.
        pool: dict[tuple[str, str], QueueItem] = {}
        for item in load_phonemes() + load_hsk1_words(style=args.word_style) + load_hsk1_sentences():
            sub, pid, _ = item
            pool[(sub, pid)] = item
        queue = [pool[key] for key in SAMPLE_IDS if key in pool]
        log(f"🎯 Sample mode: {len(queue)} items (phonemes + words + sentences)\n")
    else:
        # Rough character count estimate for cost preview
        total_chars = sum(len(t) for _, _, t in queue)
        est_cost = total_chars * 0.0002 * 2  # Chinese chars count 2x
        est_time = len(queue) * 1.2
        log(f"🎯 {scope} mode: {len(queue)} items, ~{total_chars} chars "
            f"(~${est_cost:.2f}, ~{est_time/60:.1f} min)\n")

    for sub in ("initials", "finals", "tones", "words", "sentences"):
        (OUTPUT_ROOT / sub).mkdir(parents=True, exist_ok=True)

    # ── Generate ──

    manifest: list[dict] = []
    skipped = 0
    failed = 0
    for i, (subdir, pid, text) in enumerate(queue, 1):
        display_text = text[:12] + ("…" if len(text) > 12 else "")
        log(f"[{i:3d}/{len(queue)}] {subdir:9s}/{pid:8s} → {display_text:14s} ", end="")
        try:
            entry = generate_one(subdir, pid, text, args.voice, args.model, args.force)
            if entry.get("skipped"):
                log("⏭  skipped (exists)")
                skipped += 1
            else:
                log(f"✓ {human_size(entry['size_bytes'])}")
            manifest.append(entry)
        except Exception as e:
            log(f"✗ FAIL: {e}")
            failed += 1

    # ── Merge + write manifest ──

    # Preserve entries from previous runs when using partial scope.
    # We always merge even on --scope=all because a user running `all` after
    # previously running `phonemes` should keep phoneme entries untouched if
    # they're already present (force re-generation only updates changed files).
    existing_manifest = None
    manifest_path = OUTPUT_ROOT / "manifest.json"
    if not args.sample and manifest_path.exists():
        try:
            with open(manifest_path, encoding="utf-8") as f:
                existing_manifest = json.load(f)
        except Exception:
            existing_manifest = None

    if not args.sample:
        from datetime import datetime
        entries: dict[str, dict[str, str]] = {}

        # Migrate legacy schemas from Kokoro / CosyVoice runs
        if existing_manifest and "entries" in existing_manifest:
            for k, v in existing_manifest["entries"].items():
                if not isinstance(v, dict):
                    entries[k] = {"default": str(v)}
                elif "default" in v or "normal" in v or "slow" in v:
                    entries[k] = dict(v)
                elif "female" in v:
                    # Ancient Kokoro v0.3.0 schema
                    path = v.get("female") or v.get("male")
                    if path:
                        entries[k] = {"default": str(path)}
                else:
                    log(f"⚠️  Skipping unknown manifest entry: {k} = {v!r}")

        # Apply new entries (overwrites)
        for entry in manifest:
            entries[entry["key"]] = {"default": entry["rel_path"]}

        manifest_out = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "generator": "qwen-tts",
            "voice": args.voice,
            "model": args.model,
            "total_files": len(entries),
            "entries": entries,
        }

        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_out, f, ensure_ascii=False, indent=2)
        log(f"\n📋 Manifest: {manifest_path} ({len(entries)} total entries)")

    # ── Summary ──

    log("\n" + "=" * 60)
    log(f"✅ Done. Generated: {len(manifest) - skipped}, "
        f"Skipped: {skipped}, Failed: {failed}")

    if args.sample:
        log("\n🎧 Sample files ở public/audio/zh/. Mở folder và nghe.")
        log("   Ưng → chạy: python scripts/gen_qwen_tts_mac.py --scope=all")
        log("   Không → thử voice khác: --voice Chelsie / Serena / Vivian")
    else:
        total_size = sum(e.get("size_bytes", 0) for e in manifest if not e.get("skipped"))
        log(f"📦 Total size this run: {human_size(total_size)}")
        log("\n🔜 Next: `npm run build` → reload extension ở chrome://extensions")

    return 0


if __name__ == "__main__":
    sys.exit(main())
