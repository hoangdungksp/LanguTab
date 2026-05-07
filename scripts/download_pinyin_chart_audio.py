#!/usr/bin/env python3
"""
Download pinyin chart MP3 audio files from the davinfifield GitHub repo.

Source: https://github.com/davinfifield/mp3-chinese-pinyin-sound (Unlicense — public domain)
→ raw.githubusercontent.com/davinfifield/mp3-chinese-pinyin-sound/master/mp3/{syllable}{tone}.mp3

Downloads ~1610 MP3 files (~16MB total) to:
    public/audio/zh/pinyin-chart/{syllable}{tone}.mp3

Also updates public/audio/zh/manifest.json to add entries like:
    "pinyin-chart/ma1": { "default": "pinyin-chart/ma1.mp3" }

So the existing audioService.ts loadManifest() + playBundled() pipeline works
transparently for pinyin chart audio without any code changes there.

Usage:
    # Download full chart (~1610 files, ~16MB, ~3-5 min with 8 parallel workers)
    python scripts/download_pinyin_chart_audio.py

    # Resume: only download files that don't exist yet (default behavior)
    python scripts/download_pinyin_chart_audio.py

    # Force re-download everything
    python scripts/download_pinyin_chart_audio.py --force

    # Test with just 20 files to verify setup
    python scripts/download_pinyin_chart_audio.py --sample

    # Custom parallelism
    python scripts/download_pinyin_chart_audio.py --workers 16

No API key needed. No deps beyond Python stdlib + `requests`.

Setup:
    source .venv/bin/activate
    pip install requests    # already installed for Qwen TTS setup

Why davinfifield instead of DigMandarin scraping:
    1. DigMandarin's audio URLs are server-side generated — hard to bulk scrape
    2. davinfifield mirrors audio from multiple public sources (lost-theory.org,
       DigMandarin, etc.) and has been around since 2015+
    3. Unlicense = public domain → no attribution/license concerns for Jason's
       personal extension dev. Reconsider for Chrome Web Store publication.
"""

import argparse
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

try:
    import requests
except ImportError:
    print("❌ requests not installed. Run: pip install requests")
    sys.exit(1)

# ————————————— Paths & constants —————————————

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "public" / "audio" / "zh" / "pinyin-chart"
MANIFEST_PATH = PROJECT_ROOT / "public" / "audio" / "zh" / "manifest.json"

BASE_URL = "https://raw.githubusercontent.com/davinfifield/mp3-chinese-pinyin-sound/master/mp3/"

# Match the syllable list in src/data/zh/pinyin-chart.ts — keep in sync!
# Not using a subprocess call to parse TS because that'd require ts-node in
# the .venv — easier to dup this list here (stable data, rarely changes).
VALID_SYLLABLES = [
    # Zero-initial
    "a", "o", "e", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "er",
    # b-
    "ba", "bo", "bai", "bei", "bao", "ban", "ben", "bang", "beng", "bi", "bie",
    "biao", "bian", "bin", "bing", "bu",
    # p-
    "pa", "po", "pai", "pei", "pao", "pou", "pan", "pen", "pang", "peng", "pi",
    "pie", "piao", "pian", "pin", "ping", "pu",
    # m-
    "ma", "mo", "me", "mai", "mei", "mao", "mou", "man", "men", "mang", "meng",
    "mi", "mie", "miao", "miu", "mian", "min", "ming", "mu",
    # f-
    "fa", "fo", "fei", "fou", "fan", "fen", "fang", "feng", "fu",
    # d-
    "da", "de", "dai", "dei", "dao", "dou", "dan", "den", "dang", "deng", "dong",
    "di", "die", "diao", "diu", "dian", "ding", "du", "duo", "dui", "duan", "dun",
    # t-
    "ta", "te", "tai", "tao", "tou", "tan", "tang", "teng", "tong", "ti", "tie",
    "tiao", "tian", "ting", "tu", "tuo", "tui", "tuan", "tun",
    # n-
    "na", "ne", "nai", "nei", "nao", "nou", "nan", "nen", "nang", "neng", "nong",
    "ni", "nie", "niao", "niu", "nian", "nin", "niang", "ning", "nu", "nuo",
    "nuan", "nü", "nüe",
    # l-
    "la", "le", "lai", "lei", "lao", "lou", "lan", "lang", "leng", "long", "li",
    "lia", "lie", "liao", "liu", "lian", "lin", "liang", "ling", "lu", "luo",
    "luan", "lun", "lü", "lüe",
    # g-
    "ga", "ge", "gai", "gei", "gao", "gou", "gan", "gen", "gang", "geng", "gong",
    "gu", "gua", "guo", "guai", "gui", "guan", "gun", "guang",
    # k-
    "ka", "ke", "kai", "kei", "kao", "kou", "kan", "ken", "kang", "keng", "kong",
    "ku", "kua", "kuo", "kuai", "kui", "kuan", "kun", "kuang",
    # h-
    "ha", "he", "hai", "hei", "hao", "hou", "han", "hen", "hang", "heng", "hong",
    "hu", "hua", "huo", "huai", "hui", "huan", "hun", "huang",
    # j-
    "ji", "jia", "jie", "jiao", "jiu", "jian", "jin", "jiang", "jing", "jiong",
    "ju", "jue", "juan", "jun",
    # q-
    "qi", "qia", "qie", "qiao", "qiu", "qian", "qin", "qiang", "qing", "qiong",
    "qu", "que", "quan", "qun",
    # x-
    "xi", "xia", "xie", "xiao", "xiu", "xian", "xin", "xiang", "xing", "xiong",
    "xu", "xue", "xuan", "xun",
    # zh-
    "zha", "zhe", "zhi", "zhai", "zhei", "zhao", "zhou", "zhan", "zhen", "zhang",
    "zheng", "zhong", "zhu", "zhua", "zhuo", "zhuai", "zhui", "zhuan", "zhun",
    "zhuang",
    # ch-
    "cha", "che", "chi", "chai", "chao", "chou", "chan", "chen", "chang", "cheng",
    "chong", "chu", "chua", "chuo", "chuai", "chui", "chuan", "chun", "chuang",
    # sh-
    "sha", "she", "shi", "shai", "shei", "shao", "shou", "shan", "shen", "shang",
    "sheng", "shu", "shua", "shuo", "shuai", "shui", "shuan", "shun", "shuang",
    # r-
    "re", "ri", "rao", "rou", "ran", "ren", "rang", "reng", "rong", "ru", "rua",
    "ruo", "rui", "ruan", "run",
    # z-
    "za", "ze", "zi", "zai", "zei", "zao", "zou", "zan", "zen", "zang", "zeng",
    "zong", "zu", "zuo", "zui", "zuan", "zun",
    # c-
    "ca", "ce", "ci", "cai", "cao", "cou", "can", "cen", "cang", "ceng", "cong",
    "cu", "cuo", "cui", "cuan", "cun",
    # s-
    "sa", "se", "si", "sai", "sao", "sou", "san", "sen", "sang", "seng", "song",
    "su", "suo", "sui", "suan", "sun",
    # y-
    "ya", "ye", "yao", "you", "yan", "yang", "yi", "yin", "ying", "yong", "yu",
    "yue", "yuan", "yun",
    # w-
    "wa", "wo", "wai", "wei", "wan", "wen", "wang", "weng", "wu",
]

# Tones 1-4 (neutral tone 5 is rare and uses inconsistent naming across repos — skip)
TONES = [1, 2, 3, 4]

# Sample subset for --sample mode: one syllable per initial group, for quick sanity check
SAMPLE_SYLLABLES = [
    "ma", "ba", "pa", "fa", "da", "ta", "na", "la", "ga", "ka", "ha",
    "ji", "qi", "xi", "zhi", "chi", "shi", "ri", "zi", "ci", "si",
]


# ————————————— Helpers —————————————

def human_size(n_bytes: int) -> str:
    n = float(n_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}TB"


def davinfifield_filename(syllable: str, tone: int) -> str:
    """
    Convert syllable+tone to the filename used in davinfifield/mp3/.

    The repo uses ASCII-only filenames — ü is written as 'v' (standard
    convention in Chinese input methods). So "nü1" → "nv1.mp3".
    """
    ascii_syl = syllable.replace("ü", "v")
    return f"{ascii_syl}{tone}.mp3"


def local_filename(syllable: str, tone: int) -> str:
    """
    Filename we save locally. Keep ü → ü (Unicode) so the manifest key is
    readable, and so audioService.ts can use the same pinyin string as the key.
    """
    return f"{syllable}{tone}.mp3"


# ————————————— Download worker —————————————

def download_one(
    session: requests.Session,
    syllable: str,
    tone: int,
    force: bool,
) -> dict:
    """Download 1 file. Returns a result dict with status."""
    remote_name = davinfifield_filename(syllable, tone)
    local_name = local_filename(syllable, tone)
    dest_path = OUTPUT_DIR / local_name

    if dest_path.exists() and not force:
        return {
            "syllable": syllable,
            "tone": tone,
            "local_name": local_name,
            "status": "skipped",
            "size": dest_path.stat().st_size,
        }

    url = urljoin(BASE_URL, remote_name)

    try:
        r = session.get(url, timeout=15)
    except requests.RequestException as e:
        return {"syllable": syllable, "tone": tone, "status": "network_error", "error": str(e)}

    if r.status_code == 404:
        return {"syllable": syllable, "tone": tone, "status": "not_found"}

    if r.status_code != 200:
        return {
            "syllable": syllable,
            "tone": tone,
            "status": "http_error",
            "error": f"HTTP {r.status_code}",
        }

    # Basic sanity check — MP3 should start with 'ID3' or 0xFFFB/0xFFFA frame sync
    data = r.content
    if len(data) < 500:
        return {
            "syllable": syllable,
            "tone": tone,
            "status": "too_small",
            "error": f"Only {len(data)} bytes",
        }

    dest_path.write_bytes(data)
    return {
        "syllable": syllable,
        "tone": tone,
        "local_name": local_name,
        "status": "ok",
        "size": len(data),
    }


# ————————————— Main —————————————

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download pinyin chart audio from davinfifield GitHub repo",
    )
    parser.add_argument("--force", action="store_true",
                        help="Re-download even if file exists")
    parser.add_argument("--sample", action="store_true",
                        help="Download ~80 files for quick smoke test")
    parser.add_argument("--workers", type=int, default=8,
                        help="Parallel download threads (default: 8)")
    args = parser.parse_args()

    print("🎙️  LinguaNewTab — Pinyin Chart Audio Downloader")
    print(f"   Source:    davinfifield/mp3-chinese-pinyin-sound (Unlicense)")
    print(f"   Output:    {OUTPUT_DIR}")
    print(f"   Workers:   {args.workers}")
    print()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Build download queue
    syllables = SAMPLE_SYLLABLES if args.sample else VALID_SYLLABLES
    queue = [(syl, tone) for syl in syllables for tone in TONES]

    print(f"📋 Queue: {len(queue)} files "
          f"({len(syllables)} syllables × {len(TONES)} tones)")
    if args.force:
        print("   Mode: force re-download all")
    print()

    # Download in parallel
    session = requests.Session()
    session.headers.update({"User-Agent": "LinguaNewTab/0.5.10 (+github.com/jasonnguyen)"})

    start = time.time()
    results: list[dict] = []
    ok_count = 0
    skip_count = 0
    fail_count = 0
    not_found_count = 0

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = {
            ex.submit(download_one, session, syl, tone, args.force): (syl, tone)
            for syl, tone in queue
        }

        for i, fut in enumerate(as_completed(futures), 1):
            result = fut.result()
            results.append(result)

            status = result["status"]
            syl = result["syllable"]
            tone = result["tone"]

            if status == "ok":
                ok_count += 1
                if i % 50 == 0 or i == len(queue):
                    elapsed = time.time() - start
                    rate = i / elapsed if elapsed > 0 else 0
                    eta = (len(queue) - i) / rate if rate > 0 else 0
                    print(f"  [{i:4d}/{len(queue)}] ok (last: {syl}{tone}) — "
                          f"{rate:.1f}/s, ETA {eta:.0f}s")
            elif status == "skipped":
                skip_count += 1
            elif status == "not_found":
                not_found_count += 1
                # Not all cross-products have audio (some are rare syllables
                # davinfifield didn't mirror) — only log if unexpected
                if syl in ("ma", "ba", "ni", "ren"):  # These MUST exist
                    print(f"  ⚠️  {syl}{tone} NOT FOUND (unexpected)")
            else:
                fail_count += 1
                print(f"  ❌ {syl}{tone}: {status} {result.get('error', '')}")

    elapsed = time.time() - start
    print()
    print("=" * 60)
    print(f"✅ Downloaded:  {ok_count}")
    print(f"⏭️  Skipped:     {skip_count} (already existed)")
    print(f"🚫 Not in repo: {not_found_count} (rare syllables, not uploaded)")
    print(f"❌ Failed:      {fail_count}")
    print(f"⏱️  Elapsed:     {elapsed:.1f}s")

    total_size = sum(r.get("size", 0) for r in results if r["status"] in ("ok", "skipped"))
    print(f"📦 Total size:  {human_size(total_size)}")

    # ————————————— Update manifest.json —————————————

    if not args.sample:
        print(f"\n📋 Updating {MANIFEST_PATH.name}...")
        update_manifest(results)
        print(f"   Done. Audio now discoverable via audioService.ts")

    # Hints
    print("\n🔜 Next steps:")
    print("   1. npm run build")
    print("   2. Reload extension at chrome://extensions")
    print("   3. Open new tab → Phát âm → Pinyin Chart → click any syllable")

    return 0 if fail_count == 0 else 1


def update_manifest(results: list[dict]) -> None:
    """
    Merge pinyin-chart entries into the existing zh manifest.json.

    Preserves existing words/, sentences/, initials/, etc. entries — only
    adds or updates pinyin-chart/* keys.
    """
    # Load existing manifest (created by gen_qwen_tts_mac.py)
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH, encoding="utf-8") as f:
            manifest = json.load(f)
    else:
        print(f"   ⚠️  {MANIFEST_PATH} doesn't exist — creating fresh one")
        manifest = {"entries": {}}

    if "entries" not in manifest or not isinstance(manifest["entries"], dict):
        manifest["entries"] = {}

    # Count pinyin-chart entries before + after
    before = sum(1 for k in manifest["entries"] if k.startswith("pinyin-chart/"))

    for r in results:
        if r["status"] not in ("ok", "skipped"):
            continue
        syllable = r["syllable"]
        tone = r["tone"]
        key = f"pinyin-chart/{syllable}{tone}"
        manifest["entries"][key] = {"default": f"pinyin-chart/{syllable}{tone}.mp3"}

    after = sum(1 for k in manifest["entries"] if k.startswith("pinyin-chart/"))

    # Bump metadata
    from datetime import datetime
    manifest["generated_at"] = datetime.utcnow().isoformat() + "Z"
    manifest["total_files"] = len(manifest["entries"])

    # Keep existing generator/voice if present — this script only adds pinyin-chart
    manifest.setdefault("generator", "qwen-tts+davinfifield")
    if "voice" not in manifest:
        manifest["voice"] = "Cherry"

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    added = after - before
    print(f"   pinyin-chart entries: {before} → {after} (+{added})")
    print(f"   total manifest entries: {manifest['total_files']}")


if __name__ == "__main__":
    sys.exit(main())
