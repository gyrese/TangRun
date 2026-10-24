from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/animation';OUT.mkdir(parents=True,exist_ok=True)
report=[];previews=[]
for name,cell in [('water',(128,224)),('fire',(96,128)),('cat',(64,64))]:
 source=Image.open(ROOT/f'assets/source/animation/{name}.png').convert('RGBA');frames=[];bounds=[]
 for index in range(8):
  col,row=index%4,index//4
  box=(round(col*source.width/4),round(row*source.height/2),round((col+1)*source.width/4),round((row+1)*source.height/2))
  image=source.crop(box);image.putalpha(image.getchannel('A').point(lambda v:255 if v>=180 else 0));bound=image.getchannel('A').getbbox();assert bound
  frames.append(image.crop(bound));bounds.append(bound)
 if name=='cat':
  # Same scale across states, based on the idle silhouette, not on tucked height.
  scale=min(54/max(f.height for f in frames[4:]),58/max(f.width for f in frames))
 else:scale=min((cell[0]-8)/max(f.width for f in frames),(cell[1]-12)/max(f.height for f in frames))
 atlas=Image.new('RGBA',(cell[0]*8,cell[1]))
 for index,frame in enumerate(frames):
  frame=frame.resize((max(1,round(frame.width*scale)),max(1,round(frame.height*scale))),Image.Resampling.NEAREST)
  x=index*cell[0]+(cell[0]-frame.width)//2
  y=(cell[1]-frame.height)//2 if name=='cat' and index<4 else cell[1]-2-frame.height
  atlas.paste(frame,(x,y))
 assert atlas.getchannel('A').getextrema()==(0,255)
 atlas.save(OUT/f'{name}-sheet.png',optimize=True)
 report.append({'key':name,'file':f'public/assets/animation/{name}-sheet.png','source':f'assets/source/animation/{name}.png','frames':8,'frameSize':cell,'sourceBounds':bounds,'scale':scale,'alpha':atlas.getchannel('A').getextrema(),'generatedWith':'built-in ImageGen'})
 previews.append((name,atlas,cell))
preview=Image.new('RGB',(1024,570),'#193139');draw=ImageDraw.Draw(preview)
y=12
for name,atlas,cell in previews:
 draw.text((12,y),name.upper()+' / 8 FRAMES',fill='#dfc69d');y+=20
 maxHeight=180 if name=='water' else 125 if name=='fire' else 64
 for index in range(8):
  image=atlas.crop((index*cell[0],0,(index+1)*cell[0],cell[1]))
  factor=min(1,maxHeight/cell[1]);image=image.resize((round(cell[0]*factor),round(cell[1]*factor)),Image.Resampling.NEAREST)
  preview.paste(image,(index*128+(128-image.width)//2,y),image)
 y+=maxHeight+25
preview.save(ROOT/'assets/preview-animation.png')
(ROOT/'assets/manifest-animation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print([(r['key'],r['frameSize'],r['frames'])for r in report])
