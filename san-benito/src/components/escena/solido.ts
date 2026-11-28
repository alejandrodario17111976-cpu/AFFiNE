import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Sólidos a partir de la foto recortada de cada producto, con el método de un CAD
 * (como SolidCraft): croquis → operación → redondeo de aristas.
 *
 * - El croquis es la silueta de la foto (su transparencia).
 * - Botellas, latas y frascos: revolución del perfil de la silueta, fila por fila
 *   (cuello, hombros y tapa salen de la foto misma).
 * - Bolsas, cajas y fotos planas: extrusión del contorno con espesor, aristas
 *   redondeadas (filete) y, en las bolsas, el abultado del paquete lleno.
 *
 * La foto no se toca: se proyecta de frente, así el producto mirado de frente es
 * exactamente la imagen original, y los costados toman los colores de su borde.
 */

export type Forma = "cilindro" | "bolsa" | "caja" | "plana";

type Imagen = CanvasImageSource & { width: number; height: number };

interface Mascara {
  w: number;
  h: number;
  /** Cobertura 0..1 por celda; la fila 0 es la de arriba. */
  a: Float32Array;
}

function leerMascara(imagen: Imagen, filas: number): Mascara {
  const h = filas;
  const w = Math.max(8, Math.round((imagen.width / imagen.height) * filas));
  const lienzo = document.createElement("canvas");
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  const a = new Float32Array(w * h);
  if (!ctx) return { w, h, a: a.fill(1) };
  ctx.drawImage(imagen, 0, 0, w, h);
  const datos = ctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < w * h; i++) a[i] = datos[i * 4 + 3] / 255;
  return { w, h, a };
}

/** Medidas del producto en la escena: 2,3 de alto, o 2,7 de ancho si es muy ancho. */
export function medidas(imagen: Imagen) {
  const aspecto = imagen.width / imagen.height;
  let alto = 2.3;
  let ancho = alto * aspecto;
  if (ancho > 2.7) {
    ancho = 2.7;
    alto = ancho / aspecto;
  }
  return { ancho, alto };
}

/* ---------- Revolución (botellas, latas, frascos) ---------- */

function solidoDeRevolucion(m: Mascara, alto: number, segmentos = 56) {
  const s = alto / m.h;
  // Extensión de la silueta en cada fila
  const filas: { j: number; x0: number; x1: number }[] = [];
  for (let j = 0; j < m.h; j++) {
    let x0 = -1;
    let x1 = -1;
    for (let i = 0; i < m.w; i++) {
      if (m.a[j * m.w + i] > 0.5) {
        if (x0 < 0) x0 = i;
        x1 = i;
      }
    }
    if (x0 >= 0) filas.push({ j, x0, x1 });
  }
  if (filas.length < 2) return null;
  // Radio suavizado (mediana de 3 y promedio de 3) para que el perfil no tenga escalones
  const r0 = filas.map((f) => ((f.x1 - f.x0 + 1) / 2) * s);
  const med = r0.map((_, k) => {
    const v = [r0[Math.max(0, k - 1)], r0[k], r0[Math.min(r0.length - 1, k + 1)]].sort((a, b) => a - b);
    return v[1];
  });
  const radio = med.map((_, k) => (med[Math.max(0, k - 1)] + med[k] * 2 + med[Math.min(med.length - 1, k + 1)]) / 4);

  // Perfil de abajo hacia arriba, cerrado con un punto en el eje en cada punta
  type Punto = { r: number; y: number; x0: number; x1: number; v: number };
  const perfil: Punto[] = [];
  for (let k = filas.length - 1; k >= 0; k--) {
    const f = filas[k];
    perfil.push({ r: radio[k], y: alto / 2 - (f.j + 0.5) * s, x0: f.x0 + 0.5, x1: f.x1 + 0.5, v: 1 - (f.j + 0.5) / m.h });
  }
  const abajo = perfil[0];
  const arriba = perfil[perfil.length - 1];
  perfil.unshift({ ...abajo, r: 0, y: abajo.y - s * 0.5 });
  perfil.push({ ...arriba, r: 0, y: arriba.y + s * 0.5 });

  const n = perfil.length;
  const pos = new Float32Array((segmentos + 1) * n * 3);
  const uv = new Float32Array((segmentos + 1) * n * 2);
  for (let i = 0; i <= segmentos; i++) {
    const phi = -Math.PI + (i / segmentos) * Math.PI * 2;
    const sen = Math.sin(phi);
    const cos = Math.cos(phi);
    for (let j = 0; j < n; j++) {
      const p = perfil[j];
      const k = i * n + j;
      pos[k * 3] = p.r * sen;
      pos[k * 3 + 1] = p.y;
      pos[k * 3 + 2] = p.r * cos;
      // Proyección de frente sobre la extensión real de la fila: de frente es la foto tal cual
      uv[k * 2] = (p.x0 + ((sen + 1) / 2) * (p.x1 - p.x0)) / m.w;
      uv[k * 2 + 1] = p.v;
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < segmentos; i++) {
    for (let j = 0; j < n - 1; j++) {
      const a = i * n + j;
      const b = a + n;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/* ---------- Extrusión con filete (bolsas, cajas, fotos planas) ---------- */

interface Extrusion {
  /** Espesor total. */
  grosor: number;
  /** Radio del redondeo de las aristas. */
  filete: number;
  /** Cuánto se abulta el frente en el centro (bolsas llenas). */
  bulto: number;
  /** Abultado del dorso, en proporción al del frente. */
  bultoAtras: number;
  /** Hasta qué parte del interior crece el abultado (0..1 de la distancia máxima al borde). */
  alcance: number;
}

const PARAMETROS: Record<Exclude<Forma, "cilindro">, (ancho: number) => Extrusion> = {
  bolsa: (ancho) => ({ grosor: 0.1, filete: 0.05, bulto: Math.min(0.26, ancho * 0.13), bultoAtras: 0.75, alcance: 0.55 }),
  caja: (ancho) => ({ grosor: THREE.MathUtils.clamp(ancho * 0.3, 0.2, 0.55), filete: 0.06, bulto: 0.012, bultoAtras: 1, alcance: 0.2 }),
  plana: () => ({ grosor: 0.05, filete: 0.022, bulto: 0.008, bultoAtras: 1, alcance: 0.3 }),
};

/** Se queda con la pieza más grande de la silueta (descarta motas sueltas). */
function piezaMayor(m: Mascara) {
  const dentro = new Uint8Array(m.w * m.h);
  for (let i = 0; i < dentro.length; i++) dentro[i] = m.a[i] > 0.5 ? 1 : 0;
  const etiqueta = new Int32Array(dentro.length);
  let mejor = 0;
  let mejorTam = 0;
  let siguiente = 1;
  const cola = new Int32Array(dentro.length);
  for (let k = 0; k < dentro.length; k++) {
    if (!dentro[k] || etiqueta[k]) continue;
    let ini = 0;
    let fin = 0;
    cola[fin++] = k;
    etiqueta[k] = siguiente;
    while (ini < fin) {
      const c = cola[ini++];
      const x = c % m.w;
      const y = (c / m.w) | 0;
      const vecinos = [x > 0 ? c - 1 : -1, x < m.w - 1 ? c + 1 : -1, y > 0 ? c - m.w : -1, y < m.h - 1 ? c + m.w : -1];
      for (const v of vecinos) {
        if (v >= 0 && dentro[v] && !etiqueta[v]) {
          etiqueta[v] = siguiente;
          cola[fin++] = v;
        }
      }
    }
    if (fin > mejorTam) {
      mejorTam = fin;
      mejor = siguiente;
    }
    siguiente++;
  }
  for (let k = 0; k < dentro.length; k++) dentro[k] = etiqueta[k] === mejor ? 1 : 0;
  return dentro;
}

/** Distancia de cada celda interior al borde (en celdas), aproximación 3-4. */
function distancias(dentro: Uint8Array, w: number, h: number) {
  const INF = 1e9;
  const d = new Float32Array(w * h);
  for (let k = 0; k < d.length; k++) d[k] = dentro[k] ? INF : 0;
  const en = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      if (!d[k]) continue;
      d[k] = Math.min(d[k], en(x - 1, y) + 3, en(x, y - 1) + 3, en(x - 1, y - 1) + 4, en(x + 1, y - 1) + 4);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const k = y * w + x;
      if (!d[k]) continue;
      d[k] = Math.min(d[k], en(x + 1, y) + 3, en(x, y + 1) + 3, en(x + 1, y + 1) + 4, en(x - 1, y + 1) + 4);
    }
  }
  // a celdas, y del centro de la celda al borde (media celda menos)
  for (let k = 0; k < d.length; k++) d[k] = d[k] ? Math.max(0, d[k] / 3 - 0.5) : 0;
  return d;
}

/**
 * Contorno exterior con marching squares: puntos en los bordes entre celdas de adentro y
 * de afuera, en orden. Coordenadas en celdas (el centro de la celda i está en i).
 */
function contorno(dentro: Uint8Array, w: number, h: number): [number, number][] {
  const en = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : dentro[y * w + x]);
  const clave = (x2: number, y2: number) => x2 * 100003 + y2;
  const puntos = new Map<number, [number, number]>();
  const vecinos = new Map<number, number[]>();
  const unir = (a: [number, number], b: [number, number]) => {
    const ka = clave(a[0], a[1]);
    const kb = clave(b[0], b[1]);
    puntos.set(ka, a);
    puntos.set(kb, b);
    if (!vecinos.has(ka)) vecinos.set(ka, []);
    if (!vecinos.has(kb)) vecinos.set(kb, []);
    vecinos.get(ka)!.push(kb);
    vecinos.get(kb)!.push(ka);
  };
  for (let j = -1; j < h; j++) {
    for (let i = -1; i < w; i++) {
      const caso = en(i, j) * 8 + en(i + 1, j) * 4 + en(i + 1, j + 1) * 2 + en(i, j + 1);
      if (caso === 0 || caso === 15) continue;
      const T: [number, number] = [2 * i + 1, 2 * j];
      const R: [number, number] = [2 * i + 2, 2 * j + 1];
      const B: [number, number] = [2 * i + 1, 2 * j + 2];
      const L: [number, number] = [2 * i, 2 * j + 1];
      switch (caso) {
        case 1: case 14: unir(L, B); break;
        case 2: case 13: unir(B, R); break;
        case 3: case 12: unir(L, R); break;
        case 4: case 11: unir(T, R); break;
        case 6: case 9: unir(T, B); break;
        case 7: case 8: unir(T, L); break;
        case 5: unir(T, R); unir(L, B); break;
        case 10: unir(T, L); unir(B, R); break;
      }
    }
  }
  // Encadenar los segmentos en lazos y quedarse con el más largo
  const visto = new Set<number>();
  let mejor: number[] = [];
  for (const inicio of vecinos.keys()) {
    if (visto.has(inicio)) continue;
    const lazo = [inicio];
    visto.add(inicio);
    let previo = -1;
    let actual = inicio;
    for (;;) {
      const sig = (vecinos.get(actual) ?? []).find((v) => v !== previo && !visto.has(v));
      if (sig === undefined) break;
      lazo.push(sig);
      visto.add(sig);
      previo = actual;
      actual = sig;
    }
    if (lazo.length > mejor.length) mejor = lazo;
  }
  return mejor.map((k) => {
    const [x2, y2] = puntos.get(k)!;
    return [x2 / 2, y2 / 2] as [number, number];
  });
}

/** Suaviza el contorno (promedio móvil cerrado) y lo reduce a un máximo de puntos. */
function suavizar(p: [number, number][], maximo = 200) {
  let actual = p;
  for (let pasada = 0; pasada < 2; pasada++) {
    const n = actual.length;
    actual = actual.map((_, i) => {
      let x = 0;
      let y = 0;
      for (let k = -2; k <= 2; k++) {
        const q = actual[(i + k + n) % n];
        x += q[0];
        y += q[1];
      }
      return [x / 5, y / 5] as [number, number];
    });
  }
  const paso = Math.max(1, Math.ceil(actual.length / maximo));
  return actual.filter((_, i) => i % paso === 0);
}

function solidoExtruido(m: Mascara, ancho: number, alto: number, forma: Exclude<Forma, "cilindro">) {
  const P = PARAMETROS[forma](ancho);
  const s = alto / m.h;
  const dentro = piezaMayor(m);
  const dist = distancias(dentro, m.w, m.h);
  let dMax = 0;
  for (let k = 0; k < dist.length; k++) dMax = Math.max(dMax, dist[k]);
  const filete = Math.min(P.filete, P.grosor / 2);
  const base = P.grosor / 2 - filete;
  const alcance = Math.max(1e-3, P.alcance * dMax * s);
  // Altura de la cara a una distancia d del borde: filete (cuarto de círculo) + abultado
  const altura = (d: number, bulto: number) => {
    const t = Math.min(d, filete) / filete;
    const redondeo = filete * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
    const u = Math.min(1, d / alcance);
    return base + redondeo + bulto * (1 - (1 - u) * (1 - u));
  };
  const X = (i: number) => (i + 0.5) * s - ancho / 2;
  const Y = (j: number) => alto / 2 - (j + 0.5) * s;

  // Caras: una grilla en los centros de las celdas, solo donde hay producto cerca
  const cara = (signo: 1 | -1) => {
    const bulto = signo === 1 ? P.bulto : P.bulto * P.bultoAtras;
    const indiceDe = new Int32Array(m.w * m.h).fill(-1);
    const pos: number[] = [];
    const uv: number[] = [];
    const usar = (i: number, j: number) => {
      const k = j * m.w + i;
      if (indiceDe[k] < 0) {
        indiceDe[k] = pos.length / 3;
        pos.push(X(i), Y(j), signo * altura(dist[k] * s, bulto));
        uv.push((i + 0.5) / m.w, 1 - (j + 0.5) / m.h);
      }
      return indiceDe[k];
    };
    const indices: number[] = [];
    for (let j = 0; j < m.h - 1; j++) {
      for (let i = 0; i < m.w - 1; i++) {
        const k = j * m.w + i;
        if (!(dentro[k] || dentro[k + 1] || dentro[k + m.w] || dentro[k + m.w + 1])) continue;
        const a = usar(i, j);
        const b = usar(i + 1, j);
        const c = usar(i, j + 1);
        const d = usar(i + 1, j + 1);
        if (signo === 1) indices.push(a, c, b, b, c, d);
        else indices.push(a, b, c, b, d, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  };

  // Costado: el contorno extruido, con el color del borde de la foto
  const lazo = suavizar(contorno(dentro, m.w, m.h));
  const n = lazo.length;
  const geos = [cara(1), cara(-1)];
  if (n > 3) {
    const pos: number[] = [];
    const uv: number[] = [];
    const arriba = base;
    for (let k = 0; k < n; k++) {
      const [cx, cy] = lazo[k];
      const [ax, ay] = lazo[(k - 1 + n) % n];
      const [bx, by] = lazo[(k + 1) % n];
      // normal hacia adentro (la que cae en una celda del producto) para tomar el color del borde
      let nx = -(by - ay);
      let ny = bx - ax;
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      const prueba = (dx: number, dy: number) => {
        const i = Math.round(cx + dx * 1.5);
        const j = Math.round(cy + dy * 1.5);
        return i >= 0 && j >= 0 && i < m.w && j < m.h && dentro[j * m.w + i] === 1;
      };
      if (!prueba(nx, ny) && prueba(-nx, -ny)) {
        nx = -nx;
        ny = -ny;
      }
      const u = (cx + nx * 1.5 + 0.5) / m.w;
      const v = 1 - (cy + ny * 1.5 + 0.5) / m.h;
      for (const z of [arriba, -arriba]) {
        pos.push(X(cx), Y(cy), z);
        uv.push(u, v);
      }
    }
    const indices: number[] = [];
    for (let k = 0; k < n; k++) {
      const a = k * 2;
      const b = ((k + 1) % n) * 2;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    geos.push(g);
  }
  const todo = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return todo;
}

/** Arma el sólido de un producto a partir de su foto recortada. */
export function crearSolido(imagen: Imagen, forma: Forma): THREE.BufferGeometry {
  const { ancho, alto } = medidas(imagen);
  try {
    if (forma === "cilindro") {
      const g = solidoDeRevolucion(leerMascara(imagen, 120), alto);
      if (g) return g;
    } else {
      const g = solidoExtruido(leerMascara(imagen, 72), ancho, alto, forma);
      if (g) return g;
    }
  } catch {
    /* si algo falla, queda una tarjeta plana con la foto */
  }
  return new THREE.PlaneGeometry(ancho, alto);
}
