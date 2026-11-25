# -*- coding: utf-8 -*-
"""Renderiza el video completo (1080x1920, 30 fps) a partir del guion y la linea de tiempo."""
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
BUILD = os.path.join(ROOT, "build")
FPS = 30

BX0, BX1 = 70, 1010
BW = BX1 - BX0
BY0, BY1 = 935, 1668
VH = BY1 - BY0
STAGE = (0, 338, W, 912)


# ================================================================== board items
def lay_text(text, size=46, kind="hand", en_kind="bold", color="ink", width=BW, lh=1.3):
    lines = wrap_rich(text, kind, size, width, en_kind)
    return lines, size * lh


def item_layout(it):
    typ = it[0]
    if typ in ("p", "bul"):
        size = 46 if typ == "p" else 50
        lines, lh = lay_text(it[1], size)
        h = len(lines) * lh + 6

        def draw(c, x, y, a, st):
            for i, ln in enumerate(lines):
                draw_rich_line(c, ln, x, y + size + i * lh, "hand", size, "ink", a, "bold")
        return h, draw

    if typ == "st":
        size = 44
        lines, lh = lay_text(it[1], size, "bold", "bold", width=BW - 50)
        h = len(lines) * lh + 30

        def draw(c, x, y, a, st):
            k = ease((st["et"] or 9) / 0.5)
            wmax = max(line_w(ln, "bold", size) for ln in lines) + 40
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 6, y + 4, wmax * k + 6, h - 8), 10, 10),
                        paint("marker", a=int(a * 0.85), fill=True))
            for i, ln in enumerate(lines):
                draw_rich_line(c, ln, x + 16, y + 12 + size * 0.98 + i * lh, "bold", size, "ink", a, "bold")
        return h, draw

    if typ == "ex":
        en, es = it[1], it[2]
        s1, s2 = 54, 46
        l1 = wrap_rich("{" + en + "}", "bold", s1, BW - 40, "bold")
        l2 = wrap_rich("= " + es, "hand", s2, BW - 40) if es else []
        lh1, lh2 = s1 * 1.22, s2 * 1.25
        h = len(l1) * lh1 + len(l2) * lh2 + 18

        def draw(c, x, y, a, st):
            L(c, [(x + 4, y + 10), (x + 4, y + h - 10)], 7, "green", a)
            if st["newest"] and st["et"] is not None:
                k = ease(st["et"] / 0.7)
                for i, ln in enumerate(l1):
                    lw = line_w(ln, "bold", s1)
                    yy = y + 6 + i * lh1
                    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 20, yy + s1 * 0.55, lw * k + 16, s1 * 0.5),
                                                      6, 6), paint("marker", a=int(a * 0.8), fill=True))
            for i, ln in enumerate(l1):
                draw_rich_line(c, ln, x + 28, y + 6 + s1 + i * lh1, "bold", s1, "ink", a, "bold")
            for i, ln in enumerate(l2):
                draw_rich_line(c, ln, x + 28, y + 6 + len(l1) * lh1 + s2 + i * lh2 - 4, "hand", s2, "gray", a, "bold")
        return h, draw

    if typ == "tip":
        size = 43
        lines, lh = lay_text(it[1], size, width=BW - 70)
        h = len(lines) * lh + 48

        def draw(c, x, y, a, st):
            c.save()
            c.rotate(-0.6, x + BW / 2, y + h / 2) if False else None
            c.drawRect(skia.Rect.MakeXYWH(x + 6, y + 10, BW - 6, h - 6), paint("ink", a=int(a * 0.10), fill=True))
            R(c, x, y + 4, BW - 6, h - 8, 4, "ink", a, fill="note", fa=a, r=4)
            c.drawRect(skia.Rect.MakeXYWH(x + BW / 2 - 70, y - 8, 140, 30), paint("soft", a=int(a * 0.7), fill=True))
            for i, ln in enumerate(lines):
                draw_rich_line(c, ln, x + 30, y + 22 + size + i * lh, "hand", size, "ink", a, "bold")
            c.restore()
        return h, draw

    if typ == "vocab":
        en, es = it[1], it[2]
        h = 74

        def draw(c, x, y, a, st):
            if st["newest"]:
                k = ease((st["et"] or 9) / 0.4)
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 10, y + 6, (BW + 20) * k, h - 8), 12, 12),
                            paint("marker", a=int(a * 0.7), fill=True))
            draw_text(c, en, x + 10, y + 56, "bold", 52, "blue", a)
            ew = text_w(en, "bold", 52)
            xx = x + 10 + ew + 20
            while xx < x + 460:
                c.drawCircle(xx, y + 44, 3, paint("soft", a=a, fill=True))
                xx += 18
            draw_text(c, es, x + 480, y + 56, "hand", 52, "ink", a)
        return h, draw

    if typ == "word":
        w_, meaning, en, es = it[1:5]
        s0 = 54
        ww = text_w(w_, "mark", s0)
        ml = wrap_rich(meaning, "hand", 42, BW - ww - 80)
        if len(ml) > 1:
            ml = wrap_rich(meaning, "hand", 42, BW - 60)
            top = s0 * 1.25 + len(ml) * 50
        else:
            top = s0 * 1.25
        el = wrap_rich("{" + en + "}", "bold", 44, BW - 60, "bold")
        sl = wrap_rich("= " + es, "hand", 40, BW - 60) if es else []
        h = 20 + top + len(el) * 54 + len(sl) * 50 + 20

        def draw(c, x, y, a, st):
            R(c, x, y + 4, BW - 6, h - 8, 4, "soft", a, fill="paper2", fa=int(a * 0.6), r=16)
            draw_text(c, w_, x + 24, y + 14 + s0, "mark", s0, "blue", a)
            if top == s0 * 1.25:
                draw_rich_line(c, ml[0], x + 24 + ww + 22, y + 12 + s0, "hand", 42, "ink", a)
                yy = y + 20 + top
            else:
                for i, ln in enumerate(ml):
                    draw_rich_line(c, ln, x + 24, y + 14 + s0 * 1.25 + 42 + i * 50, "hand", 42, "ink", a)
                yy = y + 20 + top
            for i, ln in enumerate(el):
                draw_rich_line(c, ln, x + 24, yy + 44 + i * 54, "bold", 44, "ink", a, "bold")
            yy += len(el) * 54
            for i, ln in enumerate(sl):
                draw_rich_line(c, ln, x + 24, yy + 40 + i * 50, "hand", 40, "gray", a)
        return h, draw

    if typ == "cmp":
        h1, t1, h2, t2 = it[1:5]
        cw = (BW - 30) / 2
        a1 = wrap_rich(t1, "hand", 40, cw - 40)
        a2 = wrap_rich(t2, "hand", 40, cw - 40)
        h = 30 + 56 + max(len(a1), len(a2)) * 50 + 20

        def draw(c, x, y, a, st):
            for j, (hh, ll, cl) in enumerate(((h1, a1, "blue"), (h2, a2, "green"))):
                xx = x + j * (cw + 30)
                R(c, xx, y + 4, cw, h - 8, 5, cl, a, fill="paper2", fa=int(a * 0.7), r=14)
                draw_text(c, hh, xx + 20, y + 58, "bold", 42, cl, a)
                for i, ln in enumerate(ll):
                    draw_rich_line(c, ln, xx + 20, y + 112 + i * 50, "hand", 40, "ink", a)
        return h, draw

    if typ == "row3":
        cols = it[1:4]
        header = len(it) > 4 and it[4]
        cw = BW / 3
        wr = [wrap_rich(cc, "bold" if header else "hand", 40, cw - 20, "bold") for cc in cols]
        h = max(len(w_) for w_ in wr) * 48 + 24

        def draw(c, x, y, a, st):
            if header:
                c.drawRect(skia.Rect.MakeXYWH(x, y, BW, h), paint("sky", a=int(a * 0.35), fill=True))
            for j, ll in enumerate(wr):
                for i, ln in enumerate(ll):
                    draw_rich_line(c, ln, x + j * cw + 10, y + 50 + i * 48, "bold" if header else "hand", 40,
                                   "ink", a, "bold")
            L(c, [(x, y + h), (x + BW, y + h)], 3, "soft", a, jit=0.5)
        return h, draw

    if typ == "sum":
        tema, est, idea = it[1:4]
        h = 128

        def draw(c, x, y, a, st):
            if st["newest"]:
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 10, y + 2, BW + 20, h - 6), 14, 14),
                            paint("sky", a=int(a * 0.3), fill=True))
            draw_text(c, tema, x + 6, y + 50, "bold", 44, "blue", a)
            draw_text(c, "→ " + idea, x + BW - 4, y + 50, "hand", 40, "gray", a, align="right") \
                if text_w(tema, "bold", 44) + text_w("→ " + idea, "hand", 40) < BW - 30 else None
            ln = wrap_rich(est, "bold", 40, BW - 40, "bold")[0]
            lw = line_w(ln, "bold", 40)
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + 6, y + 66, lw + 30, 52), 10, 10),
                        paint("marker", a=int(a * 0.8), fill=True))
            draw_rich_line(c, ln, x + 20, y + 106, "bold", 40, "ink", a, "bold")
            if text_w(tema, "bold", 44) + text_w("→ " + idea, "hand", 40) >= BW - 30:
                draw_text(c, "→ " + idea, x + BW - 4, y + 106, "hand", 38, "gray", a, align="right")
        return h, draw

    if typ == "quiz":
        q, opts, ans, full = it[1:5]
        ql = wrap_rich(q, "bold", 60, BW - 20)
        # opciones: filas
        pills, row, rw = [], [], 0
        for i, o in enumerate(opts):
            pw = text_w(o, "bold", 50) + 70
            if row and rw + pw > BW:
                pills.append(row)
                row, rw = [], 0
            row.append((i, o, pw))
            rw += pw + 24
        pills.append(row)
        fl = wrap_rich("{" + full + "}", "bold", 48, BW - 80, "bold")
        h = len(ql) * 76 + 30 + len(pills) * 120 + 30 + len(fl) * 62 + 20

        def draw(c, x, y, a, st):
            answered = st.get("answered", False)
            ak = ease((st.get("at") or 0) / 0.5) if answered else 0
            for i, ln in enumerate(ql):
                draw_rich_line(c, ln, x + 10, y + 62 + i * 76, "bold", 60, "ink", a)
            yy = y + len(ql) * 76 + 30
            for row_ in pills:
                rw_ = sum(pw for _, _, pw in row_) + 24 * (len(row_) - 1)
                xx = x + (BW - rw_) / 2
                for i, o, pw in row_:
                    good = i == ans
                    fade = int(a * (1 - 0.6 * ak)) if not good else a
                    fillc = "green" if (good and ak > 0) else "paper2"
                    R(c, xx, yy, pw, 96, 6, "ink", fade, fill=fillc, fa=int(fade * (0.35 if good and ak > 0 else 1)),
                      r=40)
                    draw_text(c, o, xx + pw / 2, yy + 66, "bold", 50, "blue" if not (good and ak > 0) else "ink",
                              fade, align="center")
                    if good and ak > 0:
                        p = skia.Path()
                        p.addOval(skia.Rect.MakeXYWH(xx - 16, yy - 14, pw + 32, 124))
                        meas = skia.PathMeasure(p, False)
                        seg = skia.Path()
                        meas.getSegment(0, meas.getLength() * ak, seg, True)
                        c.drawPath(seg, paint("red", 8, a))
                    xx += pw + 24
                yy += 120
            if answered and ak > 0:
                for i, ln in enumerate(fl):
                    draw_rich_line(c, ln, x + 70, yy + 46 + i * 62, "bold", 48, "ink", int(a * ak), "bold")
                check(c, x + 30, yy + 30, 0.7)
        return h, draw

    if typ == "full":
        text = it[1]
        # palabras con indice de frase
        words = []
        for pi, (en, es, _) in enumerate(script.TLOU):
            for wd in en.split(" "):
                words.append((wd, pi))
        size = 47
        lh = size * 1.32
        lines, cur, wsum = [], [], 0
        spw = text_w(" ", "bold", size)
        for wd, pi in words:
            ww = text_w(wd, "bold", size)
            if cur and wsum + ww > BW - 10:
                lines.append(cur)
                cur, wsum = [], 0
            cur.append((wd, pi, wsum))
            wsum += ww + spw
        if cur:
            lines.append(cur)
        h = len(lines) * lh + 20

        def draw(c, x, y, a, st):
            cur_p = st.get("phrase", -1)
            for i, ln in enumerate(lines):
                yy = y + size + i * lh
                for wd, pi, ox in ln:
                    ww = text_w(wd, "bold", size)
                    if pi == cur_p:
                        c.drawRect(skia.Rect.MakeXYWH(x + ox - 4, yy - size * 0.78, ww + 8 + spw, size * 1.02),
                                   paint("marker", a=int(a * 0.85), fill=True))
                        colr = "ink"
                    elif pi < cur_p:
                        colr = "ink"
                    else:
                        colr = "gray"
                    draw_text(c, wd, x + ox, yy, "bold", size, colr, a if pi <= cur_p else int(a * 0.6))
        return h, draw

    raise ValueError(typ)


# ================================================================== captions
def chunk_text(text, maxc=78):
    plain_len = lambda s: len(re.sub(r"[{}]", "", s))
    parts = re.split(r"(?<=[.?!:;])\s+", text.strip())
    out = []
    for p in parts:
        if plain_len(p) > maxc + 15:
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
    merged = []
    for p in out:
        if merged and plain_len(merged[-1] + " " + p) <= maxc:
            merged[-1] = merged[-1] + " " + p
        else:
            merged.append(p)
    # balancear llaves partidas
    fixed = []
    for p in merged:
        if p.count("{") > p.count("}"):
            p = p + "}"
        if p.count("}") > p.count("{"):
            p = "{" + p
        fixed.append(p)
    return fixed


# ================================================================== scene renderer
class SceneR:
    def __init__(self, sc, tl, t_off, total):
        self.sc, self.tl = sc, tl
        self.t_off, self.total = t_off, total
        self.dark = bool(sc.get("dark"))
        items = sc["items"]
        self.lay = [item_layout(it) for it in items]
        gap = 22
        self.tops = []
        y = 0
        for h, _ in self.lay:
            self.tops.append(y)
            y += h + gap
        # tiempos de revelado de cada item
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
        # scroll objetivo en cada instante de revelado
        self.scroll_keys = [(0.0, 0.0)]
        for idx, rt in sorted([(i, t) for i, t in enumerate(self.reveal) if t is not None], key=lambda z: z[1]):
            bottom = self.tops[idx] + self.lay[idx][0]
            target = max(0.0, bottom - VH + 12)
            # que el principio del item tambien quede visible
            target = min(target, self.tops[idx])
            target = max(target, self.scroll_keys[-1][1]) if True else target
            self.scroll_keys.append((rt, target))
        # viñetas
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
        # subtitulos
        self.caps = []
        for b in beats:
            for ln in b["lines"]:
                if ln["lang"] == "pause" or not ln["text"]:
                    continue
                txt = ln["text"] if ln["lang"] == "es" else "{" + ln["text"] + "}"
                chunks = chunk_text(txt) if ln["lang"] == "es" else [txt]
                tot = sum(len(ch) for ch in chunks)
                t0 = ln["start"]
                for ch in chunks:
                    d = ln["dur"] * len(ch) / tot
                    self.caps.append((t0, t0 + d, ch, ln["lang"]))
                    t0 += d
        self._capcache = {}
        # cabecera
        self.header_layout()
        self.env = tl["env"]

    # ---------------------------------------------------------- header
    def header_layout(self):
        sc = self.sc
        title = sc["title"]
        mx = 96 if sc.get("big_title") else 80
        for size in range(mx, 40, -4):
            lines = wrap_rich(title, "mark", size, BW)
            if len(lines) == 1 or (len(lines) == 2 and size <= 72):
                break
        self.t_size, self.t_lines = size, lines
        sub = sc.get("sub") or ""
        ss = 46
        while text_w(sub, "hand", ss) > BW and ss > 30:
            ss -= 2
        self.s_size = ss

    def draw_header(self, c, t):
        sc = self.sc
        k = ease_out(t / 0.5)
        a = int(255 * k)
        dx = -40 * (1 - k)
        chip = sc["chip"]
        cw = text_w(chip, "bold", 32) + 44
        R(c, BX0 + dx, 70, cw, 50, 4, "ink", a, fill="red", fa=a, r=24)
        draw_text(c, chip, BX0 + 22 + dx, 106, "bold", 32, (255, 255, 255), a)
        y = 120 + 14 + self.t_size * 0.95
        for i, ln in enumerate(self.t_lines):
            draw_rich_line(c, ln, BX0 + dx, y, "mark", self.t_size, "ink", a)
            if i < len(self.t_lines) - 1:
                y += self.t_size * 1.08
        # subrayado
        ku = ease((t - 0.3) / 0.6)
        if ku > 0:
            lw = min(BW, max(line_w(ln, "mark", self.t_size) for ln in self.t_lines))
            L(c, [(BX0, y + 16), (BX0 + lw * 0.5 * ku, y + 20), (BX0 + lw * ku, y + 14)], 7, "red", a, jit=0.8)
        if sc.get("sub"):
            draw_text(c, sc["sub"], BX0 + dx * 0.5, y + 22 + self.s_size + 6, "hand", self.s_size, "gray", a)

    # ---------------------------------------------------------- progress
    def draw_progress(self, c, t):
        p = (self.t_off + t) / self.total
        c.drawLine(BX0, 36, BX1, 36, paint("soft", 6))
        c.drawLine(BX0, 36, BX0 + BW * p, 36, paint("red", 6))
        c.drawCircle(BX0 + BW * p, 36, 9, paint("red", fill=True))

    # ---------------------------------------------------------- stage
    def draw_stage(self, c, t):
        cur_i = 0
        for i, (st, _) in enumerate(self.vkeys):
            if t >= st:
                cur_i = i
        st0, key = self.vkeys[cur_i]
        lt = t - st0
        c.save()
        c.clipRect(skia.Rect.MakeLTRB(*STAGE))
        fade = 0.3
        scene_in = ease(t / 0.45)
        if cur_i > 0 and lt < fade:
            pst, pkey = self.vkeys[cur_i - 1]
            k = ease(lt / fade)
            c.saveLayerAlpha(skia.Rect.MakeLTRB(*STAGE), int(255 * (1 - k)))
            vign.V[pkey](c, t, t - pst)
            c.restore()
            c.saveLayerAlpha(skia.Rect.MakeLTRB(*STAGE), int(255 * k))
            s = 0.94 + 0.06 * ease_out(lt / 0.4)
            c.translate(540, 620)
            c.scale(s, s)
            c.translate(-540, -620)
            vign.V[key](c, t, lt)
            c.restore()
        elif scene_in < 1:
            c.saveLayerAlpha(skia.Rect.MakeLTRB(*STAGE), int(255 * scene_in))
            s = 0.94 + 0.06 * scene_in
            c.translate(540, 620)
            c.scale(s, s)
            c.translate(-540, -620)
            vign.V[key](c, t, lt)
            c.restore()
        else:
            vign.V[key](c, t, lt)
        c.restore()

    # ---------------------------------------------------------- board
    def scroll_at(self, t):
        s = 0.0
        prev = 0.0
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
        c.clipRect(skia.Rect.MakeLTRB(0, BY0 - 14, W, BY1 + 4))
        visible = [i for i, rt in enumerate(self.reveal) if rt is not None and t >= rt]
        newest = max(visible, key=lambda i: self.reveal[i]) if visible else -1
        newest_t = self.reveal[newest] if newest >= 0 else None
        beat = self.tl["beats"][beat_i]
        for i in visible:
            rt = self.reveal[i]
            et = t - rt
            k = ease_out(et / 0.35)
            y = BY0 + self.tops[i] - sy + 26 * (1 - k)
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
                a = int(a * 0.62)
            st = {"et": et, "newest": i == newest}
            if sc.get("quiz"):
                st["answered"] = beat_i >= 2
                st["at"] = t - self.tl["beats"][2]["start"] if beat_i >= 2 else 0
                if beat_i >= 2:
                    st["at"] = t - self.tl["beats"][2]["lines"][1]["start"] if len(self.tl["beats"][2]["lines"]) > 1 else 0
                    st["answered"] = st["at"] >= 0
            if sc.get("full_text"):
                st["phrase"] = beat_i - 1
            self.lay[i][1](c, BX0, y, a, st)
        c.restore()

    # ---------------------------------------------------------- caption + host
    def draw_caption(self, c, t, fi):
        talk = min(1.0, self.env[min(fi, len(self.env) - 1)] * 9) if self.env else 0
        cap = None
        nxt = None
        for j, (t0, t1, ch, lang) in enumerate(self.caps):
            if t0 <= t:
                cap = (t0, t1, ch, lang)
                nxt = self.caps[j + 1][0] if j + 1 < len(self.caps) else 1e9
        if cap and t > min(cap[1] + 1.4, nxt):
            cap = None
        if cap:
            cap = (cap[0], min(cap[1] + 1.2, nxt - 0.2), cap[2], cap[3])
        # anfitrion
        fig(c, 108, 1888, P(a1u=40 + 40 * talk, a1l=60 * talk, a2u=-16, a2l=8), s=0.5, f=1, front=True,
            talk=talk, face="smile", glasses=False, hair="short")
        bx, by, bw, bh = 215, 1696, 835, 196
        R(c, bx, by, bw, bh, 5, "ink", fill="paper2", r=30)
        L(c, [(bx + 4, by + bh * 0.42), (166, 1762), (bx + 4, by + bh * 0.66)], 5, "ink", fill="paper2")
        L(c, [(bx + 2, by + bh * 0.44), (bx + 2, by + bh * 0.64)], 8, "paper2", jit=0.1)
        if cap:
            t0, t1, ch, lang = cap
            a = int(255 * min(ease((t - t0) / 0.12), 1 - ease((t - t1) / 0.15)))
            key = (ch, lang)
            if key not in self._capcache:
                for size in (46, 43, 40, 37, 34):
                    lines = wrap_rich(ch, "hand", size, bw - 56, "bold")
                    if len(lines) * size * 1.22 <= bh - 30:
                        break
                self._capcache[key] = (lines, size)
            lines, size = self._capcache[key]
            lh = size * 1.22
            y0 = by + (bh - len(lines) * lh) / 2 + size * 0.82
            for i, ln in enumerate(lines):
                draw_rich_line(c, ln, bx + bw / 2, y0 + i * lh, "hand", size, "ink", a, "bold", align="center")
            if lang == "en":
                R(c, bx + bw - 74, by - 22, 64, 40, 3, "blue", fill="blue", r=12)
                draw_text(c, "EN", bx + bw - 42, by + 10, "bold", 28, (255, 255, 255), align="center")

    # ---------------------------------------------------------- frame
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
        self.draw_header(c, t)
        self.draw_stage(c, t)
        self.draw_board(c, t, self.beat_at(t))
        self.draw_caption(c, t, fi)


def load():
    with open(os.path.join(BUILD, "timeline.json")) as f:
        tl = json.load(f)
    return tl


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
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-tune", "animation",
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
