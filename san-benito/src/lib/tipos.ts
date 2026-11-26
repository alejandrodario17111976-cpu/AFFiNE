export const ENVASES = ["frasco", "botella", "lata", "caja", "carton", "bolsa", "recorte"] as const;
export type Envase = (typeof ENVASES)[number];

export const NOMBRES_ENVASE: Record<Envase, string> = {
  frasco: "Frasco de vidrio",
  botella: "Botella",
  lata: "Lata",
  caja: "Caja",
  carton: "Cartón (tipo leche)",
  bolsa: "Bolsa o paquete",
  recorte: "Foto recortada (plana)",
};

/** Cada pasillo toma uno de los tres colores de la marca. */
export const COLORES_CATEGORIA = ["principal", "acento", "destacado"] as const;
export type ColorCategoria = (typeof COLORES_CATEGORIA)[number];

export const NOMBRES_COLOR: Record<ColorCategoria, string> = {
  principal: "Color principal",
  acento: "Color de acento",
  destacado: "Color destacado",
};

/** Precio especial llevando cierta cantidad, por ejemplo 2 por $2.690. */
export interface Promo {
  cantidad: number;
  precio: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  presentacion: string;
  /** Texto corto opcional debajo del nombre (variedades, marcas incluidas, etc.). */
  descripcion: string;
  precio: number;
  /** Precios por cantidad (2x, 3x, 10x...). */
  promos: Promo[];
  /** Aparece en la sección Ofertas aunque no tenga precio anterior ni promos. */
  enOferta: boolean;
  /** Foto del producto (idealmente recortada, sin fondo). Se muestra en 3D. */
  imagen: string;
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

export interface Sucursal {
  nombre: string;
  direccion: string;
}

export interface Negocio {
  nombre: string;
  eslogan: string;
  sucursales: Sucursal[];
  /** Provincia o región, para que los enlaces al mapa encuentren la dirección. */
  provincia: string;
  telefono: string;
  /** Número con código de país, solo dígitos. Ejemplo: 5492634123456 */
  whatsapp: string;
  horarios: string;
  /** Usuario de Instagram sin @ */
  instagram: string;
  /** Dirección completa de la página de Facebook */
  facebook: string;
  /** Usuario de TikTok sin @ */
  tiktok: string;
  locale: string;
  moneda: string;
}

export interface Afiche {
  imagen: string;
  titulo: string;
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
  afichesTitulo: string;
  afichesTexto: string;
  comoComprarTitulo: string;
  pasos: PasoCompra[];
  pieTexto: string;
}

export interface Secciones {
  pasillos: boolean;
  ofertas: boolean;
  afiches: boolean;
  comoComprar: boolean;
}

export interface Tienda {
  negocio: Negocio;
  apariencia: Apariencia;
  textos: Textos;
  secciones: Secciones;
  categorias: Categoria[];
  productos: Producto[];
  afiches: Afiche[];
}
