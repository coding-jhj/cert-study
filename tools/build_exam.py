"""view / build for one parsed exam.
  python -I tools/build_exam.py view pXX            -> _src/view/pXX.txt (stems+options, no explanations)
  python -I tools/build_exam.py build pXX overlay.json  -> data/<cert>/<date>.json
overlay.json: {"<n>": {"box":..., "fig":..., "fix":..., "t":..., "o":[...], "s":...}}"""
import json, os, re, sys

cmd, k = sys.argv[1], sys.argv[2]
d = json.load(open(f"_src/draft/{k}.json", encoding="utf-8"))
m = re.search(r"(\d{4})년 (\d\d)월 (\d\d)일", d["title"])
date = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
cert = "lm" if "리눅스" in d["title"] else "nw"

if cmd == "view":
    os.makedirs("_src/view", exist_ok=True)
    im = {}
    for i in d["imgs"]:
        if (i["bbox"][2] - i["bbox"][0]) >= 20 and (i["bbox"][3] - i["bbox"][1]) >= 12:
            im.setdefault(i["n"], []).append(i["kind"])
    out = [f"{cert} {date} count={d['count']} key={d['key']}"]
    for q in d["q"]:
        tag = "".join(f"[IMG{('-E' if x == 'e' else '')}]" for x in im.get(q["n"], []))
        o = " | ".join(f"{i+1}){x}" for i, x in enumerate(q["o"]))
        out.append(f"Q{q['n']} s{q['s']} a={d['key'][q['n']-1]} {tag} {q['t']}\n     {o}")
    open(f"_src/view/{k}.txt", "w", encoding="utf-8").write("\n".join(out))
    print(len(out) - 1)
    sys.exit()

ov = json.load(open(sys.argv[3], encoding="utf-8")) if len(sys.argv) > 3 else {}
J = lambda v: json.dumps(v, ensure_ascii=False, separators=(",", ":"))
lines = []
for q in d["q"]:
    n = q["n"]
    o = ov.get(str(n), {})
    a = d["key"][n - 1]
    if q["mark"] and q["mark"] != [a]:
        raise SystemExit(f"answer mark != key at Q{n}")
    t, opts, notes = o.get("t", q["t"]), list(o.get("o", q["o"])), []
    for old, new in o.get("rep", []):
        hit = False
        if old in t:
            t, hit = t.replace(old, new), True
            notes.append(f"문제 '{old}' → '{new}'")
        for i, x in enumerate(opts):
            if old in x:
                opts[i], hit = x.replace(old, new), True
                notes.append(f"보기 {'①②③④'[i]} '{old}' → '{new}'")
        if not hit:
            raise SystemExit(f"rep not found Q{n}: {old!r}")
    rec = {"n": n, "s": o.get("s", q["s"]), "t": t}
    for f in ("box", "fig"):
        if f in o:
            rec[f] = o[f]
    rec["o"] = opts
    rec["a"] = a
    for f in ("ok", "note"):
        if f in o:
            rec[f] = o[f]
    if notes or "fix" in o:
        rec["fix"] = "; ".join(([o["fix"]] if "fix" in o else []) + notes)
    if q.get("ex"):
        rec["ex"] = q["ex"]
    lines.append(J(rec))
subs = d["subjects"]
head = {"id": f"{cert.upper()}-{date.replace('-', '')}", "cert": cert, "date": date, "count": d["count"], "subjects": subs}
if "해설집" in d["title"]:
    head["kind"] = "explained"
text = J(head)[:-1] + ',\n"q":[\n' + ",\n".join(lines) + '\n],\n"key":' + J(d["key"]) + "}\n"
os.makedirs(f"data/{cert}", exist_ok=True)
path = f"data/{cert}/{date}.json"
open(path, "w", encoding="utf-8", newline="\n").write(text)
json.loads(text)
print("wrote", path)
