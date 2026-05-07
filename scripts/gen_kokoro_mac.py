#!/usr/bin/env python3
"""
LinguaNewTab — Kokoro TTS audio generator (local Mac/Linux/Windows)

Sinh 64 file MP3 pinyin chuẩn (21 initials + 38 finals + 5 tones) dùng
Kokoro TTS voice `zf_xiaoxiao` (standard Mandarin, xác nhận bởi native
Chinese speaker trên HuggingFace).

Chạy 1 lần, bundle output vào extension. User không cần Python.

Usage:
    # Sample 10 files trước (để nghe voice test)
    python scripts/gen_kokoro_mac.py --sample

    # Full generate 64 phonemes
    python scripts/gen_kokoro_mac.py

    # Force overwrite existing files
    python scripts/gen_kokoro_mac.py --force

    # Voice khác (default: zf_xiaoxiao)
    python scripts/gen_kokoro_mac.py --voice zf_xiaoyi

Setup:
    # 1. Python 3.9+ (Mac có sẵn python3, check: python3 --version)
    # 2. Install uv (modern Python package installer)
    curl -LsSf https://astral.sh/uv/install.sh | sh

    # 3. Tạo venv + install deps
    cd lingua-newtab
    uv venv
    source .venv/bin/activate
    uv pip install kokoro-onnx soundfile numpy

    # 4. Download Kokoro model files (88MB + 26MB, one-time)
    cd scripts
    python gen_kokoro_mac.py --download-model
    cd ..

    # 5. Run generate
    python scripts/gen_kokoro_mac.py --sample   # preview 10 files
    python scripts/gen_kokoro_mac.py            # full 64

Output:
    public/audio/zh/initials/*.mp3     (21 files)
    public/audio/zh/finals/*.mp3       (38 files)
    public/audio/zh/tones/*.mp3        (5 files)
    public/audio/zh/manifest.json      (phoneme ID → path mapping)
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

# ————————————————————————————————————————————
# Constants
# ————————————————————————————————————————————

# Resolve paths relative to this script, not CWD — user có thể chạy từ bất kỳ đâu
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
PHONEMES_JSON = SCRIPT_DIR / "phonemes-source.json"
HSK1_TS = PROJECT_ROOT / "src" / "data" / "zh" / "hsk1.ts"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "audio" / "zh"

# Kokoro model files — download vào scripts/models/ để tách khỏi project
MODELS_DIR = SCRIPT_DIR / "models"
MODEL_ONNX = MODELS_DIR / "kokoro-v1.0.onnx"
VOICES_BIN = MODELS_DIR / "voices-v1.0.bin"

# int8 quantized = 88MB (vs 340MB f32), chất lượng gần ngang, load nhanh 3.5x
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

DEFAULT_VOICE = "zf_xiaoxiao"
SAMPLE_RATE = 24000

# 10 phonemes đại diện cho --sample (mix initial/final/tone để test toàn diện)
SAMPLE_IDS = [
    "zh_init_b", "zh_init_zh", "zh_init_r",
    "zh_fin_a", "zh_fin_ue", "zh_fin_iang",
    "zh_tone_1", "zh_tone_2", "zh_tone_3", "zh_tone_4",
]

# ————————————————————————————————————————————
# Helpers
# ————————————————————————————————————————————

def log(msg: str, end: str = "\n") -> None:
    """Flush-print so progress shows in real-time on Mac Terminal."""
    print(msg, end=end, flush=True)


def human_size(n_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if n_bytes < 1024:
            return f"{n_bytes:.1f}{unit}"
        n_bytes /= 1024
    return f"{n_bytes:.1f}TB"


def check_ffmpeg() -> bool:
    """ffmpeg cần có để convert WAV → MP3. Mac: `brew install ffmpeg`."""
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True,
        )
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def download_file(url: str, dest: Path) -> None:
    """Stream download with progress bar."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    log(f"  Downloading {dest.name} from {url}")

    def hook(block_num: int, block_size: int, total_size: int) -> None:
        if total_size > 0:
            pct = min(100, block_num * block_size * 100 // total_size)
            done = block_num * block_size
            bar = "█" * (pct // 2) + "░" * (50 - pct // 2)
            log(f"\r  [{bar}] {pct}% ({human_size(done)})", end="")

    urllib.request.urlretrieve(url, dest, hook)
    log("")  # newline after progress bar


def download_models() -> None:
    """Download Kokoro model + voices (one-time, ~114MB total)."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    if MODEL_ONNX.exists() and VOICES_BIN.exists():
        log(f"✅ Models already downloaded at {MODELS_DIR}")
        return

    log("📥 Downloading Kokoro model files (~114MB, one-time)...")
    if not MODEL_ONNX.exists():
        download_file(MODEL_URL, MODEL_ONNX)
    if not VOICES_BIN.exists():
        download_file(VOICES_URL, VOICES_BIN)
    log("✅ Download complete\n")


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

    Uses regex on TS source (lightweight, no Node.js needed). We only care about
    the `id` and `term` fields to generate audio.
    """
    if not HSK1_TS.exists():
        log(f"❌ {HSK1_TS} not found")
        sys.exit(1)

    content = HSK1_TS.read_text(encoding="utf-8")

    # Match each word entry — find id and term fields.
    # Pattern handles both single and double quotes.
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


def wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    """Convert WAV → MP3 via ffmpeg. 64kbps mono = smallest file + full quality for speech."""
    subprocess.run(
        [
            "ffmpeg", "-y",              # overwrite
            "-loglevel", "error",        # suppress verbose output
            "-i", str(wav_path),
            "-codec:a", "libmp3lame",
            "-b:a", "64k",               # 64kbps mono — good for speech, ~5KB/sec
            "-ac", "1",                  # force mono
            str(mp3_path),
        ],
        check=True,
    )
    wav_path.unlink()  # remove temp WAV


# ————————————————————————————————————————————
# Main generation logic
# ————————————————————————————————————————————

def generate_phoneme(kokoro, pid: str, syllable: str, voice: str, force: bool) -> dict | None:
    """
    Generate 1 phoneme MP3. Returns manifest entry dict or None if skipped.

    Returns schema compatible with src/services/audioService.ts:
      { "key": "initials/zh_init_b", "rel_path": "initials/zh_init_b.mp3", ... }
    """
    subdir = phoneme_subdir(pid)
    # File name = phoneme ID as-is for clean lookup (zh_init_b.mp3)
    # Matches audioService.resolveManifestKey() which expects <subdir>/<id> keys
    stem = pid

    mp3_path = OUTPUT_ROOT / subdir / f"{stem}.mp3"

    if mp3_path.exists() and not force:
        return {
            "id": pid,
            "key": f"{subdir}/{pid}",
            "rel_path": f"{subdir}/{stem}.mp3",
            "syllable": syllable,
            "skipped": True,
        }

    # Kokoro generate — slow speed (0.85x) cho học viên nghe rõ phonemes
    # Append period 。 to syllable so Kokoro treats it as complete sentence.
    # Without sentence-ending punctuation, Kokoro often flattens tone 3 and
    # misreads neutral tone. This is the key fix for "tone bị sai" issue.
    # generate() is a sync generator yielding (audio, sample_rate)
    tts_input = syllable if syllable.endswith(('。', '.', '!', '?', '？', '！')) else syllable + '。'
    gen = kokoro.create(tts_input, voice=voice, speed=0.85, lang="cmn")
    # API returns (samples: np.ndarray, sample_rate: int)
    samples, sr = gen

    # Save WAV temp (soundfile needs wav/flac, not mp3)
    import soundfile as sf
    wav_tmp = mp3_path.with_suffix(".wav")
    sf.write(str(wav_tmp), samples, sr)

    # Convert to MP3
    wav_to_mp3(wav_tmp, mp3_path)

    size = mp3_path.stat().st_size
    return {
        "id": pid,
        "key": f"{subdir}/{pid}",
        "rel_path": f"{subdir}/{stem}.mp3",
        "syllable": syllable,
        "size_bytes": size,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate Kokoro TTS pinyin audio for LinguaNewTab",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--scope",
        choices=["phonemes", "hsk1", "all"],
        default="phonemes",
        help="Dataset to generate: phonemes (64 phonemes), hsk1 (150 words), or all",
    )
    parser.add_argument("--sample", action="store_true", help="Chỉ generate 10 file test")
    parser.add_argument("--force", action="store_true", help="Overwrite files đã tồn tại")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"Voice ID (default: {DEFAULT_VOICE})")
    parser.add_argument("--download-model", action="store_true", help="Chỉ download model, không generate")
    args = parser.parse_args()

    log("🎙️  LinguaNewTab — Kokoro TTS Audio Generator")
    log(f"   Scope: {args.scope}")
    log(f"   Voice: {args.voice}")
    log(f"   Output: {OUTPUT_ROOT}\n")

    # Check ffmpeg
    if not check_ffmpeg():
        log("❌ ffmpeg not found. Install:")
        log("   Mac:     brew install ffmpeg")
        log("   Linux:   sudo apt install ffmpeg")
        log("   Windows: https://ffmpeg.org/download.html\n")
        return 1

    # Download models if needed
    download_models()
    if args.download_model:
        return 0

    # Load Kokoro
    log("🔧 Loading Kokoro model...")
    try:
        from kokoro_onnx import Kokoro
    except ImportError:
        log("❌ kokoro-onnx not installed. Run:")
        log("   uv pip install kokoro-onnx soundfile numpy\n")
        return 1

    kokoro = Kokoro(str(MODEL_ONNX), str(VOICES_BIN))
    log("✅ Kokoro ready\n")

    # Build the generation queue based on scope
    queue: dict[str, str] = {}  # id → text to synthesize

    if args.scope in ("phonemes", "all"):
        queue.update(load_phonemes())

    if args.scope in ("hsk1", "all"):
        queue.update(load_hsk1_words())

    # Sample mode overrides scope — always 10 phonemes
    if args.sample:
        phonemes = load_phonemes()
        queue = {pid: phonemes[pid] for pid in SAMPLE_IDS if pid in phonemes}
        log(f"🎯 Sample mode: generating {len(queue)} phonemes\n")
    else:
        log(f"🎯 Full mode: generating {len(queue)} items (scope={args.scope})\n")

    # Prepare output dirs
    for sub in ("initials", "finals", "tones", "words"):
        (OUTPUT_ROOT / sub).mkdir(parents=True, exist_ok=True)

    # Generate
    manifest = []
    skipped = 0
    failed = 0
    for i, (pid, text) in enumerate(queue.items(), 1):
        # Truncate long Chinese words in log so the progress line stays aligned
        display_text = text[:12] + ("…" if len(text) > 12 else "")
        log(f"[{i:3d}/{len(queue)}] {pid:18s} → {display_text:14s} ", end="")
        try:
            entry = generate_phoneme(kokoro, pid, text, args.voice, args.force)
            if entry.get("skipped"):
                log("⏭  skipped (exists)")
                skipped += 1
            else:
                log(f"✓ {human_size(entry['size_bytes'])}")
            manifest.append(entry)
        except Exception as e:
            log(f"✗ FAIL: {e}")
            failed += 1

    # Merge with existing manifest if partial scope — don't clobber previously generated audio
    existing_manifest = None
    manifest_path = OUTPUT_ROOT / "manifest.json"
    if not args.sample and manifest_path.exists() and args.scope != "all":
        try:
            with open(manifest_path, encoding="utf-8") as f:
                existing_manifest = json.load(f)
        except Exception:
            existing_manifest = None

    # Write manifest in audioService-compatible schema (only in full mode)
    if not args.sample:
        # Schema (must match src/services/audioService.ts AudioManifest):
        #   {
        #     "generated_at": ISO8601,
        #     "generator":    "kokoro",
        #     "voice":        "zf_xiaoxiao",
        #     "total_files":  N,
        #     "entries": {
        #       "words/zh_001":    { "default": "words/zh_001.mp3" },
        #       "initials/zh_init_b": { "default": "initials/zh_init_b.mp3" }
        #     }
        #   }
        # "default" means this file is used for every speed (playbackRate is
        # adjusted client-side when user requests slow). When true normal+slow
        # variants get generated later, add them as "normal"/"slow" keys and the
        # client will prefer them over "default".
        from datetime import datetime
        entries: dict[str, dict[str, str]] = {}

        # Start with existing entries (if merging partial scopes).
        # Auto-migrate legacy schemas from older script versions:
        #   v0.3.0: { "female": "path" }        → { "default": "path" }
        #   v0.5.0: { "default": "path" }       — current
        if existing_manifest and "entries" in existing_manifest:
            for k, v in existing_manifest["entries"].items():
                if not isinstance(v, dict):
                    # Ancient: entry was a bare string
                    entries[k] = {"default": str(v)}
                elif "default" in v or "normal" in v or "slow" in v:
                    # Already on current schema — keep as-is
                    entries[k] = dict(v)
                elif "female" in v:
                    # Legacy {female}/{male} schema → promote first path to default
                    path = v.get("female") or v.get("male")
                    if path:
                        entries[k] = {"default": str(path)}
                else:
                    # Unknown shape — skip rather than crash
                    log(f"⚠️  Skipping unknown manifest entry: {k} = {v!r}")

        # Overwrite/add the ones we just generated
        for entry in manifest:
            entries[entry["key"]] = {"default": entry["rel_path"]}

        manifest_out = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "generator": "kokoro",
            "voice": args.voice,
            "total_files": len(entries),
            "entries": entries,
        }

        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_out, f, ensure_ascii=False, indent=2)
        log(f"\n📋 Manifest: {manifest_path} ({len(entries)} total entries)")

    # Summary
    log("\n" + "=" * 60)
    log(f"✅ Done. Generated: {len(manifest) - skipped}, Skipped: {skipped}, Failed: {failed}")
    if args.sample:
        log("\n🎧 Sample files ở public/audio/zh/. Mở folder đó và nghe.")
        log("   Nếu ưng voice → chạy `python scripts/gen_kokoro_mac.py` (không --sample)")
    else:
        total_size = sum(e.get("size_bytes", 0) for e in manifest if not e.get("skipped"))
        log(f"📦 Total size this run: {human_size(total_size)}")
        if args.scope == "phonemes":
            log("\n🔜 Next: `python scripts/gen_kokoro_mac.py --scope=hsk1` để sinh audio cho 150 HSK1 words")
        elif args.scope == "hsk1":
            log("\n🔜 Next: `npm run build` để bundle audio vào extension")
    return 0


if __name__ == "__main__":
    sys.exit(main())
