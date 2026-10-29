"""Register sixteen generated running poses to a shared 64px game atlas."""
from pathlib import Path
from PIL import Image
import json
from statistics import median

ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'assets/source/tangue-stride-v5.png'
image=Image.open(source).convert('RGBA')
image.putalpha(image.getchannel('A').point(lambda value:255 if value>=180 else 0))
frames=[]
for i in range(16):
    x,y=i%4,i//4
    frames.append(image.crop((round(x*image.width/4),round(y*image.height/4),round((x+1)*image.width/4),round((y+1)*image.height/4))))
bounds=[frame.getbbox() for frame in frames]
assert all(bounds), 'Every pose must contain visible pixels'
# Generated rows have slightly different vertical packing. Register whole rows
# together, preserving the small head bob and foot lift within each half-stride.
row_tops=[median(b[1] for b in bounds[row*4:row*4+4]) for row in range(4)]
offsets=[round(row_tops[0]-top) for top in row_tops]
registered=[]
for i,frame in enumerate(frames):
    canvas=Image.new('RGBA',(frame.width,frame.height+max(offsets)))
    canvas.paste(frame,(0,offsets[i//4]));registered.append(canvas)
frames=registered;bounds=[frame.getbbox() for frame in frames]
box=(min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds))
# One crop and one scale preserve torso registration and the drawn flight arc.
scale=min(58/(box[2]-box[0]),50/(box[3]-box[1]))
size=(round((box[2]-box[0])*scale),round((box[3]-box[1])*scale))
atlas=Image.new('RGBA',(16*64,64));preview=Image.new('RGBA',(8*64,2*64),'#193139')
for i,frame in enumerate(frames):
    sprite=frame.crop(box).resize(size,Image.Resampling.NEAREST)
    x,y=(64-size[0])//2,62-size[1]
    atlas.paste(sprite,(i*64+x,y))
    preview.alpha_composite(sprite,((i%8)*64+x,(i//8)*64+y))
out=ROOT/'public/assets/tangue/run-cycle-pop-v5.png'
atlas.save(out)
preview.resize((1536,384),Image.Resampling.NEAREST).convert('RGB').save(ROOT/'assets/preview-tangue-stride-v5.png')
assert len({atlas.crop((i*64,0,(i+1)*64,64)).tobytes() for i in range(16)})==16, 'No duplicate frames'
(ROOT/'assets/manifest-tangue-stride-v5.json').write_text(json.dumps({'source':source.relative_to(ROOT).as_posix(),'tool':'built-in ImageGen','file':out.relative_to(ROOT).as_posix(),'frames':16,'frameSize':[64,64],'baseline':62,'rowOffsets':offsets,'sharedCrop':box,'sharedScale':scale,'previousCharacter':'?perso=tangue-pop-v4'},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'size':image.size,'crop':box,'scale':scale,'output':str(out)}))
