"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { descuento, formatearPrecio, urlMedio } from "@/lib/formato";
import { FUENTES_TEXTO, FUENTES_TITULOS, familiaTexto, familiaTitulos } from "@/lib/fuentes";
import { estiloMarca } from "@/lib/marca";
import { APARIENCIA_INICIAL } from "@/lib/validar";
import {
  COLORES_CATEGORIA,
  ENVASES,
  NOMBRES_COLOR,
  NOMBRES_ENVASE,
  type Afiche,
  type Apariencia,
  type Categoria,
  type Negocio,
  type Producto,
  type Promo,
  type Secciones,
  type Sucursal,
  type Textos,
  type Tienda,
} from "@/lib/tipos";

export type ModoAcceso = "libre" | "clave" | "sin-configurar";
export type Resultado = { ok: true } | { ok: false; error: string };

/** Cómo se guardan y verifican los cambios (en el servidor, o en otro lado en la vista previa). */
export type ResultadoImagen = { ok: true; archivo: string } | { ok: false; error: string };
type Carpeta = "imagenes" | "afiches";

export interface Acciones {
  verificarClave: (clave: string) => Promise<boolean>;
  guardarTienda: (clave: string, datos: unknown) => Promise<Resultado>;
  subirImagen?: (clave: string, carpeta: Carpeta, formulario: FormData) => Promise<ResultadoImagen>;
  borrarImagen?: (clave: string, carpeta: Carpeta, archivo: string) => Promise<Resultado>;
}

type Fila = { uid: string; p: Producto };
type Pestaña = "productos" | "afiches" | "pasillos" | "textos" | "apariencia" | "negocio";

/**
 * Achica la foto en el teléfono antes de subirla (más rápido con datos móviles)
 * y la pasa a WebP, que conserva la transparencia de las fotos recortadas.
 */
async function prepararImagen(archivo: File, lado: number): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(archivo);
    const factor = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(bitmap.width * factor);
    lienzo.height = Math.round(bitmap.height * factor);
    lienzo.getContext("2d")?.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, "image/webp", 0.9));
    return blob && blob.size < archivo.size ? blob : archivo;
  } catch {
    return archivo;
  }
}

/** Botón de "subir foto" que usa la cámara o la galería del teléfono. */
function SubirFoto({
  texto,
  onElegir,
  ocupado,
}: {
  texto: string;
  onElegir: (archivo: File) => void;
  ocupado?: boolean;
}) {
  return (
    <label
      className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-[10px] border border-tinta/15 bg-papel px-4 text-sm font-medium text-tinta transition-colors hover:bg-crema ${
        ocupado ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {ocupado ? "Subiendo…" : texto}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          e.target.value = "";
          if (archivo) onElegir(archivo);
        }}
      />
    </label>
  );
}

let contador = 0;
const nuevoUid = () => `f${(contador++).toString(36)}`;

/* ---------- Piezas de formulario ---------- */

const claseCampo =
  "h-10 w-full rounded-lg border border-tinta/15 bg-papel px-3 text-sm text-tinta outline-none transition-colors focus:border-oro disabled:opacity-50";

function Campo({ etiqueta, children, className = "" }: { etiqueta: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs text-tinta-2">{etiqueta}</span>
      {children}
    </label>
  );
}

function Boton({
  children,
  onClick,
  variante = "secundario",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "principal" | "secundario" | "oscuro" | "peligro";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const estilos = {
    principal: "bg-oro text-tinta hover:bg-[color-mix(in_oklab,var(--sb-acento)_85%,white)]",
    secundario: "border border-tinta/15 bg-papel text-tinta hover:bg-crema",
    oscuro: "bg-lapis-hondo text-marfil hover:bg-lapis-medio",
    peligro: "border border-carmesi/30 bg-papel text-carmesi hover:bg-carmesi hover:text-marfil",
  }[variante];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-10 cursor-pointer rounded-[10px] px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${estilos}`}
    >
      {children}
    </button>
  );
}

function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-tinta/8 bg-papel p-4 shadow-suave md:p-5 ${className}`}>{children}</div>;
}

function Titulo({ children, texto }: { children: ReactNode; texto?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-titulo text-3xl tracking-[-0.02em] md:text-4xl">{children}</h2>
      {texto && <p className="mt-2 max-w-2xl text-tinta-2">{texto}</p>}
    </div>
  );
}

function SelectorColor({ valor, onChange, etiqueta }: { valor: string; onChange: (v: string) => void; etiqueta: string }) {
  return (
    <Campo etiqueta={etiqueta}>
      <span className="flex h-10 items-center gap-2 rounded-lg border border-tinta/15 bg-papel pr-3 pl-1">
        <input
          type="color"
          value={valor}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-8 cursor-pointer rounded-md border-0 bg-transparent"
        />
        <span className="text-xs text-tinta-3 tabular-nums">{valor}</span>
      </span>
    </Campo>
  );
}

/* ---------- Acceso ---------- */

function Acceso({
  onEntrar,
  verificar,
  claveLocal,
}: {
  onEntrar: (clave: string) => void;
  verificar: Acciones["verificarClave"];
  claveLocal?: boolean;
}) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  return (
    <main className="grano relative flex min-h-svh items-center justify-center bg-lapis-hondo p-4">
      <form
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-papel p-6 shadow-flotante"
        onSubmit={async (e) => {
          e.preventDefault();
          setCargando(true);
          setError("");
          const ok = await verificar(clave);
          setCargando(false);
          if (ok) onEntrar(clave);
          else setError("La contraseña no es correcta");
        }}
      >
        <div>
          <h1 className="font-titulo text-5xl font-semibold tracking-[0.2em] text-lapis-hondo">AGL</h1>
          <p className="mt-1 text-sm text-tinta-2">Precios, productos, fotos y textos del sitio</p>
        </div>
        <Campo etiqueta="Contraseña">
          <input
            type="password"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className={claseCampo}
            required
          />
        </Campo>
        {error && <p className="rounded-lg bg-carmesi/10 px-3 py-2 text-sm text-carmesi">{error}</p>}
        {claveLocal && (
          <p className="rounded-lg bg-crema px-3 py-2 text-xs text-tinta-2">
            Estás en tu computadora sin ADMIN_PASSWORD: la contraseña es <strong>sanbenito</strong>. En el sitio publicado se usa
            la que configures.
          </p>
        )}
        <Boton type="submit" variante="oscuro" disabled={cargando || !clave}>
          {cargando ? "Entrando…" : "Entrar"}
        </Boton>
        <Link href="/" className="text-sm text-tinta-2 underline-offset-4 hover:underline">
          Volver al sitio
        </Link>
      </form>
    </main>
  );
}

/* ---------- Editor ---------- */

export default function EditorAdmin({
  inicial,
  modo,
  acciones,
  claveLocal = false,
}: {
  inicial: Tienda;
  modo: ModoAcceso;
  acciones: Acciones;
  claveLocal?: boolean;
}) {
  const [clave, setClave] = useState<string | null>(modo === "libre" ? "" : null);
  const [afiches, setAfiches] = useState<Afiche[]>(inicial.afiches);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  // Imágenes guardadas por última vez: las que se dejen de usar se borran al guardar.
  const [guardadas, setGuardadas] = useState(() => ({
    imagenes: new Set(inicial.productos.map((p) => p.imagen).filter(Boolean)),
    afiches: new Set(inicial.afiches.map((a) => a.imagen)),
  }));
  const [negocio, setNegocio] = useState<Negocio>(inicial.negocio);
  const [apariencia, setApariencia] = useState<Apariencia>(inicial.apariencia);
  const [textos, setTextos] = useState<Textos>(inicial.textos);
  const [secciones, setSecciones] = useState<Secciones>(inicial.secciones);
  const [categorias, setCategorias] = useState<Categoria[]>(inicial.categorias);
  const [filas, setFilas] = useState<Fila[]>(() => inicial.productos.map((p) => ({ uid: nuevoUid(), p })));
  const [sucio, setSucio] = useState(false);
  const [estado, setEstado] = useState<{ tipo: "ok" | "error" | "guardando"; texto: string } | null>(null);
  const [pestaña, setPestaña] = useState<Pestaña>("productos");
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [porcentaje, setPorcentaje] = useState("");

  useEffect(() => {
    if (!sucio) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sucio]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter(
      (f) => (filtro === "todas" || f.p.categoria === filtro) && (!q || f.p.nombre.toLowerCase().includes(q)),
    );
  }, [filas, filtro, busqueda]);

  if (modo === "sin-configurar") {
    return (
      <main className="grano relative flex min-h-svh items-center justify-center bg-lapis-hondo p-4">
        <div className="max-w-lg rounded-2xl bg-papel p-6 shadow-flotante">
          <h1 className="font-titulo text-3xl tracking-[-0.02em]">Falta la contraseña</h1>
          <p className="mt-4 leading-relaxed text-tinta-2">
            Para editar el sitio publicado, configurá la variable de entorno{" "}
            <code className="rounded bg-crema px-1.5 py-0.5 text-tinta">ADMIN_PASSWORD</code> en el servidor y reinicialo.
          </p>
        </div>
      </main>
    );
  }

  if (clave === null) {
    return (
      <div style={estiloMarca(apariencia)} className="marca font-texto text-tinta">
        <Acceso onEntrar={setClave} verificar={acciones.verificarClave} claveLocal={claveLocal} />
      </div>
    );
  }

  const marcar = () => {
    setSucio(true);
    setEstado(null);
  };

  const cambiarProducto = (uid: string, cambios: Partial<Producto>) => {
    setFilas((fs) => fs.map((f) => (f.uid === uid ? { ...f, p: { ...f.p, ...cambios } } : f)));
    marcar();
  };

  const cambiarTexto = <K extends keyof Textos>(campo: K, valor: Textos[K]) => {
    setTextos((t) => ({ ...t, [campo]: valor }));
    marcar();
  };

  const agregarProducto = () => {
    const categoria = filtro !== "todas" ? filtro : categorias[0]?.id ?? "";
    const p: Producto = {
      id: "",
      nombre: "Producto nuevo",
      categoria,
      presentacion: "",
      descripcion: "",
      precio: 0,
      promos: [],
      enOferta: false,
      imagen: "",
      precioAnterior: null,
      disponible: true,
      destacado: false,
      envase: "caja",
      color: apariencia.colorPrincipal,
      colorSecundario: apariencia.colorAcento,
      contenido: "",
      modelo: "",
    };
    setFilas((fs) => [{ uid: nuevoUid(), p }, ...fs]);
    setBusqueda("");
    marcar();
  };

  const ajustarPrecios = () => {
    const n = Number(porcentaje.replace(",", "."));
    if (!Number.isFinite(n) || n === 0) return;
    const uids = new Set(visibles.map((f) => f.uid));
    const factor = 1 + n / 100;
    // Redondea a la decena más cercana, como en un cartel de góndola.
    const redondear = (v: number) => Math.max(0, Math.round((v * factor) / 10) * 10);
    setFilas((fs) =>
      fs.map((f) =>
        uids.has(f.uid)
          ? {
              ...f,
              p: {
                ...f.p,
                precio: redondear(f.p.precio),
                precioAnterior: f.p.precioAnterior ? redondear(f.p.precioAnterior) : null,
              },
            }
          : f,
      ),
    );
    setPorcentaje("");
    marcar();
  };

  const datos = (): Tienda => ({
    negocio,
    apariencia,
    textos,
    secciones,
    categorias,
    productos: filas.map((f) => f.p),
    afiches,
  });

  const subir = async (
    carpeta: Carpeta,
    archivo: File,
    nombre: string,
    marca: string,
    alListo: (archivo: string) => void,
  ) => {
    if (!acciones.subirImagen) {
      setEstado({ tipo: "error", texto: "Subir fotos funciona en el sitio publicado" });
      return;
    }
    setSubiendo(marca);
    const formulario = new FormData();
    const preparada = await prepararImagen(archivo, carpeta === "afiches" ? 1600 : 1200);
    formulario.set("archivo", preparada, archivo.name);
    formulario.set("nombre", nombre);
    const r = await acciones.subirImagen(clave, carpeta, formulario);
    setSubiendo(null);
    if (r.ok) {
      alListo(r.archivo);
      marcar();
      setEstado({ tipo: "ok", texto: "Foto subida. Tocá Guardar cambios para publicarla" });
    } else {
      setEstado({ tipo: "error", texto: r.error });
    }
  };

  const guardar = async () => {
    setEstado({ tipo: "guardando", texto: "Guardando…" });
    const actuales = datos();
    const r = await acciones.guardarTienda(clave, actuales);
    if (r.ok) {
      setSucio(false);
      // Borra del servidor las fotos que ya no usa ningún producto ni afiche
      const usadas = {
        imagenes: new Set(actuales.productos.map((p) => p.imagen).filter(Boolean)),
        afiches: new Set(actuales.afiches.map((a) => a.imagen)),
      };
      if (acciones.borrarImagen) {
        for (const carpeta of ["imagenes", "afiches"] as const) {
          for (const archivo of guardadas[carpeta]) {
            if (!usadas[carpeta].has(archivo)) void acciones.borrarImagen(clave, carpeta, archivo);
          }
        }
      }
      setGuardadas(usadas);
      setEstado({ tipo: "ok", texto: "Cambios guardados. El sitio ya los muestra" });
    } else {
      setEstado({ tipo: "error", texto: r.error });
    }
  };

  const descargar = () => {
    const blob = new Blob([`${JSON.stringify(datos(), null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tienda.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const precio = (v: number) => formatearPrecio(v, negocio);

  const pestañas: { id: Pestaña; nombre: string }[] = [
    { id: "productos", nombre: "Productos y precios" },
    { id: "afiches", nombre: "Afiches" },
    { id: "pasillos", nombre: "Pasillos" },
    { id: "textos", nombre: "Textos y secciones" },
    { id: "apariencia", nombre: "Colores y fuentes" },
    { id: "negocio", nombre: "Datos del negocio" },
  ];

  return (
    <div className="marca min-h-svh bg-marfil font-texto text-tinta" style={estiloMarca(apariencia)}>
      <header className="sticky top-0 z-40 border-b border-marfil/10 bg-lapis-noche text-marfil">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-8">
          <h1 className="font-titulo text-2xl font-semibold tracking-[0.18em] text-oro">AGL</h1>
          <span className="text-sm text-marfil/60">{negocio.nombre}</span>
          <Link href="/" target="_blank" className="text-sm text-marfil/60 underline-offset-4 hover:text-marfil hover:underline">
            Ver sitio
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm text-marfil/60" aria-live="polite">
              {estado?.tipo === "guardando" ? estado.texto : sucio ? "Hay cambios sin guardar" : "Todo guardado"}
            </span>
            <button
              type="button"
              onClick={descargar}
              className="h-10 cursor-pointer rounded-[10px] border border-marfil/20 px-4 text-sm text-marfil hover:bg-marfil/5"
            >
              Descargar copia
            </button>
            <Boton variante="principal" onClick={guardar} disabled={!sucio || estado?.tipo === "guardando"}>
              Guardar cambios
            </Boton>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-2 md:px-6" aria-label="Partes del panel">
          {pestañas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPestaña(p.id)}
              className={`relative shrink-0 cursor-pointer px-3 py-3 text-sm transition-colors ${
                pestaña === p.id ? "text-marfil" : "text-marfil/55 hover:text-marfil"
              }`}
            >
              {p.nombre}
              {pestaña === p.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-oro" />}
            </button>
          ))}
        </nav>
      </header>

      {estado && estado.tipo !== "guardando" && (
        <p
          role="status"
          className={`px-4 py-3 text-sm md:px-8 ${estado.tipo === "ok" ? "bg-oro-claro text-tinta" : "bg-carmesi text-marfil"}`}
        >
          <span className="mx-auto block max-w-[1280px]">{estado.texto}</span>
        </p>
      )}
      {modo === "libre" && (
        <p className="bg-lapis-hondo px-4 py-2 text-sm text-marfil/80 md:px-8">
          <span className="mx-auto block max-w-[1280px]">
            Modo local sin contraseña. Antes de publicar el sitio, configurá ADMIN_PASSWORD
          </span>
        </p>
      )}

      <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-8">
        {pestaña === "productos" && (
          <section>
            <Titulo texto="Cambiá el precio y tocá Guardar cambios. Para poner un producto en oferta, escribí el precio de antes.">
              Productos y precios
            </Titulo>

            <Tarjeta className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
              <Campo etiqueta="Pasillo">
                <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className={claseCampo}>
                  <option value="todas">Todos</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Buscar">
                <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={claseCampo} />
              </Campo>
              <div className="flex items-end gap-2">
                <Campo etiqueta={`Cambiar precios de ${visibles.length} productos (%)`} className="w-56">
                  <input
                    inputMode="decimal"
                    placeholder="Ej: 10 o -5"
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                    className={claseCampo}
                  />
                </Campo>
                <Boton variante="oscuro" onClick={ajustarPrecios} disabled={!porcentaje}>
                  Aplicar
                </Boton>
              </div>
              <Boton onClick={agregarProducto}>Agregar producto</Boton>
            </Tarjeta>

            <ul className="mt-4 flex flex-col gap-3">
              {visibles.map(({ uid, p }) => {
                const off = descuento(p);
                const conContenido = p.envase === "frasco" || p.envase === "botella";
                return (
                  <li key={uid}>
                    <Tarjeta className="grid gap-4 md:grid-cols-[132px_1fr]">
                      <div className="flex flex-row items-center gap-3 md:flex-col md:items-stretch">
                        <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_30%,var(--color-papel),var(--color-crema))] md:size-[132px]">
                          {p.imagen ? (
                            // eslint-disable-next-line @next/next/no-img-element -- foto subida por el negocio
                            <img src={urlMedio("imagenes", p.imagen)} alt="" className="h-full w-full object-contain p-2" />
                          ) : (
                            <span className="px-2 text-center text-xs text-tinta-3">Sin foto: se dibuja en 3D</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <SubirFoto
                            texto={p.imagen ? "Cambiar foto" : "Subir foto"}
                            ocupado={subiendo === uid}
                            onElegir={(archivo) =>
                              void subir("imagenes", archivo, p.nombre || "producto", uid, (imagen) => cambiarProducto(uid, { imagen }))
                            }
                          />
                          {p.imagen && (
                            <button
                              type="button"
                              onClick={() => cambiarProducto(uid, { imagen: "" })}
                              className="cursor-pointer text-xs text-tinta-3 underline-offset-4 hover:text-carmesi hover:underline"
                            >
                              Quitar foto
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1.3fr_1fr_1fr]">
                        <Campo etiqueta="Nombre">
                          <input value={p.nombre} onChange={(e) => cambiarProducto(uid, { nombre: e.target.value })} className={claseCampo} />
                        </Campo>
                        <Campo etiqueta="Presentación">
                          <input
                            value={p.presentacion}
                            placeholder="Ej: 1 kg"
                            onChange={(e) => cambiarProducto(uid, { presentacion: e.target.value })}
                            className={claseCampo}
                          />
                        </Campo>
                        <Campo etiqueta="Pasillo">
                          <select value={p.categoria} onChange={(e) => cambiarProducto(uid, { categoria: e.target.value })} className={claseCampo}>
                            {categorias.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                        </Campo>
                        <Campo etiqueta="Precio">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={Number.isFinite(p.precio) ? p.precio : ""}
                            onChange={(e) => cambiarProducto(uid, { precio: e.target.value === "" ? 0 : Number(e.target.value) })}
                            className={`${claseCampo} border-oro bg-oro-claro font-medium tabular-nums`}
                          />
                        </Campo>
                        <Campo etiqueta="Precio antes (oferta)">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="Sin oferta"
                            value={p.precioAnterior ?? ""}
                            onChange={(e) =>
                              cambiarProducto(uid, { precioAnterior: e.target.value === "" ? null : Number(e.target.value) })
                            }
                            className={`${claseCampo} tabular-nums`}
                          />
                        </Campo>
                      </div>

                      <Campo etiqueta="Descripción (opcional: variedades, marcas incluidas…)" className="mt-3">
                        <input
                          value={p.descripcion}
                          onChange={(e) => cambiarProducto(uid, { descripcion: e.target.value })}
                          className={claseCampo}
                        />
                      </Campo>

                      <div className="mt-3 rounded-xl border border-tinta/8 bg-marfil/60 p-3">
                        <p className="text-xs text-tinta-2">Precios por cantidad (por ejemplo, llevando 2 a $2.690)</p>
                        <div className="mt-2 flex flex-wrap items-end gap-3">
                          {p.promos.map((promo: Promo, j: number) => (
                            <div key={j} className="flex items-end gap-2">
                              <Campo etiqueta="Llevando" className="w-20">
                                <input
                                  type="number"
                                  min={2}
                                  max={99}
                                  value={promo.cantidad}
                                  onChange={(e) =>
                                    cambiarProducto(uid, {
                                      promos: p.promos.map((x, k) => (k === j ? { ...x, cantidad: Number(e.target.value) } : x)),
                                    })
                                  }
                                  className={`${claseCampo} tabular-nums`}
                                />
                              </Campo>
                              <Campo etiqueta="Precio total" className="w-32">
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={promo.precio}
                                  onChange={(e) =>
                                    cambiarProducto(uid, {
                                      promos: p.promos.map((x, k) => (k === j ? { ...x, precio: Number(e.target.value) } : x)),
                                    })
                                  }
                                  className={`${claseCampo} border-oro bg-oro-claro font-medium tabular-nums`}
                                />
                              </Campo>
                              <button
                                type="button"
                                onClick={() => cambiarProducto(uid, { promos: p.promos.filter((_, k) => k !== j) })}
                                className="h-10 cursor-pointer px-2 text-sm text-tinta-3 hover:text-carmesi"
                                aria-label="Quitar este precio por cantidad"
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                          {p.promos.length < 5 && (
                            <Boton
                              onClick={() => {
                                const siguiente = Math.max(1, ...p.promos.map((x) => x.cantidad)) + 1;
                                cambiarProducto(uid, {
                                  promos: [...p.promos, { cantidad: siguiente, precio: Math.round(p.precio * siguiente * 0.95) }],
                                });
                              }}
                            >
                              Agregar precio por cantidad
                            </Boton>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
                        <label className="flex h-10 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={p.enOferta}
                            onChange={(e) => cambiarProducto(uid, { enOferta: e.target.checked })}
                            className="size-4 accent-[var(--sb-principal)]"
                          />
                          Mostrar en Ofertas
                        </label>
                        <label className="flex h-10 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={p.disponible}
                            onChange={(e) => cambiarProducto(uid, { disponible: e.target.checked })}
                            className="size-4 accent-[var(--sb-principal)]"
                          />
                          Hay stock
                        </label>
                        <label className="flex h-10 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={p.destacado}
                            onChange={(e) => cambiarProducto(uid, { destacado: e.target.checked })}
                            className="size-4 accent-[var(--sb-principal)]"
                          />
                          En la portada
                        </label>
                        <Campo etiqueta="Envase 3D" className="w-48">
                          <select
                            value={p.envase}
                            onChange={(e) => cambiarProducto(uid, { envase: e.target.value as Producto["envase"] })}
                            className={claseCampo}
                          >
                            {ENVASES.map((env) => (
                              <option key={env} value={env}>
                                {NOMBRES_ENVASE[env]}
                              </option>
                            ))}
                          </select>
                        </Campo>
                        <SelectorColor etiqueta="Color" valor={p.color} onChange={(v) => cambiarProducto(uid, { color: v })} />
                        <SelectorColor
                          etiqueta="Detalles"
                          valor={p.colorSecundario}
                          onChange={(v) => cambiarProducto(uid, { colorSecundario: v })}
                        />
                        {conContenido && (
                          <SelectorColor
                            etiqueta="Contenido"
                            valor={p.contenido || "#D6ECFF"}
                            onChange={(v) => cambiarProducto(uid, { contenido: v })}
                          />
                        )}
                        <Campo etiqueta="Modelo 3D propio (opcional)" className="w-60">
                          <input
                            value={p.modelo}
                            placeholder="/modelos/archivo.glb"
                            onChange={(e) => cambiarProducto(uid, { modelo: e.target.value })}
                            className={claseCampo}
                          />
                        </Campo>
                        <div className="ml-auto flex items-center gap-3">
                          <span className="text-sm tabular-nums">
                            {precio(p.precio || 0)}
                            {off > 0 && <span className="ml-2 rounded-md bg-carmesi px-1.5 py-0.5 text-xs text-marfil">−{off}%</span>}
                          </span>
                          <Boton
                            variante="peligro"
                            onClick={() => {
                              // Doble toque para confirmar (sin ventanas emergentes)
                              if (confirmar !== uid) {
                                setConfirmar(uid);
                                return;
                              }
                              setConfirmar(null);
                              setFilas((fs) => fs.filter((f) => f.uid !== uid));
                              marcar();
                            }}
                          >
                            {confirmar === uid ? "Tocá de nuevo para eliminar" : "Eliminar"}
                          </Boton>
                        </div>
                      </div>
                      </div>
                    </Tarjeta>
                  </li>
                );
              })}
            </ul>
            {visibles.length === 0 && <p className="mt-6 text-tinta-2">No hay productos con ese filtro</p>}
          </section>
        )}

        {pestaña === "afiches" && (
          <section>
            <Titulo texto="Los afiches de promociones que hacés para redes. Se muestran en la página y se pueden ampliar con un toque.">
              Afiches
            </Titulo>
            <div className="mb-4">
              <SubirFoto
                texto="Subir afiche"
                ocupado={subiendo === "afiche"}
                onElegir={(archivo) =>
                  void subir("afiches", archivo, archivo.name.replace(/\.[a-z]+$/i, "") || "afiche", "afiche", (imagen) =>
                    setAfiches((as) => [{ imagen, titulo: "" }, ...as]),
                  )
                }
              />
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {afiches.map((a, i) => (
                <li key={a.imagen}>
                  <Tarjeta className="flex h-full flex-col gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- afiche subido por el negocio */}
                    <img src={urlMedio("afiches", a.imagen)} alt="" className="aspect-[2/3] w-full rounded-lg object-cover" />
                    <Campo etiqueta="Título (opcional)">
                      <input
                        value={a.titulo}
                        onChange={(e) => {
                          setAfiches((as) => as.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)));
                          marcar();
                        }}
                        className={claseCampo}
                      />
                    </Campo>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Boton
                        disabled={i === 0}
                        onClick={() => {
                          setAfiches((as) => {
                            const n = [...as];
                            [n[i - 1], n[i]] = [n[i], n[i - 1]];
                            return n;
                          });
                          marcar();
                        }}
                      >
                        Antes
                      </Boton>
                      <Boton
                        disabled={i === afiches.length - 1}
                        onClick={() => {
                          setAfiches((as) => {
                            const n = [...as];
                            [n[i + 1], n[i]] = [n[i], n[i + 1]];
                            return n;
                          });
                          marcar();
                        }}
                      >
                        Después
                      </Boton>
                      <Boton
                        variante="peligro"
                        onClick={() => {
                          if (confirmar !== a.imagen) {
                            setConfirmar(a.imagen);
                            return;
                          }
                          setConfirmar(null);
                          setAfiches((as) => as.filter((_, j) => j !== i));
                          marcar();
                        }}
                      >
                        {confirmar === a.imagen ? "Tocá de nuevo" : "Quitar"}
                      </Boton>
                    </div>
                  </Tarjeta>
                </li>
              ))}
            </ul>
            {afiches.length === 0 && <p className="text-tinta-2">Todavía no hay afiches</p>}
          </section>
        )}

        {pestaña === "pasillos" && (
          <section>
            <Titulo texto="Cada pasillo agrupa productos y toma uno de los tres colores de la marca.">Pasillos</Titulo>
            <ul className="grid gap-3 md:grid-cols-2">
              {categorias.map((c, i) => {
                const enUso = filas.filter((f) => f.p.categoria === c.id).length;
                return (
                  <li key={c.id}>
                    <Tarjeta className="flex flex-wrap items-end gap-3">
                      <Campo etiqueta="Nombre" className="min-w-40 flex-1">
                        <input
                          value={c.nombre}
                          onChange={(e) => {
                            setCategorias((cs) => cs.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)));
                            marcar();
                          }}
                          className={claseCampo}
                        />
                      </Campo>
                      <Campo etiqueta="Color" className="w-44">
                        <select
                          value={c.color}
                          onChange={(e) => {
                            setCategorias((cs) =>
                              cs.map((x, j) => (j === i ? { ...x, color: e.target.value as Categoria["color"] } : x)),
                            );
                            marcar();
                          }}
                          className={claseCampo}
                        >
                          {COLORES_CATEGORIA.map((col) => (
                            <option key={col} value={col}>
                              {NOMBRES_COLOR[col]}
                            </option>
                          ))}
                        </select>
                      </Campo>
                      <Boton
                        variante="peligro"
                        disabled={enUso > 0 || categorias.length === 1}
                        onClick={() => {
                          setCategorias((cs) => cs.filter((_, j) => j !== i));
                          marcar();
                        }}
                      >
                        {enUso > 0 ? `${enUso} productos` : "Eliminar"}
                      </Boton>
                    </Tarjeta>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4">
              <Boton
                variante="oscuro"
                onClick={() => {
                  const base = `pasillo-${categorias.length + 1}`;
                  let id = base;
                  for (let n = 2; categorias.some((c) => c.id === id); n++) id = `${base}-${n}`;
                  setCategorias((cs) => [...cs, { id, nombre: "Pasillo nuevo", color: "principal" }]);
                  marcar();
                }}
              >
                Agregar pasillo
              </Boton>
            </div>
          </section>
        )}

        {pestaña === "textos" && (
          <section className="flex flex-col gap-4">
            <Titulo texto="Todos los textos del sitio. Los que quedan vacíos no se muestran.">Textos y secciones</Titulo>

            <Tarjeta>
              <h3 className="mb-4 font-medium">Secciones visibles</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {(
                  [
                    ["pasillos", "Pasillos"],
                    ["ofertas", "Ofertas"],
                    ["afiches", "Afiches"],
                    ["comoComprar", "Cómo comprar"],
                  ] as [keyof Secciones, string][]
                ).map(([campo, nombre]) => (
                  <label key={campo} className="flex h-10 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={secciones[campo]}
                      onChange={(e) => {
                        setSecciones((s) => ({ ...s, [campo]: e.target.checked }));
                        marcar();
                      }}
                      className="size-4 accent-[var(--sb-principal)]"
                    />
                    {nombre}
                  </label>
                ))}
              </div>
            </Tarjeta>

            <Tarjeta className="grid gap-3 md:grid-cols-2">
              <h3 className="font-medium md:col-span-2">Portada</h3>
              <Campo etiqueta="Texto de la portada" className="md:col-span-2">
                <textarea
                  rows={2}
                  value={textos.portadaTexto}
                  onChange={(e) => cambiarTexto("portadaTexto", e.target.value)}
                  className={`${claseCampo} h-auto py-2`}
                />
              </Campo>
              <Campo etiqueta="Botón de productos">
                <input value={textos.botonProductos} onChange={(e) => cambiarTexto("botonProductos", e.target.value)} className={claseCampo} />
              </Campo>
              <Campo etiqueta="Botón de ofertas">
                <input value={textos.botonOfertas} onChange={(e) => cambiarTexto("botonOfertas", e.target.value)} className={claseCampo} />
              </Campo>
            </Tarjeta>

            <Tarjeta className="grid gap-3 md:grid-cols-2">
              <h3 className="font-medium md:col-span-2">Títulos de las secciones</h3>
              {(
                [
                  ["productosTitulo", "productosTexto", "Productos"],
                  ["pasillosTitulo", "pasillosTexto", "Pasillos"],
                  ["ofertasTitulo", "ofertasTexto", "Ofertas"],
                  ["afichesTitulo", "afichesTexto", "Afiches"],
                ] as const
              ).map(([titulo, texto, nombre]) => (
                <div key={titulo} className="contents">
                  <Campo etiqueta={`Título de ${nombre}`}>
                    <input value={textos[titulo]} onChange={(e) => cambiarTexto(titulo, e.target.value)} className={claseCampo} />
                  </Campo>
                  <Campo etiqueta={`Texto de ${nombre}`}>
                    <input value={textos[texto]} onChange={(e) => cambiarTexto(texto, e.target.value)} className={claseCampo} />
                  </Campo>
                </div>
              ))}
              <Campo etiqueta="Título de Cómo comprar">
                <input value={textos.comoComprarTitulo} onChange={(e) => cambiarTexto("comoComprarTitulo", e.target.value)} className={claseCampo} />
              </Campo>
              <Campo etiqueta="Texto del pie de página">
                <input value={textos.pieTexto} onChange={(e) => cambiarTexto("pieTexto", e.target.value)} className={claseCampo} />
              </Campo>
            </Tarjeta>

            <Tarjeta>
              <h3 className="mb-4 font-medium">Pasos de Cómo comprar</h3>
              <ol className="flex flex-col gap-3">
                {textos.pasos.map((paso, i) => (
                  <li key={i} className="grid items-end gap-3 md:grid-cols-[2rem_1fr_2fr_auto]">
                    <span className="font-titulo text-2xl text-oro-tinta tabular-nums">{i + 1}</span>
                    <Campo etiqueta="Título">
                      <input
                        value={paso.titulo}
                        onChange={(e) =>
                          cambiarTexto(
                            "pasos",
                            textos.pasos.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)),
                          )
                        }
                        className={claseCampo}
                      />
                    </Campo>
                    <Campo etiqueta="Texto">
                      <input
                        value={paso.texto}
                        onChange={(e) =>
                          cambiarTexto(
                            "pasos",
                            textos.pasos.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)),
                          )
                        }
                        className={claseCampo}
                      />
                    </Campo>
                    <Boton
                      variante="peligro"
                      onClick={() => cambiarTexto("pasos", textos.pasos.filter((_, j) => j !== i))}
                    >
                      Quitar
                    </Boton>
                  </li>
                ))}
              </ol>
              <div className="mt-4">
                <Boton
                  disabled={textos.pasos.length >= 6}
                  onClick={() => cambiarTexto("pasos", [...textos.pasos, { titulo: "Paso nuevo", texto: "" }])}
                >
                  Agregar paso
                </Boton>
              </div>
            </Tarjeta>
          </section>
        )}

        {pestaña === "apariencia" && (
          <section className="flex flex-col gap-4">
            <Titulo texto="Los colores y las fuentes se aplican a todo el sitio, incluidas las etiquetas de los productos 3D.">
              Colores y fuentes
            </Titulo>
            <Tarjeta className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["colorPrincipal", "Principal (portada, encabezado y pie)"],
                  ["colorAcento", "Acento (botones y precios)"],
                  ["colorDestacado", "Destacado (ofertas)"],
                  ["colorFondo", "Fondo de las secciones claras"],
                ] as [keyof Apariencia, string][]
              ).map(([campo, nombre]) => (
                <SelectorColor
                  key={campo}
                  etiqueta={nombre}
                  valor={apariencia[campo]}
                  onChange={(v) => {
                    setApariencia((a) => ({ ...a, [campo]: v }));
                    marcar();
                  }}
                />
              ))}
              <div className="sm:col-span-2 lg:col-span-4">
                <Boton
                  onClick={() => {
                    setApariencia((a) => ({
                      ...a,
                      colorPrincipal: APARIENCIA_INICIAL.colorPrincipal,
                      colorAcento: APARIENCIA_INICIAL.colorAcento,
                      colorDestacado: APARIENCIA_INICIAL.colorDestacado,
                      colorFondo: APARIENCIA_INICIAL.colorFondo,
                    }));
                    marcar();
                  }}
                >
                  Volver a lapislázuli, dorado y carmesí
                </Boton>
              </div>
            </Tarjeta>

            <Tarjeta className="grid gap-4 md:grid-cols-2">
              <Campo etiqueta="Fuente de los títulos">
                <select
                  value={apariencia.fuenteTitulos}
                  onChange={(e) => {
                    setApariencia((a) => ({ ...a, fuenteTitulos: e.target.value }));
                    marcar();
                  }}
                  className={claseCampo}
                >
                  {FUENTES_TITULOS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Fuente del texto">
                <select
                  value={apariencia.fuenteTexto}
                  onChange={(e) => {
                    setApariencia((a) => ({ ...a, fuenteTexto: e.target.value }));
                    marcar();
                  }}
                  className={claseCampo}
                >
                  {FUENTES_TEXTO.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
              <div className="grano relative overflow-hidden rounded-xl bg-lapis-hondo p-6 text-marfil md:col-span-2">
                <p className="text-[56px] leading-none tracking-[-0.03em]" style={{ fontFamily: familiaTitulos(apariencia.fuenteTitulos) }}>
                  {negocio.nombre}
                </p>
                <p className="mt-2 text-2xl text-oro" style={{ fontFamily: familiaTitulos(apariencia.fuenteTitulos) }}>
                  {negocio.eslogan}
                </p>
                <p className="mt-4 max-w-lg text-marfil/75" style={{ fontFamily: familiaTexto(apariencia.fuenteTexto) }}>
                  {textos.portadaTexto || "Así se ve el texto del sitio"}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-[10px] bg-oro px-4 py-2.5 text-sm font-medium text-tinta">{textos.botonProductos}</span>
                  <span className="rounded-md bg-carmesi px-2 py-1 text-xs text-marfil">−15%</span>
                </div>
              </div>
            </Tarjeta>
          </section>
        )}

        {pestaña === "negocio" && (
          <section>
            <Titulo texto="Esto aparece al final de la página. Los campos vacíos no se muestran. Con el WhatsApp cargado, el ticket se envía como pedido.">
              Datos del negocio
            </Titulo>
            <div className="flex flex-col gap-4">
              <Tarjeta>
                <h3 className="mb-3 font-medium">Ubicación</h3>
                <ul className="flex flex-col gap-3">
                  {negocio.sucursales.map((suc: Sucursal, i: number) => (
                    <li key={i} className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <Campo etiqueta="Dirección">
                        <input
                          value={suc.direccion}
                          onChange={(e) => {
                            setNegocio((n) => ({
                              ...n,
                              sucursales: n.sucursales.map((x, j) => (j === i ? { ...x, direccion: e.target.value } : x)),
                            }));
                            marcar();
                          }}
                          className={claseCampo}
                        />
                      </Campo>
                      <Campo etiqueta="Localidad">
                        <input
                          value={suc.nombre}
                          onChange={(e) => {
                            setNegocio((n) => ({
                              ...n,
                              sucursales: n.sucursales.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)),
                            }));
                            marcar();
                          }}
                          className={claseCampo}
                        />
                      </Campo>
                      <Boton
                        variante="peligro"
                        onClick={() => {
                          setNegocio((n) => ({ ...n, sucursales: n.sucursales.filter((_, j) => j !== i) }));
                          marcar();
                        }}
                      >
                        Quitar
                      </Boton>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <Boton
                    onClick={() => {
                      setNegocio((n) => ({ ...n, sucursales: [...n.sucursales, { nombre: "", direccion: "Dirección nueva" }] }));
                      marcar();
                    }}
                  >
                    Agregar sucursal
                  </Boton>
                  <Campo etiqueta="Provincia (para el mapa)" className="w-56">
                    <input
                      value={negocio.provincia}
                      onChange={(e) => {
                        setNegocio((n) => ({ ...n, provincia: e.target.value }));
                        marcar();
                      }}
                      className={claseCampo}
                    />
                  </Campo>
                </div>
              </Tarjeta>
              <Tarjeta className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    ["telefono", "Teléfono"],
                    ["whatsapp", "WhatsApp (con código de país, ej: 5492634123456)"],
                    ["horarios", "Horarios"],
                    ["instagram", "Instagram (usuario, sin @)"],
                    ["facebook", "Facebook (dirección de la página)"],
                    ["tiktok", "TikTok (usuario, sin @)"],
                    ["nombre", "Nombre del negocio"],
                    ["eslogan", "Eslogan"],
                    ["moneda", "Moneda (ej: ARS)"],
                    ["locale", "Formato regional (ej: es-AR)"],
                  ] as [Exclude<keyof Negocio, "sucursales">, string][]
                ).map(([campo, etiqueta]) => (
                  <Campo key={campo} etiqueta={etiqueta}>
                    <input
                      value={negocio[campo]}
                      onChange={(e) => {
                        setNegocio((n) => ({ ...n, [campo]: e.target.value }));
                        marcar();
                      }}
                      className={claseCampo}
                    />
                  </Campo>
                ))}
              </Tarjeta>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
