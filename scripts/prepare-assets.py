"""Deterministic slicing, alpha cleanup and export of the generated source art.

Source PNGs are never overwritten. Requires Pillow (normalization only, no generation).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'source'
OUTPUT = ROOT / 'public' / 'assets'
OUTPUT.mkdir(parents=True, exist_ok=True)
report = {'tool': 'built-in ImageGen', 'date': '2026-10-24', 'assets': []}


def clean_crop(image, box=None):
    image = image.convert('RGBA')
    if box:
        image = image.crop(box)
    alpha = image.getchannel('A')
    # Remove only the near-transparent glow outside silhouettes. Preserve the source.
    image.putalpha(alpha.point(lambda v: 255 if v >= 180 else 0))
    bounds = image.getchannel('A').getbbox()
    if bounds is None:
        raise ValueError('Empty asset')
    return image.crop(bounds), bounds


def save(image, name, role, source, **extra):
    destination = OUTPUT / name
    image.save(destination, lossless=True, method=6) if name.endswith('.webp') else image.save(destination, optimize=True)
    alpha = image.getchannel('A').getextrema() if image.mode == 'RGBA' else None
    report['assets'].append({'file': f'public/assets/{name}', 'source': f'assets/source/{source}', 'size': list(image.size), 'bytes': destination.stat().st_size, 'alpha': alpha, 'role': role, **extra})


background = Image.open(SOURCE / 'coast-v1.png').convert('RGB').resize((960, 540), Image.Resampling.NEAREST)
save(background, 'coast-v1.webp', 'decorative-background', 'coast-v1.png', collision=False)

panorama = Image.new('RGB', (1920, 540))
panorama.paste(background, (0, 0))
panorama.paste(ImageOps.mirror(background), (960, 0))
assert all(panorama.getpixel((0, y)) == panorama.getpixel((1919, y)) for y in range(540))
save(panorama, 'coast-parallax-v1.webp', 'decorative-background', 'coast-v1.png', collision=False, horizontalSeam='exact mirrored boundaries', scrollFactor=0.045)

ground = Image.open(SOURCE / 'ground-v1.png').convert('RGB').resize((288, 150), Image.Resampling.NEAREST)
# Mirrored pair guarantees identical boundary columns without trusting generated seams.
ground_tile = Image.new('RGB', (576, 150))
ground_tile.paste(ground, (0, 0))
ground_tile.paste(ImageOps.mirror(ground), (288, 0))
assert all(ground_tile.getpixel((0, y)) == ground_tile.getpixel((575, y)) for y in range(150))
save(ground_tile, 'ground-v1.webp', 'repeatable-platform-texture', 'ground-v1.png', collision=False, horizontalSeam='exact mirrored boundaries')

facade, _ = clean_crop(Image.open(SOURCE / 'qg-v1.png'))
facade = facade.resize((768, round(facade.height * 768 / facade.width)), Image.Resampling.NEAREST)
save(facade, 'qg-v1.webp', 'finish-scenery', 'qg-v1.png', pivot=[0.5, 1], collision=False)

sheet = Image.open(SOURCE / 'mascot-v1.png')
frames = []
bounds = []
for row in range(2):
    for col in range(3):
        frame, bound = clean_crop(sheet, (col * 512, row * 512, (col + 1) * 512, (row + 1) * 512))
        frames.append(frame)
        bounds.append(bound)
scale = min(54 / max(f.height for f in frames), 58 / max(f.width for f in frames))
atlas = Image.new('RGBA', (64 * 6, 64))
for index, frame in enumerate(frames):
    frame = frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.Resampling.NEAREST)
    atlas.paste(frame, (index * 64 + (64 - frame.width) // 2, 62 - frame.height))
save(atlas, 'mascot-run-v1.png', 'animated-player-visual', 'mascot-v1.png', frames=6, frameSize=[64, 64], footBaseline=62, sourceBounds=bounds, collision=False)

# Source atlas placement is inspected rather than assumed to follow a perfect grid.
props = Image.open(SOURCE / 'props-v1.png')
regions = {
    'palm-v1.webp': ((150, 0, 750, 625), 276, 'decorative-palm'),
    'arcade-v1.webp': ((850, 0, 1360, 625), 118, 'decorative-arcade'),
    'crate-v1.webp': ((200, 630, 760, 1024), 64, 'crate-visual'),
    'planter-v1.webp': ((800, 630, 1536, 1024), 78, 'decorative-planter'),
}
for name, (region, height, role) in regions.items():
    image, bounds = clean_crop(props, region)
    image = image.resize((round(image.width * height / image.height), height), Image.Resampling.NEAREST)
    save(image, name, role, 'props-v1.png', pivot=[0.5, 1], collision=False, sourceRegion=list(region), sourceBounds=bounds)

for asset in report['assets']:
    if asset['role'] not in ('decorative-background', 'repeatable-platform-texture'):
        assert asset['alpha'] == (0, 255), f"Invalid alpha: {asset['file']}"
(ROOT / 'assets' / 'manifest-v1.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')

# A contact sheet at in-game scale makes silhouettes, anchors and alpha easy to audit.
preview = Image.new('RGB', (960, 700), '#183039')
preview.paste(background, (0, 0))
draw = ImageDraw.Draw(preview)
draw.rectangle((0, 450, 960, 540), fill='#203530')
draw.rectangle((0, 450, 960, 454), fill='#b7ce94')
preview.paste(facade, (190, 450 - facade.height), facade)
for i in range(6):
    frame = atlas.crop((i * 64, 0, (i + 1) * 64, 64))
    preview.paste(frame, (220 + i * 80, 480), frame)
    draw.text((220 + i * 80, 555), ['IDLE', 'RUN 1', 'RUN 2', 'RUN 3', 'RUN 4', 'JUMP'][i], fill='#c4dda0')
for x, name in [(10, 'palm-v1.webp'), (780, 'arcade-v1.webp'), (870, 'crate-v1.webp')]:
    image = Image.open(OUTPUT / name).convert('RGBA')
    preview.paste(image, (x, 450 - image.height), image)
draw.text((24, 615), 'LA COURSE AU QG / GENERATED ART FAMILY V1 / NATIVE SCALE', fill='#edcba2')
preview.save(ROOT / 'assets' / 'preview-v1.png')
print(json.dumps(report, indent=2, ensure_ascii=False))
