"""Coverage of own explanations and lint of chapter markdown/explanations."""
import glob, json, re, sys
m = json.load(open("content/chapter-map.json", encoding="utf-8"))
expl = {}
for f in glob.glob("content/expl/*.json"):
    expl.update(json.load(open(f, encoding="utf-8")))
qs = {}
for f in sorted(glob.glob("data/*/*.json")):
    d = json.load(open(f, encoding="utf-8"))
    for q in d["q"]:
        qs[f"{d['id']}#{q['n']}"] = q
bad = [k for k in expl if k not in qs]
print("unknown ids:", bad)
# group coverage: a question counts as covered if any identical question has an explanation
def key(q): return q["t"].strip() + "|" + (q.get("box") or "").strip() + "|" + (q.get("fig") or "").strip() + "|" + "|".join(sorted(x.strip() for x in q["o"]))
covered_keys = {key(qs[k]) for k in expl if k in qs}
tot, cov = {}, {}
for qid, q in qs.items():
    ch = m[qid]
    tot[ch] = tot.get(ch, 0) + 1
    if key(q) in covered_keys:
        cov[ch] = cov.get(ch, 0) + 1
for ch in sorted(tot):
    print(f"{ch:14} {cov.get(ch,0):3}/{tot[ch]}")
print("TOTAL", sum(cov.values()), "/", len(qs))
# lint
for k, t in expl.items():
    if "~~" in t: print("strike risk", k)
    if len(t) < 20: print("short", k)
for f in glob.glob("content/*/*.md"):
    s = open(f, encoding="utf-8").read()
    s2 = re.sub(r"```.*?```", "", s, flags=re.S)
    s2 = re.sub(r"`[^`]*`", "", s2)
    if "~" in s2: print("tilde outside code:", f)
