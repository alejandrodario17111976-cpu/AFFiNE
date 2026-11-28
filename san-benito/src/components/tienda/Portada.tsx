"use client";

import { useRef, useSyncExternalStore } from "react";
import { View } from "@react-three/drei";
import type { Tienda } from "@/lib/tipos";
import { descuento } from "@/lib/formato";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import EscenaPortada from "@/components/escena/EscenaPortada";
import { scrollPortada } from "@/components/escena/compartido";
import { IconoFlecha } from "./Iconos";

/** true en celulares (menos de 768 px de ancho). En el servidor arranca en false. */
function useAngosto() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

export default function Portada({
  tienda,
  irAPasillo,
}: {
  tienda: Tienda;
  irAPasillo: (id: string) => void;
}) {
  const seccion = useRef<HTMLElement>(null);
  const { negocio, productos, categorias, textos, secciones } = tienda;

  const disponibles = productos.filter((p) => p.disponible);
  const marcados = disponibles.filter((p) => p.destacado);
  const angosto = useAngosto();
  const destacados = (marcados.length ? marcados : disponibles).slice(0, angosto ? 4 : 6);
  const ofertas = disponibles.filter((p) => descuento(p) > 0).length;
  const conProductos = categorias.filter((c) => productos.some((p) => p.categoria === c.id));

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
        // "San Benito" entra letra por letra, cada una saliendo de su propia máscara
        const titulo = SplitText.create(".portada-titulo", { type: "words,chars", mask: "chars" });
        gsap.from(titulo.chars, {
          yPercent: 110,
          rotate: 6,
          duration: 1,
          ease: "expo.out",
          stagger: 0.04,
          delay: 0.1,
        });
        gsap.from(".portada-eslogan", { y: 18, opacity: 0, filter: "blur(8px)", duration: 0.9, ease: "power3.out", delay: 0.55 });
        gsap.from(".portada-entra", {
          y: 12,
          opacity: 0,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.05,
        });
      });
      return () => {
        st.kill();
        mm.revert();
      };
    },
    { scope: seccion },
  );

  return (
    <section
      id="inicio"
      ref={seccion}
      className="grano relative flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(180deg,var(--color-lapis-medio)_0%,var(--color-lapis-hondo)_55%,var(--color-lapis-noche)_100%)] pt-[var(--alto-encabezado)] text-marfil"
    >
      <div className="mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-y-4 px-4 md:grid-cols-12 md:gap-x-8 md:px-8">
        <div className="relative z-20 pt-12 md:col-span-5 md:pt-0">
          <p className="portada-entra text-sm text-marfil/60 tabular-nums">
            {productos.length} productos · {conProductos.length} {conProductos.length === 1 ? "pasillo" : "pasillos"}
          </p>
          <h1 className="portada-titulo mt-4 font-titulo text-[clamp(4rem,10vw,9.5rem)] leading-[0.9] font-semibold tracking-[-0.015em]">
            {negocio.nombre}
          </h1>
          <p className="portada-eslogan mt-3 font-titulo texto-oro text-[clamp(1.9rem,3.4vw,3rem)] leading-tight font-semibold">
            {negocio.eslogan}
          </p>
          {textos.portadaTexto && (
            <p className="portada-entra mt-6 max-w-[36rem] text-lg leading-relaxed text-marfil/75">{textos.portadaTexto}</p>
          )}
          <div className="portada-entra mt-8 flex flex-wrap gap-3">
            <a
              href="#productos"
              className="boton-oro flex h-12 items-center gap-2 rounded-[10px] px-5 font-medium text-tinta"
            >
              {textos.botonProductos} <IconoFlecha />
            </a>
            {secciones.ofertas && ofertas > 0 && (
              <a
                href="#ofertas"
                className="flex h-12 items-center gap-3 rounded-[10px] border border-marfil/20 px-5 text-marfil transition-colors duration-150 ease-sb hover:bg-marfil/5"
              >
                {textos.botonOfertas}
                <span className="text-sm text-marfil/60 tabular-nums">{ofertas}</span>
              </a>
            )}
          </div>
        </div>

        <div className="relative -mx-4 h-[52svh] min-h-[320px] md:col-span-7 md:mx-0 md:h-[min(78svh,760px)]">
          <View className="absolute inset-0">
            <EscenaPortada productos={destacados} />
          </View>
        </div>
      </div>

      {conProductos.length > 0 && (
        <nav aria-label="Pasillos" className="relative z-20 border-t border-marfil/10">
          <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-4 py-3 md:px-8">
            <span className="mr-3 shrink-0 text-sm text-marfil/50">Pasillos</span>
            {conProductos.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => irAPasillo(c.id)}
                className="shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm text-marfil/80 transition-colors duration-150 ease-sb hover:bg-marfil/5 hover:text-marfil"
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </nav>
      )}
    </section>
  );
}
