"""Bake the four transparent Meshy renders into small, ground-aligned sprites."""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'assets/source/meshy-crab'
output = ROOT / 'public/assets/meshy-crab'
output.mkdir(parents=True, exist_ok=True)
frames = [Image.open(source / f'frame-{i}.png').convert('RGBA') for i in range(4)]
boxes = [frame.getbbox() for frame in frames]
bounds = (min(b[0] for b in boxes), min(b[1] for b in boxes),
          max(b[2] for b in boxes), max(b[3] for b in boxes))
scale = min(60 / (bounds[2]-bounds[0]), 44 / (bounds[3]-bounds[1]))
size = (round((bounds[2]-bounds[0])*scale), round((bounds[3]-bounds[1])*scale))
sprites = []
for i, frame in enumerate(frames):
    small = frame.crop(bounds).resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (64, 48))
    canvas.paste(small, ((64-size[0])//2, 46-size[1]))
    alpha = canvas.getchannel('A').point(lambda a: 255 if a >= 110 else 0)
    canvas.putalpha(alpha)
    edge = Image.new('RGBA', canvas.size, '#311e20')
    edge.putalpha(alpha.filter(ImageFilter.MaxFilter(3)))
    edge.alpha_composite(canvas)
    sprites.append(edge)
sheet = Image.new('RGB', (256, 48))
for i, sprite in enumerate(sprites):
    sheet.paste(sprite.convert('RGB'), (i*64, 0))
palette = sheet.quantize(colors=32)
preview = Image.new('RGBA', (256, 48), '#334451')
for i, sprite in enumerate(sprites):
    baked = sprite.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    baked.putalpha(sprite.getchannel('A'))
    baked.save(output / f'crab-{i}.png')
    preview.alpha_composite(baked, (i*64, 0))
preview.resize((1024, 192), Image.Resampling.NEAREST).save(source / 'preview.png')
