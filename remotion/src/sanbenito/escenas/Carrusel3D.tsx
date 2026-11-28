import React, { useEffect, useMemo, useState } from "react";
import {
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { crearSolido, type Forma } from "../solido";
import { C } from "../base";

/**
 * El mostrador giratorio del sitio, en 3D de verdad: cada producto es el mismo sólido que
 * arma la página a partir de su foto (revolución o extrusión con aristas redondeadas).
 */

export interface Pieza {
  archivo: string;
  forma: Forma;
}

export const MOSTRADOR: Pieza[] = [
  { archivo: "yerba-chamigo.webp", forma: "bolsa" },
  { archivo: "agua-saborizada-brio-naranja-1-5-l.webp", forma: "cilindro" },
  { archivo: "jabon-liquido-ace-clasico-3-l.webp", forma: "bolsa" },
  { archivo: "cacao-nesquik-180-g.webp", forma: "bolsa" },
  { archivo: "energizante-monster-strawberry-473-ml.webp", forma: "cilindro" },
  { archivo: "mayonesa-hellmann-s-clasica-doypack-475-g.webp", forma: "bolsa" },
  { archivo: "aceite-de-girasol-cocinero-900-ml.webp", forma: "cilindro" },
  { archivo: "galletitas-pepitos-tripack-357-g.webp", forma: "bolsa" },
];

function useTexturas(archivos: string[]) {
  const [texturas, setTexturas] = useState<THREE.Texture[] | null>(null);
  const [espera] = useState(() => delayRender("Texturas del mostrador 3D"));
  useEffect(() => {
    const cargador = new THREE.TextureLoader();
    Promise.all(
      archivos.map((a) =>
        cargador.loadAsync(staticFile(`sanbenito/productos/${a}`)),
      ),
    ).then((ts) => {
      ts.forEach((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
      });
      setTexturas(ts);
      continueRender(espera);
    });
  }, [archivos, espera]);
  return texturas;
}

function Entorno() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.05;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

const sombra = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,0.5)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(c);
    return t;
  };
})();

const ACABADO: Record<Forma, { r: number; barniz: number }> = {
  cilindro: { r: 0.26, barniz: 0.7 },
  bolsa: { r: 0.32, barniz: 0.55 },
  caja: { r: 0.5, barniz: 0.2 },
  plana: { r: 0.6, barniz: 0 },
};

function Solido({ textura, forma }: { textura: THREE.Texture; forma: Forma }) {
  const geo = useMemo(
    () => crearSolido(textura.image as HTMLImageElement, forma),
    [textura, forma],
  );
  const { r, barniz } = ACABADO[forma];
  return (
    <mesh geometry={geo}>
      <meshPhysicalMaterial
        map={textura}
        alphaTest={0.5}
        side={THREE.DoubleSide}
        roughness={r}
        clearcoat={barniz}
        clearcoatRoughness={0.22}
        envMapIntensity={1.15}
      />
    </mesh>
  );
}

function Camara({ f, vertical }: { f: number; vertical: boolean }) {
  const { camera } = useThree();
  // Dolly lento hacia el mostrador
  const z = (vertical ? 23.5 : 21) - f * 0.014;
  camera.position.set(
    Math.sin(f / 120) * 0.9,
    (vertical ? 5.2 : 4.4) - f * 0.004,
    z,
  );
  camera.lookAt(0, vertical ? 0.4 : -0.6, 0);
  return null;
}

function Mostrador({
  texturas,
  piezas,
  f,
  vertical,
  corrimiento,
}: {
  texturas: THREE.Texture[];
  piezas: Pieza[];
  f: number;
  vertical: boolean;
  corrimiento: number;
}) {
  const radio = Math.max(2.8, piezas.length * 0.62);
  // Llega girando y frena hasta su vuelta lenta (como en el sitio)
  const giro = f * 0.0065 + 2.2 * (1 - Math.exp(-f / 22));
  const sombraTex = sombra();
  return (
    <>
      <Entorno />
      <Camara f={f} vertical={vertical} />
      <ambientLight intensity={0.45} color="#FFF4E0" />
      <directionalLight position={[3, 5, 4]} intensity={2.4} color="#FFF1DA" />
      <directionalLight
        position={[-5, 2.5, -3]}
        intensity={1.1}
        color="#B9CBEA"
      />
      <directionalLight
        position={[3, 3.5, -4.5]}
        intensity={1.8}
        color="#FFE3B0"
      />
      <group position-x={corrimiento}>
        <group rotation-y={giro}>
          {piezas.map((p, i) => {
            const a = (i / piezas.length) * Math.PI * 2;
            const flota = Math.sin(f / 26 + i * 1.3) * 0.07;
            return (
              // Cada producto mira siempre a cámara (se ve el frente, nunca la foto espejada) con un vaivén suave
              <group
                key={p.archivo}
                position={[Math.sin(a) * radio, flota, Math.cos(a) * radio]}
                rotation-y={-giro + Math.sin(f / 34 + i * 1.7) * 0.32}
              >
                <Solido textura={texturas[i]} forma={p.forma} />
                <mesh rotation-x={-Math.PI / 2} position={[0, -1.24, 0]}>
                  <planeGeometry args={[2.6, 1.3]} />
                  <meshBasicMaterial
                    map={sombraTex}
                    transparent
                    depthWrite={false}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
        {/* Pedestal de piedra clara con aro de oro */}
        <group position={[0, -1.36, 0]}>
          <mesh>
            <cylinderGeometry
              args={[radio + 0.95, (radio + 0.95) * 1.02, 0.22, 128]}
            />
            <meshPhysicalMaterial
              color={C.marfil}
              roughness={0.28}
              clearcoat={0.8}
              clearcoatRoughness={0.18}
            />
          </mesh>
          <mesh position={[0, 0.115, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[(radio + 0.95) * 0.995, 0.03, 16, 160]} />
            <meshStandardMaterial
              color={C.oro}
              metalness={1}
              roughness={0.22}
            />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry
              args={[(radio + 0.95) * 1.02, (radio + 0.95) * 0.94, 0.3, 128]}
            />
            <meshStandardMaterial color={C.oro} metalness={1} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </>
  );
}

export const MostradorGiratorio: React.FC<{
  ancho: number;
  alto: number;
  vertical: boolean;
  piezas?: Pieza[];
  desfase?: number;
  /** Corre el mostrador hacia un costado (en unidades de la escena) sin recortar el lienzo. */
  corrimiento?: number;
}> = ({
  ancho,
  alto,
  vertical,
  piezas = MOSTRADOR,
  desfase = 0,
  corrimiento = 0,
}) => {
  const f = useCurrentFrame() + desfase;
  const archivos = useMemo(() => piezas.map((p) => p.archivo), [piezas]);
  const texturas = useTexturas(archivos);
  return (
    <ThreeCanvas
      width={ancho}
      height={alto}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: vertical ? 34 : 30, position: [0, 2.7, 11] }}
    >
      {texturas && (
        <Mostrador
          texturas={texturas}
          piezas={piezas}
          f={f}
          vertical={vertical}
          corrimiento={corrimiento}
        />
      )}
    </ThreeCanvas>
  );
};
