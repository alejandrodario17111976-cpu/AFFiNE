# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i --loglevel=error
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

## Video de presentación de San Benito

Dos versiones con la misma estética del sitio (lapislázuli, oro, carmesí y marfil): `SanBenitoHorizontal` (1920×1080) y `SanBenitoVertical` (1080×1920), 65 s a 30 fps.

- Escenas en `src/sanbenito/`: apertura, mostrador 3D (los mismos sólidos del sitio, con three.js), catálogo, buscar y agregar, ticket, envío y aviso de "listo", ofertas, el panel AGL, ubicación y cierre.
- La línea de tiempo (`src/sanbenito/linea.json`) la comparten la imagen y el sonido: un compás de la música (90 bpm) son 80 cuadros, y los cortes caen en los tiempos fuertes.
- Música original sintetizada (`audio-sanbenito/musica.py`) y efectos del sitio (`audio-sanbenito/mezcla.py`), mezcla a -14 LUFS.

```bash
bash scripts/preparar-recursos.sh      # copia fotos, sonidos y fuentes del sitio y arma el audio
npx remotion render src/index.ts SanBenitoHorizontal out/sanbenito/SanBenitoHorizontal.mp4 --props='{"conAudio":true}' --codec=h264 --crf=17 --gl=swangle
npx remotion render src/index.ts SanBenitoVertical out/sanbenito/SanBenitoVertical.mp4 --props='{"conAudio":true}' --codec=h264 --crf=17 --gl=swangle
python3 scripts/control.py out/sanbenito/SanBenitoVertical.mp4 out/sanbenito/control-v   # control de calidad
```

Para sumar teléfono, WhatsApp o redes al cierre, agregalos en `Cierre` (`src/sanbenito/escenas/Escenas.tsx`) y volvé a renderizar.
