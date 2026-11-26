"use server";

import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { updateTag } from "next/cache";
import sharp from "sharp";
import { ETIQUETA_CACHE, RUTA_TIENDA } from "@/lib/tienda";
import { ARCHIVO_IMAGEN, crearId, ErrorDatos, normalizarTienda } from "@/lib/validar";

export type Resultado = { ok: true } | { ok: false; error: string };
export type ResultadoImagen = { ok: true; archivo: string } | { ok: false; error: string };

/** Contraseña para trabajar en tu computadora cuando no configuraste ADMIN_PASSWORD. */
const CLAVE_LOCAL = "sanbenito";

function claveEsperada() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  // En el sitio publicado no hay contraseña por defecto: sin ADMIN_PASSWORD no se puede editar.
  return process.env.NODE_ENV === "production" ? null : CLAVE_LOCAL;
}

function claveCorrecta(clave: unknown) {
  const esperada = claveEsperada();
  if (!esperada || typeof clave !== "string") return false;
  const a = Buffer.from(clave);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function esperarSiFalla(ok: boolean) {
  if (!ok) await new Promise((r) => setTimeout(r, 600));
  return ok;
}

export async function verificarClave(clave: string): Promise<boolean> {
  return esperarSiFalla(claveCorrecta(clave));
}

export async function guardarTienda(clave: string, datos: unknown): Promise<Resultado> {
  if (!(await esperarSiFalla(claveCorrecta(clave)))) {
    return { ok: false, error: "La contraseña no es correcta." };
  }

  let tienda;
  try {
    tienda = normalizarTienda(datos);
  } catch (e) {
    return { ok: false, error: e instanceof ErrorDatos ? e.message : "Los datos no son válidos." };
  }

  try {
    const temporal = `${RUTA_TIENDA}.tmp`;
    await writeFile(temporal, `${JSON.stringify(tienda, null, 2)}\n`, "utf8");
    await rename(temporal, RUTA_TIENDA);
  } catch {
    return {
      ok: false,
      error:
        "No se pudo guardar el archivo data/tienda.json. Si el sitio está en un hosting de solo lectura, descargá la copia y subila con el código.",
    };
  }

  updateTag(ETIQUETA_CACHE);
  return { ok: true };
}

const TIPOS_IMAGEN = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"]);

/**
 * Guarda una foto de producto o un afiche. La achica, la pasa a WebP (conservando la transparencia
 * de las fotos recortadas) y le pone un nombre nuevo para que nunca se mezcle con una anterior.
 */
export async function subirImagen(clave: string, carpeta: "imagenes" | "afiches", formulario: FormData): Promise<ResultadoImagen> {
  if (!(await esperarSiFalla(claveCorrecta(clave)))) {
    return { ok: false, error: "La contraseña no es correcta." };
  }
  if (carpeta !== "imagenes" && carpeta !== "afiches") return { ok: false, error: "Carpeta inválida." };
  const archivo = formulario.get("archivo");
  const nombre = String(formulario.get("nombre") ?? "foto");
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "No llegó ninguna imagen." };
  if (!TIPOS_IMAGEN.has(archivo.type)) return { ok: false, error: "La imagen tiene que ser JPG, PNG o WebP." };
  if (archivo.size > 8 * 1024 * 1024) return { ok: false, error: "La imagen pesa más de 8 MB." };

  try {
    const lado = carpeta === "afiches" ? 1600 : 1200;
    const datos = await sharp(Buffer.from(await archivo.arrayBuffer()))
      .rotate()
      .resize({ width: lado, height: lado, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86, alphaQuality: 90 })
      .toBuffer();
    const final = `${crearId(nombre).slice(0, 60)}-${randomBytes(3).toString("hex")}.webp`;
    if (!ARCHIVO_IMAGEN.test(final)) return { ok: false, error: "No se pudo nombrar la imagen." };
    const dir = path.join(process.cwd(), "data", carpeta);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, final), datos);
    return { ok: true, archivo: final };
  } catch {
    return { ok: false, error: "No se pudo procesar la imagen. Probá con otra foto." };
  }
}

/** Borra una imagen que ya no usa ningún producto ni afiche (se llama después de guardar). */
export async function borrarImagen(clave: string, carpeta: "imagenes" | "afiches", archivo: string): Promise<Resultado> {
  if (!(await esperarSiFalla(claveCorrecta(clave)))) return { ok: false, error: "La contraseña no es correcta." };
  if ((carpeta !== "imagenes" && carpeta !== "afiches") || !ARCHIVO_IMAGEN.test(archivo)) {
    return { ok: false, error: "Imagen inválida." };
  }
  try {
    await unlink(path.join(process.cwd(), "data", carpeta, archivo));
  } catch {
    /* ya no estaba */
  }
  return { ok: true };
}
