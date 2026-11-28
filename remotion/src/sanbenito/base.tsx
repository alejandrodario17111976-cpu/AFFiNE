import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig, delayRender, continueRender } from "remotion";

/**
 * San Benito — video de presentación. Misma estética que el sitio: lapislázuli con
 * motas de pirita, oro metálico, carmesí y marfil; Cormorant Garamond, Jost y Courier Prime.
 * Personalidad de movimiento "premium" (motion-design): curvas suaves sin rebote,
 * 12-20 cuadros para elementos, 24-36 para revelaciones; siempre tres capas
 * (principal, secundaria y ambiente).
 */

export const C = {
  lapis: "#26619C",
  lapisHondo: "#0F2747",
  lapisNoche: "#071428",
  oro: "#C9A44C",
  oroClaro: "#F1DDA0",
  oroSombra: "#7A5B1E",
  carmesi: "#A11D33",
  carmesiHondo: "#5E0E1C",
  marfil: "#F7F3EA",
  papel: "#FBF8F1",
  tinta: "#1F1B16",
  tinta2: "#5E554A",
};

export const F = {
  titulo: "'SB Cormorant', Georgia, serif",
  texto: "'SB Jost', 'Helvetica Neue', Arial, sans-serif",
  ticket: "'SB Courier', 'Courier New', monospace",
};

export const FPS = 30;
/** Un compás de la música (90 bpm, 4/4) = 80 cuadros: los cortes caen en los tiempos fuertes. */
export const COMPAS = 80;

/* ---------- Fuentes (las mismas del sitio, locales) ---------- */

let fuentesCargadas: Promise<void> | null = null;
export function cargarFuentes() {
  if (fuentesCargadas) return fuentesCargadas;
  const lista = [
    new FontFace("SB Cormorant", `url(${staticFile("sanbenito/fuentes/cormorant.woff2")}) format('woff2')`, { weight: "300 700" }),
    new FontFace("SB Cormorant", `url(${staticFile("sanbenito/fuentes/cormorant-italica.woff2")}) format('woff2')`, { weight: "300 700", style: "italic" }),
    new FontFace("SB Jost", `url(${staticFile("sanbenito/fuentes/jost.woff2")}) format('woff2')`, { weight: "300 700" }),
    new FontFace("SB Courier", `url(${staticFile("sanbenito/fuentes/courier.woff2")}) format('woff2')`, { weight: "400" }),
    new FontFace("SB Courier", `url(${staticFile("sanbenito/fuentes/courier-negrita.woff2")}) format('woff2')`, { weight: "700" }),
  ];
  const espera = delayRender("Fuentes de San Benito");
  fuentesCargadas = Promise.all(lista.map((f) => f.load())).then((fs) => {
    fs.forEach((f) => document.fonts.add(f));
    continueRender(espera);
  });
  return fuentesCargadas;
}

/* ---------- Movimiento ---------- */

/** Curva de la marca (premium): entra decidida y aterriza suave, sin rebote. */
export const SUAVE = Easing.bezier(0.4, 0, 0.2, 1);
export const ENTRA = Easing.bezier(0.16, 1, 0.3, 1);
export const SALE = Easing.bezier(0.5, 0, 0.75, 0);

/** De a hasta b entre los cuadros desde..desde+dur, con la curva elegida. */
export function anim(f: number, desde: number, dur: number, a = 0, b = 1, ease = ENTRA) {
  return interpolate(f, [desde, desde + dur], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
}

/* ---------- Diseño según orientación ---------- */

export function useDisenio() {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  /** Unidad: 1 = 1 px en el lado corto de 1080. */
  const u = Math.min(width, height) / 1080;
  return { W: width, H: height, vertical, u };
}

/* ---------- Fondos ---------- */

/** Piedra de lapislázuli: degradé profundo, veta de la piedra, motas de pirita y viñeta. */
export const FondoLapis: React.FC<{ deriva?: number; claro?: boolean }> = ({ deriva = 0, claro = false }) => {
  const f = useCurrentFrame();
  const { W, H } = useDisenio();
  const mov = (f + deriva) * 0.15;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 30% 20%, ${claro ? "#1d4a80" : "#173a68"} 0%, ${C.lapisHondo} 55%, ${C.lapisNoche} 100%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("sanbenito/texturas/lapis.webp")})`,
          backgroundSize: `${Math.round(Math.max(W, H) * 0.62)}px`,
          backgroundPosition: `${-mov}px ${mov * 0.4}px`,
          mixBlendMode: "soft-light",
          opacity: 0.55,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("sanbenito/texturas/pirita.png")})`,
          backgroundSize: `${Math.round(Math.max(W, H) * 0.62)}px`,
          backgroundPosition: `${-mov * 1.3}px ${mov * 0.6}px`,
          opacity: 0.4,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(110% 80% at 50% 45%, transparent 45%, rgba(2,6,14,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Papel marfil de las secciones claras del sitio, con luz cálida. */
export const FondoMarfil: React.FC = () => {
  const { W, H } = useDisenio();
  const f = useCurrentFrame();
  // una luz cálida que recorre despacio el papel (capa de ambiente)
  const lx = 30 + Math.sin(f / 70) * 22;
  const ly = 25 + Math.cos(f / 90) * 12;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 100% at ${lx}% ${ly}%, #FFFDF8 0%, ${C.marfil} 55%, #E6DCC8 100%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("sanbenito/texturas/papel.webp")})`,
          backgroundSize: `${Math.round(Math.max(W, H) * 0.4)}px`,
          mixBlendMode: "multiply",
          opacity: 0.9,
        }}
      />
    </AbsoluteFill>
  );
};

/** Carmesí aterciopelado de las ofertas. */
export const FondoTerciopelo: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(90% 80% at 30% 10%, #C2344B 0%, ${C.carmesi} 40%, ${C.carmesiHondo} 100%)`,
    }}
  >
    <AbsoluteFill style={{ background: "radial-gradient(110% 80% at 50% 50%, transparent 50%, rgba(20,0,6,0.55) 100%)" }} />
  </AbsoluteFill>
);

/** Polvo dorado que flota (capa de ambiente): partículas deterministas con desenfoque según profundidad. */
export const PolvoOro: React.FC<{ cantidad?: number; semilla?: string; intensidad?: number }> = ({ cantidad = 46, semilla = "polvo", intensidad = 1 }) => {
  const f = useCurrentFrame();
  const { W, H, u } = useDisenio();
  const motas = useMemo(
    () =>
      Array.from({ length: cantidad }, (_, i) => ({
        x: random(`${semilla}x${i}`),
        y: random(`${semilla}y${i}`),
        z: random(`${semilla}z${i}`),
        v: 0.3 + random(`${semilla}v${i}`) * 0.7,
        fase: random(`${semilla}f${i}`) * Math.PI * 2,
      })),
    [cantidad, semilla],
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {motas.map((m, i) => {
        const tam = (2 + m.z * 9) * u;
        const y = ((m.y * H - f * m.v * (0.6 + m.z) * u + H * 2) % (H + 40)) - 20;
        const x = m.x * W + Math.sin(f / 50 + m.fase) * 14 * u;
        const brillo = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(f / 22 + m.fase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: tam,
              height: tam,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${C.oroClaro} 0%, ${C.oro} 45%, transparent 72%)`,
              opacity: brillo * (0.35 + m.z * 0.6) * intensidad,
              filter: m.z < 0.35 ? `blur(${(0.35 - m.z) * 8 * u}px)` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- Texto ---------- */

/** Oro metálico en el texto, con un brillo que lo recorre despacio. */
export function estiloOro(f: number, velocidad = 0.6): React.CSSProperties {
  return {
    backgroundImage: `linear-gradient(105deg, ${C.oroSombra} 0%, ${C.oro} 22%, ${C.oroClaro} 38%, ${C.oro} 52%, ${C.oroSombra} 70%, ${C.oroClaro} 86%, ${C.oro} 100%)`,
    backgroundSize: "220% 100%",
    backgroundPosition: `${(f * velocidad) % 220}% 0%`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

/** Revela un texto palabra por palabra, cada una subiendo desde detrás de su máscara. */
export const Revelar: React.FC<{
  texto: string;
  desde: number;
  estilo?: React.CSSProperties;
  escalon?: number;
  dur?: number;
  oro?: boolean;
  como?: "div" | "span";
}> = ({ texto, desde, estilo, escalon = 4, dur = 26, oro = false }) => {
  const f = useCurrentFrame();
  const palabras = texto.split(" ");
  return (
    <div style={{ ...estilo }}>
      {palabras.map((p, i) => {
        const t = anim(f, desde + i * escalon, dur);
        return (
          <React.Fragment key={i}>
            <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
              <span
                style={{
                  display: "inline-block",
                  transform: `translateY(${(1 - t) * 105}%) rotate(${(1 - t) * 3}deg)`,
                  opacity: interpolate(t, [0, 0.4, 1], [0, 1, 1]),
                  ...(oro ? estiloOro(f) : null),
                }}
              >
                {p}
              </span>
            </span>
            {i < palabras.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Filete dorado que se dibuja de izquierda a derecha. */
export const Filete: React.FC<{ desde: number; ancho: number; dur?: number; grosor?: number; estilo?: React.CSSProperties }> = ({
  desde,
  ancho,
  dur = 28,
  grosor = 2,
  estilo,
}) => {
  const f = useCurrentFrame();
  const t = anim(f, desde, dur, 0, 1, SUAVE);
  return (
    <div
      style={{
        width: ancho * t,
        height: grosor,
        background: `linear-gradient(90deg, transparent, ${C.oro} 15%, ${C.oroClaro} 50%, ${C.oro} 85%, transparent)`,
        ...estilo,
      }}
    />
  );
};

/** Texto que aparece subiendo apenas y con fundido (para líneas secundarias). */
export const Aparece: React.FC<{ desde: number; dur?: number; children: React.ReactNode; estilo?: React.CSSProperties; dy?: number }> = ({
  desde,
  dur = 18,
  children,
  estilo,
  dy = 18,
}) => {
  const f = useCurrentFrame();
  const t = anim(f, desde, dur);
  return <div style={{ opacity: t, transform: `translateY(${(1 - t) * dy}px)`, ...estilo }}>{children}</div>;
};

/** Entrada de cada escena (se superpone 12 cuadros con la anterior) y empuje lento de cámara. */
export const Escena: React.FC<{ children: React.ReactNode; duracion: number; fondo?: React.ReactNode }> = ({ children, duracion, fondo }) => {
  const f = useCurrentFrame();
  // Termina de aparecer dentro del solape con la escena anterior (12 cuadros): sin salto en el corte
  const entrada = anim(f, 0, 11, 0, 1, SUAVE);
  const empuje = interpolate(f, [0, duracion], [1.035, 1], { extrapolateRight: "clamp" });
  // Acercamiento lento y continuo del contenido: ninguna toma queda quieta
  const acerca = interpolate(f, [0, duracion + 12], [1, 1.022]);
  return (
    <AbsoluteFill style={{ opacity: entrada, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${empuje})` }}>{fondo}</AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${acerca})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Foto recortada de un producto, flotando con su sombra. */
export const Producto: React.FC<{
  archivo: string;
  alto: number;
  estilo?: React.CSSProperties;
  flota?: number;
  semilla?: number;
}> = ({ archivo, alto, estilo, flota = 1, semilla = 0 }) => {
  const f = useCurrentFrame();
  const y = Math.sin(f / 24 + semilla) * 6 * flota;
  const r = Math.sin(f / 37 + semilla * 1.7) * 1.4 * flota;
  return (
    <div style={{ position: "absolute", ...estilo }}>
      <Img
        src={staticFile(`sanbenito/productos/${archivo}`)}
        style={{
          display: "block",
          // los envases altos llegan a `alto`; los muy anchos (un toallón) no pasan de ese ancho
          maxHeight: alto,
          maxWidth: alto * 0.95,
          transform: `translateY(${y}px) rotate(${r}deg)`,
          filter: "drop-shadow(0 24px 22px rgba(10,8,4,0.35)) drop-shadow(0 4px 6px rgba(10,8,4,0.25))",
        }}
      />
    </div>
  );
};
