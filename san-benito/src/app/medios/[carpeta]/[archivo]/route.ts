import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { ARCHIVO_IMAGEN } from "@/lib/validar";

/**
 * Sirve las fotos de productos y los afiches guardados en data/.
 * Están fuera de /public porque se suben desde el panel con el sitio funcionando.
 */
const CARPETAS = { imagenes: "imagenes", afiches: "afiches" } as const;
const TIPOS: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export async function GET(_req: NextRequest, ctx: RouteContext<"/medios/[carpeta]/[archivo]">) {
  const { carpeta, archivo } = await ctx.params;
  const dir = CARPETAS[carpeta as keyof typeof CARPETAS];
  if (!dir || !ARCHIVO_IMAGEN.test(archivo)) return new Response("No encontrado", { status: 404 });
  try {
    const datos = await readFile(path.join(process.cwd(), "data", dir, archivo));
    return new Response(new Uint8Array(datos), {
      headers: {
        "Content-Type": TIPOS[archivo.split(".").pop() ?? ""] ?? "application/octet-stream",
        // Cada foto subida tiene un nombre nuevo, así que se puede guardar en caché para siempre.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
