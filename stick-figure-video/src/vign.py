# -*- coding: utf-8 -*-
"""Escenitas (viñetas) de muñecos de palitos para la zona superior del video."""
import math
from gfx import *

GY = 880          # linea del piso
CX = W // 2
V = {}


def v(*keys):
    def deco(fn):
        for k in keys:
            V[k] = fn
        return fn
    return deco


# ================================================================== props
def crescent(c, x, y, r=50):
    a = skia.Path()
    a.addCircle(x, y, r)
    b = skia.Path()
    b.addCircle(x + r * 0.5, y - r * 0.3, r * 0.9)
    m = skia.Op(a, b, skia.PathOp.kDifference_PathOp)
    c.drawPath(m, paint("marker", fill=True))
    c.drawPath(m, paint("ink", 5))


def ground(c, x0=70, x1=1010, y=GY):
    L(c, [(x0, y), ((x0 + x1) / 2, y + 2), (x1, y)], 5, "ink", jit=1.0)


def lab(c, s, x, y, size=44, color="blue", kind="bold", a=255):
    T(c, s, x, y, size, color, kind, a)


def check(c, x, y, s=1.0, color="green", w=11):
    L(c, [(x - 30 * s, y), (x - 8 * s, y + 24 * s), (x + 34 * s, y - 32 * s)], w * s, color)


def cross(c, x, y, s=1.0, color="red", w=11):
    L(c, [(x - 28 * s, y - 28 * s), (x + 28 * s, y + 28 * s)], w * s, color)
    L(c, [(x + 28 * s, y - 28 * s), (x - 28 * s, y + 28 * s)], w * s, color)


def qmark(c, x, y, size=100, color="red", t=0):
    T(c, "?", x, y + math.sin(t * 4) * 6, size, color, "mark")


def excl(c, x, y, size=100, color="red"):
    T(c, "!", x, y, size, color, "mark")


def book(c, x, y, s=1.0, open_=True, color="blue", t=0):
    if open_:
        L(c, [(x, y), (x - 70 * s, y - 12 * s), (x - 70 * s, y - 72 * s), (x, y - 60 * s)], 5 * s, "ink", close=True,
          fill="paper2")
        L(c, [(x, y), (x + 70 * s, y - 12 * s), (x + 70 * s, y - 72 * s), (x, y - 60 * s)], 5 * s, "ink", close=True,
          fill="paper2")
        for k in range(3):
            yy = y - 50 * s + k * 13 * s
            L(c, [(x - 58 * s, yy - 6 * s), (x - 12 * s, yy + 2 * s)], 3 * s, "soft")
            L(c, [(x + 12 * s, yy + 2 * s), (x + 58 * s, yy - 6 * s)], 3 * s, "soft")
        L(c, [(x - 72 * s, y - 10 * s), (x, y + 4 * s), (x + 72 * s, y - 10 * s)], 5 * s, color)
    else:
        R(c, x - 40 * s, y - 100 * s, 80 * s, 100 * s, 5 * s, "ink", fill=color, r=6)
        L(c, [(x - 28 * s, y - 100 * s), (x - 28 * s, y)], 4 * s, "ink")


def ball(c, x, y, r=26, rot=0):
    C(c, x, y, r, 5, "ink", fill="paper2")
    pts = []
    for k in range(5):
        a = math.radians(rot + k * 72 - 90)
        pts.append((x + math.cos(a) * r * 0.38, y + math.sin(a) * r * 0.38))
    L(c, pts, 3, "ink", close=True, fill="ink", jit=0.3)
    for k in range(5):
        a = math.radians(rot + k * 72 - 90)
        L(c, [(x + math.cos(a) * r * 0.38, y + math.sin(a) * r * 0.38),
              (x + math.cos(a) * r * 0.9, y + math.sin(a) * r * 0.9)], 3, "ink", jit=0.3)


def calendar(c, x, y, w=230, h=200, label="", sub="", color="red", size=40):
    R(c, x - w / 2, y - h / 2, w, h, 5, "ink", fill="paper2", r=12)
    R(c, x - w / 2, y - h / 2, w, 52, 5, "ink", fill=color, r=12)
    for k in (-1, 1):
        L(c, [(x + k * w * 0.25, y - h / 2 - 18), (x + k * w * 0.25, y - h / 2 + 14)], 7, "ink")
    if sub:
        T(c, sub, x, y - h / 2 + 40, 30, (255, 255, 255), "bold")
    if label:
        T(c, label, x, y + h * 0.22, size, "ink", "bold")


def clock(c, x, y, r=70, hours=3.0, color="ink"):
    C(c, x, y, r, 6, color, fill="paper2")
    for k in range(12):
        a = math.radians(k * 30)
        L(c, [(x + math.cos(a) * r * 0.78, y + math.sin(a) * r * 0.78),
              (x + math.cos(a) * r * 0.9, y + math.sin(a) * r * 0.9)], 3, color, jit=0.2)
    ah = math.radians(hours * 30 - 90)
    am = math.radians(hours * 360 - 90)
    L(c, [(x, y), (x + math.cos(ah) * r * 0.5, y + math.sin(ah) * r * 0.5)], 7, color, jit=0.3)
    L(c, [(x, y), (x + math.cos(am) * r * 0.75, y + math.sin(am) * r * 0.75)], 5, "red", jit=0.3)


def zzz(c, x, y, t):
    for k in range(3):
        ph = (t * 0.7 + k / 3) % 1
        a = int(255 * math.sin(ph * math.pi))
        T(c, "Z", x + ph * 60 + k * 6, y - ph * 110, 40 + k * 10, "blue", "mark", a)


def bubble(c, x, y, w, h, tx, ty, kind="speech", fill="paper2"):
    if kind == "thought":
        for k, f in enumerate((0.25, 0.5)):
            bx, by = tx + (x + w / 2 - tx) * f, ty + (y + h - ty) * f
            C(c, bx, by, 8 + k * 7, 4, "ink", fill=fill)
        R(c, x, y, w, h, 5, "ink", fill=fill, r=min(w, h) / 2.2)
    else:
        R(c, x, y, w, h, 5, "ink", fill=fill, r=28)
        bx = max(x + 40, min(x + w - 40, tx))
        L(c, [(bx - 22, y + h - 2), (tx, ty), (bx + 22, y + h - 2)], 5, "ink", fill=fill)
        L(c, [(bx - 20, y + h - 4), (bx + 20, y + h - 4)], 7, fill, jit=0.2)


def heart(c, x, y, s=1.0, color="red", a=255):
    p = skia.Path()
    p.moveTo(x, y + 26 * s)
    p.cubicTo(x - 50 * s, y - 6 * s, x - 22 * s, y - 40 * s, x, y - 16 * s)
    p.cubicTo(x + 22 * s, y - 40 * s, x + 50 * s, y - 6 * s, x, y + 26 * s)
    c.drawPath(p, paint(color, a=a, fill=True))
    c.drawPath(p, paint("ink", 4 * s, a))


def bulb(c, x, y, s=1.0, t=0):
    for k in range(8):
        a = math.radians(k * 45 + t * 30)
        r0, r1 = 62 * s, (80 + 8 * math.sin(t * 6 + k)) * s
        L(c, [(x + math.cos(a) * r0, y + math.sin(a) * r0), (x + math.cos(a) * r1, y + math.sin(a) * r1)], 5 * s, "orange")
    C(c, x, y, 44 * s, 6 * s, "ink", fill="marker")
    R(c, x - 20 * s, y + 40 * s, 40 * s, 30 * s, 5 * s, "ink", fill="soft", r=4)


def notes(c, x, y, t, color="purple"):
    for k in range(3):
        ph = (t * 0.5 + k / 3) % 1
        a = int(255 * math.sin(ph * math.pi))
        nx, ny = x + k * 40 + math.sin(ph * 6) * 14, y - ph * 140
        c.drawOval(skia.Rect.MakeXYWH(nx - 14, ny - 9, 26, 18), paint(color, a=a, fill=True))
        L(c, [(nx + 10, ny), (nx + 10, ny - 44), (nx + 26, ny - 34)], 5, color, a)


def desk(c, x, y, w=280):
    L(c, [(x - w / 2, y), (x + w / 2, y)], 8, "ink")
    L(c, [(x - w / 2 + 20, y), (x - w / 2 + 20, GY)], 6, "ink")
    L(c, [(x + w / 2 - 20, y), (x + w / 2 - 20, GY)], 6, "ink")


def chair(c, x, y, f=1):
    L(c, [(x - 40, y), (x + 40, y)], 7, "ink")
    L(c, [(x - 35, y), (x - 35, GY)], 6, "ink")
    L(c, [(x + 35, y), (x + 35, GY)], 6, "ink")
    bx = x - f * 40
    L(c, [(bx, y), (bx, y - 110)], 7, "ink")


def bed(c, x, y, w=400, color="blue"):
    R(c, x - w / 2, y, w, 40, 5, "ink", fill=color, r=8)
    L(c, [(x - w / 2, y - 60), (x - w / 2, GY)], 8, "ink")
    L(c, [(x + w / 2, y + 10), (x + w / 2, GY)], 8, "ink")
    R(c, x - w / 2 + 12, y - 30, 80, 32, 4, "ink", fill="paper2", r=14)


def tv(c, x, y, w=250, h=170, on=True, t=0, x_mark=False):
    R(c, x - w / 2, y - h / 2, w, h, 6, "ink", fill="ink" if not on else "sky", r=12)
    L(c, [(x - 30, y - h / 2), (x - 60, y - h / 2 - 50)], 4, "ink")
    L(c, [(x + 30, y - h / 2), (x + 60, y - h / 2 - 50)], 4, "ink")
    L(c, [(x - 50, y + h / 2), (x - 60, y + h / 2 + 40)], 6, "ink")
    L(c, [(x + 50, y + h / 2), (x + 60, y + h / 2 + 40)], 6, "ink")
    if on:
        # mini pelicula: un muñequito corriendo dentro
        k = (t * 0.35) % 1
        fig(c, x - w / 2 + 40 + k * (w - 80), y + h / 2 - 12, run_pose(t), s=0.22, f=1, front=False)
        T(c, "FILM", x, y - h / 2 + 40, 30, (255, 255, 255), "mark")
    if x_mark:
        cross(c, x, y, 1.3)


def couch(c, x, y=GY, w=300):
    R(c, x - w / 2, y - 120, w, 70, 6, "ink", fill="red", r=20)
    R(c, x - w / 2 - 20, y - 70, w + 40, 50, 6, "ink", fill="red", r=16)
    L(c, [(x - w / 2, y - 20), (x - w / 2, y)], 7, "ink")
    L(c, [(x + w / 2, y - 20), (x + w / 2, y)], 7, "ink")


def phone(c, x, y, s=1.0, ring=False, t=0, x_mark=False):
    dx = math.sin(t * 50) * 4 if ring else 0
    R(c, x - 32 * s + dx, y - 56 * s, 64 * s, 112 * s, 5 * s, "ink", fill="ink", r=10 * s)
    R(c, x - 24 * s + dx, y - 44 * s, 48 * s, 80 * s, 2 * s, "sky", fill="sky", r=4 * s)
    if ring:
        for k in range(2):
            for sg in (-1, 1):
                arc(c, x + dx, y, (60 + k * 22) * s, 180 + sg * 30 - 25 if sg < 0 else -25, 180 + sg * 30 + 25 if sg < 0 else 25,
                    5 * s, "red")
    if x_mark:
        noentry(c, x, y, 85 * s)


def suitcase(c, x, y=GY, s=1.0, color="orange", stickers=False):
    R(c, x - 60 * s, y - 100 * s, 120 * s, 92 * s, 6 * s, "ink", fill=color, r=10 * s)
    L(c, [(x - 22 * s, y - 100 * s), (x - 22 * s, y - 122 * s), (x + 22 * s, y - 122 * s), (x + 22 * s, y - 100 * s)],
      6 * s, "ink")
    C(c, x - 40 * s, y - 4 * s, 7 * s, 4 * s, "ink", fill="ink")
    C(c, x + 40 * s, y - 4 * s, 7 * s, 4 * s, "ink", fill="ink")
    if stickers:
        C(c, x - 25 * s, y - 60 * s, 16 * s, 4, "ink", fill="green")
        R(c, x + 5 * s, y - 80 * s, 36 * s, 26 * s, 4, "ink", fill="sky", r=4)


def plane(c, x, y, s=1.0, f=1):
    pts = [(-110, 0), (90, -14), (120, 0), (90, 14), (-110, 8)]
    L(c, [(x + f * px * s, y + py * s) for px, py in pts], 6 * s, "ink", close=True, fill="paper2")
    L(c, [(x + f * 10 * s, y - 8 * s), (x - f * 30 * s, y - 70 * s), (x - f * 55 * s, y - 70 * s), (x - f * 30 * s, y)],
      6 * s, "ink", fill="blue", close=True)
    L(c, [(x - f * 90 * s, y), (x - f * 115 * s, y - 45 * s), (x - f * 125 * s, y - 45 * s), (x - f * 110 * s, y)],
      5 * s, "ink", close=True, fill="red")
    for k in range(4):
        C(c, x + f * (60 - k * 30) * s, y - 2 * s, 5 * s, 3, "ink", fill="sky")


def car(c, x, y=GY, s=1.0, color="red", t=0):
    R(c, x - 110 * s, y - 80 * s, 220 * s, 50 * s, 6 * s, "ink", fill=color, r=14 * s)
    L(c, [(x - 60 * s, y - 80 * s), (x - 35 * s, y - 125 * s), (x + 40 * s, y - 125 * s), (x + 65 * s, y - 80 * s)],
      6 * s, "ink", fill="sky")
    for wx in (-60, 60):
        C(c, x + wx * s, y - 28 * s, 26 * s, 6 * s, "ink", fill="ink")
        a = t * 8
        L(c, [(x + wx * s, y - 28 * s), (x + wx * s + math.cos(a) * 18 * s, y - 28 * s + math.sin(a) * 18 * s)], 3, "paper2")


def bus(c, x, y=GY, s=1.0, t=0, color="marker"):
    R(c, x - 170 * s, y - 170 * s, 340 * s, 140 * s, 6 * s, "ink", fill=color, r=18 * s)
    for k in range(4):
        R(c, x - 150 * s + k * 78 * s, y - 150 * s, 60 * s, 50 * s, 4 * s, "ink", fill="sky", r=6)
    for wx in (-100, 100):
        C(c, x + wx * s, y - 28 * s, 28 * s, 6 * s, "ink", fill="ink")
    T(c, "BUS", x, y - 50 * s, 40 * s, "ink", "mark")


def house(c, x, y=GY, s=1.0, color="orange", win_fig=False, door_open=0.0, t=0, label=None):
    R(c, x - 110 * s, y - 170 * s, 220 * s, 170 * s, 6 * s, "ink", fill=color, r=4)
    L(c, [(x - 135 * s, y - 165 * s), (x, y - 280 * s), (x + 135 * s, y - 165 * s)], 7 * s, "ink", close=True, fill="red")
    R(c, x + 20 * s, y - 100 * s, 60 * s, 100 * s, 5 * s, "ink", fill="ink" if door_open > 0 else "paper2", r=4)
    if door_open > 0:
        L(c, [(x + 20 * s, y - 100 * s), (x + 20 * s + 50 * s * (1 - door_open), y - 108 * s),
              (x + 20 * s + 50 * s * (1 - door_open), y + 6 * s), (x + 20 * s, y)], 5 * s, "ink", fill="paper2")
    R(c, x - 85 * s, y - 120 * s, 70 * s, 60 * s, 5 * s, "ink", fill="sky", r=4)
    if win_fig:
        c.save()
        c.clipRect(skia.Rect.MakeXYWH(x - 85 * s, y - 120 * s, 70 * s, 60 * s))
        fig(c, x - 50 * s, y - 40 * s, None, s=0.28 * s * 1.6, front=True)
        c.restore()
    L(c, [(x - 50 * s, y - 120 * s), (x - 50 * s, y - 60 * s)], 3 * s, "ink")
    if label:
        T(c, label, x, y - 190 * s, 36 * s, "ink", "bold")


def tree(c, x, y=GY, s=1.0):
    L(c, [(x, y), (x, y - 120 * s)], 10 * s, "ink")
    for dx, dy, r in ((0, -170, 60), (-45, -130, 45), (45, -130, 45)):
        C(c, x + dx * s, y + dy * s, r * s, 5 * s, "ink", fill="green")


def cloud(c, x, y, s=1.0, rain=False, t=0, color="soft"):
    if rain:
        for k in range(7):
            ph = (t * 1.5 + k * 0.37) % 1
            rx = x - 90 * s + k * 30 * s
            ry = y + 40 * s + ph * 140 * s
            L(c, [(rx, ry), (rx - 6 * s, ry + 22 * s)], 5 * s, "blue", int(255 * (1 - ph)))
    for dx, dy, r in ((-60, 10, 45), (0, -15, 60), (60, 10, 45), (0, 25, 45)):
        C(c, x + dx * s, y + dy * s, r * s, 0, fill=color)
    for dx, dy, r in ((-60, 10, 45), (0, -15, 60), (60, 10, 45)):
        arc(c, x + dx * s, y + dy * s, r * s, 150, 390 if dx == 0 else (330 if dx < 0 else 400), 5 * s, "ink")
    L(c, [(x - 100 * s, y + 40 * s), (x + 100 * s, y + 40 * s)], 5 * s, "ink")


def sun(c, x, y, r=50, t=0):
    for k in range(10):
        a = math.radians(k * 36 + t * 20)
        L(c, [(x + math.cos(a) * r * 1.3, y + math.sin(a) * r * 1.3), (x + math.cos(a) * r * 1.7, y + math.sin(a) * r * 1.7)],
          6, "orange")
    C(c, x, y, r, 6, "ink", fill="marker")


def umbrella(c, x, y, s=1.0, color="red"):
    p = [(x - 110 * s, y)]
    for k in range(9):
        a = math.radians(180 + k * 22.5)
        p.append((x + math.cos(a) * 110 * s, y + math.sin(a) * 90 * s))
    L(c, p, 6 * s, "ink", close=True, fill=color)
    L(c, [(x, y - 90 * s), (x, y + 160 * s)], 6 * s, "ink")


def laptop(c, x, y, s=1.0):
    L(c, [(x - 70 * s, y), (x + 70 * s, y)], 8 * s, "ink")
    L(c, [(x - 60 * s, y), (x - 50 * s, y - 95 * s), (x + 50 * s, y - 95 * s), (x + 60 * s, y)], 6 * s, "ink",
      fill="sky", close=True)


def mic(c, x, y):
    L(c, [(x, y), (x, y + 70)], 7, "ink")
    C(c, x, y - 14, 18, 5, "ink", fill="ink")


def racket(c, x, y, ang, s=1.0):
    a = math.radians(ang)
    dx, dy = math.cos(a), math.sin(a)
    hx, hy = x + dx * 60 * s, y + dy * 60 * s
    L(c, [(x, y), (hx, hy)], 6 * s, "ink")
    c.save()
    c.translate(hx + dx * 40 * s, hy + dy * 40 * s)
    c.rotate(ang)
    c.drawOval(skia.Rect.MakeXYWH(-42 * s, -30 * s, 84 * s, 60 * s), paint("green", a=120, fill=True))
    c.drawOval(skia.Rect.MakeXYWH(-42 * s, -30 * s, 84 * s, 60 * s), paint("ink", 5 * s))
    c.restore()


def door(c, x, y=GY, k=1.0):
    R(c, x - 70, y - 230, 140, 230, 7, "ink", fill="ink", r=4)
    L(c, [(x - 70, y - 230), (x - 70 + 130 * (1 - k), y - 240), (x - 70 + 130 * (1 - k), y + 8), (x - 70, y)], 6, "ink",
      close=True, fill="orange")


def plate(c, x, y, full=True):
    c.drawOval(skia.Rect.MakeXYWH(x - 80, y - 18, 160, 36), paint("paper2", fill=True))
    c.drawOval(skia.Rect.MakeXYWH(x - 80, y - 18, 160, 36), paint("ink", 5))
    if full:
        C(c, x - 20, y - 18, 22, 4, "ink", fill="orange")
        C(c, x + 18, y - 16, 18, 4, "ink", fill="green")
    else:
        for k in range(3):
            C(c, x - 30 + k * 28, y - 2, 3, 0, fill="ink")


def cake(c, x, y=GY, s=1.0):
    R(c, x - 100 * s, y - 120 * s, 200 * s, 110 * s, 6 * s, "ink", fill="red", r=10)
    L(c, [(x - 100 * s, y - 80 * s), (x - 60 * s, y - 60 * s), (x - 20 * s, y - 80 * s), (x + 20 * s, y - 60 * s),
          (x + 60 * s, y - 80 * s), (x + 100 * s, y - 60 * s)], 6 * s, "paper2")
    for k in (-40, 0, 40):
        L(c, [(x + k * s, y - 120 * s), (x + k * s, y - 160 * s)], 6 * s, "blue")
        C(c, x + k * s, y - 172 * s, 8 * s, 0, fill="orange")
    L(c, [(x - 120 * s, y - 8 * s), (x + 120 * s, y - 8 * s)], 6 * s, "ink")


def moneybag(c, x, y, s=1.0):
    C(c, x, y, 50 * s, 6 * s, "ink", fill="green")
    L(c, [(x - 20 * s, y - 50 * s), (x, y - 70 * s), (x + 20 * s, y - 50 * s)], 6 * s, "ink")
    T(c, "$", x, y + 18 * s, 56 * s, (255, 255, 255), "mark")


def tower(c, x, y=GY, s=1.0):
    L(c, [(x - 100 * s, y), (x - 10 * s, y - 380 * s), (x + 10 * s, y - 380 * s), (x + 100 * s, y)], 7 * s, "ink")
    L(c, [(x, y - 380 * s), (x, y - 420 * s)], 6 * s, "ink")
    L(c, [(x - 75 * s, y - 100 * s), (x + 75 * s, y - 100 * s)], 7 * s, "ink")
    L(c, [(x - 45 * s, y - 220 * s), (x + 45 * s, y - 220 * s)], 6 * s, "ink")
    arc(c, x, y, 45 * s, 180, 360, 6 * s, "ink")
    L(c, [(x - 75 * s, y - 100 * s), (x - 10 * s, y - 220 * s), (x + 75 * s, y - 100 * s)], 3 * s, "soft")


def postcard(c, x, y, text, w=250, h=170):
    R(c, x - w / 2, y - h / 2, w, h, 6, "ink", fill="paper2", r=8)
    sun(c, x + w / 2 - 50, y - h / 2 + 45, 18, 0)
    L(c, [(x - w / 2 + 10, y + h / 2 - 30), (x - 30, y + 10), (x + 10, y + h / 2 - 40), (x + w / 2 - 10, y + h / 2 - 30)],
      5, "green")
    T(c, text, x - 20, y, 40, "blue", "mark")


def exam_paper(c, x, y, mark=True, rot=0):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    R(c, -90, -120, 180, 240, 6, "ink", fill="paper2", r=6)
    for k in range(5):
        L(c, [(-60, -60 + k * 30), (50, -60 + k * 30)], 4, "soft")
    T(c, "EXAM", 0, -80, 34, "ink", "bold")
    if mark:
        check(c, 20, 60, 1.3)
    c.restore()


def noentry(c, x, y, r=80):
    C(c, x, y, r, 12, "red")
    a = math.radians(45)
    L(c, [(x - math.cos(a) * r, y - math.sin(a) * r), (x + math.cos(a) * r, y + math.sin(a) * r)], 12, "red")


def mushroom(c, x, y=GY, s=1.0, color="fungus"):
    L(c, [(x - 22 * s, y), (x - 18 * s, y - 120 * s), (x + 18 * s, y - 120 * s), (x + 22 * s, y)], 6 * s, "ink",
      close=True, fill="paper2")
    p = [(x - 120 * s, y - 110 * s)]
    for k in range(11):
        a = math.radians(180 + k * 18)
        p.append((x + math.cos(a) * 120 * s, y - 110 * s + math.sin(a) * 110 * s))
    L(c, p, 6 * s, "ink", close=True, fill=color)
    for dx, dy, r in ((-50, -160, 16), (10, -185, 20), (60, -145, 14), (-10, -135, 10)):
        C(c, x + dx * s, y + dy * s, r * s, 4, "ink", fill="paper2")


def spores(c, x, y, t, n=14, spread=260, color="fungus"):
    for k in range(n):
        ph = (t * 0.25 + k * 0.137) % 1
        a = k * 2.39
        r = ph * spread
        sx = x + math.cos(a) * r + math.sin(t * 2 + k) * 10
        sy = y + math.sin(a) * r * 0.6 - ph * 60
        C(c, sx, sy, 6 + (k % 3) * 2, 0, fill=color, fa=int(230 * (1 - ph)))


def ruins(c, x0, x1, y=GY, off=0.0, color="soft"):
    c.saveLayerAlpha(None, 120)
    _ruins(c, x0, x1, y, off, color)
    c.restore()


def _ruins(c, x0, x1, y=GY, off=0.0, color="soft"):
    xs = [0, 140, 260, 380, 520, 640, 760, 900, 1040, 1180]
    hs = [320, 220, 380, 260, 300, 200, 350, 240, 310, 280]
    span = 1180
    for i, (bx, bh) in enumerate(zip(xs, hs)):
        xx = x0 + ((bx - off) % span) - 60
        if xx > x1 + 40:
            continue
        w = 110
        pts = [(xx, y), (xx, y - bh), (xx + w * 0.3, y - bh + 25), (xx + w * 0.55, y - bh - 12), (xx + w * 0.8, y - bh + 30),
               (xx + w, y - bh + 10), (xx + w, y)]
        L(c, pts, 5, "ink", fill=color, fa=255)
        for wy in range(int(y - bh + 60), int(y - 30), 60):
            for wx in (0.22, 0.58):
                R(c, xx + w * wx, wy, 22, 28, 3, "ink", fill="bg", r=2)
        L(c, [(xx + w * 0.5, y - bh + 20), (xx + w * 0.4, y - bh + 70), (xx + w * 0.55, y - bh + 110)], 3, "ink")
        L(c, [(xx + w, y - 40), (xx + w + 18, y - 90), (xx + w + 6, y - 120)], 4, "green")


def can_(c, x, y=GY):
    R(c, x - 32, y - 80, 64, 80, 5, "ink", fill="soft", r=6)
    R(c, x - 32, y - 60, 64, 34, 4, "ink", fill="red", r=2)
    T(c, "FOOD", x, y - 34, 18, (255, 255, 255), "bold")


def bottle(c, x, y=GY):
    L(c, [(x - 26, y), (x - 26, y - 90), (x - 12, y - 115), (x - 12, y - 135), (x + 12, y - 135), (x + 12, y - 115),
          (x + 26, y - 90), (x + 26, y)], 5, "ink", close=True, fill="sky")
    T(c, "H2O", x, y - 40, 20, "ink", "bold")


def crate(c, x, y=GY, label="", w=150, h=110, color="orange"):
    R(c, x - w / 2, y - h, w, h, 6, "ink", fill=color, r=4)
    L(c, [(x - w / 2, y - h), (x + w / 2, y)], 4, "ink")
    if label:
        R(c, x - w / 2 + 14, y - h * 0.68, w - 28, 42, 4, "ink", fill="paper2", r=6)
        T(c, label, x, y - h * 0.68 + 33, 30, "ink", "bold")


def wall(c, x, y, w, h):
    R(c, x, y - h, w, h, 6, "ink", fill="soft", r=2)
    for r_ in range(int(h // 40)):
        yy = y - h + 40 * (r_ + 1)
        L(c, [(x, yy), (x + w, yy)], 3, "ink")
        for k in range(int(w // 70) + 1):
            xx = x + k * 70 + (35 if r_ % 2 else 0)
            if x < xx < x + w:
                L(c, [(xx, yy - 40), (xx, yy)], 3, "ink")


def waves(c, x, y, t, f=1, color="orange", n=3, r0=30):
    for k in range(n):
        ph = (t * 1.2 + k / n) % 1
        r = r0 + ph * 120
        a0, a1 = (-40, 40) if f > 0 else (140, 220)
        arc(c, x, y, r, a0, a1, 6, color, int(255 * (1 - ph)))


def sparkle(c, x, y, t, s=1.0, color="orange"):
    k = 0.6 + 0.4 * math.sin(t * 6 + x)
    L(c, [(x - 22 * s * k, y), (x + 22 * s * k, y)], 5, color)
    L(c, [(x, y - 22 * s * k), (x, y + 22 * s * k)], 5, color)


def confetti(c, t, n=40):
    cols = ["red", "blue", "green", "orange", "purple", "marker"]
    for k in range(n):
        ph = (t * 0.35 + k * 0.071) % 1
        x = 80 + (k * 137) % 920 + math.sin(t * 3 + k) * 20
        y = 360 + ph * 520
        c.save()
        c.translate(x, y)
        c.rotate(t * 200 + k * 40)
        c.drawRect(skia.Rect.MakeXYWH(-9, -5, 18, 10), paint(cols[k % 6], a=int(255 * min(1, (1 - ph) * 3)), fill=True))
        c.restore()


def magnifier(c, x, y, s=1.0):
    C(c, x, y, 50 * s, 8 * s, "ink", fill="sky", fa=110)
    L(c, [(x + 36 * s, y + 36 * s), (x + 95 * s, y + 95 * s)], 14 * s, "ink")


def chalk(c, x, y, w, h):
    R(c, x, y, w, h, 8, "ink", fill=(46, 88, 68), r=6)
    L(c, [(x + 20, y + h + 12), (x + w - 20, y + h + 12)], 8, "ink")


def bike(c, x, y=GY, s=1.0, t=0):
    for wx in (-75, 75):
        C(c, x + wx * s, y - 55 * s, 55 * s, 6 * s, "ink")
        a = t * 6
        L(c, [(x + wx * s - math.cos(a) * 50 * s, y - 55 * s - math.sin(a) * 50 * s),
              (x + wx * s + math.cos(a) * 50 * s, y - 55 * s + math.sin(a) * 50 * s)], 3, "soft")
    L(c, [(x - 75 * s, y - 55 * s), (x - 10 * s, y - 55 * s), (x + 40 * s, y - 130 * s), (x - 30 * s, y - 130 * s),
          (x - 75 * s, y - 55 * s)], 7 * s, "red")
    L(c, [(x - 10 * s, y - 55 * s), (x - 30 * s, y - 140 * s)], 7 * s, "red")
    L(c, [(x + 40 * s, y - 130 * s), (x + 75 * s, y - 55 * s)], 7 * s, "red")
    L(c, [(x + 40 * s, y - 130 * s), (x + 50 * s, y - 160 * s), (x + 75 * s, y - 160 * s)], 6 * s, "ink")
    L(c, [(x - 50 * s, y - 145 * s), (x - 10 * s, y - 145 * s)], 8 * s, "ink")


def sign(c, x, y, text, size=46, color="blue", w=None):
    w = w or text_w(text, "bold", size) + 50
    L(c, [(x, y + 30), (x, GY)], 7, "ink")
    R(c, x - w / 2, y - 50, w, 80, 6, "ink", fill="paper2", r=10)
    T(c, text, x, y + 8, size, color, "bold")


def gamepad(c, x, y, s=1.0):
    p = skia.Path()
    p.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 120 * s, y - 50 * s, 240 * s, 100 * s), 50 * s, 50 * s))
    c.drawPath(p, paint("soft", fill=True))
    R(c, x - 120 * s, y - 50 * s, 240 * s, 100 * s, 6 * s, "ink", r=48 * s)
    L(c, [(x - 75 * s, y), (x - 35 * s, y)], 9 * s, "ink")
    L(c, [(x - 55 * s, y - 20 * s), (x - 55 * s, y + 20 * s)], 9 * s, "ink")
    for dx, dy, cl in ((50, -15, "red"), (75, 5, "blue"), (50, 22, "green"), (25, 5, "marker")):
        C(c, x + dx * s, y + dy * s, 10 * s, 3, "ink", fill=cl)


# ================================================================== helpers
def bob(t, a=4, sp=3):
    return math.sin(t * sp) * a


def talkpose(t, k=1):
    return P(a1u=30 + 25 * (0.5 + 0.5 * math.sin(t * 5)) * k, a1l=40)


def point_pose(ang=95, t=0):
    return P(a1u=ang + math.sin(t * 3) * 4, a1l=-5, a2u=-16, a2l=8)


def think_pose(t=0):
    return P(a1u=20, a1l=135, head=10 + math.sin(t * 1.5) * 4, a2u=-10, a2l=60)


def cheer_pose(t):
    k = abs(math.sin(t * 5))
    return P(a1u=155 + 10 * k, a1l=5, a2u=-155 - 10 * k, a2l=-5, y=-22 * k, l1u=14, l2u=-14)


def wave_pose(t):
    return P(a1u=145 + math.sin(t * 9) * 18, a1l=25)


def sit_pose(**kw):
    p = P(l1u=88, l1l=-88, l2u=82, l2l=-82, a1u=50, a1l=30, a2u=40, a2l=40)
    p.update(kw)
    return p


def kick_pose(t):
    ph = (t * 0.9) % 1
    k = math.sin(min(1, ph / 0.35) * math.pi) if ph < 0.35 else 0
    return P(l1u=-25 + 105 * k, l1l=-30 * (1 - k), l2u=-8, a1u=-40 * k + 10, a2u=-60 * k - 10, lean=-8 * k), ph


def dance_pose(t):
    s = math.sin(t * 6)
    return P(a1u=140 + 30 * s, a1l=40 * s, a2u=-60 - 40 * s, a2l=-60, l1u=20 + 15 * s, l1l=-30 * max(0, s),
             l2u=-12, lean=8 * s, y=-8 * abs(s))


def hold_pose(a1=60, a2=70, l1=40, l2=30):
    return P(a1u=a1, a1l=l1, a2u=a2, a2l=l2)


# ================================================================== vignettes
@v("intro")
def _(c, t, lt):
    ground(c)
    fig(c, 330, GY, wave_pose(t), s=1.05, face="big", hair="short")
    book(c, 730, 720, 2.1, color="red")
    T(c, "ENGLISH", 730, 560, 60, "red", "mark")
    for k, (x, y) in enumerate(((560, 430), (900, 450), (980, 760))):
        sparkle(c, x, y, t + k)
    T(c, "A", 560 + bob(t, 6, 2), 520, 64, "blue", "mark")
    T(c, "B", 880, 520 + bob(t + 1, 6, 2), 64, "green", "mark")
    T(c, "C", 990, 640 + bob(t + 2, 6, 2), 64, "orange", "mark")


@v("intro_game", "tl_title_small")
def _(c, t, lt):
    ground(c)
    fig(c, 260, GY, point_pose(70, t), s=1.0, face="big", f=1, front=False, hair="short")
    R(c, 480, 430, 470, 290, 7, "ink", fill="ink", r=16)
    R(c, 505, 455, 420, 240, 3, "ink", fill=(40, 46, 34), r=10)
    mushroom(c, 590, 670, 0.55)
    spores(c, 590, 600, t, 10, 120)
    T(c, "THE LAST", 790, 545, 46, (236, 233, 224), "mark")
    T(c, "OF US", 790, 605, 46, (236, 233, 224), "mark")
    gamepad(c, 715, 805, 0.8)


@v("read")
def _(c, t, lt):
    ground(c)
    chair(c, 460, 790, f=1)
    o = fig(c, 470, GY, sit_pose(a1u=70, a1l=50, a2u=60, a2l=60, head=12), f=1, front=False, s=1.0)
    hx, hy = o["hand1"]
    book(c, hx + 10, hy - 4, 0.9, color="blue")
    T(c, "ESPAÑOL", 780, 520, 58, "red", "mark")
    L(c, [(700, 550), (620, 610)], 6, "red")
    L(c, [(620, 610), (650, 600)], 6, "red")
    L(c, [(620, 610), (632, 582)], 6, "red")


@v("look")
def _(c, t, lt):
    ground(c)
    chalk(c, 470, 420, 520, 280)
    T(c, "sujeto + verbo", 730, 520, 50, (255, 255, 255), "hand")
    T(c, "I play football.", 730, 600, 46, (255, 240, 150), "hand")
    o = fig(c, 300, GY, P(a1u=100, a1l=-20), f=1, front=False, eyes="wide")
    hx, hy = o["hand1"]
    magnifier(c, hx + 30, hy - 30, 0.9)


@v("cover")
def _(c, t, lt):
    ground(c)
    R(c, 420, 430, 520, 300, 6, "ink", fill="paper2", r=14)
    T(c, "I play football.", 680, 520, 50, "blue", "bold")
    T(c, "= Juego al fútbol.", 680, 600, 44, "gray", "hand")
    k = ease(lt / 1.2)
    R(c, 440, 560 + 40 * (1 - k), 480, 70, 5, "ink", fill="note", r=8, a=int(255 * k), fa=int(255 * k))
    o = fig(c, 250, GY, P(a1u=80 + 10 * k, a1l=10), f=1, front=False, s=1.0, face="smile")
    qmark(c, 250, 460, 90, "blue", t)


@v("words")
def _(c, t, lt):
    ground(c)
    fig(c, 220, GY, think_pose(t), f=1, front=False)
    ws = [("hat", 450, 500, "blue"), ("song", 700, 450, "purple"), ("bus", 900, 560, "orange"),
          ("happy", 560, 650, "green"), ("school", 820, 740, "red")]
    for i, (w_, x, y, cl) in enumerate(ws):
        a = int(255 * ease((lt - i * 0.25) / 0.4))
        R(c, x - 90, y - 50, 180, 74, 5, "ink", a=a, fill="paper2", fa=a, r=24)
        T(c, w_, x, y + 6 + bob(t + i, 4, 2), 46, cl, "bold", a)


@v("groups")
def _(c, t, lt):
    ground(c)
    labels = [("ropa", "blue"), ("música", "purple"), ("lugares", "orange"), ("viajes", "green")]
    for i, (s, cl) in enumerate(labels):
        x = 470 + (i % 2) * 260
        y = 520 + (i // 2) * 190
        a = int(255 * ease((lt - i * 0.2) / 0.4))
        R(c, x - 110, y - 70, 220, 150, 5, "ink", a=a, fill="paper2", fa=a, r=10)
        T(c, s, x, y - 20, 40, cl, "bold", a)
        for k in range(3):
            L(c, [(x - 70, y + 15 + k * 20), (x + 70, y + 15 + k * 20)], 4, "soft", a)
    fig(c, 180, GY, point_pose(80, t), f=1, front=False, face="big")
    T(c, "8–10", 180, 470, 54, "red", "mark")


@v("clothes")
def _(c, t, lt):
    ground(c)
    L(c, [(430, 440), (1010, 460)], 4, "ink")
    # remera
    L(c, [(470, 455), (440, 490), (465, 505), (480, 495), (480, 590), (560, 590), (560, 495), (575, 505), (600, 490),
          (570, 455), (545, 462), (495, 462)], 5, "ink", close=True, fill="blue")
    # vestido
    L(c, [(680, 460), (700, 520), (650, 640), (790, 640), (740, 520), (760, 460), (730, 470), (710, 470)], 5, "ink",
      close=True, fill="purple")
    # campera
    L(c, [(840, 465), (820, 600), (870, 600), (875, 520), (915, 520), (920, 600), (970, 600), (950, 465), (920, 472),
          (870, 472)], 5, "ink", close=True, fill="green")
    L(c, [(895, 480), (895, 600)], 4, "ink")
    # zapatos
    for x in (560, 660):
        L(c, [(x, GY - 2), (x, GY - 30), (x + 40, GY - 30), (x + 70, GY - 14), (x + 70, GY - 2)], 5, "ink", close=True,
          fill="red")
    o = fig(c, 250, GY, P(a1u=30, a1l=40, a2u=-20), f=1, front=True, hat="sun", glasses=True, face="big")
    hx, hy = o["hand1"]
    R(c, hx - 10, hy, 70, 60, 5, "ink", fill="orange", r=10)
    arc(c, hx + 25, hy, 22, 180, 360, 5, "ink")


@v("entertainment")
def _(c, t, lt):
    ground(c)
    o = fig(c, 230, GY, P(a1u=60, a1l=80, head=-8), f=1, front=False, talk=0.5 + 0.5 * math.sin(t * 8))
    hx, hy = o["hand1"]
    mic(c, hx + 6, hy - 30)
    notes(c, 320, 520, t)
    R(c, 520, 430, 440, 280, 7, "ink", fill="ink", r=6)
    R(c, 540, 450, 400, 240, 3, "ink", fill="sky", r=4)
    k = (t * 0.3) % 1
    fig(c, 560 + k * 360, 680, run_pose(t), s=0.35, f=1, front=False)
    # claqueta
    R(c, 600, 760, 140, 90, 5, "ink", fill="ink", r=4)
    ang = -20 - 15 * abs(math.sin(t * 2))
    c.save()
    c.translate(600, 760)
    c.rotate(ang)
    R(c, 0, -26, 140, 26, 5, "ink", fill="paper2", r=3)
    for i in range(4):
        L(c, [(15 + i * 35, -26), (35 + i * 35, 0)], 6, "ink")
    c.restore()
    T(c, "ACTION!", 830, 820, 44, "red", "mark")


@v("hobbies")
def _(c, t, lt):
    ground(c)
    fig(c, 220, GY, dance_pose(t), f=1, front=True, face="big", hair="pony")
    notes(c, 300, 520, t)
    chair(c, 560, 790, f=1)
    o = fig(c, 570, GY, sit_pose(a1u=70, a1l=50, a2u=60, a2l=60, head=12), f=1, front=False)
    book(c, o["hand1"][0] + 10, o["hand1"][1] - 4, 0.8, color="green")
    kp, ph = kick_pose(t)
    o = fig(c, 830, GY, kp, f=1, front=False, s=0.9)
    bx = 900 + (ph * 250 if ph > 0.3 else 0)
    ball(c, min(bx, 1000), GY - 26 - (math.sin(min(1, ph) * math.pi) * 60 if ph > 0.3 else 0), 24, t * 300)


@v("technology")
def _(c, t, lt):
    ground(c)
    desk(c, 620, 740, 420)
    chair(c, 380, 790, f=1)
    o = fig(c, 400, GY, sit_pose(a1u=80, a1l=-10 + 10 * math.sin(t * 12), a2u=75, a2l=-5, head=4), f=1, front=False)
    hx, hy = o["head"]
    arc(c, hx, hy, 40, 190, 350, 8, "ink")
    R(c, hx - 46, hy - 6, 16, 34, 4, "ink", fill="red", r=5)
    laptop(c, 590, 736, 1.1)
    phone(c, 760, 690, 0.8)
    T(c, "wifi", 900, 520, 40, "blue", "bold")
    for k in range(3):
        arc(c, 900, 600, 30 + k * 26, 225, 315, 6, "blue")


@v("places")
def _(c, t, lt):
    ground(c)
    items = [("school", 150, "orange"), ("hospital", 385, "paper2"), ("bank", 615, "soft"), ("cinema", 850, "purple")]
    for i, (name, x, cl) in enumerate(items):
        a = int(255 * ease((lt - i * 0.25) / 0.4))
        R(c, x - 100, GY - 300, 200, 300, 6, "ink", a=a, fill=cl, fa=a, r=4)
        R(c, x - 30, GY - 100, 60, 100, 5, "ink", a=a, fill="paper2", fa=a, r=4)
        if name == "hospital":
            L(c, [(x, GY - 260), (x, GY - 180)], 18, "red", a)
            L(c, [(x - 40, GY - 220), (x + 40, GY - 220)], 18, "red", a)
        elif name == "bank":
            T(c, "$", x, GY - 160, 110, "green", "mark", a)
            L(c, [(x - 110, GY - 300), (x, GY - 360), (x + 110, GY - 300)], 6, "ink", a, close=True, fill="soft", fa=a)
        elif name == "school":
            L(c, [(x, GY - 300), (x, GY - 390)], 5, "ink", a)
            L(c, [(x, GY - 390), (x + 60, GY - 375), (x, GY - 355)], 5, "ink", a, close=True, fill="red", fa=a)
            clock(c, x, GY - 210, 42, t)
        elif name == "cinema":
            T(c, "FILM", x, GY - 200, 48, "marker", "mark", a)
        lab(c, name, x, GY - 320 - (90 if name in ("school", "bank") else 0), 38, "blue", a=a)
    tree(c, 1000, GY, 0.6)


@v("jobs")
def _(c, t, lt):
    ground(c)
    specs = [("teacher", 150, dict(glasses=True), P(a1u=120, a1l=10)), ("doctor", 395, dict(), P()),
             ("chef", 640, dict(hat="chef"), P(a1u=60, a1l=60)), ("police", 880, dict(hat="cap"), P(a1u=150, a1l=-40))]
    for i, (name, x, kw, pose) in enumerate(specs):
        o = fig(c, x, GY, pose, s=0.82, face="smile", **kw)
        if name == "doctor":
            nx, ny = o["neck"]
            L(c, [(nx - 18, ny + 4), (nx - 22, ny + 70), (nx, ny + 90), (nx + 22, ny + 70), (nx + 18, ny + 4)], 4, "ink")
            C(c, nx, ny + 92, 9, 4, "ink", fill="soft")
            L(c, [(x - 20, GY - 300), (x + 20, GY - 300)], 10, "red")
            L(c, [(x, GY - 320), (x, GY - 280)], 10, "red")
        if name == "teacher":
            hx, hy = o["hand1"]
            L(c, [(hx, hy), (hx + 40, hy - 70)], 5, "orange")
        lab(c, name, x, GY - 340 - (30 if name in ("chef",) else 0), 38)


@v("feelings")
def _(c, t, lt):
    data = [("happy", "dot", "big", "green"), ("sad", "sad", "sad", "blue"), ("angry", "angry", "angry", "red"),
            ("scared", "wide", "o", "purple")]
    for i, (name, ey, fc, cl) in enumerate(data):
        x = 160 + i * 253
        sh = math.sin(t * 40) * 3 if name == "scared" else 0
        y = 620 + bob(t + i, 6, 2)
        fig(c, x + sh, y + 240, P(a1u=150 if name == "scared" else (20 if name != "happy" else 140),
                                  a2u=-150 if name == "scared" else (-20 if name != "happy" else -140),
                                  a1l=20 if name != "sad" else 0, a2l=-20 if name != "sad" else 0,
                                  head=0 if name != "sad" else 12), s=0.75, eyes=ey, face=fc, head_scale=1.5)
        lab(c, name, x, 450, 44, cl)
    ground(c)


@v("travel_vocab")
def _(c, t, lt):
    ground(c)
    k = (t * 0.12) % 1
    plane(c, 1150 - k * 1300, 470, 0.9, f=-1)
    sun(c, 940, 440, 40, t)
    umbrella(c, 870, 720, 0.8)
    L(c, [(760, GY - 4), (1010, GY - 4)], 14, "marker")
    kb = (t * 0.18) % 1
    bus(c, -150 + kb * 1100, GY, 0.75, t)
    suitcase(c, 520, GY, 0.8, stickers=True)
    fig(c, 420, GY, wave_pose(t), s=0.9, face="big", hat="sun")


@v("grammar")
def _(c, t, lt):
    ground(c)
    chalk(c, 380, 420, 600, 300)
    T(c, "subject + verb", 680, 520, 58, (255, 255, 255), "hand")
    T(c, "I  +  play", 680, 610, 60, (255, 240, 150), "hand")
    fig(c, 230, GY, point_pose(100, t), f=1, front=False, face="big", glasses=True)


@v("gowentgone")
def _(c, t, lt):
    ground(c)
    words = [("go", 250, "blue"), ("went", 540, "orange"), ("gone", 830, "green")]
    for i, (w_, x, cl) in enumerate(words):
        a = int(255 * ease((lt - i * 0.5) / 0.4))
        sign(c, x, 500, w_, 60, cl, w=200) if a > 250 else None
        if a <= 250:
            R(c, x - 100, 450, 200, 80, 6, "ink", a=a, fill="paper2", fa=a, r=10)
            T(c, w_, x, 508, 60, cl, "bold", a)
        if i < 2:
            L(c, [(x + 110, 490), (x + 180, 490)], 6, "ink", a)
            L(c, [(x + 160, 475), (x + 182, 490), (x + 160, 505)], 6, "ink", a)
    kx = 120 + (lt * 120) % 860
    fig(c, kx, GY, walk_pose(t), s=0.75, f=1, front=False)
    T(c, "1", 250, 420, 36, "gray", "bold")
    T(c, "2", 540, 420, 36, "gray", "bold")
    T(c, "3", 830, 420, 36, "gray", "bold")


@v("routine")
def _(c, t, lt):
    ground(c)
    days = ["M", "T", "W", "T", "F", "S", "S"]
    for i, d in enumerate(days):
        x = 420 + i * 84
        R(c, x - 36, 450, 72, 90, 5, "ink", fill="paper2", r=8)
        T(c, d, x, 495, 36, "ink", "bold")
        if lt > 0.4 + i * 0.35:
            check(c, x, 520, 0.6)
    T(c, "every day", 670, 640, 60, "blue", "mark")
    kp, ph = kick_pose(t)
    fig(c, 220, GY, kp, f=1, front=False)
    ball(c, 300 + (ph * 120 if ph > 0.3 else 0), GY - 26, 24, t * 300)


@v("football", "football_she")
def _(c, t, lt, she=False):
    ground(c)
    # arco
    L(c, [(820, GY), (820, 620), (1010, 620), (1010, GY)], 8, "ink")
    for k in range(5):
        L(c, [(840 + k * 35, 630), (840 + k * 35, GY)], 2, "soft")
    kp, ph = kick_pose(t * 0.9)
    fig(c, 300, GY, kp, f=1, front=False, hair="pony" if she else None, face="big")
    if ph < 0.3:
        bx, by = 380, GY - 26
    else:
        q = (ph - 0.3) / 0.7
        bx, by = 380 + q * 520, GY - 26 - math.sin(q * math.pi) * 170
    ball(c, bx, by, 26, t * 500)
    T(c, "GOAL!", 915, 580, 50, "green", "mark", int(255 * (1 if ph > 0.85 else 0)))


V["football_she"] = lambda c, t, lt: V["football"](c, t, lt, she=True)


@v("noplay")
def _(c, t, lt):
    ground(c)
    fig(c, 330, GY, P(a1u=28, a1l=-118, a2u=-28, a2l=118), face="flat", eyes="dot", hair=None)
    fig(c, 760, GY, P(a1u=28, a1l=-118, a2u=-28, a2l=118), face="flat", hair="pony")
    ball(c, 545, GY - 40, 40, 0)
    cross(c, 545, GY - 40, 1.6)


@v("study_q")
def _(c, t, lt):
    ground(c)
    o = fig(c, 330, GY, hold_pose(60, 55, 45, 50), f=1, front=False, s=1.0)
    book(c, o["hand1"][0] + 20, o["hand1"][1], 0.9, color="green")
    fig(c, 740, GY, think_pose(t), f=-1, front=False)
    qmark(c, 740, 500, 120, "red", t)


@v("tip", "idea")
def _(c, t, lt):
    ground(c)
    o = fig(c, 420, GY, P(a1u=160, a1l=-10, a2u=-20), face="big", eyes="wide")
    hx, hy = o["hand1"]
    bulb(c, hx + 10, hy - 70, 1.0, t)
    T(c, "TIP", 780, 600, 110, "orange", "mark")
    sparkle(c, 700, 480, t)
    sparkle(c, 880, 720, t + 1)


@v("now")
def _(c, t, lt):
    ground(c)
    clock(c, 720, 590, 150, t * 0.5)
    R(c, 600, 380, 240, 76, 6, "ink", fill="red", r=14)
    T(c, "NOW", 720, 438, 56, (255, 255, 255), "mark")
    fig(c, 300, GY, point_pose(110, t), f=1, front=False, face="big")


@v("studying", "long_study")
def _(c, t, lt, long_=False):
    ground(c)
    desk(c, 560, 760, 360)
    chair(c, 360, 800, f=1)
    o = fig(c, 380, GY, sit_pose(a1u=75, a1l=20, a2u=70, a2l=30, head=16), f=1, front=False,
            eyes="closed" if long_ and int(t) % 4 == 3 else "dot")
    book(c, 560, 752, 1.0, color="blue")
    if long_:
        clock(c, 820, 500, 90, t * 2.0)
        T(c, "2 h", 820, 650, 50, "red", "mark")
        for k in range(2):
            C(c, 410 + k * 30, 460 - (t * 30 + k * 20) % 60, 6, 3, "sky", fill="sky")
    else:
        clock(c, 820, 500, 80, 3)
        R(c, 740, 610, 160, 60, 5, "ink", fill="red", r=12)
        T(c, "NOW", 820, 655, 40, (255, 255, 255), "mark")


V["long_study"] = lambda c, t, lt: V["studying"](c, t, lt, long_=True)


@v("sleeping", "sleeping_she")
def _(c, t, lt, she=False):
    ground(c)
    bed(c, 560, 760, 460)
    fig(c, 500, 742, P(rot=-90, l1u=0, l2u=0, a1u=10, a2u=-10, y=0), eyes="closed", face="flat",
        hair="pony" if she else None, f=1, front=False)
    R(c, 450, 712, 330, 52, 5, "ink", fill="sky", r=16)
    zzz(c, 360, 620, t)
    crescent(c, 900, 470, 50)


V["sleeping_she"] = lambda c, t, lt: V["sleeping"](c, t, lt, she=True)


@v("playing")
def _(c, t, lt):
    ground(c)
    ph = (t * 0.6) % 1
    x = 320 + (ph if ph < 0.5 else 1 - ph) * 2 * 440
    k1, _ = kick_pose(t * 0.6 + 0.65)
    fig(c, 250, GY, k1, f=1, front=False, face="big")
    k2, _ = kick_pose(t * 0.6 + 0.15)
    fig(c, 830, GY, k2, f=-1, front=False, face="big", hair="short")
    ball(c, x, GY - 26 - math.sin(ph * 2 * math.pi) ** 2 * 40, 24, t * 400)


@v("tennis_split", "tennis_sat", "tennis_now")
def _(c, t, lt, hi=None):
    ground(c)
    L(c, [(540, 380), (540, GY)], 4, "soft")
    aL = 255 if hi in (None, "L") else 90
    aR = 255 if hi in (None, "R") else 90
    c.saveLayerAlpha(skia.Rect.MakeXYWH(0, 340, 540, 600), aL)
    calendar(c, 380, 520, 200, 170, "SAT", "every", "blue", 50)
    o = fig(c, 170, GY, P(a1u=60, a1l=20), f=1, front=False, s=0.9)
    racket(c, o["hand1"][0], o["hand1"][1], -60, 0.8)
    c.restore()
    c.saveLayerAlpha(skia.Rect.MakeXYWH(540, 340, 540, 600), aR)
    clock(c, 960, 430, 60, t)
    T(c, "NOW", 960, 540, 44, "red", "mark")
    sw = math.sin(t * 4)
    o = fig(c, 700, GY, P(a1u=60 + 60 * sw, a1l=10, lean=6), f=1, front=False, s=0.9, face="big")
    racket(c, o["hand1"][0], o["hand1"][1], -90 + 70 * sw, 0.8)
    bx = 820 + 120 * math.cos(t * 4)
    C(c, bx, 700 - 60 * abs(math.sin(t * 4)), 14, 3, "ink", fill="green")
    c.restore()


V["tennis_sat"] = lambda c, t, lt: V["tennis_split"](c, t, lt, hi="L")
V["tennis_now"] = lambda c, t, lt: V["tennis_split"](c, t, lt, hi="R")


@v("yesterday")
def _(c, t, lt):
    ground(c)
    calendar(c, 720, 560, 300, 260, "yesterday", "AYER", "red", 48)
    fig(c, 300, GY, P(a1u=-110, a1l=-20, a2u=-20), f=1, front=False, face="smile")
    L(c, [(220, 520), (120, 520)], 8, "red")
    L(c, [(145, 495), (115, 520), (145, 545)], 8, "red")


@v("tv", "tv_no", "tv_q")
def _(c, t, lt, mode=None):
    ground(c)
    couch(c, 330)
    fig(c, 320, GY - 4, sit_pose(a1u=40, a1l=30, a2u=30, a2l=40), f=1, front=False, s=0.9,
        face="flat" if mode == "no" else "smile")
    tv(c, 790, 600, 280, 190, on=(mode != "no"), t=t, x_mark=(mode == "no"))
    if mode == "q":
        qmark(c, 520, 500, 110, "red", t)
    calendar(c, 560 if mode != "q" else 170, 440, 150, 120, "", "yesterday", "blue", 30)


V["tv_no"] = lambda c, t, lt: V["tv"](c, t, lt, mode="no")
V["tv_q"] = lambda c, t, lt: V["tv"](c, t, lt, mode="q")


@v("past_clock")
def _(c, t, lt):
    ground(c)
    clock(c, 720, 580, 150, -t * 1.5)
    L(c, [(560, 400), (520, 440), (580, 450)], 7, "red")
    T(c, "PAST", 720, 800, 50, "red", "mark")
    fig(c, 300, GY, think_pose(t), f=1, front=False)
    bubble(c, 120, 380, 180, 120, 280, 520, "thought")
    T(c, "...ing", 210, 455, 44, "blue", "bold")


@v("phone_rang")
def _(c, t, lt):
    ground(c)
    bed(c, 520, 760, 460)
    ring = lt > 1.0
    if not ring:
        fig(c, 460, 742, P(rot=-90, l1u=0, l2u=0, a1u=10, a2u=-10), eyes="closed", face="flat", f=1, front=False)
        R(c, 410, 712, 320, 52, 5, "ink", fill="sky", r=16)
        zzz(c, 320, 620, t)
    else:
        k = ease_out((lt - 1.0) / 0.25)
        fig(c, 400, 760, sit_pose(a1u=150, a1l=20, a2u=-150, a2l=-20, l1u=90, l1l=0, l2u=90, l2l=0, y=-30 * k),
            eyes="wide", face="o", f=1, front=True)
        R(c, 440, 722, 300, 48, 5, "ink", fill="sky", r=16)
        T(c, "RING!", 860, 520, 64, "red", "mark")
    desk(c, 860, 760, 160)
    phone(c, 860, 700, 0.8, ring=ring, t=t)


@v("usedto", "usedto_no", "usedto_q")
def _(c, t, lt, mode=None):
    ground(c)
    chair(c, 240, 790, f=1)
    fig(c, 250, GY, sit_pose(a1u=40, a1l=20, a2u=30, a2l=30, head=6), f=1, front=False,
        face="smile", hair="short")
    bubble(c, 420, 380, 520, 360, 320, 560, "thought")
    T(c, "ANTES", 680, 440, 44, "orange", "mark")
    if mode == "no":
        fig(c, 680, 700, P(), s=0.55, face="flat")
        cross(c, 680, 590, 1.6)
    else:
        fig(c, 680, 700, dance_pose(t), s=0.55, face="big")
        notes(c, 760, 560, t)
    if mode == "q":
        fig(c, 960, GY, think_pose(t), f=-1, front=False, s=0.8)
        qmark(c, 960, 520, 80, "red", t)


V["usedto_no"] = lambda c, t, lt: V["usedto"](c, t, lt, mode="no")
V["usedto_q"] = lambda c, t, lt: V["usedto"](c, t, lt, mode="q")


@v("plan", "agenda")
def _(c, t, lt):
    ground(c)
    R(c, 500, 410, 360, 400, 6, "ink", fill="paper2", r=10)
    T(c, "PLAN", 680, 470, 54, "blue", "mark")
    for i in range(3):
        y = 540 + i * 80
        R(c, 540, y - 30, 40, 40, 5, "ink", fill="paper2", r=6)
        if lt > 0.4 + i * 0.4:
            check(c, 562, y - 10, 0.55)
        L(c, [(600, y - 10), (820, y - 10)], 5, "soft")
    o = fig(c, 300, GY, P(a1u=100, a1l=-30), f=1, front=False, face="big")
    L(c, [o["hand1"], (o["hand1"][0] + 40, o["hand1"][1] - 50)], 6, "orange")


@v("travel", "travel_she")
def _(c, t, lt, she=False):
    ground(c)
    k = (lt * 0.15) % 1
    plane(c, 760 + k * 300, 470 - k * 120, 1.0, f=1)
    o = fig(c, 380, GY, walk_pose(t), f=1, front=False, face="big", hair="pony" if she else None)
    hx, hy = o["hand2"]
    suitcase(c, hx - 20, hy + 120, 0.8)
    if she:
        calendar(c, 840, 700, 220, 170, "next week", "", "green", 40)


V["travel_she"] = lambda c, t, lt: V["travel"](c, t, lt, she=True)


@v("study_she")
def _(c, t, lt):
    ground(c)
    o = fig(c, 380, GY, hold_pose(60, 55, 45, 50), f=1, front=False, s=1.0, hair="pony", face="big")
    book(c, o["hand1"][0] + 20, o["hand1"][1], 0.9, color="green")
    R(c, 620, 420, 300, 240, 6, "ink", fill="paper2", r=10)
    T(c, "PLAN", 770, 480, 50, "blue", "mark")
    T(c, "study", 770, 560, 46, "green", "bold")
    check(c, 770, 610, 0.7)


@v("friends")
def _(c, t, lt):
    ground(c)
    calendar(c, 540, 470, 260, 190, "tomorrow", "", "orange", 44)
    for i, (x, f, kw) in enumerate(((210, 1, dict()), (820, -1, dict(hair="pony")), (960, -1, dict(hair="short")))):
        fig(c, x, GY, wave_pose(t + i) if i != 1 else P(a1u=-150 if f < 0 else 150, a1l=20), s=0.85, f=f,
            front=True, face="big", **kw)
    heart(c, 540, 700, 1.0)


@v("crystal")
def _(c, t, lt):
    ground(c)
    C(c, 720, 600, 130, 7, "ink", fill="sky", fa=160)
    cloud(c, 720, 590, 0.7, rain=True, t=t, color="soft")
    R(c, 620, 720, 200, 60, 6, "ink", fill="purple", r=10)
    fig(c, 330, GY, P(a1u=80, a1l=10, a2u=60, a2l=30), f=1, front=False, eyes="wide", face="o")
    sparkle(c, 880, 460, t)


@v("rain")
def _(c, t, lt):
    ground(c)
    cloud(c, 720, 470, 1.3, rain=True, t=t)
    fig(c, 300, GY, think_pose(t), f=1, front=False)
    bubble(c, 110, 380, 190, 110, 270, 520, "thought")
    T(c, "will", 205, 450, 46, "blue", "bold")
    umbrella(c, 760, 700, 0.6, "blue")


@v("promise")
def _(c, t, lt):
    ground(c)
    fig(c, 380, GY, P(a1u=95, a1l=-10), f=1, front=False, face="smile")
    fig(c, 700, GY, P(a1u=95, a1l=-10), f=-1, front=False, face="smile", hair="pony")
    heart(c, 540, 470 + bob(t, 8, 3), 1.6)
    R(c, 760, 380, 240, 90, 5, "ink", fill="note", r=6)
    T(c, "don't forget!", 880, 438, 36, "ink", "hand")


@v("help")
def _(c, t, lt):
    ground(c)
    k = ease((lt - 0.6) / 0.8)
    lift = 30 * k
    crate(c, 540, GY - 40 - lift + 40, "", 200, 140)
    fig(c, 340 + 40 * k, GY, P(a1u=70, a1l=30, a2u=60, a2l=40, lean=10, l1u=30, l1l=-40), f=1, front=False,
        face="flat" if k < 0.5 else "big")
    if k > 0:
        fig(c, 1020 - 280 * k, GY, P(a1u=70, a1l=30, a2u=60, a2l=40, lean=10) if k > 0.95 else walk_pose(t), f=-1,
            front=False, face="big", hair="pony")
    if k > 0.95:
        heart(c, 540, 560, 0.8)


@v("experience")
def _(c, t, lt):
    ground(c)
    R(c, 560, 400, 320, 420, 6, "ink", fill="paper2", r=10)
    T(c, "I have...", 720, 460, 46, "blue", "bold")
    for i in range(4):
        y = 530 + i * 75
        if lt > 0.3 + i * 0.35:
            check(c, 610, y, 0.55)
        L(c, [(650, y), (840, y)], 5, "soft")
    fig(c, 300, GY, point_pose(70, t), f=1, front=False, face="big")


@v("brazil")
def _(c, t, lt):
    ground(c)
    postcard(c, 720, 560, "BRAZIL", 330, 220)
    o = fig(c, 300, GY, wave_pose(t), f=1, front=True, face="big", hat="sun")
    suitcase(c, 420, GY, 0.7, stickers=True)


@v("eaten")
def _(c, t, lt):
    ground(c)
    desk(c, 700, 740, 340)
    plate(c, 700, 730, full=False)
    fig(c, 370, GY, P(a1u=20, a1l=120, a2u=-20, a2l=-120), f=1, front=True, face="big", hair="pony",
        eyes="closed")
    T(c, "Mmm!", 380, 450, 56, "orange", "mark")


@v("paris", "paris_cal")
def _(c, t, lt, cal=False):
    ground(c)
    tower(c, 720 if not cal else 600, GY, 1.0)
    fig(c, 300, GY, wave_pose(t), f=1, front=True, face="big")
    T(c, "PARIS", 720 if not cal else 600, 420, 46, "blue", "mark")
    if cal:
        calendar(c, 880, 560, 220, 170, "last year", "", "red", 38)


V["paris_cal"] = lambda c, t, lt: V["paris"](c, t, lt, cal=True)


@v("arrive")
def _(c, t, lt):
    ground(c)
    k = ease(lt / 0.8)
    door(c, 400, GY, k)
    x = 400 + 260 * ease((lt - 0.5) / 1.0)
    fig(c, x, GY, walk_pose(t) if lt < 1.5 else wave_pose(t), f=1, front=lt > 1.5, face="big")
    if lt > 1.5:
        T(c, "just!", 860, 520, 64, "orange", "mark")
        sparkle(c, 760, 460, t)


@v("finished_q", "not_finished")
def _(c, t, lt, nf=False):
    ground(c)
    desk(c, 400, 760, 320)
    chair(c, 230, 800, f=1)
    fig(c, 250, GY, sit_pose(a1u=80, a1l=0 + 10 * math.sin(t * 10), a2u=75, a2l=0), f=1, front=False,
        face="flat" if nf else "smile")
    for k in range(5 if nf else 2):
        R(c, 360 + k * 6, 735 - k * 14, 120, 14, 3, "ink", fill="paper2", r=2)
    if nf:
        clock(c, 420, 520, 70, t)
        C(c, 330, 600, 9, 3, "sky", fill="sky")
    o = fig(c, 830, GY, P(a1u=100, a1l=-40), f=-1, front=False, hair="pony")
    if not nf:
        bubble(c, 700, 380, 260, 120, 820, 520)
        T(c, "yet?", 830, 460, 56, "blue", "bold")


V["not_finished"] = lambda c, t, lt: V["finished_q"](c, t, lt, nf=True)


@v("working")
def _(c, t, lt):
    ground(c)
    desk(c, 600, 760, 380)
    chair(c, 410, 800, f=1)
    fig(c, 430, GY, sit_pose(a1u=80, a1l=-10 + 12 * math.sin(t * 14), a2u=75, a2l=-5, head=10), f=1, front=False,
        hair="pony", eyes="closed" if int(t * 2) % 5 == 0 else "dot", face="flat")
    laptop(c, 640, 755, 1.1)
    k = (t * 0.12) % 1
    ang = math.pi * (1 - k)
    sx, sy = 700 + math.cos(ang) * 260, 600 - math.sin(ang) * 200
    if k < 0.5:
        sun(c, sx, sy, 32, t)
    else:
        crescent(c, sx, sy, 34)
    T(c, "all day", 900, 820, 44, "red", "mark")


@v("box_q", "box_want", "box_empty")
def _(c, t, lt, mode="q"):
    ground(c)
    crate(c, 700, GY, "", 240, 170, "orange")
    if mode == "empty":
        L(c, [(580, GY - 170), (540, GY - 240)], 6, "ink")
        L(c, [(820, GY - 170), (860, GY - 240)], 6, "ink")
        fig(c, 330, GY, P(a1u=40, a1l=60, a2u=-40), f=1, front=True, face="sad", eyes="sad")
        T(c, "0", 700, 560, 90, "red", "mark")
    elif mode == "want":
        heart(c, 700, 620 + bob(t, 6, 3), 1.2)
        fig(c, 330, GY, P(a1u=90, a1l=-10), f=1, front=False, face="big")
    else:
        qmark(c, 700, 600, 120, "red", t)
        fig(c, 330, GY, think_pose(t), f=1, front=False)


V["box_q"] = lambda c, t, lt: V["box_empty"](c, t, lt, mode="q") if False else _box(c, t, lt, "q")
V["box_want"] = lambda c, t, lt: _box(c, t, lt, "want")
V["box_empty"] = lambda c, t, lt: _box(c, t, lt, "empty")


def _box(c, t, lt, mode):
    ground(c)
    crate(c, 700, GY, "", 240, 170, "orange")
    if mode == "empty":
        L(c, [(580, GY - 170), (540, GY - 240)], 6, "ink")
        L(c, [(820, GY - 170), (860, GY - 240)], 6, "ink")
        fig(c, 330, GY, P(a1u=40, a1l=60, a2u=-40), f=1, front=True, face="sad", eyes="sad")
        T(c, "0", 700, 600, 100, "red", "mark")
    elif mode == "want":
        heart(c, 700, 600 + bob(t, 6, 3), 1.3)
        fig(c, 330, GY, P(a1u=90, a1l=-10), f=1, front=False, face="big")
    else:
        qmark(c, 700, 610, 130, "red", t)
        fig(c, 330, GY, think_pose(t), f=1, front=False)


@v("somebody", "knock")
def _(c, t, lt, knock=False):
    ground(c)
    house(c, 700, GY, 1.3, win_fig=not knock, t=t)
    if knock:
        sw = math.sin(t * 10)
        fig(c, 380, GY, P(a1u=95 + 15 * sw, a1l=70), f=1, front=False, face="smile")
        T(c, "knock knock", 380, 470, 44, "orange", "mark")
        qmark(c, 860, 470, 90, "red", t)
    else:
        fig(c, 260, GY, point_pose(80, t), f=1, front=False, face="big")
        excl(c, 520, 520, 100, "red")


V["knock"] = lambda c, t, lt: V["somebody"](c, t, lt, knock=True)


@v("nobody_called")
def _(c, t, lt):
    ground(c)
    desk(c, 700, 760, 300)
    phone(c, 700, 690, 0.9)
    R(c, 740, 600, 70, 50, 4, "ink", fill="paper2", r=20)
    T(c, "0", 775, 640, 38, "red", "bold")
    chair(c, 400, 800, f=1)
    fig(c, 420, GY, sit_pose(a1u=60, a1l=90, a2u=50, a2l=100, head=20), f=1, front=False, face="sad", eyes="sad")


@v("heights", "heights_she")
def _(c, t, lt, she=False):
    ground(c)
    data = [(0.7, 270, "tall"), (0.86, 540, "taller"), (1.04, 810, "the tallest")]
    for i, (s, x, w_) in enumerate(data):
        a = int(255 * ease((lt - i * 0.4) / 0.4))
        if a < 5:
            continue
        o = fig(c, x, GY, P() if i < 2 else cheer_pose(t), s=s, face="big" if i == 2 else "smile",
                hair="pony" if (she and i == 2) else None, a=a)
        hy = o["head"][1] - o["hr"] - 30
        T(c, w_, x, min(hy, 560) - (40 if i == 2 else 0), 42, "blue", "bold", a)
    if she:
        T(c, "★", 810, 400, 60, "orange", "mark")


V["heights_she"] = lambda c, t, lt: V["heights"](c, t, lt, she=True)


@v("houses")
def _(c, t, lt):
    ground(c)
    house(c, 330, GY, 0.85, color="sky")
    house(c, 740, GY, 1.3, color="orange")
    fig(c, 530, GY, point_pose(100, t), f=1, front=False, s=0.7, face="big")
    T(c, "bigger", 740, 410, 50, "blue", "mark")


@v("modals")
def _(c, t, lt):
    ground(c)
    fig(c, 540, GY, think_pose(t), f=1, front=True, face="smile")
    for i, (w_, x, y, cl) in enumerate((("must", 220, 450, "red"), ("have to", 260, 680, "orange"),
                                       ("should", 840, 450, "green"), ("ought to", 820, 680, "blue"))):
        a = int(255 * ease((lt - i * 0.25) / 0.4))
        R(c, x - 115, y - 50, 230, 80, 5, "ink", a=a, fill="paper2", fa=a, r=20)
        T(c, w_, x, y + 8, 46, cl, "bold", a)


@v("helmet")
def _(c, t, lt):
    ground(c)
    bk = (lt * 90) % 1400 - 200
    bike(c, 600, GY, 1.0, t)
    fig(c, 560, GY - 95, P(lean=20, a1u=120, a1l=-30, a2u=110, a2l=-20, l1u=60, l1l=-60, l2u=40, l2l=-30),
        f=1, front=False, hat="helmet", face="big")
    T(c, "must!", 250, 520, 64, "red", "mark")
    check(c, 250, 600, 1.0)


@v("homework")
def _(c, t, lt):
    ground(c)
    desk(c, 560, 760, 360)
    chair(c, 360, 800, f=1)
    o = fig(c, 380, GY, sit_pose(a1u=80, a1l=-5 + 10 * math.sin(t * 9), a2u=75, a2l=20, head=18), f=1, front=False)
    R(c, 500, 735, 140, 20, 4, "ink", fill="paper2", r=3)
    hx, hy = o["hand1"]
    L(c, [(hx, hy), (hx + 22, hy - 40)], 6, "orange")
    for k in range(3):
        R(c, 650, 740 - k * 30, 120, 28, 4, "ink", fill=["blue", "red", "green"][k], r=4)
    T(c, "homework", 800, 520, 50, "blue", "mark")


@v("rest")
def _(c, t, lt):
    ground(c)
    couch(c, 540, GY, 420)
    fig(c, 520, GY - 92, P(rot=-90, l1u=0, l2u=0, a1u=170, a1l=-60, a2u=-10), eyes="closed", face="smile", f=1,
        front=False)
    zzz(c, 380, 620, t)
    fig(c, 900, GY, point_pose(100, t), f=-1, front=False, s=0.8, hair="pony")


@v("relax")
def _(c, t, lt):
    ground(c)
    sun(c, 880, 450, 50, t)
    L(c, [(330, GY), (380, 700), (640, 700), (690, GY)], 6, "ink")
    L(c, [(380, 700), (330, 560)], 6, "ink")
    fig(c, 560, 690, P(rot=-70, l1u=50, l1l=-40, l2u=40, l2l=-50, a1u=170, a1l=-90, a2u=-170, a2l=90),
        eyes="closed", face="big", f=1, glasses=True, front=False)
    T(c, "today: free!", 800, 620, 44, "green", "mark")


@v("shh")
def _(c, t, lt):
    ground(c)
    for k in range(6):
        R(c, 620 + k * 60, 600 - (k % 2) * 20, 50, 200 + (k % 2) * 20, 5, "ink", fill=["blue", "red", "green"][k % 3], r=4)
    L(c, [(600, 800), (980, 800)], 8, "ink")
    o = fig(c, 330, GY, P(a1u=15, a1l=150, head=4), f=1, front=True, face="flat")
    T(c, "Shhh!", 330, 450, 64, "blue", "mark")


@v("nophone")
def _(c, t, lt):
    ground(c)
    phone(c, 700, 600, 1.6, ring=False, t=t, x_mark=True)
    fig(c, 300, GY, P(a1u=100, a1l=-20), f=1, front=False, face="flat")


@v("advice")
def _(c, t, lt):
    ground(c)
    o = fig(c, 300, GY, P(a1u=120, a1l=-30), f=1, front=False, face="big", glasses=True)
    bulb(c, o["hand1"][0] + 10, o["hand1"][1] - 70, 0.7, t)
    fig(c, 760, GY, P(a1u=20, a1l=10, head=-8), f=-1, front=False, face="smile", hair="pony")
    bubble(c, 420, 400, 250, 110, 340, 540)
    T(c, "should", 545, 475, 50, "green", "bold")


@v("late_bed")
def _(c, t, lt):
    ground(c)
    bed(c, 600, 760, 440)
    clock(c, 870, 500, 80, 2.0 + t * 0.2)
    crescent(c, 280, 470, 55)
    fig(c, 400, GY, P(a1u=160, a1l=10, a2u=-160, a2l=-10), f=1, front=True, face="o", eyes="closed")
    cross(c, 640, 560, 1.3)


@v("ifthen")
def _(c, t, lt):
    ground(c)
    R(c, 200, 450, 280, 160, 6, "ink", fill="note", r=14)
    T(c, "IF", 340, 555, 80, "blue", "mark")
    R(c, 640, 450, 280, 160, 6, "ink", fill="paper2", r=14)
    T(c, "WILL", 780, 555, 76, "green", "mark")
    k = ease(lt / 1.0)
    L(c, [(500, 530), (500 + 120 * k, 530)], 9, "red")
    if k > 0.95:
        L(c, [(595, 505), (622, 530), (595, 555)], 9, "red")
    fig(c, 540, GY, P(), s=0.55, face="smile")


@v("exam")
def _(c, t, lt):
    ground(c)
    desk(c, 380, 760, 300)
    chair(c, 220, 800, f=1)
    fig(c, 240, GY, sit_pose(a1u=75, a1l=20, a2u=70, a2l=30, head=16), f=1, front=False)
    book(c, 400, 752, 0.8)
    k = ease((lt - 0.8) / 0.6)
    exam_paper(c, 790, 600, mark=lt > 1.4, rot=-6 * k)
    if lt > 1.4:
        fig(c, 960, GY, cheer_pose(t), s=0.6, face="big")


@v("rain_home")
def _(c, t, lt):
    ground(c)
    cloud(c, 540, 450, 1.4, rain=True, t=t)
    house(c, 560, GY, 1.0, win_fig=True, t=t)
    T(c, "home", 860, 700, 50, "blue", "mark")


@v("bus_run")
def _(c, t, lt):
    ground(c)
    kb = min(1, lt * 0.12)
    bus(c, 620 + kb * 300, GY, 0.85, t)
    fig(c, 200 + (lt * 25) % 120, GY, run_pose(t), f=1, front=False, face="o", eyes="wide")
    for k in range(3):
        L(c, [(100 + (lt * 25) % 120, 640 + k * 50), (40 + (lt * 25) % 120, 640 + k * 50)], 5, "soft")
    T(c, "hurry!", 330, 460, 56, "red", "mark")


@v("dream", "dream_rich", "dream_car")
def _(c, t, lt, mode=None):
    ground(c)
    fig(c, 240, GY, think_pose(t), f=1, front=False, face="smile")
    bubble(c, 380, 370, 600, 420, 300, 560, "thought")
    if mode == "rich":
        moneybag(c, 520, 620, 1.0)
        moneybag(c, 620, 650, 0.8)
        plane(c, 820, 520 + bob(t, 10, 2), 0.7, f=1)
    elif mode == "car":
        car(c, 680, 720, 1.1, "red", t)
        fig(c, 680, 640, P(a1u=100, a1l=-30), s=0.35, face="big")
    else:
        T(c, "if...", 680, 600, 90, "blue", "mark")
        sparkle(c, 520, 480, t)
        sparkle(c, 860, 700, t + 1)


V["dream_rich"] = lambda c, t, lt: V["dream"](c, t, lt, mode="rich")
V["dream_car"] = lambda c, t, lt: V["dream"](c, t, lt, mode="car")


@v("clean")
def _(c, t, lt):
    ground(c)
    L(c, [(120, GY), (120, 400), (960, 400), (960, GY)], 6, "ink")
    R(c, 700, 470, 160, 130, 5, "ink", fill="sky", r=4)
    L(c, [(780, 470), (780, 600)], 4, "ink")
    sw = math.sin(t * 5)
    o = fig(c, 420, GY, P(a1u=50 + 15 * sw, a1l=30, a2u=40 + 15 * sw, a2l=40, lean=8), f=1, front=False, face="smile")
    hx, hy = o["hand1"]
    L(c, [(hx - 20, hy - 30), (hx + 70, GY - 20)], 7, "orange")
    L(c, [(hx + 50, GY - 20), (hx + 110, GY - 20), (hx + 95, GY - 2), (hx + 60, GY - 2)], 5, "ink", close=True,
      fill="marker")
    for k in range(3):
        sparkle(c, 600 + k * 120, 760 - k * 60, t + k, 0.8)


@v("cake")
def _(c, t, lt):
    ground(c)
    desk(c, 560, 760, 340)
    cake(c, 560, 760, 1.0)
    calendar(c, 870, 520, 200, 160, "yesterday", "", "blue", 34)
    fig(c, 240, GY, P(a1u=150, a1l=10, a2u=-150, a2l=-10), f=1, front=True, face="big", hat="chef")


@v("summary")
def _(c, t, lt):
    ground(c)
    chalk(c, 400, 400, 560, 340)
    rows = ["S + V", "am/is/are + -ing", "did / was / were", "have + participle"]
    for i, r_ in enumerate(rows):
        a = int(255 * ease((lt - i * 0.3) / 0.4))
        T(c, r_, 680, 470 + i * 72, 44, (255, 255, 255) if i % 2 == 0 else (255, 240, 150), "hand", a)
    fig(c, 220, GY, point_pose(105, t), f=1, front=False, face="big", glasses=True)


@v("versus")
def _(c, t, lt):
    ground(c)
    fig(c, 280, GY, P(a1u=90, a1l=-40, lean=6), f=1, front=False, face="big")
    fig(c, 800, GY, P(a1u=90, a1l=-40, lean=6), f=-1, front=False, face="big", hair="pony")
    T(c, "VS", 540, 640 + bob(t, 8, 4), 120, "red", "mark")


@v("thinker", "think")
def _(c, t, lt):
    ground(c)
    chair(c, 420, 790, f=1)
    o = fig(c, 430, GY, sit_pose(a1u=25, a1l=130, a2u=40, a2l=40, head=12), f=1, front=False)
    bubble(c, 560, 380, 300, 180, 500, 560, "thought")
    qmark(c, 650, 500, 100, "red", t)
    qmark(c, 760, 500, 80, "blue", t + 1)


@v("countdown")
def _(c, t, lt):
    ground(c)
    chair(c, 300, 790, f=1)
    fig(c, 310, GY, sit_pose(a1u=25, a1l=130, a2u=40, a2l=40, head=12), f=1, front=False, eyes="wide")
    n = 3 - int(lt / 1.05)
    if n >= 1:
        k = (lt / 1.05) % 1
        C(c, 720, 600, 150, 8, "ink", fill="paper2")
        p = skia.Path()
        p.addArc(skia.Rect.MakeXYWH(720 - 150, 600 - 150, 300, 300), -90, 360 * (1 - k))
        c.drawPath(p, paint("red", 14))
        T(c, str(n), 720, 650 + 0, int(150 * (1 + 0.15 * (1 - ease(k * 3)))), "red", "mark")


@v("cheer")
def _(c, t, lt):
    ground(c)
    confetti(c, t)
    fig(c, 380, GY, cheer_pose(t), face="big")
    check(c, 760, 600, 3.0)


@v("oops")
def _(c, t, lt):
    ground(c)
    fig(c, 400, GY, P(a1u=70, a1l=70, a2u=-70, a2l=-70), face="smile", eyes="dot")
    C(c, 450, 520, 10, 3, "sky", fill="sky")
    book(c, 760, 760, 1.5, color="green")
    L(c, [(640, 560), (700, 640)], 7, "orange")


@v("aloud")
def _(c, t, lt):
    ground(c)
    o = fig(c, 300, GY, hold_pose(60, 55, 45, 50), f=1, front=False, talk=0.5 + 0.5 * math.sin(t * 9))
    book(c, o["hand1"][0] + 20, o["hand1"][1], 0.8, color="blue")
    waves(c, 380, 520, t, 1, "orange")
    bubble(c, 560, 400, 400, 140, 420, 540)
    T(c, "I play football!", 760, 485, 46, "blue", "bold")


@v("clues")
def _(c, t, lt):
    ground(c)
    words = [("now", 600, 450), ("every day", 820, 520), ("yesterday", 620, 610), ("tomorrow", 860, 680),
             ("since", 610, 770), ("for", 840, 800)]
    for i, (w_, x, y) in enumerate(words):
        a = int(255 * ease((lt - i * 0.15) / 0.3))
        T(c, w_, x, y, 46, "blue", "bold", a)
    mx = 650 + math.sin(t * 1.2) * 150
    my = 600 + math.cos(t * 1.5) * 120
    o = fig(c, 250, GY, P(a1u=100, a1l=-20), f=1, front=False, eyes="wide")
    magnifier(c, mx, my, 1.0)


@v("outro")
def _(c, t, lt):
    ground(c)
    confetti(c, t, 30)
    fig(c, 300, GY, wave_pose(t), face="big", hair="short")
    fig(c, 780, GY, wave_pose(t + 1), face="big", hair="pony", f=-1)
    book(c, 540, 760, 1.3, color="red")
    T(c, "¡CHAU!", 540, 520, 90, "red", "mark")


# ------------------------------------------------------------------ THE LAST OF US (tema oscuro)
def moon(c, x, y, r=50):
    C(c, x, y, r, 4, "ink", fill=(230, 226, 200))


def joel(c, x, pose=None, f=1, front=False, **kw):
    return fig(c, x, GY, pose, s=1.05, f=f, front=front, beard=True, hair="short", backpack=True, **kw)


def ellie(c, x, pose=None, f=1, front=False, **kw):
    return fig(c, x, GY, pose, s=0.82, f=f, front=front, hair="pony", **kw)


@v("tl_title", "tl_duo")
def _(c, t, lt):
    moon(c, 880, 440)
    ruins(c, 60, 1020, GY, t * 8)
    ground(c)
    joel(c, 420, walk_pose(t * 0.8), f=1)
    ellie(c, 600, walk_pose(t * 0.8 + 0.3), f=1)
    spores(c, 540, 560, t, 10, 500)


@v("tl_fungus")
def _(c, t, lt):
    ground(c)
    mushroom(c, 280, GY, 1.4)
    spores(c, 300, 600, t, 22, 420)
    k = ease((lt - 0.6) / 1.2)
    fig(c, 760, GY, P(a1u=20, a2u=-20, head=8 * k, lean=4 * k), face="sad" if k > 0.5 else "o",
        eyes="sad" if k > 0.5 else "wide", sick=k > 0.5, color="ink")
    if k > 0.5:
        T(c, "sick", 760, 480, 50, "fungus", "mark")


@v("tl_attack")
def _(c, t, lt):
    ground(c)
    run = (lt * 60) % 200
    fig(c, 300 + run * 0.3, GY, mix(walk_pose(t * 1.2), P(a1u=85, a2u=80, a1l=0, a2l=0, lean=10), 0.6), f=1, front=False,
        sick=True, face="grr", eyes="angry")
    fig(c, 720 + run * 0.3, GY, run_pose(t), f=1, front=False, face="o", eyes="wide")
    T(c, "healthy", 760, 470, 42, "blue", "bold")
    T(c, "sick", 300, 470, 42, "fungus", "bold")


@v("tl_world")
def _(c, t, lt):
    moon(c, 900, 430, 45)
    ruins(c, 40, 1040, GY, 0)
    ground(c)
    L(c, [(540, 420), (440, 600), (640, 600)], 8, "ink", close=True, fill="marker")
    T(c, "!", 540, 585, 110, "ink", "mark")
    spores(c, 540, 700, t, 14, 400)


@v("tl_joel")
def _(c, t, lt):
    ground(c)
    k = 0.5 + 0.5 * math.sin(t * 3)
    joel(c, 420, P(a1u=100, a1l=95 + 15 * k, a2u=-100, a2l=-95 - 15 * k), f=1, front=True, face="big")
    T(c, "strong", 760, 560, 72, "orange", "mark")
    crate(c, 780, GY, "", 160, 110)


@v("tl_ellie")
def _(c, t, lt):
    ground(c)
    o = ellie(c, 500, P(a1u=30, a1l=20, a2u=-30, a2l=-20), front=True, face="big")
    hx, hy = o["head"]
    bulb(c, hx + 130, hy - 60, 0.6, t)
    # aura protectora
    pa = 120 + int(60 * math.sin(t * 3))
    c.drawOval(skia.Rect.MakeXYWH(500 - 160, 480, 320, 410), paint("green", 6, pa))
    for k in range(8):
        ph = (t * 0.5 + k / 8) % 1
        ang = k * 0.8
        r = 330 - ph * 160 if ph < 0.5 else 170 + (ph - 0.5) * 320
        C(c, 500 + math.cos(ang) * r, 680 + math.sin(ang) * r * 0.7, 9, 0, fill="fungus", fa=220)
    T(c, "smart", 860, 520, 60, "blue", "mark")


@v("tl_walk")
def _(c, t, lt):
    ruins(c, 40, 1040, GY, t * 60)
    ground(c)
    joel(c, 430, walk_pose(t * 1.1), f=1)
    ellie(c, 620, walk_pose(t * 1.1 + 0.4), f=1)


@v("tl_groups")
def _(c, t, lt):
    ground(c)
    tug = math.sin(t * 2) * 20
    crate(c, 540 + tug, GY, "FOOD", 170, 110, "orange")
    crate(c, 540 + tug, GY - 110, "GUNS", 170, 90, "soft")
    for i, x in enumerate((140, 270)):
        fig(c, x + tug, GY, P(a1u=80, a1l=-10, lean=-14, l1u=30, l1l=-20, l2u=-30), f=1, front=False, face="angry",
            eyes="angry", s=0.85)
    for i, x in enumerate((810, 940)):
        fig(c, x + tug, GY, P(a1u=80, a1l=-10, lean=-14, l1u=30, l1l=-20, l2u=-30), f=-1, front=False, face="angry",
            eyes="angry", s=0.85, hair="short")
    L(c, [(330 + tug, 720), (460 + tug, 760)], 6, "orange")
    L(c, [(620 + tug, 760), (750 + tug, 720)], 6, "orange")


@v("tl_search")
def _(c, t, lt):
    ground(c)
    o = joel(c, 300, P(lean=30, a1u=60, a1l=30, a2u=40, l1u=30, l1l=-30), f=1)
    items = [(560, can_), (720, bottle), (880, lambda c_, x, y=GY: crate(c_, x, y, "items", 140, 100, "green"))]
    for i, (x, fn) in enumerate(items):
        k = back_out((lt - 0.4 - i * 0.5) / 0.4)
        if k <= 0:
            continue
        c.save()
        c.translate(x, GY)
        c.scale(k, k)
        c.translate(-x, -GY)
        fn(c, x)
        c.restore()
    labels = [("food", 560), ("water", 720), ("items", 880)]
    for i, (w_, x) in enumerate(labels):
        if lt > 0.6 + i * 0.5:
            T(c, w_, x, 620, 44, "blue", "bold")


@v("tl_hide")
def _(c, t, lt):
    ground(c)
    wall(c, 360, GY, 200, 200)
    ellie(c, 300, P(lean=35, l1u=70, l1l=-120, l2u=60, l2l=-110, a1u=60, a1l=40), f=1, eyes="wide", face="flat")
    sh = math.sin(t * 20) * 4
    fig(c, 820 + sh, GY, P(a1u=120, a1l=30, a2u=-120, a2l=-30, lean=-6), s=1.25, sick=True, face="grr", eyes="angry",
        f=-1, front=True)
    T(c, "ROAR!", 830, 430, 64, "red", "mark")
    waves(c, 700, 560, t, -1, "red")


@v("tl_clicker")
def _(c, t, lt):
    ground(c)
    fig(c, 760, GY, mix(walk_pose(t * 0.5), P(a1u=60, a2u=40, lean=10), 0.5), s=1.05, f=-1, front=False, clicker=True)
    waves(c, 680, 520, t, -1, "orange")
    T(c, "click... click...", 720, 410, 48, "orange", "mark")
    tip = (lt * 20) % 60
    joel(c, 260 + tip, P(lean=12, a1u=40, a1l=60, l1u=25, l1l=-30, l2u=-15), f=1, face="flat", eyes="wide")
    T(c, "shh...", 260, 470, 44, "blue", "mark")


@v("tl_friends")
def _(c, t, lt):
    ground(c)
    k = ease(lt / 0.8)
    joel(c, 330 + 140 * k, P(a1u=150, a1l=0), f=1, face="big")
    ellie(c, 760 - 165 * k, P(a1u=150, a1l=0), f=-1, face="big")
    if k > 0.95:
        heart(c, 540, 470 + bob(t, 8, 3), 1.6)
        sparkle(c, 540, 380, t)


@v("tl_love")
def _(c, t, lt):
    ground(c)
    for i in range(7):
        x = 120 + i * 140
        fig(c, x, GY, cheer_pose(t + i * 0.3), s=0.6 + 0.08 * (i % 2), face="big",
            hair="pony" if i % 3 == 1 else None)
    for k in range(6):
        ph = (t * 0.3 + k / 6) % 1
        heart(c, 160 + k * 150, 760 - ph * 380, 0.9, "red", int(255 * (1 - ph)))
    T(c, "GREAT GAME!", 540, 420, 60, "fungus", "mark")
