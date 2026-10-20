"""Parse comcbt exam PDFs (text layer) into draft JSON for cross-checking.

Usage: python -I tools/pdf_parse.py <pdf> <out.json>
The PDFs carry a clean Korean text layer (PyMuPDF), answers are marked with
filled digits (❶❷❸❹) on exam-only PDFs, and in a table at the end on all PDFs.
Images (figures, boxes) are NOT in the text layer: they are listed in `imgs`.
"""
import json
import re
import sys

import fitz

OPT = {"①": 1, "②": 2, "③": 3, "④": 4, "❶": 1, "❷": 2, "❸": 3, "❹": 4}
FILLED = set("❶❷❸❹")
HEAD = ("본 해설집은", "전자문제집 CBT", "기출문제 해설은", "최강 자격증")
QSTART = re.compile(r"^\s*(\d{1,3})\.\s")
SUBJ = re.compile(r"^\s*(\d)과목\s*:\s*(.+?)\s*$")


def lines_of(doc):
    """Yield dicts: text, page, col, y, x for every text line in stream order."""
    out = []
    for pi, page in enumerate(doc):
        w = page.rect.width
        for b in page.get_text("dict")["blocks"]:
            if b.get("type") != 0:
                continue
            for ln in b["lines"]:
                t = clean("".join(s["text"] for s in ln["spans"]))
                x0, y0, x1 = ln["bbox"][0], ln["bbox"][1], ln["bbox"][2]
                out.append({"t": t, "p": pi, "c": 0 if x0 < w / 2 else 1, "y": y0, "x1": x1})
    return out


FW = {i: i - 0xFEE0 for i in range(0xFF01, 0xFF5F)}
FW.update({0xFFE6: 0x5C, 0x2032: 0x27, 0x2035: 0x27, 0xA0: 0x20, 0x2013: 0x2D})


def clean(t):
    return t.translate(FW)


_kiwi = None
START = {"NNG", "NNP", "NNB", "NR", "NP", "MM", "MAG", "MAJ", "IC", "SL", "SN", "VV", "VA", "VX"}


def _kiwi_obj():
    global _kiwi
    if _kiwi is None:
        from kiwipiepy import Kiwi
        _kiwi = Kiwi()
    return _kiwi


def _decide(text, bounds):
    """Set of boundary indexes (positions in `text`) where a space was dropped by a line wrap."""
    toks = _kiwi_obj().tokenize(text)
    starts = {t.start: t for t in toks}
    inside = set()
    for t in toks:
        inside.update(range(t.start + 1, t.start + t.len))
    spaced = set()
    for b in bounds:
        if b in inside:
            continue
        t = starts.get(b)
        if t is not None and t.tag in START:
            spaced.add(b)
    return spaced


def join_lines(lines, max_slack=80):
    """lines: list of (text, full). Wrapped lines are re-joined, short lines keep a newline."""
    out, bounds, prev_slack = "", [], 999
    for i, (t, slack) in enumerate(lines):
        if i == 0:
            out = t
        elif out.endswith(" ") or t.startswith(" "):
            out += t
        elif prev_slack <= max_slack:
            a, b = out[-1], t[:1]
            if a.isascii() and b.isascii():
                if a.isalnum() and b.isalnum() and a.islower() and b.isupper():
                    out += " "
            else:
                bounds.append(len(out))
            out += t
        else:
            out += "\n" + t
        prev_slack = slack
    if bounds:
        sp = _decide(out.replace("\n", " "), bounds)
        res, last = [], 0
        for b in sorted(sp):
            res.append(out[last:b])
            res.append(" ")
            last = b
        res.append(out[last:])
        out = "".join(res)
    return out.strip()


def is_head(t):
    s = t.strip()
    return s.startswith(HEAD) or "필기 기출문제" in s


def parse(path):
    doc = fitz.open(path)
    L = []
    for l in lines_of(doc):
        if is_head(l["t"]):
            continue
        # several options may share one text line: split before each later marker
        parts = re.split(r"\s{2,}(?=[①②③④❶❷❸❹])", l["t"])
        for k, part in enumerate(parts):
            L.append(dict(l, t=part + (" " if k < len(parts) - 1 else "")))
            if k < len(parts) - 1:
                L[-1]["x1"] = -1
    title = ""
    for p in doc:
        for ln in p.get_text().split("\n"):
            if "필기 기출문제" in ln:
                title = ln.strip()
                break
        if title:
            break

    colmax = {}
    for l in L:
        k = (l["p"], l["c"])
        colmax[k] = max(colmax.get(k, 0), l["x1"])
    for l in L:
        l["slack"] = colmax[(l["p"], l["c"])] - l["x1"] if l["x1"] >= 0 else 999

    # subject markers -> (reading key, number, name); remove from stream
    markers, body = [], []
    for l in L:
        m = SUBJ.match(l["t"])
        if m:
            markers.append(((l["p"], l["c"], l["y"]), int(m.group(1)), m.group(2)))
        else:
            body.append(l)

    # trailing answer table: contiguous tail of bare numbers / bare option glyphs
    tail = []
    i = len(body) - 1
    while i >= 0 and (re.fullmatch(r"\s*[0-9]{1,2}\s*", body[i]["t"]) or body[i]["t"].strip() in OPT):
        tail.append(body[i]["t"].strip())
        i -= 1
    tail.reverse()
    body = body[: i + 1]
    for f, l in enumerate(body):
        if l["t"].strip().startswith(("본 해설집의 저작권은", "전자문제집 CBT 홈페이지", "기출문제 및 해설집 다운로드")):
            body = body[:f]
            break
    key = []
    j = 0
    while j < len(tail):
        nums = []
        while j < len(tail) and re.fullmatch(r"[0-9]+", tail[j]):
            nums.append(int(tail[j]))
            j += 1
        ans = []
        while j < len(tail) and tail[j] in OPT:
            ans.append(OPT[tail[j]])
            j += 1
        if len(nums) != len(ans):
            raise SystemExit(f"table mismatch {len(nums)} vs {len(ans)} in {path}")
        key += list(zip(nums, ans))
    key = [a for _, a in sorted(key)]

    # split into questions
    def is_candidate(k, n):
        m = QSTART.match(body[k]["t"])
        if not m or int(m.group(1)) != n:
            return False
        for r in range(k + 1, min(k + 40, len(body))):
            tt = body[r]["t"]
            if tt.strip().startswith("<문제 해설>"):
                return False
            m2 = QSTART.match(tt)
            if m2 and int(m2.group(1)) == n:
                return False
            if tt.strip()[:1] in OPT:
                return True
        return False

    starts, n = [], 1
    for k in range(len(body)):
        if is_candidate(k, n):
            starts.append(k)
            n += 1
    qs = []
    for si, k in enumerate(starts):
        end = starts[si + 1] if si + 1 < len(starts) else len(body)
        chunk = body[k:end]
        stem, opts, exp, ek = [], [], [], None
        mode = "stem"
        for ci, l in enumerate(chunk):
            t = l["t"]
            if ci == 0:
                t = QSTART.sub("", t, count=1)
            s = t.strip()
            if s.startswith("<문제 해설>"):
                mode = "exp"
                ek = (l["p"], l["c"], l["y"])
                continue
            if mode != "exp" and s[:1] in OPT:
                opts.append([OPT[s[0]], s[0] in FILLED, [(t.lstrip()[1:].lstrip(), l["slack"])]])
                mode = "opt"
                continue
            if mode == "stem":
                stem.append((t, l["slack"]))
            elif mode == "opt":
                opts[-1][2].append((t, l["slack"]))
            else:
                exp.append((t, l["slack"]))
        q = {
            "n": si + 1,
            "page": chunk[0]["p"] + 1,
            "col": chunk[0]["c"],
            "y": round(chunk[0]["y"]),
            "t": join_lines(stem),
            "o": [join_lines(o[2]) for o in opts],
            "mark": [o[0] for o in opts if o[1]],
        }
        if ek:
            q["ek"] = ek
        if exp:
            q["ex"] = join_lines(exp, 16)
        qs.append(q)

    # subject per question via reading order
    mk = sorted(markers)
    for q in qs:
        key_q = (q["page"] - 1, q["col"], q["y"])
        s = 0
        for k, num, name in mk:
            if k <= key_q:
                s = num
        q["s"] = s
    subjects = {str(num): name for _, num, name in mk}

    # images per question: nearest preceding question start in the same column
    imgs = []
    for pi, page in enumerate(doc):
        w = page.rect.width
        for im in page.get_image_info():
            x0, y0, x1, y1 = im["bbox"]
            col = 0 if (x0 + x1) / 2 < w / 2 else 1
            cand = [q for q in qs if q["page"] == pi + 1 and q["col"] == col and q["y"] <= y0 + 1]
            if not cand:
                prev = [q for q in qs if (q["page"], q["col"]) < (pi + 1, col)]
                cand = prev[-1:]
            if cand:
                q = max(cand, key=lambda q: (q["y"], q["n"]))
                kind = "e" if q.get("ek") and tuple(q["ek"][:2]) + (q["ek"][2],) < (pi, col, y0) else "q"
                imgs.append({"n": q["n"], "page": pi + 1, "kind": kind, "bbox": [round(v) for v in im["bbox"]]})
    return {"title": title, "count": len(qs), "subjects": subjects, "key": key, "q": qs, "imgs": imgs}


if __name__ == "__main__":
    d = parse(sys.argv[1])
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
    print(d["title"], "q=", d["count"], "key=", len(d["key"]), "imgs=", len(d["imgs"]), d["subjects"])
