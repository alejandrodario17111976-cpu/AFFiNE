"use client";

import Link from "next/link";
import type { Tienda } from "@/lib/tipos";
import { descuento } from "@/lib/formato";
import TarjetaProducto from "./TarjetaProducto";
import { IconoCamara, IconoMensaje, IconoReloj, IconoUbicacion } from "./Iconos";

export function Ofertas({ tienda }: { tienda: Tienda }) {
  const porCategoria = new Map(tienda.categorias.map((c) => [c.id, c]));
  const ofertas = tienda.productos
    .filter((p) => p.disponible && descuento(p) > 0)
    .sort((a, b) => descuento(b) - descuento(a));
  if (ofertas.length === 0) return null;

  return (
    <section id="ofertas" className="relative border-t-4 border-negro bg-amarillo">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-3 pt-10 pb-8 md:px-6 md:pt-16">
        <h2 className="titulo-seccion font-display text-[clamp(3.25rem,13vw,12rem)] leading-[0.8] tracking-[-0.05em] text-rojo uppercase [text-shadow:6px_6px_0_#000]">
          Ofertas
        </h2>
        <p className="font-mono text-base font-bold">
          {ofertas.length} {ofertas.length === 1 ? "producto rebajado" : "productos rebajados"}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 px-3 pb-12 md:grid-cols-3 md:gap-6 md:px-6 md:pb-20 lg:grid-cols-4">
        {ofertas.map((p) => (
          <li key={p.id}>
            <TarjetaProducto producto={p} categoria={porCategoria.get(p.categoria)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ComoComprar({ tienda }: { tienda: Tienda }) {
  const conWhatsapp = Boolean(tienda.negocio.whatsapp);
  const pasos = [
    { titulo: "Elegí tus productos", texto: "Sumalos al ticket con el botón Agregar." },
    { titulo: "Revisá tu ticket", texto: "Ajustá las cantidades y mirá el total antes de enviarlo." },
    conWhatsapp
      ? { titulo: "Envialo por WhatsApp", texto: "El pedido llega armado al negocio para que lo confirmen." }
      : { titulo: "Copiá tu pedido", texto: "Pegalo en el chat con el negocio para que lo confirmen." },
  ];

  return (
    <section id="como-comprar" className="relative border-t-4 border-negro bg-azul text-blanco">
      <h2 className="titulo-seccion px-3 pt-10 pb-8 font-display text-[clamp(3rem,11vw,10rem)] leading-[0.8] tracking-[-0.05em] text-amarillo uppercase md:px-6 md:pt-16">
        Cómo comprar
      </h2>
      <ol className="grid border-t-4 border-negro md:grid-cols-3">
        {pasos.map((p, i) => (
          <li
            key={p.titulo}
            className="flex flex-col gap-4 border-b-4 border-negro px-4 py-8 md:border-r-4 md:border-b-0 md:px-6 md:py-12 md:last:border-r-0"
          >
            <span className="font-display text-[clamp(5rem,12vw,11rem)] leading-[0.8] text-amarillo tabular-nums">{i + 1}</span>
            <h3 className="font-display text-2xl uppercase md:text-3xl">{p.titulo}</h3>
            <p className="max-w-sm font-mono text-lg">{p.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Pie({ tienda }: { tienda: Tienda }) {
  const { negocio } = tienda;
  const contacto = [
    negocio.direccion && { icono: IconoUbicacion, titulo: "Dirección", texto: negocio.direccion },
    negocio.horarios && { icono: IconoReloj, titulo: "Horarios", texto: negocio.horarios },
    negocio.whatsapp && {
      icono: IconoMensaje,
      titulo: "WhatsApp",
      texto: `+${negocio.whatsapp}`,
      href: `https://wa.me/${negocio.whatsapp}`,
    },
    negocio.instagram && {
      icono: IconoCamara,
      titulo: "Instagram",
      texto: `@${negocio.instagram}`,
      href: `https://instagram.com/${negocio.instagram}`,
    },
  ].filter(Boolean) as { icono: typeof IconoReloj; titulo: string; texto: string; href?: string }[];

  return (
    <footer id="contacto" className="relative border-t-4 border-negro bg-negro text-blanco">
      <div className="px-3 pt-12 md:px-6 md:pt-20">
        <p className="font-display text-[clamp(3rem,16.4vw,20rem)] leading-[0.8] tracking-[-0.055em] text-amarillo uppercase">
          {negocio.nombre}
        </p>
        <p className="mt-3 inline-block -rotate-1 border-4 border-blanco bg-rojo px-3 py-1 font-display text-[clamp(1.5rem,4vw,3.5rem)] leading-none text-negro uppercase">
          {negocio.eslogan}
        </p>
      </div>

      {contacto.length > 0 && (
        <ul className="mt-12 grid border-t-4 border-blanco sm:grid-cols-2 lg:grid-cols-4">
          {contacto.map(({ icono: Icono, titulo, texto, href }) => (
            <li key={titulo} className="flex gap-3 border-b-4 border-blanco p-4 sm:border-r-4 md:p-6">
              <Icono className="mt-1 shrink-0 text-2xl text-amarillo" />
              <div>
                <h3 className="font-display text-sm text-amarillo uppercase">{titulo}</h3>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="font-mono text-lg font-bold underline">
                    {texto}
                  </a>
                ) : (
                  <p className="font-mono text-lg font-bold">{texto}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t-4 border-blanco px-3 py-5 font-mono text-sm md:px-6">
        <span>
          © {negocio.nombre} · {negocio.eslogan}
        </span>
        <Link href="/admin" className="underline">
          Administrar precios
        </Link>
      </div>
    </footer>
  );
}
