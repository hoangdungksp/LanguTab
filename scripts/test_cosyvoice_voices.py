"""
CosyVoice voice sampler — generate the SAME text in MANY voices for A/B comparison.

Use this to pick which voice sounds best for Jason's HSK1 word audio before
committing to a full 150-word generation run.

Output: /tmp/cosyvoice_samples/{voice}.mp3  (auto-opens in macOS Finder)

The text is sent in triple-repeat form (e.g. "点，点，点。") to give the model
enough acoustic mass to render single-character HSK1 words completely. Without
this, CosyVoice 3 sometimes drops characters on 1-char input — the same class
of failure that bit Qwen Cherry on phoneme examples.

Usage:
  # Default: test all candidate male voices on the word "点"
  python scripts/test_cosyvoice_voices.py

  # Pick your own test word and voice gender:
  python scripts/test_cosyvoice_voices.py --text="点" --gender=male
  python scripts/test_cosyvoice_voices.py --text="谢谢" --gender=female
  python scripts/test_cosyvoice_voices.py --text="我爱你" --gender=both

  # Custom voice list (comma-separated):
  python scripts/test_cosyvoice_voices.py --voices=longshu_v3,longanyang,longshuo_v3

  # Use a HSK1 sentence:
  python scripts/test_cosyvoice_voices.py --text="我是学生。"

After listening, set the winning voice in gen_words_cosyvoice_mac.py via
--voice flag:
  python scripts/gen_words_cosyvoice_mac.py --force --gender=male --voice=longshu_v3
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

# All cosyvoice-v3-flash voices on Singapore region.
#
# EMPIRICAL FINDING (Apr 2026): The Singapore region only enables voices with
# the "longan*" prefix — all other listed voices return Engine 418 even though
# the official docs list them as supported by cosyvoice-v3-flash. Probably an
# undocumented region-specific allowlist on Alibaba's side.
#
# This list reflects the working-voices reality, not the docs. Voices with
# Engine-418 status are excluded — running the sampler on them just wastes
# API calls. If Alibaba expands the Singapore allowlist later, add candidates
# back here and re-run.

CANDIDATE_MALE_VOICES = [
    # Verified working on Singapore + cosyvoice-v3-flash:
    "longanyun_v3",     # Homey warm-hearted male, 30-35 (Jason's pick — natural prosody)
    "longanyang",       # Sunny young man, 20-30 (benchmark — slightly drops short words)
    "longanlang_v3",    # Fresh crisp male, 20-25
    "longanzhi_v3",     # Wise mature young male, 25-35
]

CANDIDATE_FEMALE_VOICES = [
    # Verified working: longanhuan benchmark
    "longanhuan",       # Energetic cheerful female, 20-30 (benchmark)
    # Hypothesis-test set — all longan*_v3 female voices likely work given the
    # pattern. If any return Engine 418, the sampler will report and skip.
    "longanwen_v3",     # Voice assistant — elegant intellectual female, 25-35
    "longanli_v3",      # Voice assistant — crisp composed female, 25-35
    "longanrou_v3",     # Social — gentle best-friend female, 20-35
    "longantai_v3",     # Social — sweet coquettish Taiwanese female, 20-25
    "longanran_v3",     # Livestreaming — lively textured female, 30-40
    "longanxuan_v3",    # Livestreaming — classic livestreamer, 30-40
    "longanqin_v3",     # Social — approachable lively female, 20-25
    "longanya_v3",      # Social — elegant classy female, 25-35
    "longanling_v3",    # Social — agile-minded female, 20-30
]

DEFAULT_TEST_TEXT = "点"  # 1-char word that exposed the "missing character" bug

SINGAPORE_HTTP_URL = "https://dashscope-intl.aliyuncs.com/api/v1"
SINGAPORE_WS_URL = "wss://dashscope-intl.aliyuncs.com/api-ws/v1/inference"
DEFAULT_MODEL = "cosyvoice-v3-flash"
OUTPUT_DIR = Path("/tmp/cosyvoice_samples")


def log(msg: str = "", end: str = "\n") -> None:
    print(msg, end=end, flush=True)


def make_test_text(word: str) -> str:
    """
    Build the input text for the model.

    Triple-repeat for short words (≤2 chars) — gives the model enough acoustic
    mass to render the word completely. Empirically derived from the phoneme-
    example script's same problem.

    Longer words (sentences) are passed through as-is — they already have
    enough context for the model to render correctly.
    """
    # Strip optional trailing 。 the user may have included
    cleaned = word.rstrip("。.！!？?")
    # Use grapheme count loosely — Chinese chars are mostly 1 code point each
    if len(cleaned) <= 2:
        return f"{cleaned}，{cleaned}，{cleaned}。"
    # Already long enough; ensure terminal punctuation
    if not word[-1] in "。.！!？?":
        return f"{word}。"
    return word


def generate_one(voice: str, text: str, model: str, max_retries: int = 4) -> tuple[bool, str]:
    """
    Generate one sample. Returns (success, message).

    Mirror retry logic from gen_phoneme_examples_cosyvoice_mac.py — only retry
    network/timeout errors, fail fast on InvalidParameter (Engine 418 = voice
    not supported by this model in this region).
    """
    from dashscope.audio.tts_v2 import SpeechSynthesizer

    out_path = OUTPUT_DIR / f"{voice}.mp3"
    last_err: Exception | None = None

    for attempt in range(max_retries):
        try:
            synth = SpeechSynthesizer(model=model, voice=voice)
            audio_bytes = synth.call(text)

            if not audio_bytes:
                return False, "empty audio (likely Engine 418: voice not supported)"

            out_path.write_bytes(audio_bytes)
            return True, f"{len(audio_bytes) // 1024}KB"

        except Exception as e:
            err_msg = str(e).lower()
            is_transient = any(needle in err_msg for needle in (
                "websocket", "timeout", "could not established",
                "connection", "network",
            ))
            # Engine 418 / InvalidParameter — voice not supported, don't retry
            is_voice_unsupported = "418" in str(e) or "invalidparameter" in err_msg

            if is_voice_unsupported:
                return False, f"voice unsupported on Singapore (Engine 418)"

            last_err = e
            if is_transient and attempt < max_retries - 1:
                backoff = 1.5 * (2 ** attempt)
                log(f"\n        ↻ retry {attempt + 2}/{max_retries} after {backoff:.1f}s", end="")
                time.sleep(backoff)
                continue

            return False, str(e)[:80]

    return False, f"all retries exhausted: {last_err}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--text", default=DEFAULT_TEST_TEXT,
                        help=f"Text to synthesize (default: '{DEFAULT_TEST_TEXT}')")
    parser.add_argument("--gender", choices=("male", "female", "both"), default="male",
                        help="Which voice gender to sample (default: male)")
    parser.add_argument("--voices", default=None,
                        help="Comma-separated voice names; overrides --gender if set")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Model (default: {DEFAULT_MODEL})")
    parser.add_argument("--no-open", action="store_true",
                        help="Don't auto-open output folder when done")
    args = parser.parse_args()

    if not os.getenv("DASHSCOPE_API_KEY"):
        log("❌ DASHSCOPE_API_KEY not set in environment")
        return 1

    # Determine voice list
    if args.voices:
        voices = [v.strip() for v in args.voices.split(",") if v.strip()]
    elif args.gender == "male":
        voices = CANDIDATE_MALE_VOICES
    elif args.gender == "female":
        voices = CANDIDATE_FEMALE_VOICES
    else:  # both
        voices = CANDIDATE_MALE_VOICES + CANDIDATE_FEMALE_VOICES

    # Setup
    try:
        import dashscope
    except ImportError:
        log("❌ dashscope not installed. Run: uv pip install dashscope")
        return 1
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    dashscope.base_http_api_url = SINGAPORE_HTTP_URL
    dashscope.base_websocket_api_url = SINGAPORE_WS_URL

    # Reset output dir for clean test
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)

    test_text = make_test_text(args.text)

    log("─" * 60)
    log(f"🤖 Model:    {args.model}")
    log(f"📝 Input:    '{args.text}' → sent as '{test_text}' (triple-repeat for short)")
    log(f"📁 Output:   {OUTPUT_DIR}")
    log(f"🎤 Voices:   {len(voices)} candidates")
    log("─" * 60)
    log()

    successes = []
    failures = []

    for i, voice in enumerate(voices, 1):
        log(f"[{i:2d}/{len(voices)}] {voice:24s} ", end="")
        ok, msg = generate_one(voice, test_text, args.model)
        if ok:
            log(f"✓ {msg}")
            successes.append(voice)
        else:
            log(f"✗ {msg}")
            failures.append((voice, msg))
        time.sleep(0.3)  # small delay between voices

    log()
    log("=" * 60)
    log(f"✅ Working: {len(successes)} voices")
    for v in successes:
        log(f"   • {v}")

    if failures:
        log()
        log(f"❌ Failed: {len(failures)} voices")
        for v, why in failures:
            log(f"   • {v:24s}  {why}")

    log()
    log(f"📂 Listen to samples at: {OUTPUT_DIR}")
    log()
    log(f"🎯 To use a specific voice in the full gen run:")
    log(f"   python scripts/gen_words_cosyvoice_mac.py \\")
    log(f"     --force --gender=male --voice=<chosen_voice>")

    if not args.no_open and sys.platform == "darwin" and successes:
        # Auto-open Finder so Jason can play files quickly
        subprocess.run(["open", str(OUTPUT_DIR)])

    return 0 if successes else 1


if __name__ == "__main__":
    sys.exit(main())
