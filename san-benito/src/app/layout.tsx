import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "San Benito — Tu mejor elección",
  description: "Productos, precios y ofertas de San Benito. Armá tu pedido y envialo al negocio.",
};

export const viewport: Viewport = {
  themeColor: "#FF0000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
