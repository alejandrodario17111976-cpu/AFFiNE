"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Scroll suave con inercia (Lenis) para mouse y trackpad; en pantallas táctiles queda el
 * scroll nativo del teléfono. Corre en el mismo reloj que GSAP y que la escena 3D, así las
 * animaciones, los productos 3D y la página se mueven en el mismo cuadro, sin desfase.
 */
let lenis: Lenis | null = null;

const altoEncabezado = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--alto-encabezado")) || 64;

export function iniciarDesplazamiento() {
  if (lenis || typeof window === "undefined") return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const l = new Lenis({
    lerp: 0.12,
    anchors: { offset: -altoEncabezado() },
    allowNestedScroll: true,
    prevent: (nodo) => Boolean(nodo.closest?.("[data-lenis-prevent]")),
  });
  lenis = l;
  l.on("scroll", ScrollTrigger.update);
  const tic = (tiempo: number) => l.raf(tiempo * 1000);
  // prioridad: primero se mueve la página y después se dibuja el 3D
  gsap.ticker.add(tic, false, true);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tic);
    l.destroy();
    lenis = null;
  };
}

/** Lleva la página hasta un elemento, dejando lugar para el encabezado fijo. */
export function irA(elemento: HTMLElement | null) {
  if (!elemento) return;
  if (lenis) lenis.scrollTo(elemento, { offset: -altoEncabezado() });
  else elemento.scrollIntoView({ behavior: "smooth" });
}

/** Frena el scroll de la página mientras hay una ventana abierta encima (ticket, afiche, datos). */
export function pausarDesplazamiento(pausar: boolean) {
  if (!lenis) return;
  if (pausar) lenis.stop();
  else lenis.start();
}

/** Mientras el componente que lo usa está montado (una ventana abierta), la página de atrás no se mueve. */
export function useSinDesplazamiento(activo = true) {
  useEffect(() => {
    if (!activo) return;
    pausarDesplazamiento(true);
    return () => pausarDesplazamiento(false);
  }, [activo]);
}
