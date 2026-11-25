"use client";

import { useCallback, useRef, useState } from "react";
import type { Tienda as DatosTienda } from "@/lib/tipos";
import { descuento } from "@/lib/formato";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import Escena3D from "@/components/escena/Escena3D";
import { CarritoProvider } from "./carrito";
import Encabezado, { type Enlace } from "./Encabezado";
import Portada from "./Portada";
import Gondola from "./Gondola";
import Pasillos from "./Pasillos";
import { ComoComprar, Ofertas, Pie } from "./Secciones";
import Ticket from "./Ticket";

export default function Tienda({ tienda }: { tienda: DatosTienda }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [filtro, setFiltro] = useState("todas");
  const { negocio, productos } = tienda;

  const hayOfertas = productos.some((p) => p.disponible && descuento(p) > 0);
  const hayContacto = Boolean(negocio.direccion || negocio.horarios || negocio.whatsapp || negocio.instagram);
  const enlaces: Enlace[] = [
    { href: "#productos", texto: "Productos" },
    { href: "#pasillos", texto: "Pasillos" },
    ...(hayOfertas ? [{ href: "#ofertas", texto: "Ofertas" }] : []),
    { href: "#como-comprar", texto: "Cómo comprar" },
    ...(hayContacto ? [{ href: "#contacto", texto: "Contacto" }] : []),
  ];

  const irAPasillo = useCallback((id: string) => {
    setFiltro(id);
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Títulos de sección que suben al entrar en pantalla.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".titulo-seccion").forEach((el) => {
          gsap.from(el, {
            yPercent: 40,
            opacity: 0,
            duration: 0.8,
            ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });
      });
      // Recalcular posiciones cuando cambia el alto de la góndola (filtros y búsqueda).
      const observador = new ResizeObserver(() => ScrollTrigger.refresh());
      const gondola = document.getElementById("productos");
      if (gondola) observador.observe(gondola);
      return () => {
        observador.disconnect();
        mm.revert();
      };
    },
    { scope: raiz },
  );

  return (
    <CarritoProvider productos={productos} negocio={negocio}>
      <div ref={raiz} className="relative">
        <a
          href="#productos"
          className="sr-only z-[70] bg-amarillo p-3 font-bold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Ir a los productos
        </a>
        <Encabezado enlaces={enlaces} />
        <main>
          <Portada tienda={tienda} />
          <Gondola tienda={tienda} filtro={filtro} setFiltro={setFiltro} />
          <Pasillos tienda={tienda} irAPasillo={irAPasillo} />
          <Ofertas tienda={tienda} />
          <ComoComprar tienda={tienda} />
        </main>
        <Pie tienda={tienda} />
        <Ticket />
        <Escena3D />
      </div>
    </CarritoProvider>
  );
}
