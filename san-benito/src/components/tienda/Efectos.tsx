"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useShouldReduceMotion } from "@animate-ui/react/utils/motion";

/*
 * Efectos que cruzan la página: el producto que vuela al ticket al agregarlo,
 * el saltito del botón del ticket y la lluvia de papelitos dorados al mandar un pedido.
 */

type Vuelo = { id: number; x: number; y: number; imagen?: string };
type Papelito = { id: number; x: number; y: number; dx: number; dy: number; giro: number; color: string; ancho: number };

let siguiente = 0;
const oyentesVuelo = new Set<(v: Vuelo) => void>();
const oyentesConfeti = new Set<(p: Papelito[]) => void>();

let golpes = 0;
const oyentesGolpe = new Set<() => void>();
function golpearTicket() {
  golpes += 1;
  oyentesGolpe.forEach((f) => f());
}

/** Lanza la foto del producto (o una moneda dorada) desde un botón hasta el ticket. */
export function lanzarVuelo(desde: DOMRect, imagen?: string) {
  const v = { id: siguiente++, x: desde.left + desde.width / 2, y: desde.top + desde.height / 2, imagen };
  if (oyentesVuelo.size === 0) golpearTicket();
  oyentesVuelo.forEach((f) => f(v));
}

/** Lluvia de papelitos desde un punto de la pantalla (por defecto, el centro). */
export function lanzarConfeti(x?: number, y?: number) {
  const cx = x ?? window.innerWidth / 2;
  const cy = y ?? window.innerHeight / 2;
  const colores = ["var(--sb-acento)", "var(--oro-claro)", "var(--sb-destacado)", "var(--sb-fondo)"];
  const papelitos = Array.from({ length: 36 }, (_, i) => {
    const angulo = (Math.PI * 2 * i) / 36 + Math.random() * 0.4;
    const fuerza = 140 + Math.random() * 220;
    return {
      id: siguiente++,
      x: cx,
      y: cy,
      dx: Math.cos(angulo) * fuerza,
      dy: Math.sin(angulo) * fuerza - 160,
      giro: (Math.random() - 0.5) * 720,
      color: colores[i % colores.length],
      ancho: 6 + Math.random() * 6,
    };
  });
  oyentesConfeti.forEach((f) => f(papelitos));
}

/** Número que cambia cada vez que algo llega al ticket (para animar el botón). */
export function useGolpeTicket() {
  return useSyncExternalStore(
    (f) => {
      oyentesGolpe.add(f);
      return () => oyentesGolpe.delete(f);
    },
    () => golpes,
    () => 0,
  );
}

export function CapaEfectos() {
  const [vuelos, setVuelos] = useState<(Vuelo & { hasta: { x: number; y: number } })[]>([]);
  const [papelitos, setPapelitos] = useState<Papelito[]>([]);
  const reducir = useShouldReduceMotion();

  useEffect(() => {
    const alVolar = (v: Vuelo) => {
      const destino = document.querySelector("[data-destino-ticket]")?.getBoundingClientRect();
      if (!destino || reducir) {
        golpearTicket();
        return;
      }
      setVuelos((vs) => [...vs, { ...v, hasta: { x: destino.left + destino.width / 2, y: destino.top + destino.height / 2 } }]);
    };
    const alLlover = (ps: Papelito[]) => {
      if (reducir) return;
      setPapelitos((actuales) => [...actuales, ...ps]);
      window.setTimeout(() => setPapelitos((actuales) => actuales.filter((p) => !ps.includes(p))), 1800);
    };
    oyentesVuelo.add(alVolar);
    oyentesConfeti.add(alLlover);
    return () => {
      oyentesVuelo.delete(alVolar);
      oyentesConfeti.delete(alLlover);
    };
  }, [reducir]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[45]" aria-hidden>
      <AnimatePresence>
        {vuelos.map((v) => {
          const alto = Math.min(v.y, v.hasta.y) - 140;
          return (
            <motion.div
              key={v.id}
              className="absolute top-0 left-0 size-14 overflow-hidden rounded-xl border-2 border-oro bg-papel shadow-flotante"
              initial={{ x: v.x - 28, y: v.y - 28, scale: 0.6, opacity: 0 }}
              animate={{
                x: [v.x - 28, (v.x + v.hasta.x) / 2 - 28, v.hasta.x - 28],
                y: [v.y - 28, alto, v.hasta.y - 28],
                scale: [0.6, 1.1, 0.35],
                opacity: [0, 1, 0.9],
                rotate: [0, -8, 6],
              }}
              transition={{ duration: 0.75, ease: [0.45, 0, 0.2, 1], times: [0, 0.45, 1] }}
              onAnimationComplete={() => {
                setVuelos((vs) => vs.filter((x) => x.id !== v.id));
                golpearTicket();
              }}
            >
              {v.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura que vuela, sin optimizar a propósito
                <img src={v.imagen} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="boton-oro block h-full w-full rounded-full" />
              )}
            </motion.div>
          );
        })}
        {papelitos.map((p) => (
          <motion.span
            key={p.id}
            className="absolute top-0 left-0 block h-2.5 rounded-[2px]"
            style={{ background: p.color, width: p.ancho }}
            initial={{ x: p.x, y: p.y, rotate: 0, opacity: 1 }}
            animate={{ x: p.x + p.dx, y: [p.y, p.y + p.dy, p.y + p.dy + 520], rotate: p.giro, opacity: [1, 1, 0] }}
            transition={{ duration: 1.7, ease: [0.2, 0.7, 0.4, 1], times: [0, 0.35, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
