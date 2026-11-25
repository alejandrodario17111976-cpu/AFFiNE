# -*- coding: utf-8 -*-
"""Primitivas dibujadas a mano, texto enriquecido y el muñeco de palitos."""
import math, os, re
import numpy as np
import skia

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920

# ------------------------------------------------------------------ theme
LIGHT = dict(bg=(250, 247, 239), ink=(30, 30, 36), blue=(37, 99, 235), red=(228, 74, 46), green=(36, 150, 90),
             gray=(110, 110, 118), soft=(200, 196, 186), marker=(255, 224, 102), note=(255, 241, 168),
             paper2=(255, 255, 255), orange=(244, 162, 89), fungus=(122, 160, 74), purple=(140, 82, 200),
             sky=(120, 180, 235), skin=(255, 255, 255))
DARK = dict(bg=(26, 28, 24), ink=(236, 233, 224), blue=(125, 178, 255), red=(255, 110, 90), green=(120, 205, 120),
            gray=(165, 165, 158), soft=(80, 82, 74), marker=(150, 120, 20), note=(58, 62, 44),
            paper2=(40, 43, 36), orange=(240, 160, 80), fungus=(150, 196, 90), purple=(190, 140, 240),
            sky=(70, 100, 130), skin=(40, 43, 36))
TH = dict(LIGHT)


def set_theme(dark):
    TH.clear()
    TH.update(DARK if dark else LIGHT)


def col(name, a=255):
    if isinstance(name, tuple):
        r, g, b = name[:3]
    else:
        r, g, b = TH[name]
    return skia.ColorSetARGB(int(max(0, min(255, a))), r, g, b)


# ------------------------------------------------------------------ fonts
FD = os.path.join(ROOT, "fonts")
TF = {
    "hand": skia.Typeface.MakeFromFile(os.path.join(FD, "PatrickHand-Regular.ttf")),
    "bold": skia.Typeface.MakeFromFile(os.path.join(FD, "Kalam-Bold.ttf")),
    "mark": skia.Typeface.MakeFromFile(os.path.join(FD, "PermanentMarker-Regular.ttf")),
    "fb": skia.Typeface.MakeFromFile("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
}
_fonts = {}


def font(kind, size):
    k = (kind, int(size))
    if k not in _fonts:
        f = skia.Font(TF[kind], int(size))
        f.setSubpixel(True)
        f.setEdging(skia.Font.Edging.kAntiAlias)
        _fonts[k] = f
    return _fonts[k]


_has = {}


def has_glyph(kind, ch):
    k = (kind, ch)
    if k not in _has:
        _has[k] = TF[kind].unicharToGlyph(ord(ch)) != 0
    return _has[k]


def runs(text, kind):
    """divide en tramos (texto, usa_fallback)."""
    out, cur, fb = [], "", None
    for ch in text:
        f = not has_glyph(kind, ch) and ch not in " \n"
        if fb is None or f == fb:
            cur += ch
            fb = f
        else:
            out.append((cur, fb))
            cur, fb = ch, f
    if cur:
        out.append((cur, fb))
    return out


def text_w(text, kind, size):
    w = 0
    for s, fb in runs(text, kind):
        w += font("fb" if fb else kind, size * (0.8 if fb else 1)).measureText(s)
    return w


def draw_text(c, text, x, y, kind, size, color, a=255, align="left"):
    if align != "left":
        tw = text_w(text, kind, size)
        x -= tw if align == "right" else tw / 2
    p = skia.Paint(AntiAlias=True, Color=col(color, a))
    for s, fb in runs(text, kind):
        f = font("fb" if fb else kind, size * (0.8 if fb else 1))
        c.drawString(s, x, y, f, p)
        x += f.measureText(s)
    return x


def parse_rich(text):
    """'{ingles}' -> lista de (palabra, es_ingles)."""
    out = []
    for part in re.split(r"(\{[^}]*\})", text):
        if not part:
            continue
        en = part.startswith("{")
        s = part[1:-1] if en else part
        toks = re.split(r"( )", s)
        for t in toks:
            if t:
                out.append((t, en))
    return out


def wrap_rich(text, kind, size, maxw, en_kind=None):
    """Devuelve lineas: lista de listas de (texto, es_ingles)."""
    en_kind = en_kind or kind
    toks = parse_rich(text)
    lines, cur, w = [], [], 0.0
    # agrupar tokens en palabras (sin espacios)
    words = []
    for t, en in toks:
        if t == " ":
            words.append(None)
        else:
            if words and words[-1] is not None:
                words[-1].append((t, en))
            else:
                words.append([(t, en)])
    sp = text_w(" ", kind, size)
    for wd in words:
        if wd is None:
            if cur:
                cur.append((" ", False))
                w += sp
            continue
        ww = sum(text_w(t, en_kind if en else kind, size) for t, en in wd)
        if cur and w + ww > maxw and any(t.strip() for t, _ in cur):
            while cur and cur[-1][0] == " ":
                cur.pop()
            lines.append(cur)
            cur, w = [], 0.0
        cur.extend(wd)
        w += ww
    while cur and cur[-1][0] == " ":
        cur.pop()
    if cur:
        lines.append(cur)
    # fusionar tramos contiguos del mismo estilo
    merged = []
    for ln in lines:
        m = []
        for t, en in ln:
            if m and m[-1][1] == en:
                m[-1] = (m[-1][0] + t, en)
            else:
                m.append((t, en))
        merged.append(m)
    return merged


def line_w(line, kind, size, en_kind=None):
    en_kind = en_kind or kind
    return sum(text_w(t, en_kind if en else kind, size) for t, en in line)


def draw_rich_line(c, line, x, y, kind, size, color, a=255, en_kind=None, en_color="blue", align="left"):
    en_kind = en_kind or kind
    if align == "center":
        x -= line_w(line, kind, size, en_kind) / 2
    for t, en in line:
        x = draw_text(c, t, x, y, en_kind if en else kind, size, en_color if en else color, a)
    return x


# ------------------------------------------------------------------ boil / jitter
_RNG = np.random.default_rng(7).uniform(-1, 1, size=(8192, 2))


class Boil:
    seed = 0
    n = 0

    @classmethod
    def frame(cls, fi):
        cls.seed = fi // 3
        cls.n = 0

    @classmethod
    def j(cls, amp=1.6):
        cls.n += 1
        v = _RNG[(cls.seed * 1031 + cls.n * 7) % 8192]
        return v[0] * amp, v[1] * amp


def paint(color="ink", w=6, a=255, fill=False):
    p = skia.Paint(AntiAlias=True, Color=col(color, a), StrokeWidth=w,
                   StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)
    p.setStyle(skia.Paint.kFill_Style if fill else skia.Paint.kStroke_Style)
    return p


def L(c, pts, w=6, color="ink", a=255, jit=1.4, close=False, fill=None, fa=255):
    """polilinea a mano alzada"""
    if len(pts) < 2:
        return
    pp = []
    for x, y in pts:
        dx, dy = Boil.j(jit)
        pp.append((x + dx, y + dy))
    path = skia.Path()
    path.moveTo(*pp[0])
    for i in range(1, len(pp)):
        x0, y0 = pp[i - 1]
        x1, y1 = pp[i]
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        ln = math.hypot(x1 - x0, y1 - y0) + 1e-6
        bx, by = Boil.j(min(3.0, ln * 0.03))
        path.quadTo(mx + bx, my + by, x1, y1)
    if close:
        path.close()
    if fill is not None:
        c.drawPath(path, paint(fill, a=fa, fill=True))
    if w > 0:
        c.drawPath(path, paint(color, w, a))


def C(c, x, y, r, w=6, color="ink", a=255, fill=None, fa=255, jit=1.2):
    dx, dy = Boil.j(jit)
    if fill is not None:
        c.drawCircle(x + dx, y + dy, r, paint(fill, a=fa, fill=True))
    if w > 0:
        # circulo "a mano": path con 8 segmentos ligeramente irregulares
        path = skia.Path()
        n = 10
        pts = []
        for i in range(n + 1):
            ang = 2 * math.pi * i / n + 0.3
            jr = Boil.j(r * 0.025)[0]
            pts.append((x + dx + (r + jr) * math.cos(ang), y + dy + (r + jr) * math.sin(ang)))
        path.moveTo(*pts[0])
        for i in range(1, len(pts)):
            # curva por puntos medios
            x0, y0 = pts[i - 1]
            x1, y1 = pts[i]
            ang = 2 * math.pi * (i - 0.5) / n + 0.3
            k = r / math.cos(math.pi / n)
            path.quadTo(x + dx + k * math.cos(ang), y + dy + k * math.sin(ang), x1, y1)
        c.drawPath(path, paint(color, w, a))


def R(c, x, y, w_, h_, w=6, color="ink", a=255, fill=None, fa=255, r=8, jit=1.4):
    if fill is not None:
        dx, dy = Boil.j(jit * 0.5)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + dx, y + dy, w_, h_), r, r), paint(fill, a=fa, fill=True))
    if w > 0:
        dx, dy = Boil.j(jit)
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x + dx, y + dy, w_, h_), r, r), paint(color, w, a))


def arc(c, x, y, r, a0, a1, w=6, color="ink", a=255):
    pts = []
    n = max(4, int(abs(a1 - a0) / 15))
    for i in range(n + 1):
        t = math.radians(a0 + (a1 - a0) * i / n)
        pts.append((x + r * math.cos(t), y + r * math.sin(t)))
    L(c, pts, w, color, a, jit=0.8)


def T(c, text, x, y, size=40, color="ink", kind="bold", a=255, align="center"):
    draw_text(c, text, x, y, kind, size, color, a, align)


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def back_out(t):
    t = max(0.0, min(1.0, t))
    s = 1.7
    t -= 1
    return t * t * ((s + 1) * t + s) + 1


# ------------------------------------------------------------------ stick figure
HR, NECK, TORSO, UA, LA, THI, SHI = 30, 6, 112, 60, 56, 70, 70

STAND = dict(lean=0, head=0, a1u=14, a1l=-6, a2u=-14, a2l=6, l1u=9, l1l=0, l2u=-9, l2l=0)


def P(**kw):
    d = dict(STAND)
    d.update(kw)
    return d


def mix(p, q, t):
    return {k: p.get(k, 0) * (1 - t) + q.get(k, 0) * t for k in set(p) | set(q)}


def walk_pose(t, speed=1.0, amp=26):
    s = math.sin(t * 2 * math.pi * speed)
    return P(lean=4, a1u=-amp * s * 0.9, a1l=12, a2u=amp * s * 0.9, a2l=12,
             l1u=amp * s, l1l=-max(0, -s) * 40 - 6, l2u=-amp * s, l2l=-max(0, s) * 40 - 6,
             y=-abs(math.cos(t * 2 * math.pi * speed)) * 5)


def run_pose(t, speed=1.6):
    s = math.sin(t * 2 * math.pi * speed)
    return P(lean=16, a1u=-55 * s, a1l=70, a2u=55 * s, a2l=70,
             l1u=45 * s + 10, l1l=-60 - 30 * max(0, -s), l2u=-45 * s + 10, l2l=-60 - 30 * max(0, s),
             y=-abs(math.cos(t * 2 * math.pi * speed)) * 12)


def dir_(a, f):
    r = math.radians(a)
    return math.sin(r) * f, math.cos(r)


def fig(c, x, gy, pose=None, s=1.0, f=1, w=None, color="ink", face="smile", eyes="dot", front=True,
        hair=None, beard=False, hat=None, backpack=False, talk=0.0, held=None, a=255, sick=False, glasses=False,
        clicker=False, head_scale=1.0):
    """Dibuja un muñeco de palitos. Devuelve dict con puntos (manos, cabeza...)."""
    p = dict(STAND)
    if pose:
        p.update(pose)
    w = w or 8.5 * s
    rot = p.get("rot", 0)
    legext = 0
    for u, l in (("l1u", "l1l"), ("l2u", "l2l")):
        legext = max(legext, THI * math.cos(math.radians(p[u])) + SHI * math.cos(math.radians(p[u] + p[l])))
    px, py = x, gy - (legext + 3) * s + p.get("y", 0) * s
    if rot:
        py = gy + p.get("y", 0) * s
    c.save()
    if rot:
        c.translate(px, py)
        c.rotate(rot)
        c.translate(-px, -py)
    lean = math.radians(p["lean"])
    tdx, tdy = math.sin(lean) * f, -math.cos(lean)
    neck = (px + tdx * TORSO * s, py + tdy * TORSO * s)
    hl = math.radians(p["lean"] + p.get("head", 0))
    hdx, hdy = math.sin(hl) * f, -math.cos(hl)
    hr = HR * s * head_scale
    head = (neck[0] + hdx * (NECK * s + hr), neck[1] + hdy * (NECK * s + hr))
    sh = (px + tdx * (TORSO - 8) * s, py + tdy * (TORSO - 8) * s)
    out = {"head": head, "neck": neck, "pelvis": (px, py), "hr": hr}
    # mochila (atras)
    if backpack:
        bx = sh[0] - f * 26 * s
        R(c, bx - 22 * s, sh[1] + 2 * s, 44 * s, 62 * s, w * 0.7, color, a, fill="orange", fa=a, r=10 * s)
    # piernas
    for i, (u, l) in enumerate((("l2u", "l2l"), ("l1u", "l1l"))):
        dx, dy = dir_(p[u], f)
        kx, ky = px + dx * THI * s, py + dy * THI * s
        dx2, dy2 = dir_(p[u] + p[l], f)
        fx, fy = kx + dx2 * SHI * s, ky + dy2 * SHI * s
        L(c, [(px, py), (kx, ky), (fx, fy)], w, color, a, jit=1.2 * s)
        out["foot%d" % (2 - i)] = (fx, fy)
    # torso
    L(c, [(px, py), neck], w, color, a, jit=1.2 * s)
    # brazos
    for i, (u, l) in enumerate((("a2u", "a2l"), ("a1u", "a1l"))):
        dx, dy = dir_(p[u], f)
        ex, ey = sh[0] + dx * UA * s, sh[1] + dy * UA * s
        dx2, dy2 = dir_(p[u] + p[l], f)
        hx, hy = ex + dx2 * LA * s, ey + dy2 * LA * s
        L(c, [sh, (ex, ey), (hx, hy)], w, color, a, jit=1.2 * s)
        out["hand%d" % (2 - i)] = (hx, hy)
        out["elbow%d" % (2 - i)] = (ex, ey)
    # cabeza
    hx, hy = head
    if clicker:
        # cabeza de hongo: bulto irregular con "placas"
        for k in range(9):
            ang = k / 9 * 2 * math.pi
            rr = hr * (1.0 + 0.25 * math.sin(k * 2.3))
            C(c, hx + math.cos(ang) * hr * 0.55, hy + math.sin(ang) * hr * 0.55, rr * 0.55, w * 0.6, "fungus", a,
              fill="fungus", fa=int(a * 0.55))
        C(c, hx, hy, hr * 0.95, w, color, a)
        for k in range(4):
            ang = k * 1.6 + 0.4
            L(c, [(hx + math.cos(ang) * hr * 0.2, hy + math.sin(ang) * hr * 0.2),
                  (hx + math.cos(ang) * hr * 0.95, hy + math.sin(ang) * hr * 0.95)], w * 0.5, color, a)
        out["face"] = head
        c.restore()
        return out
    C(c, hx, hy, hr, w, color, a, fill="skin", fa=a)
    if sick:
        for k in range(5):
            ang = -2.6 + k * 0.5
            C(c, hx + math.cos(ang) * hr * 0.98, hy + math.sin(ang) * hr * 0.98, hr * 0.22, w * 0.5, "fungus", a,
              fill="fungus", fa=a)
    fdx = 0 if front else f * hr * 0.32
    ex1, ex2 = hx + fdx - hr * 0.3, hx + fdx + hr * 0.3
    ey = hy - hr * 0.1
    er = max(2.5, 3.6 * s)
    if eyes == "dot":
        for exx in (ex1, ex2):
            c.drawCircle(exx, ey, er, paint(color, a=a, fill=True))
    elif eyes == "wide":
        for exx in (ex1, ex2):
            C(c, exx, ey, er * 2.0, w * 0.4, color, a, fill="skin", fa=a)
            c.drawCircle(exx, ey, er * 0.9, paint(color, a=a, fill=True))
    elif eyes == "closed":
        for exx in (ex1, ex2):
            arc(c, exx, ey - 2 * s, hr * 0.15, 20, 160, w * 0.45, color, a)
    elif eyes == "angry":
        for k, exx in enumerate((ex1, ex2)):
            c.drawCircle(exx, ey + 2 * s, er, paint(color, a=a, fill=True))
            sgn = 1 if k == 0 else -1
            L(c, [(exx - hr * 0.18, ey - hr * 0.22 - sgn * 3 * s), (exx + hr * 0.18, ey - hr * 0.22 + sgn * 3 * s)],
              w * 0.45, color, a)
    elif eyes == "x":
        for exx in (ex1, ex2):
            d = hr * 0.12
            L(c, [(exx - d, ey - d), (exx + d, ey + d)], w * 0.4, color, a)
            L(c, [(exx - d, ey + d), (exx + d, ey - d)], w * 0.4, color, a)
    elif eyes == "sad":
        for k, exx in enumerate((ex1, ex2)):
            c.drawCircle(exx, ey + 2 * s, er, paint(color, a=a, fill=True))
            sgn = 1 if k == 0 else -1
            L(c, [(exx - hr * 0.18, ey - hr * 0.2 + sgn * 3 * s), (exx + hr * 0.18, ey - hr * 0.2 - sgn * 3 * s)],
              w * 0.4, color, a)
    if glasses:
        for exx in (ex1, ex2):
            R(c, exx - hr * 0.22, ey - hr * 0.15, hr * 0.44, hr * 0.3, w * 0.4, color, a, fill="ink", fa=a, r=4)
        L(c, [(ex1 + hr * 0.22, ey - hr * 0.05), (ex2 - hr * 0.22, ey - hr * 0.05)], w * 0.35, color, a)
    mx, my = hx + fdx, hy + hr * 0.38
    mw = hr * 0.32
    if talk > 0.05:
        oh = hr * 0.08 + hr * 0.28 * min(1, talk)
        c.drawOval(skia.Rect.MakeXYWH(mx - mw * 0.7, my - oh * 0.4, mw * 1.4, oh), paint(color, a=a, fill=True))
    elif face == "smile":
        arc(c, mx, my - hr * 0.2, mw, 30, 150, w * 0.45, color, a)
    elif face == "big":
        path = skia.Path()
        path.moveTo(mx - mw, my - hr * 0.05)
        path.quadTo(mx, my + hr * 0.45, mx + mw, my - hr * 0.05)
        path.close()
        c.drawPath(path, paint(color, a=a, fill=True))
    elif face == "sad":
        arc(c, mx, my + hr * 0.18, mw * 0.8, 210, 330, w * 0.45, color, a)
    elif face == "flat":
        L(c, [(mx - mw * 0.7, my), (mx + mw * 0.7, my)], w * 0.45, color, a)
    elif face == "o":
        C(c, mx, my + 2 * s, hr * 0.13, w * 0.4, color, a)
    elif face == "angry":
        arc(c, mx, my + hr * 0.18, mw * 0.7, 215, 325, w * 0.45, color, a)
        L(c, [(mx - mw * 0.7, my), (mx + mw * 0.7, my)], w * 0.3, color, a)
    elif face == "grr":
        R(c, mx - mw, my - hr * 0.1, mw * 2, hr * 0.25, w * 0.35, color, a, fill="skin", fa=a, r=3)
        for k in range(1, 4):
            L(c, [(mx - mw + k * mw * 0.5, my - hr * 0.1), (mx - mw + k * mw * 0.5, my + hr * 0.15)], w * 0.25, color, a)
    # pelo / barba / sombrero
    if hair == "pony":
        bx = -f if front else -f
        L(c, [(hx - hr * 0.9, hy - hr * 0.35), (hx - hr * 0.3, hy - hr * 0.95), (hx + hr * 0.5, hy - hr * 0.9),
              (hx + hr * 0.95, hy - hr * 0.3)], w * 0.8, color, a)
        L(c, [(hx + bx * hr * 0.85, hy - hr * 0.55), (hx + bx * hr * 1.5, hy - hr * 0.3),
              (hx + bx * hr * 1.7, hy + hr * 0.35)], w * 0.9, color, a)
        L(c, [(hx + bx * hr * 1.5, hy - hr * 0.3), (hx + bx * hr * 1.35, hy + hr * 0.45)], w * 0.6, color, a)
    elif hair == "short":
        for k in range(6):
            ang = math.radians(-160 + k * 28)
            L(c, [(hx + math.cos(ang) * hr * 0.95, hy + math.sin(ang) * hr * 0.95),
                  (hx + math.cos(ang) * hr * 1.22, hy + math.sin(ang) * hr * 1.18)], w * 0.6, color, a)
    if beard:
        pts = []
        for k in range(9):
            ang = math.radians(15 + k * 18.75)
            rr = hr * (1.0 if k % 2 else 1.12)
            pts.append((hx + math.cos(ang) * rr, hy + math.sin(ang) * rr))
        L(c, pts, w * 0.75, color, a)
        for k in range(5):
            ang = math.radians(35 + k * 27)
            L(c, [(hx + math.cos(ang) * hr * 0.72, hy + math.sin(ang) * hr * 0.72),
                  (hx + math.cos(ang) * hr * 0.98, hy + math.sin(ang) * hr * 0.98)], w * 0.35, color, a)
    if hat == "chef":
        L(c, [(hx - hr * 0.7, hy - hr * 0.75), (hx - hr * 0.7, hy - hr * 1.4)], w * 0.7, color, a)
        L(c, [(hx + hr * 0.7, hy - hr * 0.75), (hx + hr * 0.7, hy - hr * 1.4)], w * 0.7, color, a)
        for k in (-1, 0, 1):
            C(c, hx + k * hr * 0.55, hy - hr * 1.6, hr * 0.45, w * 0.6, color, a, fill="paper2", fa=a)
        L(c, [(hx - hr * 0.75, hy - hr * 0.8), (hx + hr * 0.75, hy - hr * 0.8)], w * 0.7, color, a)
    elif hat == "cap":
        path_pts = [(hx - hr * 0.95, hy - hr * 0.45), (hx - hr * 0.8, hy - hr * 1.1), (hx + hr * 0.8, hy - hr * 1.1),
                    (hx + hr * 0.95, hy - hr * 0.45)]
        L(c, path_pts, w * 0.7, color, a, close=True, fill="blue", fa=a)
        L(c, [(hx - hr * 1.0, hy - hr * 0.45), (hx + hr * 1.35 * (1 if f > 0 else -1), hy - hr * 0.4)], w * 0.8, color, a)
        C(c, hx, hy - hr * 0.8, hr * 0.14, w * 0.3, "marker", a, fill="marker", fa=a)
    elif hat == "helmet":
        arc(c, hx, hy - hr * 0.1, hr * 1.12, 180, 360, w, color, a)
        L(c, [(hx - hr * 1.25, hy - hr * 0.1), (hx + hr * 1.25, hy - hr * 0.1)], w, color, a)
        L(c, [(hx, hy - hr * 1.2), (hx, hy - hr * 0.15)], w * 0.5, color, a)
    elif hat == "sun":
        L(c, [(hx - hr * 1.6, hy - hr * 0.55), (hx + hr * 1.6, hy - hr * 0.55)], w, color, a)
        arc(c, hx, hy - hr * 0.55, hr * 0.85, 180, 360, w, color, a)
    elif hat == "grad":
        L(c, [(hx - hr * 1.3, hy - hr * 1.0), (hx, hy - hr * 1.45), (hx + hr * 1.3, hy - hr * 1.0), (hx, hy - hr * 0.6)],
          w * 0.6, color, a, close=True, fill="ink", fa=a)
    out["face"] = head
    c.restore()
    return out


# ------------------------------------------------------------------ paper
def paper_image(dark=False):
    rng = np.random.default_rng(3)
    base = np.array(DARK["bg"] if dark else LIGHT["bg"], np.float32)
    img = np.ones((H, W, 3), np.float32) * base
    noise = rng.normal(0, 2.2 if not dark else 2.8, (H // 2, W // 2, 1)).astype(np.float32)
    noise = np.repeat(np.repeat(noise, 2, 0), 2, 1)
    img += noise
    yy, xx = np.mgrid[0:H, 0:W]
    v = ((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.75)) ** 2
    img *= (1 - 0.08 * v)[..., None]
    out = np.concatenate([np.clip(img, 0, 255).astype(np.uint8), np.full((H, W, 1), 255, np.uint8)], axis=2)
    return skia.Image.fromarray(np.ascontiguousarray(out), colorType=skia.kRGBA_8888_ColorType)
