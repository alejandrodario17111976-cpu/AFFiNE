// Arma una vista previa estática del sitio (sin panel de administración) en vista-previa/dist.
// Uso: npm run vista-previa
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const aca = dirname(fileURLToPath(import.meta.url));
const raiz = join(aca, "..");
const dist = join(aca, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

execFileSync(join(raiz, "node_modules/.bin/tailwindcss"), ["-i", "src/app/globals.css", "-o", join(dist, "estilos.css"), "--minify"], {
  cwd: raiz,
  stdio: "inherit",
});

await build({
  entryPoints: [join(aca, "entrada.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  outfile: join(dist, "tienda.js"),
  alias: { "next/link": join(aca, "enlace.tsx") },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
  tsconfig: join(raiz, "tsconfig.json"),
});

const fuentes =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Instrument+Sans:wght@400..700&display=swap";
writeFileSync(
  join(dist, "index.html"),
  `<title>San Benito</title>
<link rel="stylesheet" href="${fuentes}">
<link rel="stylesheet" href="estilos.css">
<div id="raiz"></div>
<script src="tienda.js"></script>
`,
);
console.log("Vista previa lista en", dist);
