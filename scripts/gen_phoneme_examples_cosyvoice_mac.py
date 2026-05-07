#!/usr/bin/env python3
"""
Generate CosyVoice 3 audio for phoneme EXAMPLE WORDS, in TWO voices (Singapore region).

Generates two complete sets of phoneme example MP3s — one male, one female —
into separate folders so the in-app voice toggle ("♂ Nam | ♀ Nữ") can switch
between them without re-running the script.

Layout:
    public/audio/zh/phoneme-examples-male/zh_init_t.mp3   ← longanyang (male)
    public/audio/zh/phoneme-examples-female/zh_init_t.mp3 ← longanhuan (female)
    public/audio/zh/manifest.json (entries: phoneme-examples-{gender}/{id})

Region: Singapore (cosyvoice-v3-flash). The two "benchmark" voices longanyang
and longanhuan are the ones verified to work from Singapore; the _v3-suffixed
voices in the official list return Engine error 418 from Singapore endpoints.

Network: includes retry-with-backoff for the SDK's hardcoded 5s WebSocket
connect timeout, since Vietnam → Singapore cold-start often exceeds 5s on
DNS+TLS handshake. Retries up to 6 times (~25s total wait worst case).

Usage:
  # Generate both genders (default — what you want for the UI toggle to work):
  python scripts/gen_phoneme_examples_cosyvoice_mac.py --force

  # Just one gender:
  python scripts/gen_phoneme_examples_cosyvoice_mac.py --force --gender=male
  python scripts/gen_phoneme_examples_cosyvoice_mac.py --force --gender=female

  # Single phoneme test:
  python scripts/gen_phoneme_examples_cosyvoice_mac.py --force --id=zh_init_t

Requirements:
  uv pip install dashscope
  Environment: DASHSCOPE_API_KEY (Singapore region)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# ────────────────────────────────────────────────────────────────────────────
# Paths
# ────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
PINYIN_TS = PROJECT_ROOT / "src" / "data" / "zh" / "pinyin.ts"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "audio" / "zh"
MANIFEST_PATH = OUTPUT_ROOT / "manifest.json"

# Output folders are gender-keyed so users can A/B switch in the UI without
# regenerating. Each gender gets its own subdir + manifest namespace.
#   public/audio/zh/phoneme-examples-male/zh_init_t.mp3
#   public/audio/zh/phoneme-examples-female/zh_init_t.mp3
def output_dir_for(gender: str) -> Path:
    return OUTPUT_ROOT / f"phoneme-examples-{gender}"


def manifest_key_prefix_for(gender: str) -> str:
    return f"phoneme-examples-{gender}"


# Gender → CosyVoice voice. Empirical finding: Singapore region only allows
# voices with "longan*" prefix. Other listed voices return Engine 418.
# longanyun_v3 picked over longanyang after listening tests showed cleaner
# rendering of multi-character HSK1 words like 点 (diǎn) — fewer dropped
# characters even before triple-repeat fix is applied.
VOICE_BY_GENDER = {
    "male":   "longanyun_v3",   # Homey warm-hearted male, 30-35
    "female": "longanwen_v3",   # Elegant intellectual female, 25-35
}

DEFAULT_MODEL = "cosyvoice-v3-flash"  # Singapore region — v3.5 not available here

# Voice naming reality (April 2026, verified by trial-and-error from Vietnam):
#   The official voice list page (cosyvoice-voice-list) shows ~60 voices for
#   cosyvoice-v3-flash. In practice, on the SINGAPORE region only the two
#   "Benchmark" voices actually work — the `_v3`-suffixed ones return Engine
#   error 418 ("InvalidParameter") despite being listed.
#
#   That's why VOICE_BY_GENDER above maps to just longanyang/longanhuan.

SINGAPORE_HTTP_URL = "https://dashscope-intl.aliyuncs.com/api/v1"
SINGAPORE_WS_URL = "wss://dashscope-intl.aliyuncs.com/api-ws/v1/inference"


def log(msg: str = "", end: str = "\n") -> None:
    print(msg, end=end, flush=True)


# ────────────────────────────────────────────────────────────────────────────
# Parse phonemes from pinyin.ts (same as Qwen script)
# ────────────────────────────────────────────────────────────────────────────

PHONEME_BLOCK_RE = re.compile(
    r"\{[^{}]*?id:\s*'([^']+)'[^{}]*?\}",
    re.DOTALL,
)
FIELD_RE = re.compile(r"(\w+):\s*'([^']*)'")


def parse_phonemes_from_ts() -> list[dict]:
    """Parse pinyin.ts → list of dicts. See gen_phoneme_examples_mac.py for details."""
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
# TTS input text strategy — different from Qwen
# ────────────────────────────────────────────────────────────────────────────

def pick_tts_text(example_word: str, example_phonetic: str) -> str:
    """
    Build TTS input for CosyVoice 3.

    Double-repeat strategy for short example words (≤2 chars):
        example_word="八"   →  "八，八。"
        example_word="爸爸" →  "爸爸，爸爸。"
        example_word="我们" →  "我们，我们。"
    Longer words (3+ chars) get a simple closing period.

    Why double-repeat: CosyVoice 3 sometimes drops characters on very short
    input — the model wants more acoustic mass to anchor prosody. Two
    repetitions stops the dropping reliably without making playback feel
    excessive (verified vs. earlier triple-repeat).

    Why hanzi (not pinyin): CosyVoice's internal romanizer handles tone sandhi
    better than raw pinyin tone marks. Hanzi triggers proper pronunciation
    that matches real-world Mandarin.
    """
    if not example_word:
        return example_phonetic or ""

    cleaned = example_word.rstrip("。.！!？?")
    if len(cleaned) <= 2:
        return f"{cleaned}，{cleaned}。"
    return f"{cleaned}。"


# ────────────────────────────────────────────────────────────────────────────
# CosyVoice generation
# ────────────────────────────────────────────────────────────────────────────

def human_size(n_bytes: int) -> str:
    if n_bytes < 1024:
        return f"{n_bytes}B"
    if n_bytes < 1024 * 1024:
        return f"{n_bytes / 1024:.1f}KB"
    return f"{n_bytes / 1024 / 1024:.2f}MB"


def generate_one(
    pid: str,
    text: str,
    voice: str,
    model: str,
    force: bool,
    output_dir: Path,
    key_prefix: str,
    max_retries: int = 6,
) -> dict:
    """
    Generate one phoneme-example MP3 via CosyVoice 3.

    The dashscope `SpeechSynthesizer` returns MP3 bytes directly — no WAV
    intermediate, no ffmpeg conversion. Faster than the Qwen path.

    Retry logic:
        The Python SDK hardcodes a 5-second WebSocket connect timeout
        (dashscope/audio/tts_v2/speech_synthesizer.py:__connect). From Vietnam
        the first connection to dashscope-intl Singapore can take longer than
        5s on cold-start (DNS + TLS handshake on a fresh ISP route), causing
        a TimeoutError("websocket connection could not established within 5s").
        Subsequent attempts almost always succeed because the network state is
        warm — so we retry up to 6 times with exponential backoff.
    """
    from dashscope.audio.tts_v2 import SpeechSynthesizer

    mp3_path = output_dir / f"{pid}.mp3"
    key = f"{key_prefix}/{pid}"
    rel_path = f"{key_prefix}/{pid}.mp3"

    if mp3_path.exists() and not force:
        return {
            "id": pid,
            "key": key,
            "rel_path": rel_path,
            "text": text,
            "skipped": True,
        }

    last_err: Exception | None = None
    for attempt in range(max_retries):
        try:
            # New synthesizer per attempt — old one's WebSocket is dead after
            # a connect failure. Stateless instantiation makes retry safe.
            synth = SpeechSynthesizer(model=model, voice=voice)
            audio_bytes = synth.call(text)

            if audio_bytes is None or len(audio_bytes) == 0:
                raise RuntimeError(
                    f"Empty audio for {pid!r} (text={text!r}). "
                    f"Check: (1) API key matches Singapore endpoint, "
                    f"(2) model='{model}' is supported in your region, "
                    f"(3) voice='{voice}' exists for this model."
                )

            output_dir.mkdir(parents=True, exist_ok=True)
            mp3_path.write_bytes(audio_bytes)

            return {
                "id": pid,
                "key": key,
                "rel_path": rel_path,
                "text": text,
                "size_bytes": mp3_path.stat().st_size,
            }
        except Exception as e:
            # Decide retry vs fail by error message content, not exception type.
            # The dashscope SDK wraps errors inconsistently: WebSocket timeouts
            # may surface as TimeoutError, RuntimeError, or generic Exception
            # depending on whether the failure is connect-phase or task-phase.
            err_msg = str(e).lower()
            is_transient = any(needle in err_msg for needle in (
                "websocket",
                "timeout",
                "could not established",
                "connection",
                "network",
            ))

            last_err = e
            if is_transient and attempt < max_retries - 1:
                backoff = 1.5 * (2 ** attempt)  # 1.5, 3, 6 → ~10.5s total
                log(f"\n        ↻ retry {attempt + 2}/{max_retries} after {backoff:.1f}s (transient: {type(e).__name__})", end="")
                time.sleep(backoff)
                continue
            # Either non-transient (auth, model invalid, etc.) or out of retries
            raise

    # Should never reach here unless max_retries == 0
    raise last_err or RuntimeError("All retries exhausted")


# ────────────────────────────────────────────────────────────────────────────
# Manifest merge — same shape as Qwen script for interop
# ────────────────────────────────────────────────────────────────────────────

def merge_manifest(new_entries: list[dict], voice: str, model: str) -> int:
    """
    Merge CosyVoice phoneme-examples entries into existing manifest.

    Manifest is shared across all generators (Qwen, CosyVoice, DigMandarin).
    We only touch `phoneme-examples/*` keys; other keys (pinyin-chart/*,
    words/*, sentences/*) are preserved verbatim. The `generator` and
    `voice` fields at the top level reflect THIS run only — they're
    informational, not authoritative for individual entries.
    """
    existing: dict = {}
    if MANIFEST_PATH.exists():
        try:
            data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
            existing = data.get("entries", {})
        except json.JSONDecodeError:
            log(f"⚠️  Could not parse existing manifest, starting fresh")

    # Migrate any legacy string-format entries from older runs
    for k, v in list(existing.items()):
        if isinstance(v, str):
            existing[k] = {"default": v}

    # Apply new phoneme-examples entries
    for entry in new_entries:
        existing[entry["key"]] = {"default": entry["rel_path"]}

    out = {
        # `datetime.utcnow()` was deprecated in 3.12; the timezone-aware form
        # below is the future-proof equivalent and produces the same wire format.
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "phoneme_examples_generator": "cosyvoice",
        "phoneme_examples_voice": voice,
        "phoneme_examples_model": model,
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
    parser.add_argument("--gender", choices=("male", "female", "both"),
                        default="both",
                        help="Voice gender to generate. 'both' (default) generates "
                             "two complete sets (male=longanyang, female=longanhuan) "
                             "into separate folders so the UI toggle works.")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Model (default {DEFAULT_MODEL})")
    parser.add_argument("--delay", type=float, default=0.2,
                        help="Delay between requests in seconds (default 0.2)")
    args = parser.parse_args()

    if not os.getenv("DASHSCOPE_API_KEY"):
        log("❌ DASHSCOPE_API_KEY not set in environment")
        return 1

    # Validate model — Singapore region restrictions.
    if "v3.5" in args.model:
        log(f"❌ Model '{args.model}' is only available in Beijing region.")
        log(f"   Use --model=cosyvoice-v3-flash (default) instead.")
        return 1

    genders = ["male", "female"] if args.gender == "both" else [args.gender]

    # Configure dashscope to Singapore endpoint — same fix as Qwen script.
    # Without this, sk-keys issued by Alibaba Cloud Singapore return 401.
    try:
        import dashscope
    except ImportError:
        log("❌ dashscope not installed. Run: uv pip install dashscope")
        return 1
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    dashscope.base_http_api_url = SINGAPORE_HTTP_URL
    dashscope.base_websocket_api_url = SINGAPORE_WS_URL

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
    log(f"🤖 Model:    {args.model}")
    log(f"🚻 Genders:  {', '.join(genders)}")
    log(f"📋 Total:    {len(phonemes)} phonemes × {len(genders)} voice(s) "
        f"= {len(phonemes) * len(genders)} files")
    log(f"🔁 Force:    {args.force}")
    log("─" * 60)
    log()

    # ── Run loop: outer = gender, inner = phonemes ──
    # Doing it this way means each gender's WebSocket is "warm" by the time we
    # hit the second gender — better cache reuse than interleaving. Also makes
    # progress easier to track ("male: 30/64 done").

    grand_total_new = 0
    grand_total_skipped = 0
    grand_total_failed = 0
    failed_pids_by_gender: dict[str, list[str]] = {}

    for gender in genders:
        voice = VOICE_BY_GENDER[gender]
        out_dir = output_dir_for(gender)
        key_prefix = manifest_key_prefix_for(gender)

        log("━" * 60)
        log(f"🎤 GENDER: {gender.upper()}  (voice={voice}, out={out_dir.name})")
        log("━" * 60)

        new_entries: list[dict] = []
        skipped = 0
        failed = 0
        failed_pids: list[str] = []

        for i, p in enumerate(phonemes, 1):
            pid = p["id"]
            word = p["exampleWord"]
            phonetic = p["examplePhonetic"]
            text = pick_tts_text(word, phonetic)

            log(f"[{i:2d}/{len(phonemes)}] {pid:24s}  word={word:6s}  text='{text}' ", end="")
            try:
                entry = generate_one(
                    pid, text, voice, args.model, args.force, out_dir, key_prefix,
                )
                if entry.get("skipped"):
                    log("⏭  skipped")
                    skipped += 1
                else:
                    log(f"✓ {human_size(entry['size_bytes'])}")
                    time.sleep(args.delay)
                new_entries.append(entry)
            except Exception as e:
                log(f"✗ FAIL: {e}")
                failed += 1
                failed_pids.append(pid)

        # Merge this gender's results into shared manifest immediately so a
        # mid-script crash on the second gender doesn't lose progress on the first.
        merge_manifest(new_entries, voice, args.model)

        log(f"\n  → {gender}: generated {len(new_entries) - skipped}, "
            f"skipped {skipped}, failed {failed}")
        if failed_pids:
            log(f"  → failed IDs: {failed_pids}")

        grand_total_new += len(new_entries) - skipped
        grand_total_skipped += skipped
        grand_total_failed += failed
        if failed_pids:
            failed_pids_by_gender[gender] = failed_pids

    log()
    log("=" * 60)
    log(f"✅ All done. Generated: {grand_total_new}, "
        f"Skipped: {grand_total_skipped}, Failed: {grand_total_failed}")
    log(f"📋 Manifest: {MANIFEST_PATH}")

    if failed_pids_by_gender:
        log()
        log(f"⚠️  Some files failed. Re-run with --force to retry only the failed ones:")
        for g, pids in failed_pids_by_gender.items():
            log(f"   {g}: {pids}")
        log(f"   Or rerun the whole script — already-generated files will be skipped.")

    log()
    log("🔜 Next: `npm run build` → reload extension at chrome://extensions/")

    return 0 if grand_total_failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
