# Video: Guía de estudio de inglés + The Last of Us (estilo muñecos de palitos)

Video vertical (1080x1920, 30 fps, formato Short ampliado) que explica paso a paso la
"Guía de estudio – Inglés" y termina con el texto en inglés sobre el juego *The Last of Us*.

- Narración en español (voz Kokoro `ef_dora`); las palabras en inglés se pronuncian en inglés.
- Ejemplos en inglés con voz nativa (`af_heart`).
- Dibujos de muñecos de palitos animados, pizarrón con revelado paso a paso y subtítulos.

## Contenido

1. Vocabulary (8 grupos de palabras)
2. Grammar (temas A–V)
3. Resumen rápido para memorizar
4. Diferencias que tenés que saber
5. Práctica (10 preguntas con respuestas)
6. Cómo estudiar esta guía
7. Texto final: *The Last of Us* (frase por frase con traducción y luego completo)

## Cómo regenerarlo

```bash
pip install kokoro-onnx soundfile skia-python numpy pillow
# modelos de voz (GitHub releases de kokoro-onnx)
mkdir -p models
curl -L -o models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o models/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

python3 src/tts.py            # voz + línea de tiempo  -> build/
python3 src/render.py all 4   # escenas de video        -> build/scene_XX.mp4
python3 src/mix.py            # música + efectos + voz  -> build/final_audio.wav
python3 src/mix.py mux guia_ingles_the_last_of_us.mp4
```

El guion completo está en `src/script.py`.
Fuentes: Patrick Hand, Kalam (OFL) y Permanent Marker (Apache 2.0), de Google Fonts.

## Versión 2: estilo "reel 3D" (`src_v2/`)

Mismo guion y contenido, con otro estilo visual y otra voz:

- Personaje original de dibujo animado con volumen (sombreado), estudio gris, colchoneta turquesa.
- Etiqueta naranja con el tema, insignia blanca con la sección y subtítulos palabra por palabra arriba.
- Voz masculina en español (Kokoro `em_alex`), también para los ejemplos en inglés.
- Fuente Nunito (OFL).

```bash
python3 src_v2/tts.py && python3 src_v2/render.py all 4 && python3 src_v2/mix.py
python3 src_v2/mix.py mux guia_ingles_estilo_3d.mp4
```

## Versión 3 (`src_v3/`)

Igual que la versión 2, con estos cambios:

- 68 ejemplos extra ("Más ejemplos") al final de cada tema de gramática (A–V).
- Las palabras en inglés dentro de las frases se dicen más lento (velocidad 0.8).
- Las oraciones completas en inglés usan una voz nativa masculina (Kokoro `am_fenrir`, velocidad 0.84);
  la narración en español va a velocidad normal (`em_alex`, 1.0).

```bash
python3 src_v3/tts.py && python3 src_v3/render.py all 4 && python3 src_v3/mix.py
python3 src_v3/mix.py mux guia_ingles_v3.mp4
```

## Versión 4: horizontal (`src_v4/`)

Mismo contenido y audio que la versión 3, en formato horizontal 1920x1080 a 60 fps:

- Escena a la izquierda sobre la colchoneta, pizarrón en un panel a la derecha y subtítulos debajo de la escena.
- Transiciones deslizantes entre escenas, zoom suave de cámara, respiración y parpadeo de los personajes,
  tarjetas que entran con efecto resorte.

```bash
# requiere build3/ generado por src_v3 (audio y línea de tiempo)
python3 src_v4/render.py all 4
python3 src_v4/render.py mux guia_ingles_horizontal.mp4
```
