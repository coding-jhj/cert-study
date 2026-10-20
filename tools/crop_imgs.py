"""Crop every embedded image region of a PDF to PNG, named by the question it belongs to.
Usage: python -I tools/crop_imgs.py pXX  (needs _src/draft/pXX.json from pdf_parse.py)"""
import json, sys, fitz, glob, os
k = sys.argv[1]
d = json.load(open(f"_src/draft/{k}.json", encoding="utf-8"))
doc = fitz.open(f"_src/{k}.pdf")
for f in glob.glob(f"_src/img/{k}_q*.png"):
    os.remove(f)
cnt = {}
for im in d["imgs"]:
    x0, y0, x1, y1 = im["bbox"]
    if (x1 - x0) < 20 or (y1 - y0) < 12:
        continue
    key = (im["n"], im["kind"])
    cnt[key] = cnt.get(key, 0) + 1
    pix = doc[im["page"] - 1].get_pixmap(clip=fitz.Rect(x0 - 2, y0 - 2, x1 + 2, y1 + 2), dpi=200)
    pix.save(f"_src/img/{k}_q{im['n']:02d}{'e' if im['kind']=='e' else ''}_{cnt[key]}.png")
print(k, sum(cnt.values()))
