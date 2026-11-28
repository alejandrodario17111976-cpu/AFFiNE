# Efectos + música → mezcla.wav del video de San Benito.
# Los efectos son los sonidos propios del sitio (hechos con earshot) y barridos de aire
# sintetizados para cada transición; caen en los cuadros de la línea de tiempo (linea.json).
# Master: -14 LUFS integrados, picos reales <= -1 dBTP, 48 kHz estéreo, duración exacta.
import json
import os
import subprocess
import numpy as np
from scipy import ndimage
from dsp import SR, ns, rng, pan, place, read_wav, write_wav, integrated, true_peak, bp, dbg, fades, momentary_max

AQUI = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(AQUI, "..", "src", "sanbenito", "linea.json")))
FPS = L["fps"]
DUR = L["duracion"] / FPS
N = ns(DUR)
SONIDOS = os.path.join(AQUI, "..", "public", "sanbenito", "sonidos")
E = L["escenas"]
M = L["momentos"]


def sonido(nombre):
    """decodifica el mp3 del sitio a 48 kHz estéreo"""
    crudo = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", os.path.join(SONIDOS, f"{nombre}.mp3"), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(crudo, "<f4").reshape(-1, 2).T.astype(np.float64)


def barrido(r, dur=0.75):
    """aire que pasa: ruido filtrado cuyo centro sube, con envolvente suave"""
    n = ns(dur)
    t = np.arange(n) / SR
    ruido = r.standard_normal(n)
    partes = []
    for k, (lo, hi) in enumerate([(300, 900), (700, 2000), (1500, 4500), (3000, 9000)]):
        peso = np.exp(-((t / dur - (0.2 + 0.2 * k)) ** 2) / 0.03)
        partes.append(bp(ruido, lo, hi, 1) * peso)
    y = sum(partes) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    lado = np.linspace(-0.6, 0.6, n)
    return np.stack([y * np.cos((lado + 1) * np.pi / 4), y * np.sin((lado + 1) * np.pi / 4)]) * 0.5


def t(cuadro):
    return cuadro / FPS


def efectos():
    r = rng(28)
    buf = np.zeros((2, N))
    s = {n: sonido(n) for n in ["agregar", "quitar", "ticket-abrir", "impresion", "pedido", "listo", "menu", "pestana", "mas", "nuevo", "registro", "vista"]}
    eventos = []  # (cuadro, sonido, ganancia dB)
    # barridos de luz entre escenas
    for clave in list(E)[1:]:
        eventos.append((E[clave]["desde"] - 12, "barrido", -16))
    # apertura: el filete se dibuja
    eventos.append((M["apertura"]["filete"], "pestana", -12))
    # catálogo: cada pasillo
    for k in range(6):
        eventos.append((E["catalogo"]["desde"] + M["catalogo"]["pasillo0"] + k * M["catalogo"]["cadaPasillo"], "pestana", -10))
    # buscar: toque, vuelo y el contador del ticket
    for toque in M["buscar"]["toques"]:
        c = E["buscar"]["desde"] + toque
        eventos += [(c - 1, "menu", -12), (c + 2, "agregar", -8), (c + M["buscar"]["vuelo"], "vista", -12)]
    # ticket: se abre, imprime y marca el total
    c0 = E["ticket"]["desde"]
    eventos.append((c0 + 4, "ticket-abrir", -10))
    for k in range(4):
        eventos.append((c0 + M["ticket"]["imprime"] + k * 30, "impresion", -6))
    eventos.append((c0 + M["ticket"]["total"], "registro", -10))
    # envío: toque, pedido enviado y la campanita de "listo"
    c0 = E["envio"]["desde"]
    eventos += [(c0 + M["envio"]["toque"] - 1, "menu", -11), (c0 + M["envio"]["enviado"], "pedido", -5), (c0 + M["envio"]["listo"] + 4, "listo", -7)]
    # ofertas: afiches y etiquetas
    c0 = E["ofertas"]["desde"]
    eventos.append((c0 + M["ofertas"]["afiches"], "mas", -9))
    for e in M["ofertas"]["etiquetas"]:
        eventos.append((c0 + e, "agregar", -11))
    # negocio: llega un pedido, "¡Pedido Listo!" y los precios
    c0 = E["negocio"]["desde"]
    eventos += [(c0 + 18, "nuevo", -11), (c0 + M["negocio"]["toque"] - 1, "menu", -11), (c0 + M["negocio"]["precios"], "vista", -12)]
    # ubicación: caen los pines
    for p in M["ubicacion"]["pines"]:
        eventos.append((E["ubicacion"]["desde"] + p + 12, "pestana", -5))

    for cuadro, nombre, db in eventos:
        x = barrido(r) if nombre == "barrido" else s[nombre]
        place(buf, x, t(cuadro), dbg(db))
    return buf, eventos


def limitar(x, techo_db=-1.3):
    """limitador con anticipación (5 ms) y liberación suave"""
    techo = dbg(techo_db)
    pico = np.max(np.abs(x), axis=0)
    adelanto = ns(0.005)
    pico = ndimage.maximum_filter1d(pico, size=adelanto * 2 + 1)
    g = np.minimum(1.0, techo / np.maximum(pico, 1e-9))
    alfa = np.exp(-1 / (0.08 * SR))
    for i in range(1, len(g)):  # liberación
        g[i] = min(g[i], 1 - (1 - g[i - 1]) * alfa) if g[i] > g[i - 1] else g[i]
    return x * g[None, :]


if __name__ == "__main__":
    musica, sr = read_wav(os.path.join(AQUI, "musica.wav"))
    musica = musica[:, :N]
    musica = np.pad(musica, ((0, 0), (0, N - musica.shape[1])))
    sfx, eventos = efectos()
    # música a -17 LUFS, efectos por encima pero sin tapar
    musica *= dbg(-17.0 - integrated(musica))
    sfx *= dbg(-17.5 - integrated(sfx))
    mezcla = musica + sfx
    mezcla *= dbg(-14.0 - integrated(mezcla))
    mezcla = limitar(mezcla)
    for _ in range(3):
        tp = true_peak(mezcla)
        if tp <= -1.0:
            break
        mezcla = limitar(mezcla, -1.3 - (tp + 1.0) - 0.2)
    mezcla = fades(mezcla, 0.005, 0.3)
    destino = os.path.join(AQUI, "..", "public", "sanbenito", "audio")
    os.makedirs(destino, exist_ok=True)
    write_wav(os.path.join(destino, "mezcla.wav"), mezcla, bits=16)
    write_wav(os.path.join(AQUI, "efectos.wav"), sfx)
    print(f"mezcla.wav {mezcla.shape[1] / SR:.3f} s, {integrated(mezcla):.1f} LUFS, pico real {true_peak(mezcla):.2f} dBTP, {len(eventos)} efectos")
