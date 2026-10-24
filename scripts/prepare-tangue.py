"""Normalize the generated 4x4 tangue sheet into the game's 64px atlases."""
from pathlib import Path
from PIL import Image
import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--version', default='v1', choices=['v1', 'v2'])
version = parser.parse_args().version

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / f'assets/source/tangue-{version}.png'
image = Image.open(source).convert('RGBA')
image.putalpha(image.getchannel('A').point(lambda value: 255 if value >= 180 else 0))
frames = []
columns = [round(x*image.width/4) for x in range(5)]
rows = [round(y*image.height/4) for y in range(5)]
if version == 'v2':
    # The generated sheet uses taller running rows and a compact rolling row.
    assert image.size == (1269, 1240)
    columns = [0, 333, 670, 966, 1269]
    rows = [0, 333, 667, 915, 1240]
for i in range(16):
    x, y = i % 4, i // 4
    frame = image.crop((columns[x], rows[y], columns[x+1], rows[y+1]))
    bounds = frame.getchannel('A').getbbox()
    assert bounds, f'Empty frame {i}'
    frames.append(frame.crop(bounds))
scale = min(58/max(f.width for f in frames), 54/max(f.height for f in frames))
out = ROOT / 'public/assets/tangue'
out.mkdir(parents=True, exist_ok=True)
for name, indices in [('run', [0,1,2,3,4,5]), ('extras', [8,9,10,11,12,13,14,15])]:
    atlas = Image.new('RGBA', (64*len(indices),64))
    for cell, index in enumerate(indices):
        f = frames[index]
        f = f.resize((max(1,round(f.width*scale)),max(1,round(f.height*scale))),Image.Resampling.NEAREST)
        y = (64-f.height)//2 if name == 'extras' and cell < 4 else 62-f.height
        atlas.paste(f,(cell*64+(64-f.width)//2,y))
    atlas.save(out / f'{name}-{version}.png')
(ROOT/f'assets/manifest-tangue-{version}.json').write_text(json.dumps({
    'character':'Tangue de La Réunion','tool':'built-in ImageGen',
    'source':f'assets/source/tangue-{version}.png','frameSize':[64,64],
    'run':[0,1,2,3,4,5],'extras':[8,9,10,11,12,13,14,15],
    'previousCharacterBackup':'backups/chat-2026-10-24',
},ensure_ascii=False,indent=2),encoding='utf-8')
