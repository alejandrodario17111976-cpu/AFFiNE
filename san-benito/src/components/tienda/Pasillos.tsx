"use client";

import { useRef } from "react";
import type { ColorCategoria, Tienda } from "@/lib/tipos";
import { numeroPasillo, urlMedio } from "@/lib/formato";
import { gsap, useGSAP } from "@/lib/gsap";
import { Vista3D } from "./TarjetaProducto";
import { useCarrito } from "./carrito";
import { IconoFlecha } from "./Iconos";

/** Cada color de pasillo es una superficie de la marca con su texto y su escenario para el producto. */
const ESTILO: Record<ColorCategoria, { fondo: string; texto: string; suave: string; escenario: string; boton: string }> = {
  principal: {
    fondo: "bg-lapis-hondo grano",
    texto: "text-marfil",
    suave: "text-marfil/70",
    escenario: "bg-lapis-medio/60",
    boton: "boton-oro text-tinta",
  },
  destacado: {
    fondo: "terciopelo",
    texto: "text-marfil",
    suave: "text-marfil/70",
    escenario: "bg-carmesi/40",
    boton: "bg-marfil text-tinta hover:bg-papel",
  },
  acento: {
    fondo: "bg-oro-claro",
    texto: "text-tinta",
    suave: "text-tinta-2",
    escenario: "bg-papel/60",
    boton: "bg-lapis-hondo text-marfil hover:bg-lapis-medio",
  },
};

export default function Pasillos({ tienda, irAPasillo }: { tienda: Tienda; irAPasillo: (id: string) => void }) {
  const seccion = useRef<HTMLElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const { precio } = useCarrito();
  const { textos } = tienda;

  const pasillos = tienda.categorias
    .map((c) => {
      const lista = tienda.productos.filter((p) => p.categoria === c.id);
      const disponibles = lista.filter((p) => p.disponible);
      const desde = disponibles.length ? Math.min(...disponibles.map((p) => p.precio)) : null;
      const conFoto = disponibles.filter((p) => p.imagen);
      const muestra = conFoto.find((p) => p.destacado) ?? conFoto[0] ?? disponibles[0] ?? lista[0];
      return { categoria: c, cantidad: lista.length, desde, muestra };
    })
    .filter((p) => p.cantidad > 0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const el = pista.current;
        if (!el) return;
        const distancia = () => Math.max(0, el.scrollWidth - window.innerWidth);
        gsap.to(el, {
          x: () => -distancia(),
          ease: "none",
          scrollTrigger: {
            trigger: seccion.current,
            start: "top top",
            end: () => `+=${distancia()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: seccion },
  );

  return (
    <section id="pasillos" ref={seccion} className="papel relative overflow-hidden bg-marfil">
      <div ref={pista} className="flex flex-col md:h-[100svh] md:w-max md:flex-row">
        <div className="flex flex-col justify-center gap-4 px-4 py-20 md:w-[40vw] md:px-12 md:pt-[calc(var(--alto-encabezado)+2rem)]">
          <h2 className="font-titulo text-[clamp(2.75rem,6vw,5rem)] leading-[1] tracking-[-0.02em] text-tinta">
            {textos.pasillosTitulo}
          </h2>
          {textos.pasillosTexto && <p className="max-w-sm text-lg leading-relaxed text-tinta-2">{textos.pasillosTexto}</p>}
          <p className="text-sm text-tinta-3 tabular-nums">{pasillos.length} pasillos</p>
        </div>

        {/* Celular: grilla compacta, con la foto del producto que representa al pasillo */}
        <ul className="grid grid-cols-2 gap-3 px-4 pb-20 md:hidden">
          {pasillos.map(({ categoria, cantidad, desde, muestra }, i) => {
            const e = ESTILO[categoria.color];
            return (
              <li key={categoria.id}>
                <button
                  type="button"
                  onClick={() => irAPasillo(categoria.id)}
                  className={`relative flex h-full min-h-44 w-full cursor-pointer flex-col overflow-hidden rounded-2xl p-3 text-left ${e.fondo} ${e.texto}`}
                >
                  <span className={`text-xs tabular-nums ${e.suave}`}>Pasillo {numeroPasillo(i)}</span>
                  <span className="mt-1 font-titulo text-[1.6rem] leading-[1.05] [overflow-wrap:anywhere]">{categoria.nombre}</span>
                  <span className={`mt-1 text-xs tabular-nums ${e.suave}`}>
                    {cantidad} {cantidad === 1 ? "producto" : "productos"}
                    {desde !== null && <> · desde {precio(desde)}</>}
                  </span>
                  {muestra?.imagen && (
                    // eslint-disable-next-line @next/next/no-img-element -- foto recortada servida desde /medios
                    <img
                      src={urlMedio("imagenes", muestra.imagen)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="mt-auto ml-auto h-20 w-24 object-contain object-right-bottom drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)]"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Computadora: recorrido horizontal con el producto en 3D */}
        {pasillos.map(({ categoria, cantidad, desde, muestra }, i) => {
          const e = ESTILO[categoria.color];
          return (
            <article
              key={categoria.id}
              className={`relative hidden md:grid md:h-full md:w-[52vw] md:grid-cols-[1fr_1fr] lg:w-[42vw] ${e.fondo} ${e.texto}`}
            >
              <div className="relative z-20 flex flex-col justify-center gap-6 px-10 pt-[calc(var(--alto-encabezado)+2rem)] pb-16">
                <span className={`text-sm tabular-nums ${e.suave}`}>Pasillo {numeroPasillo(i)}</span>
                <h3 className="font-titulo text-[clamp(2.5rem,3.6vw,4rem)] leading-[1] tracking-[-0.015em] [overflow-wrap:break-word] [text-wrap:balance]">
                  {categoria.nombre}
                </h3>
                <p className={`text-base tabular-nums ${e.suave}`}>
                  {cantidad} {cantidad === 1 ? "producto" : "productos"}
                  {desde !== null && <> · desde {precio(desde)}</>}
                </p>
                <button
                  type="button"
                  onClick={() => irAPasillo(categoria.id)}
                  className={`flex h-12 cursor-pointer items-center gap-2 self-start rounded-[10px] px-5 font-medium transition-colors duration-150 ease-sb ${e.boton}`}
                >
                  Ver productos <IconoFlecha />
                </button>
              </div>
              {muestra && (
                <div className="relative flex items-center py-16 pr-10">
                  <div className={`relative w-full overflow-hidden rounded-2xl ${e.escenario}`}>
                    <Vista3D producto={muestra} className="h-[52svh]" />
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
