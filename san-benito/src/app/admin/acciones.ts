"use server";

import { rename, writeFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import { updateTag } from "next/cache";
import { ETIQUETA_CACHE, RUTA_TIENDA } from "@/lib/tienda";
import { ErrorDatos, normalizarTienda } from "@/lib/validar";

export type Resultado = { ok: true } | { ok: false; error: string };

function claveCorrecta(clave: unknown) {
  const esperada = process.env.ADMIN_PASSWORD;
  // Sin contraseña configurada solo se permite editar mientras se trabaja en tu computadora (npm run dev).
  if (!esperada) return process.env.NODE_ENV !== "production";
  if (typeof clave !== "string") return false;
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
