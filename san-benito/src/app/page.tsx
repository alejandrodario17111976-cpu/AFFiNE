import { getTienda } from "@/lib/tienda";
import Tienda from "@/components/tienda/Tienda";

export default async function Inicio() {
  const tienda = await getTienda();
  return <Tienda tienda={tienda} />;
}
