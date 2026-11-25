import type { Negocio, Producto } from "./tipos";

const formateadores = new Map<string, Intl.NumberFormat>();

export function formatearPrecio(valor: number, negocio: Pick<Negocio, "locale" | "moneda">) {
  const decimales = Number.isInteger(valor) ? 0 : 2;
  const clave = `${negocio.locale}|${negocio.moneda}|${decimales}`;
  let f = formateadores.get(clave);
  if (!f) {
    try {
      f = new Intl.NumberFormat(negocio.locale, {
        style: "currency",
        currency: negocio.moneda,
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      });
    } catch {
      f = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      });
    }
    formateadores.set(clave, f);
  }
  return f.format(valor);
}

/** Porcentaje de descuento redondeado, o 0 si no está en oferta. */
export function descuento(p: Pick<Producto, "precio" | "precioAnterior">) {
  if (!p.precioAnterior || p.precioAnterior <= p.precio) return 0;
  return Math.round((1 - p.precio / p.precioAnterior) * 100);
}

/** Devuelve negro o blanco según cuál se lee mejor sobre el color dado. */
export function textoSobre(hex: string) {
  const limpio = hex.replace("#", "");
  const n = parseInt(limpio.length === 3 ? limpio.replace(/(.)/g, "$1$1") : limpio, 16);
  if (Number.isNaN(n)) return "#000000";
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
  // Contraste contra negro vs. contra blanco
  return (lum + 0.05) / 0.05 >= 1.05 / (lum + 0.05) ? "#000000" : "#FFFFFF";
}

export function numeroPasillo(i: number) {
  return String(i + 1).padStart(2, "0");
}
