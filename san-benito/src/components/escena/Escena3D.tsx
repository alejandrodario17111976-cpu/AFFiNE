"use client";

import { useEffect, useState } from "react";
import { advance, Canvas } from "@react-three/fiber";
import { PerformanceMonitor, View } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { puntero } from "./compartido";

/**
 * Un único lienzo WebGL fijo detrás de toda la página. Cada producto se dibuja en su propia
 * "ventana" (<View>) que sigue la posición de su tarjeta: así hay decenas de productos 3D
 * sin abrir decenas de contextos WebGL.
 *
 * Los cuadros los marca el reloj de GSAP (el mismo del scroll suave), así el 3D se dibuja
 * justo después de que se movió la página y no queda medio cuadro atrás de su tarjeta.
 * La resolución se ajusta sola: baja si el teléfono no llega a 60 cuadros y sube si sobra.
 */
export default function Escena3D() {
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.5));

  useEffect(() => {
    const mover = (e: PointerEvent) => {
      puntero.x = (e.clientX / window.innerWidth) * 2 - 1;
      puntero.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", mover, { passive: true });
    const tic = (tiempo: number) => advance(tiempo);
    gsap.ticker.add(tic);
    return () => {
      window.removeEventListener("pointermove", mover);
      gsap.ticker.remove(tic);
    };
  }, []);

  return (
    <Canvas
      aria-hidden
      frameloop="never"
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 15 }}
    >
      <PerformanceMonitor
        flipflops={3}
        onIncline={() => setDpr(Math.min(window.devicePixelRatio || 1, 1.75))}
        onDecline={() => setDpr(1)}
        onFallback={() => setDpr(1)}
      />
      <View.Port />
    </Canvas>
  );
}
