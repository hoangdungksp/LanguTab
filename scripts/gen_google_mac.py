#!/usr/bin/env python3
"""
LinguaNewTab — Google Cloud TTS audio generator (Chirp 3 HD)

Generate audio for words + example sentences from HSK1 (Chinese) and
Oxford 500 (English) using Chirp 3 HD voices. Each item is generated
at 2 speeds: normal (1.0x) and slow (0.7x) for the "🔊 Nghe" vs
"🐢 Chậm" buttons.

**Skip phonemes by design** — Chirp 3 HD renders tone 3 flat on isolated
syllables (confirmed via A/B test). Phonemes should use a different
engine (WaveNet with SSML phoneme tags) if needed later.

Output layout:
    public/audio/zh/
        words/zh_001_normal.mp3, zh_001_slow.mp3, ...
        sentences/zh_001_normal.mp3, zh_001_slow.mp3, ...
        manifest.json
    public/audio/en/
        words/en_001_normal.mp3, ...
        sentences/en_001_normal.mp3, ...
        manifest.json

Usage:
    export GOOGLE_APPLICATION_CREDENTIALS="path/to/google-tts-key.json"

    # Generate a few samples for sanity check
    python scripts/gen_google_mac.py --sample

    # Full generate — both languages, both scopes
    python scripts/gen_google_mac.py --lang=all --scope=all

    # Granular
    python scripts/gen_google_mac.py --lang=zh  --scope=words
    python scripts/gen_google_mac.py --lang=zh  --scope=sentences
    python scripts/gen_google_mac.py --lang=en  --scope=words
    python scripts/gen_google_mac.py --lang=en  --scope=sentences

    # Alt voice
    python scripts/gen_google_mac.py --lang=zh --voice=Leda --force

Cost estimate (Chirp 3 HD, free tier 1M chars/month):
    HSK1: 150 words × ~2 chars + 150 sentences × ~8 chars = ~1,500 chars
    Oxford: 500 words × ~5 chars + 500 sentences × ~20 chars = ~12,500 chars
    Dual speed ×2 = 28,000 chars total → miễn phí forever
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

# ————————————————————————————————————————————
# Constants
# ————————————————————————————————————————————

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "audio"

# Default voices per locale (female flagship)
DEFAULT_VOICES = {
    "zh": ("cmn-CN", "Kore"),
    "en": ("en-US", "Leda"),
}

# Dual-speed output
SPEEDS = {
    "normal": 1.0,
    "slow": 0.7,
}

# Sample mode: N items per (lang, scope)
SAMPLE_COUNT = 5


# ————————————————————————————————————————————
# Helpers
# ————————————————————————————————————————————

def log(msg: str, end: str = "\n") -> None:
    print(msg, end=end, flush=True)


def human_size(n_bytes: int) -> str:
    size = float(n_bytes)
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f}{unit}"
        size /= 1024
    return f"{size:.1f}TB"


# ————————————————————————————————————————————
# Data loading — parse TypeScript data files
# ————————————————————————————————————————————

def parse_words_ts(ts_path: Path, lang_prefix: str) -> list[dict]:
    """
    Parse src/data/{zh/hsk1.ts,en/oxford500.ts} → list of {id, term, example}.

    Handles the inline-object format:
        { id: 'zh_001', ..., term: '你好', ..., example: '你好吗？', ... },
    """
    if not ts_path.exists():
        log(f"❌ {ts_path} not found")
        return []

    content = ts_path.read_text(encoding="utf-8")

    # Parse each `{ ... }` entry line by line.
    # Each word/phoneme is defined on its own line like:
    #   { id: 'zh_001', lang: 'zh', term: '我', ..., example: '我是学生。', ... }
    id_re = re.compile(r"id:\s*['\"](" + re.escape(lang_prefix) + r"_\d+)['\"]")
    term_re = re.compile(r"term:\s*['\"]([^'\"]+)['\"]")
    # Example may contain escaped apostrophes like \'
    example_re = re.compile(r"example:\s*'((?:[^'\\]|\\.)*)'")
    example_dq_re = re.compile(r'example:\s*"((?:[^"\\]|\\.)*)"')

    results: list[dict] = []
    for line in content.splitlines():
        m_id = id_re.search(line)
        if not m_id:
            continue
        m_term = term_re.search(line)
        if not m_term:
            continue

        example = None
        m_ex = example_re.search(line) or example_dq_re.search(line)
        if m_ex:
            example = m_ex.group(1).replace("\\'", "'").replace('\\"', '"')

        results.append({
            "id": m_id.group(1),
            "term": m_term.group(1),
            "example": example,
        })

    return results


def load_dataset(lang: str) -> list[dict]:
    """Returns full wordlist for a language."""
    if lang == "zh":
        return parse_words_ts(DATA_DIR / "zh" / "hsk1.ts", "zh")
    elif lang == "en":
        return parse_words_ts(DATA_DIR / "en" / "oxford500.ts", "en")
    else:
        raise ValueError(f"Unknown lang: {lang}")


# ————————————————————————————————————————————
# Output path routing
# ————————————————————————————————————————————

def output_path(lang: str, scope: str, wid: str, speed_label: str) -> Path:
    """Route (lang, scope, id, speed) → absolute output path."""
    return OUTPUT_ROOT / lang / scope / f"{wid}_{speed_label}.mp3"


# ————————————————————————————————————————————
# Google Cloud TTS
# ————————————————————————————————————————————

def synthesize(client, text: str, voice_name: str, locale: str, speaking_rate: float) -> bytes:
    """Call Google Cloud TTS with Chirp 3 HD voice."""
    from google.cloud import texttospeech

    return client.synthesize_speech(
        input=texttospeech.SynthesisInput(text=text),
        voice=texttospeech.VoiceSelectionParams(
            language_code=locale,
            name=voice_name,
        ),
        audio_config=texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speaking_rate,
        ),
    ).audio_content


def generate_one(
    client, voice_name: str, locale: str,
    lang: str, scope: str, wid: str, text: str,
    speed_label: str, speaking_rate: float, force: bool,
) -> dict:
    """Generate one MP3 file. Returns entry metadata."""
    mp3_path = output_path(lang, scope, wid, speed_label)
    rel_path = f"{scope}/{wid}_{speed_label}.mp3"

    if mp3_path.exists() and not force:
        return {"rel_path": rel_path, "skipped": True, "size_bytes": 0}

    audio_bytes = synthesize(client, text, voice_name, locale, speaking_rate)
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    mp3_path.write_bytes(audio_bytes)

    return {"rel_path": rel_path, "skipped": False, "size_bytes": len(audio_bytes)}


# ————————————————————————————————————————————
# Manifest
# ————————————————————————————————————————————

def load_existing_manifest(lang: str) -> dict | None:
    path = OUTPUT_ROOT / lang / "manifest.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def write_manifest(lang: str, voice_name: str,
                   new_entries: dict, existing: dict | None) -> Path:
    """
    Write/merge manifest.json for a language.

    Schema:
        {
          "generated_at": "2026-04-22T...",
          "voice": "cmn-CN-Chirp3-HD-Kore",
          "speeds": ["normal", "slow"],
          "provider": "google-chirp3-hd",
          "total_files": 600,
          "entries": {
            "words/zh_001": { "normal": "words/zh_001_normal.mp3",
                              "slow":   "words/zh_001_slow.mp3" },
            ...
          }
        }
    """
    path = OUTPUT_ROOT / lang / "manifest.json"

    merged: dict[str, dict[str, str]] = {}
    if existing and "entries" in existing:
        merged = dict(existing["entries"])

    for key, speeds in new_entries.items():
        if key not in merged:
            merged[key] = {}
        merged[key].update(speeds)

    manifest = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "voice": voice_name,
        "speeds": list(SPEEDS.keys()),
        "provider": "google-chirp3-hd",
        "total_files": len(merged),
        "entries": merged,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


# ————————————————————————————————————————————
# Main generation flow
# ————————————————————————————————————————————

def run_lang(
    client, lang: str, voice_short: str, scope: str, sample: bool, force: bool,
) -> tuple[int, int, int, int]:
    """Generate for one (lang, scope). Returns (generated, skipped, failed, bytes)."""
    locale, _default = DEFAULT_VOICES[lang]
    voice_name = f"{locale}-Chirp3-HD-{voice_short}"

    words = load_dataset(lang)
    if not words:
        log(f"⚠️  No data loaded for {lang}")
        return 0, 0, 0, 0

    # Build items (id, scope, text)
    items: list[tuple[str, str, str]] = []
    if scope in ("words", "all"):
        for w in words:
            items.append((w["id"], "words", w["term"]))
    if scope in ("sentences", "all"):
        for w in words:
            if w.get("example"):
                items.append((w["id"], "sentences", w["example"]))

    if sample:
        by_scope: dict[str, list] = {}
        for it in items:
            by_scope.setdefault(it[1], []).append(it)
        items = []
        for lst in by_scope.values():
            items.extend(lst[:SAMPLE_COUNT])

    total = len(items) * len(SPEEDS)
    log(f"\n[{lang.upper()}] voice={voice_name}")
    log(f"   {len(items)} items × {len(SPEEDS)} speeds = {total} files")

    generated = skipped = failed = total_bytes = 0
    entries: dict[str, dict[str, str]] = {}
    idx = 0

    for (wid, scope_name, text) in items:
        key = f"{scope_name}/{wid}"
        entries.setdefault(key, {})

        for speed_label, rate in SPEEDS.items():
            idx += 1
            display = text[:16] + ("…" if len(text) > 16 else "")
            log(f"  [{idx:4d}/{total}] {wid:<8s} {scope_name[:4]:<4s} [{speed_label:6s}] → {display:18s} ",
                end="")

            try:
                result = generate_one(
                    client, voice_name, locale,
                    lang, scope_name, wid, text,
                    speed_label, rate, force,
                )
                entries[key][speed_label] = result["rel_path"]

                if result["skipped"]:
                    log("⏭  exists")
                    skipped += 1
                else:
                    log(f"✓ {human_size(result['size_bytes'])}")
                    generated += 1
                    total_bytes += result["size_bytes"]
                    time.sleep(0.15)  # ~6 req/s, well under 900/min quota
            except Exception as e:
                log(f"✗ FAIL: {e}")
                failed += 1

    existing = load_existing_manifest(lang)
    manifest_path = write_manifest(lang, voice_name, entries, existing)
    log(f"   📋 Manifest: {manifest_path.relative_to(PROJECT_ROOT)}")

    return generated, skipped, failed, total_bytes


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate Google Cloud TTS (Chirp 3 HD) audio for LinguaNewTab",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--lang", choices=["zh", "en", "all"], default="all")
    parser.add_argument("--scope", choices=["words", "sentences", "all"], default="all")
    parser.add_argument("--sample", action="store_true",
                        help=f"Only {SAMPLE_COUNT} items per (lang, scope)")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    parser.add_argument("--voice", default=None,
                        help="Voice short name (default: Kore for zh, Leda for en)")
    args = parser.parse_args()

    # Validate credentials
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path or not Path(cred_path).exists():
        log("❌ GOOGLE_APPLICATION_CREDENTIALS env var không set hoặc file không tồn tại.")
        log("")
        log("Export credentials:")
        log('   export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/scripts/credentials/google-tts-key.json"')
        return 1

    log("🎙️  LinguaNewTab — Google Cloud TTS Generator (Chirp 3 HD)")
    log(f"   Lang:   {args.lang}")
    log(f"   Scope:  {args.scope}")
    log(f"   Speeds: normal (1.0x) + slow (0.7x)")
    log(f"   Sample: {args.sample}")
    log(f"   Output: {OUTPUT_ROOT.relative_to(PROJECT_ROOT)}")

    log("\n🔐 Authenticating with Google Cloud...")
    try:
        from google.cloud import texttospeech
    except ImportError:
        log("❌ google-cloud-texttospeech not installed. Run:")
        log("   uv pip install google-cloud-texttospeech")
        return 1

    try:
        client = texttospeech.TextToSpeechClient()
    except Exception as e:
        log(f"❌ Authentication failed: {e}")
        return 1
    log("✅ Authenticated")

    langs = ["zh", "en"] if args.lang == "all" else [args.lang]

    total_gen = total_skip = total_fail = total_bytes = 0
    for lang in langs:
        voice_short = args.voice or DEFAULT_VOICES[lang][1]
        gen, skip, fail, nbytes = run_lang(
            client, lang, voice_short, args.scope, args.sample, args.force,
        )
        total_gen += gen
        total_skip += skip
        total_fail += fail
        total_bytes += nbytes

    log("\n" + "=" * 60)
    log(f"✅ Done. Generated: {total_gen}, Skipped: {total_skip}, Failed: {total_fail}")
    log(f"📦 Total size this run: {human_size(total_bytes)}")

    if args.sample:
        log("\n🎧 Sample files — Test thử:")
        log("   afplay public/audio/zh/words/zh_001_normal.mp3")
        log("   afplay public/audio/zh/words/zh_001_slow.mp3")
        log("   afplay public/audio/zh/sentences/zh_001_normal.mp3")
        log("   afplay public/audio/en/words/en_001_normal.mp3")
        log("   afplay public/audio/en/sentences/en_001_normal.mp3")
        log("\n→ Nếu OK, chạy full:")
        log("   python scripts/gen_google_mac.py --lang=all --scope=all")
    else:
        log("\n🔜 Next: Reload extension in Chrome để test audio mới")

    return 0 if total_fail == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
