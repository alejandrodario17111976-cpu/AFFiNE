"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import * as THREE from "three";
import { puntero } from "./compartido";

/**
 * Un único lienzo WebGL fijo detrás de toda la página. Cada producto se dibuja en su propia
 * "ventana" (<View>) que sigue la posición de su tarjeta: así hay decenas de productos 3D
 * sin abrir decenas de contextos WebGL.
 */
export default function Escena3D() {
  useEffect(() => {
    const mover = (e: PointerEvent) => {
      puntero.x = (e.clientX / window.innerWidth) * 2 - 1;
      puntero.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => window.removeEventListener("pointermove", mover);
  }, []);

  return (
    <Canvas
      aria-hidden
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 15 }}
    >
      <View.Port />
    </Canvas>
  );
}
