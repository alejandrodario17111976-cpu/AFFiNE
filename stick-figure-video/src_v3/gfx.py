# -*- coding: utf-8 -*-
"""Estilo "dibujo animado 3D": primitivas limpias con degradados, texto y personaje con volumen."""
import math, os, re
import numpy as np
import skia

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920

# ------------------------------------------------------------------ theme
LIGHT = dict(bg=(240, 240, 240), ink=(48, 50, 56), blue=(30, 104, 222), red=(226, 72, 52), green=(34, 160, 92),
             gray=(118, 118, 124), soft=(204, 204, 206), marker=(255, 207, 64), note=(255, 246, 214),
             paper2=(255, 255, 255), orange=(242, 122, 48), fungus=(122, 160, 74), purple=(132, 84, 210),
             sky=(122, 186, 240), skin=(255, 255, 255), mat=(36, 138, 146), floor=(226, 226, 226),
             cap_old=(132, 132, 138), cap_new=(26, 26, 30))
DARK = dict(bg=(46, 48, 52), ink=(232, 232, 228), blue=(120, 176, 255), red=(255, 110, 90), green=(110, 205, 130),
            gray=(170, 170, 168), soft=(92, 94, 98), marker=(232, 182, 40), note=(70, 66, 48),
            paper2=(62, 65, 70), orange=(242, 140, 64), fungus=(150, 196, 90), purple=(190, 140, 240),
            sky=(80, 112, 140), skin=(62, 65, 70), mat=(28, 92, 98), floor=(38, 40, 44),
            cap_old=(160, 160, 160), cap_new=(255, 255, 255))
TH = dict(LIGHT)


def set_theme(dark):
    TH.clear()
    TH.update(DARK if dark else LIGHT)


def rgb(name):
    return tuple(name[:3]) if isinstance(name, tuple) else TH[name]


def col(name, a=255):
    r, g, b = rgb(name)
    return skia.ColorSetARGB(int(max(0, min(255, a))), r, g, b)


def shade(c_, k):
    return tuple(int(max(0, min(255, v * k))) for v in rgb(c_))


def light(c_, k):
    return tuple(int(v + (255 - v) * k) for v in rgb(c_))


# ------------------------------------------------------------------ fonts
FD = os.path.join(ROOT, "fonts")
TF = {
    "hand": skia.Typeface.MakeFromFile(os.path.join(FD, "Nunito-SemiBold.ttf")),
    "bold": skia.Typeface.MakeFromFile(os.path.join(FD, "Nunito-ExtraBold.ttf")),
    "mark": skia.Typeface.MakeFromFile(os.path.join(FD, "Nunito-Black.ttf")),
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
    out = []
    for part in re.split(r"(\{[^}]*\})", text):
        if not part:
            continue
        en = part.startswith("{")
        s = part[1:-1] if en else part
        for t in re.split(r"( )", s):
            if t:
                out.append((t, en))
    return out


def wrap_rich(text, kind, size, maxw, en_kind=None):
    en_kind = en_kind or kind
    toks = parse_rich(text)
    lines, cur, w = [], [], 0.0
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


# ------------------------------------------------------------------ (sin temblor: estilo limpio)
class Boil:
    seed = 0
    n = 0

    @classmethod
    def frame(cls, fi):
        cls.seed = fi

    @classmethod
    def j(cls, amp=1.6):
        return 0.0, 0.0


SW = 0.78  # escala de grosor de contornos


def paint(color="ink", w=6, a=255, fill=False):
    p = skia.Paint(AntiAlias=True, Color=col(color, a), StrokeWidth=w * (1 if fill else SW),
                   StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)
    p.setStyle(skia.Paint.kFill_Style if fill else skia.Paint.kStroke_Style)
    return p


def grad_paint(color, y0, y1, a=255, k=0.32):
    top = light(color, k)
    bot = rgb(color)
    sh = skia.GradientShader.MakeLinear([(0, y0), (0, max(y1, y0 + 1))],
                                        [skia.ColorSetARGB(a, *top), skia.ColorSetARGB(a, *bot)])
    p = skia.Paint(AntiAlias=True, Shader=sh)
    return p


def soft_shadow(c, rect, r=20, a=46, sigma=12, dy=8):
    p = skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(a, 0, 0, 0),
                   MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, sigma))
    rr = skia.Rect.MakeXYWH(rect.x(), rect.y() + dy, rect.width(), rect.height())
    c.drawRRect(skia.RRect.MakeRectXY(rr, r, r), p)


def L(c, pts, w=6, color="ink", a=255, jit=0, close=False, fill=None, fa=255):
    if len(pts) < 2:
        return
    path = skia.Path()
    path.moveTo(*pts[0])
    for p_ in pts[1:]:
        path.lineTo(*p_)
    if close:
        path.close()
    if fill is not None:
        ys = [p_[1] for p_ in pts]
        c.drawPath(path, grad_paint(fill, min(ys), max(ys), fa))
    if w > 0:
        c.drawPath(path, paint(color, w, a))


def C(c, x, y, r, w=6, color="ink", a=255, fill=None, fa=255, jit=0):
    if fill is not None:
        c.drawCircle(x, y, r, grad_paint(fill, y - r, y + r, fa))
    if w > 0:
        c.drawCircle(x, y, r, paint(color, w, a))


def R(c, x, y, w_, h_, w=6, color="ink", a=255, fill=None, fa=255, r=8, jit=0):
    rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w_, h_), r, r)
    if fill is not None:
        c.drawRRect(rr, grad_paint(fill, y, y + h_, fa))
    if w > 0:
        c.drawRRect(rr, paint(color, w, a))


def arc(c, x, y, r, a0, a1, w=6, color="ink", a=255):
    p = skia.Path()
    p.addArc(skia.Rect.MakeXYWH(x - r, y - r, 2 * r, 2 * r), a0, a1 - a0)
    c.drawPath(p, paint(color, w, a))


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


# ------------------------------------------------------------------ personaje
HR, NECK, TORSO, UA, LA, THI, SHI = 36, 6, 108, 60, 56, 70, 70

STAND = dict(lean=0, head=0, a1u=14, a1l=-6, a2u=-14, a2l=6, l1u=7, l1l=0, l2u=-7, l2l=0)


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


SKIN = (243, 186, 146)
SICK = (176, 190, 146)
HAIR = (78, 54, 40)
SHORTS = (46, 54, 76)


def limb(c, p0, p1, w, color, a=255):
    base = rgb(color)
    c.drawLine(p0[0], p0[1], p1[0], p1[1], _sp(shade(base, 0.58), w + 3.4, a))
    c.drawLine(p0[0], p0[1], p1[0], p1[1], _sp(shade(base, 0.84), w, a))
    o = (-w * 0.09, -w * 0.07)
    c.drawLine(p0[0] + o[0], p0[1] + o[1], p1[0] + o[0], p1[1] + o[1], _sp(base, w * 0.72, a))
    o2 = (-w * 0.2, -w * 0.17)
    c.drawLine(p0[0] + o2[0], p0[1] + o2[1], p1[0] + o2[0], p1[1] + o2[1], _sp(light(base, 0.45), w * 0.22, int(a * 0.75)))


def _sp(color, w, a=255):
    p = skia.Paint(AntiAlias=True, Color=col(color, a), StrokeWidth=w, StrokeCap=skia.Paint.kRound_Cap)
    p.setStyle(skia.Paint.kStroke_Style)
    return p


def ball3d(c, x, y, r, color, a=255):
    base = rgb(color)
    sh = skia.GradientShader.MakeRadial((x - r * 0.35, y - r * 0.4), r * 1.5,
                                        [skia.ColorSetARGB(a, *light(base, 0.35)), skia.ColorSetARGB(a, *base),
                                         skia.ColorSetARGB(a, *shade(base, 0.8))], [0.0, 0.55, 1.0])
    c.drawCircle(x, y, r, skia.Paint(AntiAlias=True, Shader=sh))
    c.drawCircle(x, y, r, _sp(shade(base, 0.58), 3.2, a))


def fig(c, x, gy, pose=None, s=1.0, f=1, w=None, color="ink", face="smile", eyes="dot", front=True,
        hair=None, beard=False, hat=None, backpack=False, talk=0.0, held=None, a=255, sick=False, glasses=False,
        clicker=False, head_scale=1.0, shirt=None):
    p = dict(STAND)
    if pose:
        p.update(pose)
    rot = p.get("rot", 0)
    legext = 0
    for u, l in (("l1u", "l1l"), ("l2u", "l2l")):
        legext = max(legext, THI * math.cos(math.radians(p[u])) + SHI * math.cos(math.radians(p[u] + p[l])))
    px, py = x, gy - (legext + 14) * s + p.get("y", 0) * s
    if rot:
        py = gy + p.get("y", 0) * s
    if a < 255:
        c.saveLayerAlpha(None, a)
    if not rot:
        sp = skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(60, 0, 0, 0),
                        MaskFilter=skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 7 * s))
        c.drawOval(skia.Rect.MakeXYWH(x - 52 * s, gy - 9 * s, 104 * s, 18 * s), sp)
    c.save()
    if rot:
        c.translate(px, py)
        c.rotate(rot)
        c.translate(-px, -py)
    skin = SICK if (sick or clicker) else SKIN
    if shirt is None:
        if sick or clicker:
            shirt = (128, 132, 120)
        elif hair == "pony":
            shirt = (236, 96, 120)
        elif beard:
            shirt = (98, 128, 92)
        elif hat == "chef":
            shirt = (250, 250, 250)
        elif hat == "cap":
            shirt = (44, 76, 150)
        else:
            shirt = (64, 132, 240)
    lean = math.radians(p["lean"])
    ax, ay = math.sin(lean) * f, -math.cos(lean)       # eje del torso (hacia arriba)
    pxv, pyv = -ay, ax                                   # perpendicular (hacia la derecha)
    neck = (px + ax * TORSO * s, py + ay * TORSO * s)
    hl = math.radians(p["lean"] + p.get("head", 0))
    hdx, hdy = math.sin(hl) * f, -math.cos(hl)
    hr = HR * s * head_scale
    head = (neck[0] + hdx * (NECK * s + hr * 0.92), neck[1] + hdy * (NECK * s + hr * 0.92))
    shc = (px + ax * (TORSO - 14) * s, py + ay * (TORSO - 14) * s)
    sw = (30 if front else 6) * s
    hw = (15 if front else 3) * s
    sh1 = (shc[0] + pxv * f * sw, shc[1] + pyv * f * sw)
    sh2 = (shc[0] - pxv * f * sw, shc[1] - pyv * f * sw)
    hp1 = (px + pxv * f * hw, py + pyv * f * hw)
    hp2 = (px - pxv * f * hw, py - pyv * f * hw)
    out = {"head": head, "neck": neck, "pelvis": (px, py), "hr": hr}
    aw, fw, tw, kw = 23 * s, 20 * s, 29 * s, 24 * s

    def leg(hp, u, l):
        dx, dy = dir_(p[u], f)
        k = (hp[0] + dx * THI * s, hp[1] + dy * THI * s)
        dx2, dy2 = dir_(p[u] + p[l], f)
        ft = (k[0] + dx2 * SHI * s, k[1] + dy2 * SHI * s)
        limb(c, hp, k, tw, skin)
        limb(c, k, ft, kw, skin)
        # short
        mid = (hp[0] + dx * THI * s * 0.46, hp[1] + dy * THI * s * 0.46)
        limb(c, hp, mid, tw + 9 * s, SHORTS)
        # zapatilla
        if front and not rot:
            sx, sy, sw_, sh_ = ft[0], ft[1] + 6 * s, 40 * s, 22 * s
        else:
            sx, sy, sw_, sh_ = ft[0] + f * 12 * s, ft[1] + 6 * s, 54 * s, 22 * s
        rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(sx - sw_ / 2, sy - sh_ / 2, sw_, sh_), 11 * s, 11 * s)
        c.drawRRect(rr, grad_paint((236, 238, 242), sy - sh_ / 2, sy + sh_ / 2, 255, 0.5))
        c.drawLine(sx - sw_ / 2 + 4 * s, sy + sh_ / 2 - 3 * s, sx + sw_ / 2 - 4 * s, sy + sh_ / 2 - 3 * s,
                   _sp((150, 150, 160), 4 * s))
        c.drawRRect(rr, _sp((90, 92, 100), 2.6 * s))
        return ft

    def arm(shp, u, l):
        dx, dy = dir_(p[u], f)
        e = (shp[0] + dx * UA * s, shp[1] + dy * UA * s)
        dx2, dy2 = dir_(p[u] + p[l], f)
        hnd = (e[0] + dx2 * LA * s, e[1] + dy2 * LA * s)
        limb(c, shp, e, aw, skin)
        limb(c, e, hnd, fw, skin)
        mid = (shp[0] + dx * UA * s * 0.42, shp[1] + dy * UA * s * 0.42)
        limb(c, shp, mid, aw + 8 * s, shirt)
        ball3d(c, hnd[0], hnd[1], 13 * s, skin)
        return e, hnd

    # mochila
    if backpack:
        bx, by = shc[0] - f * 30 * s, shc[1] + 4 * s
        R(c, bx - 24 * s, by - 8 * s, 48 * s, 70 * s, 3 * s, (90, 60, 34), fill=(178, 112, 58), r=12 * s)
    # partes traseras
    if not front:
        out["foot2"] = leg(hp2, "l2u", "l2l")
        out["elbow2"], out["hand2"] = arm(sh2, "a2u", "a2l")
    else:
        out["foot2"] = leg(hp2, "l2u", "l2l")
        out["foot1"] = leg(hp1, "l1u", "l1l")
    # torso (remera)
    tsw, tww = (36 if front else 24) * s, (29 if front else 21) * s
    top = (neck[0] - ax * 6 * s, neck[1] - ay * 6 * s)
    bot = (px - ax * 4 * s, py - ay * 4 * s)
    pts = [(top[0] - pxv * tsw * 0.7, top[1] - pyv * tsw * 0.7),
           (top[0] + pxv * tsw * 0.7, top[1] + pyv * tsw * 0.7),
           (top[0] + pxv * tsw - ax * 16 * s, top[1] + pyv * tsw - ay * 16 * s),
           (bot[0] + pxv * tww, bot[1] + pyv * tww),
           (bot[0] - pxv * tww, bot[1] - pyv * tww),
           (top[0] - pxv * tsw - ax * 16 * s, top[1] - pyv * tsw - ay * 16 * s)]
    path = skia.Path()
    path.moveTo(*pts[0])
    path.lineTo(*pts[1])
    path.quadTo(top[0] + pxv * tsw, top[1] + pyv * tsw, *pts[2])
    path.lineTo(*pts[3])
    path.lineTo(*pts[4])
    path.lineTo(*pts[5])
    path.quadTo(top[0] - pxv * tsw, top[1] - pyv * tsw, *pts[0])
    path.close()
    mx, my = (top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2
    shd = skia.GradientShader.MakeLinear([(mx - pxv * tsw, my - pyv * tsw), (mx + pxv * tsw, my + pyv * tsw)],
                                         [skia.ColorSetARGB(255, *light(shirt, 0.3)), skia.ColorSetARGB(255, *shirt),
                                          skia.ColorSetARGB(255, *shade(shirt, 0.8))], [0, 0.45, 1])
    pt = skia.Paint(AntiAlias=True, Shader=shd)
    c.drawPath(path, pt)
    c.drawPath(path, _sp(shade(shirt, 0.6), 3.2))
    # cintura del short
    c.save()
    c.translate(px - ax * 3 * s, py - ay * 3 * s)
    c.rotate(math.degrees(math.atan2(pyv, pxv)))
    rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-tww - 3 * s, -17 * s, 2 * tww + 6 * s, 34 * s), 9 * s, 9 * s)
    c.drawRRect(rr, grad_paint(SHORTS, -17 * s, 17 * s, 255, 0.25))
    c.drawRRect(rr, _sp(shade(SHORTS, 0.6), 2.6 * s))
    c.drawLine(-tww - 1 * s, -12 * s, tww + 1 * s, -12 * s, _sp(light(SHORTS, 0.3), 3 * s))
    c.restore()
    if not front:
        out["foot1"] = leg(hp1, "l1u", "l1l")
        out["elbow1"], out["hand1"] = arm(sh1, "a1u", "a1l")
    else:
        out["elbow2"], out["hand2"] = arm(sh2, "a2u", "a2l")
        out["elbow1"], out["hand1"] = arm(sh1, "a1u", "a1l")
    # cuello
    limb(c, (neck[0] - ax * 6 * s, neck[1] - ay * 6 * s), (neck[0] + hdx * 10 * s, neck[1] + hdy * 10 * s), 17 * s, skin)
    hx, hy = head
    if clicker:
        for k in range(9):
            ang = k / 9 * 2 * math.pi
            rr_ = hr * (1.0 + 0.25 * math.sin(k * 2.3))
            ball3d(c, hx + math.cos(ang) * hr * 0.55, hy + math.sin(ang) * hr * 0.55, rr_ * 0.55, TH["fungus"])
        ball3d(c, hx, hy, hr * 0.8, (150, 170, 110))
        for k in range(4):
            ang = k * 1.6 + 0.4
            c.drawLine(hx + math.cos(ang) * hr * 0.15, hy + math.sin(ang) * hr * 0.15,
                       hx + math.cos(ang) * hr * 0.8, hy + math.sin(ang) * hr * 0.8, _sp((80, 90, 60), 3 * s))
        out["face"] = head
        c.restore()
        if a < 255:
            c.restore()
        return out
    # orejas
    if front:
        for sg in (-1, 1):
            ball3d(c, hx + sg * hr * 0.97, hy + hr * 0.08, hr * 0.2, skin)
    else:
        ball3d(c, hx - f * hr * 0.12, hy + hr * 0.08, hr * 0.2, skin)
    # pelo trasero (colita)
    hcol = (128, 72, 42) if hair == "pony" else HAIR
    if hair == "pony":
        bx = -1 if front else -f
        c.save()
        c.translate(hx + bx * hr * 1.02, hy - hr * 0.05)
        c.rotate(bx * 20)
        rr = skia.Rect.MakeXYWH(-hr * 0.28, -hr * 0.2, hr * 0.56, hr * 1.15)
        c.drawOval(rr, grad_paint(hcol, -hr * 0.2, hr, 255, 0.25))
        c.drawOval(rr, _sp(shade(hcol, 0.6), 2.6 * s))
        c.restore()
    # cabeza
    shh = skia.GradientShader.MakeRadial((hx - hr * 0.32, hy - hr * 0.38), hr * 1.6,
                                         [skia.ColorSetARGB(255, *light(skin, 0.28)), skia.ColorSetARGB(255, *skin),
                                          skia.ColorSetARGB(255, *shade(skin, 0.82))], [0, 0.5, 1])
    c.drawCircle(hx, hy, hr, skia.Paint(AntiAlias=True, Shader=shh))
    c.drawCircle(hx, hy, hr, _sp(shade(skin, 0.6), 3.2 * s))
    if sick:
        for k in range(5):
            ang = -2.6 + k * 0.5
            ball3d(c, hx + math.cos(ang) * hr * 0.92, hy + math.sin(ang) * hr * 0.92, hr * 0.22, TH["fungus"])
    # pelo
    if hair in (None, "short", "pony") and hat not in ("chef", "helmet", "cap") and not sick:
        pth = skia.Path()
        pth.addArc(skia.Rect.MakeXYWH(hx - hr * 1.04, hy - hr * 1.06, hr * 2.08, hr * 2.08), 188, 164)
        pth.quadTo(hx + hr * 0.5, hy - hr * 0.5, hx + hr * 0.1, hy - hr * 0.62)
        pth.quadTo(hx - hr * 0.4, hy - hr * 0.48, hx - hr * 1.03, hy - hr * 0.2)
        pth.close()
        c.drawPath(pth, grad_paint(hcol, hy - hr, hy - hr * 0.3, 255, 0.22))
        c.drawPath(pth, _sp(shade(hcol, 0.6), 2.4 * s))
    if beard:
        pth = skia.Path()
        pth.addArc(skia.Rect.MakeXYWH(hx - hr * 0.98, hy - hr * 0.98, hr * 1.96, hr * 1.96), 8, 164)
        pth.quadTo(hx, hy + hr * 0.25, hx + hr * 0.97, hy + hr * 0.14)
        pth.close()
        c.drawPath(pth, skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(235, *HAIR)))
    # cara
    fdx = 0 if front else f * hr * 0.3
    ey = hy - hr * 0.02
    exs = (hx + fdx - hr * 0.33, hx + fdx + hr * 0.33)
    ink = (40, 34, 34)
    pk = f * hr * 0.05 if not front else 0
    if eyes in ("dot", "angry", "sad", "wide"):
        big = 1.35 if eyes == "wide" else 1.0
        for exx in exs:
            c.drawOval(skia.Rect.MakeXYWH(exx - hr * 0.15 * big, ey - hr * 0.19 * big, hr * 0.3 * big, hr * 0.38 * big),
                       skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, 255, 255, 255)))
            c.drawOval(skia.Rect.MakeXYWH(exx - hr * 0.15 * big, ey - hr * 0.19 * big, hr * 0.3 * big, hr * 0.38 * big),
                       _sp(shade(skin, 0.6), 1.6 * s))
            c.drawCircle(exx + pk, ey + hr * 0.03, hr * 0.1, skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, *ink)))
            c.drawCircle(exx + pk - hr * 0.04, ey - hr * 0.02, hr * 0.035,
                         skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, 255, 255, 255)))
        for k, exx in enumerate(exs):
            sg = 1 if k == 0 else -1
            if eyes == "angry":
                c.drawLine(exx - hr * 0.18, ey - hr * 0.34 - sg * hr * 0.08, exx + hr * 0.18, ey - hr * 0.34 + sg * hr * 0.08,
                           _sp(HAIR, 5 * s))
            elif eyes == "sad":
                c.drawLine(exx - hr * 0.18, ey - hr * 0.32 + sg * hr * 0.08, exx + hr * 0.18, ey - hr * 0.32 - sg * hr * 0.08,
                           _sp(HAIR, 5 * s))
            else:
                pth = skia.Path()
                pth.moveTo(exx - hr * 0.17, ey - hr * 0.3)
                pth.quadTo(exx, ey - hr * 0.42, exx + hr * 0.17, ey - hr * 0.31)
                c.drawPath(pth, _sp(HAIR, 4.5 * s))
    elif eyes == "closed":
        for exx in exs:
            pth = skia.Path()
            pth.moveTo(exx - hr * 0.15, ey)
            pth.quadTo(exx, ey + hr * 0.12, exx + hr * 0.15, ey)
            c.drawPath(pth, _sp(ink, 3.6 * s))
    elif eyes == "x":
        for exx in exs:
            d = hr * 0.12
            c.drawLine(exx - d, ey - d, exx + d, ey + d, _sp(ink, 3.6 * s))
            c.drawLine(exx - d, ey + d, exx + d, ey - d, _sp(ink, 3.6 * s))
    if glasses:
        for exx in exs:
            c.drawRoundRect(skia.Rect.MakeXYWH(exx - hr * 0.24, ey - hr * 0.2, hr * 0.48, hr * 0.36), 6, 6,
                            _sp((40, 40, 46), 3.2 * s))
        c.drawLine(exs[0] + hr * 0.24, ey - hr * 0.06, exs[1] - hr * 0.24, ey - hr * 0.06, _sp((40, 40, 46), 3 * s))
    # nariz y mejillas
    c.drawOval(skia.Rect.MakeXYWH(hx + fdx * 1.2 - hr * 0.08, hy + hr * 0.12, hr * 0.16, hr * 0.12),
               skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, *shade(skin, 0.82))))
    for exx in exs:
        c.drawOval(skia.Rect.MakeXYWH(exx - hr * 0.14, hy + hr * 0.24, hr * 0.28, hr * 0.12),
                   skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(70, 240, 90, 90)))
    mx, my = hx + fdx, hy + hr * 0.46
    mw = hr * 0.3
    mouthc = (150, 46, 52)
    if talk > 0.05:
        oh = hr * 0.08 + hr * 0.3 * min(1, talk)
        c.drawOval(skia.Rect.MakeXYWH(mx - mw * 0.75, my - oh * 0.45, mw * 1.5, oh),
                   skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, *mouthc)))
    elif face in ("smile",):
        pth = skia.Path()
        pth.moveTo(mx - mw, my - hr * 0.06)
        pth.quadTo(mx, my + hr * 0.18, mx + mw, my - hr * 0.06)
        c.drawPath(pth, _sp(mouthc, 4 * s))
    elif face == "big":
        pth = skia.Path()
        pth.moveTo(mx - mw * 1.1, my - hr * 0.1)
        pth.quadTo(mx, my + hr * 0.42, mx + mw * 1.1, my - hr * 0.1)
        pth.close()
        c.drawPath(pth, skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, *mouthc)))
        c.drawRect(skia.Rect.MakeXYWH(mx - mw * 0.8, my - hr * 0.09, mw * 1.6, hr * 0.08),
                   skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, 255, 255, 255)))
    elif face == "sad":
        pth = skia.Path()
        pth.moveTo(mx - mw * 0.8, my + hr * 0.08)
        pth.quadTo(mx, my - hr * 0.12, mx + mw * 0.8, my + hr * 0.08)
        c.drawPath(pth, _sp(mouthc, 4 * s))
    elif face == "flat":
        c.drawLine(mx - mw * 0.7, my, mx + mw * 0.7, my, _sp(mouthc, 4 * s))
    elif face == "o":
        c.drawOval(skia.Rect.MakeXYWH(mx - hr * 0.12, my - hr * 0.1, hr * 0.24, hr * 0.26),
                   skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, *mouthc)))
    elif face == "angry":
        pth = skia.Path()
        pth.moveTo(mx - mw * 0.7, my + hr * 0.08)
        pth.quadTo(mx, my - hr * 0.1, mx + mw * 0.7, my + hr * 0.08)
        c.drawPath(pth, _sp(mouthc, 4.5 * s))
    elif face == "grr":
        rr = skia.Rect.MakeXYWH(mx - mw, my - hr * 0.1, mw * 2, hr * 0.24)
        c.drawRoundRect(rr, 5, 5, skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, 255, 255, 255)))
        c.drawRoundRect(rr, 5, 5, _sp(ink, 2.6 * s))
        for k in range(1, 4):
            c.drawLine(mx - mw + k * mw * 0.5, my - hr * 0.1, mx - mw + k * mw * 0.5, my + hr * 0.14, _sp(ink, 1.8 * s))
    # sombreros
    if hat == "chef":
        for k in (-1, 0, 1):
            ball3d(c, hx + k * hr * 0.5, hy - hr * 1.25, hr * 0.42, (250, 250, 250))
        R(c, hx - hr * 0.75, hy - hr * 1.15, hr * 1.5, hr * 0.5, 2.4 * s, (150, 150, 160), fill=(250, 250, 250), r=6)
    elif hat == "cap":
        pth = skia.Path()
        pth.addArc(skia.Rect.MakeXYWH(hx - hr, hy - hr * 1.05, hr * 2, hr * 1.6), 180, 180)
        pth.close()
        c.drawPath(pth, grad_paint((44, 76, 150), hy - hr, hy - hr * 0.2))
        c.drawRoundRect(skia.Rect.MakeXYWH(hx - hr * (1.0 if f > 0 else 1.5), hy - hr * 0.32, hr * 2.5, hr * 0.2), 6, 6,
                        skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, 30, 50, 100)))
        ball3d(c, hx, hy - hr * 0.7, hr * 0.14, (255, 207, 64))
    elif hat == "helmet":
        pth = skia.Path()
        pth.addArc(skia.Rect.MakeXYWH(hx - hr * 1.12, hy - hr * 1.2, hr * 2.24, hr * 2.0), 180, 180)
        pth.close()
        c.drawPath(pth, grad_paint((236, 72, 60), hy - hr * 1.2, hy - hr * 0.2))
        c.drawPath(pth, _sp((140, 40, 36), 3 * s))
        c.drawLine(hx, hy - hr * 1.15, hx, hy - hr * 0.25, _sp((255, 255, 255), 5 * s, 150))
    elif hat == "sun":
        c.drawOval(skia.Rect.MakeXYWH(hx - hr * 1.6, hy - hr * 0.78, hr * 3.2, hr * 0.5), grad_paint((236, 200, 120), hy - hr * 0.8, hy - hr * 0.3))
        pth = skia.Path()
        pth.addArc(skia.Rect.MakeXYWH(hx - hr * 0.85, hy - hr * 1.45, hr * 1.7, hr * 1.6), 180, 180)
        pth.close()
        c.drawPath(pth, grad_paint((236, 200, 120), hy - hr * 1.45, hy - hr * 0.6))
        c.drawRect(skia.Rect.MakeXYWH(hx - hr * 0.85, hy - hr * 0.78, hr * 1.7, hr * 0.14),
                   skia.Paint(AntiAlias=True, Color=skia.ColorSetARGB(255, 226, 72, 52)))
    elif hat == "grad":
        L(c, [(hx - hr * 1.3, hy - hr * 1.0), (hx, hy - hr * 1.45), (hx + hr * 1.3, hy - hr * 1.0), (hx, hy - hr * 0.6)],
          0, close=True, fill=(40, 40, 46))
    out["face"] = head
    c.restore()
    if a < 255:
        c.restore()
    return out


# ------------------------------------------------------------------ fondo de estudio gris
def paper_image(dark=False):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = ((xx - W / 2) / (W * 0.8)) ** 2 + ((yy - H * 0.42) / (H * 0.7)) ** 2
    if dark:
        c0, c1 = np.array([60, 63, 68], np.float32), np.array([30, 31, 35], np.float32)
    else:
        c0, c1 = np.array([248, 248, 248], np.float32), np.array([214, 214, 216], np.float32)
    k = np.clip(v, 0, 1)[..., None]
    img = c0 * (1 - k) + c1 * k
    img += np.random.default_rng(3).normal(0, 0.8, (H, W, 1)).astype(np.float32)
    out = np.concatenate([np.clip(img, 0, 255).astype(np.uint8), np.full((H, W, 1), 255, np.uint8)], axis=2)
    return skia.Image.fromarray(np.ascontiguousarray(out), colorType=skia.kRGBA_8888_ColorType)
