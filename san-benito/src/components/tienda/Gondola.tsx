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
  const { productos, categorias, textos } = tienda;
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

  const pestañas = [{ id: "todas", nombre: "Todos" }, ...conProductos];

  return (
    <section id="productos" className="relative bg-marfil">
      <div className="mx-auto max-w-[1440px] px-4 pt-20 md:px-8 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <h2 className="titulo-seccion font-titulo text-[clamp(2.5rem,5.6vw,4.5rem)] leading-[1.02] tracking-[-0.03em] text-tinta">
              {textos.productosTitulo}
            </h2>
            {textos.productosTexto && (
              <p className="mt-3 max-w-[36rem] text-lg leading-relaxed text-tinta-2">{textos.productosTexto}</p>
            )}
          </div>
          <p className="text-sm text-tinta-3 tabular-nums" aria-live="polite">
            {filtrados.length === productos.length
              ? `${productos.length} productos`
              : `${filtrados.length} de ${productos.length} productos`}
          </p>
        </div>
      </div>

      <div className="sticky top-[var(--alto-encabezado)] z-30 mt-8 border-y border-tinta/8 bg-marfil/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:gap-6 md:px-8">
          <div className="-mx-1 flex flex-1 overflow-x-auto" role="tablist" aria-label="Pasillos">
            {pestañas.map((c) => {
              const activo = filtro === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => setFiltro(c.id)}
                  className={`relative shrink-0 cursor-pointer px-3 py-3 text-sm transition-colors duration-150 ease-sb ${
                    activo ? "text-tinta" : "text-tinta-3 hover:text-tinta"
                  }`}
                >
                  {c.nombre}
                  {activo && (
                    <motion.span
                      layoutId="pestaña-activa"
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-oro"
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <label className="flex h-10 items-center gap-2 rounded-[10px] border border-tinta/10 bg-papel px-3 md:w-72">
            <IconoBuscar className="shrink-0 text-base text-tinta-3" />
            <span className="sr-only">Buscar producto</span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-tinta-3"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Borrar búsqueda"
                className="cursor-pointer p-1 text-tinta-3 hover:text-tinta"
              >
                <IconoCerrar />
              </button>
            )}
          </label>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-24 md:px-8 md:pb-32">
        <motion.ul layout className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtrados.map((p, i) => (
              <motion.li
                layout
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: (i % 4) * 0.05 }}
              >
                <TarjetaProducto producto={p} categoria={porCategoria.get(p.categoria)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {filtrados.length === 0 && (
          <p className="rounded-2xl border border-tinta/8 bg-papel p-8 text-tinta-2">
            No hay productos que coincidan con la búsqueda.
          </p>
        )}
      </div>
    </section>
  );
}
