import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  anim,
  Aparece,
  C,
  Escena,
  estiloOro,
  F,
  Filete,
  FondoLapis,
  FondoMarfil,
  FondoTerciopelo,
  PolvoOro,
  Producto,
  Revelar,
  SALE,
  SUAVE,
  useDisenio,
} from "../base";
import { Bloque, Navegador, puntoTel, Telefono, Toque } from "../piezas";
import { MostradorGiratorio } from "./Carrusel3D";
import L from "../linea.json";

const E = L.escenas;
const M = L.momentos;

/* ================= 1. Apertura ================= */

export const Apertura: React.FC = () => {
  const f = useCurrentFrame();
  const { u, vertical } = useDisenio();
  const m = M.apertura;
  const tam = (vertical ? 186 : 214) * u;
  const salida = anim(f, E.apertura.dur - 22, 22, 0, 1, SALE);
  return (
    <Escena duracion={E.apertura.dur} fondo={<FondoLapis />}>
      <PolvoOro semilla="apertura" />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          opacity: 1 - salida,
          transform: `translateY(${-salida * 30 * u}px) scale(${1 + salida * 0.02})`,
        }}
      >
        <Filete desde={m.filete} ancho={(vertical ? 460 : 620) * u} />
        <div
          style={{
            fontFamily: F.titulo,
            fontWeight: 500,
            fontSize: tam,
            lineHeight: 1.05,
            color: C.marfil,
            letterSpacing: "-0.012em",
            margin: `${26 * u}px 0 ${6 * u}px`,
            whiteSpace: "nowrap",
          }}
        >
          {"San Benito".split("").map((l, i) => {
            const t = anim(f, m.letras + i * 2.4, 32);
            return (
              <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingTop: "0.05em" }}>
                <span style={{ display: "inline-block", transform: `translateY(${(1 - t) * 105}%)`, opacity: interpolate(t, [0, 0.3, 1], [0, 1, 1]) }}>
                  {l === " " ? " " : l}
                </span>
              </span>
            );
          })}
        </div>
        <Revelar
          texto="Tu mejor elección"
          desde={m.eslogan}
          oro
          escalon={5}
          estilo={{ fontFamily: F.titulo, fontStyle: "italic", fontWeight: 500, fontSize: tam * 0.36 }}
        />
        <Filete desde={m.eslogan + 10} ancho={(vertical ? 300 : 380) * u} estilo={{ marginTop: 34 * u }} />
        <Aparece
          desde={m.eslogan + 26}
          estilo={{ fontFamily: F.texto, fontSize: 28 * u, color: "rgba(247,243,234,0.72)", marginTop: 28 * u, letterSpacing: "0.04em" }}
        >
          Almacén en Las Catitas y La Dormida
        </Aparece>
      </AbsoluteFill>
    </Escena>
  );
};

/* ================= 2. Mostrador 3D ================= */

export const Carrusel: React.FC = () => {
  const { W, H, u, vertical } = useDisenio();
  const area = vertical
    ? { left: 0, top: Math.round(H * 0.36), width: W, height: Math.round(H * 0.64) }
    : { left: 0, top: 0, width: W, height: H };
  return (
    <Escena duracion={E.carrusel.dur} fondo={<FondoLapis deriva={E.carrusel.desde} />}>
      <div style={{ position: "absolute", ...area }}>
        <MostradorGiratorio ancho={area.width} alto={area.height} vertical={vertical} corrimiento={vertical ? 0 : 4.2} />
      </div>
      <AbsoluteFill
        style={{
          background: vertical
            ? `linear-gradient(180deg, ${C.lapisNoche} 0%, rgba(7,20,40,0.85) 30%, transparent 46%)`
            : `linear-gradient(90deg, rgba(7,20,40,0.92) 0%, rgba(7,20,40,0.7) 34%, transparent 52%)`,
        }}
      />
      <PolvoOro semilla="carrusel" cantidad={30} />
      <Bloque
        paso="La tienda en línea"
        titulo={["Tu almacén de siempre,", "ahora en la web."]}
        sub="Todo el negocio en tu celular: productos en 3D, fotos reales y los precios del día."
        ancho={vertical ? W - 170 * u : 720 * u}
        estilo={vertical ? { left: 85 * u, top: 190 * u } : { left: 130 * u, top: H / 2 - 250 * u }}
      />
    </Escena>
  );
};

/* ================= 3. Catálogo ================= */

const PASILLOS = [
  { nombre: "Almacén", fotos: ["harina-integral-blancaflor-1-kg.webp", "mayonesa-natura-500-g.webp", "fideos-favorita-variedades-500-g.webp"] },
  { nombre: "Desayuno y merienda", fotos: ["yerba-mate-mateando-500-g.webp", "cacao-toddy-original-180-g.webp", "galletitas-oreo-original-354-g.webp"] },
  { nombre: "Bebidas", fotos: ["agua-saborizada-brio-pomelo-1-5-l.webp", "energizante-speed-unlimited-473-ml.webp", "agua-saborizada-brio-manzana-1-5-l.webp"] },
  { nombre: "Limpieza", fotos: ["jabon-liquido-skip-bio-enzimas-3-l.webp", "suavizante-ecovita-unico-o-epico-900-cc.webp", "vanish-prelavado-ropa-blanca-400-ml.webp"] },
  { nombre: "Perfumería e higiene", fotos: ["desodorante-rexona-aerosol-150-cc.webp", "crema-corporal-nivea-lata-60-cc.webp", "papel-higienico-campanita-soft-4-x-30-m.webp"] },
  { nombre: "Bazar y hogar", fotos: ["mate-autocebante-750-ml.webp", "toallon-x-3.webp", "botella-infantil.webp"] },
];

export const Catalogo: React.FC = () => {
  const f = useCurrentFrame();
  const { W, H, u, vertical } = useDisenio();
  const m = M.catalogo;
  const n = Math.round(anim(f, m.contador, 44, 0, 170, SUAVE));
  const k = Math.min(PASILLOS.length - 1, Math.max(0, Math.floor((f - m.pasillo0) / m.cadaPasillo)));
  const escenario = vertical
    ? { left: 0, top: H * 0.4, width: W, height: H * 0.52 }
    : { left: W * 0.5, top: H * 0.12, width: W * 0.45, height: H * 0.76 };
  const altoFoto = (vertical ? 430 : 330) * u;
  return (
    <Escena duracion={E.catalogo.dur} fondo={<FondoMarfil />}>
      <div style={{ position: "absolute", ...(vertical ? { left: 85 * u, top: 190 * u } : { left: 130 * u, top: H / 2 - 300 * u }) }}>
        <Aparece desde={4} estilo={{ fontFamily: F.texto, fontSize: 26 * u, color: C.oroSombra, letterSpacing: "0.04em" }}>
          El catálogo
        </Aparece>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 * u, marginTop: 6 * u }}>
          <span style={{ fontFamily: F.titulo, fontWeight: 600, fontSize: 250 * u, lineHeight: 1, letterSpacing: "-0.03em", ...estiloOro(f, 0.4) }}>
            +{n}
          </span>
        </div>
        <Revelar
          texto="productos, en 15 pasillos"
          desde={m.contador + 14}
          estilo={{ fontFamily: F.titulo, fontWeight: 500, fontSize: 62 * u, color: C.tinta, marginTop: -6 * u }}
        />
        <Aparece
          desde={m.contador + 34}
          estilo={{ fontFamily: F.texto, fontSize: 31 * u, lineHeight: 1.45, color: C.tinta2, marginTop: 24 * u, maxWidth: (vertical ? 860 : 640) * u }}
        >
          Fotos reales, precios al día y ofertas en cada pasillo. Buscalo por nombre o mirá la lista completa.
        </Aparece>
      </div>

      {/* Escenario: el pasillo activo con tres de sus productos */}
      <div style={{ position: "absolute", ...escenario, opacity: anim(f, m.pasillo0 - 10, 14) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center" }}>
          <div style={{ fontFamily: F.texto, fontSize: 24 * u, color: C.oroSombra, letterSpacing: "0.04em" }}>
            Pasillo {String(k + 1).padStart(2, "0")}
          </div>
          <div style={{ position: "relative", height: 80 * u, overflow: "hidden", marginTop: 6 * u }}>
            {PASILLOS.map((p, i) => {
              const ini = m.pasillo0 + i * m.cadaPasillo;
              const entra = anim(f, ini, 14);
              const sale = i === PASILLOS.length - 1 ? 0 : anim(f, ini + m.cadaPasillo - 6, 8, 0, 1, SALE);
              if (f < ini - 2 || (sale >= 1 && i < PASILLOS.length - 1)) return null;
              return (
                <div
                  key={p.nombre}
                  style={{
                    position: "absolute",
                    inset: 0,
                    fontFamily: F.titulo,
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: 64 * u,
                    color: C.tinta,
                    transform: `translateY(${(1 - entra) * 70 - sale * 70}%)`,
                    opacity: entra * (1 - sale),
                  }}
                >
                  {p.nombre}
                </div>
              );
            })}
          </div>
        </div>
        {/* sombra del piso */}
        <div
          style={{
            position: "absolute",
            left: "12%",
            right: "12%",
            bottom: escenario.height * 0.06,
            height: 60 * u,
            background: "radial-gradient(50% 50% at 50% 50%, rgba(60,45,20,0.22), transparent 70%)",
          }}
        />
        {PASILLOS.map((p, i) => {
          const ini = m.pasillo0 + i * m.cadaPasillo;
          const ultimo = i === PASILLOS.length - 1;
          if (f < ini - 2 || (!ultimo && f > ini + m.cadaPasillo + 2)) return null;
          return p.fotos.map((foto, j) => {
            const entra = anim(f, ini + j * 3, 16);
            const sale = ultimo ? 0 : anim(f, ini + m.cadaPasillo - 8 + j * 2, 9, 0, 1, SALE);
            const x = [0.2, 0.5, 0.8][j];
            const alto = altoFoto * [0.82, 1, 0.82][j];
            return (
              <Producto
                key={`${p.nombre}-${foto}`}
                archivo={foto}
                alto={alto}
                semilla={i * 3 + j}
                estilo={{
                  left: escenario.width * x,
                  bottom: escenario.height * 0.1,
                  transform: `translateX(-50%) translateY(${(1 - entra) * 50 * u - sale * 40 * u}px) scale(${0.94 + entra * 0.06})`,
                  opacity: entra * (1 - sale),
                  zIndex: j === 1 ? 2 : 1,
                }}
              />
            );
          });
        })}
        {/* marcas de avance por pasillo */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", gap: 14 * u }}>
          {PASILLOS.map((p, i) => (
            <span
              key={p.nombre}
              style={{ width: i === k ? 44 * u : 14 * u, height: 4 * u, borderRadius: 4 * u, background: i <= k ? C.oro : "rgba(31,27,22,0.15)", transition: "none" }}
            />
          ))}
        </div>
      </div>
    </Escena>
  );
};

/* ================= 4. Buscar y agregar ================= */

export const Buscar: React.FC = () => {
  const f = useCurrentFrame();
  const { W, H, u, vertical } = useDisenio();
  const m = M.buscar;
  const altoTel = (vertical ? 1120 : 920) * u;
  const anchoTel = (altoTel - altoTel * 0.036) * (390 / 664) + altoTel * 0.036;
  const pos = vertical ? { left: (W - anchoTel) / 2, top: H - altoTel - 120 * u } : { left: W * 0.62 - anchoTel / 2, top: (H - altoTel) / 2 + 10 * u };
  const toques = [
    { x: 318, y: 467, foto: "yerba-chamigo.webp" },
    { x: 318, y: 557, foto: "yerba-mate-mateando-500-g.webp" },
  ];
  const destino = puntoTel(altoTel, 299, 32);
  const cuenta = m.toques.filter((t) => f >= t + m.vuelo).length;
  return (
    <Escena duracion={E.buscar.dur} fondo={<FondoLapis deriva={E.buscar.desde} />}>
      <PolvoOro semilla="buscar" cantidad={26} />
      <Bloque
        paso="01 · Elegí"
        titulo={["Buscá y sumalo", "con un toque."]}
        sub="Por pasillo, por nombre o en la lista completa. Cada producto vuela directo a tu ticket."
        ancho={vertical ? W - 170 * u : 640 * u}
        estilo={vertical ? { left: 85 * u, top: 170 * u } : { left: 130 * u, top: H / 2 - 230 * u }}
      />
      <Telefono alto={altoTel} capturas={[{ src: "tel-buscar.png", desde: 0 }]} estilo={pos} entrada={4}>
        {toques.map((t, i) => {
          const p = puntoTel(altoTel, t.x, t.y);
          const en = m.toques[i];
          const v = anim(f, en + 2, m.vuelo - 2, 0, 1, SUAVE);
          const visible = f >= en + 2 && f <= en + m.vuelo + 2;
          const x = p.x + (destino.x - p.x) * v;
          const y = p.y + (destino.y - p.y) * v - Math.sin(v * Math.PI) * 140 * u;
          const tam = 120 * u * (1 - v * 0.7);
          return (
            <React.Fragment key={i}>
              <Toque x={p.x} y={p.y} en={en} tam={84 * u} />
              {visible && (
                <Img
                  src={staticFile(`sanbenito/productos/${t.foto}`)}
                  style={{
                    position: "absolute",
                    left: x - tam / 2,
                    top: y - tam / 2,
                    height: tam,
                    filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.35))",
                    opacity: interpolate(v, [0, 0.85, 1], [1, 1, 0]),
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
        {/* contador del ticket */}
        <div
          style={{
            position: "absolute",
            left: destino.x - 17 * u,
            top: destino.y - 17 * u,
            width: 34 * u,
            height: 34 * u,
            borderRadius: "50%",
            background: `linear-gradient(140deg, ${C.oroClaro}, ${C.oro})`,
            color: C.tinta,
            fontFamily: F.texto,
            fontWeight: 600,
            fontSize: 20 * u,
            display: "grid",
            placeItems: "center",
            transform: `scale(${1 + (cuenta ? Math.max(0, 0.35 - anim(f, m.toques[cuenta - 1] + m.vuelo, 10, 0, 0.35)) : 0)})`,
            boxShadow: "0 0 0 3px rgba(15,39,71,0.9)",
          }}
        >
          {cuenta}
        </div>
      </Telefono>
    </Escena>
  );
};

/* ================= 5. El ticket ================= */

const LINEAS: { izq: string; der?: string; tipo?: "titulo" | "centro" | "corte" | "total" | "promo" | "chico" }[] = [
  { izq: "SAN BENITO", tipo: "titulo" },
  { izq: "Tu mejor elección", tipo: "centro" },
  { izq: "EMILIO CIVIT 93 · LAS CATITAS", tipo: "chico" },
  { izq: "REMO FALSIANI 55 · LA DORMIDA", tipo: "chico" },
  { izq: "", tipo: "corte" },
  { izq: "PEDIDO N.º", der: "261128-001" },
  { izq: "CLIENTE", der: "ANA PÉREZ" },
  { izq: "", tipo: "corte" },
  { izq: "2 x $ 1.490", tipo: "chico" },
  { izq: "YERBA MATE CHAMIGO", der: "$ 2.980" },
  { izq: "Promo llevando 2", der: "-$ 290", tipo: "promo" },
  { izq: "YERBA MATE MATEANDO", der: "$ 2.390" },
  { izq: "ACEITE COCINERO 900", der: "$ 3.990" },
  { izq: "", tipo: "corte" },
  { izq: "TOTAL", der: "$ 9.070", tipo: "total" },
  { izq: "Ahorraste $ 290", tipo: "centro" },
];

const CodigoBarras: React.FC<{ ancho: number; alto: number }> = ({ ancho, alto }) => {
  const barras = React.useMemo(() => {
    const r: number[] = [];
    let s = 7;
    for (let i = 0; i < 64; i++) {
      s = (s * 9301 + 49297) % 233280;
      r.push(1 + Math.floor((s / 233280) * 3));
    }
    return r;
  }, []);
  const total = barras.reduce((a, b) => a + b, 0) * 2;
  return (
    <div style={{ display: "flex", height: alto, width: ancho, margin: "0 auto" }}>
      {barras.map((b, i) => (
        <React.Fragment key={i}>
          <span style={{ width: (b / total) * ancho, background: "#2a2622" }} />
          <span style={{ width: (((i * 7) % 3) + 1) * (ancho / total) }} />
        </React.Fragment>
      ))}
    </div>
  );
};

export const Ticket: React.FC = () => {
  const f = useCurrentFrame();
  const { W, H, u, vertical } = useDisenio();
  const m = M.ticket;
  const ancho = (vertical ? 720 : 560) * u;
  const fs = ancho / 24;
  const alturaLinea = fs * 1.55;
  const altoPapel = LINEAS.length * alturaLinea + fs * 7.5;
  const ranura = vertical ? H - 170 * u : H - 70 * u;
  const x = vertical ? (W - ancho) / 2 : W * 0.64 - ancho / 2;
  // El papel sale de a tirones, como una impresora térmica
  const p = anim(f, m.imprime, m.fin - m.imprime, 0, 1, (t) => t);
  const tirones = p + Math.sin(p * Math.PI * 22) * 0.004;
  const salido = Math.min(altoPapel, altoPapel * tirones + (f > m.fin ? anim(f, m.fin, 30, 0, 24 * u) : 0));
  const brilloTotal = anim(f, m.total, 16) * (1 - anim(f, m.total + 30, 30));
  return (
    <Escena duracion={E.ticket.dur} fondo={<FondoLapis deriva={E.ticket.desde} claro />}>
      <PolvoOro semilla="ticket" cantidad={24} />
      <Bloque
        paso="02 · Armá tu ticket"
        titulo={["Tu ticket,", "como en la caja."]}
        sub="El total al instante, con las promociones aplicadas. Copialo, envialo o mandalo por WhatsApp."
        ancho={vertical ? W - 170 * u : 620 * u}
        estilo={vertical ? { left: 85 * u, top: 150 * u } : { left: 130 * u, top: H / 2 - 230 * u }}
      />
      {/* papel que sale de la ranura */}
      <div style={{ position: "absolute", left: x - 30 * u, width: ancho + 60 * u, top: ranura - altoPapel - 40 * u, height: altoPapel + 40 * u, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: 30 * u,
            width: ancho,
            top: 40 * u + altoPapel - salido,
            height: altoPapel,
            transform: `rotate(${(f > m.fin ? anim(f, m.fin, 40, 0, -1.2, SUAVE) : 0)}deg)`,
            transformOrigin: "50% 100%",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `${C.papel} url(${staticFile("sanbenito/texturas/papel.webp")})`,
              backgroundSize: `${ancho * 0.8}px`,
              backgroundBlendMode: "multiply",
              boxShadow: "0 30px 50px -20px rgba(0,0,0,0.6)",
              padding: `${fs * 2}px ${fs * 1.6}px`,
              fontFamily: F.ticket,
              fontSize: fs,
              color: "#2a2622",
              textShadow: "0 0 0.6px rgba(42,38,34,0.55)",
              WebkitMaskImage: `conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg)`,
              WebkitMaskSize: `${fs * 0.9}px 100%`,
              WebkitMaskPosition: "50% 0",
            }}
          >
            {LINEAS.map((l, i) => {
              if (l.tipo === "corte") {
                return <div key={i} style={{ height: alturaLinea, borderTop: `${Math.max(1, fs * 0.08)}px dashed rgba(42,38,34,0.55)`, marginTop: alturaLinea * 0.5 }} />;
              }
              const centro = l.tipo === "titulo" || l.tipo === "centro" || l.tipo === "chico";
              return (
                <div
                  key={i}
                  style={{
                    height: alturaLinea,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: centro ? "center" : "space-between",
                    gap: fs * 0.4,
                    fontWeight: l.tipo === "titulo" || l.tipo === "total" ? 700 : 400,
                    fontSize: l.tipo === "titulo" ? fs * 1.45 : l.tipo === "total" ? fs * 1.25 : l.tipo === "chico" ? fs * 0.82 : fs,
                    letterSpacing: l.tipo === "titulo" ? "0.3em" : undefined,
                    color: l.tipo === "promo" ? "#7a1a2a" : undefined,
                    position: "relative",
                  }}
                >
                  {l.tipo === "total" && (
                    <div
                      style={{
                        position: "absolute",
                        inset: `-${fs * 0.2}px -${fs * 0.6}px`,
                        background: `linear-gradient(90deg, transparent, rgba(201,164,76,0.35), transparent)`,
                        opacity: brilloTotal,
                      }}
                    />
                  )}
                  <span style={{ position: "relative" }}>{l.izq}</span>
                  {l.der && (
                    <>
                      <span style={{ flex: 1, borderBottom: `${Math.max(1, fs * 0.08)}px dotted rgba(42,38,34,0.45)`, transform: `translateY(${fs * 0.3}px)` }} />
                      <span style={{ position: "relative" }}>{l.der}</span>
                    </>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop: fs * 1.2 }}>
              <CodigoBarras ancho={ancho * 0.62} alto={fs * 2.2} />
            </div>
          </div>
        </div>
      </div>
      {/* ranura de la impresora */}
      <div
        style={{
          position: "absolute",
          left: x - 50 * u,
          width: ancho + 100 * u,
          top: ranura - 6 * u,
          height: 34 * u,
          borderRadius: 17 * u,
          background: "linear-gradient(180deg, #0b1526, #050b16)",
          boxShadow: `0 1px 0 ${C.oro}, 0 -1px 0 rgba(241,221,160,0.4), 0 20px 40px rgba(0,0,0,0.5)`,
          opacity: anim(f, 0, 16),
        }}
      />
    </Escena>
  );
};

/* ================= 6. Envío y aviso ================= */

export const Envio: React.FC = () => {
  const f = useCurrentFrame();
  const { W, H, u, vertical } = useDisenio();
  const m = M.envio;
  const altoTel = (vertical ? 1000 : 900) * u;
  const anchoTel = (altoTel - altoTel * 0.036) * (390 / 664) + altoTel * 0.036;
  const pos = vertical ? { left: (W - anchoTel) / 2 - 60 * u, top: H - altoTel - 110 * u } : { left: W * 0.25 - anchoTel / 2, top: (H - altoTel) / 2 + 10 * u };
  const boton = puntoTel(altoTel, 195, 528);
  const aviso = anim(f, m.listo + 6, 20);
  return (
    <Escena duracion={E.envio.dur} fondo={<FondoMarfil />}>
      <Telefono
        alto={altoTel}
        estilo={pos}
        entrada={2}
        capturas={[
          { src: "tel-ticket.png", desde: 0 },
          { src: "tel-enviado.png", desde: m.enviado },
          { src: "tel-listo.png", desde: m.listo },
        ]}
      >
        <Toque x={boton.x} y={boton.y} en={m.toque} tam={110 * u} />
      </Telefono>
      <div style={{ position: "absolute", ...(vertical ? { left: 85 * u, top: 160 * u, width: W - 170 * u } : { left: W * 0.47, top: H / 2 - 260 * u, width: 800 * u }) }}>
        <Bloque
          paso="03 · Envialo"
          titulo={["Envialo al negocio", "y pasá a retirar."]}
          sub="Sin cuentas ni contraseñas: tu nombre, DNI y celular quedan guardados en tu teléfono."
          claro
          ancho={vertical ? W - 170 * u : 760 * u}
          estilo={{ position: "relative" }}
        />
        <Aparece desde={m.listo} estilo={{ marginTop: 26 * u, fontFamily: F.titulo, fontStyle: "italic", fontWeight: 500, fontSize: 44 * u, color: C.oroSombra }}>
          Te avisamos cuando tu pedido está listo.
        </Aparece>
      </div>
      {/* mensaje del negocio por WhatsApp */}
      <div
        style={{
          position: "absolute",
          ...(vertical ? { right: 60 * u, top: H - altoTel + 120 * u, width: 620 * u } : { left: W * 0.47, top: H / 2 + 250 * u, width: 620 * u }),
          background: "#FFFFFF",
          borderRadius: 26 * u,
          padding: `${22 * u}px ${28 * u}px`,
          boxShadow: "0 24px 60px -20px rgba(31,27,22,0.35), 0 0 0 1px rgba(201,164,76,0.35)",
          transform: `translateY(${(1 - aviso) * 30 * u}px) scale(${0.96 + aviso * 0.04})`,
          opacity: aviso,
          fontFamily: F.texto,
          color: C.tinta,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 * u, fontSize: 22 * u, color: C.tinta2 }}>
          <span style={{ width: 12 * u, height: 12 * u, borderRadius: "50%", background: "#25A35A" }} />
          Mensaje de San Benito · ahora
        </div>
        <div style={{ marginTop: 10 * u, fontSize: 28 * u, lineHeight: 1.4 }}>
          Hola Ana, tu pedido N.º 261128-001 ya está listo. Podés pasar a retirarlo. ¡Gracias por elegirnos!
        </div>
      </div>
    </Escena>
  );
};

/* ================= 7. Ofertas ================= */

const Etiqueta: React.FC<{ foto: string; nombre: string; llevando: string; precio: string; desde: number; estilo: React.CSSProperties }> = ({
  foto,
  nombre,
  llevando,
  precio,
  desde,
  estilo,
}) => {
  const f = useCurrentFrame();
  const { u } = useDisenio();
  const t = anim(f, desde, 22);
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        gap: 26 * u,
        padding: `${20 * u}px ${34 * u}px ${20 * u}px ${20 * u}px`,
        borderRadius: 18 * u,
        background: `linear-gradient(${C.papel}, ${C.papel}) padding-box, linear-gradient(135deg, ${C.oroSombra}, ${C.oroClaro}, ${C.oro}, ${C.oroSombra}) border-box`,
        border: `${2 * u}px solid transparent`,
        boxShadow: `inset 0 0 0 ${5 * u}px ${C.papel}, inset 0 0 0 ${6.5 * u}px rgba(201,164,76,0.55), 0 30px 60px -24px rgba(20,0,6,0.6)`,
        transform: `translateX(${(1 - t) * -60 * u}px) rotate(${(1 - t) * -3}deg)`,
        opacity: t,
        ...estilo,
      }}
    >
      <Img src={staticFile(`sanbenito/productos/${foto}`)} style={{ height: 150 * u, filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.25))" }} />
      <div>
        <div style={{ fontFamily: F.texto, fontSize: 26 * u, color: C.tinta }}>{nombre}</div>
        <div
          style={{
            display: "inline-block",
            marginTop: 10 * u,
            padding: `${4 * u}px ${12 * u}px`,
            borderRadius: 8 * u,
            background: `radial-gradient(120% 140% at 30% 0%, rgba(255,255,255,0.18), transparent 55%), ${C.carmesi}`,
            color: C.marfil,
            fontFamily: F.texto,
            fontSize: 22 * u,
          }}
        >
          {llevando}
        </div>
        <div style={{ fontFamily: F.titulo, fontWeight: 600, fontSize: 76 * u, lineHeight: 1, color: C.tinta, marginTop: 6 * u }}>{precio}</div>
      </div>
    </div>
  );
};

export const Ofertas: React.FC = () => {
  const f = useCurrentFrame();
  const { W, H, u, vertical } = useDisenio();
  const m = M.ofertas;
  const afiches = ["yerba-chamigo.webp", "promo-fideos-pure.webp", "pollo-cuarto-trasero.webp"];
  const altoAfiche = (vertical ? 560 : 560) * u;
  const centro = vertical ? { x: W / 2, y: H * 0.46 } : { x: W * 0.72, y: H * 0.52 };
  return (
    <Escena duracion={E.ofertas.dur} fondo={<FondoTerciopelo />}>
      <PolvoOro semilla="ofertas" cantidad={22} intensidad={0.7} />
      {afiches.map((a, i) => {
        const t = anim(f, m.afiches + i * 6, 24);
        const giro = [-9, 0, 9][i];
        const dx = [-1, 0, 1][i] * altoAfiche * (vertical ? 0.42 : 0.46);
        return (
          <Img
            key={a}
            src={staticFile(`sanbenito/afiches/${a}`)}
            style={{
              position: "absolute",
              height: altoAfiche,
              left: centro.x + dx,
              top: centro.y - altoAfiche / 2 + Math.abs(giro) * 3 * u,
              transform: `translateX(-50%) translateY(${(1 - t) * 80 * u + Math.sin(f / 30 + i) * 6 * u}px) rotate(${giro * t}deg)`,
              opacity: t,
              borderRadius: 10 * u,
              boxShadow: "0 30px 60px -20px rgba(20,0,6,0.7)",
              zIndex: i === 1 ? 2 : 1,
            }}
          />
        );
      })}
      <Bloque
        paso="Ofertas"
        titulo={["Ofertas que se notan."]}
        sub="Precios por cantidad que el ticket aplica solo, y las promociones de la semana."
        ancho={vertical ? W - 170 * u : 760 * u}
        estilo={vertical ? { left: 85 * u, top: 150 * u } : { left: 130 * u, top: 150 * u }}
      />
      <Etiqueta
        foto="yerba-chamigo.webp"
        nombre="Yerba mate Chamigo · 500 g"
        llevando="Llevando 2"
        precio="$ 2.690"
        desde={m.etiquetas[0]}
        estilo={vertical ? { left: 85 * u, top: H - 560 * u } : { left: 130 * u, top: H - 520 * u }}
      />
      <Etiqueta
        foto="pollo-cuarto-trasero.webp"
        nombre="Pollo cuarto trasero · 1 kg"
        llevando="Llevando 3"
        precio="$ 9.990"
        desde={m.etiquetas[1]}
        estilo={vertical ? { left: 85 * u, top: H - 330 * u } : { left: 130 * u, top: H - 290 * u }}
      />
    </Escena>
  );
};

/* ================= 8. El negocio (AGL) ================= */

export const Negocio: React.FC = () => {
  const f = useCurrentFrame();
  const { W, H, u, vertical } = useDisenio();
  const m = M.negocio;
  const ancho = vertical ? W - 120 * u : 1080 * u;
  const pos = vertical ? { left: 60 * u, top: H * 0.45 } : { left: W - ancho - 110 * u, top: H / 2 - (ancho / 1.6) / 2 - 10 * u };
  const altoImg = ancho / 1.6;
  const verPrecios = anim(f, m.precios, 16, 0, 1, SUAVE);
  return (
    <Escena duracion={E.negocio.dur} fondo={<FondoMarfil />}>
      <Bloque
        paso="Del otro lado del mostrador"
        titulo={["El negocio,", "siempre al día."]}
        sub="Cada pedido llega con los datos del cliente. Precios, ofertas y fotos se cambian al instante."
        claro
        ancho={vertical ? W - 170 * u : 560 * u}
        estilo={vertical ? { left: 85 * u, top: 160 * u } : { left: 130 * u, top: H / 2 - 260 * u }}
      />
      <div style={{ opacity: 1 - verPrecios }}>
        <Navegador
          ancho={ancho}
          titulo="San Benito · AGL · Pedidos"
          capturas={[{ src: "pc-agl-pedidos.png", desde: 0 }]}
          foco={{ x: 0.2146, y: 0.661, zoom: 1.45, desde: 14, dur: 46 }}
          estilo={pos}
        >
          <Toque x={ancho * 0.2146} y={altoImg * 0.661} en={m.toque} tam={70 * u} />
        </Navegador>
      </div>
      <div style={{ opacity: verPrecios }}>
        <Navegador
          ancho={ancho}
          titulo="San Benito · AGL · Productos y precios"
          capturas={[{ src: "pc-agl-precios.png", desde: 0 }]}
          foco={{ x: 0.36, y: 0.46, zoom: 1.2, desde: m.precios, dur: 50 }}
          estilo={{ ...pos, opacity: 1, transform: "none" }}
        />
      </div>
    </Escena>
  );
};

/* ================= 9. Ubicación ================= */

const Pin: React.FC<{ x: number; y: number; en: number; tam: number }> = ({ x, y, en, tam }) => {
  const f = useCurrentFrame();
  const t = anim(f, en, 20);
  const onda = anim(f, en + 10, 40, 0, 1, SUAVE);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - tam * 1.4,
          top: y - tam * 0.35,
          width: tam * 2.8,
          height: tam * 0.7,
          borderRadius: "50%",
          border: `2px solid ${C.oroClaro}`,
          transform: `scale(${0.2 + onda * 1.4})`,
          opacity: f >= en + 10 ? (1 - onda) * 0.8 : 0,
        }}
      />
      <svg
        width={tam}
        height={tam * 1.35}
        viewBox="0 0 40 54"
        style={{ position: "absolute", left: x - tam / 2, top: y - tam * 1.35, transform: `translateY(${(1 - t) * -60}px)`, opacity: t, filter: "drop-shadow(0 8px 8px rgba(0,0,0,0.45))" }}
      >
        <defs>
          <linearGradient id="pinOro" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.oroClaro} />
            <stop offset="0.5" stopColor={C.oro} />
            <stop offset="1" stopColor={C.oroSombra} />
          </linearGradient>
        </defs>
        <path d="M20 53 C20 53 2 32 2 20 A18 18 0 1 1 38 20 C38 32 20 53 20 53 Z" fill="url(#pinOro)" />
        <circle cx="20" cy="20" r="7" fill={C.lapisNoche} />
      </svg>
    </>
  );
};

export const Ubicacion: React.FC = () => {
  const f = useCurrentFrame();
  const { W, H, u, vertical } = useDisenio();
  const m = M.ubicacion;
  const mapa = vertical ? { left: 60 * u, top: H * 0.36, width: W - 120 * u, height: H * 0.5 } : { left: W * 0.44, top: H * 0.16, width: W * 0.5, height: H * 0.68 };
  const a = { x: mapa.width * 0.26, y: mapa.height * 0.56 };
  const b = { x: mapa.width * 0.76, y: mapa.height * 0.42 };
  const dibujo = anim(f, 8, 60, 0, 1, SUAVE);
  const ruta = anim(f, m.pines[1] + 10, 40, 0, 1, SUAVE);
  const caminos = [
    `M0 ${mapa.height * 0.7} C ${mapa.width * 0.3} ${mapa.height * 0.62}, ${mapa.width * 0.6} ${mapa.height * 0.5}, ${mapa.width} ${mapa.height * 0.38}`,
    `M${mapa.width * 0.15} 0 C ${mapa.width * 0.2} ${mapa.height * 0.4}, ${mapa.width * 0.3} ${mapa.height * 0.7}, ${mapa.width * 0.22} ${mapa.height}`,
    `M${mapa.width * 0.7} 0 C ${mapa.width * 0.72} ${mapa.height * 0.3}, ${mapa.width * 0.82} ${mapa.height * 0.6}, ${mapa.width * 0.9} ${mapa.height}`,
    `M0 ${mapa.height * 0.25} C ${mapa.width * 0.35} ${mapa.height * 0.3}, ${mapa.width * 0.55} ${mapa.height * 0.2}, ${mapa.width} ${mapa.height * 0.12}`,
  ];
  const etiqueta = (p: { x: number; y: number }, pueblo: string, calle: string, en: number) => {
    const t = anim(f, en + 8, 20);
    return (
      <div
        style={{
          position: "absolute",
          left: p.x,
          top: p.y + 22 * u,
          transform: `translateX(-50%) translateY(${(1 - t) * 16 * u}px)`,
          opacity: t,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontFamily: F.titulo, fontWeight: 500, fontSize: 58 * u, color: C.marfil, lineHeight: 1.05 }}>{pueblo}</div>
        <div style={{ fontFamily: F.texto, fontSize: 28 * u, color: "rgba(247,243,234,0.75)", marginTop: 6 * u }}>{calle}</div>
      </div>
    );
  };
  return (
    <Escena duracion={E.ubicacion.dur} fondo={<FondoLapis deriva={E.ubicacion.desde} />}>
      <PolvoOro semilla="ubicacion" cantidad={22} />
      <Bloque
        paso="Dónde estamos"
        titulo={["Te esperamos."]}
        sub="Pasá a retirar tu pedido por cualquiera de nuestras dos sucursales, en Mendoza."
        ancho={vertical ? W - 170 * u : 620 * u}
        estilo={vertical ? { left: 85 * u, top: 170 * u } : { left: 130 * u, top: H / 2 - 200 * u }}
      />
      <div style={{ position: "absolute", ...mapa }}>
        <svg width={mapa.width} height={mapa.height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* grilla grabada */}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(mapa.width / 8) * i}
              y1={0}
              x2={(mapa.width / 8) * i}
              y2={mapa.height * dibujo}
              stroke={C.oro}
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(mapa.height / 5) * i}
              x2={mapa.width * dibujo}
              y2={(mapa.height / 5) * i}
              stroke={C.oro}
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          ))}
          {caminos.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={C.oro}
              strokeOpacity={0.45}
              strokeWidth={i === 0 ? 2.5 * u : 1.4 * u}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - anim(f, 10 + i * 6, 50, 0, 1, SUAVE)}
            />
          ))}
          <path
            d={`M${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - mapa.height * 0.18} ${b.x} ${b.y}`}
            fill="none"
            stroke={C.oroClaro}
            strokeWidth={3 * u}
            strokeDasharray={`${10 * u} ${12 * u}`}
            strokeDashoffset={-f * 0.8}
            opacity={ruta}
            style={{ clipPath: `inset(0 ${(1 - ruta) * 100}% 0 0)` }}
          />
        </svg>
        <Pin x={a.x} y={a.y} en={m.pines[0]} tam={54 * u} />
        <Pin x={b.x} y={b.y} en={m.pines[1]} tam={54 * u} />
        {etiqueta(a, "Las Catitas", "Emilio Civit 93", m.pines[0])}
        {etiqueta(b, "La Dormida", "Remo Falsiani 55", m.pines[1])}
      </div>
    </Escena>
  );
};

/* ================= 10. Cierre ================= */

export const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const { u, vertical } = useDisenio();
  const m = M.cierre;
  const tam = (vertical ? 170 : 186) * u;
  const pasos = ["Elegí", "Armá tu ticket", "Retirá"];
  const apagado = anim(f, m.final, E.cierre.dur - m.final, 0, 1, SUAVE);
  return (
    <Escena duracion={E.cierre.dur} fondo={<FondoLapis deriva={E.cierre.desde} />}>
      <PolvoOro semilla="cierre" cantidad={50} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", opacity: 1 - apagado }}>
        <div style={{ fontFamily: F.titulo, fontWeight: 500, fontSize: tam, lineHeight: 1.05, color: C.marfil, whiteSpace: "nowrap" }}>
          {"San Benito".split("").map((l, i) => {
            const t = anim(f, 8 + i * 2.2, 30);
            return (
              <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingTop: "0.05em" }}>
                <span style={{ display: "inline-block", transform: `translateY(${(1 - t) * 105}%)`, opacity: t }}>{l === " " ? " " : l}</span>
              </span>
            );
          })}
        </div>
        <Revelar texto="Tu mejor elección" desde={34} oro estilo={{ fontFamily: F.titulo, fontStyle: "italic", fontWeight: 500, fontSize: tam * 0.36 }} />
        <Filete desde={46} ancho={(vertical ? 420 : 520) * u} estilo={{ margin: `${40 * u}px 0` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 26 * u, flexWrap: "wrap", justifyContent: "center" }}>
          {pasos.map((p, i) => {
            const t = anim(f, m.pasos[i], 18);
            return (
              <React.Fragment key={p}>
                {i > 0 && <span style={{ width: 10 * u, height: 10 * u, transform: "rotate(45deg)", background: C.oro, opacity: t }} />}
                <span
                  style={{
                    fontFamily: F.titulo,
                    fontWeight: 500,
                    fontSize: (vertical ? 58 : 62) * u,
                    color: C.marfil,
                    opacity: t,
                    transform: `translateY(${(1 - t) * 16 * u}px)`,
                  }}
                >
                  {p}
                </span>
              </React.Fragment>
            );
          })}
        </div>
        <Aparece desde={124} estilo={{ fontFamily: F.texto, fontSize: 32 * u, color: C.oroClaro, marginTop: 44 * u, letterSpacing: "0.03em" }}>
          Hacé tu pedido desde la web de San Benito
        </Aparece>
        <Aparece
          desde={142}
          estilo={{
            fontFamily: F.texto,
            fontSize: 28 * u,
            lineHeight: 1.6,
            color: "rgba(247,243,234,0.72)",
            marginTop: 22 * u,
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            gap: vertical ? 0 : 30 * u,
            alignItems: "center",
          }}
        >
          <span>Las Catitas · Emilio Civit 93</span>
          {!vertical && <span style={{ color: C.oro }}>|</span>}
          <span>La Dormida · Remo Falsiani 55</span>
        </Aparece>
      </AbsoluteFill>
    </Escena>
  );
};
