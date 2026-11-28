import { access, cp, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Carpeta donde el sitio guarda todo lo que cambia: tienda.json, pedidos, clientes, fotos y afiches.
 * En un hosting con disco persistente se apunta DATOS_DIR al disco (por ejemplo /datos);
 * la primera vez se copian ahí los datos iniciales que vienen con el código.
 */
const SEMILLA = path.join(process.cwd(), "data");
export const DATOS_DIR = process.env.DATOS_DIR ? path.resolve(process.env.DATOS_DIR) : SEMILLA;

let preparado: Promise<void> | null = null;

export function asegurarDatos() {
  preparado ??= (async () => {
    await mkdir(DATOS_DIR, { recursive: true });
    if (DATOS_DIR === SEMILLA) return;
    try {
      await access(path.join(DATOS_DIR, "tienda.json"));
    } catch {
      await cp(SEMILLA, DATOS_DIR, { recursive: true, force: false, errorOnExist: false });
    }
  })();
  return preparado;
}

export const rutaDatos = (...partes: string[]) => path.join(DATOS_DIR, ...partes);

export async function leerJson<T>(archivo: string, siNoHay: T): Promise<T> {
  await asegurarDatos();
  try {
    return JSON.parse(await readFile(rutaDatos(archivo), "utf8")) as T;
  } catch {
    return siNoHay;
  }
}

export async function escribirJson(archivo: string, datos: unknown) {
  await asegurarDatos();
  const destino = rutaDatos(archivo);
  const temporal = `${destino}.${process.pid}.tmp`;
  await writeFile(temporal, `${JSON.stringify(datos, null, 2)}\n`, "utf8");
  await rename(temporal, destino);
}

/** Una escritura por vez: dos pedidos al mismo tiempo no se pisan. */
let cola: Promise<unknown> = Promise.resolve();
export function enCola<T>(tarea: () => Promise<T>): Promise<T> {
  const siguiente = cola.then(tarea, tarea);
  cola = siguiente.catch(() => undefined);
  return siguiente;
}
