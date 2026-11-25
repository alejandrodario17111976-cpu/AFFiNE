# -*- coding: utf-8 -*-
"""Genera la voz (Kokoro) para cada linea del guion y arma la linea de tiempo."""
import hashlib, json, os, re, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import script  # noqa: E402

SR = 24000
FPS = 30
CACHE = os.path.join(ROOT, "tts_cache")
OUT = os.path.join(ROOT, "build")
os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

ES_VOICE, ES_SPEED = "ef_dora", 1.06
EN_VOICE, EN_SPEED = "af_heart", 0.9

_k = None


def kok():
    global _k
    if _k is None:
        _k = Kokoro(os.path.join(ROOT, "models/kokoro-v1.0.onnx"), os.path.join(ROOT, "models/voices-v1.0.bin"))
    return _k


def spanish_phonemes(text):
    """Texto en espanol con {ingles} -> cadena de fonemas mezclada."""
    k = kok()
    parts = re.split(r"(\{[^}]*\})", text)
    out = []
    for p in parts:
        if not p:
            continue
        if p.startswith("{"):
            ph = k.tokenizer.phonemize(p[1:-1], "en-us")
        else:
            if not p.strip(" "):
                continue
            ph = k.tokenizer.phonemize(p, "es-419")
            if not re.search(r"\w", p):  # solo puntuacion
                ph = p.strip()
        if ph:
            out.append(ph.strip())
    s = " ".join(out)
    s = re.sub(r"\s+([,.;:?!])", r"\1", s)
    return s


def trim(a, thr=0.012, pad=0.04):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a[:0]
    p = int(pad * SR)
    return a[max(0, idx[0] - p): min(len(a), idx[-1] + p)]


def synth(line):
    if line.startswith("pause:"):
        return np.zeros(int(float(line[6:]) * SR), np.float32), "pause"
    lang = "en" if line.startswith("en:") else "es"
    text = line[3:] if lang == "en" else line
    key = hashlib.sha1((lang + "|" + text + "|v3").encode()).hexdigest()[:16]
    path = os.path.join(CACHE, key + ".wav")
    if os.path.exists(path):
        a, _ = sf.read(path, dtype="float32")
        return a, lang
    k = kok()
    if lang == "en":
        a, sr = k.create(text, voice=EN_VOICE, speed=EN_SPEED, lang="en-us")
    else:
        ph = spanish_phonemes(text)
        a, sr = k.create(ph, voice=ES_VOICE, speed=ES_SPEED, lang="es-419", is_phonemes=True)
    assert sr == SR
    a = trim(a.astype(np.float32))
    sf.write(path, a, SR)
    return a, lang


def build():
    timeline = []
    for si, sc in enumerate(script.SCENES):
        lead = 1.3 if sc.get("big_title") else 0.85
        segs = []  # (start_sample, array)
        t = lead
        beats = []
        nb = len(sc["beats"])
        for bi, b in enumerate(sc["beats"]):
            bstart = t
            lines = []
            say = b["say"]
            for li, line in enumerate(say):
                a, lang = synth(line)
                start = t
                segs.append((int(round(start * SR)), a))
                dur = len(a) / SR
                disp = line[3:] if lang == "en" else ("" if lang == "pause" else line)
                lines.append(dict(start=round(start, 3), dur=round(dur, 3), lang=lang, text=disp))
                t += dur
                if li < len(say) - 1:
                    if sc.get("vocab"):
                        t += 0.16
                    elif sc.get("full_text"):
                        t += 0.12
                    else:
                        t += 0.22 if lang == "en" else 0.3
            if sc.get("full_text") and bi > 0:
                t += 0.14
            elif sc.get("vocab") and bi > 0:
                t += 0.38
            else:
                t += 0.5
            beats.append(dict(start=round(bstart, 3), end=round(t, 3), v=b["v"], r=b["r"], lines=lines))
        t += 0.5
        nframes = int(np.ceil(t * FPS))
        total = nframes / FPS
        audio = np.zeros(int(round(total * SR)) + 1, np.float32)
        for s0, a in segs:
            e = min(len(audio), s0 + len(a))
            audio[s0:e] += a[: e - s0]
        audio = audio[: int(round(total * SR))]
        # envolvente por cuadro (para mover la boca)
        hop = SR // FPS
        env = [float(np.sqrt(np.mean(audio[i * hop:(i + 1) * hop] ** 2))) if (i + 1) * hop <= len(audio) else 0.0
               for i in range(nframes)]
        sf.write(os.path.join(OUT, "scene_%02d.wav" % si), audio, SR)
        timeline.append(dict(idx=si, id=sc["id"], dur=total, frames=nframes, beats=beats,
                             env=[round(e, 4) for e in env]))
        print("scene %02d %-10s %6.1fs" % (si, sc["id"], total), flush=True)
    with open(os.path.join(OUT, "timeline.json"), "w") as f:
        json.dump(timeline, f)
    print("TOTAL %.1f min" % (sum(s["dur"] for s in timeline) / 60))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        for line in sys.argv[2:]:
            if not line.startswith("en:"):
                print(spanish_phonemes(line))
            a, lang = synth(line)
            print(lang, len(a) / SR)
    else:
        build()
