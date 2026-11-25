"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCarrito } from "./carrito";
import { IconoCerrar, IconoMenu, IconoTicket } from "./Iconos";

export interface Enlace {
  href: string;
  texto: string;
}

export default function Encabezado({ enlaces }: { enlaces: Enlace[] }) {
  const { unidades, abrir, negocio } = useCarrito();
  const [menu, setMenu] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-marfil/10 bg-lapis-noche/95 pt-[env(safe-area-inset-top,0px)] text-marfil backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 md:px-8">
        <a href="#inicio" className="font-titulo text-xl tracking-[-0.01em] whitespace-nowrap md:text-[22px]">
          {negocio.nombre}
        </a>
        <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
          {enlaces.map((e) => (
            <a
              key={e.href}
              href={e.href}
              className="rounded-lg px-3 py-2 text-sm text-marfil/70 transition-colors duration-150 ease-sb hover:bg-marfil/5 hover:text-marfil"
            >
              {e.texto}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <motion.button
            type="button"
            onClick={abrir}
            whileTap={{ scale: 0.97 }}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-[10px] bg-oro px-4 text-sm font-medium text-tinta transition-colors duration-150 ease-sb hover:bg-[color-mix(in_oklab,var(--sb-acento)_85%,white)]"
            aria-label={`Abrir ticket, ${unidades} ${unidades === 1 ? "producto" : "productos"}`}
          >
            <IconoTicket className="text-lg" />
            <span>Ticket</span>
            <motion.span
              key={unidades}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-5 text-center tabular-nums"
            >
              {unidades}
            </motion.span>
          </motion.button>
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-label={menu ? "Cerrar menú" : "Abrir menú"}
            className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] text-xl text-marfil/80 hover:bg-marfil/5 md:hidden"
          >
            {menu ? <IconoCerrar /> : <IconoMenu />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menu && (
          <motion.nav
            aria-label="Secciones"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-marfil/10 bg-lapis-noche px-4 py-2 md:hidden"
          >
            {enlaces.map((e) => (
              <a
                key={e.href}
                href={e.href}
                onClick={() => setMenu(false)}
                className="flex h-11 items-center border-b border-marfil/10 text-base text-marfil/85 last:border-b-0"
              >
                {e.texto}
              </a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
