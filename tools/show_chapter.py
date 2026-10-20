"""Show unique questions of a chapter for explanation writing. Usage: show_chapter.py <chapter-id> -> _src/ch_<id>.txt"""
import glob, json, sys
ch = sys.argv[1]
m = json.load(open("content/chapter-map.json", encoding="utf-8"))
import os
expl = {}
for f in glob.glob("content/expl/*.json"):
    expl.update(json.load(open(f, encoding="utf-8")))
seen, out = {}, []
for f in sorted(glob.glob("data/*/*.json")):
    d = json.load(open(f, encoding="utf-8"))
    for q in d["q"]:
        qid = f"{d['id']}#{q['n']}"
        if m.get(qid) != ch:
            continue
        key = (q["t"].strip() + "|" + "|".join(sorted(x.strip() for x in q["o"])))
        seen.setdefault(key, []).append((qid, q))
for key, lst in seen.items():
    qid, q = lst[0]
    ids = ",".join(x[0].replace("LM-", "").replace("NW-", "") for x in lst)
    done = "[done]" if qid in expl else ""
    out.append(f"## {qid} (also {ids}) {done}")
    out.append(q["t"])
    if q.get("box"): out.append("BOX: " + q["box"])
    if q.get("fig"): out.append("FIG:\n" + q["fig"])
    for i, o in enumerate(q["o"], 1):
        out.append(f"  {'*' if i == q['a'] else ' '}{i}) {o}")
    if q.get("ok"): out.append(f"  accepted: {q['ok']}")
    out.append("")
open(f"_src/ch_{ch}.txt", "w", encoding="utf-8").write("\n".join(out))
print(len(seen), "unique of", sum(len(v) for v in seen.values()))
