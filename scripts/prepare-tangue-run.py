"""Export the eight run poses with a shared scale and fixed cell registration."""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'assets/source/tangue-run-v3.png'
image=Image.open(source).convert('RGBA')
image.putalpha(image.getchannel('A').point(lambda value:255 if value>=180 else 0))
frames=[]
for i in range(8):
    x,y=i%4,i//4
    frames.append(image.crop((round(x*image.width/4),round(y*image.height/2),round((x+1)*image.width/4),round((y+1)*image.height/2))))
# One shared crop window prevents individual poses being re-centered by their arms or shoes.
bounds=[f.getbbox() for f in frames]
assert all(bounds)
box=(min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds))
scale=min(58/(box[2]-box[0]),54/(box[3]-box[1]))
size=(round((box[2]-box[0])*scale),round((box[3]-box[1])*scale))
atlas=Image.new('RGBA',(64*8,64))
for i,f in enumerate(frames):
    f=f.crop(box).resize(size,Image.Resampling.NEAREST)
    atlas.paste(f,(i*64+(64-size[0])//2,62-size[1]))
atlas.save(ROOT/'public/assets/tangue/run-cycle-v3.png')
(ROOT/'assets/manifest-tangue-run-v3.json').write_text(json.dumps({'source':str(source.relative_to(ROOT)),'tool':'built-in ImageGen','frames':8,'frameSize':[64,64],'sharedCrop':box,'sharedScale':scale},indent=2),encoding='utf-8')
