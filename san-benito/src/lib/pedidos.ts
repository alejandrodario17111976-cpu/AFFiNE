import { enCola, escribirJson, leerJson } from "./almacen";
import { validarCliente } from "./clientes";
import { precioPara } from "./formato";
import { getTienda } from "./tienda";
import type { ClienteRegistrado, EstadoPedido, LineaPedido, Pedido } from "./tipos";

const PEDIDOS = "pedidos.json";
const CLIENTES = "clientes.json";
const MAXIMO_GUARDADO = 2000;
const ZONA = "America/Argentina/Mendoza";

export type Entrada = { cliente: unknown; items: unknown };
export type Respuesta<T> = { ok: true; valor: T } | { ok: false; error: string };

/** "261126" para el 26/11/2026 en la hora de Argentina. */
function fechaCorta(d: Date) {
  const partes = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, year: "2-digit", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "00";
  return `${v("year")}${v("month")}${v("day")}`;
}

export async function crearPedido(entrada: Entrada): Promise<Respuesta<Pedido>> {
  const c = validarCliente(entrada.cliente as never);
  if (!c.ok) return { ok: false, error: c.error };
  if (!Array.isArray(entrada.items) || entrada.items.length === 0) return { ok: false, error: "El ticket está vacío" };
  if (entrada.items.length > 80) return { ok: false, error: "El pedido tiene demasiados productos" };

  const tienda = await getTienda();
  const porId = new Map(tienda.productos.map((p) => [p.id, p]));
  const lineas: LineaPedido[] = [];
  for (const item of entrada.items as { id?: unknown; cantidad?: unknown }[]) {
    const producto = porId.get(String(item?.id ?? ""));
    const cantidad = Math.round(Number(item?.cantidad));
    if (!producto || !producto.disponible) return { ok: false, error: "Un producto del ticket ya no está disponible. Revisá el ticket" };
    if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > 99) return { ok: false, error: "Revisá las cantidades del ticket" };
    // Los precios salen siempre de la tienda, nunca de lo que manda el navegador
    const subtotal = precioPara(producto, cantidad);
    lineas.push({
      id: producto.id,
      nombre: producto.nombre,
      presentacion: producto.presentacion,
      cantidad,
      precioUnitario: producto.precio,
      subtotal,
      ahorro: producto.precio * cantidad - subtotal,
    });
  }

  return enCola(async () => {
    const pedidos = await leerJson<Pedido[]>(PEDIDOS, []);
    const ahora = new Date();
    // Un mismo cliente no puede mandar más de 5 pedidos en 10 minutos
    const recientes = pedidos.filter(
      (p) => p.cliente.dni === c.cliente.dni && ahora.getTime() - new Date(p.creado).getTime() < 10 * 60 * 1000,
    );
    if (recientes.length >= 5) return { ok: false as const, error: "Ya mandaste varios pedidos seguidos. Esperá unos minutos" };

    const dia = fechaCorta(ahora);
    const delDia = pedidos.filter((p) => p.numero.startsWith(`${dia}-`)).length;
    const pedido: Pedido = {
      numero: `${dia}-${String(delDia + 1).padStart(3, "0")}`,
      creado: ahora.toISOString(),
      estado: "pendiente",
      listoEn: null,
      entregadoEn: null,
      cliente: c.cliente,
      lineas,
      total: lineas.reduce((s, l) => s + l.subtotal, 0),
      ahorro: lineas.reduce((s, l) => s + l.ahorro, 0),
    };
    await escribirJson(PEDIDOS, [...pedidos, pedido].slice(-MAXIMO_GUARDADO));

    const clientes = await leerJson<Record<string, ClienteRegistrado>>(CLIENTES, {});
    const previo = clientes[c.cliente.dni];
    clientes[c.cliente.dni] = {
      ...c.cliente,
      creado: previo?.creado ?? pedido.creado,
      actualizado: pedido.creado,
      pedidos: (previo?.pedidos ?? 0) + 1,
    };
    await escribirJson(CLIENTES, clientes);
    return { ok: true as const, valor: pedido };
  });
}

/** El cliente consulta su pedido: solo con el número y su propio DNI. */
export async function estadoPedido(numero: string, dni: string) {
  const pedidos = await leerJson<Pedido[]>(PEDIDOS, []);
  const p = pedidos.find((x) => x.numero === numero && x.cliente.dni === String(dni).replace(/\D/g, ""));
  return p ? { estado: p.estado, listoEn: p.listoEn } : null;
}

export async function listarPedidos() {
  const pedidos = await leerJson<Pedido[]>(PEDIDOS, []);
  return pedidos.slice(-400).reverse();
}

export async function cambiarEstado(numero: string, estado: EstadoPedido) {
  return enCola(async () => {
    const pedidos = await leerJson<Pedido[]>(PEDIDOS, []);
    const p = pedidos.find((x) => x.numero === numero);
    if (!p) return null;
    const ahora = new Date().toISOString();
    p.estado = estado;
    if (estado === "listo") p.listoEn = ahora;
    if (estado === "entregado") p.entregadoEn = ahora;
    if (estado === "pendiente") {
      p.listoEn = null;
      p.entregadoEn = null;
    }
    await escribirJson(PEDIDOS, pedidos);
    return p;
  });
}

export async function listarClientes() {
  const clientes = await leerJson<Record<string, ClienteRegistrado>>(CLIENTES, {});
  return Object.values(clientes).sort((a, b) => b.actualizado.localeCompare(a.actualizado));
}
