import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getTienda } from "@/lib/tienda";
import EditorAdmin, { type ModoAcceso } from "@/components/admin/EditorAdmin";

export const metadata: Metadata = {
  title: "Administrar precios — San Benito",
  robots: { index: false, follow: false },
};

async function Panel() {
  // La contraseña se lee al abrir la página, no al compilar el sitio.
  await connection();
  const tienda = await getTienda();
  const modo: ModoAcceso = process.env.ADMIN_PASSWORD
    ? "clave"
    : process.env.NODE_ENV === "production"
      ? "sin-configurar"
      : "libre";
  return <EditorAdmin inicial={tienda} modo={modo} />;
}

export default function Admin() {
  return (
    <Suspense
      fallback={<main className="flex min-h-svh items-center justify-center bg-rojo font-display text-3xl uppercase">Cargando…</main>}
    >
      <Panel />
    </Suspense>
  );
}
