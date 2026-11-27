"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { spring, useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion";
import type { Tienda } from "@/lib/tipos";
import { sonar } from "@/lib/sonidos";
import TarjetaProducto, { FilaProducto } from "./TarjetaProducto";
import { IconoBuscar, IconoCerrar } from "./Iconos";

const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** De a cuántos productos se muestran: el resto aparece con "Ver más". */
const POR_TANDA = 16;

type Vista = "tarjetas" | "lista";

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
  const [vista, setVista] = useState<Vista>("tarjetas");
  const reducir = useShouldReduceMotion();
  const resorte = useTempoTransition(spring.pop);
  const porCategoria = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const cuenta = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of productos) m.set(p.categoria, (m.get(p.categoria) ?? 0) + 1);
    return m;
  }, [productos]);
  const conProductos = categorias.filter((c) => cuenta.has(c.id));

  const filtrados = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    const palabras = q.split(/\s+/).filter(Boolean);
    return productos
      .filter((p) => filtro === "todas" || p.categoria === filtro)
      .filter((p) => {
        if (!palabras.length) return true;
        const texto = sinAcentos(`${p.nombre} ${p.presentacion} ${p.descripcion} ${porCategoria.get(p.categoria)?.nombre ?? ""}`);
        return palabras.every((w) => texto.includes(w));
      })
      .sort((a, b) => Number(b.disponible) - Number(a.disponible));
  }, [productos, filtro, busqueda, porCategoria]);

  // Cuántos se ven: vuelve a la primera tanda cuando cambia el pasillo o la búsqueda
  const clave = `${filtro}|${busqueda}`;
  const [tanda, setTanda] = useState({ clave, tope: POR_TANDA });
  const tope = tanda.clave === clave ? tanda.tope : POR_TANDA;
  const visibles = filtrados.slice(0, tope);
  const restantes = filtrados.length - visibles.length;

  const pestañas = [{ id: "todas", nombre: "Todos" }, ...conProductos];

  return (
    <section id="productos" className="papel relative bg-marfil">
      <div className="mx-auto max-w-[1440px] px-4 pt-20 md:px-8 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <h2 className="titulo-seccion font-titulo text-[clamp(2.75rem,6vw,5rem)] leading-[1] tracking-[-0.02em] text-tinta">
              {textos.productosTitulo}
            </h2>
            {textos.productosTexto && (
              <p className="mt-3 max-w-[36rem] text-lg leading-relaxed text-tinta-2">{textos.productosTexto}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-tinta-3 tabular-nums" aria-live="polite">
              {filtrados.length === productos.length
                ? `${productos.length} productos`
                : `${filtrados.length} de ${productos.length} productos`}
            </p>
            <div className="flex rounded-[10px] border border-tinta/10 bg-papel p-0.5" role="group" aria-label="Cómo ver los productos">
              {(["tarjetas", "lista"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vista === v}
                  onClick={() => {
                    if (v !== vista) sonar("vista");
                    setVista(v);
                  }}
                  className={`relative h-8 cursor-pointer rounded-[8px] px-3 text-sm transition-colors duration-150 ease-sb ${
                    vista === v ? "text-marfil" : "text-tinta-2 hover:text-tinta"
                  }`}
                >
                  {vista === v && (
                    <motion.span
                      layoutId="vista-activa"
                      className="absolute inset-0 rounded-[8px] bg-lapis-hondo"
                      transition={reducir ? { duration: 0 } : resorte}
                    />
                  )}
                  <span className="relative">{v === "tarjetas" ? "Tarjetas" : "Lista"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[var(--alto-encabezado)] z-30 mt-8 border-y border-tinta/8 bg-marfil/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:gap-6 md:px-8">
          <div className="-mx-1 flex flex-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Pasillos">
            {pestañas.map((c) => {
              const activo = filtro === c.id;
              const n = c.id === "todas" ? productos.length : (cuenta.get(c.id) ?? 0);
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => {
                    if (!activo) sonar("pestana");
                    setFiltro(c.id);
                  }}
                  className={`relative shrink-0 cursor-pointer px-3 py-3 text-sm transition-colors duration-150 ease-sb ${
                    activo ? "text-tinta" : "text-tinta-3 hover:text-tinta"
                  }`}
                >
                  {c.nombre}
                  <span className="ml-1.5 text-xs text-tinta-3 tabular-nums">{n}</span>
                  {activo && (
                    <motion.span
                      layoutId="pestaña-activa"
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-oro"
                      transition={reducir ? { duration: 0 } : resorte}
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
              placeholder="Buscar, por ejemplo yerba o jabón"
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
        {vista === "tarjetas" ? (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibles.map((p, i) => (
                <motion.li
                  layout="position"
                  key={p.id}
                  // Cada tarjeta sube al entrar en pantalla, en cascada por columna
                  initial={reducir ? false : { opacity: 0, y: 28, rotateX: 7, transformPerspective: 900 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "0px 0px -6% 0px" }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: (i % 4) * 0.06 }}
                >
                  <TarjetaProducto producto={p} categoria={porCategoria.get(p.categoria)} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <ul className="grid gap-2 lg:grid-cols-2 lg:gap-3">
            {visibles.map((p, i) => (
              <motion.li
                key={p.id}
                initial={reducir ? false : { opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: (i % 8) * 0.025 }}
              >
                <FilaProducto producto={p} />
              </motion.li>
            ))}
          </ul>
        )}

        {restantes > 0 && (
          <div className="mt-10 flex flex-col items-center gap-2">
            <motion.button
              type="button"
              onClick={() => {
                sonar("mas");
                setTanda({ clave, tope: tope + POR_TANDA });
              }}
              whileTap={{ scale: 0.97 }}
              className="boton-oro h-12 cursor-pointer rounded-[10px] px-6 font-medium text-tinta"
            >
              Ver más productos
            </motion.button>
            <p className="text-sm text-tinta-3 tabular-nums">
              {visibles.length} de {filtrados.length}
            </p>
          </div>
        )}

        {filtrados.length === 0 && (
          <p className="rounded-2xl border border-tinta/8 bg-papel p-8 text-tinta-2">
            No hay productos que coincidan con la búsqueda.
          </p>
        )}
      </div>
    </section>
  );
}
