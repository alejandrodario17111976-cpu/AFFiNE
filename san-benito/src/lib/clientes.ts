import type { Cliente } from "./tipos";

const NOMBRE = /^[\p{L}][\p{L}' .-]{0,39}$/u;

/** Revisa los datos que carga el cliente. Devuelve el cliente limpio o el primer error para mostrar. */
export function validarCliente(v: Partial<Cliente> | null | undefined): { ok: true; cliente: Cliente } | { ok: false; error: string } {
  const nombre = String(v?.nombre ?? "").trim().replace(/\s+/g, " ");
  const apellido = String(v?.apellido ?? "").trim().replace(/\s+/g, " ");
  const dni = String(v?.dni ?? "").replace(/\D/g, "");
  const telefono = String(v?.telefono ?? "").trim();
  const digitos = telefono.replace(/\D/g, "");
  if (!NOMBRE.test(nombre)) return { ok: false, error: "Escribí tu nombre" };
  if (!NOMBRE.test(apellido)) return { ok: false, error: "Escribí tu apellido" };
  if (dni.length < 7 || dni.length > 8) return { ok: false, error: "El DNI tiene que tener 7 u 8 números" };
  if (digitos.length < 10 || digitos.length > 13) {
    return { ok: false, error: "Escribí el celular con código de área, sin 0 ni 15 (por ejemplo 263 4123456)" };
  }
  return { ok: true, cliente: { nombre, apellido, dni, telefono } };
}

/**
 * Número para abrir WhatsApp (wa.me) a partir de un celular argentino:
 * "263 4123456", "0263 4123456" o "+54 9 263 4123456" → "5492634123456".
 */
export function whatsappDe(telefono: string) {
  let d = telefono.replace(/\D/g, "");
  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) return `549${d.slice(2)}`;
  d = d.replace(/^0/, "");
  return `549${d}`;
}

/** DNI con puntos: 12345678 → 12.345.678 */
export function dniConPuntos(dni: string) {
  return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
