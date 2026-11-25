"use client";

import { motion } from "framer-motion";
import { useCarrito } from "./carrito";
import { IconoTicket } from "./Iconos";

export interface Enlace {
  href: string;
  texto: string;
}

export default function Encabezado({ enlaces }: { enlaces: Enlace[] }) {
  const { unidades, abrir, negocio } = useCarrito();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b-4 border-negro bg-negro text-blanco">
      <div className="flex h-16 items-stretch">
        <a
          href="#inicio"
          className="flex items-center border-r-4 border-negro bg-rojo px-3 font-display text-xl tracking-tight text-negro uppercase sm:px-4 sm:text-2xl"
        >
          {negocio.nombre}
        </a>
        <nav aria-label="Secciones" className="hidden flex-1 items-stretch md:flex">
          {enlaces.map((e) => (
            <a
              key={e.href}
              href={e.href}
              className="flex items-center border-r-4 border-negro px-4 font-display text-sm uppercase hover:bg-amarillo hover:text-negro lg:px-6"
            >
              {e.texto}
            </a>
          ))}
        </nav>
        <motion.button
          type="button"
          onClick={abrir}
          whileTap={{ scale: 0.95 }}
          className="ml-auto flex cursor-pointer items-center gap-2 border-l-4 border-negro bg-amarillo px-4 font-display text-negro uppercase hover:bg-blanco sm:px-6"
          aria-label={`Abrir ticket, ${unidades} ${unidades === 1 ? "producto" : "productos"}`}
        >
          <IconoTicket className="text-2xl" />
          <span className="hidden sm:inline">Ticket</span>
          <motion.span
            key={unidades}
            initial={{ scale: 1.6, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            className="min-w-8 border-2 border-negro bg-rojo px-1.5 py-0.5 text-center text-sm text-blanco tabular-nums"
          >
            {unidades}
          </motion.span>
        </motion.button>
      </div>
      <nav
        aria-label="Secciones"
        className="flex h-10 items-stretch overflow-x-auto border-t-4 border-negro bg-blanco text-negro md:hidden"
      >
        {enlaces.map((e) => (
          <a
            key={e.href}
            href={e.href}
            className="flex shrink-0 items-center border-r-4 border-negro px-3 font-display text-xs uppercase"
          >
            {e.texto}
          </a>
        ))}
      </nav>
    </header>
  );
}
