"""
Generate CosyVoice 3 audio for Chinese WORDS and SENTENCES, in two voices.

Source-file agnostic — pass --source=hsk1, --source=hsk2 etc to pick which
deck to generate. Default is hsk2 since that's what's been shipping recently.

Used by Flashcard tab to play the word term + example sentence in either
male (longanyang) or female (longanhuan) voice depending on which icon
the user clicks (👨 Nam vs 👩 Nữ).

Output layout:
    public/audio/zh/words-male/zh_001.mp3      ← longanyang (male)
    public/audio/zh/words-female/zh_001.mp3    ← longanhuan (female)
    public/audio/zh/sentences-male/zh_001.mp3
    public/audio/zh/sentences-female/zh_001.mp3
    public/audio/zh/manifest.json
        entries: words-{gender}/{id}, sentences-{gender}/{id}

Existing words/{id} and sentences/{id} folders (Cherry/Qwen output) are
LEFT UNTOUCHED — audioService falls back to them when gender-specific
files are missing, preserving backward compatibility.

Region: Singapore (cosyvoice-v3-flash). Same retry-with-backoff logic as
gen_phoneme_examples_cosyvoice_mac.py for the SDK's hardcoded 5s WebSocket
connect timeout (Vietnam → Singapore cold-start often >5s).

Usage:
  # HSK 2 — both genders, all 150 new words + sentences (~600 files):
  python scripts/gen_words_cosyvoice_mac.py --force

  # HSK 1 — regenerate the original deck with the new pipeline:
  python scripts/gen_words_cosyvoice_mac.py --force --source=hsk1

  # Just one gender:
  python scripts/gen_words_cosyvoice_mac.py --force --gender=male

  # Just words (no sentences) — to start lighter:
  python scripts/gen_words_cosyvoice_mac.py --force --scope=words

  # Single word test (must match the active --source):
  python scripts/gen_words_cosyvoice_mac.py --force --id=zh_151

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
# Source file path is now passed via --source flag (default: hsk1)
# Set in main() before any reads happen.
SOURCE_TS: Path = PROJECT_ROOT / "src" / "data" / "zh" / "hsk2.ts"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "audio" / "zh"
MANIFEST_PATH = OUTPUT_ROOT / "manifest.json"


def output_dir_for(scope: str, gender: str) -> Path:
    """e.g. words-male, sentences-female."""
    return OUTPUT_ROOT / f"{scope}-{gender}"


def manifest_key_prefix_for(scope: str, gender: str) -> str:
    return f"{scope}-{gender}"


# Gender → CosyVoice voice. Only the two "Benchmark" voices are verified working
# on Singapore region (see voice list note below).
#
# Empirical finding (April 2026, verified by sampler script):
#   On Singapore region, ONLY voices with the "longan*" prefix work — others
#   return Engine 418 InvalidParameter. The official voice list shows ~60
#   voices per model but in practice Singapore region restricts to these.
#
#   Working voices for cosyvoice-v3-flash on Singapore (verified):
#     Male:    longanyang, longanyun_v3, longanlang_v3, longanzhi_v3
#     Female:  longanhuan, longanwen_v3, longanli_v3, longanrou_v3,
#              longantai_v3, longanran_v3, longanxuan_v3, longanqin_v3,
#              longanya_v3, longanling_v3 (all longan*_v3 likely work)
#
#   Default chosen below balances "Mandarin clarity for learning" vs
#   "natural prosody on multi-character words". longanyun_v3 reads HSK1
#   words more cleanly than the bare longanyang benchmark — verified by
#   Jason's listening test on 点 (diǎn).
VOICE_BY_GENDER = {
    "male":   "longanyun_v3",   # Homey warm-hearted male, 30-35 (PICKED by sampler test)
    "female": "longanwen_v3",   # Voice assistant — elegant intellectual female, 25-35 (Jason's pick)
}

DEFAULT_MODEL = "cosyvoice-v3-flash"

SINGAPORE_HTTP_URL = "https://dashscope-intl.aliyuncs.com/api/v1"
SINGAPORE_WS_URL = "wss://dashscope-intl.aliyuncs.com/api-ws/v1/inference"


def log(msg: str = "", end: str = "\n") -> None:
    print(msg, end=end, flush=True)


# ────────────────────────────────────────────────────────────────────────────
# HSK1 data parsing
# ────────────────────────────────────────────────────────────────────────────

def parse_hsk1() -> list[dict]:
    """
    Parse src/data/zh/hsk1.ts → list of {id, term, example} dicts.

    Regex-based to avoid Node dependency. Captures id, term (the word hanzi),
    and example (the sentence) per entry.
    """
    if not SOURCE_TS.exists():
        log(f"❌ {SOURCE_TS} not found")
        sys.exit(1)

    content = SOURCE_TS.read_text(encoding="utf-8")

    # Each entry is on its own line — match id + term, then optional example.
    # Both single and double quotes occur in the file.
    pattern = re.compile(
        r"\{\s*id:\s*['\"](zh_\d+)['\"]"
        r".*?term:\s*['\"]([^'\"]+)['\"]"
        r"(?:.*?example:\s*['\"]([^'\"]+)['\"])?",
        re.DOTALL,
    )

    items = []
    for match in pattern.finditer(content):
        wid = match.group(1)
        term = match.group(2)
        example = match.group(3)  # may be None
        items.append({"id": wid, "term": term, "example": example})

    if not items:
        log(f"❌ No words parsed from {SOURCE_TS}")
        sys.exit(1)

    return items


def build_tts_text(scope: str, term: str, example: str | None) -> str | None:
    """
    Pick the text to synthesize for a given (scope, item).

    For 'words':     Double-repeat strategy for SHORT terms (≤2 chars):
                       term="点"  →  "点，点。"
                       term="谢谢" →  "谢谢，谢谢。"
                     Longer words (3+ chars) get a simple terminal period.

                     Why: CosyVoice 3 sometimes drops characters on very short
                     input (1-2 hanzi). The model wants more acoustic mass to
                     anchor the prosody. Two repetitions is enough to stop the
                     dropping (verified empirically); a third repetition adds
                     no extra reliability and feels excessive on playback.

    For 'sentences': Pass the example as-is (already has terminal 。/？/！).

    Returns None to skip (e.g. sentence scope with no example).
    """
    if scope == "words":
        cleaned = term.rstrip("。.！!？?")
        if len(cleaned) <= 2:
            return f"{cleaned}，{cleaned}。"
        return f"{cleaned}。"

    if scope == "sentences":
        if not example:
            return None
        return example

    raise ValueError(f"Unknown scope: {scope}")


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
    wid: str,
    text: str,
    voice: str,
    model: str,
    force: bool,
    output_dir: Path,
    key_prefix: str,
    max_retries: int = 6,
) -> dict:
    """
    Generate one MP3. Same retry-with-backoff strategy as
    gen_phoneme_examples_cosyvoice_mac.py — see notes there for why.
    """
    from dashscope.audio.tts_v2 import SpeechSynthesizer

    mp3_path = output_dir / f"{wid}.mp3"
    key = f"{key_prefix}/{wid}"
    rel_path = f"{key_prefix}/{wid}.mp3"

    if mp3_path.exists() and not force:
        return {
            "id": wid,
            "key": key,
            "rel_path": rel_path,
            "text": text,
            "skipped": True,
        }

    last_err: Exception | None = None
    for attempt in range(max_retries):
        try:
            synth = SpeechSynthesizer(model=model, voice=voice)
            audio_bytes = synth.call(text)

            if audio_bytes is None or len(audio_bytes) == 0:
                raise RuntimeError(
                    f"Empty audio for {wid!r} (text={text!r})"
                )

            output_dir.mkdir(parents=True, exist_ok=True)
            mp3_path.write_bytes(audio_bytes)

            return {
                "id": wid,
                "key": key,
                "rel_path": rel_path,
                "text": text,
                "size_bytes": mp3_path.stat().st_size,
            }
        except Exception as e:
            err_msg = str(e).lower()

            # Quota / billing errors — abort the entire run, do NOT retry.
            # Retrying these wastes time and may rack up failed-call charges
            # on some plans. Surface clearly so the user sees what happened.
            is_quota_error = any(needle in err_msg for needle in (
                "quota", "balance", "insufficient", "free tier", "free quota",
                "billing", "payment", "arrears", "throttling",
            ))
            if is_quota_error:
                log(f"\n        ⛔ QUOTA/BILLING ERROR — aborting entire run")
                log(f"        Error: {e}")
                log(f"        Check: https://billing-cost.console.aliyun.com")
                raise SystemExit(2)

            is_transient = any(needle in err_msg for needle in (
                "websocket", "timeout", "could not established",
                "connection", "network",
            ))

            last_err = e
            if is_transient and attempt < max_retries - 1:
                backoff = 1.5 * (2 ** attempt)
                log(
                    f"\n        ↻ retry {attempt + 2}/{max_retries} "
                    f"after {backoff:.1f}s (transient: {type(e).__name__})",
                    end="",
                )
                time.sleep(backoff)
                continue
            raise

    raise last_err or RuntimeError("All retries exhausted")


# ────────────────────────────────────────────────────────────────────────────
# Manifest
# ────────────────────────────────────────────────────────────────────────────

def merge_manifest(new_entries: list[dict]) -> int:
    """
    Merge new entries into the existing manifest.json without nuking
    unrelated keys (DigMandarin chart, phoneme-examples, words/, etc).
    Each entry gets stored under entries[key] = {"default": rel_path}.
    """
    if MANIFEST_PATH.exists():
        existing_data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        existing = existing_data.get("entries", {})
    else:
        existing_data = {}
        existing = {}

    for entry in new_entries:
        if entry.get("skipped"):
            continue
        existing[entry["key"]] = {"default": entry["rel_path"]}

    out = {
        **existing_data,
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "total_files": len(existing),
        "entries": existing,
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return len(existing)


# ────────────────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true",
                        help="Re-generate even if MP3 already exists")
    parser.add_argument("--id", type=str, default=None,
                        help="Generate only this word id (e.g. zh_001)")
    parser.add_argument("--gender", choices=("male", "female", "both"),
                        default="both",
                        help="Voice gender (default: both)")
    parser.add_argument("--voice", default=None,
                        help="Override voice for the chosen gender(s). E.g. "
                             "--gender=male --voice=longshu_v3 to use a "
                             "different male voice than the default longanyang. "
                             "Run scripts/test_cosyvoice_voices.py first to "
                             "find which voices actually work on Singapore.")
    parser.add_argument("--scope", choices=("words", "sentences", "both"),
                        default="both",
                        help="Generate words, sentences, or both (default: both)")
    parser.add_argument("--source", default="hsk2",
                        help="Source wordlist filename without extension. "
                             "Default 'hsk2'. Use 'hsk1' for the original deck. "
                             "Resolves to src/data/zh/{source}.ts")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Model (default {DEFAULT_MODEL})")
    parser.add_argument("--delay", type=float, default=0.2,
                        help="Delay between requests in seconds")
    args = parser.parse_args()

    if not os.getenv("DASHSCOPE_API_KEY"):
        log("❌ DASHSCOPE_API_KEY not set in environment")
        return 1

    if "v3.5" in args.model:
        log(f"❌ Model '{args.model}' is Beijing-only; use cosyvoice-v3-flash.")
        return 1

    # Resolve source TS file path. Default is hsk2 (current new content);
    # pass --source=hsk1 to regen the original deck, or --source=hsk3 etc
    # once those decks land.
    global SOURCE_TS
    SOURCE_TS = PROJECT_ROOT / "src" / "data" / "zh" / f"{args.source}.ts"
    if not SOURCE_TS.exists():
        log(f"❌ Source file not found: {SOURCE_TS}")
        log(f"   Expected one of: hsk1.ts, hsk2.ts, hsk3.ts, ... in src/data/zh/")
        return 1
    log(f"📚 Source: {SOURCE_TS.name}")

    genders = ["male", "female"] if args.gender == "both" else [args.gender]
    scopes = ["words", "sentences"] if args.scope == "both" else [args.scope]

    try:
        import dashscope
    except ImportError:
        log("❌ dashscope not installed. Run: uv pip install dashscope")
        return 1
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    dashscope.base_http_api_url = SINGAPORE_HTTP_URL
    dashscope.base_websocket_api_url = SINGAPORE_WS_URL

    items = parse_hsk1()
    if args.id:
        items = [i for i in items if i["id"] == args.id]
        if not items:
            log(f"❌ No word found with id={args.id}")
            return 1

    # Estimate total files (sentences may be sparse if some words lack examples)
    sentence_count = sum(1 for i in items if i.get("example"))
    total_per_gender = 0
    if "words" in scopes:
        total_per_gender += len(items)
    if "sentences" in scopes:
        total_per_gender += sentence_count
    total_estimated = total_per_gender * len(genders)

    log("─" * 60)
    log(f"📂 Project:   {PROJECT_ROOT}")
    log(f"🤖 Model:     {args.model}")
    log(f"🚻 Genders:   {', '.join(genders)}")
    log(f"📦 Scopes:    {', '.join(scopes)}")
    log(f"📋 Items:     {len(items)} words "
        f"({sentence_count} have examples)")
    log(f"📊 Estimate:  ~{total_estimated} API calls")
    log(f"🔁 Force:     {args.force}")
    log("─" * 60)
    log()

    grand_total_new = 0
    grand_total_skipped = 0
    grand_total_failed = 0
    failed_by_combo: dict[str, list[str]] = {}

    for gender in genders:
        # If --voice was passed, use it for THIS run (regardless of gender mapping).
        # Useful when Jason picked, say, longshu_v3 from sampler and wants only
        # male files generated with that specific voice.
        # Note: passing --voice with --gender=both will use the SAME voice for
        # both folders, which usually isn't what you want — print a warning.
        if args.voice:
            if args.gender == "both":
                log(f"⚠️  --voice={args.voice} with --gender=both will write "
                    f"the same voice into both -male/ and -female/ folders. "
                    f"You probably want --gender=male or --gender=female.")
            voice = args.voice
        else:
            voice = VOICE_BY_GENDER[gender]

        for scope in scopes:
            out_dir = output_dir_for(scope, gender)
            key_prefix = manifest_key_prefix_for(scope, gender)

            log("━" * 60)
            log(f"🎤 {scope.upper()} × {gender.upper()}  "
                f"(voice={voice}, out={out_dir.name})")
            log("━" * 60)

            new_entries: list[dict] = []
            skipped = 0
            failed = 0
            failed_ids: list[str] = []

            applicable = [
                i for i in items
                if scope == "words" or (scope == "sentences" and i.get("example"))
            ]

            for i, item in enumerate(applicable, 1):
                wid = item["id"]
                term = item["term"]
                example = item.get("example")
                text = build_tts_text(scope, term, example)
                if text is None:
                    continue

                log(f"[{i:3d}/{len(applicable)}] {wid:8s}  text='{text[:30]:<30s}' ", end="")
                try:
                    entry = generate_one(
                        wid, text, voice, args.model, args.force,
                        out_dir, key_prefix,
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
                    failed_ids.append(wid)

            # Merge into manifest after each (gender, scope) combo so
            # interruptions don't lose progress.
            merge_manifest(new_entries)

            log(f"\n  → {scope}/{gender}: generated {len(new_entries) - skipped}, "
                f"skipped {skipped}, failed {failed}")
            if failed_ids:
                log(f"  → failed IDs: {failed_ids}")
                failed_by_combo[f"{scope}-{gender}"] = failed_ids

            grand_total_new += len(new_entries) - skipped
            grand_total_skipped += skipped
            grand_total_failed += failed

    log()
    log("=" * 60)
    log(f"✅ All done. Generated: {grand_total_new}, "
        f"Skipped: {grand_total_skipped}, Failed: {grand_total_failed}")
    log(f"📋 Manifest: {MANIFEST_PATH}")

    if failed_by_combo:
        log()
        log("⚠️  Some files failed. Re-run script — already-generated files will skip.")
        for combo, ids in failed_by_combo.items():
            log(f"   {combo}: {ids}")

    log()
    log("🔜 Next: `npm run build` → reload extension at chrome://extensions/")

    return 0 if grand_total_failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
