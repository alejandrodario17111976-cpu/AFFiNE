"use server";

import * as pedidos from "@/lib/pedidos";
import type { EstadoPedido, Pedido } from "@/lib/tipos";

/** Acciones públicas: cualquiera que entra al sitio puede mandar su pedido y consultar el suyo. */
export async function enviarPedido(entrada: pedidos.Entrada): Promise<pedidos.Respuesta<Pedido>> {
  try {
    return await pedidos.crearPedido(entrada);
  } catch {
    return { ok: false, error: "No se pudo registrar el pedido. Probá de nuevo o mandalo por WhatsApp" };
  }
}

export async function consultarPedido(numero: string, dni: string): Promise<{ estado: EstadoPedido; listoEn: string | null } | null> {
  if (typeof numero !== "string" || !/^\d{6}-\d{3,4}$/.test(numero)) return null;
  return pedidos.estadoPedido(numero, String(dni ?? ""));
}
