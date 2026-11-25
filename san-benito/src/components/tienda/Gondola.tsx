"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Tienda } from "@/lib/tipos";
import TarjetaProducto from "./TarjetaProducto";
import { IconoBuscar, IconoCerrar } from "./Iconos";

const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default function Gondola({
  tienda,
  filtro,
  setFiltro,
}: {
  tienda: Tienda;
  filtro: string;
  setFiltro: (id: string) => void;
}) {
  const { productos, categorias } = tienda;
  const [busqueda, setBusqueda] = useState("");
  const porCategoria = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const conProductos = categorias.filter((c) => productos.some((p) => p.categoria === c.id));

  const filtrados = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    return productos
      .filter((p) => filtro === "todas" || p.categoria === filtro)
      .filter((p) => !q || sinAcentos(`${p.nombre} ${p.presentacion}`).includes(q))
      .sort((a, b) => Number(b.disponible) - Number(a.disponible));
  }, [productos, filtro, busqueda]);

  const chips = [{ id: "todas", nombre: "Todos" }, ...conProductos];

  return (
    <section id="productos" className="relative border-t-4 border-negro bg-blanco">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-3 pt-10 pb-6 md:px-6 md:pt-16">
        <h2 className="titulo-seccion font-display text-[clamp(3.25rem,13vw,12rem)] leading-[0.8] tracking-[-0.05em] uppercase">
          Productos
        </h2>
        <p className="font-mono text-base font-bold" aria-live="polite">
          {filtrados.length === productos.length
            ? `${productos.length} productos`
            : `${filtrados.length} de ${productos.length} productos`}
        </p>
      </div>

      <div className="sticky top-[var(--alto-encabezado)] z-30 flex flex-col border-y-4 border-negro bg-amarillo md:flex-row">
        <div className="flex flex-1 overflow-x-auto" role="tablist" aria-label="Pasillos">
          {chips.map((c) => {
            const activo = filtro === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setFiltro(c.id)}
                className={`relative shrink-0 cursor-pointer border-r-4 border-negro px-4 py-3 font-display text-sm uppercase md:text-base ${
                  activo ? "text-amarillo" : "text-negro hover:bg-blanco"
                }`}
              >
                {activo && (
                  <motion.span
                    layoutId="chip-activo"
                    className="absolute inset-0 bg-negro"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative">{c.nombre}</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 border-t-4 border-negro bg-blanco px-3 md:w-80 md:border-t-0 md:border-l-4">
          <IconoBuscar className="shrink-0 text-xl" />
          <span className="sr-only">Buscar producto</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto"
            className="h-12 w-full bg-transparent font-mono text-base font-bold outline-none placeholder:text-negro/60"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              aria-label="Borrar búsqueda"
              className="cursor-pointer p-1 text-lg"
            >
              <IconoCerrar />
            </button>
          )}
        </label>
      </div>

      <motion.ul layout className="grid grid-cols-2 gap-x-3 gap-y-6 p-3 md:grid-cols-3 md:gap-6 md:p-6 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtrados.map((p, i) => (
            <motion.li
              layout
              key={p.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -60px 0px" }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 30, delay: (i % 4) * 0.05 }}
            >
              <TarjetaProducto producto={p} categoria={porCategoria.get(p.categoria)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {filtrados.length === 0 && (
        <p className="mx-3 mb-10 border-4 border-negro bg-blanco p-6 font-mono text-lg font-bold md:mx-6">
          No hay productos que coincidan con la búsqueda.
        </p>
      )}
    </section>
  );
}
