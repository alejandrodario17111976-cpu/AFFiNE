"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { Producto } from "@/lib/tipos";
import { LucesTienda, Pedestal, Producto3D, SombraSuelo } from "./Producto3D";
import { mezclar, useMarca } from "@/lib/marca";
import { movimientoReducido, puntero, scrollPortada } from "./compartido";


/** Números pseudoaleatorios con semilla: la lluvia de granos sale igual en cada carga. */
function crearAzar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Polvo dorado que sube despacio alrededor del mostrador. */
function Granos({ cantidad = 70 }: { cantidad?: number }) {
  const marca = useMarca();
  const malla = useRef<THREE.InstancedMesh>(null);
  const datos = useMemo(() => {
    const azar = crearAzar(20251125);
    const colores = [marca.oro, mezclar(marca.oro, "#FFFFFF", 0.45), mezclar(marca.oro, "#000000", 0.25), marca.fondo];
    return Array.from({ length: cantidad }, (_, i) => ({
      x: (azar() - 0.5) * 11,
      y: (azar() - 0.5) * 6,
      z: (azar() - 0.5) * 6,
      vel: 0.15 + azar() * 0.35,
      giro: azar() * Math.PI * 2,
      escala: 0.025 + azar() * 0.05,
      color: colores[i % colores.length],
    }));
  }, [cantidad, marca]);
  const aux = useMemo(() => new THREE.Object3D(), []);
  const colorAux = useMemo(() => new THREE.Color(), []);
  const listo = useRef(false);
  const quieto = useMemo(() => movimientoReducido(), []);

  useFrame((state, delta) => {
    const m = malla.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    datos.forEach((d, i) => {
      if (!quieto) {
        d.y += delta * d.vel;
        if (d.y > 3.2) d.y = -3.2;
      }
      aux.position.set(d.x + Math.sin(t * 0.6 + i) * 0.15, d.y, d.z);
      aux.rotation.set(d.giro + t * d.vel, d.giro * 0.5 + t * 0.7, 0);
      aux.scale.set(d.escala, d.escala * 0.6, d.escala * 1.4);
      aux.updateMatrix();
      m.setMatrixAt(i, aux.matrix);
      if (!listo.current) m.setColorAt(i, colorAux.set(d.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (!listo.current && m.instanceColor) m.instanceColor.needsUpdate = true;
    listo.current = true;
  });

  return (
    <instancedMesh ref={malla} args={[undefined, undefined, cantidad]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.25} metalness={0.85} />
    </instancedMesh>
  );
}

/** Carrusel de productos destacados que gira, sigue al puntero y reacciona al scroll. */
export default function EscenaPortada({ productos }: { productos: Producto[] }) {
  const carrusel = useRef<THREE.Group>(null);
  const raiz = useRef<THREE.Group>(null);
  const quieto = useMemo(() => movimientoReducido(), []);
  const inicio = useRef<number | null>(null);
  // Las fotos reales son más anchas que los envases dibujados: más espacio entre productos
  const radio = productos.length > 1 ? Math.max(2.8, productos.length * 0.66) : 0;

  useFrame((state, delta) => {
    const c = carrusel.current;
    const r = raiz.current;
    if (!c || !r) return;
    const avance = scrollPortada.valor;
    // Entrada: el mostrador llega girando rápido y frena hasta su vuelta lenta
    inicio.current ??= state.clock.elapsedTime;
    const entrada = quieto ? 1 : Math.min(1, (state.clock.elapsedTime - inicio.current) / 2.2);
    const impulso = (1 - entrada) ** 2;
    if (!quieto) c.rotation.y += delta * (0.18 + impulso * 3.2);
    // Ancho que ve la cámara de esta vista (no el de toda la pantalla), para que el mostrador entre justo
    const camara = state.camera as THREE.PerspectiveCamera;
    const anchoVisible =
      2 * camara.position.length() * Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * camara.aspect;
    const escala = THREE.MathUtils.clamp(anchoVisible / (radio * 2 + 3.8), 0.36, 0.9);
    r.scale.setScalar(THREE.MathUtils.damp(r.scale.x, escala * (1 - avance * 0.25), 5, delta));
    r.rotation.x = THREE.MathUtils.damp(r.rotation.x, -puntero.y * 0.12 + avance * 0.5, 4, delta);
    r.rotation.z = THREE.MathUtils.damp(r.rotation.z, -puntero.x * 0.06, 4, delta);
    r.position.y = THREE.MathUtils.damp(r.position.y, 0.2 + avance * 1.4 - impulso * 1.6, 5, delta);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2.8, 11]} fov={34} onUpdate={(c) => c.lookAt(0, -0.5, 0)} />
      <LucesTienda dinamica />
      <group ref={raiz}>
        <group ref={carrusel}>
          {productos.map((p, i) => {
            const angulo = (i / productos.length) * Math.PI * 2;
            return (
              <group key={p.id} position={[Math.sin(angulo) * radio, 0, Math.cos(angulo) * radio]}>
                <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.7} floatingRange={[-0.12, 0.12]}>
                  <Producto3D producto={p} calidad={i === 0 ? "alta" : "normal"} velocidad={0.5} />
                </Float>
                <SombraSuelo y={-1.2} ancho={2.4} />
              </group>
            );
          })}
        </group>
        <Pedestal radio={radio + 0.95} />
        <Granos />
      </group>
    </>
  );
}
