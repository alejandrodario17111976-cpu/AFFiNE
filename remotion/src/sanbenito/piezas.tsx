import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { anim, Aparece, C, ENTRA, F, Revelar, SUAVE, useDisenio } from "./base";

/* ---------- Bloque de texto de cada escena ---------- */

export const Bloque: React.FC<{
  paso?: string;
  titulo: string[];
  sub?: string;
  desde?: number;
  claro?: boolean;
  ancho?: number;
  alinear?: "left" | "center";
  estilo?: React.CSSProperties;
}> = ({ paso, titulo, sub, desde = 6, claro = false, ancho, alinear = "left", estilo }) => {
  const { u, vertical } = useDisenio();
  const color = claro ? C.tinta : C.marfil;
  const suave = claro ? C.tinta2 : "rgba(247,243,234,0.74)";
  const tam = (vertical ? 96 : 92) * u;
  return (
    <div style={{ position: "absolute", width: ancho, textAlign: alinear, ...estilo }}>
      {paso && (
        <Aparece desde={desde} estilo={{ fontFamily: F.texto, fontSize: 26 * u, letterSpacing: "0.04em", color: claro ? C.oroSombra : C.oro, marginBottom: 22 * u }}>
          {paso}
        </Aparece>
      )}
      {titulo.map((linea, i) => (
        <Revelar
          key={i}
          texto={linea}
          desde={desde + 4 + i * 8}
          estilo={{ fontFamily: F.titulo, fontWeight: 500, fontSize: tam, lineHeight: 1.02, letterSpacing: "-0.015em", color }}
        />
      ))}
      {sub && (
        <Aparece
          desde={desde + 18 + titulo.length * 8}
          estilo={{ fontFamily: F.texto, fontWeight: 400, fontSize: 32 * u, lineHeight: 1.45, color: suave, marginTop: 30 * u, maxWidth: ancho }}
        >
          {sub}
        </Aparece>
      )}
    </div>
  );
};

/* ---------- Teléfono con una captura real del sitio ---------- */

export const PROPORCION_TEL = 390 / 664;

export const Telefono: React.FC<{
  alto: number;
  capturas: { src: string; desde: number }[];
  estilo?: React.CSSProperties;
  children?: React.ReactNode;
  entrada?: number;
}> = ({ alto, capturas, estilo, children, entrada = 0 }) => {
  const f = useCurrentFrame();
  const bisel = alto * 0.018;
  const altoPantalla = alto - bisel * 2;
  const anchoPantalla = altoPantalla * PROPORCION_TEL;
  const t = anim(f, entrada, 26);
  return (
    <div
      style={{
        position: "absolute",
        width: anchoPantalla + bisel * 2,
        height: alto,
        borderRadius: alto * 0.075,
        padding: bisel,
        background: "linear-gradient(140deg, #3a3d44 0%, #15171b 45%, #2b2e34 100%)",
        boxShadow: `0 ${alto * 0.05}px ${alto * 0.09}px rgba(3,8,18,0.55), inset 0 0 0 ${Math.max(1, alto * 0.002)}px rgba(255,255,255,0.18)`,
        transform: `translateY(${(1 - t) * alto * 0.12 + Math.sin(f / 28) * alto * 0.006}px) rotate(${(1 - t) * -2 + Math.sin(f / 41) * 0.35}deg)`,
        opacity: t,
        ...estilo,
      }}
    >
      <div style={{ position: "relative", width: anchoPantalla, height: altoPantalla, borderRadius: alto * 0.058, overflow: "hidden", background: C.lapisNoche }}>
        {capturas.map((c, i) => {
          const o = i === 0 ? 1 : anim(f, c.desde, 12, 0, 1, SUAVE);
          return (
            <Img
              key={c.src}
              src={staticFile(`sanbenito/capturas/${c.src}`)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: o }}
            />
          );
        })}
        {children}
        {/* reflejo del vidrio */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 30%, transparent 45%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

/** Convierte un punto de la captura del celular (en px CSS de 390×664) a px dentro de la pantalla. */
export const puntoTel = (altoTelefono: number, x: number, y: number) => {
  const bisel = altoTelefono * 0.018;
  const altoPantalla = altoTelefono - bisel * 2;
  return { x: (x / 390) * altoPantalla * PROPORCION_TEL, y: (y / 664) * altoPantalla };
};

/* ---------- Ventana de navegador (computadora) ---------- */

export const Navegador: React.FC<{
  ancho: number;
  capturas: { src: string; desde: number }[];
  titulo: string;
  foco?: { x: number; y: number; zoom: number; desde: number; dur: number };
  estilo?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ ancho, capturas, titulo, foco, estilo, children }) => {
  const f = useCurrentFrame();
  const { u } = useDisenio();
  const barra = Math.max(28, ancho * 0.03);
  const altoImg = ancho / 1.6;
  const z = foco ? anim(f, foco.desde, foco.dur, 1, foco.zoom, SUAVE) : 1;
  const t = anim(f, 0, 26);
  return (
    <div
      style={{
        position: "absolute",
        width: ancho,
        borderRadius: 16 * u,
        overflow: "hidden",
        background: "#0d1a2e",
        boxShadow: "0 40px 90px rgba(3,8,18,0.45), 0 0 0 1px rgba(201,164,76,0.25)",
        transform: `translateY(${(1 - t) * 60 * u}px)`,
        opacity: t,
        ...estilo,
      }}
    >
      <div style={{ height: barra, display: "flex", alignItems: "center", gap: barra * 0.28, padding: `0 ${barra * 0.5}px`, background: "#0a1424" }}>
        {["#E46A5E", "#E5B84C", "#6CBF6A"].map((c) => (
          <span key={c} style={{ width: barra * 0.32, height: barra * 0.32, borderRadius: "50%", background: c, opacity: 0.85 }} />
        ))}
        <span
          style={{
            marginLeft: barra * 0.4,
            padding: `${barra * 0.08}px ${barra * 0.5}px`,
            borderRadius: 999,
            background: "rgba(247,243,234,0.08)",
            color: "rgba(247,243,234,0.7)",
            fontFamily: F.texto,
            fontSize: barra * 0.42,
          }}
        >
          {titulo}
        </span>
      </div>
      <div style={{ position: "relative", width: ancho, height: altoImg, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${z})`,
            transformOrigin: foco ? `${foco.x * 100}% ${foco.y * 100}%` : "50% 50%",
          }}
        >
          {capturas.map((c, i) => (
            <Img
              key={c.src}
              src={staticFile(`sanbenito/capturas/${c.src}`)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: i === 0 ? 1 : anim(f, c.desde, 14, 0, 1, SUAVE) }}
            />
          ))}
          {children}
        </div>
      </div>
    </div>
  );
};

/* ---------- Toque (anillo dorado donde se aprieta) ---------- */

export const Toque: React.FC<{ x: number; y: number; en: number; tam?: number }> = ({ x, y, en, tam = 70 }) => {
  const f = useCurrentFrame();
  if (f < en - 8 || f > en + 30) return null;
  const llega = anim(f, en - 8, 8, 0, 1, SUAVE);
  const onda = anim(f, en, 22, 0, 1, ENTRA);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - tam / 2,
          top: y - tam / 2,
          width: tam,
          height: tam,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(241,221,160,0.75) 0%, rgba(201,164,76,0.35) 55%, transparent 72%)",
          transform: `scale(${0.6 + llega * 0.4 - (f > en ? anim(f, en, 6, 0, 0.15) : 0)})`,
          opacity: llega * (1 - anim(f, en + 8, 18)),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - tam,
          top: y - tam,
          width: tam * 2,
          height: tam * 2,
          borderRadius: "50%",
          border: `${Math.max(2, tam * 0.04)}px solid ${C.oroClaro}`,
          transform: `scale(${0.3 + onda * 0.9})`,
          opacity: f >= en ? 1 - onda : 0,
        }}
      />
    </>
  );
};

/* ---------- Marco dorado y barrido de luz ---------- */

export const MarcoOro: React.FC = () => {
  const f = useCurrentFrame();
  const { u } = useDisenio();
  const o = anim(f, 8, 30, 0, 0.55, SUAVE) * (1 - anim(f, 1925, 25, 0, 1, SUAVE));
  const m = 26 * u;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: m, border: `${Math.max(1, 1.5 * u)}px solid ${C.oro}`, opacity: o * 0.7 }} />
      <div style={{ position: "absolute", inset: m + 8 * u, border: `${Math.max(1, 0.75 * u)}px solid ${C.oro}`, opacity: o * 0.35 }} />
    </AbsoluteFill>
  );
};

/** Banda de luz dorada que cruza la pantalla en cada cambio de escena. */
export const Barrido: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 26], [-70, 170], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SUAVE });
  const o = interpolate(f, [0, 6, 18, 26], [0, 0.55, 0.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: o }}>
      <div
        style={{
          position: "absolute",
          top: "-30%",
          bottom: "-30%",
          left: `${x}%`,
          width: "28%",
          transform: "rotate(14deg)",
          background: "linear-gradient(90deg, transparent, rgba(241,221,160,0.35) 40%, rgba(255,246,220,0.55) 50%, rgba(241,221,160,0.35) 60%, transparent)",
          filter: "blur(18px)",
        }}
      />
    </AbsoluteFill>
  );
};
