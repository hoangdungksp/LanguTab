#!/usr/bin/env python3
"""
import_to_extension.py — Match Anki HSK data with extension's HSK 1-6 wordlist
and copy audio + image files into extension folders.

v2: Outputs SPLIT JSON files matching extension code:
  - anki_index.json (small, eagerly loaded — flags + image extension)
  - anki_data.json  (larger, lazy loaded — sentence + meaning + POS)
  - Skips duplicate hanzi (Anki has 6 polyphone duplicates)

Usage:
    cd ~/Downloads/anki_extract2
    python3 import_to_extension.py /path/to/lingua-newtab
"""

import sys
import json
import shutil
from pathlib import Path
import re

DATA_FILE = Path(__file__).parent / 'hsk_anki_data.json'
MEDIA_DIR = Path(__file__).parent / 'extracted'


def setup_dirs(ext_root):
    dirs = {
        'word_audio': ext_root / 'public' / 'audio' / 'zh' / 'words-anki',
        'sentence_audio': ext_root / 'public' / 'audio' / 'zh' / 'sentences-anki',
        'images': ext_root / 'public' / 'images' / 'zh' / 'words-anki',
    }
    for d in dirs.values():
        d.mkdir(parents=True, exist_ok=True)
    return dirs


def read_extension_words(ext_root):
    """Parse hsk1.ts through hsk6.ts and return dict {hanzi: word_id}."""
    word_map = {}
    for n in range(1, 7):
        ts_file = ext_root / 'src' / 'data' / 'zh' / f'hsk{n}.ts'
        if not ts_file.exists():
            print(f'  WARN: {ts_file} not found, skipping HSK {n}')
            continue
        with open(ts_file, encoding='utf-8') as f:
            content = f.read()
        pattern = re.compile(r"id:\s*'(zh_\d+)'.*?term:\s*'([^']+)'", re.DOTALL)
        for m in pattern.finditer(content):
            word_id, term = m.group(1), m.group(2)
            word_map[term] = word_id
    print(f'Extension wordlist: {len(word_map)} words across HSK 1-6')
    return word_map


def copy_media(file_num, dest_dir, dest_name_no_ext, src_filename):
    if file_num is None:
        return None
    src = MEDIA_DIR / str(file_num)
    if not src.exists():
        return None
    ext = Path(src_filename).suffix.lower()
    if not ext:
        ext = '.mp3'
    dest = dest_dir / f'{dest_name_no_ext}{ext}'
    shutil.copy2(src, dest)
    return ext


def main():
    if len(sys.argv) < 2:
        print('Usage: python3 import_to_extension.py /path/to/lingua-newtab')
        sys.exit(1)
    ext_root = Path(sys.argv[1]).expanduser().resolve()
    if not (ext_root / 'src' / 'data' / 'zh').exists():
        print(f'ERROR: {ext_root} does not look like the extension folder')
        sys.exit(1)
    print(f'Extension root: {ext_root}')

    with open(DATA_FILE, encoding='utf-8') as f:
        anki_data = json.load(f)
    print(f'Anki entries: {len(anki_data)}')

    word_map = read_extension_words(ext_root)
    dirs = setup_dirs(ext_root)

    matched = 0
    copied_word_audio = 0
    copied_sentence_audio = 0
    copied_image = 0
    seen_word_ids = set()
    
    anki_index = {}
    anki_data_out = {}

    for entry in anki_data:
        hanzi = entry['hanzi']
        if hanzi not in word_map:
            continue
        word_id = word_map[hanzi]
        if word_id in seen_word_ids:
            continue
        seen_word_ids.add(word_id)
        matched += 1

        flags = 0
        if entry.get('word_audio_file_num'):
            ext = copy_media(
                entry['word_audio_file_num'],
                dirs['word_audio'], word_id, entry['word_audio'],
            )
            if ext:
                copied_word_audio += 1
                flags |= 1

        if entry.get('sentence_audio_file_num'):
            ext = copy_media(
                entry['sentence_audio_file_num'],
                dirs['sentence_audio'], word_id, entry['sentence_audio'],
            )
            if ext:
                copied_sentence_audio += 1
                flags |= 2

        image_ext = None
        if entry.get('image_file_num'):
            ext = copy_media(
                entry['image_file_num'],
                dirs['images'], word_id, entry['image'],
            )
            if ext:
                copied_image += 1
                flags |= 4
                image_ext = ext.lstrip('.')

        if flags > 0:
            anki_index[word_id] = {'f': flags, 'e': image_ext}

        if entry.get('sentence_zh'):
            anki_data_out[word_id] = {
                'm': entry['meaning'],
                'p': entry['pos'],
                's': entry['sentence_zh'],
                'sp': entry['sentence_pinyin'] or None,
                'se': entry['sentence_meaning'] or None,
            }

    index_file = ext_root / 'src' / 'data' / 'zh' / 'anki_index.json'
    data_file = ext_root / 'src' / 'data' / 'zh' / 'anki_data.json'
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(anki_index, f, ensure_ascii=False, separators=(',', ':'))
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(anki_data_out, f, ensure_ascii=False, separators=(',', ':'))

    print(f'\n=== Summary ===')
    print(f'Matched entries: {matched}/{len(anki_data)} ({matched*100//len(anki_data)}%)')
    print(f'Copied word audio: {copied_word_audio}')
    print(f'Copied sentence audio: {copied_sentence_audio}')
    print(f'Copied images: {copied_image}')
    print(f'\nFiles created:')
    print(f'  {dirs["word_audio"]} ({copied_word_audio} files)')
    print(f'  {dirs["sentence_audio"]} ({copied_sentence_audio} files)')
    print(f'  {dirs["images"]} ({copied_image} files)')
    print(f'  {index_file} ({len(anki_index)} entries, {index_file.stat().st_size/1024:.0f} KB)')
    print(f'  {data_file} ({len(anki_data_out)} entries, {data_file.stat().st_size/1024:.0f} KB)')

    def folder_size(p):
        if not p.exists():
            return 0
        return sum(f.stat().st_size for f in p.rglob('*') if f.is_file())
    total = folder_size(dirs['word_audio']) + folder_size(dirs['sentence_audio']) + folder_size(dirs['images'])
    print(f'\nTotal media size: {total / 1024 / 1024:.1f} MB')


if __name__ == '__main__':
    main()
