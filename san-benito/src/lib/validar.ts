import { FUENTES_TEXTO, FUENTES_TITULOS } from "./fuentes";
import {
  COLORES_CATEGORIA,
  ENVASES,
  type Apariencia,
  type Categoria,
  type ColorCategoria,
  type Envase,
  type Negocio,
  type Producto,
  type Secciones,
  type Textos,
  type Tienda,
} from "./tipos";

export const APARIENCIA_INICIAL: Apariencia = {
  colorPrincipal: "#26619C",
  colorAcento: "#C9A44C",
  colorDestacado: "#A11D33",
  colorFondo: "#F7F3EA",
  fuenteTitulos: "fraunces",
  fuenteTexto: "instrument",
};

export const TEXTOS_INICIALES: Textos = {
  portadaTexto: "Elegí tus productos, armá el ticket y envialo al negocio.",
  botonProductos: "Ver productos",
  botonOfertas: "Ver ofertas",
  productosTitulo: "Productos",
  productosTexto: "",
  pasillosTitulo: "Pasillos",
  pasillosTexto: "Recorré el negocio por pasillo y entrá directo a lo que buscás.",
  ofertasTitulo: "Ofertas",
  ofertasTexto: "",
  comoComprarTitulo: "Cómo comprar",
  pasos: [
    { titulo: "Elegí tus productos", texto: "Sumalos al ticket con el botón Agregar." },
    { titulo: "Revisá tu ticket", texto: "Ajustá las cantidades y mirá el total antes de enviarlo." },
    { titulo: "Envialo al negocio", texto: "Mandalo por WhatsApp o copialo para que te lo confirmen." },
  ],
  pieTexto: "",
};

export const SECCIONES_INICIALES: Secciones = { pasillos: true, ofertas: true, comoComprar: true };

/** Colores de versiones anteriores del sitio. */
const COLORES_VIEJOS: Record<string, ColorCategoria> = { azul: "principal", amarillo: "acento", rojo: "destacado" };

/** Error con un mensaje pensado para mostrarse tal cual en el panel de administración. */
export class ErrorDatos extends Error {}

const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function obj(v: unknown, donde: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new ErrorDatos(`${donde}: formato inválido.`);
  return v as Record<string, unknown>;
}

function texto(v: unknown, donde: string, { max = 120, requerido = true } = {}) {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  if (requerido && !s) throw new ErrorDatos(`${donde} no puede quedar vacío.`);
  if (s.length > max) throw new ErrorDatos(`${donde} es demasiado largo (máximo ${max} caracteres).`);
  return s;
}

function precio(v: unknown, donde: string, permitirVacio = false): number | null {
  if (permitirVacio && (v === null || v === undefined || v === "")) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new ErrorDatos(`${donde} tiene que ser un número mayor o igual a 0.`);
  if (n > 1e10) throw new ErrorDatos(`${donde} es demasiado grande.`);
  return Math.round(n * 100) / 100;
}

function color(v: unknown, donde: string, permitirVacio = false) {
  const s = typeof v === "string" ? v.trim() : "";
  if (permitirVacio && !s) return "";
  if (!HEX.test(s)) throw new ErrorDatos(`${donde} tiene que ser un color como #FF0000.`);
  return s.toUpperCase();
}

export function crearId(nombre: string) {
  return (
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "producto"
  );
}

function normalizarNegocio(v: unknown): Negocio {
  const n = obj(v, "Datos del negocio");
  const whatsapp = texto(n.whatsapp, "WhatsApp", { max: 20, requerido: false }).replace(/\D/g, "");
  const instagram = texto(n.instagram, "Instagram", { max: 40, requerido: false }).replace(/^@/, "");
  if (instagram && !/^[A-Za-z0-9._]+$/.test(instagram)) {
    throw new ErrorDatos("Instagram solo puede tener letras, números, puntos y guiones bajos.");
  }
  const moneda = texto(n.moneda, "Moneda", { max: 3 }).toUpperCase();
  if (!/^[A-Z]{3}$/.test(moneda)) throw new ErrorDatos("La moneda tiene que ser un código de 3 letras, por ejemplo ARS.");
  return {
    nombre: texto(n.nombre, "Nombre del negocio", { max: 40 }),
    eslogan: texto(n.eslogan, "Eslogan", { max: 60 }),
    whatsapp,
    direccion: texto(n.direccion, "Dirección", { max: 160, requerido: false }),
    horarios: texto(n.horarios, "Horarios", { max: 160, requerido: false }),
    instagram,
    locale: texto(n.locale, "Formato regional", { max: 12 }),
    moneda,
  };
}

function normalizarCategoria(v: unknown, i: number): Categoria {
  const c = obj(v, `Categoría ${i + 1}`);
  const nombre = texto(c.nombre, `Nombre de la categoría ${i + 1}`, { max: 40 });
  const id = texto(c.id, `Código de la categoría ${i + 1}`, { max: 60, requerido: false }) || crearId(nombre);
  if (!ID.test(id)) throw new ErrorDatos(`El código de la categoría "${nombre}" no es válido.`);
  const col = (COLORES_VIEJOS[c.color as string] ?? c.color) as ColorCategoria;
  if (!COLORES_CATEGORIA.includes(col)) throw new ErrorDatos(`La categoría "${nombre}" tiene un color inválido.`);
  return { id, nombre, color: col };
}

function normalizarProducto(v: unknown, i: number, categorias: Set<string>): Producto {
  const p = obj(v, `Producto ${i + 1}`);
  const nombre = texto(p.nombre, `Nombre del producto ${i + 1}`, { max: 60 });
  const id = texto(p.id, `Código de "${nombre}"`, { max: 60, requerido: false }) || crearId(nombre);
  if (!ID.test(id)) throw new ErrorDatos(`El código de "${nombre}" no es válido.`);
  const categoria = texto(p.categoria, `Categoría de "${nombre}"`, { max: 60 });
  if (!categorias.has(categoria)) throw new ErrorDatos(`"${nombre}" tiene una categoría que no existe.`);
  const envase = p.envase as Envase;
  if (!ENVASES.includes(envase)) throw new ErrorDatos(`"${nombre}" tiene un tipo de envase inválido.`);
  const modelo = texto(p.modelo, `Modelo 3D de "${nombre}"`, { max: 200, requerido: false });
  if (modelo && !/^\/[A-Za-z0-9._\-/]+\.glb$/.test(modelo)) {
    throw new ErrorDatos(`El modelo 3D de "${nombre}" tiene que ser una ruta como /modelos/archivo.glb.`);
  }
  const precioActual = precio(p.precio, `El precio de "${nombre}"`) as number;
  let anterior = precio(p.precioAnterior, `El precio anterior de "${nombre}"`, true);
  if (anterior !== null && anterior <= precioActual) anterior = null;
  return {
    id,
    nombre,
    categoria,
    presentacion: texto(p.presentacion, `Presentación de "${nombre}"`, { max: 30, requerido: false }),
    precio: precioActual,
    precioAnterior: anterior,
    disponible: p.disponible !== false,
    destacado: p.destacado === true,
    envase,
    color: color(p.color, `El color de "${nombre}"`),
    colorSecundario: color(p.colorSecundario, `El color de detalles de "${nombre}"`),
    contenido: color(p.contenido, `El color del contenido de "${nombre}"`, true),
    modelo,
  };
}

function normalizarApariencia(v: unknown): Apariencia {
  const a = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const fuente = (valor: unknown, opciones: { id: string }[], predeterminada: string) =>
    typeof valor === "string" && opciones.some((o) => o.id === valor) ? valor : predeterminada;
  const col = (valor: unknown, nombre: string, predeterminado: string) =>
    valor == null || valor === "" ? predeterminado : color(valor, nombre);
  return {
    colorPrincipal: col(a.colorPrincipal, "El color principal", APARIENCIA_INICIAL.colorPrincipal),
    colorAcento: col(a.colorAcento, "El color de acento", APARIENCIA_INICIAL.colorAcento),
    colorDestacado: col(a.colorDestacado, "El color destacado", APARIENCIA_INICIAL.colorDestacado),
    colorFondo: col(a.colorFondo, "El color de fondo", APARIENCIA_INICIAL.colorFondo),
    fuenteTitulos: fuente(a.fuenteTitulos, FUENTES_TITULOS, APARIENCIA_INICIAL.fuenteTitulos),
    fuenteTexto: fuente(a.fuenteTexto, FUENTES_TEXTO, APARIENCIA_INICIAL.fuenteTexto),
  };
}

function normalizarTextos(v: unknown): Textos {
  const t = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const campo = (clave: Exclude<keyof Textos, "pasos">, nombre: string, max = 160) =>
    t[clave] === undefined ? TEXTOS_INICIALES[clave] : texto(t[clave], nombre, { max, requerido: false });
  const pasosEntrada = Array.isArray(t.pasos) ? t.pasos : TEXTOS_INICIALES.pasos;
  if (pasosEntrada.length > 6) throw new ErrorDatos("Puede haber hasta 6 pasos en Cómo comprar.");
  return {
    portadaTexto: campo("portadaTexto", "El texto de la portada", 240),
    botonProductos: campo("botonProductos", "El botón de productos", 40) || TEXTOS_INICIALES.botonProductos,
    botonOfertas: campo("botonOfertas", "El botón de ofertas", 40) || TEXTOS_INICIALES.botonOfertas,
    productosTitulo: campo("productosTitulo", "El título de productos", 60) || TEXTOS_INICIALES.productosTitulo,
    productosTexto: campo("productosTexto", "El texto de productos", 240),
    pasillosTitulo: campo("pasillosTitulo", "El título de pasillos", 60) || TEXTOS_INICIALES.pasillosTitulo,
    pasillosTexto: campo("pasillosTexto", "El texto de pasillos", 240),
    ofertasTitulo: campo("ofertasTitulo", "El título de ofertas", 60) || TEXTOS_INICIALES.ofertasTitulo,
    ofertasTexto: campo("ofertasTexto", "El texto de ofertas", 240),
    comoComprarTitulo: campo("comoComprarTitulo", "El título de cómo comprar", 60) || TEXTOS_INICIALES.comoComprarTitulo,
    pasos: pasosEntrada.map((paso, i) => {
      const p = obj(paso, `Paso ${i + 1}`);
      return {
        titulo: texto(p.titulo, `El título del paso ${i + 1}`, { max: 60 }),
        texto: texto(p.texto, `El texto del paso ${i + 1}`, { max: 200, requerido: false }),
      };
    }),
    pieTexto: campo("pieTexto", "El texto del pie", 240),
  };
}

function normalizarSecciones(v: unknown): Secciones {
  const s = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  return {
    pasillos: s.pasillos !== false,
    ofertas: s.ofertas !== false,
    comoComprar: s.comoComprar !== false,
  };
}

/** Valida y limpia los datos de la tienda. Lanza ErrorDatos con un mensaje legible si algo está mal. */
export function normalizarTienda(v: unknown): Tienda {
  const t = obj(v, "Datos de la tienda");
  if (!Array.isArray(t.categorias) || t.categorias.length === 0) {
    throw new ErrorDatos("Tiene que haber al menos una categoría.");
  }
  if (!Array.isArray(t.productos)) throw new ErrorDatos("La lista de productos no es válida.");
  if (t.categorias.length > 30) throw new ErrorDatos("Hay demasiadas categorías (máximo 30).");
  if (t.productos.length > 500) throw new ErrorDatos("Hay demasiados productos (máximo 500).");

  const categorias = t.categorias.map(normalizarCategoria);
  const idsCategoria = new Set<string>();
  for (const c of categorias) {
    if (idsCategoria.has(c.id)) throw new ErrorDatos(`Hay dos categorías con el código "${c.id}".`);
    idsCategoria.add(c.id);
  }

  const productos = t.productos.map((p, i) => normalizarProducto(p, i, idsCategoria));
  const idsProducto = new Set<string>();
  for (const p of productos) {
    if (idsProducto.has(p.id)) throw new ErrorDatos(`Hay dos productos con el código "${p.id}". Cambiá el nombre de uno.`);
    idsProducto.add(p.id);
  }

  return {
    negocio: normalizarNegocio(t.negocio),
    apariencia: normalizarApariencia(t.apariencia),
    textos: normalizarTextos(t.textos),
    secciones: normalizarSecciones(t.secciones),
    categorias,
    productos,
  };
}
