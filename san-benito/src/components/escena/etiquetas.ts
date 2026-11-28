import * as THREE from "three";
import { textoSobre } from "@/lib/formato";
import type { Marca3D } from "@/lib/marca";
import type { Producto } from "@/lib/tipos";

export type FormatoEtiqueta = "envolvente" | "frente";

const cache = new Map<string, THREE.CanvasTexture>();

/** Parte el nombre en líneas y busca el tamaño de letra más grande que entra en la caja. */
function ajustarTexto(ctx: CanvasRenderingContext2D, texto: string, fuente: string, anchoMax: number, altoMax: number) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  for (let tam = Math.floor(altoMax * 0.6); tam >= 16; tam -= 3) {
    ctx.font = `500 ${tam}px ${fuente}`;
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
    if (entra && lineas.length <= 3 && lineas.length * tam * 1.02 <= altoMax) return { tam, lineas };
  }
  return { tam: 16, lineas: [texto] };
}

/** Doble filete dorado, como en las etiquetas impresas de almacén. */
function filete(ctx: CanvasRenderingContext2D, x: number, y: number, ancho: number, oro: string, grosor: number) {
  ctx.fillStyle = oro;
  ctx.fillRect(x, y, ancho, grosor * 2);
  ctx.fillRect(x, y + grosor * 4, ancho, grosor);
}

function dibujarBloque(
  ctx: CanvasRenderingContext2D,
  p: Producto,
  m: Marca3D,
  cx: number,
  cy: number,
  anchoMax: number,
  altoMax: number,
) {
  const tinta = textoSobre(p.color) === "#000000" ? "#1F1B16" : "#FBF7EF";
  const { tam, lineas } = ajustarTexto(ctx, p.nombre, m.titulos, anchoMax, altoMax * 0.66);
  const interlinea = tam * 1.02;
  const altoTexto = lineas.length * interlinea;
  const tamPres = Math.round(Math.min(altoMax * 0.11, tam * 0.5));
  const separacion = altoMax * 0.08;
  const total = altoTexto + (p.presentacion ? separacion + tamPres * 1.9 : 0);
  let y = cy - total / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = tinta;
  ctx.font = `500 ${tam}px ${m.titulos}`;
  for (const linea of lineas) {
    ctx.fillText(linea, cx, y);
    y += interlinea;
  }

  if (p.presentacion) {
    y += separacion;
    ctx.font = `500 ${tamPres}px ${m.texto}`;
    const ancho = ctx.measureText(p.presentacion).width + tamPres * 1.6;
    const alto = tamPres * 1.9;
    ctx.strokeStyle = m.oro;
    ctx.lineWidth = Math.max(2, tamPres * 0.08);
    ctx.beginPath();
    ctx.roundRect(cx - ancho / 2, y, ancho, alto, alto / 2);
    ctx.stroke();
    ctx.fillStyle = tinta;
    ctx.textBaseline = "middle";
    ctx.fillText(p.presentacion, cx, y + alto / 2 + 1);
  }
}

export function texturaEtiqueta(p: Producto, formato: FormatoEtiqueta, m: Marca3D): THREE.CanvasTexture {
  const clave = [formato, p.nombre, p.presentacion, p.color, m.oro, m.titulos, m.texto].join("|");
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

  const g = Math.max(3, Math.round(h * 0.008));
  const margen = h * 0.07;
  filete(ctx, 0, margen, w, m.oro, g);
  filete(ctx, 0, h - margen - g * 5, w, m.oro, g);

  const areaAlto = h - margen * 2 - g * 12;
  if (formato === "envolvente") {
    // Se dibuja dos veces para que se lea desde cualquier lado mientras gira.
    dibujarBloque(ctx, p, m, w * 0.25, h / 2, w * 0.38, areaAlto * 0.9);
    dibujarBloque(ctx, p, m, w * 0.75, h / 2, w * 0.38, areaAlto * 0.9);
  } else {
    dibujarBloque(ctx, p, m, w / 2, h / 2, w * 0.8, areaAlto * 0.72);
  }

  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;
  textura.needsUpdate = true;
  cache.set(clave, textura);
  return textura;
}
