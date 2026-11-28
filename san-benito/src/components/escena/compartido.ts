/** Estado compartido entre el DOM y la escena 3D, sin pasar por React para no re-renderizar en cada frame. */

/** Posición del puntero en toda la ventana, de -1 a 1. */
export const puntero = { x: 0, y: 0 };

/** Progreso del scroll de la portada, de 0 a 1 (lo escribe GSAP ScrollTrigger). */
export const scrollPortada = { valor: 0 };

/** Interacción de cada tarjeta: si el puntero está encima y dónde (de -1 a 1). */
export type Interaccion = { hover: boolean; x: number; y: number };

export const movimientoReducido = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
