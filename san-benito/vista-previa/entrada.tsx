import { useState } from "react";
import { createRoot } from "react-dom/client";
import Tienda from "@/components/tienda/Tienda";
import { normalizarTienda } from "@/lib/validar";
import datos from "../data/tienda.json";

const tienda = normalizarTienda(datos);

/** En la vista previa no hay servidor donde guardar: AGL explica dónde funciona. */
function AvisoAgl({ cerrar }: { cerrar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-lapis-noche/70 p-4 backdrop-blur-sm"
      onClick={cerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-agl"
    >
      <div className="w-full max-w-sm rounded-2xl bg-papel p-6 text-tinta shadow-flotante" onClick={(e) => e.stopPropagation()}>
        <h2 id="titulo-agl" className="font-titulo text-5xl font-semibold tracking-[0.2em] text-lapis-hondo">
          AGL
        </h2>
        <p className="mt-3 leading-relaxed text-tinta-2">
          Esta es una vista previa sin servidor. En el sitio publicado, AGL pide la contraseña y desde ahí cambiás precios,
          productos, fotos, afiches y textos.
        </p>
        <button type="button" onClick={cerrar} className="boton-oro mt-6 h-11 w-full cursor-pointer rounded-[10px] font-medium">
          Entendido
        </button>
      </div>
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
          <AvisoAgl cerrar={() => setAgl(false)} />
        </div>
      )}
    </>
  );
}

const raiz = document.getElementById("raiz");
if (raiz) createRoot(raiz).render(<VistaPrevia />);
