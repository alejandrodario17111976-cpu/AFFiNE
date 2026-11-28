import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/jost";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "./globals.css";
import { getTienda } from "@/lib/tienda";

export async function generateMetadata(): Promise<Metadata> {
  const { negocio } = await getTienda();
  return {
    title: `${negocio.nombre} — ${negocio.eslogan}`,
    description: `Productos, precios y ofertas de ${negocio.nombre}. Armá tu pedido y envialo al negocio.`,
  };
}

export const viewport: Viewport = {
  themeColor: "#0f2238",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
