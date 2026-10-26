"""Export the pop-culture tangue without changing the previous character assets."""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'assets/source/tangue-pop-v4.png'
image=Image.open(source).convert('RGBA')
image.putalpha(image.getchannel('A').point(lambda value:255 if value>=180 else 0))
frames=[]
# The source reserves less vertical space for the compact rolling poses.
assert image.size==(1254,1254)
columns=[0,323,638,949,1254]
rows=[0,323,644,894,1254]
for i in range(16):
    x,y=i%4,i//4
    frames.append(image.crop((columns[x],rows[y],columns[x+1],rows[y+1])))
bounds=[f.getbbox() for f in frames]
assert all(bounds), 'Every pose must contain visible pixels'
# Shared registration for every running frame, so arm/foot movement cannot shift the body.
run_box=(min(b[0] for b in bounds[:8]),min(b[1] for b in bounds[:8]),max(b[2] for b in bounds[:8]),max(b[3] for b in bounds[:8]))
scale=min(58/max(b[2]-b[0] for b in bounds),54/max(b[3]-b[1] for b in bounds),58/(run_box[2]-run_box[0]),54/(run_box[3]-run_box[1]))
out=ROOT/'public/assets/tangue'
out.mkdir(parents=True,exist_ok=True)
def export(name,indices):
    atlas=Image.new('RGBA',(64*len(indices),64))
    for cell,index in enumerate(indices):
        box=run_box if index<8 else bounds[index]
        f=frames[index].crop(box)
        f=f.resize((max(1,round(f.width*scale)),max(1,round(f.height*scale))),Image.Resampling.NEAREST)
        y=(64-f.height)//2 if 8<=index<12 else 62-f.height
        atlas.paste(f,(cell*64+(64-f.width)//2,y))
    atlas.save(out/f'{name}-pop-v4.png')
export('run-cycle',list(range(8)))
export('run',[12,0,2,4,6,3])
export('extras',list(range(8,16)))
preview=Image.new('RGBA',(64*8,64*2),'#193139')
for i in range(16):
    box=run_box if i<8 else bounds[i]
    f=frames[i].crop(box)
    f=f.resize((max(1,round(f.width*scale)),max(1,round(f.height*scale))),Image.Resampling.NEAREST)
    preview.alpha_composite(f,((i%8)*64+(64-f.width)//2,(i//8)*64+62-f.height))
preview.resize((1536,384),Image.Resampling.NEAREST).convert('RGB').save(ROOT/'assets/preview-tangue-pop-v4.png')
(ROOT/'assets/manifest-tangue-pop-v4.json').write_text(json.dumps({'source':str(source.relative_to(ROOT)),'tool':'built-in ImageGen','frameSize':[64,64],'runFrames':8,'sharedRunCrop':run_box,'sharedScale':scale,'previousCharacter':'?perso=tangue-v2'},indent=2),encoding='utf-8')
