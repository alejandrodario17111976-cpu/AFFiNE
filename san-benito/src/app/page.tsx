import { getTienda } from "@/lib/tienda";
import Tienda from "@/components/tienda/Tienda";
import { consultarPedido, enviarPedido } from "./pedido/acciones";

export default async function Inicio() {
  const tienda = await getTienda();
  // Los productos ocultos desde AGL no llegan al navegador
  const publica = { ...tienda, productos: tienda.productos.filter((p) => p.visible) };
  return <Tienda tienda={publica} servicio={{ enviar: enviarPedido, consultar: consultarPedido }} />;
}
