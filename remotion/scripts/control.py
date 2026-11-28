# Control de calidad cuadro por cuadro de un video renderizado (adaptado de short_qa.py del skill
# cartoon-3d-short, licencia MIT): especificaciones, sonoridad, silencios, cuadros negros / blancos /
# congelados / saltos bruscos (sin contar el fundido de entrada y salida) y una hoja de contactos
# cada 15 cuadros para revisar.
# Uso: python scripts/control.py <video.mp4> <carpeta>
import json
import os
import subprocess
import sys
import numpy as np
from PIL import Image, ImageDraw

vid, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
R = []
pr = json.loads(run("ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration", "-of", "json", vid).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video")
au = [s for s in pr["streams"] if s["codec_type"] == "audio"]
R.append(f"VIDEO {v['codec_name']} {v['width']}x{v['height']} {v['r_frame_rate']} fps, {v.get('nb_frames')} cuadros, {float(pr['format']['duration']):.3f} s")
R.append("AUDIO " + (", ".join(f"{s['codec_name']} {s['sample_rate']} Hz {s['channels']} canales" for s in au) if au else "NINGUNO"))
if au:
    e = run("ffmpeg", "-i", vid, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-").stderr
    tail = e[e.rfind("Summary:"):]
    R.append("SONORIDAD " + " | ".join(l.strip() for l in tail.splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))))
    e = run("ffmpeg", "-i", vid, "-map", "0:a:0", "-af", "silencedetect=n=-45dB:d=0.4", "-f", "null", "-").stderr
    R.append("SILENCIOS " + ("; ".join(l.split("] ")[-1] for l in e.splitlines() if "silence_" in l) or "ninguno"))

vert = int(v["height"]) > int(v["width"])
W, H = (180, 320) if vert else (320, 180)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", vid, "-vf", f"scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
n = len(F)
luma = (F.astype(np.float32) / 255) @ np.array([0.2126, 0.7152, 0.0722], np.float32)
media = luma.reshape(n, -1).mean(1)
diff = np.abs(np.diff(F.astype(np.int16), axis=0)).mean(axis=(1, 2, 3))
med = np.array([np.median(diff[max(0, i - 8):i + 9]) for i in range(len(diff))])
previstos = set(range(0, 14)) | set(range(n - 22, n))  # fundido de entrada y de salida
saltos = [i + 1 for i in range(len(diff)) if diff[i] > 3 * med[i] + 1.0 and (i + 1) not in previstos]
negros = [i for i in range(n) if media[i] < 0.04 and i not in previstos]
blancos = [i for i in range(n) if media[i] > 0.93]
congelados, ini = [], None
for i in range(len(diff)):
    if diff[i] < 0.02:
        ini = i if ini is None else ini
    else:
        if ini is not None and i - ini >= 12:
            congelados.append((ini, i))
        ini = None
R.append(f"CUADROS {n}; negros fuera de los fundidos {negros[:20]}; blancos {blancos[:20]}; congelados >=12 {congelados[:20]}")
R.append(f"SALTOS BRUSCOS (>3x la mediana local): {saltos[:40]}")
R.append(f"MOVIMIENTO diferencia media {diff.mean():.2f}; cuadros casi quietos (<0.3): {int((diff < 0.3).sum())} ({(diff < 0.3).mean() * 100:.0f}%)")

# hoja de contactos: un cuadro cada 15
paso = 15
idx = list(range(0, n, paso))
cols = 13 if not vert else 20
cw, ch = (W, H)
filas = (len(idx) + cols - 1) // cols
S = Image.new("RGB", (cw * cols, ch * filas), "black")
d = ImageDraw.Draw(S)
for j, k in enumerate(idx):
    x, y = (j % cols) * cw, (j // cols) * ch
    S.paste(Image.fromarray(F[k]), (x, y))
    d.rectangle([x, y, x + 30, y + 11], fill="black")
    d.text((x + 2, y), str(k), fill="yellow")
S.save(os.path.join(out, "hoja.jpg"), quality=82)
open(os.path.join(out, "informe.md"), "w", encoding="utf-8").write("\n".join(R) + "\n")
print("\n".join(R))
