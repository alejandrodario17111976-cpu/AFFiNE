// Fotogramas de revisión: node scripts/fotogramas.mjs <Composición> <carpeta> <cuadros,separados> [escala]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [comp, salida, cuadros, escala = "0.5"] = process.argv.slice(2);
fs.mkdirSync(salida, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => {} });
const chromium = "/opt/pw-browsers/chromium";
const opciones = { serveUrl, browserExecutable: fs.existsSync(chromium) ? chromium : undefined, chromiumOptions: { gl: "swangle" } };
const composition = await selectComposition({ ...opciones, id: comp, inputProps: { conAudio: false } });
for (const c of cuadros.split(",").map(Number)) {
  const archivo = path.join(salida, `${comp}_${String(c).padStart(4, "0")}.jpg`);
  await renderStill({ ...opciones, composition, frame: c, output: archivo, imageFormat: "jpeg", jpegQuality: 85, scale: Number(escala), inputProps: { conAudio: false } });
  console.log("ok", archivo);
}
