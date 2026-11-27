"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PerspectiveCamera, View } from "@react-three/drei";
import { scale, spring, transition as motionTransition, useTempoTransition } from "@animate-ui/react/utils/motion";
import type { Categoria, Producto } from "@/lib/tipos";
import { descuento, urlMedio } from "@/lib/formato";
import { lanzarVuelo } from "./Efectos";
import { LucesTienda, Producto3D, SombraSuelo } from "@/components/escena/Producto3D";
import type { Interaccion } from "@/components/escena/compartido";
import { useCarrito } from "./carrito";
import { IconoMas, IconoMenos } from "./Iconos";

/**
 * Si el elemento está en pantalla o cerca. Con cientos de productos, solo los que se ven
 * dibujan su 3D; el resto muestra la foto y libera la memoria de la placa de video.
 */
function useCerca(ref: RefObject<HTMLElement | null>, margen = "300px 0px") {
  const [cerca, setCerca] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setCerca(e.isIntersecting), { rootMargin: margen });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margen]);
  return cerca;
}

/** Vista 3D de un producto que sigue a su contenedor en la página. */
export function Vista3D({ producto, className = "" }: { producto: Producto; className?: string }) {
  const zona = useRef<HTMLDivElement>(null);
  const interaccion = useRef<Interaccion>({ hover: false, x: 0, y: 0 });
  const cerca = useCerca(zona);
  const [listo, setListo] = useState<string | null>(null);
  const alListo = useCallback(() => setListo(producto.imagen), [producto.imagen]);
  // La foto queda debajo hasta que el 3D terminó de cargar, y vuelve si la tarjeta sale de pantalla
  const verFoto = !cerca || listo !== producto.imagen;
  return (
    <div
      ref={zona}
      className={`relative ${className}`}
      onPointerEnter={() => (interaccion.current.hover = true)}
      onPointerLeave={() => {
        interaccion.current.hover = false;
      }}
      onPointerMove={(e) => {
        const r = zona.current?.getBoundingClientRect();
        if (!r) return;
        interaccion.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        interaccion.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      }}
    >
      {producto.imagen && (
        // Mismo tamaño y lugar que ocupa el producto en 3D, para que el cambio no se note
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[4%] top-[26%] h-[65%] transition-opacity duration-500 ease-sb"
          style={{ opacity: verFoto ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- foto recortada servida desde /medios */}
          <img
            src={urlMedio("imagenes", producto.imagen)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain drop-shadow-[0_10px_12px_rgba(31,27,22,0.18)]"
          />
        </div>
      )}
      {cerca && (
        <View className="absolute inset-0">
          <PerspectiveCamera makeDefault position={[0, 0.3, 5.8]} fov={34} />
          <LucesTienda interaccion={interaccion} />
          <Producto3D producto={producto} interaccion={interaccion} alListo={alListo} />
          <SombraSuelo y={-1.3} />
        </View>
      )}
    </div>
  );
}

/** Fila compacta para la vista de lista: foto, nombre, precio y botones, sin 3D. */
export function FilaProducto({ producto }: { producto: Producto }) {
  const { agregar, quitar, cantidadDe, precio } = useCarrito();
  const cantidad = cantidadDe(producto.id);
  const presion = useTempoTransition(spring.press);
  const off = descuento(producto);
  const promo = producto.promos.find((p) => p.precio < p.cantidad * producto.precio);
  return (
    <article className="flex items-center gap-3 rounded-xl border border-tinta/8 bg-papel py-2 pr-2 pl-2 md:gap-4 md:pr-3">
      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_50%_30%,var(--color-papel),var(--color-crema))] md:size-20">
        {producto.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto recortada servida desde /medios
          <img
            src={urlMedio("imagenes", producto.imagen)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[86%] w-[86%] object-contain"
          />
        ) : (
          <span className="font-titulo text-2xl text-tinta-3" aria-hidden>
            {producto.nombre.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] leading-snug font-medium text-tinta">{producto.nombre}</h3>
        <p className="text-sm text-tinta-3">
          {producto.presentacion}
          {promo && (
            <span className="ml-2 text-carmesi tabular-nums">
              {promo.cantidad} por {precio(promo.precio)}
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="font-titulo text-[22px] leading-none font-semibold text-tinta tabular-nums">
          {off > 0 && producto.precioAnterior && (
            <span className="mr-1.5 font-texto text-xs font-normal text-tinta-3 line-through decoration-carmesi">
              {precio(producto.precioAnterior)}
            </span>
          )}
          {precio(producto.precio)}
        </span>
        {!producto.disponible ? (
          <span className="text-xs text-tinta-3">Sin stock</span>
        ) : cantidad === 0 ? (
          <motion.button
            type="button"
            onClick={(e) => {
              lanzarVuelo(e.currentTarget.getBoundingClientRect(), producto.imagen ? urlMedio("imagenes", producto.imagen) : undefined);
              agregar(producto.id);
            }}
            whileTap={{ scale: scale.press, transition: presion }}
            aria-label={`Agregar ${producto.nombre}`}
            className="flex h-9 cursor-pointer items-center gap-1 rounded-[9px] bg-lapis-hondo px-3 text-sm font-medium text-marfil transition-colors duration-150 ease-sb hover:bg-lapis-medio"
          >
            <IconoMas /> Agregar
          </motion.button>
        ) : (
          <div className="flex h-9 items-stretch overflow-hidden rounded-[9px] border border-oro/50 bg-papel">
            <button
              type="button"
              onClick={() => quitar(producto.id)}
              aria-label={`Quitar una unidad de ${producto.nombre}`}
              className="flex w-9 cursor-pointer items-center justify-center text-tinta-2 hover:bg-crema"
            >
              <IconoMenos />
            </button>
            <span className="flex min-w-7 items-center justify-center text-sm font-medium tabular-nums" aria-live="polite">
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => agregar(producto.id)}
              aria-label={`Agregar una unidad de ${producto.nombre}`}
              className="flex w-9 cursor-pointer items-center justify-center text-tinta-2 hover:bg-crema"
            >
              <IconoMas />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/** Etiqueta de precio con doble filete de oro. */
export function EtiquetaPrecio({ producto, grande = false }: { producto: Producto; grande?: boolean }) {
  const { precio } = useCarrito();
  const off = descuento(producto);
  return (
    <div className="etiqueta-precio destello inline-flex flex-col overflow-hidden rounded-md px-3 pt-1.5 pb-2">
      {producto.precioAnterior && off > 0 && (
        <span className="text-xs text-tinta-3 tabular-nums line-through decoration-carmesi">
          {precio(producto.precioAnterior)}
        </span>
      )}
      <span
        className={`font-titulo leading-none font-semibold tracking-[-0.01em] text-tinta tabular-nums ${grande ? "text-4xl" : "text-[30px]"}`}
      >
        {precio(producto.precio)}
      </span>
    </div>
  );
}

/** Precios por cantidad: "Llevando 2: $2.690 ($1.345 c/u)". */
export function Promos({ producto }: { producto: Producto }) {
  const { precio } = useCarrito();
  const validas = producto.promos.filter((p) => p.precio < p.cantidad * producto.precio);
  if (validas.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1">
      {validas.map((p) => (
        <li key={p.cantidad} className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="terciopelo rounded px-1.5 py-0.5 text-xs font-medium text-marfil tabular-nums">
            Llevando {p.cantidad}
          </span>
          <span className="font-medium tabular-nums">{precio(p.precio)}</span>
          <span className="text-xs text-tinta-3 tabular-nums">({precio(Math.round(p.precio / p.cantidad))} c/u)</span>
        </li>
      ))}
    </ul>
  );
}

export default function TarjetaProducto({ producto, categoria }: { producto: Producto; categoria?: Categoria }) {
  const { agregar, quitar, cantidadDe } = useCarrito();
  const cantidad = cantidadDe(producto.id);
  const off = descuento(producto);
  const presion = useTempoTransition(spring.press);
  const cambio = useTempoTransition(motionTransition.menu);

  return (
    <article className="tarjeta-producto group relative flex h-full flex-col rounded-2xl border border-tinta/8 bg-papel p-2 shadow-suave transition-[transform,box-shadow] duration-300 ease-sb [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-flotante">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[radial-gradient(120%_90%_at_50%_20%,var(--color-papel),var(--color-crema))]">
        <Vista3D producto={producto} className="h-full w-full" />
        <div className="absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
          {categoria ? <span className="text-xs text-tinta-3">{categoria.nombre}</span> : <span />}
          {off > 0 && (
            <span className="terciopelo rounded-md px-2 py-1 text-xs font-medium text-marfil tabular-nums">−{off}%</span>
          )}
        </div>
        {!producto.disponible ? (
          <span className="absolute inset-x-3 bottom-3 z-20 rounded-lg bg-tinta/80 py-2 text-center text-sm text-marfil">
            Sin stock
          </span>
        ) : (
          producto.imagen &&
          producto.fotoIlustrativa && (
            <span className="absolute bottom-2 left-3 z-20 text-[11px] text-tinta-3">Imagen ilustrativa</span>
          )
        )}
      </div>

      <div className="relative z-20 flex flex-1 flex-col gap-3 px-2 pt-4 pb-2">
        <div className="flex-1">
          <h3 className="text-[17px] leading-snug font-medium text-tinta">{producto.nombre}</h3>
          {producto.presentacion && <p className="mt-0.5 text-sm text-tinta-3">{producto.presentacion}</p>}
          {producto.descripcion && <p className="mt-2 text-sm leading-snug text-tinta-2">{producto.descripcion}</p>}
        </div>

        <Promos producto={producto} />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <EtiquetaPrecio producto={producto} />
          {producto.disponible && (
            <div className="flex h-11 min-w-[7.5rem] flex-1 items-stretch sm:flex-none">
              <AnimatePresence initial={false} mode="popLayout">
                {cantidad === 0 ? (
                  <motion.button
                    key="agregar"
                    type="button"
                    onClick={(e) => {
                      lanzarVuelo(e.currentTarget.getBoundingClientRect(), producto.imagen ? urlMedio("imagenes", producto.imagen) : undefined);
                      agregar(producto.id);
                    }}
                    initial={{ opacity: 0, filter: "blur(2px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)", transition: cambio }}
                    exit={{ opacity: 0, filter: "blur(2px)", transition: cambio }}
                    whileTap={{ scale: scale.press, transition: presion }}
                    className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[10px] bg-lapis-hondo px-4 text-sm font-medium text-marfil shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors duration-150 ease-sb hover:bg-lapis-medio"
                  >
                    <IconoMas className="text-base" /> Agregar
                  </motion.button>
                ) : (
                  <motion.div
                    key="cantidad"
                    initial={{ opacity: 0, filter: "blur(2px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)", transition: cambio }}
                    exit={{ opacity: 0, filter: "blur(2px)", transition: cambio }}
                    className="flex w-full items-stretch overflow-hidden rounded-[10px] border border-oro/50 bg-papel"
                  >
                    <motion.button
                      type="button"
                      onClick={() => quitar(producto.id)}
                      whileTap={{ scale: 0.9, transition: presion }}
                      aria-label={`Quitar una unidad de ${producto.nombre}`}
                      className="flex w-10 cursor-pointer items-center justify-center text-tinta-2 transition-colors duration-150 hover:bg-crema"
                    >
                      <IconoMenos />
                    </motion.button>
                    <span className="flex flex-1 items-center justify-center overflow-hidden text-sm font-medium tabular-nums" aria-live="polite">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={cantidad}
                          initial={{ opacity: 0, transform: "translateY(60%)", filter: "blur(2px)" }}
                          animate={{ opacity: 1, transform: "translateY(0%)", filter: "blur(0px)", transition: cambio }}
                          exit={{ opacity: 0, transform: "translateY(-60%)", filter: "blur(2px)", transition: cambio }}
                        >
                          {cantidad}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <motion.button
                      type="button"
                      onClick={() => agregar(producto.id)}
                      whileTap={{ scale: 0.9, transition: presion }}
                      aria-label={`Agregar una unidad de ${producto.nombre}`}
                      className="flex w-10 cursor-pointer items-center justify-center text-tinta-2 transition-colors duration-150 hover:bg-crema"
                    >
                      <IconoMas />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
