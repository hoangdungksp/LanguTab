#!/usr/bin/env python3
"""
Download pinyin chart audio directly from DigMandarin.

URL pattern (confirmed by inspecting DigMandarin's pinyin chart):
  https://www.digmandarin.com/tools/sounds/{folder}/{syllable}{tone}/Audio.mp3

Folders are named after the row group's initials (concatenated, uppercase),
EXCEPT row1 which uses the literal string "row1" for the zero-initial row:
  row1   = zero-initial   (a, o, e, er, ai, ao, ..., yi, ya, ..., wu, ..., yu, ...)
  BPMF   = b/p/m/f
  DTNL   = d/t/n/l
  GKH    = g/k/h
  ZCS    = z/c/s
  ZHCHSH = zh/ch/sh/r       (note: NO trailing R — DigMandarin's folder name)
  JQX    = j/q/x

This REPLACES the earlier `download_pinyin_chart_audio.py` (davinfifield source).
DigMandarin's audio is the canonical source matching what users hear on their
website at https://www.digmandarin.com/chinese-pinyin-chart.

Usage:
  python scripts/download_digmandarin_pinyin_audio.py           # download missing only
  python scripts/download_digmandarin_pinyin_audio.py --force   # re-download everything
  python scripts/download_digmandarin_pinyin_audio.py --syllable=ma  # just one syllable × 4 tones
  python scripts/download_digmandarin_pinyin_audio.py --folder=BPMF  # only one folder

Requirements:
  pip install requests
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Optional

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests --break-system-packages")
    sys.exit(1)

BASE_URL = "https://www.digmandarin.com/tools/sounds"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " \
             "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"

# ────────────────────────────────────────────────────────────────────────────
# Folder mapping: each row in DigMandarin's chart has its own URL sub-folder
# named after the row's initials (uppercase, concatenated). row1 is the only
# one that doesn't follow this pattern — it uses the literal string "row1".
# ────────────────────────────────────────────────────────────────────────────

FOLDER_SYLLABLES: dict[str, list[str]] = {
    # row1: zero-initial — includes y-prefix (yi/ya/...) and w-prefix (wu/wa/...)
    # orthographic forms because DigMandarin places them all in the top row.
    "row1": [
        "a", "o", "e", "er", "ai", "ao", "ou", "an", "en", "ang", "eng",
        # y-compounds (zero-initial + i/ü final)
        "yi", "ya", "yao", "ye", "you", "yan", "yin", "yang", "ying", "yong",
        "yu", "yue", "yuan", "yun",
        # w-compounds (zero-initial + u final)
        "wu", "wa", "wo", "wai", "wei", "wan", "wen", "wang", "weng",
    ],
    # BPMF: b/p/m/f
    "BPMF": [
        "ba", "bo", "bi", "bai", "bei", "bao", "ban", "ben", "bang", "beng",
        "biao", "bie", "bian", "bin", "bing", "bu",
        "pa", "po", "pi", "pai", "pei", "pao", "pou", "pan", "pen", "pang",
        "peng", "piao", "pie", "pian", "pin", "ping", "pu",
        "ma", "mo", "me", "mi", "mai", "mei", "mao", "mou", "man", "men",
        "mang", "meng", "miao", "mie", "miu", "mian", "min", "ming", "mu",
        "fa", "fo", "fei", "fou", "fan", "fen", "fang", "feng", "fu",
    ],
    # DTNL: d/t/n/l (includes nü, lü which may need URL-encoding)
    "DTNL": [
        "da", "de", "di", "dai", "dei", "dao", "dou", "dan", "den", "dang",
        "deng", "dong", "diao", "die", "diu", "dian", "ding", "du", "duo",
        "dui", "duan", "dun",
        "ta", "te", "ti", "tai", "tao", "tou", "tan", "tang", "teng", "tong",
        "tiao", "tie", "tian", "ting", "tu", "tuo", "tui", "tuan", "tun",
        "na", "ne", "ni", "nai", "nei", "nao", "nou", "nan", "nen", "nang",
        "neng", "nong", "niao", "nie", "niu", "nian", "nin", "niang", "ning",
        "nu", "nuo", "nuan", "nü", "nüe",
        "la", "le", "li", "lai", "lei", "lao", "lou", "lan", "lang", "leng",
        "long", "lia", "liao", "lie", "liu", "lian", "lin", "liang", "ling",
        "lu", "luo", "luan", "lun", "lü", "lüe",
    ],
    # GKH: g/k/h
    "GKH": [
        "ga", "ge", "gai", "gei", "gao", "gou", "gan", "gen", "gang", "geng",
        "gong", "gu", "gua", "guo", "guai", "gui", "guan", "gun", "guang",
        "ka", "ke", "kai", "kei", "kao", "kou", "kan", "ken", "kang", "keng",
        "kong", "ku", "kua", "kuo", "kuai", "kui", "kuan", "kun", "kuang",
        "ha", "he", "hai", "hei", "hao", "hou", "han", "hen", "hang", "heng",
        "hong", "hu", "hua", "huo", "huai", "hui", "huan", "hun", "huang",
    ],
    # ZCS: z/c/s
    "ZCS": [
        "za", "ze", "zi", "zai", "zei", "zao", "zou", "zan", "zen", "zang",
        "zeng", "zong", "zu", "zuo", "zui", "zuan", "zun",
        "ca", "ce", "ci", "cai", "cao", "cou", "can", "cen", "cang", "ceng",
        "cong", "cu", "cuo", "cui", "cuan", "cun",
        "sa", "se", "si", "sai", "sao", "sou", "san", "sen", "sang", "seng",
        "song", "su", "suo", "sui", "suan", "sun",
    ],
    # ZHCHSH: zh/ch/sh/r — note: folder name has NO trailing R, but R syllables
    # ARE stored under this folder per DigMandarin's grouping.
    "ZHCHSH": [
        "zha", "zhe", "zhi", "zhai", "zhei", "zhao", "zhou", "zhan", "zhen",
        "zhang", "zheng", "zhong", "zhu", "zhua", "zhuo", "zhuai", "zhui",
        "zhuan", "zhun", "zhuang",
        "cha", "che", "chi", "chai", "chao", "chou", "chan", "chen", "chang",
        "cheng", "chong", "chu", "chua", "chuo", "chuai", "chui", "chuan",
        "chun", "chuang",
        "sha", "she", "shi", "shai", "shei", "shao", "shou", "shan", "shen",
        "shang", "sheng", "shu", "shua", "shuo", "shuai", "shui", "shuan",
        "shun", "shuang",
        "re", "ri", "rao", "rou", "ran", "ren", "rang", "reng", "rong", "ru",
        "rua", "ruo", "rui", "ruan", "run",
    ],
    # JQX: j/q/x (ü written as u in j/q/x + ü context per pinyin orthography)
    "JQX": [
        "ji", "jia", "jie", "jiao", "jiu", "jian", "jin", "jiang", "jing",
        "jiong", "ju", "jue", "juan", "jun",
        "qi", "qia", "qie", "qiao", "qiu", "qian", "qin", "qiang", "qing",
        "qiong", "qu", "que", "quan", "qun",
        "xi", "xia", "xie", "xiao", "xiu", "xian", "xin", "xiang", "xing",
        "xiong", "xu", "xue", "xuan", "xun",
    ],
}

TONES = [1, 2, 3, 4]

# Paths relative to project root
PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / "public" / "audio" / "zh" / "pinyin-chart"
MANIFEST_PATH = PROJECT_ROOT / "public" / "audio" / "zh" / "manifest.json"


def digmandarin_url_syllable(syllable: str) -> str:
    """
    Convert syllable for DigMandarin URL path.
    DigMandarin's URL almost certainly uses ASCII — try 'v' for ü first (common
    convention). If DigMandarin uses raw ü or 'u', adjust here after testing.
    """
    return syllable.replace("ü", "v")


def local_filename(syllable: str, tone: int) -> str:
    """Local filename preserves ü as Unicode so the filename matches the chart
    data (which uses ü for display and manifest key lookup)."""
    return f"{syllable}{tone}.mp3"


def download_one(url: str, dest: Path, session: requests.Session) -> Optional[str]:
    """
    Download one MP3. Returns None on success, or an error message string.
    """
    try:
        r = session.get(url, timeout=15)
        if r.status_code == 200 and r.content:
            # Sanity check: DigMandarin MP3s should be at least a few KB
            if len(r.content) < 500:
                return f"suspicious size {len(r.content)} bytes"
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(r.content)
            return None
        return f"HTTP {r.status_code}"
    except requests.exceptions.Timeout:
        return "timeout"
    except Exception as e:
        return f"{type(e).__name__}: {e}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true",
                        help="Re-download existing files")
    parser.add_argument("--syllable", type=str, default=None,
                        help="Only download this one syllable (all 4 tones)")
    parser.add_argument("--row", type=str, default=None,
                        help="(Deprecated alias for --folder)")
    parser.add_argument("--folder", type=str, default=None,
                        help="Only download this folder (e.g. 'BPMF', 'row1')")
    parser.add_argument("--delay", type=float, default=0.15,
                        help="Delay in seconds between requests (default 0.15)")
    parser.add_argument("--verify", action="store_true",
                        help="Audit manifest against expected files. Reports missing entries and missing files without downloading.")
    args = parser.parse_args()

    # Back-compat: --row was the old name; treat it as --folder
    folder_filter = args.folder or args.row

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── Verify mode: just audit, don't download ──
    if args.verify:
        manifest_v = {"entries": {}}
        if MANIFEST_PATH.exists():
            try:
                manifest_v = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
                manifest_v.setdefault("entries", {})
            except json.JSONDecodeError:
                print(f"ERROR: cannot parse {MANIFEST_PATH}")
                return 1

        missing_files: list[str] = []
        missing_entries: list[str] = []
        wrong_format: list[str] = []
        ok_count = 0

        for folder, syllables in FOLDER_SYLLABLES.items():
            for syl in syllables:
                for tone in TONES:
                    key = f"pinyin-chart/{syl}{tone}"
                    fname = local_filename(syl, tone)
                    file_path = OUTPUT_DIR / fname
                    file_exists = file_path.exists() and file_path.stat().st_size > 500
                    entry = manifest_v["entries"].get(key)
                    entry_ok = isinstance(entry, dict) and "default" in entry

                    if not file_exists:
                        missing_files.append(f"{folder}/{syl}{tone}")
                    if entry is None:
                        missing_entries.append(f"{folder}/{syl}{tone}")
                    elif not entry_ok:
                        wrong_format.append(f"{folder}/{syl}{tone}  (got {type(entry).__name__})")
                    if file_exists and entry_ok:
                        ok_count += 1

        print("═" * 60)
        print(f"VERIFY MODE — auditing manifest and audio files")
        print("═" * 60)
        print(f"OK (file + manifest entry both valid): {ok_count}")
        print(f"Missing files: {len(missing_files)}")
        print(f"Missing manifest entries: {len(missing_entries)}")
        print(f"Wrong-format entries (string instead of object): {len(wrong_format)}")
        print()
        if missing_entries:
            print("First 30 missing manifest entries:")
            for x in missing_entries[:30]:
                print(f"  {x}")
            if len(missing_entries) > 30:
                print(f"  ... and {len(missing_entries) - 30} more")
            print()
            print("→ Run script normally (without --verify) to fix.")
        return 0 if (not missing_files and not missing_entries and not wrong_format) else 1

    # Load existing manifest or create fresh
    manifest: dict = {"version": 1, "entries": {}}
    if MANIFEST_PATH.exists():
        try:
            manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
            manifest.setdefault("entries", {})
        except json.JSONDecodeError:
            print(f"WARNING: could not parse {MANIFEST_PATH}, starting fresh")

    # Migrate any existing pinyin-chart entries that were written in the old
    # buggy string format. The audioService expects objects with default/normal/
    # slow keys; raw strings cause silent Web Speech fallback for every click.
    migrated = 0
    for k, v in list(manifest["entries"].items()):
        if k.startswith("pinyin-chart/") and isinstance(v, str):
            manifest["entries"][k] = {"default": v}
            migrated += 1
    if migrated:
        print(f"Migrated {migrated} old string entries to object format")

    session = requests.Session()
    session.headers.update({
        "User-Agent": USER_AGENT,
        # DigMandarin's CDN appears to check Referer; sending the chart page
        # URL prevents 403 errors that occur for "naked" requests.
        "Referer": "https://www.digmandarin.com/chinese-pinyin-chart",
    })

    total_ok = 0
    total_skip = 0
    total_healed = 0
    total_fail = 0
    failed_urls: list[tuple[str, str]] = []

    for folder, syllables in FOLDER_SYLLABLES.items():
        if folder_filter and folder != folder_filter:
            continue

        print(f"\n── {folder} ────────────────────────────────────────────")
        for syl in syllables:
            if args.syllable and syl != args.syllable:
                continue

            for tone in TONES:
                url_syl = digmandarin_url_syllable(syl)
                url = f"{BASE_URL}/{folder}/{url_syl}{tone}/Audio.mp3"
                dest = OUTPUT_DIR / local_filename(syl, tone)

                if dest.exists() and not args.force:
                    # File already on disk. But the manifest entry may be
                    # missing if a previous run crashed or if the entry was
                    # written in the old buggy string format and lost during
                    # a manual edit. Self-heal: ensure manifest entry exists
                    # for every existing file.
                    key = f"pinyin-chart/{syl}{tone}"
                    if key not in manifest["entries"]:
                        manifest["entries"][key] = {
                            "default": f"pinyin-chart/{local_filename(syl, tone)}"
                        }
                        total_healed += 1
                    total_skip += 1
                    continue

                err = download_one(url, dest, session)
                if err is None:
                    total_ok += 1
                    key = f"pinyin-chart/{syl}{tone}"
                    # Manifest entries must be objects with default/normal/slow
                    # keys per audioService.ts AudioManifestEntry interface.
                    # Writing a raw string here causes resolveVariant() to
                    # return null and silently fall back to Web Speech for
                    # every syllable → robot voice instead of DigMandarin's
                    # native audio.
                    manifest["entries"][key] = {
                        "default": f"pinyin-chart/{local_filename(syl, tone)}"
                    }
                    # Minimal progress output so you can see it's working
                    if total_ok % 20 == 0:
                        print(f"  [{total_ok} downloaded]  last: {syl}{tone}")
                else:
                    total_fail += 1
                    failed_urls.append((url, err))
                    print(f"  FAIL {syl}{tone} ({err}): {url}")

                time.sleep(args.delay)

    # Save updated manifest
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print()
    print("═" * 60)
    print(f"Downloaded: {total_ok}")
    print(f"Skipped (already exist): {total_skip}")
    print(f"Healed (file existed but manifest entry missing): {total_healed}")
    print(f"Failed: {total_fail}")
    print(f"Manifest: {MANIFEST_PATH}")
    print(f"Total manifest entries: {len(manifest['entries'])}")

    if failed_urls:
        print()
        print("First 10 failures for debugging:")
        for url, err in failed_urls[:10]:
            print(f"  {err}  →  {url}")
        print()
        print("If failures look systematic (e.g. all ü-syllables fail), the URL")
        print("encoding for ü might be different on DigMandarin. Try opening one")
        print("of the failing URLs in your browser to see what they expect.")

    return 0 if total_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
