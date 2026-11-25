"use client";

import Link from "next/link";
import type { Tienda } from "@/lib/tipos";
import { descuento, numeroPasillo } from "@/lib/formato";
import TarjetaProducto from "./TarjetaProducto";
import { IconoCamara, IconoMensaje, IconoReloj, IconoUbicacion } from "./Iconos";

export function Ofertas({ tienda }: { tienda: Tienda }) {
  const { textos } = tienda;
  const porCategoria = new Map(tienda.categorias.map((c) => [c.id, c]));
  const ofertas = tienda.productos
    .filter((p) => p.disponible && descuento(p) > 0)
    .sort((a, b) => descuento(b) - descuento(a));
  if (ofertas.length === 0) return null;

  return (
    <section id="ofertas" className="relative border-t border-tinta/8 bg-papel">
      <div className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <h2 className="titulo-seccion font-titulo text-[clamp(2.5rem,5.6vw,4.5rem)] leading-[1.02] tracking-[-0.03em] text-tinta">
              {textos.ofertasTitulo}
            </h2>
            {textos.ofertasTexto && (
              <p className="mt-3 max-w-[36rem] text-lg leading-relaxed text-tinta-2">{textos.ofertasTexto}</p>
            )}
          </div>
          <p className="flex items-center gap-2 text-sm text-tinta-3 tabular-nums">
            <span className="size-2 rounded-full bg-carmesi" aria-hidden />
            {ofertas.length} {ofertas.length === 1 ? "producto rebajado" : "productos rebajados"}
          </p>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {ofertas.map((p) => (
            <li key={p.id}>
              <TarjetaProducto producto={p} categoria={porCategoria.get(p.categoria)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ComoComprar({ tienda }: { tienda: Tienda }) {
  const { textos } = tienda;
  if (textos.pasos.length === 0) return null;

  return (
    <section id="como-comprar" className="grano relative bg-lapis-hondo text-marfil">
      <div className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-32">
        <h2 className="titulo-seccion font-titulo text-[clamp(2.5rem,5.6vw,4.5rem)] leading-[1.02] tracking-[-0.03em]">
          {textos.comoComprarTitulo}
        </h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-marfil/10 bg-marfil/10 md:grid-flow-col md:auto-cols-fr">
          {textos.pasos.map((p, i) => (
            <li key={i} className="flex flex-col gap-3 bg-lapis-hondo p-6 md:p-8">
              <span className="font-titulo text-5xl leading-none text-oro tabular-nums">{numeroPasillo(i)}</span>
              <h3 className="mt-4 text-xl font-medium">{p.titulo}</h3>
              {p.texto && <p className="max-w-sm leading-relaxed text-marfil/70">{p.texto}</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Pie({ tienda, vistaPrevia = false }: { tienda: Tienda; vistaPrevia?: boolean }) {
  const { negocio, textos } = tienda;
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
    <footer id="contacto" className="grano relative bg-lapis-noche text-marfil">
      <div className="mx-auto max-w-[1440px] px-4 pt-24 md:px-8 md:pt-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-titulo text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.03em]">{negocio.nombre}</p>
            <p className="mt-3 font-titulo text-[clamp(1.5rem,2.6vw,2.25rem)] text-oro">{negocio.eslogan}</p>
            {textos.pieTexto && <p className="mt-6 max-w-md leading-relaxed text-marfil/70">{textos.pieTexto}</p>}
          </div>
          {contacto.length > 0 && (
            <ul className="grid gap-6 sm:grid-cols-2 md:col-span-6 md:self-end">
              {contacto.map(({ icono: Icono, titulo, texto, href }) => (
                <li key={titulo} className="flex gap-3">
                  <Icono className="mt-0.5 shrink-0 text-lg text-oro" />
                  <div>
                    <h3 className="text-sm text-marfil/50">{titulo}</h3>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base underline decoration-marfil/30 underline-offset-4 hover:decoration-oro"
                      >
                        {texto}
                      </a>
                    ) : (
                      <p className="text-base">{texto}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mx-auto mt-20 flex max-w-[1440px] flex-wrap items-center justify-between gap-3 border-t border-marfil/10 px-4 py-6 text-sm text-marfil/50 md:px-8">
        <span>
          © {negocio.nombre} · {negocio.eslogan}
        </span>
        {vistaPrevia ? (
          <span>Vista previa · los precios son de ejemplo</span>
        ) : (
          <Link href="/admin" className="hover:text-marfil">
            Administrar el sitio
          </Link>
        )}
      </div>
    </footer>
  );
}
