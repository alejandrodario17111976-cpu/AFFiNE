"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Negocio, Producto } from "@/lib/tipos";
import { formatearPrecio, precioPara } from "@/lib/formato";
import { sonar } from "@/lib/sonidos";

const CLAVE = "san-benito-ticket";

export interface LineaTicket {
  producto: Producto;
  cantidad: number;
  subtotal: number;
  /** Lo que se ahorra por los precios por cantidad. */
  ahorro: number;
}

interface ValorCarrito {
  lineas: LineaTicket[];
  total: number;
  ahorro: number;
  unidades: number;
  cantidadDe: (id: string) => number;
  agregar: (id: string) => void;
  quitar: (id: string) => void;
  vaciar: () => void;
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  precio: (valor: number) => string;
  negocio: Negocio;
}

const Contexto = createContext<ValorCarrito | null>(null);

/*
 * El ticket se guarda en este navegador (localStorage) para no perderlo al recargar.
 * Se lee como una fuente externa: en el servidor siempre arranca vacío.
 */
type Cantidades = Record<string, number>;
const VACIO: Cantidades = {};
let actual: Cantidades | null = null;
const oyentes = new Set<() => void>();

function leer(): Cantidades {
  if (actual) return actual;
  try {
    const datos: unknown = JSON.parse(window.localStorage.getItem(CLAVE) ?? "null");
    actual =
      datos && typeof datos === "object" && !Array.isArray(datos)
        ? (Object.fromEntries(
            Object.entries(datos as Record<string, unknown>).filter(
              ([, v]) => typeof v === "number" && Number.isInteger(v) && v > 0 && v < 100,
            ),
          ) as Cantidades)
        : VACIO;
  } catch {
    actual = VACIO;
  }
  return actual;
}

function escribir(siguiente: Cantidades) {
  actual = siguiente;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(siguiente));
  } catch {
    /* sin almacenamiento disponible: el ticket dura mientras la página esté abierta */
  }
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  // Si el ticket cambia en otra pestaña, se actualiza acá también.
  const alCambiar = (e: StorageEvent) => {
    if (e.key === CLAVE) {
      actual = null;
      avisar();
    }
  };
  window.addEventListener("storage", alCambiar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", alCambiar);
  };
}

export function useCarrito() {
  const v = useContext(Contexto);
  if (!v) throw new Error("useCarrito tiene que usarse dentro de CarritoProvider");
  return v;
}

export function CarritoProvider({
  productos,
  negocio,
  children,
}: {
  productos: Producto[];
  negocio: Negocio;
  children: ReactNode;
}) {
  const cantidades = useSyncExternalStore(suscribir, leer, () => VACIO);
  const [abierto, setAbierto] = useState(false);

  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  const lineas = useMemo(
    () =>
      Object.entries(cantidades).flatMap(([id, cantidad]) => {
        const producto = porId.get(id);
        if (!producto || !producto.disponible || cantidad <= 0) return [];
        const subtotal = precioPara(producto, cantidad);
        return [{ producto, cantidad, subtotal, ahorro: producto.precio * cantidad - subtotal }];
      }),
    [cantidades, porId],
  );

  const cambiar = useCallback((id: string, delta: number) => {
    const previo = leer();
    const siguiente = { ...previo };
    const n = Math.max(0, Math.min(99, (previo[id] ?? 0) + delta));
    if (n === 0) delete siguiente[id];
    else siguiente[id] = n;
    escribir(siguiente);
  }, []);

  const precio = useCallback((valor: number) => formatearPrecio(valor, negocio), [negocio]);

  const valor: ValorCarrito = {
    lineas,
    total: lineas.reduce((s, l) => s + l.subtotal, 0),
    ahorro: lineas.reduce((s, l) => s + l.ahorro, 0),
    unidades: lineas.reduce((s, l) => s + l.cantidad, 0),
    cantidadDe: (id) => (porId.get(id)?.disponible ? (cantidades[id] ?? 0) : 0),
    agregar: (id) => {
      sonar("agregar");
      cambiar(id, 1);
    },
    quitar: (id) => {
      sonar("quitar");
      cambiar(id, -1);
    },
    vaciar: () => {
      sonar("quitar");
      escribir(VACIO);
    },
    abierto,
    abrir: () => {
      sonar("ticket-abrir");
      setAbierto(true);
    },
    cerrar: () => {
      sonar("ticket-cerrar");
      setAbierto(false);
    },
    precio,
    negocio,
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function textoPedido(lineas: LineaTicket[], total: number, negocio: Negocio, numero: string) {
  const f = (v: number) => formatearPrecio(v, negocio);
  const filas = lineas.map(
    (l) =>
      `- ${l.cantidad} x ${l.producto.nombre}${l.producto.presentacion ? ` (${l.producto.presentacion})` : ""}: ${f(l.subtotal)}` +
      (l.ahorro > 0 ? ` (ahorro ${f(l.ahorro)})` : ""),
  );
  return [
    `Hola ${negocio.nombre}, quiero hacer este pedido (N.º ${numero}):`,
    "",
    ...filas,
    "",
    `Total: ${f(total)}`,
  ].join("\n");
}
