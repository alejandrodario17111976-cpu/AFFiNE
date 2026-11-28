"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { scale, spring, transition as motionTransition, useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion";
import type { Afiche, Tienda } from "@/lib/tipos";
import { enlaceMapa, estaEnOferta, numeroPasillo, urlMedio } from "@/lib/formato";
import { useSinDesplazamiento } from "@/lib/desplazamiento";
import TarjetaProducto from "./TarjetaProducto";
import { IconoCamara, IconoCerrar, IconoMensaje, IconoRed, IconoReloj, IconoTelefono, IconoUbicacion } from "./Iconos";

export function Ofertas({ tienda }: { tienda: Tienda }) {
  const { textos } = tienda;
  const porCategoria = new Map(tienda.categorias.map((c) => [c.id, c]));
  const ofertas = tienda.productos.filter((p) => p.disponible && estaEnOferta(p));
  if (ofertas.length === 0) return null;

  return (
    <section id="ofertas" className="papel relative border-t border-tinta/8 bg-papel">
      <div className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <h2 className="titulo-seccion font-titulo text-[clamp(2.75rem,6vw,5rem)] leading-[1] tracking-[-0.02em] text-tinta">
              {textos.ofertasTitulo}
            </h2>
            {textos.ofertasTexto && (
              <p className="mt-3 max-w-[36rem] text-lg leading-relaxed text-tinta-2">{textos.ofertasTexto}</p>
            )}
          </div>
          <p className="flex items-center gap-2 text-sm text-tinta-3 tabular-nums">
            <span className="terciopelo size-2 rounded-full" aria-hidden />
            {ofertas.length} {ofertas.length === 1 ? "producto en oferta" : "productos en oferta"}
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

/** Afiche ampliado, para leerlo bien en el celular. */
function AficheAmpliado({ afiche, cerrar }: { afiche: Afiche; cerrar: () => void }) {
  useSinDesplazamiento();
  const reducir = useShouldReduceMotion();
  const entrar = useTempoTransition(spring.dialog);
  const salir = useTempoTransition(motionTransition.dismiss);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [cerrar]);
  return (
    <motion.div
      data-lenis-prevent
      className="fixed inset-0 z-[80] flex items-center justify-center bg-lapis-noche/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: motionTransition.overlay }}
      exit={{ opacity: 0, transition: salir }}
      onClick={cerrar}
      role="dialog"
      aria-modal="true"
      aria-label={afiche.titulo || "Afiche"}
    >
      <motion.img
        src={urlMedio("afiches", afiche.imagen)}
        alt={afiche.titulo}
        className="max-h-[88svh] max-w-full rounded-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        initial={{ opacity: 0, scale: reducir ? 1 : scale.dialog }}
        animate={{ opacity: 1, scale: 1, transition: entrar }}
        exit={{ opacity: 0, scale: reducir ? 1 : 0.96, transition: salir }}
      />
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar afiche"
        className="absolute top-[max(16px,env(safe-area-inset-top,0px))] right-4 flex size-11 cursor-pointer items-center justify-center rounded-full bg-marfil/10 text-xl text-marfil hover:bg-marfil/20"
      >
        <IconoCerrar />
      </button>
    </motion.div>
  );
}

export function Afiches({ tienda }: { tienda: Tienda }) {
  const { textos, afiches } = tienda;
  const [abierto, setAbierto] = useState<Afiche | null>(null);
  const presion = useTempoTransition(spring.press);
  if (afiches.length === 0) return null;

  return (
    <section id="afiches" className="grano relative bg-lapis-hondo text-marfil">
      <div className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-32">
        <h2 className="titulo-seccion font-titulo text-[clamp(2.75rem,6vw,5rem)] leading-[1] tracking-[-0.02em]">
          {textos.afichesTitulo}
        </h2>
        {textos.afichesTexto && <p className="mt-3 max-w-[36rem] text-lg leading-relaxed text-marfil/75">{textos.afichesTexto}</p>}
        <ul className="-mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4">
          {afiches.map((a) => (
            <li key={a.imagen} className="w-[68vw] shrink-0 snap-center md:w-auto">
              <motion.button
                type="button"
                onClick={() => setAbierto(a)}
                whileTap={{ scale: scale.choice, transition: presion }}
                className="group block w-full cursor-zoom-in rounded-xl bg-[var(--oro-metal)] p-[3px] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.7)]"
                aria-label={`Ver afiche: ${a.titulo}`}
              >
                <span className="block overflow-hidden rounded-[9px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- afiches subidos desde el panel, servidos tal cual */}
                  <img
                    src={urlMedio("afiches", a.imagen)}
                    alt={a.titulo}
                    loading="lazy"
                    className="aspect-[2/3] w-full object-cover transition-transform duration-500 ease-sb [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.03]"
                  />
                </span>
              </motion.button>
              {a.titulo && <p className="mt-3 text-sm text-marfil/70">{a.titulo}</p>}
            </li>
          ))}
        </ul>
      </div>
      <AnimatePresence>{abierto && <AficheAmpliado afiche={abierto} cerrar={() => setAbierto(null)} />}</AnimatePresence>
    </section>
  );
}

export function ComoComprar({ tienda }: { tienda: Tienda }) {
  const { textos } = tienda;
  if (textos.pasos.length === 0) return null;

  return (
    <section id="como-comprar" className="papel relative bg-marfil text-tinta">
      <div className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-32">
        <h2 className="titulo-seccion font-titulo text-[clamp(2.75rem,6vw,5rem)] leading-[1] tracking-[-0.02em]">
          {textos.comoComprarTitulo}
        </h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-tinta/10 bg-tinta/10 md:grid-flow-col md:auto-cols-fr">
          {textos.pasos.map((p, i) => (
            <li key={i} className="flex flex-col gap-3 bg-papel p-6 md:p-8">
              <span className="font-titulo texto-oro text-6xl leading-none font-semibold tabular-nums">{numeroPasillo(i)}</span>
              <h3 className="mt-4 text-xl font-medium">{p.titulo}</h3>
              {p.texto && <p className="max-w-sm leading-relaxed text-tinta-2">{p.texto}</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Columna({
  icono: Icono,
  titulo,
  children,
}: {
  icono: (p: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icono className="mt-1 shrink-0 text-xl text-oro" />
      <div className="min-w-0">
        <h3 className="font-titulo text-2xl text-oro">{titulo}</h3>
        <div className="mt-2 flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}

const claseEnlace = "underline decoration-marfil/30 underline-offset-4 transition-colors hover:decoration-oro";

export function Pie({ tienda, vistaPrevia = false }: { tienda: Tienda; vistaPrevia?: boolean }) {
  const { negocio, textos } = tienda;
  const redes = [
    negocio.instagram && { nombre: "Instagram", texto: `@${negocio.instagram}`, href: `https://instagram.com/${negocio.instagram}` },
    negocio.facebook && { nombre: "Facebook", texto: negocio.facebook.replace(/^https:\/\/(www\.|m\.)?/, ""), href: negocio.facebook },
    negocio.tiktok && { nombre: "TikTok", texto: `@${negocio.tiktok}`, href: `https://www.tiktok.com/@${negocio.tiktok}` },
  ].filter(Boolean) as { nombre: string; texto: string; href: string }[];
  const hayContacto = Boolean(negocio.telefono || negocio.whatsapp);

  return (
    <footer id="contacto" className="grano relative bg-lapis-noche text-marfil">
      <div className="mx-auto max-w-[1440px] px-4 pt-24 md:px-8 md:pt-32">
        <p className="font-titulo text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.95] tracking-[-0.02em]">{negocio.nombre}</p>
        <p className="mt-3 font-titulo texto-oro text-[clamp(1.75rem,3vw,2.75rem)] font-semibold">{negocio.eslogan}</p>
        {textos.pieTexto && <p className="mt-6 max-w-md leading-relaxed text-marfil/70">{textos.pieTexto}</p>}

        <div className="mt-16 grid gap-10 border-t border-oro/20 pt-12 md:grid-cols-3">
          {negocio.sucursales.length > 0 && (
            <Columna icono={IconoUbicacion} titulo="Ubicación">
              {negocio.sucursales.map((s) => (
                <div key={`${s.nombre}${s.direccion}`}>
                  <a
                    href={enlaceMapa(s.direccion, s.nombre, negocio.provincia)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-lg ${claseEnlace}`}
                  >
                    {s.direccion}
                  </a>
                  {s.nombre && <p className="text-sm text-marfil/60">{s.nombre}</p>}
                </div>
              ))}
              {negocio.horarios && (
                <p className="mt-2 flex items-start gap-2 text-sm text-marfil/70">
                  <IconoReloj className="mt-0.5 shrink-0" />
                  {negocio.horarios}
                </p>
              )}
            </Columna>
          )}
          {hayContacto && (
            <Columna icono={IconoTelefono} titulo="Contacto">
              {negocio.telefono && (
                <a href={`tel:${negocio.telefono.replace(/[^\d+]/g, "")}`} className={`text-lg tabular-nums ${claseEnlace}`}>
                  {negocio.telefono}
                </a>
              )}
              {negocio.whatsapp && (
                <a
                  href={`https://wa.me/${negocio.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-lg tabular-nums ${claseEnlace}`}
                >
                  <IconoMensaje className="text-base" /> WhatsApp +{negocio.whatsapp}
                </a>
              )}
            </Columna>
          )}
          {redes.length > 0 && (
            <Columna icono={IconoRed} titulo="Redes sociales">
              {redes.map((r) => (
                <a key={r.nombre} href={r.href} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-lg ${claseEnlace}`}>
                  {r.nombre === "Instagram" && <IconoCamara className="text-base" />}
                  <span>
                    {r.nombre}: {r.texto}
                  </span>
                </a>
              ))}
            </Columna>
          )}
        </div>
      </div>
      <div className="mx-auto mt-20 flex max-w-[1440px] flex-wrap items-center justify-between gap-3 border-t border-marfil/10 px-4 py-6 text-sm text-marfil/50 md:px-8">
        <span>
          © {negocio.nombre} · {negocio.eslogan}
        </span>
        {vistaPrevia ? (
          <span>Vista previa</span>
        ) : (
          <Link href="/admin" className="tracking-[0.18em] hover:text-marfil">
            AGL
          </Link>
        )}
      </div>
    </footer>
  );
}
