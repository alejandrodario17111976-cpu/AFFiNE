#!/usr/bin/env bash
# Copia del sitio San Benito los recursos que usa el video (fotos, afiches, sonidos, texturas y
# fuentes) y arma el audio. Correr desde la carpeta remotion/: bash scripts/preparar-recursos.sh
set -euo pipefail
SB=../san-benito
P=public/sanbenito
mkdir -p $P/fuentes $P/texturas $P/productos $P/afiches $P/sonidos
cp $SB/public/texturas/* $P/texturas/
cp $SB/data/afiches/*.webp $P/afiches/
cp $SB/data/imagenes/*.webp $P/productos/
cp $SB/public/sonidos/*.mp3 $P/sonidos/
F=$SB/node_modules
cp $F/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2 $P/fuentes/cormorant.woff2
cp $F/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2 $P/fuentes/cormorant-italica.woff2
cp $F/@fontsource-variable/jost/files/jost-latin-wght-normal.woff2 $P/fuentes/jost.woff2
cp $F/@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2 $P/fuentes/courier.woff2
cp $F/@fontsource/courier-prime/files/courier-prime-latin-700-normal.woff2 $P/fuentes/courier-negrita.woff2
# Música original y mezcla con los efectos (48 kHz, -14 LUFS)
(cd audio-sanbenito && python3 musica.py && python3 mezcla.py)
echo "Recursos listos en $P"
