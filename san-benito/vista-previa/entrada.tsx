import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Tienda from "@/components/tienda/Tienda";
import EditorAdmin, { type Acciones } from "@/components/admin/EditorAdmin";
import { ErrorDatos, normalizarTienda } from "@/lib/validar";
import type { Tienda as DatosTienda } from "@/lib/tipos";
import datosDelArmado from "../data/tienda.json";
import { documentoCompleto } from "./pagina.mjs";
import { codigo, usarCapacidad, type CapacidadArtifact, type CapacidadAssets } from "./capacidades";

/**
 * La tienda publicada en claude.ai. Los datos viajan dentro de la página (en
 * <script id="datos-tienda">), así AGL los cambia publicando una versión nueva de la
 * misma página: todos los que la abren ven los precios nuevos. Solo la cuenta dueña
 * de la página puede publicar; el PIN es la puerta del panel.
 */

/** Huella PBKDF2 del PIN de AGL ("pbkdf2$iteraciones$sal$hash"); la pone el armado desde CLAVE_AGL. */
const HUELLA = process.env.CLAVE_AGL_HASH ?? "";
const SESION = "san-benito-agl";

function datosIniciales(): DatosTienda {
  const nodo = document.getElementById("datos-tienda");
  if (nodo?.textContent) {
    try {
      return normalizarTienda(JSON.parse(nodo.textContent));
    } catch {
      /* datos rotos: se usan los del armado */
    }
  }
  return normalizarTienda(datosDelArmado);
}

const sesionAbierta = () => {
  try {
    return sessionStorage.getItem(SESION) === "1";
  } catch {
    return false;
  }
};
const marcarSesion = (abierta: boolean) => {
  try {
    if (abierta) sessionStorage.setItem(SESION, "1");
    else sessionStorage.removeItem(SESION);
  } catch {
    /* sin almacenamiento: hay que volver a poner el PIN después de guardar */
  }
};

const bytes = (hex: string) => new Uint8Array((hex.match(/../g) ?? []).map((b) => parseInt(b, 16)));
const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function verificarPin(texto: string): Promise<boolean> {
  if (!HUELLA) return true;
  const [, iteraciones, sal, esperado] = HUELLA.split("$");
  try {
    const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode(texto.trim()), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: bytes(sal), iterations: Number(iteraciones) },
      clave,
      256,
    );
    if (hex(bits) === esperado) return true;
  } catch {
    /* navegador sin WebCrypto */
  }
  await new Promise((r) => setTimeout(r, 600));
  return false;
}

const SIN_PERMISO = "Solo la cuenta de claude.ai dueña de esta página puede guardar cambios. Abrila en claude.ai con esa cuenta.";

function crearAcciones(alGuardar: (t: DatosTienda) => void): Acciones {
  return {
    verificarClave: verificarPin,

    guardarTienda: async (_clave, datos) => {
      let limpia: DatosTienda;
      try {
        limpia = normalizarTienda(datos);
      } catch (e) {
        return { ok: false, error: e instanceof ErrorDatos ? e.message : "Los datos no son válidos." };
      }
      const artifact = await usarCapacidad<CapacidadArtifact>("artifact");
      if (!artifact) return { ok: false, error: SIN_PERMISO };
      // Al publicar, la página se recarga: AGL se vuelve a abrir sin pedir el PIN en esta pestaña
      marcarSesion(true);
      try {
        await artifact.publish(documentoCompleto(limpia));
        alGuardar(limpia);
        return { ok: true };
      } catch (e) {
        const c = codigo(e);
        if (c === "conflict") return { ok: false, error: "Alguien guardó otra versión recién. La página se recarga con esa versión." };
        marcarSesion(false);
        if (["not_writer", "not_granted", "consent_required", "capability_disabled", "not_declared"].includes(c)) {
          return { ok: false, error: SIN_PERMISO };
        }
        if (c === "rate_limited") return { ok: false, error: "Se guardó hace muy poco. Esperá un minuto y volvé a guardar." };
        if (c === "too_large") return { ok: false, error: "Los datos son demasiado grandes para guardarlos en la página." };
        return { ok: false, error: "No se pudo guardar. Revisá la conexión y probá de nuevo." };
      }
    },

    subirImagen: async (_clave, _carpeta, formulario) => {
      const assets = await usarCapacidad<CapacidadAssets>("assets");
      if (!assets) return { ok: false, error: "Para subir fotos abrí esta página en claude.ai con la cuenta dueña." };
      const archivo = formulario.get("archivo");
      if (!(archivo instanceof Blob)) return { ok: false, error: "Elegí una foto." };
      const tipo = ["image/webp", "image/png", "image/jpeg", "image/gif"].includes(archivo.type) ? archivo.type : undefined;
      try {
        const r = await assets.upload(archivo, tipo ? { type: tipo } : undefined);
        return { ok: true, archivo: `/_blob/${r.id}` };
      } catch (e) {
        const c = codigo(e);
        if (c === "too_large") return { ok: false, error: "La foto pesa demasiado (máximo 20 MB)." };
        if (c === "unsupported_type") return { ok: false, error: "Usá una foto JPG, PNG o WebP." };
        if (c === "quota_or_state") return { ok: false, error: "Se llenó el espacio para fotos de la página." };
        if (c === "not_granted" || c === "capability_disabled") return { ok: false, error: SIN_PERMISO };
        return { ok: false, error: "No se pudo subir la foto. Probá de nuevo." };
      }
    },
    // Las fotos subidas se conservan aunque un producto deje de usarlas (borrarlas no tiene vuelta atrás)
  };
}

function Aviso({ puede }: { puede: boolean | null }) {
  if (puede === null) return null;
  return puede ? (
    <p>Al tocar Guardar cambios, esta página se publica de nuevo con los precios y fotos nuevos, y se actualiza para todos.</p>
  ) : (
    <p>
      Podés mirar el panel, pero para guardar cambios y subir fotos hay que abrir esta página en claude.ai con la cuenta que la
      creó.
    </p>
  );
}

function VistaPrevia() {
  const [tienda, setTienda] = useState(datosIniciales);
  const [agl, setAgl] = useState(sesionAbierta);
  const [puede, setPuede] = useState<boolean | null>(null);
  const acciones = useMemo(() => crearAcciones(setTienda), []);
  const publica = useMemo(() => ({ ...tienda, productos: tienda.productos.filter((p) => p.visible) }), [tienda]);

  useEffect(() => {
    if (!agl) return;
    let vigente = true;
    usarCapacidad<CapacidadAssets>("assets").then((a) => {
      if (vigente) setPuede(Boolean(a));
    });
    return () => {
      vigente = false;
    };
  }, [agl]);

  if (agl) {
    return (
      <EditorAdmin
        inicial={tienda}
        modo={HUELLA ? "clave" : "libre"}
        acciones={acciones}
        claveInicial={sesionAbierta() ? "" : null}
        avisarAlSalir={false}
        aviso={<Aviso puede={puede} />}
        volver={() => {
          marcarSesion(false);
          setAgl(false);
          window.scrollTo(0, 0);
        }}
      />
    );
  }
  return <Tienda tienda={publica} vistaPrevia onAgl={() => setAgl(true)} />;
}

const raiz = document.getElementById("raiz");
if (raiz) createRoot(raiz).render(<VistaPrevia />);
