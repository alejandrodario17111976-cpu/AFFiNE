"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { scale, spring, transition as motionTransition, useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion";
import { validarCliente } from "@/lib/clientes";
import { guardarMiCliente, useMiCliente } from "@/lib/mis-datos";
import { sonar } from "@/lib/sonidos";
import { useSinDesplazamiento } from "@/lib/desplazamiento";
import type { Cliente } from "@/lib/tipos";
import { IconoCerrar } from "./Iconos";

const claseCampo =
  "h-11 w-full rounded-[10px] border border-marfil/20 bg-white/5 px-3 text-base text-marfil outline-none transition-colors placeholder:text-marfil/35 focus:border-oro";

/** Formulario de registro: nombre, apellido, DNI y celular. Se guarda en el teléfono del cliente. */
export function FormularioCliente({ alGuardar, textoBoton = "Guardar mis datos" }: { alGuardar?: (c: Cliente) => void; textoBoton?: string }) {
  const guardado = useMiCliente();
  const [datos, setDatos] = useState<Cliente>(() => guardado ?? { nombre: "", apellido: "", dni: "", telefono: "" });
  const [error, setError] = useState("");
  const presion = useTempoTransition(spring.press);

  const campo = (clave: keyof Cliente, etiqueta: string, extra: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-marfil/60">{etiqueta}</span>
      <input
        {...extra}
        value={datos[clave]}
        onChange={(e) => {
          setDatos((d) => ({ ...d, [clave]: e.target.value }));
          setError("");
        }}
        className={claseCampo}
      />
    </label>
  );

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const r = validarCliente(datos);
        if (!r.ok) {
          sonar("error");
          setError(r.error);
          return;
        }
        guardarMiCliente(r.cliente);
        sonar("registro");
        alGuardar?.(r.cliente);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        {campo("nombre", "Nombre", { autoComplete: "given-name", required: true })}
        {campo("apellido", "Apellido", { autoComplete: "family-name", required: true })}
      </div>
      {campo("dni", "DNI", { inputMode: "numeric", autoComplete: "off", placeholder: "Sin puntos", required: true })}
      {campo("telefono", "Celular (WhatsApp)", { type: "tel", inputMode: "tel", autoComplete: "tel-national", placeholder: "263 4123456", required: true })}
      {error && (
        <motion.p
          initial={{ opacity: 0, transform: "translateX(-6px)" }}
          animate={{ opacity: 1, transform: "translateX(0px)" }}
          className="rounded-lg bg-carmesi/25 px-3 py-2 text-sm text-marfil"
          role="alert"
        >
          {error}
        </motion.p>
      )}
      <p className="text-xs leading-relaxed text-marfil/55">
        Los usamos solo para identificar tu pedido y avisarte por WhatsApp cuando esté listo para retirar.
      </p>
      <motion.button
        type="submit"
        whileTap={{ scale: scale.press, transition: presion }}
        className="boton-oro h-12 cursor-pointer rounded-[10px] font-medium text-tinta"
      >
        {textoBoton}
      </motion.button>
    </form>
  );
}

/** Ventana "Mis datos" que se abre desde el menú. */
export function VentanaMisDatos({ abierta, cerrar }: { abierta: boolean; cerrar: () => void }) {
  useSinDesplazamiento(abierta);
  const reducir = useShouldReduceMotion();
  const entrar = useTempoTransition(spring.dialog);
  const salir = useTempoTransition(motionTransition.dismiss);
  useEffect(() => {
    if (!abierta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierta, cerrar]);

  return (
    <AnimatePresence>
      {abierta && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[70] flex items-end justify-center bg-lapis-noche/60 p-3 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: motionTransition.overlay }}
          exit={{ opacity: 0, transition: salir }}
          onClick={cerrar}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-mis-datos"
            onClick={(e) => e.stopPropagation()}
            className="grano relative w-full max-w-md overflow-hidden rounded-2xl border border-oro/25 bg-lapis-hondo p-5 text-marfil shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            initial={{ opacity: 0, scale: reducir ? 1 : scale.dialog, transform: reducir ? "none" : "translateY(16px)" }}
            animate={{ opacity: 1, scale: 1, transform: "translateY(0px)", transition: entrar }}
            exit={{ opacity: 0, scale: reducir ? 1 : 0.97, transition: salir }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="titulo-mis-datos" className="font-titulo text-3xl">
                Mis datos
              </h2>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-lg text-marfil/70 hover:bg-white/10"
              >
                <IconoCerrar />
              </button>
            </div>
            <FormularioCliente alGuardar={cerrar} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
