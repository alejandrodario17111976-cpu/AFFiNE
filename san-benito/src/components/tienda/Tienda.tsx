"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Tienda as DatosTienda } from "@/lib/tipos";
import { descuento } from "@/lib/formato";
import { estiloMarca, marca3D, ProveedorMarca } from "@/lib/marca";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import Escena3D from "@/components/escena/Escena3D";
import { CarritoProvider } from "./carrito";
import Encabezado, { type Enlace } from "./Encabezado";
import Portada from "./Portada";
import Gondola from "./Gondola";
import Pasillos from "./Pasillos";
import { ComoComprar, Ofertas, Pie } from "./Secciones";
import Ticket from "./Ticket";

/** Espera a que estén las fuentes elegidas, porque las etiquetas 3D se dibujan con ellas. */
function useFuentesListas(titulos: string, texto: string) {
  const [listas, setListas] = useState<string | null>(null);
  const clave = `${titulos}|${texto}`;
  useEffect(() => {
    let vigente = true;
    const cargar = (familia: string, peso: number) => document.fonts.load(`${peso} 64px ${familia}`).catch(() => []);
    Promise.race([
      Promise.all([cargar(titulos, 500), cargar(texto, 500)]),
      new Promise((r) => setTimeout(r, 2500)),
    ]).then(() => {
      if (vigente) setListas(clave);
    });
    return () => {
      vigente = false;
    };
  }, [titulos, texto, clave]);
  return listas === clave;
}

export default function Tienda({ tienda, vistaPrevia = false }: { tienda: DatosTienda; vistaPrevia?: boolean }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [filtro, setFiltro] = useState("todas");
  const { negocio, productos, apariencia, secciones, textos } = tienda;
  const marca = useMemo(() => marca3D(apariencia), [apariencia]);
  const fuentesListas = useFuentesListas(marca.titulos, marca.texto);

  const hayOfertas = secciones.ofertas && productos.some((p) => p.disponible && descuento(p) > 0);
  const hayContacto = Boolean(negocio.direccion || negocio.horarios || negocio.whatsapp || negocio.instagram);
  const enlaces: Enlace[] = [
    { href: "#productos", texto: textos.productosTitulo },
    ...(secciones.pasillos ? [{ href: "#pasillos", texto: textos.pasillosTitulo }] : []),
    ...(hayOfertas ? [{ href: "#ofertas", texto: textos.ofertasTitulo }] : []),
    ...(secciones.comoComprar && textos.pasos.length ? [{ href: "#como-comprar", texto: textos.comoComprarTitulo }] : []),
    ...(hayContacto ? [{ href: "#contacto", texto: "Contacto" }] : []),
  ];

  const irAPasillo = useCallback((id: string) => {
    setFiltro(id);
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".titulo-seccion").forEach((el) => {
          gsap.from(el, {
            y: 16,
            duration: 0.6,
            ease: "power3.out",
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
    <ProveedorMarca value={marca}>
      <CarritoProvider productos={productos} negocio={negocio}>
        <div ref={raiz} className="relative bg-marfil font-texto text-tinta" style={estiloMarca(apariencia)}>
          <a
            href="#productos"
            className="sr-only z-[70] rounded-lg bg-oro p-3 font-medium text-tinta focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            Ir a los productos
          </a>
          <Encabezado enlaces={enlaces} />
          <main>
            <Portada tienda={tienda} irAPasillo={irAPasillo} />
            <Gondola tienda={tienda} filtro={filtro} setFiltro={setFiltro} />
            {secciones.pasillos && <Pasillos tienda={tienda} irAPasillo={irAPasillo} />}
            {secciones.ofertas && <Ofertas tienda={tienda} />}
            {secciones.comoComprar && <ComoComprar tienda={tienda} />}
          </main>
          <Pie tienda={tienda} vistaPrevia={vistaPrevia} />
          <Ticket />
          {fuentesListas && <Escena3D />}
        </div>
      </CarritoProvider>
    </ProveedorMarca>
  );
}
