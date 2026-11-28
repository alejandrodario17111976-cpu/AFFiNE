"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { blur, scale, spring, transition as motionTransition, useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion";
import { guardarUltimoPedido, leerUltimoPedido, useUltimoPedido } from "@/lib/mis-datos";
import { sonar } from "@/lib/sonidos";
import { useCarrito } from "./carrito";
import { lanzarConfeti } from "./Efectos";
import { IconoCerrar } from "./Iconos";

/**
 * Aviso flotante con el estado del último pedido del cliente. Pregunta al negocio cada 20 segundos;
 * cuando el empleado toca "¡Pedido Listo!", suena la campanita y el aviso cambia.
 */
export default function EstadoMiPedido() {
  const { servicio, precio } = useCarrito();
  const ultimo = useUltimoPedido();
  const reducir = useShouldReduceMotion();
  const entrar = useTempoTransition(spring.toast);
  const salir = useTempoTransition(motionTransition.dismiss);

  const numero = ultimo?.numero;
  const activo = Boolean(servicio && ultimo && ultimo.estado !== "entregado");

  useEffect(() => {
    if (!activo || !servicio || !numero) return;
    let vigente = true;
    const consultar = async () => {
      const actual = leerUltimoPedido();
      if (!actual) return;
      const r = await servicio.consultar(actual.numero, actual.dni).catch(() => null);
      if (!vigente || !r || r.estado === actual.estado) return;
      guardarUltimoPedido({ ...actual, estado: r.estado });
      if (r.estado === "listo") {
        sonar("listo");
        lanzarConfeti(window.innerWidth / 2, window.innerHeight - 120);
      }
    };
    void consultar();
    const intervalo = window.setInterval(consultar, 20000);
    return () => {
      vigente = false;
      window.clearInterval(intervalo);
    };
  }, [activo, servicio, numero]);

  const listo = ultimo?.estado === "listo";

  return (
    <AnimatePresence>
      {activo && ultimo && (
        <motion.div
          key={ultimo.numero}
          role="status"
          aria-live="polite"
          className={`fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom,0px))] z-[44] mx-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-flotante backdrop-blur-md sm:left-auto sm:right-4 ${
            listo ? "border-oro/60 bg-lapis-hondo/95 text-marfil" : "border-marfil/15 bg-lapis-noche/90 text-marfil"
          }`}
          initial={{ opacity: 0, scale: reducir ? 1 : scale.toast, filter: reducir ? "none" : blur.surface, transform: reducir ? "none" : "translateY(24px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transform: "translateY(0px)", transition: entrar }}
          exit={{ opacity: 0, transform: reducir ? "none" : "translateY(24px)", transition: salir }}
        >
          <motion.span
            className={`size-3 shrink-0 rounded-full ${listo ? "bg-[#5BD17B] shadow-[0_0_10px_#5BD17B]" : "bg-oro"}`}
            animate={reducir ? undefined : listo ? { scale: [1, 1.35, 1] } : { opacity: [1, 0.35, 1] }}
            transition={{ duration: listo ? 0.9 : 1.6, repeat: Infinity }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <motion.p key={ultimo.estado} initial={{ opacity: 0, filter: "blur(3px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} className="font-medium">
              {listo ? "¡Tu pedido está listo para retirar!" : "Estamos preparando tu pedido"}
            </motion.p>
            <p className="text-sm text-marfil/60 tabular-nums">
              N.º {ultimo.numero} · {precio(ultimo.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => guardarUltimoPedido(listo ? { ...ultimo, estado: "entregado" } : null)}
            aria-label="Ocultar aviso del pedido"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-marfil/60 hover:bg-white/10 hover:text-marfil"
          >
            <IconoCerrar />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
