// Arma una vista previa estática del sitio (sin panel AGL) en vista-previa/dist.
// Uso: npm run vista-previa
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const aca = dirname(fileURLToPath(import.meta.url));
const raiz = join(aca, "..");
const dist = join(aca, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// Estilos (Tailwind) con rutas relativas a las texturas
execFileSync(join(raiz, "node_modules/.bin/tailwindcss"), ["-i", "src/app/globals.css", "-o", join(dist, "estilos.css"), "--minify"], {
  cwd: raiz,
  stdio: "inherit",
});
const css = readFileSync(join(dist, "estilos.css"), "utf8").replaceAll('url("/texturas/', 'url("texturas/').replaceAll("url(/texturas/", "url(texturas/");
writeFileSync(join(dist, "estilos.css"), css);

await build({
  entryPoints: [join(aca, "entrada.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  outfile: join(dist, "tienda.js"),
  alias: { "next/link": join(aca, "enlace.tsx") },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_BASE_MEDIOS": '"medios"',
    "process.env.NEXT_PUBLIC_BASE_SONIDOS": '"sonidos"',
  },
  logLevel: "warning",
  tsconfig: join(raiz, "tsconfig.json"),
});

// Fotos, afiches, texturas y sonidos
cpSync(join(raiz, "data/imagenes"), join(dist, "medios/imagenes"), { recursive: true });
cpSync(join(raiz, "data/afiches"), join(dist, "medios/afiches"), { recursive: true });
cpSync(join(raiz, "public/texturas"), join(dist, "texturas"), { recursive: true });
cpSync(join(raiz, "public/sonidos"), join(dist, "sonidos"), { recursive: true });

// Fuentes de Google Fonts (el único servidor de fuentes que permite la vista previa)
const tienda = JSON.parse(readFileSync(join(raiz, "data/tienda.json"), "utf8"));
const GOOGLE = {
  cormorant: "Cormorant+Garamond:wght@400..700",
  fraunces: "Fraunces:opsz,wght@9..144,300..700",
  playfair: "Playfair+Display:wght@400..800",
  newsreader: "Newsreader:opsz,wght@6..72,300..700",
  jost: "Jost:wght@300..700",
  instrument: "Instrument+Sans:wght@400..700",
  dm: "DM+Sans:wght@300..700",
};
const familias = [
  GOOGLE[tienda.apariencia?.fuenteTitulos] ?? GOOGLE.cormorant,
  GOOGLE[tienda.apariencia?.fuenteTexto] ?? GOOGLE.jost,
  "Courier+Prime:wght@400;700",
];
const fuentes = `https://fonts.googleapis.com/css2?${familias.map((f) => `family=${f}`).join("&")}&display=swap`;
writeFileSync(
  join(dist, "index.html"),
  `<meta charset="utf-8">\n<title>San Benito</title>
<link rel="stylesheet" href="${fuentes}">
<link rel="stylesheet" href="estilos.css">
<div id="raiz"></div>
<script src="tienda.js"></script>
`,
);
console.log("Vista previa lista en", dist);
