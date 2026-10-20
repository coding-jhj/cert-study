"""Contact sheets of cropped images, labelled by question, for visual transcription.
Usage: python -I tools/sheets.py pXX [per_sheet] -> _src/sheets/pXX_NN.png"""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont

k = sys.argv[1]
per = int(sys.argv[2]) if len(sys.argv) > 2 else 6
os.makedirs("_src/sheets", exist_ok=True)
files = sorted(glob.glob(f"_src/img/{k}_q*.png"))
font = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 22)
W = 900
sheets = [files[i:i + per] for i in range(0, len(files), per)]
for si, grp in enumerate(sheets, 1):
    ims, h = [], 0
    for f in grp:
        im = Image.open(f).convert("RGB")
        if im.width > W:
            im = im.resize((W, int(im.height * W / im.width)))
        ims.append((os.path.basename(f)[len(k) + 1:-4], im))
        h += im.height + 34
    sheet = Image.new("RGB", (W, h), "white")
    d = ImageDraw.Draw(sheet)
    y = 0
    for name, im in ims:
        d.rectangle([0, y, W, y + 30], fill=(255, 235, 150))
        d.text((6, y + 2), name.upper(), fill="black", font=font)
        sheet.paste(im, (0, y + 32))
        y += im.height + 34
    sheet.save(f"_src/sheets/{k}_{si:02d}.png")
print(len(files), "images ->", len(sheets), "sheets")
