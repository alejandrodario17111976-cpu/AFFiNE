import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    // Las fotos de productos y afiches se suben desde el panel AGL
    serverActions: { bodySizeLimit: "10mb" },
  },
  partialPrefetching: true,
  turbopack: {
    // El proyecto vive dentro de otro repositorio: fijar la raíz evita que Next tome la de arriba.
    root: path.resolve("."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
