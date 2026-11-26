"use client";

import { useSyncExternalStore } from "react";

/**
 * Efectos de sonido del sitio (hechos con earshot, sin licencias de por medio).
 * Se decodifican una sola vez con Web Audio para que suenen al instante.
 */
export type Sonido = "agregar" | "quitar" | "ticket-abrir" | "ticket-cerrar" | "pedido" | "menu";

const VOLUMEN: Record<Sonido, number> = {
  agregar: 0.55,
  quitar: 0.45,
  "ticket-abrir": 0.7,
  "ticket-cerrar": 0.5,
  pedido: 0.45,
  menu: 0.35,
};

const CLAVE = "san-benito-sonido";
const base = () => `${process.env.NEXT_PUBLIC_BASE_SONIDOS ?? "/sonidos"}`;

let contexto: AudioContext | null = null;
const buffers = new Map<Sonido, Promise<AudioBuffer | null>>();
let activado: boolean | null = null;
const oyentes = new Set<() => void>();

function leerActivado() {
  if (activado === null) {
    try {
      activado = window.localStorage.getItem(CLAVE) !== "no";
    } catch {
      activado = true;
    }
  }
  return activado;
}

function extension() {
  const a = document.createElement("audio");
  return a.canPlayType('audio/webm; codecs="opus"') ? "webm" : "mp3";
}

function cargar(nombre: Sonido) {
  let p = buffers.get(nombre);
  if (!p && contexto) {
    const ctx = contexto;
    p = fetch(`${base()}/${nombre}.${extension()}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((datos) => ctx.decodeAudioData(datos))
      .catch(() => null);
    buffers.set(nombre, p);
  }
  return p ?? Promise.resolve(null);
}

/** Toca un sonido. Solo funciona después de un toque o clic (regla de los navegadores). */
export function sonar(nombre: Sonido) {
  if (typeof window === "undefined" || !leerActivado()) return;
  try {
    contexto ??= new AudioContext();
    if (contexto.state === "suspended") void contexto.resume();
    const ctx = contexto;
    void cargar(nombre).then((buffer) => {
      if (!buffer) return;
      const fuente = ctx.createBufferSource();
      const volumen = ctx.createGain();
      volumen.gain.value = VOLUMEN[nombre];
      fuente.buffer = buffer;
      // Una mínima variación de tono para que repetir un sonido no suene a máquina
      fuente.playbackRate.value = 0.97 + Math.random() * 0.06;
      fuente.connect(volumen).connect(ctx.destination);
      fuente.start();
    });
  } catch {
    /* sin audio disponible */
  }
}

/** Deja los sonidos listos (se llama en el primer toque de la página). */
export function precargarSonidos() {
  if (typeof window === "undefined" || !leerActivado()) return;
  try {
    contexto ??= new AudioContext();
    (Object.keys(VOLUMEN) as Sonido[]).forEach((s) => void cargar(s));
  } catch {
    /* sin audio disponible */
  }
}

export function cambiarSonido(valor: boolean) {
  activado = valor;
  try {
    window.localStorage.setItem(CLAVE, valor ? "si" : "no");
  } catch {
    /* sin almacenamiento */
  }
  oyentes.forEach((f) => f());
  if (valor) sonar("menu");
}

export function useSonidoActivado() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    leerActivado,
    () => true,
  );
}
