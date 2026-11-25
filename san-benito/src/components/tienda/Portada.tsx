"use client";

import { Fragment, useRef } from "react";
import { View } from "@react-three/drei";
import type { Tienda } from "@/lib/tipos";
import { descuento } from "@/lib/formato";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import EscenaPortada from "@/components/escena/EscenaPortada";
import { scrollPortada } from "@/components/escena/compartido";
import { IconoFlecha } from "./Iconos";

export default function Portada({ tienda }: { tienda: Tienda }) {
  const seccion = useRef<HTMLElement>(null);
  const { negocio, productos, categorias } = tienda;

  const disponibles = productos.filter((p) => p.disponible);
  const marcados = disponibles.filter((p) => p.destacado);
  const destacados = (marcados.length ? marcados : disponibles).slice(0, 6);
  const ofertas = disponibles.filter((p) => descuento(p) > 0).length;
  const pasillos = categorias.filter((c) => productos.some((p) => p.categoria === c.id)).length;

  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        trigger: seccion.current,
        start: "top top",
        end: "bottom top",
        onUpdate: (s) => {
          scrollPortada.valor = s.progress;
        },
      });
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".letra", { yPercent: 115, duration: 0.9, ease: "power4.out", stagger: 0.045 });
        gsap.from(".banda-eslogan", { xPercent: -105, duration: 0.85, ease: "power4.out", delay: 0.3 });
        gsap.from(".portada-cta > *", { y: 28, opacity: 0, stagger: 0.08, delay: 0.55, duration: 0.6, ease: "power3.out" });
        const scrub = { trigger: seccion.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to(".marca-gigante", { yPercent: -30, ease: "none", scrollTrigger: scrub });
        gsap.to(".banda-movil", { xPercent: -12, ease: "none", scrollTrigger: scrub });
      });
      return () => {
        st.kill();
        mm.revert();
      };
    },
    { scope: seccion },
  );

  const palabras = negocio.nombre.split(" ");

  return (
    <section
      id="inicio"
      ref={seccion}
      className="relative overflow-hidden bg-rojo pt-[var(--alto-encabezado)] text-negro"
    >
      <h1
        className="marca-gigante px-2 pt-5 font-display text-[clamp(3rem,16.6vw,20rem)] leading-[0.8] tracking-[-0.055em] uppercase sm:px-3"
        aria-label={`${negocio.nombre}, ${negocio.eslogan}`}
      >
        {palabras.map((palabra, i) => (
          <Fragment key={i}>
            <span className="inline-block overflow-hidden pb-[0.04em]" aria-hidden>
              {Array.from(palabra).map((letra, j) => (
                <span key={j} className="letra inline-block">
                  {letra}
                </span>
              ))}
            </span>
            {i < palabras.length - 1 && " "}
          </Fragment>
        ))}
      </h1>

      <div className="banda-movil relative -mx-[4vw] mt-3 w-[112vw]" aria-hidden>
        <p className="banda-eslogan -rotate-2 border-y-4 border-negro bg-amarillo py-[0.12em] pl-[5vw] font-display text-[clamp(2rem,8.4vw,10rem)] leading-[0.95] tracking-[-0.04em] whitespace-nowrap uppercase shadow-duro">
          {negocio.eslogan}
        </p>
      </div>

      <div className="relative grid md:grid-cols-12">
        <div className="relative order-1 h-[44svh] min-h-[300px] md:order-2 md:col-span-8 md:-mt-[6vw] md:h-[70svh]">
          <View className="absolute inset-0">
            <EscenaPortada productos={destacados} />
          </View>
        </div>
        <div className="portada-cta relative z-20 order-2 flex flex-col justify-end gap-4 px-3 pb-8 md:order-1 md:col-span-4 md:px-4 md:pb-12">
          <p className="self-start border-4 border-negro bg-negro px-3 py-2 font-mono text-sm font-bold text-blanco sm:text-base">
            {productos.length} productos · {pasillos} {pasillos === 1 ? "pasillo" : "pasillos"}
          </p>
          <a
            href="#productos"
            className="flex items-center justify-between gap-4 border-4 border-negro bg-amarillo px-5 py-4 font-display text-2xl uppercase shadow-duro transition-transform duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] sm:text-3xl"
          >
            Ver productos <IconoFlecha />
          </a>
          {ofertas > 0 && (
            <a
              href="#ofertas"
              className="flex items-center justify-between gap-4 border-4 border-negro bg-blanco px-5 py-3 font-display text-xl uppercase shadow-duro transition-transform duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0_#000]"
            >
              Ver ofertas
              <span className="border-2 border-negro bg-rojo px-2 text-blanco tabular-nums">{ofertas}</span>
            </a>
          )}
        </div>
      </div>

      <div className="relative z-20 overflow-hidden border-y-4 border-negro bg-azul py-3 text-amarillo" aria-hidden>
        <div className="cinta flex w-max">
          {[0, 1].map((copia) => (
            <div key={copia} className="flex shrink-0 items-center">
              {[...categorias, ...categorias].map((c, i) => (
                <span key={`${c.id}-${i}`} className="flex items-center gap-6 pr-6 font-display text-3xl uppercase md:text-5xl">
                  {c.nombre}
                  <span className="inline-block size-4 bg-rojo md:size-6" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
