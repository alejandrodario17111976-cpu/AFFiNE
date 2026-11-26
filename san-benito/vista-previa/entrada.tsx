import { useState } from "react";
import { createRoot } from "react-dom/client";
import Tienda from "@/components/tienda/Tienda";
import { normalizarTienda } from "@/lib/validar";
import datos from "../data/tienda.json";

const tienda = normalizarTienda(datos);

/** AGL en la vista previa: pide la contraseña; sin servidor no hay dónde guardar, y lo dice al intentar entrar. */
function AccesoAgl({ cerrar }: { cerrar: () => void }) {
  const [clave, setClave] = useState("");
  const [intento, setIntento] = useState(false);
  return (
    <div
      className="grano fixed inset-0 z-[90] flex items-center justify-center bg-lapis-hondo p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-agl"
    >
      <form
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-papel p-6 text-tinta shadow-flotante"
        onSubmit={(e) => {
          e.preventDefault();
          setIntento(true);
        }}
      >
        <h2 id="titulo-agl" className="font-titulo text-5xl font-semibold tracking-[0.2em] text-lapis-hondo">
          AGL
        </h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-tinta-2">Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => {
              setClave(e.target.value);
              setIntento(false);
            }}
            className="h-10 w-full rounded-lg border border-tinta/15 bg-papel px-3 text-sm outline-none focus:border-oro"
            required
          />
        </label>
        {intento && (
          <p role="alert" className="rounded-lg bg-crema px-3 py-2 text-sm text-tinta-2">
            Esta copia no tiene servidor. Entrá a AGL desde el sitio publicado del negocio.
          </p>
        )}
        <button type="submit" disabled={!clave} className="h-10 cursor-pointer rounded-[10px] bg-lapis-hondo text-sm font-medium text-marfil disabled:opacity-40">
          Entrar
        </button>
        <button type="button" onClick={cerrar} className="cursor-pointer text-left text-sm text-tinta-2 underline-offset-4 hover:underline">
          Volver al sitio
        </button>
      </form>
    </div>
  );
}

function VistaPrevia() {
  const [agl, setAgl] = useState(false);
  return (
    <>
      <Tienda tienda={tienda} vistaPrevia onAgl={() => setAgl(true)} />
      {agl && (
        <div className="marca">
          <AccesoAgl cerrar={() => setAgl(false)} />
        </div>
      )}
    </>
  );
}

const raiz = document.getElementById("raiz");
if (raiz) createRoot(raiz).render(<VistaPrevia />);
