"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  blur,
  scale,
  spring,
  transition as motionTransition,
  useShouldReduceMotion,
  useTempoTransition,
} from "@animate-ui/react/utils/motion";
import { cambiarSonido, sonar, useSonidoActivado } from "@/lib/sonidos";
import { useCarrito } from "./carrito";
import { useGolpeTicket } from "./Efectos";
import { VentanaMisDatos } from "./MisDatos";
import { useMiCliente } from "@/lib/mis-datos";
import { IconoCandado, IconoCerrar, IconoMenu, IconoPersona, IconoSilencio, IconoSonido, IconoTicket } from "./Iconos";

export interface Enlace {
  href: string;
  texto: string;
}

/**
 * Encabezado con el menú de las tres rayitas: secciones, sonido y AGL (el panel para
 * cambiar precios y fotos, protegido con contraseña).
 */
export default function Encabezado({
  enlaces,
  hrefAgl,
  onAgl,
}: {
  enlaces: Enlace[];
  hrefAgl?: string;
  onAgl?: () => void;
}) {
  const { unidades, abrir, negocio } = useCarrito();
  const [menu, setMenu] = useState(false);
  const [misDatos, setMisDatos] = useState(false);
  const golpe = useGolpeTicket();
  const cliente = useMiCliente();
  const sonido = useSonidoActivado();
  const reducir = useShouldReduceMotion();
  const enMenu = useTempoTransition(motionTransition.menu);
  const presion = useTempoTransition(spring.press);
  const pop = useTempoTransition(spring.pop);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    const fuera = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener("keydown", cerrar);
    window.addEventListener("pointerdown", fuera);
    return () => {
      window.removeEventListener("keydown", cerrar);
      window.removeEventListener("pointerdown", fuera);
    };
  }, [menu]);

  const alternarMenu = () => {
    sonar("menu");
    setMenu((v) => !v);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-oro/25 bg-lapis-noche/92 pt-[env(safe-area-inset-top,0px)] text-marfil backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 md:px-8">
        <a href="#inicio" className="font-titulo text-[26px] leading-none tracking-[0.01em] whitespace-nowrap">
          {negocio.nombre}
        </a>
        <nav aria-label="Secciones" className="hidden items-center gap-1 lg:flex">
          {enlaces.map((e) => (
            <a
              key={e.href}
              href={e.href}
              className="rounded-lg px-3 py-2 text-[15px] text-marfil/70 transition-colors duration-150 ease-sb hover:bg-marfil/5 hover:text-marfil"
            >
              {e.texto}
            </a>
          ))}
        </nav>
        <div ref={panel} className="relative ml-auto flex items-center gap-2">
          <motion.button
            key={`ticket-${golpe}`}
            type="button"
            onClick={abrir}
            data-destino-ticket
            initial={golpe > 0 && !reducir ? { scale: 1.12 } : false}
            animate={{ scale: 1, transition: pop }}
            whileTap={{ scale: scale.press, transition: presion }}
            className="boton-oro flex h-10 cursor-pointer items-center gap-2 rounded-[10px] px-4 text-sm font-medium text-tinta"
            aria-label={`Abrir ticket, ${unidades} ${unidades === 1 ? "producto" : "productos"}`}
          >
            <IconoTicket className="text-lg" />
            <span>Ticket</span>
            <motion.span
              key={unidades}
              initial={reducir ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)", transition: pop }}
              className="min-w-5 text-center tabular-nums"
            >
              {unidades}
            </motion.span>
          </motion.button>
          <motion.button
            type="button"
            onClick={alternarMenu}
            whileTap={{ scale: scale.press, transition: presion }}
            aria-expanded={menu}
            aria-haspopup="menu"
            aria-label={menu ? "Cerrar menú" : "Abrir menú"}
            className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] border border-marfil/15 text-xl text-marfil/85 transition-colors hover:bg-marfil/5"
          >
            {menu ? <IconoCerrar /> : <IconoMenu />}
          </motion.button>

          <AnimatePresence>
            {menu && (
              <motion.div
                role="menu"
                // Crece desde el botón que lo abre (arriba a la derecha)
                style={{ transformOrigin: "top right" }}
                initial={{ opacity: 0, scale: reducir ? 1 : scale.menu, filter: reducir ? "none" : blur.surface }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transition: enMenu }}
                exit={{ opacity: 0, scale: reducir ? 1 : scale.menu, filter: reducir ? "none" : blur.surface, transition: enMenu }}
                className="grano grano-suave absolute top-[calc(100%+10px)] right-0 w-[min(88vw,300px)] overflow-hidden rounded-2xl border border-oro/25 bg-lapis-hondo p-2 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6)]"
              >
                <div className="lg:hidden">
                  {enlaces.map((e) => (
                    <a
                      key={e.href}
                      role="menuitem"
                      href={e.href}
                      onClick={() => setMenu(false)}
                      className="flex h-11 items-center rounded-lg px-3 text-[15px] text-marfil/85 hover:bg-marfil/5"
                    >
                      {e.texto}
                    </a>
                  ))}
                  <div className="my-2 h-px bg-marfil/10" />
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    setMisDatos(true);
                  }}
                  className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-[15px] text-marfil/85 hover:bg-marfil/5"
                >
                  <IconoPersona className="text-lg text-oro" />
                  {cliente ? `Mis datos · ${cliente.nombre}` : "Mis datos"}
                </button>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={sonido}
                  onClick={() => cambiarSonido(!sonido)}
                  className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-[15px] text-marfil/85 hover:bg-marfil/5"
                >
                  {sonido ? <IconoSonido className="text-lg text-oro" /> : <IconoSilencio className="text-lg text-marfil/50" />}
                  {sonido ? "Sonidos activados" : "Sonidos desactivados"}
                </button>
                <div className="my-2 h-px bg-marfil/10" />
                {hrefAgl ? (
                  <a
                    role="menuitem"
                    href={hrefAgl}
                    className="flex h-12 items-center gap-3 rounded-lg px-3 font-titulo text-2xl tracking-[0.18em] text-oro hover:bg-marfil/5"
                  >
                    <IconoCandado className="text-lg" />
                    AGL
                  </a>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      onAgl?.();
                    }}
                    className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left font-titulo text-2xl tracking-[0.18em] text-oro hover:bg-marfil/5"
                  >
                    <IconoCandado className="text-lg" />
                    AGL
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <VentanaMisDatos abierta={misDatos} cerrar={() => setMisDatos(false)} />
    </header>
  );
}
