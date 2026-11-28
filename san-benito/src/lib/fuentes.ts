/** Tipografías incluidas en el sitio (se descargan solo si se usan). */

export interface OpcionFuente {
  id: string;
  nombre: string;
  familia: string;
}

export const FUENTES_TITULOS: OpcionFuente[] = [
  { id: "cormorant", nombre: "Cormorant Garamond (fina, refinada)", familia: '"Cormorant Garamond Variable", "Cormorant Garamond", Georgia, serif' },
  { id: "fraunces", nombre: "Fraunces (cálida, clásica)", familia: '"Fraunces Variable", "Fraunces", Georgia, serif' },
  { id: "playfair", nombre: "Playfair Display (alto contraste)", familia: '"Playfair Display Variable", "Playfair Display", Georgia, serif' },
  { id: "newsreader", nombre: "Newsreader (editorial)", familia: '"Newsreader Variable", "Newsreader", Georgia, serif' },
];

export const FUENTES_TEXTO: OpcionFuente[] = [
  { id: "jost", nombre: "Jost (geométrica, elegante)", familia: '"Jost Variable", "Jost", "Helvetica Neue", Arial, sans-serif' },
  { id: "instrument", nombre: "Instrument Sans", familia: '"Instrument Sans Variable", "Instrument Sans", "Helvetica Neue", Arial, sans-serif' },
  { id: "dm", nombre: "DM Sans", familia: '"DM Sans Variable", "DM Sans", "Helvetica Neue", Arial, sans-serif' },
];

export function familiaTitulos(id: string) {
  return (FUENTES_TITULOS.find((f) => f.id === id) ?? FUENTES_TITULOS[0]).familia;
}

export function familiaTexto(id: string) {
  return (FUENTES_TEXTO.find((f) => f.id === id) ?? FUENTES_TEXTO[0]).familia;
}

/** Letra de impresora térmica para el ticket. */
export const FUENTE_TICKET = '"Courier Prime", "Courier New", Courier, monospace';
