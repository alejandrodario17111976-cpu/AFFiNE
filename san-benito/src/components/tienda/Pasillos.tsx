"use client";

import { useRef } from "react";
import type { Tienda } from "@/lib/tipos";
import { numeroPasillo, textoSobre } from "@/lib/formato";
import { PALETA } from "@/lib/tipos";
import { gsap, useGSAP } from "@/lib/gsap";
import { Vista3D } from "./TarjetaProducto";
import { useCarrito } from "./carrito";
import { IconoFlecha } from "./Iconos";

const FONDO = { rojo: "bg-rojo", amarillo: "bg-amarillo", azul: "bg-azul" } as const;

export default function Pasillos({ tienda, irAPasillo }: { tienda: Tienda; irAPasillo: (id: string) => void }) {
  const seccion = useRef<HTMLElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const { precio } = useCarrito();

  const pasillos = tienda.categorias
    .map((c) => {
      const lista = tienda.productos.filter((p) => p.categoria === c.id);
      const disponibles = lista.filter((p) => p.disponible);
      const desde = disponibles.length ? Math.min(...disponibles.map((p) => p.precio)) : null;
      const muestra = disponibles.find((p) => p.destacado) ?? disponibles[0] ?? lista[0];
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
    <section id="pasillos" ref={seccion} className="relative overflow-hidden border-t-4 border-negro bg-negro">
      <div ref={pista} className="flex flex-col md:h-[100svh] md:w-max md:flex-row">
        <div className="flex flex-col justify-end gap-4 border-b-4 border-negro bg-negro px-4 pt-[calc(var(--alto-encabezado)+2rem)] pb-10 text-blanco md:w-[46vw] md:border-r-4 md:border-b-0 md:px-8 md:pb-16">
          <h2 className="font-display text-[clamp(3.25rem,10vw,10rem)] leading-[0.8] tracking-[-0.05em] text-amarillo uppercase">
            Pasillos
          </h2>
          <p className="max-w-md font-mono text-lg font-bold">
            Recorré el negocio por pasillo y entrá directo a lo que buscás.
          </p>
        </div>

        {pasillos.map(({ categoria, cantidad, desde, muestra }, i) => {
          const tinta = textoSobre(PALETA[categoria.color]);
          const palabraMasLarga = Math.max(...categoria.nombre.split(/\s+/).map((w) => w.length), 4);
          return (
            <article
              key={categoria.id}
              className={`relative grid border-b-4 border-negro md:h-full md:w-[78vw] md:grid-cols-2 md:border-r-4 md:border-b-0 lg:w-[66vw] ${FONDO[categoria.color]}`}
              style={{ color: tinta }}
            >
              <div className="relative z-20 flex flex-col justify-end gap-5 px-4 pt-10 pb-8 md:px-8 md:pt-[calc(var(--alto-encabezado)+2rem)] md:pb-16">
                <span className="self-start border-4 border-negro bg-blanco px-2 py-1 font-mono text-base font-bold text-negro">
                  Pasillo {numeroPasillo(i)}
                </span>
                <h3
                  className="font-display text-[min(4.5rem,calc(88vw/(var(--letras)*0.8)))] leading-[0.85] tracking-[-0.05em] uppercase md:text-[min(8rem,calc(34vw/(var(--letras)*0.8)))] lg:text-[min(8rem,calc(28vw/(var(--letras)*0.8)))]"
                  style={{ "--letras": palabraMasLarga } as React.CSSProperties}
                >
                  {categoria.nombre}
                </h3>
                <dl className="flex flex-wrap gap-3 font-mono text-base font-bold text-negro">
                  <div className="border-4 border-negro bg-blanco px-3 py-2">
                    <dt className="sr-only">Cantidad</dt>
                    <dd>
                      {cantidad} {cantidad === 1 ? "producto" : "productos"}
                    </dd>
                  </div>
                  {desde !== null && (
                    <div className="border-4 border-negro bg-amarillo px-3 py-2">
                      <dt className="sr-only">Precio más bajo</dt>
                      <dd>Desde {precio(desde)}</dd>
                    </div>
                  )}
                </dl>
                <button
                  type="button"
                  onClick={() => irAPasillo(categoria.id)}
                  className="flex cursor-pointer items-center justify-between gap-4 self-start border-4 border-negro bg-negro px-5 py-3 font-display text-lg text-amarillo uppercase shadow-duro-sm transition-transform duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-duro"
                >
                  Ver productos <IconoFlecha />
                </button>
              </div>
              {muestra && <Vista3D producto={muestra} className="h-[42svh] md:my-auto md:h-[62svh]" />}
            </article>
          );
        })}
      </div>
    </section>
  );
}
