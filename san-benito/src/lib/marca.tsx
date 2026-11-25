"use client";

import { createContext, useContext, type CSSProperties } from "react";
import { familiaTexto, familiaTitulos } from "./fuentes";
import type { Apariencia } from "./tipos";
import { APARIENCIA_INICIAL } from "./validar";

/** Variables CSS que pintan todo el sitio con los colores y fuentes elegidos en el panel. */
export function estiloMarca(a: Apariencia): CSSProperties {
  return {
    "--sb-principal": a.colorPrincipal,
    "--sb-acento": a.colorAcento,
    "--sb-destacado": a.colorDestacado,
    "--sb-fondo": a.colorFondo,
    "--sb-fuente-titulos": familiaTitulos(a.fuenteTitulos),
    "--sb-fuente-texto": familiaTexto(a.fuenteTexto),
  } as CSSProperties;
}

/** Mezcla dos colores hex (t = 0 da `a`, t = 1 da `b`). */
export function mezclar(a: string, b: string, t: number) {
  const n = (h: string) => parseInt(h.replace("#", ""), 16);
  const [x, y] = [n(a), n(b)];
  const canal = (s: number) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return `#${((canal(16) << 16) | (canal(8) << 8) | canal(0)).toString(16).padStart(6, "0")}`;
}

export interface Marca3D {
  principal: string;
  oro: string;
  destacado: string;
  fondo: string;
  titulos: string;
  texto: string;
}

export function marca3D(a: Apariencia): Marca3D {
  return {
    principal: a.colorPrincipal,
    oro: a.colorAcento,
    destacado: a.colorDestacado,
    fondo: a.colorFondo,
    titulos: familiaTitulos(a.fuenteTitulos),
    texto: familiaTexto(a.fuenteTexto),
  };
}

const ContextoMarca = createContext<Marca3D>(marca3D(APARIENCIA_INICIAL));
export const ProveedorMarca = ContextoMarca.Provider;
export const useMarca = () => useContext(ContextoMarca);
