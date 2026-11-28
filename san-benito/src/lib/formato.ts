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

/**
 * Precio de llevar `cantidad` unidades, aplicando los precios por cantidad de mayor a menor
 * (por ejemplo, 11 yerbas con promos de 2 y de 10 = una de 10 + una suelta).
 */
export function precioPara(p: Pick<Producto, "precio" | "promos">, cantidad: number) {
  let resto = cantidad;
  let total = 0;
  for (const promo of [...p.promos].sort((a, b) => b.cantidad - a.cantidad)) {
    if (promo.precio >= p.precio * promo.cantidad) continue;
    const veces = Math.floor(resto / promo.cantidad);
    total += veces * promo.precio;
    resto -= veces * promo.cantidad;
  }
  return total + resto * p.precio;
}

/** Si el producto va en la sección de ofertas. */
export function estaEnOferta(p: Pick<Producto, "precio" | "precioAnterior" | "promos" | "enOferta">) {
  return p.enOferta || descuento(p) > 0 || p.promos.some((x) => x.precio < x.cantidad * p.precio);
}

/** Separadores de miles y decimales del formato regional (para los números animados). */
export function separadores(locale: string) {
  try {
    const partes = new Intl.NumberFormat(locale).formatToParts(12345.6);
    return {
      miles: partes.find((x) => x.type === "group")?.value ?? ".",
      decimal: partes.find((x) => x.type === "decimal")?.value ?? ",",
    };
  } catch {
    return { miles: ".", decimal: "," };
  }
}

/** Símbolo de la moneda en el formato regional ("$" para ARS en es-AR). */
export function simboloMoneda(locale: string, moneda: string) {
  try {
    return (
      new Intl.NumberFormat(locale, { style: "currency", currency: moneda }).formatToParts(1).find((x) => x.type === "currency")
        ?.value ?? "$"
    );
  } catch {
    return "$";
  }
}

/** Enlace a Google Maps para una dirección. */
export function enlaceMapa(direccion: string, localidad: string, provincia: string) {
  const q = [direccion, localidad, provincia, "Argentina"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Dirección de una imagen subida (producto o afiche). */
export function urlMedio(carpeta: "imagenes" | "afiches", archivo: string) {
  // Fotos subidas desde AGL en la página publicada en claude.ai: ya son una dirección propia
  if (archivo.startsWith("/_blob/")) return archivo;
  const base = process.env.NEXT_PUBLIC_BASE_MEDIOS ?? "/medios";
  return `${base}/${carpeta}/${archivo}`;
}
