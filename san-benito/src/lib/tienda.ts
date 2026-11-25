import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheTag } from "next/cache";
import type { Tienda } from "./tipos";
import { normalizarTienda } from "./validar";

/** Archivo con los datos del negocio, las categorías y los productos con sus precios. */
export const RUTA_TIENDA = path.join(process.cwd(), "data", "tienda.json");
export const ETIQUETA_CACHE = "tienda";

export async function getTienda(): Promise<Tienda> {
  "use cache";
  cacheTag(ETIQUETA_CACHE);
  const contenido = await readFile(RUTA_TIENDA, "utf8");
  return normalizarTienda(JSON.parse(contenido));
}
