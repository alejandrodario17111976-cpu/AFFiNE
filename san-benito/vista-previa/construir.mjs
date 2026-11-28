// Arma la página de la tienda para publicar en claude.ai, en vista-previa/dist.
// Uso: CLAVE_AGL=<pin> npm run vista-previa
//  - CLAVE_AGL: el PIN de AGL. En el código solo queda su huella (PBKDF2); se guarda en
//    vista-previa/.clave-agl (fuera del repositorio) para los armados siguientes.
//  - DATOS_TIENDA: otro tienda.json (por ejemplo, el que se editó desde la página publicada).
import { execFileSync } from "node:child_process";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { cuerpoPagina } from "./pagina.mjs";

const aca = dirname(fileURLToPath(import.meta.url));
const raiz = join(aca, "..");
const dist = join(aca, "dist");
// Huella del PIN de AGL
const archivoClave = join(aca, ".clave-agl");
let huella = "";
if (process.env.CLAVE_AGL) {
  const sal = randomBytes(16);
  const iteraciones = 210000;
  const hash = pbkdf2Sync(process.env.CLAVE_AGL.trim(), sal, iteraciones, 32, "sha256");
  huella = `pbkdf2$${iteraciones}$${sal.toString("hex")}$${hash.toString("hex")}`;
  writeFileSync(archivoClave, huella);
} else if (existsSync(archivoClave)) {
  huella = readFileSync(archivoClave, "utf8").trim();
} else {
  console.warn("Sin CLAVE_AGL: AGL no va a pedir PIN (igual, solo la cuenta dueña puede guardar).");
}

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
    "process.env.CLAVE_AGL_HASH": JSON.stringify(huella),
  },
  logLevel: "warning",
  tsconfig: join(raiz, "tsconfig.json"),
});

// Fotos, afiches, texturas y sonidos
cpSync(join(raiz, "data/imagenes"), join(dist, "medios/imagenes"), { recursive: true });
cpSync(join(raiz, "data/afiches"), join(dist, "medios/afiches"), { recursive: true });
cpSync(join(raiz, "public/texturas"), join(dist, "texturas"), { recursive: true });
cpSync(join(raiz, "public/sonidos"), join(dist, "sonidos"), { recursive: true });

// La página, con los datos de la tienda adentro (AGL los cambia publicando una versión nueva)
const tienda = JSON.parse(readFileSync(process.env.DATOS_TIENDA || join(raiz, "data/tienda.json"), "utf8"));
writeFileSync(join(dist, "index.html"), cuerpoPagina(tienda));
console.log("Vista previa lista en", dist, huella ? "(AGL con PIN)" : "(AGL sin PIN)");
