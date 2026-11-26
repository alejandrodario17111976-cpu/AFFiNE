"use client";

import { startTransition, useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import { motion } from "motion/react";
import { scale, spring, useTempoTransition } from "@animate-ui/react/utils/motion";
import { dniConPuntos, whatsappDe } from "@/lib/clientes";
import { formatearPrecio } from "@/lib/formato";
import { sonar } from "@/lib/sonidos";
import type { ClienteRegistrado, EstadoPedido, Negocio, Pedido } from "@/lib/tipos";

export interface AccionesPedidos {
  verPedidos: (clave: string) => Promise<Pedido[] | null>;
  cambiarEstadoPedido: (clave: string, numero: string, estado: EstadoPedido) => Promise<Pedido | null>;
  verClientes: (clave: string) => Promise<ClienteRegistrado[] | null>;
}

const ETIQUETA: Record<EstadoPedido, string> = { pendiente: "Pendiente", listo: "Listo", entregado: "Entregado" };
const COLOR: Record<EstadoPedido, string> = {
  pendiente: "bg-oro-claro text-oro-tinta border-oro/50",
  listo: "bg-[#e3f3e8] text-[#1d6b3a] border-[#1d6b3a]/30",
  entregado: "bg-crema text-tinta-3 border-tinta/10",
};

function haceCuanto(iso: string, ahora: number) {
  const min = Math.round((ahora - new Date(iso).getTime()) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

/** Mensaje de WhatsApp para avisarle al cliente. */
function mensajeListo(p: Pedido, negocio: Negocio) {
  return `Hola ${p.cliente.nombre}, tu pedido N.º ${p.numero} de ${negocio.nombre} ya está listo. Podés pasar a retirarlo. ¡Gracias por elegirnos!`;
}

function enlaceAviso(p: Pedido, negocio: Negocio) {
  return `https://wa.me/${whatsappDe(p.cliente.telefono)}?text=${encodeURIComponent(mensajeListo(p, negocio))}`;
}

function TarjetaPedido({
  pedido,
  negocio,
  ahora,
  alCambiar,
}: {
  pedido: Pedido;
  negocio: Negocio;
  ahora: number;
  alCambiar: (numero: string, estado: EstadoPedido) => void;
}) {
  const presion = useTempoTransition(spring.press);
  const precio = (v: number) => formatearPrecio(v, negocio);
  const p = pedido;
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-tinta/8 bg-papel p-4 shadow-suave md:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-titulo text-2xl leading-none font-semibold tabular-nums">N.º {p.numero}</p>
          <p className="mt-1 text-sm text-tinta-3">
            {new Date(p.creado).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} · {haceCuanto(p.creado, ahora)}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${COLOR[p.estado]}`}>{ETIQUETA[p.estado]}</span>
      </header>

      <div className="rounded-xl bg-marfil p-3 text-sm">
        <p className="font-medium">
          {p.cliente.nombre} {p.cliente.apellido}
        </p>
        <p className="text-tinta-2 tabular-nums">DNI {dniConPuntos(p.cliente.dni)}</p>
        <a
          href={`https://wa.me/${whatsappDe(p.cliente.telefono)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lapis underline underline-offset-4 tabular-nums"
        >
          {p.cliente.telefono}
        </a>
      </div>

      <ul className="flex flex-col gap-1.5 text-sm">
        {p.lineas.map((l) => (
          <li key={l.id} className="flex justify-between gap-3">
            <span>
              <span className="font-medium tabular-nums">{l.cantidad} ×</span> {l.nombre}
              {l.presentacion && <span className="text-tinta-3"> · {l.presentacion}</span>}
            </span>
            <span className="shrink-0 tabular-nums">{precio(l.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-baseline justify-between border-t border-dashed border-tinta/15 pt-3">
        <span className="text-sm text-tinta-2">Total</span>
        <span className="font-titulo text-2xl font-semibold tabular-nums">{precio(p.total)}</span>
      </div>

      {p.estado === "pendiente" && (
        <motion.a
          href={enlaceAviso(p, negocio)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            sonar("listo");
            alCambiar(p.numero, "listo");
          }}
          whileTap={{ scale: scale.press, transition: presion }}
          className="boton-oro flex h-12 items-center justify-center rounded-[10px] text-base font-semibold text-tinta"
        >
          ¡Pedido Listo!
        </motion.a>
      )}
      {p.estado === "listo" && (
        <div className="grid grid-cols-2 gap-2">
          <a
            href={enlaceAviso(p, negocio)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center rounded-[10px] border border-tinta/15 text-sm font-medium hover:bg-crema"
          >
            Avisar de nuevo
          </a>
          <motion.button
            type="button"
            onClick={() => alCambiar(p.numero, "entregado")}
            whileTap={{ scale: scale.press, transition: presion }}
            className="h-11 cursor-pointer rounded-[10px] bg-lapis-hondo text-sm font-medium text-marfil hover:bg-lapis-medio"
          >
            Entregado
          </motion.button>
        </div>
      )}
      {p.estado === "entregado" && (
        <button
          type="button"
          onClick={() => alCambiar(p.numero, "pendiente")}
          className="cursor-pointer text-sm text-tinta-3 underline-offset-4 hover:text-tinta hover:underline"
        >
          Volver a pendiente
        </button>
      )}
    </article>
  );
}

type Filtro = EstadoPedido | "todos";

/** Registro de pedidos: llegan solos (se revisa cada 10 segundos) y suena una campanita con cada uno nuevo. */
export function PanelPedidos({ clave, acciones, negocio }: { clave: string; acciones: AccionesPedidos; negocio: Negocio }) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("pendiente");
  const [ahora, setAhora] = useState(() => Date.now());
  const conocidos = useRef<Set<string> | null>(null);

  const cargar = useCallback(async () => {
    const lista = await acciones.verPedidos(clave).catch(() => null);
    if (!lista) return;
    const previos = conocidos.current;
    const nuevos = previos ? lista.filter((p) => !previos.has(p.numero) && p.estado === "pendiente") : [];
    conocidos.current = new Set(lista.map((p) => p.numero));
    if (nuevos.length > 0) sonar("nuevo");
    // Con startTransition, los pedidos que llegan entran con su animación (ViewTransition)
    startTransition(() => {
      setPedidos(lista);
      setAhora(Date.now());
    });
  }, [acciones, clave]);

  useEffect(() => {
    const primera = window.setTimeout(() => void cargar(), 0);
    const intervalo = window.setInterval(() => void cargar(), 10000);
    return () => {
      window.clearTimeout(primera);
      window.clearInterval(intervalo);
    };
  }, [cargar]);

  const pendientes = pedidos?.filter((p) => p.estado === "pendiente").length ?? 0;
  useEffect(() => {
    const original = "AGL";
    document.title = pendientes > 0 ? `(${pendientes}) ${original}` : original;
    return () => {
      document.title = original;
    };
  }, [pendientes]);

  const cambiar = async (numero: string, estado: EstadoPedido) => {
    // Se ve el cambio al instante y después se confirma con el servidor
    startTransition(() => {
      setPedidos((ps) => ps?.map((p) => (p.numero === numero ? { ...p, estado } : p)) ?? ps);
    });
    await acciones.cambiarEstadoPedido(clave, numero, estado).catch(() => null);
    void cargar();
  };

  const visibles = (pedidos ?? []).filter((p) => filtro === "todos" || p.estado === filtro);
  const cuenta = (e: Filtro) => (pedidos ?? []).filter((p) => e === "todos" || p.estado === e).length;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-titulo text-3xl tracking-[-0.02em] md:text-4xl">Pedidos</h2>
          <p className="mt-1 text-sm text-tinta-3">Se actualiza solo cada 10 segundos</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-tinta/10 bg-papel p-1">
          {(["pendiente", "listo", "entregado", "todos"] as Filtro[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => startTransition(() => setFiltro(f))}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                filtro === f ? "bg-lapis-hondo text-marfil" : "text-tinta-2 hover:bg-crema"
              }`}
            >
              {f === "todos" ? "Todos" : `${ETIQUETA[f]}s`} <span className="tabular-nums opacity-70">{cuenta(f)}</span>
            </button>
          ))}
        </div>
      </div>

      {pedidos === null ? (
        <p className="text-tinta-2">Cargando pedidos…</p>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-tinta/15 p-10 text-center text-tinta-2">
          {filtro === "pendiente" ? "No hay pedidos pendientes" : "No hay pedidos en esta lista"}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p) => (
            <ViewTransition key={p.numero} enter="vt-entra" exit="vt-sale" update="vt-mueve" default="none">
              <li>
                <TarjetaPedido pedido={p} negocio={negocio} ahora={ahora} alCambiar={cambiar} />
              </li>
            </ViewTransition>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Clientes registrados (los que mandaron al menos un pedido). */
export function PanelClientes({ clave, acciones }: { clave: string; acciones: AccionesPedidos }) {
  const [clientes, setClientes] = useState<ClienteRegistrado[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  useEffect(() => {
    let vigente = true;
    void acciones.verClientes(clave).then((c) => {
      if (vigente) setClientes(c ?? []);
    });
    return () => {
      vigente = false;
    };
  }, [acciones, clave]);
  const q = busqueda.trim().toLowerCase();
  const visibles = (clientes ?? []).filter(
    (c) => !q || `${c.nombre} ${c.apellido} ${c.dni} ${c.telefono}`.toLowerCase().includes(q),
  );
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-titulo text-3xl tracking-[-0.02em] md:text-4xl">Clientes</h2>
          <p className="mt-1 text-sm text-tinta-3">{clientes ? `${clientes.length} registrados` : "Cargando…"}</p>
        </div>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, DNI o celular"
          className="h-10 w-full max-w-xs rounded-lg border border-tinta/15 bg-papel px-3 text-sm outline-none focus:border-oro"
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-tinta/8 bg-papel">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-tinta/8 text-tinta-3">
            <tr>
              <th className="px-4 py-3 font-normal">Nombre</th>
              <th className="px-4 py-3 font-normal">DNI</th>
              <th className="px-4 py-3 font-normal">Celular</th>
              <th className="px-4 py-3 text-right font-normal">Pedidos</th>
              <th className="px-4 py-3 font-normal">Último</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((c) => (
              <tr key={c.dni} className="border-b border-tinta/5 last:border-0">
                <td className="px-4 py-3 font-medium">
                  {c.nombre} {c.apellido}
                </td>
                <td className="px-4 py-3 tabular-nums">{dniConPuntos(c.dni)}</td>
                <td className="px-4 py-3 tabular-nums">
                  <a href={`https://wa.me/${whatsappDe(c.telefono)}`} target="_blank" rel="noopener noreferrer" className="text-lapis underline underline-offset-4">
                    {c.telefono}
                  </a>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{c.pedidos}</td>
                <td className="px-4 py-3 text-tinta-3 tabular-nums">{new Date(c.actualizado).toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes && visibles.length === 0 && <p className="p-6 text-center text-tinta-2">Todavía no hay clientes con ese dato</p>}
      </div>
    </section>
  );
}
