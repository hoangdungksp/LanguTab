#!/usr/bin/env python3
"""
extract_full.py — Read decompressed Anki collection.anki21 and extract
all 5000 HSK note entries to a clean JSON file.

Run from inside the extracted/ folder:
    cd ~/Downloads/anki_extract2/extracted
    python3 ../extract_full.py

Output: ~/Downloads/anki_extract2/hsk_anki_data.json
"""

import sqlite3
import json
import re
import os
from pathlib import Path

FIELDS = [
    'Key', 'Simplified', 'Traditional', 'Pinyin1', 'Pinyin2',
    'Meaning', 'POS', 'Audio', 'Homophone', 'Homograph',
    'SentenceSimplified', 'SentenceTraditional',
    'SentenceSimplifiedCloze', 'SentenceTraditionalCloze',
    'SentencePinyin1', 'SentencePinyin2', 'SentenceMeaning',
    'SentenceAudio', 'SentenceImage', 'Link1', 'Link2',
]
SEP = '\x1f'
SOUND_RE = re.compile(r'\[sound:([^\]]+)\]')
IMG_RE = re.compile(r'<img\s+src=["\']([^"\']+)["\']', re.IGNORECASE)
HTML_TAG_RE = re.compile(r'<[^>]+>')


def extract_sound(s):
    if not s:
        return None
    m = SOUND_RE.search(s)
    return m.group(1) if m else None


def extract_image(s):
    if not s:
        return None
    m = IMG_RE.search(s)
    return m.group(1) if m else None


def strip_html(text):
    if not text:
        return ''
    text = re.sub(r'<br\s*/?>|</div>', ' ', text, flags=re.IGNORECASE)
    return HTML_TAG_RE.sub('', text).strip()


def main():
    cwd = Path(os.getcwd())

    candidates = sorted(cwd.glob('collection.anki*'))
    db_file = None
    for c in candidates:
        if c.name == 'collection.anki21':
            db_file = c
            break
    if db_file is None:
        for c in candidates:
            if c.suffix in ('.anki2', '.anki21'):
                db_file = c
                break
    if db_file is None:
        print(f'ERROR: collection.anki21 not found in {cwd}')
        print('Did you run zstd -d collection.anki21b -o collection.anki21 ?')
        return

    print(f'Reading: {db_file}')
    conn = sqlite3.connect(str(db_file))
    cur = conn.cursor()

    media_path = cwd / 'media'
    if media_path.exists():
        with open(media_path, encoding='utf-8') as f:
            media_map = json.load(f)
        print(f'Media manifest: {len(media_map)} files')
        filename_to_num = {fn: num for num, fn in media_map.items()}
    else:
        print('WARN: media manifest not found.')
        filename_to_num = {}

    cur.execute('SELECT id, flds FROM notes ORDER BY id')
    rows = cur.fetchall()
    print(f'Total rows: {len(rows)}')

    output = []
    skipped_placeholder = 0
    skipped_invalid = 0

    for note_id, flds in rows:
        parts = flds.split(SEP)
        if 'Please update' in flds or 'colpkg' in flds:
            skipped_placeholder += 1
            continue
        if len(parts) < 19:
            skipped_invalid += 1
            continue

        d = dict(zip(FIELDS, parts + [''] * (21 - len(parts))))
        word_audio = extract_sound(d['Audio'])
        sentence_audio = extract_sound(d['SentenceAudio'])
        sentence_image = extract_image(d['SentenceImage'])

        entry = {
            'note_id': note_id,
            'hanzi': d['Simplified'].strip(),
            'pinyin': d['Pinyin1'].strip(),
            'pinyin_numeric': d['Pinyin2'].strip(),
            'meaning': d['Meaning'].strip(),
            'pos': d['POS'].strip(),
            'word_audio': word_audio,
            'word_audio_file_num': filename_to_num.get(word_audio) if word_audio else None,
            'sentence_zh': strip_html(d['SentenceSimplified']),
            'sentence_pinyin': strip_html(d['SentencePinyin1']),
            'sentence_meaning': strip_html(d['SentenceMeaning']),
            'sentence_audio': sentence_audio,
            'sentence_audio_file_num': filename_to_num.get(sentence_audio) if sentence_audio else None,
            'image': sentence_image,
            'image_file_num': filename_to_num.get(sentence_image) if sentence_image else None,
        }
        output.append(entry)

    conn.close()

    out_path = cwd.parent / 'hsk_anki_data.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    with_word_audio = sum(1 for e in output if e['word_audio'])
    with_sentence_audio = sum(1 for e in output if e['sentence_audio'])
    with_image = sum(1 for e in output if e['image'])
    with_sentence = sum(1 for e in output if e['sentence_zh'])

    print(f'\nExtracted: {len(output)} entries')
    print(f'Skipped placeholders: {skipped_placeholder}')
    print(f'Skipped invalid: {skipped_invalid}')
    print(f'Coverage:')
    print(f'  Word audio: {with_word_audio}/{len(output)} ({with_word_audio*100//len(output)}%)')
    print(f'  Sentence audio: {with_sentence_audio}/{len(output)} ({with_sentence_audio*100//len(output)}%)')
    print(f'  Image: {with_image}/{len(output)} ({with_image*100//len(output)}%)')
    print(f'  Sentence: {with_sentence}/{len(output)} ({with_sentence*100//len(output)}%)')
    print(f'\nOutput: {out_path}')
    print(f'Size: {out_path.stat().st_size / 1024 / 1024:.1f} MB')


if __name__ == '__main__':
    main()
