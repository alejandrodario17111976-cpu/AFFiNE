"use server";

import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import sharp from "sharp";
import { asegurarDatos, rutaDatos } from "@/lib/almacen";
import { ETIQUETA_CACHE, RUTA_TIENDA } from "@/lib/tienda";
import { ARCHIVO_IMAGEN, crearId, ErrorDatos, normalizarTienda } from "@/lib/validar";
import * as pedidosServidor from "@/lib/pedidos";
import { ESTADOS_PEDIDO, type EstadoPedido } from "@/lib/tipos";

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

/**
 * Intentos fallidos por conexión: con una contraseña corta (un PIN), sin este freno alguien
 * podría probar todas las combinaciones. Después de 6 errores en 15 minutos, esa conexión
 * espera 15 minutos aunque escriba la contraseña correcta.
 */
const VENTANA = 15 * 60 * 1000;
const MAX_FALLOS = 6;
const fallos = new Map<string, { cuenta: number; desde: number }>();

/** Tope entre todas las conexiones, por si alguien prueba desde muchas a la vez. */
const MAX_FALLOS_TOTAL = 200;
const total = { cuenta: 0, desde: Date.now() };

async function conexion() {
  const h = await headers();
  // La dirección que agrega el proxy del hosting (la última), no la que manda el navegador
  const reenviada = h.get("x-forwarded-for")?.split(",").at(-1);
  return (h.get("x-real-ip") ?? reenviada ?? "local").trim();
}

function bloqueada(ip: string) {
  if (Date.now() - total.desde > VENTANA) {
    total.cuenta = 0;
    total.desde = Date.now();
  }
  if (total.cuenta >= MAX_FALLOS_TOTAL) return true;
  const f = fallos.get(ip);
  if (!f) return false;
  if (Date.now() - f.desde > VENTANA) {
    fallos.delete(ip);
    return false;
  }
  return f.cuenta >= MAX_FALLOS;
}

const BLOQUEO = "Demasiados intentos con contraseña incorrecta. Esperá 15 minutos y probá de nuevo.";

/** true si la contraseña es correcta; si no, el mensaje para mostrar. */
async function comprobar(clave: unknown): Promise<true | string> {
  const ip = await conexion();
  if (bloqueada(ip)) return BLOQUEO;
  if (claveCorrecta(clave)) {
    fallos.delete(ip);
    return true;
  }
  const f = fallos.get(ip);
  fallos.set(ip, { cuenta: (f?.cuenta ?? 0) + 1, desde: f?.desde ?? Date.now() });
  total.cuenta++;
  if (fallos.size > 5000) fallos.clear();
  await new Promise((r) => setTimeout(r, 600));
  return bloqueada(ip) ? BLOQUEO : "La contraseña no es correcta.";
}

export async function verificarClave(clave: string): Promise<boolean | string> {
  return comprobar(clave);
}

export async function guardarTienda(clave: string, datos: unknown): Promise<Resultado> {
  if ((await comprobar(clave)) !== true) {
    return { ok: false, error: "La contraseña no es correcta." };
  }

  let tienda;
  try {
    tienda = normalizarTienda(datos);
  } catch (e) {
    return { ok: false, error: e instanceof ErrorDatos ? e.message : "Los datos no son válidos." };
  }

  try {
    await asegurarDatos();
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
  if ((await comprobar(clave)) !== true) {
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
    await asegurarDatos();
    const dir = rutaDatos(carpeta);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, final), datos);
    return { ok: true, archivo: final };
  } catch {
    return { ok: false, error: "No se pudo procesar la imagen. Probá con otra foto." };
  }
}

/** Borra una imagen que ya no usa ningún producto ni afiche (se llama después de guardar). */
export async function borrarImagen(clave: string, carpeta: "imagenes" | "afiches", archivo: string): Promise<Resultado> {
  if ((await comprobar(clave)) !== true) return { ok: false, error: "La contraseña no es correcta." };
  if ((carpeta !== "imagenes" && carpeta !== "afiches") || !ARCHIVO_IMAGEN.test(archivo)) {
    return { ok: false, error: "Imagen inválida." };
  }
  try {
    await unlink(rutaDatos(carpeta, archivo));
  } catch {
    /* ya no estaba */
  }
  return { ok: true };
}

/* ---------- Pedidos y clientes (solo AGL) ---------- */

export async function verPedidos(clave: string) {
  if ((await comprobar(clave)) !== true) return null;
  return pedidosServidor.listarPedidos();
}

export async function cambiarEstadoPedido(clave: string, numero: string, estado: EstadoPedido) {
  if ((await comprobar(clave)) !== true) return null;
  if (!ESTADOS_PEDIDO.includes(estado)) return null;
  return pedidosServidor.cambiarEstado(String(numero), estado);
}

export async function verClientes(clave: string) {
  if ((await comprobar(clave)) !== true) return null;
  return pedidosServidor.listarClientes();
}
