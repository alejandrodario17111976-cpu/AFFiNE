# -*- coding: utf-8 -*-
"""Version 2: estilo "reel de dibujo 3D" (estudio gris, colchoneta, etiquetas, subtitulos palabra a palabra)."""
import json, math, os, re, subprocess, sys
import numpy as np
import skia

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gfx import *  # noqa
import gfx
import vign
from vign import check
import script

ROOT = os.path.dirname(HERE)
BUILD = os.path.join(ROOT, "build2")
FPS = 30

BX0, BX1 = 60, 1020
BW = BX1 - BX0
BY0, BY1 = 1046, 1892
VH = BY1 - BY0
STAGE_DY = 95
STAGE = (0, 466, W, 1024)
CAP_Y0, CAP_Y1 = 92, 336


def card(c, x, y, w, h, a=255, r=26, fill="paper2", border=None, shadow=True):
    if shadow and a > 20:
        soft_shadow(c, skia.Rect.MakeXYWH(x, y, w, h), r, int(40 * a / 255), 12, 7)
    rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r)
    c.drawRRect(rr, skia.Paint(AntiAlias=True, Color=col(fill, a)))
    if border:
        c.drawRRect(rr, paint(border, 4, a))


def pill(c, x, y, w, h, color, a=255):
    rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), h / 2, h / 2)
    soft_shadow(c, skia.Rect.MakeXYWH(x, y, w, h), h / 2, int(36 * a / 255), 8, 5)
    c.drawRRect(rr, grad_paint(color, y, y + h, a, 0.22))


# ================================================================== board items
def item_layout(it):
    typ = it[0]
    if typ in ("p", "bul"):
        size = 44 if typ == "p" else 46
        lines = wrap_rich(it[1], "hand", size, BW - 10, "bold")
        lh = size * 1.32
        h = len(lines) * lh + 6

        def draw(c, x, y, a, st):
            for i, ln in enumerate(lines):
                draw_rich_line(c, ln, x + 4, y + size + i * lh, "hand", size, "ink", a, "bold")
        return h, draw

    if typ == "st":
        size = 42
        lines = wrap_rich(it[1], "bold", size, BW - 70, "bold")
        lh = size * 1.3
        h = len(lines) * lh + 38

        def draw(c, x, y, a, st):
            k = ease((st["et"] or 9) / 0.45)
            wmax = max(line_w(ln, "bold", size) for ln in lines) + 56
            ww = 60 + (wmax - 60) * k
            rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y + 4, ww, h - 8), 30, 30)
            soft_shadow(c, skia.Rect.MakeXYWH(x, y + 4, ww, h - 8), 30, int(34 * a / 255), 8, 5)
            c.drawRRect(rr, grad_paint("marker", y, y + h, a, 0.25))
            c.save()
            c.clipRRect(rr)
            for i, ln in enumerate(lines):
                draw_rich_line(c, ln, x + 28, y + 16 + size * 0.98 + i * lh, "bold", size, (30, 30, 34), a, "bold",
                               en_color=(20, 76, 190))
            c.restore()
        return h, draw

    if typ == "ex":
        en, es = it[1], it[2]
        s1, s2 = 50, 42
        l1 = wrap_rich("{" + en + "}", "bold", s1, BW - 70, "bold")
        l2 = wrap_rich("= " + es, "hand", s2, BW - 70) if es else []
        lh1, lh2 = s1 * 1.24, s2 * 1.28
        h = len(l1) * lh1 + len(l2) * lh2 + 40

        def draw(c, x, y, a, st):
            card(c, x, y, BW, h - 8, a, 26)
            new = st["newest"] and st["et"] is not None
            bar = "orange" if new else "soft"
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, 12, h - 8), 6, 6), paint(bar, a=a, fill=True))
            for i, ln in enumerate(l1):
                draw_rich_line(c, ln, x + 36, y + 14 + s1 + i * lh1, "bold", s1, "ink", a, "bold")
            for i, ln in enumerate(l2):
                draw_rich_line(c, ln, x + 36, y + 14 + len(l1) * lh1 + s2 + i * lh2 - 2, "hand", s2, "gray", a, "bold")
        return h, draw

    if typ == "tip":
        size = 40
        lines = wrap_rich(it[1], "hand", size, BW - 110, "bold")
        lh = size * 1.32
        h = len(lines) * lh + 50

        def draw(c, x, y, a, st):
            card(c, x, y, BW, h - 8, a, 26, fill="note")
            ball3d(c, x + 42, y + 44, 22, TH["orange"], a)
            draw_text(c, "!", x + 42, y + 58, "mark", 34, (255, 255, 255), a, align="center")
            for i, ln in enumerate(lines):
                draw_rich_line(c, ln, x + 82, y + 18 + size + i * lh, "hand", size, "ink", a, "bold")
        return h, draw

    if typ == "vocab":
        en, es = it[1], it[2]
        h = 84

        def draw(c, x, y, a, st):
            new = st["newest"]
            card(c, x, y + 4, BW, h - 12, a, 22, fill="paper2", border="orange" if new else None, shadow=True)
            draw_text(c, en, x + 28, y + 58, "bold", 48, "blue", a)
            draw_text(c, es, x + BW - 28, y + 58, "hand", 46, "ink", a, align="right")
        return h, draw

    if typ == "word":
        w_, meaning, en, es = it[1:5]
        s0 = 40
        pw = text_w(w_, "mark", s0) + 56
        ml = wrap_rich(meaning, "hand", 40, BW - pw - 80)
        one = len(ml) == 1
        if not one:
            ml = wrap_rich(meaning, "hand", 40, BW - 60)
        top = 80 + (0 if one else len(ml) * 50)
        el = wrap_rich("{" + en + "}", "bold", 44, BW - 60, "bold")
        sl = wrap_rich("= " + es, "hand", 40, BW - 60) if es else []
        h = 22 + top + len(el) * 56 + len(sl) * 52 + 22

        def draw(c, x, y, a, st):
            card(c, x, y + 4, BW, h - 10, a, 26, border="orange" if st["newest"] else None)
            pill(c, x + 22, y + 22, pw, 62, "orange", a)
            draw_text(c, w_, x + 22 + pw / 2, y + 22 + 45, "mark", s0, (255, 255, 255), a, align="center")
            if one:
                draw_rich_line(c, ml[0], x + 22 + pw + 22, y + 22 + 44, "hand", 40, "ink", a)
            else:
                for i, ln in enumerate(ml):
                    draw_rich_line(c, ln, x + 26, y + 22 + 80 + 38 + i * 50, "hand", 40, "ink", a)
            yy = y + 22 + top
            for i, ln in enumerate(el):
                draw_rich_line(c, ln, x + 26, yy + 46 + i * 56, "bold", 44, "ink", a, "bold")
            yy += len(el) * 56
            for i, ln in enumerate(sl):
                draw_rich_line(c, ln, x + 26, yy + 42 + i * 52, "hand", 40, "gray", a)
        return h, draw

    if typ == "cmp":
        h1, t1, h2, t2 = it[1:5]
        cw = (BW - 24) / 2
        a1 = wrap_rich(t1, "hand", 38, cw - 44)
        a2 = wrap_rich(t2, "hand", 38, cw - 44)
        h = 30 + 70 + max(len(a1), len(a2)) * 50 + 24

        def draw(c, x, y, a, st):
            for j, (hh, ll, cl) in enumerate(((h1, a1, "blue"), (h2, a2, "green"))):
                xx = x + j * (cw + 24)
                card(c, xx, y + 4, cw, h - 10, a, 26)
                hw_ = min(cw - 40, text_w(hh, "mark", 34) + 44)
                pill(c, xx + 20, y + 22, hw_, 56, cl, a)
                draw_text(c, hh, xx + 20 + hw_ / 2, y + 22 + 40, "mark", 34, (255, 255, 255), a, align="center")
                for i, ln in enumerate(ll):
                    draw_rich_line(c, ln, xx + 24, y + 128 + i * 50, "hand", 38, "ink", a)
        return h, draw

    if typ == "row3":
        cols = it[1:4]
        header = len(it) > 4 and it[4]
        cw = BW / 3
        wr = [wrap_rich(cc, "bold" if header else "hand", 38, cw - 26, "bold") for cc in cols]
        h = max(len(w_) for w_ in wr) * 48 + 30

        def draw(c, x, y, a, st):
            if header:
                rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, BW, h), 18, 18)
                c.drawRRect(rr, grad_paint("orange", y, y + h, a, 0.2))
            else:
                c.drawRect(skia.Rect.MakeXYWH(x, y, BW, h), paint("paper2", a=a, fill=True))
                c.drawLine(x, y + h, x + BW, y + h, paint("soft", 3, a))
            for j, ll in enumerate(wr):
                for i, ln in enumerate(ll):
                    draw_rich_line(c, ln, x + j * cw + 16, y + 50 + i * 48, "bold" if header else "hand", 38,
                                   (255, 255, 255) if header else "ink", a, "bold")
        return h, draw

    if typ == "sum":
        tema, est, idea = it[1:4]
        h = 142

        def draw(c, x, y, a, st):
            card(c, x, y + 4, BW, h - 12, a, 24, border="orange" if st["newest"] else None)
            draw_text(c, tema, x + 24, y + 54, "mark", 40, "blue", a)
            ln = wrap_rich(est, "bold", 36, BW - 60, "bold")[0]
            lw = line_w(ln, "bold", 36)
            rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 20, y + 72, lw + 40, 52), 26, 26)
            c.drawRRect(rr, grad_paint("marker", y + 72, y + 124, a, 0.25))
            draw_rich_line(c, ln, x + 40, y + 110, "bold", 36, (30, 30, 34), a, "bold", en_color=(20, 76, 190))
            iw = text_w(idea, "hand", 34)
            if text_w(tema, "mark", 40) + iw < BW - 80:
                draw_text(c, idea, x + BW - 24, y + 54, "hand", 34, "gray", a, align="right")
            else:
                draw_text(c, idea, x + BW - 24, y + 110, "hand", 32, "gray", a, align="right")
        return h, draw

    if typ == "quiz":
        q, opts, ans, full = it[1:5]
        ql = wrap_rich(q, "bold", 58, BW - 20)
        pills, row, rw = [], [], 0
        for i, o in enumerate(opts):
            pw = text_w(o, "bold", 48) + 80
            if row and rw + pw > BW:
                pills.append(row)
                row, rw = [], 0
            row.append((i, o, pw))
            rw += pw + 26
        pills.append(row)
        fl = wrap_rich("{" + full + "}", "bold", 46, BW - 100, "bold")
        h = len(ql) * 76 + 40 + len(pills) * 124 + 30 + len(fl) * 62 + 30

        def draw(c, x, y, a, st):
            answered = st.get("answered", False)
            ak = ease((st.get("at") or 0) / 0.45) if answered else 0
            for i, ln in enumerate(ql):
                draw_rich_line(c, ln, x + BW / 2, y + 62 + i * 76, "bold", 58, "ink", a, align="center")
            yy = y + len(ql) * 76 + 40
            for row_ in pills:
                rw_ = sum(pw for _, _, pw in row_) + 26 * (len(row_) - 1)
                xx = x + (BW - rw_) / 2
                for i, o, pw in row_:
                    good = i == ans
                    fade = int(a * (1 - 0.6 * ak)) if not good else a
                    if good and ak > 0:
                        pill(c, xx, yy, pw, 96, "green", a)
                        draw_text(c, o, xx + pw / 2, yy + 64, "mark", 48, (255, 255, 255), a, align="center")
                        bx = xx + pw - 10
                        ball3d(c, bx, yy + 4, 26 * back_out(ak), (255, 255, 255), a)
                        check(c, bx, yy + 4, 0.45 * back_out(ak))
                    else:
                        card(c, xx, yy, pw, 96, fade, 48)
                        draw_text(c, o, xx + pw / 2, yy + 64, "bold", 48, "blue", fade, align="center")
                    xx += pw + 26
                yy += 124
            if answered and ak > 0:
                for i, ln in enumerate(fl):
                    draw_rich_line(c, ln, x + BW / 2, yy + 46 + i * 62, "bold", 46, "ink", int(a * ak), "bold",
                                   align="center")
        return h, draw

    if typ == "full":
        words = []
        for pi, (en, es, _) in enumerate(script.TLOU):
            for wd in en.split(" "):
                words.append((wd, pi))
        size = 44
        lh = size * 1.36
        lines, cur, wsum = [], [], 0
        spw = text_w(" ", "bold", size)
        for wd, pi in words:
            ww = text_w(wd, "bold", size)
            if cur and wsum + ww > BW - 60:
                lines.append(cur)
                cur, wsum = [], 0
            cur.append((wd, pi, wsum))
            wsum += ww + spw
        if cur:
            lines.append(cur)
        h = len(lines) * lh + 50

        def draw(c, x, y, a, st):
            card(c, x, y, BW, h, a, 28)
            cur_p = st.get("phrase", -1)
            for i, ln in enumerate(lines):
                yy = y + 26 + size + i * lh
                for wd, pi, ox in ln:
                    ww = text_w(wd, "bold", size)
                    if pi == cur_p:
                        c.drawRoundRect(skia.Rect.MakeXYWH(x + 30 + ox - 5, yy - size * 0.82, ww + 10 + spw, size * 1.1),
                                        10, 10, paint("marker", a=int(a * 0.9), fill=True))
                        colr = (30, 30, 34)
                    elif pi < cur_p:
                        colr = "ink"
                    else:
                        colr = "gray"
                    draw_text(c, wd, x + 30 + ox, yy, "bold", size, colr, a if pi <= cur_p else int(a * 0.55))
        return h, draw

    raise ValueError(typ)


# ================================================================== captions
def chunk_text(text, maxc=60):
    plain_len = lambda s: len(re.sub(r"[{}]", "", s))
    parts = re.split(r"(?<=[.?!:;])\s+", text.strip())
    out = []
    for p in parts:
        if plain_len(p) > maxc + 10:
            sub = re.split(r"(?<=,)\s+", p)
            buf = ""
            for s in sub:
                if buf and plain_len(buf + " " + s) > maxc:
                    out.append(buf)
                    buf = s
                else:
                    buf = (buf + " " + s).strip()
            if buf:
                out.append(buf)
        else:
            out.append(p)
    # cortar lo que siga siendo largo en palabras
    out2 = []
    for p in out:
        if plain_len(p) <= maxc + 12:
            out2.append(p)
            continue
        ws = p.split(" ")
        buf = ""
        for wd in ws:
            if buf and plain_len(buf + " " + wd) > maxc:
                out2.append(buf)
                buf = wd
            else:
                buf = (buf + " " + wd).strip()
        if buf:
            out2.append(buf)
    merged = []
    for p in out2:
        if merged and plain_len(merged[-1] + " " + p) <= maxc:
            merged[-1] = merged[-1] + " " + p
        else:
            merged.append(p)
    fixed = []
    for p in merged:
        if p.count("{") > p.count("}"):
            p = p + "}"
        if p.count("}") > p.count("{"):
            p = "{" + p
        fixed.append(p)
    return fixed


def cap_words(text):
    """'{hola}: chau' -> lista de palabras; cada palabra = lista de tramos (texto, es_ingles)"""
    words = []
    for part in re.split(r"(\{[^}]*\})", text):
        if not part:
            continue
        en = part.startswith("{")
        s_ = part[1:-1] if en else part
        toks = s_.split(" ")
        for j, tk in enumerate(toks):
            if not tk:
                continue
            glue = (j == 0 and words and not s_.startswith(" ") and not part.startswith("{")) or \
                   (j == 0 and words and en and not text[:text.find(part)].endswith(" ") and text.find(part) > 0)
            if glue:
                words[-1].append((tk, en))
            else:
                words.append([(tk, en)])
    return words


# ================================================================== scene renderer
class SceneR:
    def __init__(self, sc, tl, t_off, total):
        self.sc, self.tl = sc, tl
        self.t_off, self.total = t_off, total
        items = sc["items"]
        self.lay = [item_layout(it) for it in items]
        gap = 20
        self.tops = []
        y = 0
        for h, _ in self.lay:
            self.tops.append(y)
            y += h + gap
        beats = tl["beats"]
        self.reveal = [None] * len(items)
        prev = 0
        for b in beats:
            r = b["r"]
            if r is None:
                continue
            if r > prev:
                lines = b["lines"]
                ptr = 0
                for j, idx in enumerate(range(prev, min(r, len(items)))):
                    if j == 0:
                        self.reveal[idx] = b["start"]
                        continue
                    want_en = items[idx][0] == "ex"
                    tt = None
                    for li in range(ptr + 1, len(lines)):
                        if (want_en and lines[li]["lang"] == "en") or not want_en:
                            tt = lines[li]["start"]
                            ptr = li
                            break
                    self.reveal[idx] = tt if tt is not None else b["start"] + 0.3 * j
                prev = r
        self.scroll_keys = [(0.0, 0.0)]
        for idx, rt in sorted([(i, t) for i, t in enumerate(self.reveal) if t is not None], key=lambda z: z[1]):
            bottom = self.tops[idx] + self.lay[idx][0]
            target = max(0.0, bottom - VH + 12)
            target = min(target, self.tops[idx])
            target = max(target, self.scroll_keys[-1][1])
            self.scroll_keys.append((rt, target))
        self.vkeys = []
        cur = None
        for b in beats:
            if b["v"]:
                if b["v"] != cur:
                    self.vkeys.append((b["start"], b["v"]))
                    cur = b["v"]
        if not self.vkeys:
            self.vkeys = [(0.0, "tip")]
        if self.vkeys[0][0] > 0:
            self.vkeys[0] = (0.0, self.vkeys[0][1])
        # subtitulos palabra a palabra
        self.caps = []
        for b in beats:
            for ln in b["lines"]:
                if ln["lang"] == "pause" or not ln["text"]:
                    continue
                txt = ln["text"] if ln["lang"] == "es" else "{" + ln["text"] + "}"
                chunks = chunk_text(txt)
                tot = sum(len(ch) for ch in chunks)
                t0 = ln["start"]
                for ch in chunks:
                    d = ln["dur"] * len(ch) / tot
                    self.caps.append(self.cap_layout(ch, t0, t0 + d))
                    t0 += d
        self.header_layout()

    # ---------------------------------------------------------- captions
    def cap_layout(self, ch, t0, t1):
        words = cap_words(ch)
        wtxt = lambda wd: "".join(t for t, _ in wd)
        for size in (60, 54, 48, 42):
            spw = text_w(" ", "mark", size)
            lines, cur, w = [], [], 0
            for wd in words:
                ww = text_w(wtxt(wd), "mark", size)
                if cur and w + ww > BW:
                    lines.append((cur, w - spw))
                    cur, w = [], 0
                cur.append((wd, w))
                w += ww + spw
            if cur:
                lines.append((cur, w - spw))
            if len(lines) * size * 1.22 <= CAP_Y1 - CAP_Y0:
                break
        tot = sum(len(wtxt(wd)) + 1 for wd in words)
        acc, times = 0, []
        for wd in words:
            times.append(t0 + (t1 - t0) * acc / tot)
            acc += len(wtxt(wd)) + 1
        return dict(t0=t0, t1=t1, lines=lines, size=size, times=times)

    def draw_caption(self, c, t):
        cap, nxt = None, 1e9
        for j, cp in enumerate(self.caps):
            if cp["t0"] <= t:
                cap = cp
                nxt = self.caps[j + 1]["t0"] if j + 1 < len(self.caps) else 1e9
        if not cap:
            return
        end = min(cap["t1"] + 1.2, nxt)
        if t > end:
            return
        a_all = 1 - ease((t - (end - 0.15)) / 0.15) if nxt > cap["t1"] + 1.2 else 1
        size = cap["size"]
        lh = size * 1.22
        nl = len(cap["lines"])
        y0 = (CAP_Y0 + CAP_Y1) / 2 - nl * lh / 2 + size * 0.8
        k = 0
        last_shown = max([i for i, tt in enumerate(cap["times"]) if tt <= t] or [0])
        for li, (ln, lw) in enumerate(cap["lines"]):
            x0 = W / 2 - lw / 2
            for wd, ox in ln:
                tt = cap["times"][k]
                if tt <= t:
                    fa = ease((t - tt) / 0.12)
                    cur = (k == last_shown)
                    kind = "mark" if cur else "bold"
                    dy = 8 * (1 - fa)
                    xx = x0 + ox
                    for seg, en in wd:
                        if en:
                            colr = "blue" if cur else ((120, 160, 225) if TH["bg"] == gfx.LIGHT["bg"] else (150, 185, 240))
                        else:
                            colr = "cap_new" if cur else "cap_old"
                        xx = draw_text(c, seg, xx, y0 + li * lh + dy, kind, size, colr, int(255 * fa * a_all))
                k += 1

    # ---------------------------------------------------------- etiqueta + insignia
    def header_layout(self):
        sc = self.sc
        title = sc["title"].upper()
        sub = sc.get("sub") or ""
        self.badge = sc["chip"]
        self.b_w = text_w(self.badge, "mark", 34) + 50
        maxw = BW - self.b_w - 30 - 64
        for size in (46, 42, 38, 36, 34, 30):
            lines = wrap_rich(title, "mark", size, maxw)
            if len(lines) == 1 or (len(lines) == 2 and size <= 38):
                break
        self.p_size, self.p_lines = size, lines
        self.s_size = 28
        self.s_lines = wrap_rich(sub, "hand", 28, maxw) if sub else []
        if len(self.s_lines) > 2:
            self.s_size = 24
            self.s_lines = wrap_rich(sub, "hand", 24, maxw)
        widths = [line_w(ln, "mark", size) for ln in lines] + [line_w(ln, "hand", self.s_size) for ln in self.s_lines]
        self.p_w = max(widths) + 64
        self.p_h = len(lines) * size * 1.12 + len(self.s_lines) * self.s_size * 1.25 + 30

    def draw_labels(self, c, t):
        k = back_out(t / 0.45)
        a = int(255 * ease(t / 0.3))
        x, y = BX0, 350
        c.save()
        c.translate(x + self.p_w / 2, y + self.p_h / 2)
        c.scale(k, k)
        c.translate(-(x + self.p_w / 2), -(y + self.p_h / 2))
        rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, self.p_w, self.p_h), 34, 34)
        soft_shadow(c, skia.Rect.MakeXYWH(x, y, self.p_w, self.p_h), 34, int(40 * a / 255), 9, 6)
        c.drawRRect(rr, grad_paint("orange", y, y + self.p_h, a, 0.22))
        yy = y + 14 + self.p_size * 0.92
        for ln in self.p_lines:
            draw_rich_line(c, ln, x + 32, yy, "mark", self.p_size, (255, 255, 255), a)
            yy += self.p_size * 1.12
        yy = yy - self.p_size * 0.12 + self.s_size * 0.3 + 2
        for ln in self.s_lines:
            draw_rich_line(c, ln, x + 32, yy, "hand", self.s_size, (255, 244, 232), a, en_color=(255, 244, 232))
            yy += self.s_size * 1.25
        c.restore()
        # insignia
        bw = self.b_w
        bx, by, bh = BX1 - bw, 356, 74
        k2 = back_out((t - 0.12) / 0.45)
        if k2 > 0:
            c.save()
            c.translate(bx + bw / 2, by + bh / 2)
            c.scale(k2, k2)
            c.translate(-(bx + bw / 2), -(by + bh / 2))
            card(c, bx, by, bw, bh, a, 22)
            draw_text(c, self.badge, bx + bw / 2, by + 50, "mark", 34, "orange", a, align="center")
            c.restore()

    def draw_progress(self, c, t):
        p = (self.t_off + t) / self.total
        c.drawRoundRect(skia.Rect.MakeXYWH(BX0, 44, BW, 10), 5, 5, paint("soft", fill=True))
        c.drawRoundRect(skia.Rect.MakeXYWH(BX0, 44, max(10, BW * p), 10), 5, 5, grad_paint("orange", 44, 54, 255, 0.3))

    # ---------------------------------------------------------- escena
    def draw_stage(self, c, t):
        cur_i = 0
        for i, (st, _) in enumerate(self.vkeys):
            if t >= st:
                cur_i = i
        st0, key = self.vkeys[cur_i]
        lt = t - st0
        c.save()
        c.clipRect(skia.Rect.MakeLTRB(*STAGE))
        c.translate(0, STAGE_DY)
        fade = 0.3
        scene_in = ease(t / 0.45)
        R_ = skia.Rect.MakeLTRB(0, STAGE[1] - STAGE_DY, W, STAGE[3] - STAGE_DY)
        if cur_i > 0 and lt < fade:
            pst, pkey = self.vkeys[cur_i - 1]
            k = ease(lt / fade)
            vign.V[pkey](c, t, t - pst)
            c.saveLayerAlpha(R_, int(255 * k))
            vign.V[key](c, t, lt)
            c.restore()
        elif scene_in < 1:
            c.saveLayerAlpha(R_, int(255 * scene_in))
            vign.V[key](c, t, lt)
            c.restore()
        else:
            vign.V[key](c, t, lt)
        c.restore()

    # ---------------------------------------------------------- pizarron
    def scroll_at(self, t):
        s, prev = 0.0, 0.0
        for (kt, target) in self.scroll_keys:
            if t >= kt:
                k = ease((t - kt) / 0.6)
                s = prev + (target - prev) * k
                prev = target if k >= 1 else s
            else:
                break
        return s

    def draw_board(self, c, t, beat_i):
        sc = self.sc
        sy = self.scroll_at(t)
        c.save()
        c.clipRect(skia.Rect.MakeLTRB(0, BY0 - 16, W, BY1 + 20))
        visible = [i for i, rt in enumerate(self.reveal) if rt is not None and t >= rt]
        newest = max(visible, key=lambda i: self.reveal[i]) if visible else -1
        newest_t = self.reveal[newest] if newest >= 0 else None
        for i in visible:
            rt = self.reveal[i]
            et = t - rt
            k = ease_out(et / 0.35)
            y = BY0 + self.tops[i] - sy + 30 * (1 - k)
            h = self.lay[i][0]
            if y > BY1 + 10 or y + h < BY0 - 40:
                continue
            a = int(255 * k)
            if y < BY0:
                hid = min(1.0, (BY0 - y) / max(60.0, min(h, 220.0)))
                a = int(a * (1 - hid) ** 1.5)
                if a < 4:
                    continue
            is_new = (rt == newest_t)
            if not is_new and not sc.get("quiz") and not sc.get("full_text") and len(visible) > 2:
                a = int(a * 0.6)
            st = {"et": et, "newest": i == newest}
            if sc.get("quiz"):
                st["answered"] = False
                st["at"] = 0
                if beat_i >= 2 and len(self.tl["beats"][2]["lines"]) > 1:
                    st["at"] = t - self.tl["beats"][2]["lines"][1]["start"]
                    st["answered"] = st["at"] >= 0
            if sc.get("full_text"):
                st["phrase"] = beat_i - 1
            self.lay[i][1](c, BX0, y, a, st)
        c.restore()

    def beat_at(self, t):
        bi = 0
        for i, b in enumerate(self.tl["beats"]):
            if t >= b["start"] - 0.001:
                bi = i
        return bi

    def draw(self, c, fi, bgimg):
        t = fi / FPS
        Boil.frame(fi)
        c.drawImage(bgimg, 0, 0)
        self.draw_progress(c, t)
        self.draw_stage(c, t)
        self.draw_labels(c, t)
        self.draw_caption(c, t)
        self.draw_board(c, t, self.beat_at(t))


def load():
    with open(os.path.join(BUILD, "timeline.json")) as f:
        return json.load(f)


def render_scene(idx, out_path=None, frames=None, png=None):
    tl = load()
    total = sum(s["dur"] for s in tl)
    t_off = sum(s["dur"] for s in tl[:idx])
    sc = script.SCENES[idx]
    set_theme(bool(sc.get("dark")))
    bgimg = paper_image(bool(sc.get("dark")))
    r = SceneR(sc, tl[idx], t_off, total)
    arr = np.zeros((H, W, 4), np.uint8)
    surf = skia.Surface(arr, colorType=skia.kRGBA_8888_ColorType)
    c = surf.getCanvas()
    nfr = tl[idx]["frames"]
    if png is not None:
        for fi in frames:
            r.draw(c, fi, bgimg)
            surf.makeImageSnapshot().save(png % fi, skia.kPNG)
        return
    out_path = out_path or os.path.join(BUILD, "scene_%02d.mp4" % idx)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "%dx%d" % (W, H),
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-tune", "animation",
           "-pix_fmt", "yuv420p", "-threads", "2", out_path + ".tmp.mp4"]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for fi in range(nfr):
        r.draw(c, fi, bgimg)
        p.stdin.write(arr.tobytes())
    p.stdin.close()
    p.wait()
    os.replace(out_path + ".tmp.mp4", out_path)
    return idx


def render_all(workers=4):
    from multiprocessing import Pool
    tl = load()
    order = sorted(range(len(tl)), key=lambda i: -tl[i]["dur"])
    todo = [i for i in order if not os.path.exists(os.path.join(BUILD, "scene_%02d.mp4" % i))]
    with Pool(workers) as pool:
        for idx in pool.imap_unordered(render_scene, todo):
            print("done", idx, flush=True)


if __name__ == "__main__":
    if sys.argv[1] == "png":
        idx = int(sys.argv[2])
        fr = [int(x) for x in sys.argv[3].split(",")]
        render_scene(idx, frames=fr, png=sys.argv[4])
    elif sys.argv[1] == "all":
        render_all(int(sys.argv[2]) if len(sys.argv) > 2 else 4)
    elif sys.argv[1] == "scene":
        for s in sys.argv[2:]:
            render_scene(int(s))
            print("done", s, flush=True)
