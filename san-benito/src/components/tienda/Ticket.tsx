"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import JsBarcode from "jsbarcode";
import { spring, transition as motionTransition, useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion";
import { FUENTE_TICKET } from "@/lib/fuentes";
import { sonar } from "@/lib/sonidos";
import { textoPedido, useCarrito } from "./carrito";
import PrecioAnimado from "./PrecioAnimado";
import { IconoCerrar, IconoCopiar, IconoMas, IconoMenos, IconoMensaje } from "./Iconos";

/** Código de barras Code 128 con el número de pedido (se puede escanear). */
function CodigoBarras({ valor }: { valor: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svg.current) return;
    try {
      JsBarcode(svg.current, valor, {
        format: "CODE128",
        displayValue: false,
        background: "transparent",
        lineColor: "#2a2622",
        height: 44,
        width: 1.6,
        margin: 0,
      });
    } catch {
      /* valor inválido para el código */
    }
  }, [valor]);
  return <svg ref={svg} className="mx-auto h-11 max-w-full" role="img" aria-label={`Código de barras del pedido ${valor}`} />;
}

const dos = (n: number) => String(n).padStart(2, "0");

/** Una fila del ticket: texto a la izquierda, importe a la derecha y puntos de relleno al medio. */
function Fila({ izquierda, derecha, fuerte = false }: { izquierda: string; derecha: string; fuerte?: boolean }) {
  return (
    <div className={`flex items-baseline gap-1 ${fuerte ? "font-bold" : ""}`}>
      <span className="min-w-0 [overflow-wrap:anywhere]">{izquierda}</span>
      <span className="min-w-4 flex-1 translate-y-[-0.2em] border-b border-dotted border-current opacity-40" aria-hidden />
      <span className="shrink-0 tabular-nums">{derecha}</span>
    </div>
  );
}

function Corte() {
  return <div className="my-3 overflow-hidden whitespace-nowrap opacity-60 select-none" aria-hidden>{"- ".repeat(40)}</div>;
}

function PanelTicket() {
  const { lineas, total, ahorro, unidades, cerrar, agregar, quitar, vaciar, precio, negocio } = useCarrito();
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const [copiado, setCopiado] = useState<"no" | "si" | "error">("no");
  const [ahora] = useState(() => new Date());
  const reducir = useShouldReduceMotion();
  const entrar = useTempoTransition(motionTransition.sheet);
  const salir = useTempoTransition(motionTransition.dismiss);
  const presion = useTempoTransition(spring.press);

  const numero = `${String(ahora.getFullYear()).slice(2)}${dos(ahora.getMonth() + 1)}${dos(ahora.getDate())}-${dos(ahora.getHours())}${dos(ahora.getMinutes())}`;
  const fecha = new Intl.DateTimeFormat(negocio.locale, { dateStyle: "short" }).format(ahora);
  const hora = new Intl.DateTimeFormat(negocio.locale, { timeStyle: "short" }).format(ahora);

  useEffect(() => {
    botonCerrar.current?.focus();
    const alPresionar = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", alPresionar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = overflow;
    };
  }, [cerrar]);

  const pedido = textoPedido(lineas, total, negocio, numero);
  const enlaceWhatsapp = negocio.whatsapp
    ? `https://wa.me/${negocio.whatsapp}?text=${encodeURIComponent(pedido)}`
    : null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(pedido);
      sonar("pedido");
      setCopiado("si");
    } catch {
      // Copia de respaldo para navegadores que no dejan usar el portapapeles
      const area = document.createElement("textarea");
      area.value = pedido;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (ok) sonar("pedido");
      setCopiado(ok ? "si" : "error");
    }
    setTimeout(() => setCopiado("no"), 2400);
  };

  const oculto = { transform: reducir ? "translateY(0%)" : "translateY(-102%)", opacity: reducir ? 0 : 1 };

  return (
    <>
      <motion.div
        key="fondo"
        className="fixed inset-0 z-50 bg-lapis-noche/55 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: entrar }}
        exit={{ opacity: 0, transition: salir }}
        onClick={cerrar}
      />
      <motion.aside
        key="ticket"
        role="dialog"
        aria-modal="true"
        aria-label="Tu ticket"
        className="fixed top-0 right-0 z-[60] flex h-full w-full flex-col pt-[env(safe-area-inset-top,0px)] sm:w-[460px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { delay: 0.25 } }}
      >
        {/* Impresora: carcasa de metal con la ranura de salida del papel */}
        <div className="relative z-10 mx-3 mt-3 rounded-2xl bg-[linear-gradient(180deg,#2b3340,#11151c)] px-4 pt-3 pb-5 text-marfil shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-marfil/70">
              <span className="size-2 rounded-full bg-[#5BD17B] shadow-[0_0_6px_#5BD17B]" aria-hidden />
              Tu ticket
            </span>
            <motion.button
              ref={botonCerrar}
              type="button"
              onClick={cerrar}
              whileTap={{ scale: 0.92, transition: presion }}
              aria-label="Cerrar ticket"
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-lg text-marfil/70 transition-colors hover:bg-white/10 hover:text-marfil"
            >
              <IconoCerrar />
            </motion.button>
          </div>
          <div className="absolute inset-x-5 bottom-2 h-2 rounded-full bg-black shadow-[inset_0_2px_3px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.08)]" />
        </div>

        <div className="-mt-3 min-h-0 flex-1 overflow-hidden px-7">
          <motion.div
            className="ticket-papel borde-ticket relative max-h-full overflow-y-auto px-5 pt-8 pb-12"
            style={{ fontFamily: FUENTE_TICKET }}
            initial={oculto}
            animate={{ transform: "translateY(0%)", opacity: 1, transition: { duration: reducir ? 0.2 : 0.9, ease: [0.25, 1, 0.5, 1] } }}
            exit={{ ...oculto, transition: salir }}
          >
            <div className="text-center">
              <p className="text-[22px] font-bold tracking-[0.14em] uppercase">{negocio.nombre}</p>
              <p className="mt-0.5 text-[13px]">{negocio.eslogan}</p>
              {negocio.sucursales.map((s) => (
                <p key={`${s.nombre}${s.direccion}`} className="text-[11px] uppercase">
                  {s.direccion}
                  {s.nombre ? ` · ${s.nombre}` : ""}
                </p>
              ))}
            </div>
            <Corte />
            <div className="text-[12px] uppercase">
              <Fila izquierda="Pedido N.º" derecha={numero} />
              <Fila izquierda={`Fecha ${fecha}`} derecha={`Hora ${hora}`} />
            </div>
            <Corte />

            {lineas.length === 0 ? (
              <p className="py-6 text-center text-[13px] uppercase">Tu ticket está vacío</p>
            ) : (
              <ul className="flex flex-col gap-3 text-[13px]">
                <AnimatePresence initial>
                  {lineas.map((l, i) => (
                    <motion.li
                      key={l.producto.id}
                      layout
                      // Cada línea se "imprime" de arriba hacia abajo
                      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                      exit={{ opacity: 0, transition: salir }}
                      transition={{ delay: 0.55 + Math.min(i, 8) * 0.09, duration: 0.18, ease: "linear" }}
                    >
                      <p className="text-[12px]">
                        {l.cantidad} x {precio(l.producto.precio)}
                      </p>
                      <Fila izquierda={l.producto.nombre.toUpperCase()} derecha={precio(l.producto.precio * l.cantidad)} />
                      {l.ahorro > 0 && <Fila izquierda="  Promo por cantidad" derecha={`-${precio(l.ahorro)}`} />}
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className="opacity-70">{l.producto.presentacion}</span>
                        <span className="flex items-center border border-current/40">
                          <button
                            type="button"
                            onClick={() => quitar(l.producto.id)}
                            aria-label={`Quitar una unidad de ${l.producto.nombre}`}
                            className="flex size-7 cursor-pointer items-center justify-center hover:bg-black/5"
                          >
                            <IconoMenos />
                          </button>
                          <span className="w-7 text-center font-bold tabular-nums">{l.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => agregar(l.producto.id)}
                            aria-label={`Agregar una unidad de ${l.producto.nombre}`}
                            className="flex size-7 cursor-pointer items-center justify-center hover:bg-black/5"
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

            <Corte />
            <div className="text-[13px] uppercase">
              <Fila izquierda="Artículos" derecha={String(unidades)} />
              {ahorro > 0 && <Fila izquierda="Ahorro" derecha={`-${precio(ahorro)}`} />}
            </div>
            <div className="mt-3 flex items-baseline justify-between text-[13px] uppercase">
              <span className="font-bold">Total</span>
              <PrecioAnimado valor={total} className="text-[28px] font-bold" />
            </div>
            <Corte />
            <CodigoBarras valor={numero} />
            <p className="mt-1 text-center text-[11px] tracking-[0.3em]">*{numero}*</p>
            <p className="mt-4 text-center text-[12px] uppercase">Gracias por elegirnos</p>
          </motion.div>
        </div>

        {lineas.length > 0 && (
          <motion.div
            className="mx-3 mb-3 flex flex-col gap-2 rounded-2xl bg-lapis-noche/90 p-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] shadow-flotante backdrop-blur"
            initial={{ opacity: 0, transform: "translateY(12px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)", transition: { ...entrar, delay: 0.35 } }}
            exit={{ opacity: 0, transition: salir }}
          >
            {enlaceWhatsapp && (
              <motion.a
                href={enlaceWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sonar("pedido")}
                whileTap={{ scale: 0.97, transition: presion }}
                className="boton-oro flex h-12 items-center justify-center gap-2 rounded-[10px] font-medium text-tinta"
              >
                <IconoMensaje /> Enviar por WhatsApp
              </motion.a>
            )}
            <motion.button
              type="button"
              onClick={copiar}
              whileTap={{ scale: 0.97, transition: presion }}
              className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] font-medium ${
                enlaceWhatsapp ? "border border-marfil/20 text-marfil hover:bg-white/5" : "boton-oro text-tinta"
              }`}
            >
              <IconoCopiar />
              {copiado === "si" ? "Pedido copiado" : copiado === "error" ? "No se pudo copiar" : "Copiar pedido"}
            </motion.button>
            <button
              type="button"
              onClick={vaciar}
              className="cursor-pointer py-1.5 text-sm text-marfil/60 underline-offset-4 hover:text-marfil hover:underline"
            >
              Vaciar ticket
            </button>
          </motion.div>
        )}
      </motion.aside>
    </>
  );
}

/** El carrito es un ticket de papel térmico que sale de la impresora, línea por línea. */
export default function Ticket() {
  const { abierto } = useCarrito();
  return <AnimatePresence>{abierto && <PanelTicket key="ticket" />}</AnimatePresence>;
}
