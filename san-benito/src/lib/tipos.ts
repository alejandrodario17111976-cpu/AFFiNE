export const ENVASES = ["frasco", "botella", "lata", "caja", "carton", "bolsa"] as const;
export type Envase = (typeof ENVASES)[number];

export const NOMBRES_ENVASE: Record<Envase, string> = {
  frasco: "Frasco de vidrio",
  botella: "Botella",
  lata: "Lata",
  caja: "Caja",
  carton: "Cartón (tipo leche)",
  bolsa: "Bolsa o paquete",
};

/** Cada pasillo toma uno de los tres colores de la marca. */
export const COLORES_CATEGORIA = ["principal", "acento", "destacado"] as const;
export type ColorCategoria = (typeof COLORES_CATEGORIA)[number];

export const NOMBRES_COLOR: Record<ColorCategoria, string> = {
  principal: "Color principal",
  acento: "Color de acento",
  destacado: "Color destacado",
};

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  presentacion: string;
  precio: number;
  /** Precio antes de la oferta. Si es mayor que `precio`, el producto aparece en Ofertas. */
  precioAnterior: number | null;
  disponible: boolean;
  destacado: boolean;
  envase: Envase;
  /** Color principal de la etiqueta o del envase (hex). */
  color: string;
  /** Color de tapa, cierre y detalles (hex). */
  colorSecundario: string;
  /** Color del contenido visible en frascos y botellas (hex). Vacío = automático. */
  contenido: string;
  /** Ruta opcional a un modelo 3D propio (.glb) dentro de /public, por ejemplo "/modelos/yerba.glb". */
  modelo: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  color: ColorCategoria;
}

export interface Negocio {
  nombre: string;
  eslogan: string;
  /** Número con código de país, solo dígitos. Ejemplo: 5491112345678 */
  whatsapp: string;
  direccion: string;
  horarios: string;
  /** Usuario de Instagram sin @ */
  instagram: string;
  locale: string;
  moneda: string;
}

export interface Apariencia {
  /** Azul lapislázuli: portada, encabezado y pie. */
  colorPrincipal: string;
  /** Dorado: botones principales, precios y detalles. */
  colorAcento: string;
  /** Carmesí: ofertas y descuentos. */
  colorDestacado: string;
  /** Marfil: fondo de las secciones claras. */
  colorFondo: string;
  fuenteTitulos: string;
  fuenteTexto: string;
}

export interface PasoCompra {
  titulo: string;
  texto: string;
}

export interface Textos {
  portadaTexto: string;
  botonProductos: string;
  botonOfertas: string;
  productosTitulo: string;
  productosTexto: string;
  pasillosTitulo: string;
  pasillosTexto: string;
  ofertasTitulo: string;
  ofertasTexto: string;
  comoComprarTitulo: string;
  pasos: PasoCompra[];
  pieTexto: string;
}

export interface Secciones {
  pasillos: boolean;
  ofertas: boolean;
  comoComprar: boolean;
}

export interface Tienda {
  negocio: Negocio;
  apariencia: Apariencia;
  textos: Textos;
  secciones: Secciones;
  categorias: Categoria[];
  productos: Producto[];
}
