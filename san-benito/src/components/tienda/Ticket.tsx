"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { textoPedido, useCarrito } from "./carrito";
import { IconoCerrar, IconoCopiar, IconoMas, IconoMenos, IconoMensaje } from "./Iconos";

/** Fecha y hora en que se abrió el ticket (solo existe en el navegador, al abrirlo). */
function FechaTicket({ locale }: { locale: string }) {
  const [fecha] = useState(() =>
    new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date()),
  );
  return <p className="mt-2 text-xs">{fecha}</p>;
}

/** El carrito es un ticket de caja que se imprime línea por línea. */
export default function Ticket() {
  const { lineas, total, unidades, abierto, cerrar, agregar, quitar, vaciar, precio, negocio } = useCarrito();
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    botonCerrar.current?.focus();
    const alPresionar = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", alPresionar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = overflow;
    };
  }, [abierto, cerrar, negocio.locale]);

  const pedido = textoPedido(lineas, total, negocio);
  const enlaceWhatsapp = negocio.whatsapp
    ? `https://wa.me/${negocio.whatsapp}?text=${encodeURIComponent(pedido)}`
    : null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(pedido);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            key="fondo"
            className="fixed inset-0 z-50 bg-negro/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cerrar}
          />
          <motion.aside
            key="ticket"
            role="dialog"
            aria-modal="true"
            aria-label="Tu ticket"
            className="fixed top-0 right-0 z-[60] flex h-full w-full flex-col sm:w-[440px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.25 } }}
          >
            {/* Ranura de la caja registradora */}
            <div className="relative z-10 mx-2 mt-2 flex h-14 items-center justify-between border-4 border-negro bg-negro px-3 text-amarillo shadow-duro-sm">
              <span className="font-display text-lg uppercase">Tu ticket</span>
              <button
                ref={botonCerrar}
                type="button"
                onClick={cerrar}
                aria-label="Cerrar ticket"
                className="cursor-pointer p-1 text-2xl hover:text-blanco"
              >
                <IconoCerrar />
              </button>
            </div>
            <div className="-mt-1 min-h-0 flex-1 overflow-hidden px-5">
              <motion.div
                className="borde-ticket max-h-full overflow-y-auto bg-blanco px-5 pt-6 pb-10 font-mono text-negro"
                initial={{ y: "-105%" }}
                animate={{ y: 0 }}
                exit={{ y: "-105%" }}
                transition={{ type: "tween", ease: [0.2, 0.8, 0.2, 1], duration: 0.55 }}
              >
                <div className="text-center">
                  <p className="font-display text-3xl leading-none uppercase">{negocio.nombre}</p>
                  <p className="mt-1 text-sm font-bold uppercase">{negocio.eslogan}</p>
                  {negocio.direccion && <p className="mt-1 text-xs">{negocio.direccion}</p>}
                  <FechaTicket locale={negocio.locale} />
                </div>
                <hr className="my-4 border-t-2 border-dashed border-negro" />

                {lineas.length === 0 ? (
                  <p className="py-8 text-center font-bold">Tu ticket está vacío.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    <AnimatePresence initial>
                      {lineas.map((l, i) => (
                        <motion.li
                          key={l.producto.id}
                          layout
                          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ delay: 0.35 + i * 0.07, duration: 0.3, ease: "linear" }}
                          className="text-sm"
                        >
                          <div className="flex justify-between gap-3 font-bold uppercase">
                            <span>{l.producto.nombre}</span>
                            <span className="shrink-0 tabular-nums">{precio(l.subtotal)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <span className="text-xs">
                              {l.cantidad} x {precio(l.producto.precio)}
                              {l.producto.presentacion ? ` · ${l.producto.presentacion}` : ""}
                            </span>
                            <span className="flex border-2 border-negro">
                              <button
                                type="button"
                                onClick={() => quitar(l.producto.id)}
                                aria-label={`Quitar una unidad de ${l.producto.nombre}`}
                                className="cursor-pointer px-2 py-1 hover:bg-rojo hover:text-blanco"
                              >
                                <IconoMenos />
                              </button>
                              <span className="border-x-2 border-negro px-2 py-0.5 font-bold tabular-nums">{l.cantidad}</span>
                              <button
                                type="button"
                                onClick={() => agregar(l.producto.id)}
                                aria-label={`Agregar una unidad de ${l.producto.nombre}`}
                                className="cursor-pointer px-2 py-1 hover:bg-azul hover:text-blanco"
                              >
                                <IconoMas />
                              </button>
                            </span>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}

                <hr className="my-4 border-t-2 border-dashed border-negro" />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold uppercase">
                    Total · {unidades} {unidades === 1 ? "unidad" : "unidades"}
                  </span>
                  <span className="font-display text-3xl tabular-nums">{precio(total)}</span>
                </div>

                {lineas.length > 0 && (
                  <div className="mt-6 flex flex-col gap-3 font-display uppercase">
                    {enlaceWhatsapp && (
                      <a
                        href={enlaceWhatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 border-4 border-negro bg-amarillo px-4 py-3 text-lg shadow-duro-sm hover:bg-blanco"
                      >
                        <IconoMensaje /> Enviar por WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={copiar}
                      className={`flex cursor-pointer items-center justify-center gap-2 border-4 border-negro px-4 py-3 text-lg shadow-duro-sm ${
                        enlaceWhatsapp ? "bg-blanco hover:bg-amarillo" : "bg-amarillo hover:bg-blanco"
                      }`}
                    >
                      <IconoCopiar /> {copiado ? "Pedido copiado" : "Copiar pedido"}
                    </button>
                    <button
                      type="button"
                      onClick={vaciar}
                      className="cursor-pointer py-2 font-mono text-sm font-bold underline"
                    >
                      Vaciar ticket
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
