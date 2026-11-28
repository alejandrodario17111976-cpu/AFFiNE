/**
 * Lo que la página de claude.ai le permite hacer a la tienda: volver a publicarse con
 * los datos nuevos (`artifact`) y guardar fotos (`assets`). Solo la cuenta dueña de la
 * página (o quien tenga permiso de edición) puede usarlas; para el resto, la tienda es
 * de solo lectura y estas funciones devuelven null o un error.
 */

export interface ErrorCapacidad {
  code?: string;
}

export interface CapacidadArtifact {
  publish(html: string): Promise<{ version: string }>;
}

export interface CapacidadAssets {
  upload(blob: Blob, opciones?: { type?: string }): Promise<{ id: string; url: string }>;
}

type ClaudeDePagina = { use(nombre: string): Promise<unknown> };

export async function usarCapacidad<T>(nombre: "artifact" | "assets"): Promise<T | null> {
  const claude = (window as unknown as { claude?: ClaudeDePagina }).claude;
  if (!claude || typeof claude.use !== "function") return null;
  try {
    return ((await claude.use(nombre)) as T | null) ?? null;
  } catch {
    return null;
  }
}

export const codigo = (e: unknown) => (e && typeof e === "object" && "code" in e ? String((e as ErrorCapacidad).code) : "");
