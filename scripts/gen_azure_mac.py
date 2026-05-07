#!/usr/bin/env python3
"""
LinguaNewTab — Azure Neural TTS audio generator (local Mac/Linux/Windows)

Sinh 64 file MP3 pinyin chuẩn (21 initials + 38 finals + 5 tones) dùng
Azure Neural TTS voice `zh-CN-XiaoxiaoNeural` (female, Bắc Kinh chuẩn).

Azure TTS cho Chinese dùng backend model được train trên câu đầy đủ
VÀ syllable riêng lẻ, nên tone được render chính xác cho cả single syllable.

Khác với Kokoro script, file này:
- Dùng REST API (không cần SDK)
- Dùng SSML để control prosody chính xác
- Cho pinyin syllable đơn lẻ, Azure tự xử lý tone correctly
- Chỉ cần Azure Key + Region, không cần model download

Usage:
    # Setup 1 lần: export credentials
    export AZURE_SPEECH_KEY="your_key_here"
    export AZURE_SPEECH_REGION="southeastasia"

    # Sample 10 files test
    python scripts/gen_azure_mac.py --sample

    # Full generate phonemes
    python scripts/gen_azure_mac.py --scope=phonemes

    # Generate HSK1 words (150 từ)
    python scripts/gen_azure_mac.py --scope=hsk1

    # Voice khác (default: XiaoxiaoNeural)
    python scripts/gen_azure_mac.py --sample --voice XiaoyiNeural

Setup (~5 phút):
    1. Tạo Azure account: https://azure.microsoft.com/free/
       → $200 free credit 30 ngày đầu (không dùng hết cho project này)
    2. Tạo Speech resource:
       - Portal → Create resource → search "Speech"
       - Pricing tier: Standard S0 (Pay-as-you-go) ← QUAN TRỌNG, không chọn F0
       - Region: Southeast Asia (gần VN nhất)
    3. Lấy KEY 1 + Region ở "Keys and Endpoint"
    4. Install Python deps:
       uv pip install requests  # chỉ cần 1 package
    5. Export env vars rồi chạy script

Chi phí thực tế (Neural TTS $16/1M chars):
    - 64 phonemes: ~200 chars → $0.003
    - HSK1 150 words: ~450 chars → $0.007
    - Oxford 500 words: ~2500 chars → $0.04
    - TOTAL: ~$0.07 one-time cho full dataset
    Với $200 free credit → thực tế Jason trả $0
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# ————————————————————————————————————————————
# Constants
# ————————————————————————————————————————————

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
PHONEMES_JSON = SCRIPT_DIR / "phonemes-source.json"
HSK1_TS = PROJECT_ROOT / "src" / "data" / "zh" / "hsk1.ts"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "audio" / "zh"

DEFAULT_VOICE = "XiaoxiaoNeural"  # Full name: zh-CN-XiaoxiaoNeural
DEFAULT_LOCALE = "zh-CN"

# 10 phonemes đại diện cho --sample (mix initial/final/tone để test toàn diện)
SAMPLE_IDS = [
    "zh_init_b", "zh_init_zh", "zh_init_r",
    "zh_fin_a", "zh_fin_ue", "zh_fin_iang",
    "zh_tone_1", "zh_tone_2", "zh_tone_3", "zh_tone_4",
]

# Pinyin syllables for phonemes — unlike Kokoro, Azure handles isolated syllables correctly
# Format: phoneme_id → pinyin syllable with tone mark
# For tones, we use 5 variants of "ma" as the classic pedagogical quintet
PHONEME_SYLLABLES = {
    # ————— 21 Initials — paired with tone 1 for clarity —————
    "zh_init_b":  "bō",   "zh_init_p":  "pō",   "zh_init_m":  "mō",   "zh_init_f":  "fō",
    "zh_init_d":  "dē",   "zh_init_t":  "tē",   "zh_init_n":  "nē",   "zh_init_l":  "lē",
    "zh_init_g":  "gē",   "zh_init_k":  "kē",   "zh_init_h":  "hē",
    "zh_init_j":  "jī",   "zh_init_q":  "qī",   "zh_init_x":  "xī",
    "zh_init_zh": "zhī",  "zh_init_ch": "chī",  "zh_init_sh": "shī",  "zh_init_r":  "rī",
    "zh_init_z":  "zī",   "zh_init_c":  "cī",   "zh_init_s":  "sī",
    # ————— 38 Finals — tone 1 or tone 4 for clarity —————
    "zh_fin_a":          "ā",      "zh_fin_o":          "ō",
    "zh_fin_e":          "ē",      "zh_fin_i":          "yī",
    "zh_fin_u":          "wū",     "zh_fin_u_umlaut":   "yū",
    "zh_fin_ai":         "āi",     "zh_fin_ei":         "ēi",
    "zh_fin_ao":         "āo",     "zh_fin_ou":         "ōu",
    "zh_fin_an":         "ān",     "zh_fin_en":         "ēn",
    "zh_fin_ang":        "āng",    "zh_fin_eng":        "ēng",
    "zh_fin_ing":        "yīng",   "zh_fin_ong":        "ōng",
    "zh_fin_ia":         "yā",     "zh_fin_ie":         "yē",
    "zh_fin_iao":        "yāo",    "zh_fin_iou":        "yōu",
    "zh_fin_ian":        "yān",    "zh_fin_in":         "yīn",
    "zh_fin_iang":       "yāng",   "zh_fin_iong":       "yōng",
    "zh_fin_ua":         "wā",     "zh_fin_uo":         "wō",
    "zh_fin_uai":        "wāi",    "zh_fin_uei":        "wēi",
    "zh_fin_uan":        "wān",    "zh_fin_uen":        "wēn",
    "zh_fin_uang":       "wāng",   "zh_fin_ueng":       "wēng",
    "zh_fin_ue":         "yuē",    "zh_fin_uan_u":      "yuān",
    "zh_fin_un_u":       "yūn",    "zh_fin_er":         "ēr",
    "zh_fin_i_retroflex": "zhī",   "zh_fin_i_apical":    "zī",
    # ————— 5 Tones — classic ma quintet —————
    "zh_tone_1":       "mā",   # 妈 mother
    "zh_tone_2":       "má",   # 麻 hemp
    "zh_tone_3":       "mǎ",   # 马 horse
    "zh_tone_4":       "mà",   # 骂 scold
    "zh_tone_neutral": "ma",   # 吗 question particle
}

# ————————————————————————————————————————————
# Helpers
# ————————————————————————————————————————————

def log(msg: str, end: str = "\n") -> None:
    print(msg, end=end, flush=True)


def human_size(n_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if n_bytes < 1024:
            return f"{n_bytes:.1f}{unit}"
        n_bytes /= 1024
    return f"{n_bytes:.1f}TB"


def check_ffmpeg() -> bool:
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


def load_hsk1_words() -> dict:
    """Parse src/data/zh/hsk1.ts → dict of {word_id: hanzi_term}."""
    if not HSK1_TS.exists():
        log(f"❌ {HSK1_TS} not found")
        sys.exit(1)
    content = HSK1_TS.read_text(encoding="utf-8")
    pattern = re.compile(
        r"\{\s*id:\s*['\"](zh_\d+)['\"]\s*,.*?term:\s*['\"]([^'\"]+)['\"]",
        re.DOTALL,
    )
    words = {m.group(1): m.group(2) for m in pattern.finditer(content)}
    if not words:
        log(f"❌ No words parsed from {HSK1_TS}")
        sys.exit(1)
    return words


def phoneme_subdir(pid: str) -> str:
    if pid.startswith("zh_init_"):
        return "initials"
    if pid.startswith("zh_fin_"):
        return "finals"
    if pid.startswith("zh_tone_"):
        return "tones"
    if re.match(r"^zh_\d+$", pid):
        return "words"
    raise ValueError(f"Unknown phoneme ID prefix: {pid}")


def mp3_to_path(pid: str) -> Path:
    """Route phoneme ID → output path."""
    subdir = phoneme_subdir(pid)
    return OUTPUT_ROOT / subdir / f"{pid}.mp3"


# ————————————————————————————————————————————
# Azure REST API
# ————————————————————————————————————————————

def get_azure_token(key: str, region: str) -> str:
    """
    Exchange subscription key for short-lived bearer token (10 min validity).
    Azure recommends this over sending key on every TTS request.
    """
    url = f"https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
    req = urllib.request.Request(
        url,
        method="POST",
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Length": "0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def build_ssml(text: str, voice: str, locale: str, is_pinyin: bool, rate_pct: int = -15) -> str:
    """
    Build SSML with prosody rate control.

    For pinyin syllables (e.g. "bō"), we wrap in <phoneme alphabet="sapi" ph="...">
    No — actually Azure handles pinyin with tone marks natively when input as text.
    The trick: use <break> and <prosody rate> to slow down for learner clarity.

    For Chinese hanzi (e.g. "我"), Azure auto-detects and applies correct prosody.
    """
    # Escape XML special chars in text
    safe_text = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )

    # For pinyin single syllables, add leading break to force re-initialization
    # of prosody engine — helps with tone accuracy on isolated syllables
    if is_pinyin:
        content = f'<break time="100ms"/><prosody rate="{rate_pct}%">{safe_text}</prosody><break time="100ms"/>'
    else:
        # For hanzi words/sentences, natural reading
        content = f'<prosody rate="{rate_pct}%">{safe_text}</prosody>'

    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{locale}">'
        f'<voice name="{locale}-{voice}">'
        f'{content}'
        f'</voice>'
        f'</speak>'
    )


def synthesize(
    token: str,
    region: str,
    ssml: str,
    output_path: Path,
    retry_count: int = 3,
) -> int:
    """
    Call Azure TTS REST endpoint. Returns output file size in bytes.
    Uses audio-24khz-48kbitrate-mono-mp3 format: ~6KB per second of speech.
    """
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "LinguaNewTab/1.0",
    }
    body = ssml.encode("utf-8")

    last_err = None
    for attempt in range(retry_count):
        try:
            req = urllib.request.Request(url, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=30) as resp:
                mp3_bytes = resp.read()
                output_path.parent.mkdir(parents=True, exist_ok=True)
                output_path.write_bytes(mp3_bytes)
                return len(mp3_bytes)
        except urllib.error.HTTPError as e:
            # 429 Too Many Requests → back off and retry
            if e.code == 429:
                wait = 2 ** attempt
                time.sleep(wait)
                last_err = e
                continue
            # 401 Unauthorized → token expired, caller should refresh
            if e.code == 401:
                raise TokenExpiredError()
            last_err = e
            break
        except urllib.error.URLError as e:
            last_err = e
            time.sleep(1)
            continue
    raise RuntimeError(f"Azure TTS failed after {retry_count} attempts: {last_err}")


class TokenExpiredError(Exception):
    """Raised when Azure returns 401 — caller should refresh token and retry."""
    pass


# ————————————————————————————————————————————
# Main generation logic
# ————————————————————————————————————————————

def generate_one(
    token_ref: list,  # [str] — mutable so we can refresh
    region: str,
    voice: str,
    locale: str,
    key: str,  # for token refresh
    pid: str,
    text: str,
    is_pinyin: bool,
    force: bool,
) -> dict | None:
    """Generate one audio file. Returns manifest entry."""
    mp3_path = mp3_to_path(pid)

    if mp3_path.exists() and not force:
        subdir = phoneme_subdir(pid)
        return {
            "id": pid,
            "key": f"{subdir}/{pid}",
            "rel_path": f"{subdir}/{pid}.mp3",
            "syllable": text,
            "skipped": True,
        }

    # Azure TTS: use slower rate for pinyin learning (20% slower)
    # For HSK1 words, normal rate
    rate_pct = -20 if is_pinyin else -10

    ssml = build_ssml(text, voice, locale, is_pinyin=is_pinyin, rate_pct=rate_pct)

    try:
        size = synthesize(token_ref[0], region, ssml, mp3_path)
    except TokenExpiredError:
        # Refresh and retry once
        token_ref[0] = get_azure_token(key, region)
        size = synthesize(token_ref[0], region, ssml, mp3_path)

    subdir = phoneme_subdir(pid)
    return {
        "id": pid,
        "key": f"{subdir}/{pid}",
        "rel_path": f"{subdir}/{pid}.mp3",
        "syllable": text,
        "size_bytes": size,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate Azure Neural TTS audio for LinguaNewTab",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--scope",
        choices=["phonemes", "hsk1", "all"],
        default="phonemes",
        help="Dataset to generate: phonemes (64), hsk1 (150 words), or all",
    )
    parser.add_argument("--sample", action="store_true", help="Chỉ generate 10 file test")
    parser.add_argument("--force", action="store_true", help="Overwrite files đã tồn tại")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"Voice name (default: {DEFAULT_VOICE})")
    parser.add_argument("--locale", default=DEFAULT_LOCALE, help=f"Locale (default: {DEFAULT_LOCALE})")
    args = parser.parse_args()

    # Validate env
    key = os.environ.get("AZURE_SPEECH_KEY")
    region = os.environ.get("AZURE_SPEECH_REGION")
    if not key or not region:
        log("❌ Missing environment variables. Set them before running:")
        log("")
        log('   export AZURE_SPEECH_KEY="your_azure_key"')
        log('   export AZURE_SPEECH_REGION="southeastasia"')
        log("")
        log("Lấy key tại Azure Portal → Speech resource → Keys and Endpoint")
        return 1

    log("🎙️  LinguaNewTab — Azure Neural TTS Generator")
    log(f"   Scope: {args.scope}")
    log(f"   Voice: {args.locale}-{args.voice}")
    log(f"   Region: {region}")
    log(f"   Output: {OUTPUT_ROOT}\n")

    if not check_ffmpeg():
        log("⚠️  ffmpeg không cần cho Azure (output đã là MP3), bỏ qua check")

    # Get initial token
    log("🔐 Requesting Azure access token...")
    try:
        token = get_azure_token(key, region)
    except Exception as e:
        log(f"❌ Failed to get token: {e}")
        log("\nKiểm tra:")
        log("  1. AZURE_SPEECH_KEY có đúng không (copy Key 1 từ Azure Portal)")
        log("  2. AZURE_SPEECH_REGION có đúng không (ví dụ: southeastasia, eastus)")
        log("  3. Speech resource tier là S0 (không phải F0)")
        return 1
    log("✅ Token obtained\n")
    token_ref = [token]  # mutable container for refresh

    # Build generation queue
    queue: list[tuple[str, str, bool]] = []  # (id, text, is_pinyin)

    if args.sample:
        for pid in SAMPLE_IDS:
            if pid in PHONEME_SYLLABLES:
                queue.append((pid, PHONEME_SYLLABLES[pid], True))
        log(f"🎯 Sample mode: {len(queue)} phonemes\n")
    else:
        if args.scope in ("phonemes", "all"):
            for pid, syllable in PHONEME_SYLLABLES.items():
                queue.append((pid, syllable, True))
        if args.scope in ("hsk1", "all"):
            words = load_hsk1_words()
            for pid, hanzi in words.items():
                queue.append((pid, hanzi, False))
        log(f"🎯 Full mode: {len(queue)} items (scope={args.scope})\n")

    # Prepare output dirs
    for sub in ("initials", "finals", "tones", "words"):
        (OUTPUT_ROOT / sub).mkdir(parents=True, exist_ok=True)

    # Generate
    manifest = []
    skipped = 0
    failed = 0
    token_issued_at = time.time()
    TOKEN_TTL = 540  # refresh every 9 minutes (actual TTL 10 min)

    for i, (pid, text, is_pinyin) in enumerate(queue, 1):
        # Proactive token refresh
        if time.time() - token_issued_at > TOKEN_TTL:
            try:
                token_ref[0] = get_azure_token(key, region)
                token_issued_at = time.time()
            except Exception as e:
                log(f"⚠️  Token refresh failed: {e}, continuing with stale token")

        display = text[:12] + ("…" if len(text) > 12 else "")
        log(f"[{i:3d}/{len(queue)}] {pid:18s} → {display:14s} ", end="")
        try:
            entry = generate_one(token_ref, region, args.voice, args.locale, key, pid, text, is_pinyin, args.force)
            if entry.get("skipped"):
                log("⏭  skipped (exists)")
                skipped += 1
            else:
                log(f"✓ {human_size(entry['size_bytes'])}")
                # Small delay to be polite to API (~5 req/s sustained)
                time.sleep(0.2)
            manifest.append(entry)
        except Exception as e:
            log(f"✗ FAIL: {e}")
            failed += 1

    # Merge with existing manifest if partial scope
    existing_manifest = None
    manifest_path = OUTPUT_ROOT / "manifest.json"
    if not args.sample and manifest_path.exists() and args.scope != "all":
        try:
            with open(manifest_path, encoding="utf-8") as f:
                existing_manifest = json.load(f)
        except Exception:
            existing_manifest = None

    # Write manifest
    if not args.sample:
        from datetime import datetime
        entries: dict[str, dict[str, str]] = {}
        if existing_manifest and "entries" in existing_manifest:
            entries = dict(existing_manifest["entries"])
        for entry in manifest:
            entries[entry["key"]] = {"female": entry["rel_path"]}

        manifest_out = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "voices": {"female": f"{args.locale}-{args.voice}", "male": ""},
            "speed": 0.85,
            "provider": "azure",
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
        log("\n🎧 Sample files ở public/audio/zh/. Nghe bằng:")
        log("   afplay public/audio/zh/tones/zh_tone_1.mp3")
        log("   afplay public/audio/zh/tones/zh_tone_2.mp3")
        log("   afplay public/audio/zh/tones/zh_tone_3.mp3")
        log("   afplay public/audio/zh/tones/zh_tone_4.mp3")
    else:
        total_size = sum(e.get("size_bytes", 0) for e in manifest if not e.get("skipped"))
        log(f"📦 Total size this run: {human_size(total_size)}")
        if args.scope == "phonemes":
            log("\n🔜 Next: `python scripts/gen_azure_mac.py --scope=hsk1` để sinh audio cho 150 HSK1 words")
        else:
            log("\n🔜 Next: `npm run build` để bundle audio vào extension")
    return 0


if __name__ == "__main__":
    sys.exit(main())
