import json, re, sys, glob, pathlib

BAD = re.compile(r'[一-鿿぀-ヿ؀-ۿ�]')
EXPECT = {"nw": 50, "lm": 80}
errs = []
total = 0
for f in sorted(glob.glob(str(pathlib.Path(__file__).parent.parent / "data" / "*" / "*.json"))):
    d = json.load(open(f, encoding="utf-8"))
    n = len(d["q"])
    total += n
    if n != EXPECT[d["cert"]] or d.get("count") != n:
        errs.append(f"{d['id']}: count {n}")
    if [q["n"] for q in d["q"]] != list(range(1, n + 1)):
        errs.append(f"{d['id']}: numbering")
    key = d.get("key")
    if key is None or len(key) != n:
        errs.append(f"{d['id']}: key length")
    for q in d["q"]:
        tag = f"{d['id']} Q{q['n']}"
        if len(q["o"]) != 4:
            errs.append(f"{tag}: options {len(q['o'])}")
        if q["a"] not in (1, 2, 3, 4):
            errs.append(f"{tag}: bad answer")
        if key and key[q["n"] - 1] != q["a"]:
            errs.append(f"{tag}: answer {q['a']} != key {key[q['n']-1]}")
        text = q["t"] + q.get("box", "") + "".join(q["o"])
        if BAD.search(text):
            errs.append(f"{tag}: bad char")
        if re.search(r'[′‵＇]', text):
            errs.append(f"{tag}: ocr quote")
print(f"questions={total} errors={len(errs)}")
for e in errs:
    print(e)
sys.exit(1 if errs else 0)
