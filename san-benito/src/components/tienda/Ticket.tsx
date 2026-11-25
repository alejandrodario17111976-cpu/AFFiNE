"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { textoPedido, useCarrito } from "./carrito";
import { IconoCerrar, IconoCopiar, IconoMas, IconoMenos, IconoMensaje } from "./Iconos";

const CURVA = [0.22, 1, 0.36, 1] as const;

/** Fecha y hora en que se abrió el ticket (solo existe en el navegador, al abrirlo). */
function FechaTicket({ locale }: { locale: string }) {
  const [fecha] = useState(() =>
    new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date()),
  );
  return <p className="mt-1 text-xs text-tinta-3 tabular-nums">{fecha}</p>;
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
  }, [abierto, cerrar]);

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
            className="fixed inset-0 z-50 bg-lapis-noche/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={cerrar}
          />
          <motion.aside
            key="ticket"
            role="dialog"
            aria-modal="true"
            aria-label="Tu ticket"
            className="fixed top-0 right-0 z-[60] flex h-full w-full flex-col p-3 sm:w-[440px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.2 } }}
          >
            {/* Ranura de la caja registradora */}
            <div className="relative z-10 flex h-14 items-center justify-between rounded-xl bg-lapis-noche px-4 text-marfil shadow-flotante">
              <span className="font-titulo text-lg">Tu ticket</span>
              <button
                ref={botonCerrar}
                type="button"
                onClick={cerrar}
                aria-label="Cerrar ticket"
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-lg text-marfil/70 transition-colors hover:bg-marfil/10 hover:text-marfil"
              >
                <IconoCerrar />
              </button>
            </div>
            <div className="-mt-2 min-h-0 flex-1 overflow-hidden px-4">
              <motion.div
                className="borde-ticket max-h-full overflow-y-auto bg-papel px-5 pt-8 pb-10 text-tinta shadow-flotante"
                initial={{ y: "-105%" }}
                animate={{ y: 0 }}
                exit={{ y: "-105%" }}
                transition={{ duration: 0.5, ease: CURVA }}
              >
                <div className="text-center">
                  <p className="font-titulo text-2xl leading-none">{negocio.nombre}</p>
                  <p className="mt-1 text-sm text-oro-tinta">{negocio.eslogan}</p>
                  {negocio.direccion && <p className="mt-1 text-xs text-tinta-3">{negocio.direccion}</p>}
                  <FechaTicket locale={negocio.locale} />
                </div>
                <hr className="my-5 border-t border-dashed border-tinta/20" />

                {lineas.length === 0 ? (
                  <p className="py-8 text-center text-tinta-2">Tu ticket está vacío</p>
                ) : (
                  <ul className="flex flex-col gap-4">
                    <AnimatePresence initial>
                      {lineas.map((l, i) => (
                        <motion.li
                          key={l.producto.id}
                          layout
                          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: 0.3 + Math.min(i, 6) * 0.05, duration: 0.3, ease: "linear" }}
                          className="text-sm"
                        >
                          <div className="flex justify-between gap-3 font-medium">
                            <span>{l.producto.nombre}</span>
                            <span className="shrink-0 tabular-nums">{precio(l.subtotal)}</span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-3">
                            <span className="text-xs text-tinta-3 tabular-nums">
                              {l.cantidad} × {precio(l.producto.precio)}
                              {l.producto.presentacion ? ` · ${l.producto.presentacion}` : ""}
                            </span>
                            <span className="flex items-center overflow-hidden rounded-lg border border-tinta/12">
                              <button
                                type="button"
                                onClick={() => quitar(l.producto.id)}
                                aria-label={`Quitar una unidad de ${l.producto.nombre}`}
                                className="flex size-7 cursor-pointer items-center justify-center text-tinta-2 hover:bg-crema"
                              >
                                <IconoMenos />
                              </button>
                              <span className="w-7 text-center text-xs font-medium tabular-nums">{l.cantidad}</span>
                              <button
                                type="button"
                                onClick={() => agregar(l.producto.id)}
                                aria-label={`Agregar una unidad de ${l.producto.nombre}`}
                                className="flex size-7 cursor-pointer items-center justify-center text-tinta-2 hover:bg-crema"
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

                <hr className="my-5 border-t border-dashed border-tinta/20" />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-tinta-2 tabular-nums">
                    Total · {unidades} {unidades === 1 ? "unidad" : "unidades"}
                  </span>
                  <span className="font-titulo text-3xl tabular-nums">{precio(total)}</span>
                </div>

                {lineas.length > 0 && (
                  <div className="mt-6 flex flex-col gap-2">
                    {enlaceWhatsapp && (
                      <a
                        href={enlaceWhatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-oro font-medium text-tinta transition-colors hover:bg-[color-mix(in_oklab,var(--sb-acento)_85%,white)]"
                      >
                        <IconoMensaje /> Enviar por WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={copiar}
                      className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] font-medium transition-colors ${
                        enlaceWhatsapp
                          ? "border border-tinta/12 text-tinta hover:bg-crema"
                          : "bg-oro text-tinta hover:bg-[color-mix(in_oklab,var(--sb-acento)_85%,white)]"
                      }`}
                    >
                      <IconoCopiar /> {copiado ? "Pedido copiado" : "Copiar pedido"}
                    </button>
                    <button
                      type="button"
                      onClick={vaciar}
                      className="mt-1 cursor-pointer py-2 text-sm text-tinta-3 underline-offset-4 hover:text-tinta hover:underline"
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
