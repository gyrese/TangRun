"""Extract separated generated silhouettes, preserving their original alpha."""
from pathlib import Path
from collections import deque
import json
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'assets/source/reunion-v6.png'
image = Image.open(source).convert('RGBA')
width, height = image.size
alpha = image.getchannel('A')
mask = bytearray(1 if a > 100 else 0 for a in alpha.getdata())
components = []
for start in range(len(mask)):
    if not mask[start]:
        continue
    pending = deque([start]); mask[start] = 0; pixels = []
    while pending:
        pos = pending.popleft(); pixels.append(pos)
        x, y = pos % width, pos // width
        for nxt in (pos-1 if x else -1, pos+1 if x+1 < width else -1,
                    pos-width if y else -1, pos+width if y+1 < height else -1):
            if nxt >= 0 and mask[nxt]:
                mask[nxt] = 0; pending.append(nxt)
    if len(pixels) > 3000:
        components.append(pixels)
assert len(components) >= 6, f'Expected 6 separate props, got {len(components)}'
names = ['lava','tamarin','case-creole','fern','vacoa','pirogue']
out = ROOT / 'public/assets/v6'; out.mkdir(parents=True, exist_ok=True)
manifest = []
for index, name in enumerate(names):
    target = ((index % 3 + .5)*width/3,(index//3+.5)*height/2)
    component = min(components, key=lambda p: (sum(i % width for i in p)/len(p)-target[0])**2 + (sum(i//width for i in p)/len(p)-target[1])**2)
    components.remove(component)
    xs = [i % width for i in component]; ys = [i//width for i in component]
    box = (max(0,min(xs)-2),max(0,min(ys)-2),min(width,max(xs)+3),min(height,max(ys)+3))
    data = bytearray(width*height)
    for i in component:
        x,y=i%width,i//width
        for dy in (-1,0,1):
            for dx in (-1,0,1):
                xx,yy=x+dx,y+dy
                if 0<=xx<width and 0<=yy<height:data[yy*width+xx]=255
    isolated = Image.frombytes('L',image.size,bytes(data))
    result=image.copy(); result.putalpha(ImageChops.multiply(alpha,isolated)); result=result.crop(box)
    result.thumbnail((420,360),Image.Resampling.NEAREST)
    result.save(out / f'{name}.png',optimize=True)
    manifest.append({'key':name,'file':f'public/assets/v6/{name}.png','size':list(result.size),'source':str(source.relative_to(ROOT)),'crop':box})
(ROOT/'assets/manifest-v6.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest,indent=2))
