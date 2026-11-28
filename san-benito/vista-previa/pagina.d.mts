import type { Apariencia, Tienda } from "@/lib/tipos";

export const RESET: string;
export function urlFuentes(apariencia: Partial<Apariencia> | undefined): string;
export function cuerpoPagina(tienda: Tienda): string;
export function documentoCompleto(tienda: Tienda): string;
