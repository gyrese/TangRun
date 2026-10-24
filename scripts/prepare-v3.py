from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import json

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/source/v3'
OUT=ROOT/'public/assets/v3'
OUT.mkdir(parents=True,exist_ok=True)
manifest=[]
sets={
 'harbor':[
  ('pier',(0,0,660,490),130),('rocks',(620,0,1145,485),70),('boat',(1120,0,1672,485),130),
  ('bench',(0,500,580,941),58),('bollards',(580,500,1145,941),55),('surfboards',(1145,480,1672,941),110)],
 'district':[
  ('kiosk',(0,0,557,470),185),('comics',(557,0,1105,470),185),('gameshop',(1105,0,1672,470),185),
  ('footbridge',(0,500,675,941),100),('neonarrow',(700,480,1000,941),115),('arch',(1080,470,1672,941),245)],
 'festival':[
  ('plants',(0,0,580,520),95),('frangipani',(540,0,1120,520),235),('lantern',(1150,0,1536,520),185),
  ('terrace',(0,520,490,1024),135),('speakers',(500,520,940,1024),95),('canopy',(950,520,1536,1024),125)],
 'island':[
  ('lavarocks',(0,0,555,480),82),('basaltarch',(555,0,1145,480),225),('tamarind',(1145,0,1672,480),260),
  ('hut',(0,500,575,941),150),('ropebridge',(575,580,1240,930),90),('waterfall',(1240,480,1672,941),280)],
}
previews=[]
def remove_fragments(image):
 w,h=image.size;raw=image.getchannel('A').tobytes();seen=bytearray(w*h);components=[]
 for start,value in enumerate(raw):
  if not value or seen[start]:continue
  seen[start]=1;queue=[start];index=0
  while index<len(queue):
   p=queue[index];index+=1;x=p%w
   for n in ([p-1] if x else [])+([p+1] if x<w-1 else [])+([p-w] if p>=w else [])+([p+w] if p<w*(h-1) else []):
    if raw[n] and not seen[n]:seen[n]=1;queue.append(n)
  components.append(queue)
 threshold=max(30,max(map(len,components))*.12);clean=bytearray(w*h)
 for component in components:
  if len(component)>=threshold:
   for p in component:clean[p]=255
 image.putalpha(Image.frombytes('L',(w,h),bytes(clean)))
 return image
for family,items in sets.items():
 source=Image.open(SOURCE/f'{family}.png').convert('RGBA')
 for name,region,height in items:
  image=source.crop(region)
  image.putalpha(image.getchannel('A').point(lambda v:255 if v>=180 else 0))
  image=remove_fragments(image)
  bounds=image.getchannel('A').getbbox()
  assert bounds, name
  image=image.crop(bounds)
  image=image.resize((round(image.width*height/image.height),height),Image.Resampling.NEAREST)
  image.save(OUT/f'{name}.webp',lossless=True,method=6)
  assert image.getchannel('A').getextrema()==(0,255), name
  manifest.append({'key':name,'file':f'public/assets/v3/{name}.webp','source':f'assets/source/v3/{family}.png','region':region,'bounds':bounds,'size':image.size,'pivot':[.5,1],'collision':False,'generatedWith':'built-in ImageGen'})
  previews.append((name,image))
for name in ['volcano','mafate','coast-wide','mafate-remparts']:
 image=Image.open(SOURCE/f'{name}.png').convert('RGB').resize((960,540),Image.Resampling.NEAREST)
 if name in ['coast-wide','mafate-remparts']:
  source=Image.open(SOURCE/f'{name}.png').convert('RGB')
  scaled=source.resize((1920,round(source.height*1920/source.width)),Image.Resampling.NEAREST)
  panorama=scaled.crop((0,0,1920,540))
 else:
  panorama=Image.new('RGB',(1920,540));panorama.paste(image,(0,0));panorama.paste(ImageOps.mirror(image),(960,0))
 panorama.save(OUT/f'{name}.webp',lossless=True,method=6)
 manifest.append({'key':name,'file':f'public/assets/v3/{name}.webp','size':panorama.size,'source':f'assets/source/v3/{name}.png','generatedWith':'built-in ImageGen','collision':False,'seam':'single wide panorama' if name in ['coast-wide','mafate-remparts'] else 'mirrored'})

bridge=Image.open(OUT/'footbridge.webp').convert('RGBA')
beam=bridge.crop((8,round(bridge.height*.37),bridge.width-8,round(bridge.height*.53))).resize((288,24),Image.Resampling.NEAREST)
beam.save(OUT/'beam.webp',lossless=True,method=6)
manifest.append({'key':'beam','file':'public/assets/v3/beam.webp','source':'public/assets/v3/footbridge.webp','size':beam.size,'collision':'visual matches beam rectangle'})
sheet=Image.new('RGB',(1000,6*225),'#193139');d=ImageDraw.Draw(sheet)
for i,(name,image) in enumerate(previews):
 x=(i%4)*250;y=(i//4)*225
 scale=min(220/image.width,185/image.height,1)
 thumb=image.resize((round(image.width*scale),round(image.height*scale)),Image.Resampling.NEAREST)
 sheet.paste(thumb,(x+(250-thumb.width)//2,y+190-thumb.height),thumb)
 d.line((x+10,y+191,x+240,y+191),fill='#617b64');d.text((x+12,y+203),name,fill='#e3d2ae')
sheet.save(ROOT/'assets/preview-v3.png')
(ROOT/'assets/manifest-v3.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(f'{len(manifest)} exports prepared')
