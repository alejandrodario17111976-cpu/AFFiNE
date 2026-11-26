import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getTienda } from "@/lib/tienda";
import EditorAdmin, { type ModoAcceso } from "@/components/admin/EditorAdmin";
import { borrarImagen, guardarTienda, subirImagen, verificarClave } from "./acciones";

export const metadata: Metadata = {
  title: "AGL",
  robots: { index: false, follow: false },
};

async function Panel() {
  // La contraseña se lee al abrir la página, no al compilar el sitio.
  await connection();
  const tienda = await getTienda();
  const modo: ModoAcceso =
    process.env.ADMIN_PASSWORD || process.env.NODE_ENV !== "production" ? "clave" : "sin-configurar";
  const claveLocal = !process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== "production";
  return (
    <EditorAdmin
      inicial={tienda}
      modo={modo}
      claveLocal={claveLocal}
      acciones={{ guardarTienda, verificarClave, subirImagen, borrarImagen }}
    />
  );
}

export default function Admin() {
  return (
    <Suspense
      fallback={<main className="flex min-h-svh items-center justify-center bg-lapis-hondo font-titulo text-3xl text-marfil">Cargando…</main>}
    >
      <Panel />
    </Suspense>
  );
}
