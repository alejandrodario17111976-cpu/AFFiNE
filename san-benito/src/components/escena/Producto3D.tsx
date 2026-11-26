"use client";

import { Component, Suspense, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, RoundedBox, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Envase, Producto } from "@/lib/tipos";
import { urlMedio } from "@/lib/formato";
import { useMarca } from "@/lib/marca";
import { texturaEtiqueta } from "./etiquetas";
import { movimientoReducido, puntero, type Interaccion } from "./compartido";

export type Calidad = "alta" | "normal";

/* ---------- Iluminación y reflejos ---------- */

const entornos = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

/** Reflejos de estudio generados en el navegador (sin descargar imágenes HDR), uno por renderer. */
function entornoDe(gl: THREE.WebGLRenderer) {
  let textura = entornos.get(gl);
  if (!textura) {
    const pmrem = new THREE.PMREMGenerator(gl);
    textura = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    entornos.set(gl, textura);
  }
  return textura;
}

function LuzQueSigueAlPuntero() {
  const luz = useRef<THREE.SpotLight>(null);
  const objetivo = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, delta) => {
    const l = luz.current;
    if (!l) return;
    l.position.x = THREE.MathUtils.damp(l.position.x, puntero.x * 6, 3, delta);
    l.position.y = THREE.MathUtils.damp(l.position.y, 4 + puntero.y * 3, 3, delta);
  });
  return (
    <>
      <primitive object={objetivo} position={[0, 0, 0]} />
      <spotLight ref={luz} position={[0, 4, 6]} angle={0.5} penumbra={0.9} intensity={70} color="#FFE7B8" target={objetivo} />
    </>
  );
}

export function LucesTienda({ dinamica = false }: { dinamica?: boolean }) {
  const gl = useThree((s) => s.gl);
  const entorno = useMemo(() => entornoDe(gl), [gl]);

  return (
    <>
      <Environment map={entorno} />
      <ambientLight intensity={0.45} color="#FFF4E0" />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#FFF1DA" />
      <directionalLight position={[-5, 2.5, -3]} intensity={1.1} color="#B9CBEA" />
      {dinamica && <LuzQueSigueAlPuntero />}
    </>
  );
}

/* ---------- Materiales ---------- */

function Vidrio({ calidad, tinte = "#FFFFFF", opacidad = 0.3 }: { calidad: Calidad; tinte?: string; opacidad?: number }) {
  if (calidad === "alta") {
    return (
      <meshPhysicalMaterial
        color={tinte}
        transmission={1}
        thickness={0.3}
        roughness={0.04}
        ior={1.47}
        clearcoat={1}
        clearcoatRoughness={0.03}
        envMapIntensity={1.6}
        side={THREE.DoubleSide}
        transparent
      />
    );
  }
  return (
    <meshPhysicalMaterial
      color={tinte}
      transparent
      opacity={opacidad}
      roughness={0.03}
      clearcoat={1}
      clearcoatRoughness={0.03}
      envMapIntensity={2}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
}

function Metal({ color = "#D9D9D9" }: { color?: string }) {
  return <meshStandardMaterial color={color} metalness={0.9} roughness={0.22} envMapIntensity={1.4} />;
}

/* ---------- Envases ---------- */

const v2 = (pts: [number, number][]) => pts.map(([x, y]) => new THREE.Vector2(x, y));

const PERFIL_FRASCO = v2([
  [0, 0],
  [0.7, 0],
  [0.78, 0.05],
  [0.8, 0.16],
  [0.8, 1.22],
  [0.74, 1.36],
  [0.62, 1.44],
  [0.6, 1.5],
  [0.6, 1.62],
]);

function Frasco({ p, calidad }: { p: Producto; calidad: Calidad }) {
  const marca = useMarca();
  const etiqueta = useMemo(() => texturaEtiqueta(p, "envolvente", marca), [p, marca]);
  return (
    <group position={[0, -0.97, 0]}>
      <mesh position={[0, 0.63, 0]}>
        <cylinderGeometry args={[0.74, 0.74, 1.12, 64]} />
        <meshPhysicalMaterial color={p.contenido || "#B3141C"} roughness={0.28} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.812, 0.812, 0.74, 96, 1, true]} />
        <meshStandardMaterial map={etiqueta} roughness={0.6} />
      </mesh>
      <mesh>
        <latheGeometry args={[PERFIL_FRASCO, 96]} />
        <Vidrio calidad={calidad} />
      </mesh>
      <mesh position={[0, 1.77, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.3, 64]} />
        <meshStandardMaterial color={p.colorSecundario} metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.935, 0]}>
        <cylinderGeometry args={[0.58, 0.66, 0.04, 64]} />
        <meshStandardMaterial color={p.colorSecundario} metalness={0.55} roughness={0.28} />
      </mesh>
    </group>
  );
}

const PERFIL_BOTELLA = v2([
  [0, 0],
  [0.42, 0],
  [0.48, 0.04],
  [0.5, 0.14],
  [0.5, 1.25],
  [0.47, 1.42],
  [0.32, 1.7],
  [0.21, 1.9],
  [0.19, 2.04],
  [0.19, 2.12],
]);

function Botella({ p, calidad }: { p: Producto; calidad: Calidad }) {
  const marca = useMarca();
  const etiqueta = useMemo(() => texturaEtiqueta(p, "envolvente", marca), [p, marca]);
  const liquido = p.contenido || "#D6ECFF";
  // Cuanto más oscuro el líquido, más opaca se ve la botella.
  const opacidad = useMemo(() => {
    const c = new THREE.Color(liquido);
    const brillo = (c.r + c.g + c.b) / 3;
    return THREE.MathUtils.clamp(1.05 - brillo, 0.32, 0.92);
  }, [liquido]);
  return (
    <group position={[0, -1.17, 0]}>
      <mesh>
        <latheGeometry args={[PERFIL_BOTELLA, 96]} />
        {calidad === "alta" ? (
          <meshPhysicalMaterial
            color={liquido}
            transmission={0.92}
            thickness={0.9}
            roughness={0.05}
            ior={1.4}
            clearcoat={1}
            attenuationColor={liquido}
            attenuationDistance={0.6}
            envMapIntensity={1.6}
            side={THREE.DoubleSide}
            transparent
          />
        ) : (
          <Vidrio calidad="normal" tinte={liquido} opacidad={opacidad} />
        )}
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.506, 0.506, 0.72, 96, 1, true]} />
        <meshStandardMaterial map={etiqueta} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.0, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.2, 0.025, 10, 48]} />
        <meshStandardMaterial color={p.colorSecundario} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.22, 0]}>
        <cylinderGeometry args={[0.215, 0.215, 0.22, 48]} />
        <meshStandardMaterial color={p.colorSecundario} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Lata({ p }: { p: Producto }) {
  const marca = useMarca();
  const etiqueta = useMemo(() => texturaEtiqueta(p, "envolvente", marca), [p, marca]);
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.62, 0.62, 1.2, 96, 1, true]} />
        <meshStandardMaterial map={etiqueta} metalness={0.3} roughness={0.32} />
      </mesh>
      {[0.6, -0.6].map((y) => (
        <group key={y} position={[0, y, 0]}>
          <mesh>
            <cylinderGeometry args={[0.6, 0.6, 0.02, 64]} />
            <Metal />
          </mesh>
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.6, 0.045, 12, 64]} />
            <Metal />
          </mesh>
        </group>
      ))}
      <mesh position={[0.18, 0.63, 0]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[0.1, 0.025, 8, 24]} />
        <Metal color="#BFBFBF" />
      </mesh>
    </group>
  );
}

function useMaterialesCaja(p: Producto) {
  const marca = useMarca();
  return useMemo(() => {
    const etiqueta = texturaEtiqueta(p, "frente", marca);
    const frente = new THREE.MeshStandardMaterial({ map: etiqueta, roughness: 0.55 });
    const lado = new THREE.MeshStandardMaterial({ color: p.colorSecundario, roughness: 0.6 });
    const tapa = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.6 });
    return { frente, lado, tapa };
  }, [p, marca]);
}

function Caja({ p }: { p: Producto }) {
  const { frente, lado, tapa } = useMaterialesCaja(p);
  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z
  const materiales = useMemo(() => [lado, lado, tapa, tapa, frente, frente], [lado, tapa, frente]);
  return (
    <mesh material={materiales}>
      <boxGeometry args={[1.25, 1.75, 0.44]} />
    </mesh>
  );
}

function Carton({ p }: { p: Producto }) {
  const { frente, tapa } = useMaterialesCaja(p);
  const materiales = useMemo(() => [frente, frente, tapa, tapa, frente, frente], [frente, tapa]);
  const techo = useMemo(() => {
    const forma = new THREE.Shape();
    forma.moveTo(-0.46, 0);
    forma.lineTo(0.46, 0);
    forma.lineTo(0, 0.34);
    forma.closePath();
    const g = new THREE.ExtrudeGeometry(forma, { depth: 0.92, bevelEnabled: false });
    g.translate(0, 0, -0.46);
    return g;
  }, []);
  return (
    <group position={[0, -0.18, 0]}>
      <mesh material={materiales}>
        <boxGeometry args={[0.92, 1.5, 0.92]} />
      </mesh>
      <mesh geometry={techo} position={[0, 0.75, 0]}>
        <meshStandardMaterial color={p.color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.16, 0]}>
        <boxGeometry args={[0.05, 0.16, 0.92]} />
        <meshStandardMaterial color={p.colorSecundario} roughness={0.5} />
      </mesh>
      <mesh position={[0.18, 0.98, 0.25]} rotation-z={-0.82}>
        <cylinderGeometry args={[0.07, 0.07, 0.08, 24]} />
        <meshStandardMaterial color={p.colorSecundario} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Bolsa({ p }: { p: Producto }) {
  const marca = useMarca();
  const etiqueta = useMemo(() => texturaEtiqueta(p, "frente", marca), [p, marca]);
  return (
    <group>
      <RoundedBox args={[1.3, 1.78, 0.56]} radius={0.22} smoothness={5}>
        <meshPhysicalMaterial color={p.color} roughness={0.42} clearcoat={0.5} clearcoatRoughness={0.3} />
      </RoundedBox>
      {[1, -1].map((lado) => (
        <mesh key={lado} position={[0, -0.02, lado * 0.281]} rotation-y={lado === 1 ? 0 : Math.PI}>
          <planeGeometry args={[1.0, 1.33]} />
          <meshPhysicalMaterial map={etiqueta} roughness={0.42} clearcoat={0.5} clearcoatRoughness={0.3} />
        </mesh>
      ))}
      {[0.9, -0.9].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.24, 0.12, 0.12]} />
          <meshStandardMaterial color={p.colorSecundario} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function EnvaseProcedural({ p, calidad }: { p: Producto; calidad: Calidad }) {
  switch (p.envase) {
    case "frasco":
      return <Frasco p={p} calidad={calidad} />;
    case "botella":
      return <Botella p={p} calidad={calidad} />;
    case "lata":
      return <Lata p={p} />;
    case "caja":
      return <Caja p={p} />;
    case "carton":
      return <Carton p={p} />;
    case "bolsa":
      return <Bolsa p={p} />;
    case "recorte":
      return <Caja p={p} />;
  }
}

/* ---------- Modelo propio (.glb) ---------- */

function ModeloPropio({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const copia = useMemo(() => {
    const c = scene.clone(true);
    const caja = new THREE.Box3().setFromObject(c);
    const tam = caja.getSize(new THREE.Vector3());
    const escala = 2.1 / Math.max(tam.x, tam.y, tam.z, 0.0001);
    c.scale.setScalar(escala);
    c.position.sub(caja.getCenter(new THREE.Vector3()).multiplyScalar(escala));
    return c;
  }, [scene]);
  return <primitive object={copia} />;
}

class SiFalla extends Component<{ alternativa: ReactNode; children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  render() {
    return this.state.fallo ? this.props.alternativa : this.props.children;
  }
}

/* ---------- Producto ---------- */

/* ---------- Foto real del producto, con volumen ---------- */

type Forma = "cilindro" | "bolsa" | "plana";

function formaDe(envase: Envase): Forma {
  if (envase === "lata" || envase === "frasco" || envase === "botella") return "cilindro";
  if (envase === "bolsa" || envase === "caja" || envase === "carton") return "bolsa";
  return "plana";
}

/**
 * Medio cilindro donde la foto se ve igual que la original de frente: cada columna de la imagen
 * va al ángulo que le corresponde (u = (sen θ + 1) / 2), así al girar se comporta como una lata real.
 */
function medioCilindro(ancho: number, alto: number) {
  const radio = ancho / 2;
  const columnas = 48;
  const filas = 2;
  const posiciones: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let f = 0; f <= filas; f++) {
    const v = f / filas;
    for (let c = 0; c <= columnas; c++) {
      const angulo = -Math.PI / 2 + (Math.PI * c) / columnas;
      posiciones.push(radio * Math.sin(angulo), (v - 0.5) * alto, radio * Math.cos(angulo));
      uvs.push((Math.sin(angulo) + 1) / 2, v);
    }
  }
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const a = f * (columnas + 1) + c;
      const b = a + columnas + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Plano con el centro abultado hacia afuera, como un paquete lleno. */
function planoAbultado(ancho: number, alto: number, bulto: number) {
  const g = new THREE.PlaneGeometry(ancho, alto, 24, 32);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / (ancho / 2);
    const v = pos.getY(i) / (alto / 2);
    pos.setZ(i, bulto * (1 - u * u) * (1 - v * v * 0.55));
  }
  g.computeVertexNormals();
  return g;
}

function ajustarTextura(t: THREE.Texture) {
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
}

function Recorte3D({ archivo, envase }: { archivo: string; envase: Envase }) {
  const textura = useTexture(urlMedio("imagenes", archivo));
  const forma = formaDe(envase);

  const { geometria, ancho, grosor } = useMemo(() => {
    ajustarTextura(textura);
    const img = textura.image as { width: number; height: number };
    const aspecto = img.width / img.height;
    let alto = 2.3;
    let an = alto * aspecto;
    if (an > 2.7) {
      an = 2.7;
      alto = an / aspecto;
    }
    const g =
      forma === "cilindro"
        ? medioCilindro(an, alto)
        : forma === "bolsa"
          ? planoAbultado(an, alto, Math.min(0.22, an * 0.12))
          : planoAbultado(an, alto, 0.025);
    return { geometria: g, ancho: an, grosor: forma === "bolsa" ? 0.07 : 0.035 };
  }, [textura, forma]);

  const brillo = forma === "plana" ? 0.6 : 0.38;
  const capas = forma === "cilindro" ? [] : [-0.5, -0.25, 0, 0.25, 0.5].map((k) => k * grosor);

  return (
    <group>
      {/* Frente y dorso: la misma foto, cada una mirando hacia su lado */}
      {[0, Math.PI].map((giro) => (
        <mesh key={giro} geometry={geometria} rotation-y={giro} position-z={forma === "cilindro" ? 0 : giro ? -grosor / 2 : grosor / 2}>
          <meshPhysicalMaterial
            map={textura}
            alphaTest={0.45}
            roughness={brillo}
            clearcoat={forma === "plana" ? 0 : 0.45}
            clearcoatRoughness={0.35}
            envMapIntensity={0.9}
          />
        </mesh>
      ))}
      {/* Canto: capas de la misma silueta, más oscuras, para que tenga espesor */}
      {capas.map((z) => (
        <mesh key={z} position-z={z}>
          <planeGeometry args={[ancho, ancho / ((textura.image as { width: number }).width / (textura.image as { height: number }).height)]} />
          <meshStandardMaterial map={textura} color="#9a9086" alphaTest={0.45} side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function Producto3D({
  producto,
  calidad = "normal",
  interaccion,
  velocidad = 0.35,
}: {
  producto: Producto;
  calidad?: Calidad;
  interaccion?: React.RefObject<Interaccion>;
  velocidad?: number;
}) {
  const grupo = useRef<THREE.Group>(null);
  const quieto = useMemo(() => movimientoReducido(), []);
  // Las fotos de paquetes se balancean (siempre se ve el frente); las latas y potes giran completos.
  const balancea = Boolean(producto.imagen) && formaDe(producto.envase) !== "cilindro";
  const fase = useMemo(() => (producto.id.length * 0.37) % (Math.PI * 2), [producto.id]);

  useFrame((state, delta) => {
    const g = grupo.current;
    if (!g) return;
    const i = interaccion?.current;
    const encima = Boolean(i?.hover);
    if (!quieto && balancea) {
      const objetivo = Math.sin(state.clock.elapsedTime * 0.6 + fase) * 0.42 + (encima ? (i?.x ?? 0) * 0.5 : 0);
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, objetivo, 4, delta);
    } else if (!quieto) g.rotation.y += delta * (encima ? 1.5 : velocidad);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, encima ? (i?.y ?? 0) * 0.3 : 0, 6, delta);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, encima ? -(i?.x ?? 0) * 0.18 : 0, 6, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, encima ? 0.12 : 0, 6, delta);
    const escala = THREE.MathUtils.damp(g.scale.x, encima ? 1.08 : 1, 6, delta);
    g.scale.setScalar(escala);
  });

  const procedural = <EnvaseProcedural p={producto} calidad={calidad} />;
  return (
    <group ref={grupo}>
      {producto.imagen && !producto.modelo ? (
        <SiFalla alternativa={procedural}>
          <Suspense fallback={null}>
            <Recorte3D archivo={producto.imagen} envase={producto.envase} />
          </Suspense>
        </SiFalla>
      ) : producto.modelo ? (
        <SiFalla alternativa={procedural}>
          <Suspense fallback={procedural}>
            <ModeloPropio url={producto.modelo} />
          </Suspense>
        </SiFalla>
      ) : (
        procedural
      )}
    </group>
  );
}

/** Mostrador giratorio de la portada: piedra clara con un aro dorado. */
export function Pedestal({ radio, y = -1.32 }: { radio: number; y?: number }) {
  const marca = useMarca();
  return (
    <group position={[0, y, 0]}>
      <mesh>
        <cylinderGeometry args={[radio, radio * 1.02, 0.22, 128]} />
        <meshPhysicalMaterial color={marca.fondo} roughness={0.28} clearcoat={0.8} clearcoatRoughness={0.18} />
      </mesh>
      <mesh position={[0, 0.115, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[radio * 0.995, 0.03, 16, 160]} />
        <meshStandardMaterial color={marca.oro} metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[radio * 1.02, radio * 0.94, 0.3, 128]} />
        <meshStandardMaterial color={marca.oro} metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Sombra suave bajo el producto (un disco con degradé, mucho más liviano que una sombra real). */
const sombra: { textura: THREE.CanvasTexture | null } = { textura: null };
function texturaSombra() {
  if (!sombra.textura) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    sombra.textura = new THREE.CanvasTexture(c);
  }
  return sombra.textura;
}

export function SombraSuelo({ y = -1.2, ancho = 2.4 }: { y?: number; ancho?: number }) {
  const mapa = useMemo(() => texturaSombra(), []);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]}>
      <planeGeometry args={[ancho, ancho * 0.55]} />
      <meshBasicMaterial map={mapa} transparent depthWrite={false} />
    </mesh>
  );
}
