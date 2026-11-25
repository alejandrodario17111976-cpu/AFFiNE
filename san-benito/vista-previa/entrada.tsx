import { createRoot } from "react-dom/client";
import Tienda from "@/components/tienda/Tienda";
import { normalizarTienda } from "@/lib/validar";
import datos from "../data/tienda.json";

/** Vista previa estática de la tienda con los datos de data/tienda.json. */
const raiz = document.getElementById("raiz");
if (raiz) createRoot(raiz).render(<Tienda tienda={normalizarTienda(datos)} vistaPrevia />);
