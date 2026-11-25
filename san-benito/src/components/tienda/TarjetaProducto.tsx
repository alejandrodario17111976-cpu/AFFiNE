"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PerspectiveCamera, View } from "@react-three/drei";
import type { Categoria, Producto } from "@/lib/tipos";
import { descuento } from "@/lib/formato";
import { LucesTienda, Producto3D, SombraSuelo } from "@/components/escena/Producto3D";
import type { Interaccion } from "@/components/escena/compartido";
import { useCarrito } from "./carrito";
import { IconoMas, IconoMenos } from "./Iconos";

const RIEL: Record<Categoria["color"], string> = {
  rojo: "bg-rojo",
  amarillo: "bg-amarillo",
  azul: "bg-azul",
};

/** Vista 3D de un producto que sigue a su contenedor en la página. */
export function Vista3D({ producto, className = "" }: { producto: Producto; className?: string }) {
  const zona = useRef<HTMLDivElement>(null);
  const interaccion = useRef<Interaccion>({ hover: false, x: 0, y: 0 });
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
      <View className="absolute inset-0">
        <PerspectiveCamera makeDefault position={[0, 0.25, 5.6]} fov={34} />
        <LucesTienda />
        <Producto3D producto={producto} interaccion={interaccion} />
        <SombraSuelo y={-1.25} />
      </View>
    </div>
  );
}

export default function TarjetaProducto({ producto, categoria }: { producto: Producto; categoria?: Categoria }) {
  const { agregar, quitar, cantidadDe, precio } = useCarrito();
  const cantidad = cantidadDe(producto.id);
  const off = descuento(producto);

  return (
    <article
      className={`group relative flex h-full flex-col border-4 border-negro bg-blanco shadow-duro transition-transform duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] ${
        producto.disponible ? "" : "opacity-75"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden border-b-4 border-negro">
        <Vista3D producto={producto} className="h-full w-full" />
        {off > 0 && (
          <span className="absolute top-3 left-3 z-20 -rotate-6 border-4 border-negro bg-rojo px-2 py-1 font-display text-2xl leading-none text-blanco shadow-duro-sm">
            -{off}%
          </span>
        )}
        {!producto.disponible && (
          <span className="absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 -rotate-6 border-y-4 border-negro bg-amarillo py-2 text-center font-display text-3xl text-negro">
            Sin stock
          </span>
        )}
        {categoria && (
          <span className="absolute top-3 right-3 z-20 border-2 border-negro bg-blanco px-1.5 py-0.5 font-mono text-xs font-bold uppercase">
            {categoria.nombre}
          </span>
        )}
      </div>

      {/* Riel de góndola con la etiqueta de precio enganchada */}
      <div className={`relative z-20 h-4 border-b-4 border-negro ${RIEL[categoria?.color ?? "azul"]}`} />

      <div className="relative z-20 flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="-mt-8 self-start border-4 border-negro bg-amarillo px-3 pt-1 pb-1.5 shadow-duro-sm">
          {producto.precioAnterior && off > 0 && (
            <span className="block font-mono text-xs font-bold text-negro line-through decoration-rojo decoration-2">
              Antes {precio(producto.precioAnterior)}
            </span>
          )}
          <span className="block font-display text-3xl leading-none tracking-tight text-negro tabular-nums sm:text-4xl">
            {precio(producto.precio)}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="font-display text-xl leading-[0.95] tracking-tight uppercase sm:text-2xl">{producto.nombre}</h3>
          {producto.presentacion && <p className="mt-1 font-mono text-sm font-bold">{producto.presentacion}</p>}
        </div>

        {producto.disponible && (
          <div className="flex h-12 items-stretch">
            <AnimatePresence initial={false} mode="popLayout">
              {cantidad === 0 ? (
                <motion.button
                  key="agregar"
                  type="button"
                  onClick={() => agregar(producto.id)}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  whileTap={{ scale: 0.94 }}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 border-4 border-negro bg-negro font-display text-lg text-amarillo uppercase hover:bg-azul hover:text-blanco"
                >
                  <IconoMas className="text-xl" /> Agregar
                </motion.button>
              ) : (
                <motion.div
                  key="cantidad"
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  className="flex w-full items-stretch border-4 border-negro"
                >
                  <button
                    type="button"
                    onClick={() => quitar(producto.id)}
                    aria-label={`Quitar una unidad de ${producto.nombre}`}
                    className="flex w-12 cursor-pointer items-center justify-center bg-blanco text-xl hover:bg-rojo hover:text-blanco"
                  >
                    <IconoMenos />
                  </button>
                  <motion.span
                    key={cantidad}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="flex flex-1 items-center justify-center border-x-4 border-negro bg-amarillo font-display text-xl tabular-nums"
                    aria-live="polite"
                  >
                    {cantidad}
                  </motion.span>
                  <button
                    type="button"
                    onClick={() => agregar(producto.id)}
                    aria-label={`Agregar una unidad de ${producto.nombre}`}
                    className="flex w-12 cursor-pointer items-center justify-center bg-blanco text-xl hover:bg-azul hover:text-blanco"
                  >
                    <IconoMas />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </article>
  );
}
