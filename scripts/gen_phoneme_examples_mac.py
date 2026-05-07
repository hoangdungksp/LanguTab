#!/usr/bin/env python3
"""
Generate Qwen-TTS Cherry voice audio for phoneme EXAMPLE WORDS.

Reads `exampleWord` (Chinese hanzi) and `examplePhonetic` (pinyin with tone marks)
from src/data/zh/pinyin.ts, generates one MP3 per phoneme using Qwen-TTS, and
writes them under public/audio/zh/phoneme-examples/.

Used by the "Nghe ví dụ" button in the Âm đầu / Âm vận / Thanh điệu detail panel.
The button plays the example word (e.g. "爸爸" for /b/) so learners hear the
phoneme in real Mandarin context.

Usage:
  python scripts/gen_phoneme_examples_mac.py                # generate missing only
  python scripts/gen_phoneme_examples_mac.py --force        # re-generate everything
  python scripts/gen_phoneme_examples_mac.py --id=zh_init_b # just one phoneme
  python scripts/gen_phoneme_examples_mac.py --voice=Chelsie

Requirements:
  uv pip install dashscope requests pypinyin
  Environment: DASHSCOPE_API_KEY
  External: ffmpeg in PATH

Why pinyin (not hanzi) as input:
  Qwen-TTS sometimes produces wrong tones on isolated 1-2 character hanzi
  examples (multi-tonal characters can sandhi unpredictably). Feeding the
  pinyin string with tone marks like "bàba" forces the exact pronunciation
  shown to the learner.

  Exception: ü-family pinyin codepoints (üǖǘǚǜ) confuse Qwen-TTS tone
  rendering. For those, fall back to hanzi (Qwen's internal romanizer
  handles ü properly via the j/q/x/y rule).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# ────────────────────────────────────────────────────────────────────────────
# Paths
# ────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
PINYIN_TS = PROJECT_ROOT / "src" / "data" / "zh" / "pinyin.ts"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "audio" / "zh"
OUTPUT_DIR = OUTPUT_ROOT / "phoneme-examples"
MANIFEST_PATH = OUTPUT_ROOT / "manifest.json"

DEFAULT_VOICE = "Cherry"
DEFAULT_MODEL = "qwen3-tts-flash"

# Critical: dashscope library defaults to the China mainland endpoint
# (dashscope.aliyuncs.com), but DASHSCOPE_API_KEY keys issued from Alibaba
# Cloud Singapore (sk-...) only authenticate against the international
# endpoint. Without this, every request returns 401 InvalidApiKey.
SINGAPORE_HTTP_URL = "https://dashscope-intl.aliyuncs.com/api/v1"

UMLAUT_CHARS = set("üǖǘǚǜ")


def log(msg: str = "", end: str = "\n") -> None:
    print(msg, end=end, flush=True)


# ────────────────────────────────────────────────────────────────────────────
# Parser: extract phoneme entries from pinyin.ts
# ────────────────────────────────────────────────────────────────────────────

# Match a single phoneme object: { id: '...', ..., exampleWord: '...', examplePhonetic: '...', ... }
# Captures id, exampleWord, examplePhonetic. Order-tolerant — fields can appear
# in any order within the object.
PHONEME_BLOCK_RE = re.compile(
    r"\{[^{}]*?id:\s*'([^']+)'[^{}]*?\}",
    re.DOTALL,
)
FIELD_RE = re.compile(r"(\w+):\s*'([^']*)'")


def parse_phonemes_from_ts() -> list[dict]:
    """
    Parse pinyin.ts → list of dicts { id, exampleWord, examplePhonetic }.

    Naive regex is fine here because the file follows a strict object-literal
    pattern: every field is single-quoted, no nested braces, no template strings.
    Confirmed against current file (64 phonemes).
    """
    if not PINYIN_TS.exists():
        log(f"❌ {PINYIN_TS} not found")
        sys.exit(1)

    src = PINYIN_TS.read_text(encoding="utf-8")
    phonemes: list[dict] = []

    for m in PHONEME_BLOCK_RE.finditer(src):
        block = m.group(0)
        fields = dict(FIELD_RE.findall(block))
        pid = fields.get("id", "")
        if not pid.startswith(("zh_init_", "zh_fin_", "zh_tone_")):
            continue
        phonemes.append({
            "id": pid,
            "exampleWord": fields.get("exampleWord", ""),
            "examplePhonetic": fields.get("examplePhonetic", ""),
        })

    return phonemes


# ────────────────────────────────────────────────────────────────────────────
# Audio: WAV → MP3
# ────────────────────────────────────────────────────────────────────────────

def wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    """Convert WAV → MP3 64kbps mono using ffmpeg, then delete the WAV."""
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(wav_path),
            "-codec:a", "libmp3lame", "-b:a", "64k",
            "-ac", "1", str(mp3_path),
        ],
        check=True,
        capture_output=True,
    )
    wav_path.unlink(missing_ok=True)


def human_size(n_bytes: int) -> str:
    if n_bytes < 1024:
        return f"{n_bytes}B"
    if n_bytes < 1024 * 1024:
        return f"{n_bytes / 1024:.1f}KB"
    return f"{n_bytes / 1024 / 1024:.2f}MB"


# ────────────────────────────────────────────────────────────────────────────
# Qwen-TTS: generate one
# ────────────────────────────────────────────────────────────────────────────

def pick_tts_text(example_word: str, example_phonetic: str) -> str:
    """
    Build the input text fed to Qwen-TTS for a phoneme example word.

    Strategy: TRIPLE-REPEAT — '<hanzi>，<hanzi>，<hanzi>。'
    ─────────────────────────────────────────────
    The earlier hybrid format `<hanzi>，<pinyin>。` (proven on 150 HSK1 word
    terms) was still letting Cherry hallucinate prefix/suffix on phoneme
    examples — the user heard things like "wǒ de bàba" instead of just "bàba".

    Why phoneme examples are harder than HSK1 word terms:
        HSK1 words are mostly 2 hanzi (像 妈妈, 朋友). Phoneme examples include
        many 1-character entries (饭, 大, 他, 你, 看, 好, 几, 请, 吃, 是, 人, 字,
        菜, 三 — 14 of 21 initials). Single hanzi gives Qwen too little acoustic
        mass; the model fills the silence by inventing common collocations
        ("wǒ de X" for kinship, "hěn X" for adjectives, etc).

    Why triple repeat works:
        Repeating the SAME hanzi 3 times forces the model to anchor on what it
        already produced. There is no plausible "context completion" for a
        phrase like "好，好，好。" — the only sensible output is to repeat hǎo
        three times. The Chinese commas + period make it a closed utterance.

        We then post-process the audio in playback: the FIRST repetition is
        what users actually need; the rest is throwaway acoustic padding.
        For now we accept the longer audio as-is; future optimisation could
        ffmpeg-trim to the first occurrence.

    Why not pinyin at all anymore:
        Cherry's tone parsing on combining diacritics (ǎ ě ǐ ǒ ǔ) was
        unreliable. Hanzi-only triple repeat with Qwen's internal pronunciation
        is more consistent across all 64 phonemes.

    Umlaut: same triple-repeat strategy works (ǖǘǚǜ codepoints never enter
    the input — we only feed hanzi).
    """
    if not example_word:
        return example_phonetic or ""

    return f"{example_word}，{example_word}，{example_word}。"


def generate_one(
    pid: str,
    text: str,
    voice: str,
    model: str,
    force: bool,
) -> dict:
    """
    Generate one phoneme-example MP3 via Qwen-TTS Singapore endpoint.

    Returns:
        { "id": pid, "key": "phoneme-examples/zh_init_b",
          "rel_path": "phoneme-examples/zh_init_b.mp3",
          "size_bytes": int, "skipped": bool }
    """
    import requests
    from dashscope import MultiModalConversation

    mp3_path = OUTPUT_DIR / f"{pid}.mp3"

    if mp3_path.exists() and not force:
        return {
            "id": pid,
            "key": f"phoneme-examples/{pid}",
            "rel_path": f"phoneme-examples/{pid}.mp3",
            "text": text,
            "skipped": True,
        }

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

    r = requests.get(audio_url, timeout=30)
    r.raise_for_status()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    wav_tmp = mp3_path.with_suffix(".wav")
    wav_tmp.write_bytes(r.content)
    wav_to_mp3(wav_tmp, mp3_path)

    return {
        "id": pid,
        "key": f"phoneme-examples/{pid}",
        "rel_path": f"phoneme-examples/{pid}.mp3",
        "text": text,
        "size_bytes": mp3_path.stat().st_size,
    }


# ────────────────────────────────────────────────────────────────────────────
# Manifest merge — preserve all other entries (pinyin-chart, words, sentences,
# initials, finals, tones from prior runs).
# ────────────────────────────────────────────────────────────────────────────

def merge_manifest(new_entries: list[dict]) -> int:
    """Merge new phoneme-examples entries into existing manifest. Returns total entry count."""
    existing: dict = {}
    if MANIFEST_PATH.exists():
        try:
            data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
            existing = data.get("entries", {})
        except json.JSONDecodeError:
            log(f"⚠️  Could not parse existing manifest, starting fresh")

    # Migrate any string-format entries (legacy bug from v0.5.13)
    for k, v in list(existing.items()):
        if isinstance(v, str):
            existing[k] = {"default": v}

    # Apply new entries
    for entry in new_entries:
        existing[entry["key"]] = {"default": entry["rel_path"]}

    out = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "total_files": len(existing),
        "entries": existing,
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(existing)


# ────────────────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true",
                        help="Re-generate even if MP3 already exists")
    parser.add_argument("--id", type=str, default=None,
                        help="Generate only this phoneme id (e.g. zh_init_b)")
    parser.add_argument("--voice", default=DEFAULT_VOICE,
                        help=f"Qwen-TTS voice (default {DEFAULT_VOICE})")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Qwen-TTS model (default {DEFAULT_MODEL})")
    parser.add_argument("--delay", type=float, default=0.3,
                        help="Delay between requests (seconds, default 0.3)")
    args = parser.parse_args()

    if not os.getenv("DASHSCOPE_API_KEY"):
        log("❌ DASHSCOPE_API_KEY not set in environment")
        return 1

    # Configure dashscope library globally to use the Singapore endpoint.
    # Must be done BEFORE any MultiModalConversation.call() — otherwise the
    # library hits the China mainland endpoint and returns 401 for sk-keys
    # issued by Alibaba Cloud Singapore.
    try:
        import dashscope
    except ImportError:
        log("❌ dashscope not installed. Run: uv pip install dashscope requests")
        return 1
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    dashscope.base_http_api_url = SINGAPORE_HTTP_URL

    phonemes = parse_phonemes_from_ts()
    if not phonemes:
        log("❌ No phonemes parsed from pinyin.ts")
        return 1

    if args.id:
        phonemes = [p for p in phonemes if p["id"] == args.id]
        if not phonemes:
            log(f"❌ No phoneme found with id={args.id}")
            return 1

    log("─" * 60)
    log(f"📂 Project:  {PROJECT_ROOT}")
    log(f"📁 Output:   {OUTPUT_DIR}")
    log(f"🎤 Voice:    {args.voice}  ({args.model})")
    log(f"📋 Total:    {len(phonemes)} phonemes")
    log(f"🔁 Force:    {args.force}")
    log("─" * 60)
    log()

    new_entries: list[dict] = []
    skipped = 0
    failed = 0

    for i, p in enumerate(phonemes, 1):
        pid = p["id"]
        word = p["exampleWord"]
        phonetic = p["examplePhonetic"]
        text = pick_tts_text(word, phonetic)

        log(f"[{i:2d}/{len(phonemes)}] {pid:24s}  word={word:6s}  text='{text}' ", end="")
        try:
            entry = generate_one(pid, text, args.voice, args.model, args.force)
            if entry.get("skipped"):
                log("⏭  skipped")
                skipped += 1
            else:
                log(f"✓ {human_size(entry['size_bytes'])}")
                time.sleep(args.delay)  # Rate-limit only on actual API calls
            new_entries.append(entry)
        except Exception as e:
            log(f"✗ FAIL: {e}")
            failed += 1

    total = merge_manifest(new_entries)

    log()
    log("=" * 60)
    log(f"✅ Done. Generated: {len(new_entries) - skipped}, "
        f"Skipped: {skipped}, Failed: {failed}")
    log(f"📋 Manifest: {MANIFEST_PATH} ({total} total entries)")
    log()
    log("🔜 Next: `npm run build` → reload extension")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
