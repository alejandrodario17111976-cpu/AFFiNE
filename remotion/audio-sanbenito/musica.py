# Música original del video de San Benito: elegante y cálida, 90 bpm, Re mayor.
# Un compás = 8/3 s = 80 cuadros del video: los acordes cambian en los cortes de escena.
# Instrumentos sintetizados (dsp.py / instruments.py, del skill cartoon-3d-short, licencia MIT).
# Escribe musica.wav (48 kHz, estéreo) con la duración exacta del video.
import json
import os
import numpy as np
from dsp import SR, ns, rng, pan, place, fades, make_ir, convolve_st, lp, hp, bp, dbg, write_wav, shelf, peq
import instruments as I

AQUI = os.path.dirname(os.path.abspath(__file__))
LINEA = json.load(open(os.path.join(AQUI, "..", "src", "sanbenito", "linea.json")))
FPS = LINEA["fps"]
DUR = LINEA["duracion"] / FPS          # 65 s
BPM = 90.0
NEGRA = 60.0 / BPM                     # 0.6667 s
COMPAS = 4 * NEGRA                     # 2.6667 s
F = I.m2f
N = ns(DUR + 0.1)


def t_de(compas, tiempo=0.0):
    """compás 1-indexado, tiempo en negras desde el inicio del compás"""
    return (compas - 1) * COMPAS + tiempo * NEGRA


# ---- armonía: voicings (pad), bajo y arpegio por acorde
AC = {
    "D": dict(pad=[54, 57, 61, 64], bajo=38, arp=[62, 66, 69, 73, 76]),
    "Bm": dict(pad=[50, 54, 57, 64], bajo=35, arp=[59, 62, 66, 69, 73]),
    "G": dict(pad=[54, 57, 59, 62], bajo=31, arp=[55, 59, 62, 66, 69]),
    "A": dict(pad=[55, 59, 62, 66], bajo=33, arp=[57, 62, 64, 67, 71]),
    "F#m": dict(pad=[52, 57, 61, 64], bajo=42 - 12, arp=[57, 61, 64, 66, 69]),
    "Em": dict(pad=[54, 55, 59, 62], bajo=40 - 12, arp=[55, 59, 62, 66, 67]),
}
ACORDES = ["D", "Bm", "G", "A", "D", "Bm", "G", "A", "G", "F#m", "Em", "A",
           "D", "Bm", "G", "A", "G", "F#m", "Em", "A", "G", "D", "G", "D"]

# ---- secciones (compases 1-indexados) y qué toca cada capa
def en(c, a, b):
    return a <= c <= b

melodia = []  # (compás, tiempo, duración en negras, midi)
FRASE_A = [(0, 0, 1.5, 78), (0, 1.5, .5, 76), (0, 2, 1, 74), (0, 3, 1, 73),
           (1, 0, 2, 71), (1, 2.5, .5, 73), (1, 3, 1, 74),
           (2, 0, 1.5, 76), (2, 1.5, .5, 74), (2, 2, 2, 71),
           (3, 0, 1, 69), (3, 1, 1, 71), (3, 2, 2, 73)]
FRASE_B = [(0, 0, 1.5, 74), (0, 1.5, .5, 73), (0, 2, 2, 71),
           (1, 0, 1, 69), (1, 1, 1, 73), (1, 2, 2, 76),
           (2, 0, 1.5, 78), (2, 1.5, .5, 76), (2, 2, 1, 74), (2, 3, 1, 71),
           (3, 0, 2, 73), (3, 2, 1, 76), (3, 3, 1, 78)]
FINAL = [(0, 0, 1.5, 78), (0, 1.5, .5, 76), (0, 2, 2, 74),
         (1, 0, 1, 71), (1, 1, 1, 74), (1, 2, 2, 76),
         (2, 0, 4, 74)]
for inicio, frase in [(5, FRASE_A), (9, FRASE_B), (13, FRASE_A), (17, FRASE_B), (22, FINAL)]:
    for (c, b, d, m) in frase:
        melodia.append((inicio + c, b, d, m))


def render():
    r = rng(20261128)
    seco = np.zeros((2, N))      # capas sin reverb
    envio = np.zeros((2, N))     # capas que van a la reverb

    # Pad cálido, un acorde por compás, con ataque lento (más presente en apertura y cierre)
    for i, a in enumerate(ACORDES):
        c = i + 1
        vel = 0.4 if en(c, 1, 2) or c >= 22 else (0.17 if en(c, 18, 21) else 0.2)
        dur = COMPAS * (2.2 if c == 24 else 1.0)
        p = I.pad([F(m) for m in AC[a]["pad"]], dur, vel, r, att=0.9 if c in (1, 22) else 0.35, rel=1.6 if c == 24 else 0.7, warm=1700)
        place(envio, p, t_de(c), 0.55)
        place(seco, p, t_de(c), 0.45)

    # Bajo: nota larga y redonda en la raíz (desde el compás 3), pedal suave en la ubicación
    for i, a in enumerate(ACORDES):
        c = i + 1
        if c < 3:
            continue
        f = F(AC[a]["bajo"] + 12)
        largo = COMPAS * (2.0 if c == 24 else 0.95)
        n = ns(largo)
        t = np.arange(n) / SR
        b = (np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)) * (1 - np.exp(-t / 0.02)) * np.exp(-t / (1.6 if c < 24 else 2.4))
        place(seco, pan(fades(b, 0.005, 0.2) * 0.32, 0), t_de(c))
        if en(c, 5, 17) or c in (22, 23):  # segundo golpe en el tiempo 3
            place(seco, pan(fades(b[: ns(COMPAS * 0.45)], 0.005, 0.1) * 0.22, 0), t_de(c, 2.5))

    # Arpa pulsada en corcheas (desde el compás 3)
    patron = [0, 2, 1, 3, 2, 4, 3, 1]
    for i, a in enumerate(ACORDES):
        c = i + 1
        if c < 3 or c == 24:
            continue
        tonos = AC[a]["arp"]
        vel_base = 0.27 if en(c, 18, 21) else 0.42
        for k, idx in enumerate(patron):
            if en(c, 20, 21) and k % 2:      # en la ubicación, la mitad de las notas
                continue
            m = tonos[idx] + (12 if en(c, 16, 17) and k % 2 == 0 else 0)
            v = vel_base * (1.0 if k % 2 == 0 else 0.78) * (0.9 + 0.2 * r.random())
            s = I.pluck(F(m), v, r, dur=1.2, bright=0.65, pos=0.14)
            place(envio, pan(s, -0.35 + 0.7 * (idx / 4)), t_de(c, k * 0.5), 0.55)
            place(seco, pan(s, -0.35 + 0.7 * (idx / 4)), t_de(c, k * 0.5), 0.35)

    # Melodía en vibráfono
    for (c, b, d, m) in melodia:
        v = I.vibes(F(m), 0.5, r, dur=max(1.2, d * NEGRA + 0.8), trem=4.8, trem_depth=0.18)
        place(envio, pan(v, 0.15), t_de(c, b), 0.9)
        place(seco, pan(v, 0.15), t_de(c, b), 0.55)

    # Brillos de glockenspiel: apertura del nombre, "pedido listo", logo final
    for seg, notas in [(18 / FPS, [86, 90, 93]), ((960 + 138) / FPS, [86, 93]), ((1680 + 10) / FPS, [86, 90, 93, 98]), ((1680 + 200) / FPS, [93, 98])]:
        for k, m in enumerate(notas):
            g = I.glock(F(m), 0.4, r, dur=2.4)
            place(envio, pan(g, -0.3 + 0.2 * k), seg + k * 0.09, 0.6)
            place(seco, pan(g, -0.3 + 0.2 * k), seg + k * 0.09, 0.25)

    # Ritmo: latido suave (bombo de seno), escobillas en 2 y 4, shaker en semicorcheas
    def bombo(vel):
        n = ns(0.45)
        t = np.arange(n) / SR
        f = 48 + 40 * np.exp(-t / 0.03)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) * (1 - np.exp(-t / 0.002))
        return y * vel

    for c in range(1, 25):
        lleno = en(c, 5, 9) or en(c, 13, 17) or c in (22, 23)
        if lleno or en(c, 10, 12):
            for b in ([0, 2] if lleno else [0]):
                place(seco, pan(bombo(0.42), 0), t_de(c, b))
        if en(c, 3, 19) or c in (22, 23):
            for b in (1, 3):
                place(envio, pan(I.brush(0.5, r, 0.3), 0.2), t_de(c, b), 0.3)
                place(seco, pan(I.brush(0.5, r, 0.3), 0.2), t_de(c, b), 0.55)
        if en(c, 4, 21) or c in (22, 23):
            for k in range(16):
                v = (0.26 if k % 4 == 2 else 0.15) * (0.7 if en(c, 20, 21) else 1.0)
                sh = hp(I.brush(v, r, 0.09), 5000)
                place(seco, pan(sh, 0.45), t_de(c, k * 0.25))

    # Platillo al revés que sube hacia el cierre (último tiempo de la ubicación)
    n = ns(COMPAS * 0.75)
    t = np.arange(n) / SR
    swell = bp(r.standard_normal(n), 3000, 12000, 1) * (t / t[-1]) ** 3 * 0.25
    place(envio, pan(swell, 0), t_de(22) - COMPAS * 0.75, 0.6)
    place(seco, pan(swell, 0), t_de(22) - COMPAS * 0.75, 0.5)

    sala = make_ir(2.6, 7, hf=1.3, early=[(0.013, 0.5, -0.6), (0.021, 0.4, 0.5), (0.034, 0.3, -0.2)])
    humedo = convolve_st(envio, sala)
    mezcla = seco + 0.62 * humedo
    mezcla = lp(hp(mezcla, 38, 2), 17000, 2)
    # menos barro en los medios graves y más aire arriba
    mezcla = peq(mezcla, 220, -3.0, 0.9)
    mezcla = shelf(mezcla, 2500, 7.0, "high")
    mezcla = shelf(mezcla, 9000, 3.0, "high")
    # final: se apaga junto con la imagen
    fin = np.ones(N)
    a = ns(DUR - 1.2)
    fin[a:] = np.linspace(1, 0, N - a) ** 1.6
    mezcla *= fin[None, :]
    return mezcla[:, : ns(DUR)]


if __name__ == "__main__":
    m = render()
    m /= np.max(np.abs(m)) / 0.8
    write_wav(os.path.join(AQUI, "musica.wav"), m)
    print("musica.wav", m.shape[1] / SR, "s")
