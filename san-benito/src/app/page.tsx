import { getTienda } from "@/lib/tienda";
import Tienda from "@/components/tienda/Tienda";
import { consultarPedido, enviarPedido } from "./pedido/acciones";

export default async function Inicio() {
  const tienda = await getTienda();
  return <Tienda tienda={tienda} servicio={{ enviar: enviarPedido, consultar: consultarPedido }} />;
}
