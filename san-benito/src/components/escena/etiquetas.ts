import * as THREE from "three";
import { textoSobre } from "@/lib/formato";
import type { Producto } from "@/lib/tipos";

export type FormatoEtiqueta = "envolvente" | "frente";

const FUENTE_DISPLAY = '"Arial Black", "Arial Bold", Gadget, "Helvetica Neue", Helvetica, Arial, sans-serif';
const FUENTE_MONO = '"Courier New", Courier, monospace';

const cache = new Map<string, THREE.CanvasTexture>();

/** Parte el nombre en líneas y busca el tamaño de letra más grande que entra en la caja. */
function ajustarTexto(ctx: CanvasRenderingContext2D, texto: string, anchoMax: number, altoMax: number) {
  const palabras = texto.toUpperCase().split(/\s+/).filter(Boolean);
  for (let tam = Math.floor(altoMax * 0.62); tam >= 18; tam -= 4) {
    ctx.font = `900 ${tam}px ${FUENTE_DISPLAY}`;
    const lineas: string[] = [];
    let actual = "";
    let entra = true;
    for (const palabra of palabras) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (ctx.measureText(prueba).width <= anchoMax) {
        actual = prueba;
      } else {
        if (actual) lineas.push(actual);
        actual = palabra;
        if (ctx.measureText(palabra).width > anchoMax) entra = false;
      }
    }
    if (actual) lineas.push(actual);
    if (entra && lineas.length <= 3 && lineas.length * tam * 0.92 <= altoMax) return { tam, lineas };
  }
  ctx.font = `900 18px ${FUENTE_DISPLAY}`;
  return { tam: 18, lineas: [texto.toUpperCase()] };
}

function dibujarBloque(
  ctx: CanvasRenderingContext2D,
  p: Producto,
  cx: number,
  cy: number,
  anchoMax: number,
  altoMax: number,
) {
  const tinta = textoSobre(p.color);
  const altoNombre = altoMax * 0.72;
  const { tam, lineas } = ajustarTexto(ctx, p.nombre, anchoMax, altoNombre);
  const interlinea = tam * 0.92;
  const altoTexto = lineas.length * interlinea;
  const hayPresentacion = Boolean(p.presentacion);
  const altoPildora = hayPresentacion ? Math.min(altoMax * 0.22, tam * 0.75) : 0;
  const total = altoTexto + (hayPresentacion ? altoPildora + altoMax * 0.06 : 0);
  let y = cy - total / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = tinta;
  ctx.font = `900 ${tam}px ${FUENTE_DISPLAY}`;
  for (const linea of lineas) {
    ctx.fillText(linea, cx, y);
    y += interlinea;
  }

  if (hayPresentacion) {
    y += altoMax * 0.06;
    const tamPres = Math.floor(altoPildora * 0.62);
    ctx.font = `700 ${tamPres}px ${FUENTE_MONO}`;
    const anchoPildora = ctx.measureText(p.presentacion).width + tamPres * 1.4;
    const fondo = p.colorSecundario.toUpperCase() === p.color.toUpperCase() ? tinta : p.colorSecundario;
    ctx.fillStyle = "#000000";
    ctx.fillRect(cx - anchoPildora / 2 + 6, y + 6, anchoPildora, altoPildora);
    ctx.fillStyle = fondo;
    ctx.fillRect(cx - anchoPildora / 2, y, anchoPildora, altoPildora);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 5;
    ctx.strokeRect(cx - anchoPildora / 2, y, anchoPildora, altoPildora);
    ctx.fillStyle = textoSobre(fondo);
    ctx.textBaseline = "middle";
    ctx.fillText(p.presentacion, cx, y + altoPildora / 2 + 2);
  }
}

/** Franja de la marca (rojo, amarillo, azul) con un filo negro: se repite en todas las etiquetas. */
function dibujarFranjas(ctx: CanvasRenderingContext2D, w: number, h: number, alto: number) {
  ["#FF0000", "#FFFF00", "#0000FF"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect((i * w) / 3, h - alto, w / 3 + 1, alto);
  });
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, h - alto - 10, w, 10);
  ctx.fillRect(0, 0, w, 10);
}

export function texturaEtiqueta(p: Producto, formato: FormatoEtiqueta): THREE.CanvasTexture {
  const clave = [formato, p.nombre, p.presentacion, p.color, p.colorSecundario].join("|");
  const guardada = cache.get(clave);
  if (guardada) return guardada;

  const [w, h] = formato === "envolvente" ? [2048, 512] : [768, 1024];
  const lienzo = document.createElement("canvas");
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear la etiqueta");

  ctx.fillStyle = p.color;
  ctx.fillRect(0, 0, w, h);
  const altoFranja = h * (formato === "envolvente" ? 0.13 : 0.08);
  dibujarFranjas(ctx, w, h, altoFranja);

  const areaAlto = h - altoFranja - 20;
  if (formato === "envolvente") {
    // Se dibuja dos veces para que se lea desde cualquier lado mientras gira.
    dibujarBloque(ctx, p, w * 0.25, areaAlto / 2 + 10, w * 0.4, areaAlto * 0.86);
    dibujarBloque(ctx, p, w * 0.75, areaAlto / 2 + 10, w * 0.4, areaAlto * 0.86);
  } else {
    dibujarBloque(ctx, p, w / 2, areaAlto / 2 + 10, w * 0.84, areaAlto * 0.7);
  }

  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;
  textura.needsUpdate = true;
  cache.set(clave, textura);
  return textura;
}
