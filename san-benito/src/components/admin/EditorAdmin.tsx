"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { guardarTienda, verificarClave } from "@/app/admin/acciones";
import { descuento, formatearPrecio } from "@/lib/formato";
import {
  COLORES_CATEGORIA,
  ENVASES,
  NOMBRES_ENVASE,
  type Categoria,
  type Negocio,
  type Producto,
  type Tienda,
} from "@/lib/tipos";

export type ModoAcceso = "libre" | "clave" | "sin-configurar";

type Fila = { uid: string; p: Producto };

let contador = 0;
const nuevoUid = () => `f${(contador++).toString(36)}`;

const NOMBRE_COLOR: Record<Categoria["color"], string> = { rojo: "Rojo", amarillo: "Amarillo", azul: "Azul" };

/* ---------- Piezas de formulario ---------- */

const claseCampo =
  "h-10 w-full border-2 border-negro bg-blanco px-2 font-mono text-sm font-bold text-negro disabled:opacity-50";

function Campo({ etiqueta, children, className = "" }: { etiqueta: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="font-display text-[11px] uppercase">{etiqueta}</span>
      {children}
    </label>
  );
}

function Boton({
  children,
  onClick,
  variante = "blanco",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "blanco" | "amarillo" | "negro" | "rojo";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const colores = {
    blanco: "bg-blanco text-negro hover:bg-amarillo",
    amarillo: "bg-amarillo text-negro hover:bg-blanco",
    negro: "bg-negro text-amarillo hover:bg-azul hover:text-blanco",
    rojo: "bg-rojo text-negro hover:bg-negro hover:text-rojo",
  }[variante];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer border-4 border-negro px-4 py-2 font-display text-sm uppercase shadow-duro-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${colores}`}
    >
      {children}
    </button>
  );
}

/* ---------- Acceso ---------- */

function Acceso({ onEntrar }: { onEntrar: (clave: string) => void }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  return (
    <main className="flex min-h-svh items-center justify-center bg-rojo p-4">
      <form
        className="flex w-full max-w-sm flex-col gap-4 border-4 border-negro bg-blanco p-6 shadow-duro"
        onSubmit={async (e) => {
          e.preventDefault();
          setCargando(true);
          setError("");
          const ok = await verificarClave(clave);
          setCargando(false);
          if (ok) onEntrar(clave);
          else setError("La contraseña no es correcta.");
        }}
      >
        <h1 className="font-display text-3xl leading-none uppercase">Administrar precios</h1>
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
        {error && <p className="border-2 border-negro bg-amarillo p-2 font-mono text-sm font-bold">{error}</p>}
        <Boton type="submit" variante="negro" disabled={cargando || !clave}>
          {cargando ? "Entrando…" : "Entrar"}
        </Boton>
        <Link href="/" className="font-mono text-sm underline">
          Volver al sitio
        </Link>
      </form>
    </main>
  );
}

/* ---------- Editor ---------- */

export default function EditorAdmin({ inicial, modo }: { inicial: Tienda; modo: ModoAcceso }) {
  const [clave, setClave] = useState<string | null>(modo === "libre" ? "" : null);
  const [negocio, setNegocio] = useState<Negocio>(inicial.negocio);
  const [categorias, setCategorias] = useState<Categoria[]>(inicial.categorias);
  const [filas, setFilas] = useState<Fila[]>(() => inicial.productos.map((p) => ({ uid: nuevoUid(), p })));
  const [sucio, setSucio] = useState(false);
  const [estado, setEstado] = useState<{ tipo: "ok" | "error" | "guardando"; texto: string } | null>(null);
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
      <main className="flex min-h-svh items-center justify-center bg-rojo p-4">
        <div className="max-w-lg border-4 border-negro bg-blanco p-6 shadow-duro">
          <h1 className="font-display text-3xl leading-none uppercase">Falta la contraseña</h1>
          <p className="mt-4 font-mono text-base">
            Para editar precios en el sitio publicado, configurá la variable de entorno{" "}
            <code className="bg-amarillo px-1 font-bold">ADMIN_PASSWORD</code> en el servidor y reinicialo.
          </p>
        </div>
      </main>
    );
  }

  if (clave === null) {
    return (
      <Acceso onEntrar={setClave} />
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

  const agregarProducto = () => {
    const categoria = filtro !== "todas" ? filtro : categorias[0]?.id ?? "";
    const p: Producto = {
      id: "",
      nombre: "Producto nuevo",
      categoria,
      presentacion: "",
      precio: 0,
      precioAnterior: null,
      disponible: true,
      destacado: false,
      envase: "caja",
      color: "#FFFF00",
      colorSecundario: "#FF0000",
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

  const datos = (): Tienda => ({ negocio, categorias, productos: filas.map((f) => f.p) });

  const guardar = async () => {
    setEstado({ tipo: "guardando", texto: "Guardando…" });
    const r = await guardarTienda(clave, datos());
    if (r.ok) {
      setSucio(false);
      setEstado({ tipo: "ok", texto: "Cambios guardados. El sitio ya muestra los precios nuevos." });
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

  return (
    <div className="min-h-svh bg-blanco text-negro">
      <header className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b-4 border-negro bg-negro px-3 py-3 text-blanco md:px-6">
        <h1 className="font-display text-xl text-amarillo uppercase md:text-2xl">{negocio.nombre} · Administrar</h1>
        <Link href="/" target="_blank" className="font-mono text-sm underline">
          Ver sitio
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm" aria-live="polite">
            {estado?.tipo === "guardando" ? estado.texto : sucio ? "Hay cambios sin guardar" : "Todo guardado"}
          </span>
          <Boton onClick={descargar}>Descargar copia</Boton>
          <Boton variante="amarillo" onClick={guardar} disabled={!sucio || estado?.tipo === "guardando"}>
            Guardar cambios
          </Boton>
        </div>
      </header>

      {estado && estado.tipo !== "guardando" && (
        <p
          role="status"
          className={`border-b-4 border-negro px-3 py-3 font-mono text-sm font-bold md:px-6 ${
            estado.tipo === "ok" ? "bg-amarillo" : "bg-rojo text-blanco"
          }`}
        >
          {estado.texto}
        </p>
      )}
      {modo === "libre" && (
        <p className="border-b-4 border-negro bg-azul px-3 py-2 font-mono text-sm text-blanco md:px-6">
          Modo local sin contraseña. Antes de publicar el sitio, configurá ADMIN_PASSWORD.
        </p>
      )}

      {/* Productos */}
      <section className="px-3 py-8 md:px-6">
        <h2 className="font-display text-4xl uppercase md:text-6xl">Productos y precios</h2>

        <div className="mt-6 grid gap-3 border-4 border-negro bg-amarillo p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
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
            <Boton variante="negro" onClick={ajustarPrecios} disabled={!porcentaje}>
              Aplicar
            </Boton>
          </div>
          <Boton variante="blanco" onClick={agregarProducto}>
            Agregar producto
          </Boton>
        </div>

        <ul className="mt-6 flex flex-col gap-4">
          {visibles.map(({ uid, p }) => {
            const off = descuento(p);
            const conContenido = p.envase === "frasco" || p.envase === "botella";
            return (
              <li key={uid} className="border-4 border-negro bg-blanco p-3 shadow-duro-sm">
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
                      className={`${claseCampo} bg-amarillo text-base`}
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
                      className={claseCampo}
                    />
                  </Campo>
                </div>

                <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
                  <label className="flex h-10 items-center gap-2 font-mono text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={p.disponible}
                      onChange={(e) => cambiarProducto(uid, { disponible: e.target.checked })}
                      className="size-5 accent-negro"
                    />
                    Hay stock
                  </label>
                  <label className="flex h-10 items-center gap-2 font-mono text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={p.destacado}
                      onChange={(e) => cambiarProducto(uid, { destacado: e.target.checked })}
                      className="size-5 accent-negro"
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
                  <Campo etiqueta="Color" className="w-20">
                    <input
                      type="color"
                      value={p.color}
                      onChange={(e) => cambiarProducto(uid, { color: e.target.value.toUpperCase() })}
                      className="h-10 w-full cursor-pointer border-2 border-negro bg-blanco"
                    />
                  </Campo>
                  <Campo etiqueta="Detalles" className="w-20">
                    <input
                      type="color"
                      value={p.colorSecundario}
                      onChange={(e) => cambiarProducto(uid, { colorSecundario: e.target.value.toUpperCase() })}
                      className="h-10 w-full cursor-pointer border-2 border-negro bg-blanco"
                    />
                  </Campo>
                  {conContenido && (
                    <Campo etiqueta="Contenido" className="w-20">
                      <input
                        type="color"
                        value={p.contenido || "#D6ECFF"}
                        onChange={(e) => cambiarProducto(uid, { contenido: e.target.value.toUpperCase() })}
                        className="h-10 w-full cursor-pointer border-2 border-negro bg-blanco"
                      />
                    </Campo>
                  )}
                  <Campo etiqueta="Modelo 3D propio (opcional)" className="w-64">
                    <input
                      value={p.modelo}
                      placeholder="/modelos/archivo.glb"
                      onChange={(e) => cambiarProducto(uid, { modelo: e.target.value })}
                      className={claseCampo}
                    />
                  </Campo>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="font-mono text-sm font-bold">
                      {precio(p.precio || 0)}
                      {off > 0 && <span className="ml-2 border-2 border-negro bg-rojo px-1 text-blanco">-{off}%</span>}
                    </span>
                    <Boton
                      variante="rojo"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${p.nombre}"?`)) {
                          setFilas((fs) => fs.filter((f) => f.uid !== uid));
                          marcar();
                        }
                      }}
                    >
                      Eliminar
                    </Boton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {visibles.length === 0 && <p className="mt-6 font-mono font-bold">No hay productos con ese filtro.</p>}
      </section>

      {/* Categorías */}
      <section className="border-t-4 border-negro bg-azul px-3 py-8 text-blanco md:px-6">
        <h2 className="font-display text-4xl text-amarillo uppercase md:text-6xl">Pasillos</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categorias.map((c, i) => {
            const enUso = filas.filter((f) => f.p.categoria === c.id).length;
            return (
              <li key={c.id} className="flex flex-wrap items-end gap-3 border-4 border-negro bg-blanco p-3 text-negro">
                <Campo etiqueta="Nombre" className="flex-1">
                  <input
                    value={c.nombre}
                    onChange={(e) => {
                      setCategorias((cs) => cs.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)));
                      marcar();
                    }}
                    className={claseCampo}
                  />
                </Campo>
                <Campo etiqueta="Color" className="w-32">
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
                        {NOMBRE_COLOR[col]}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Boton
                  variante="rojo"
                  disabled={enUso > 0 || categorias.length === 1}
                  onClick={() => {
                    setCategorias((cs) => cs.filter((_, j) => j !== i));
                    marcar();
                  }}
                >
                  {enUso > 0 ? `${enUso} productos` : "Eliminar"}
                </Boton>
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <Boton
            variante="amarillo"
            onClick={() => {
              const base = `pasillo-${categorias.length + 1}`;
              let id = base;
              for (let n = 2; categorias.some((c) => c.id === id); n++) id = `${base}-${n}`;
              setCategorias((cs) => [...cs, { id, nombre: "Pasillo nuevo", color: "rojo" }]);
              marcar();
            }}
          >
            Agregar pasillo
          </Boton>
        </div>
      </section>

      {/* Negocio */}
      <section className="border-t-4 border-negro bg-amarillo px-3 py-8 md:px-6">
        <h2 className="font-display text-4xl uppercase md:text-6xl">Datos del negocio</h2>
        <p className="mt-2 max-w-2xl font-mono text-sm">
          Los campos vacíos no se muestran en el sitio. Con el WhatsApp cargado, el ticket se puede enviar como pedido.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["nombre", "Nombre"],
              ["eslogan", "Eslogan"],
              ["whatsapp", "WhatsApp (con código de país, ej: 5491112345678)"],
              ["instagram", "Instagram (sin @)"],
              ["direccion", "Dirección"],
              ["horarios", "Horarios"],
              ["moneda", "Moneda (ej: ARS)"],
              ["locale", "Formato regional (ej: es-AR)"],
            ] as [keyof Negocio, string][]
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
        </div>
      </section>
    </div>
  );
}
