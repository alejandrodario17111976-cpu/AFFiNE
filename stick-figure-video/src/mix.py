# -*- coding: utf-8 -*-
"""Mezcla voz + musica suave sintetizada + efectos, y une el video final."""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.dirname(HERE)
BUILD = os.path.join(ROOT, "build")
SR = 24000
rng = np.random.default_rng(11)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


_pl = {}


def pluck(m, dur=1.6, bright=0.5):
    key = (m, dur, bright)
    if key in _pl:
        return _pl[key]
    f = midi(m)
    N = int(SR / f)
    n = int(dur * SR)
    y = np.zeros(n + N + 2, np.float32)
    burst = rng.uniform(-1, 1, N).astype(np.float32)
    # suavizar el ataque (menos brillo)
    for _ in range(int(3 * (1 - bright)) + 1):
        burst = 0.5 * (burst + np.roll(burst, 1))
    y[:N] = burst
    y[N] = burst[0] * 0.996
    pos = N + 1
    decay = 0.996
    while pos < len(y):
        end = min(len(y), pos + N)
        seg = 0.5 * (y[pos - N:end - N] + y[pos - N - 1:end - N - 1]) * decay
        y[pos:end] = seg
        pos = end
    y = y[:n]
    env = np.minimum(1, np.linspace(0, n / SR, n) / 0.004)
    y = y * env * np.exp(-np.linspace(0, dur, n) * 1.6)
    _pl[key] = y / (np.max(np.abs(y)) + 1e-9)
    return _pl[key]


def sine_note(m, dur, att=0.02, rel_k=3.0):
    t = np.arange(int(dur * SR)) / SR
    y = np.sin(2 * np.pi * midi(m) * t) + 0.25 * np.sin(4 * np.pi * midi(m) * t)
    env = np.minimum(1, t / att) * np.exp(-t * rel_k)
    return (y * env).astype(np.float32)


def pad(chord, dur):
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    for m in chord:
        for det in (-0.08, 0.08):
            y += np.sin(2 * np.pi * midi(m + det) * t)
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.2)
    return (y * env / (2 * len(chord))).astype(np.float32)


def add(buf, start, y, g=1.0):
    s = int(start * SR)
    if s >= len(buf) or s + len(y) <= 0:
        return
    if s < 0:
        y = y[-s:]
        s = 0
    e = min(len(buf), s + len(y))
    buf[s:e] += y[: e - s] * g


LIGHT = [(60, [60, 64, 67]), (55, [55, 59, 62]), (57, [57, 60, 64]), (53, [53, 57, 60])]  # C G Am F
DARK = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (55, [55, 59, 62])]   # Am F C G


def music_light(dur):
    buf = np.zeros(int(dur * SR) + SR, np.float32)
    beat = 60 / 92
    bar = 4 * beat
    t, i = 0.0, 0
    pattern = [0, 1, 2, 1, 3, 1, 2, 1]
    while t < dur:
        root, ch = LIGHT[i % 4]
        notes = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24]
        for k, p in enumerate(pattern):
            add(buf, t + k * beat / 2, pluck(notes[p], 1.4, 0.3), 0.55 if k % 2 == 0 else 0.4)
        add(buf, t, sine_note(root - 12, bar, 0.01, 1.2), 0.5)
        add(buf, t + 2 * beat, sine_note(root - 12, bar / 2, 0.01, 2.0), 0.35)
        t += bar
        i += 1
    return buf[: int(dur * SR)]


def music_dark(dur):
    buf = np.zeros(int(dur * SR) + 4 * SR, np.float32)
    beat = 60 / 68
    bar = 4 * beat
    t, i = 0.0, 0
    while t < dur:
        root, ch = DARK[i % 4]
        add(buf, t, pad([m - 12 for m in ch], bar + 1.0), 0.9)
        for k in range(4):
            m = ch[(k * 2) % 3] + 12
            add(buf, t + k * beat, pluck(m, 2.4, 0.2), 0.45)
        add(buf, t, sine_note(root - 24, bar, 0.05, 0.6), 0.7)
        t += bar
        i += 1
    return buf[: int(dur * SR)]


def sfx_pop():
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t * 18) + 380
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 45)).astype(np.float32)


def sfx_whoosh():
    n = int(0.45 * SR)
    x = rng.normal(0, 1, n).astype(np.float32)
    k = 24
    x = np.convolve(x, np.ones(k) / k, mode="same")
    t = np.arange(n) / n
    env = np.sin(np.pi * t) ** 2
    return (x * env * 3).astype(np.float32)


def sfx_tick():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 160)).astype(np.float32)


def sfx_ding():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1975.5 * t)
    return (y * np.exp(-t * 5) * np.minimum(1, t / 0.003)).astype(np.float32)


def sfx_ring():
    n = int(1.3 * SR)
    t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * (np.sin(2 * np.pi * 20 * t) > 0)
    gate = ((t % 0.65) < 0.45).astype(np.float32)
    return (y * gate * 0.5).astype(np.float32)


def sfx_clicks():
    n = int(1.2 * SR)
    y = np.zeros(n, np.float32)
    for k in range(9):
        s = int((k * 0.11 + (0.25 if k > 4 else 0)) * SR)
        m = int(0.012 * SR)
        y[s:s + m] += (rng.normal(0, 1, m) * np.exp(-np.arange(m) / (m / 5))).astype(np.float32)
    return y


def main():
    import script
    from render import SceneR
    tl = json.load(open(os.path.join(BUILD, "timeline.json")))
    total = sum(s["dur"] for s in tl)
    voice = np.concatenate([sf.read(os.path.join(BUILD, "scene_%02d.wav" % i), dtype="float32")[0]
                            for i in range(len(tl))])
    n = len(voice)
    sfx = np.zeros(n, np.float32)
    # musica por tramos
    offs = np.cumsum([0] + [s["dur"] for s in tl])
    dark_idx = [i for i, sc in enumerate(script.SCENES) if sc.get("dark")]
    d0, d1 = offs[dark_idx[0]], offs[dark_idx[-1] + 1]
    light = music_light(total)
    dark = music_dark(d1 - d0 + 2)
    mus = light.copy()
    xf = int(1.5 * SR)
    a, b = int(d0 * SR), int(d1 * SR)
    w = np.ones(n, np.float32)
    w[a - xf:a] = np.linspace(1, 0, xf)
    w[a:b] = 0
    w[b:b + xf] = np.linspace(0, 1, xf)
    mus = mus[:n] * w[:len(mus[:n])]
    dk = np.zeros(n, np.float32)
    add(dk, d0 - 1.5, dark, 1.0)
    wd = np.zeros(n, np.float32)
    wd[a - xf:a] = np.linspace(0, 1, xf)
    wd[a:b] = 1
    wd[b:b + xf] = np.linspace(1, 0, xf)
    mus = mus * 0.055 + dk * wd * 0.07
    # ducking bajo la voz
    env = np.abs(voice)
    k = int(0.25 * SR)
    env = np.convolve(env, np.ones(k) / k, mode="same")
    duck = 1 - 0.55 * np.minimum(1, env / 0.03)
    mus *= duck
    # efectos
    pop, wh, tick, ding, ring, clicks = sfx_pop(), sfx_whoosh(), sfx_tick(), sfx_ding(), sfx_ring(), sfx_clicks()
    for i, (sc, s) in enumerate(zip(script.SCENES, tl)):
        t0 = offs[i]
        add(sfx, t0 + 0.05, wh, 0.05)
        r = SceneR(sc, s, t0, total)
        for rt in r.reveal:
            if rt is not None:
                add(sfx, t0 + rt, pop, 0.07)
        for (vt, key) in r.vkeys:
            if key == "countdown":
                for kk in range(3):
                    add(sfx, t0 + vt + kk * 1.05, tick, 0.18)
            if key == "phone_rang":
                add(sfx, t0 + vt + 1.0, ring, 0.05)
            if key == "tl_clicker":
                add(sfx, t0 + vt + 0.2, clicks, 0.06)
                add(sfx, t0 + vt + 2.6, clicks, 0.05)
        if sc.get("quiz"):
            b2 = s["beats"][2]
            if len(b2["lines"]) > 1:
                add(sfx, t0 + b2["lines"][1]["start"], ding, 0.09)
    mix = voice * 1.0 + mus + sfx
    peak = np.max(np.abs(mix))
    mix = mix / max(1.0, peak / 0.95)
    sf.write(os.path.join(BUILD, "final_audio.wav"), mix, SR)
    print("audio ok %.1fs peak %.2f" % (len(mix) / SR, peak))


def mux(out):
    tl = json.load(open(os.path.join(BUILD, "timeline.json")))
    lst = os.path.join(BUILD, "list.txt")
    with open(lst, "w") as f:
        for i in range(len(tl)):
            f.write("file '%s'\n" % os.path.join(BUILD, "scene_%02d.mp4" % i))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-i", os.path.join(BUILD, "final_audio.wav"), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
                    "-shortest",
                    "-movflags", "+faststart", out], check=True)
    print("video ok", out)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "mux":
        mux(sys.argv[2])
    else:
        main()
