// La página de la vista previa, tal como se publica en claude.ai. La usan el armado
// (construir.mjs) y el panel AGL de la propia página, que se guarda a sí misma
// publicando una versión nueva con los datos cambiados adentro.

/** Estilos base que agrega la herramienta de publicación (tienen que ser idénticos). */
export const RESET =
  ":root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}";

const GOOGLE = {
  cormorant: "Cormorant+Garamond:wght@400..700",
  fraunces: "Fraunces:opsz,wght@9..144,300..700",
  playfair: "Playfair+Display:wght@400..800",
  newsreader: "Newsreader:opsz,wght@6..72,300..700",
  jost: "Jost:wght@300..700",
  instrument: "Instrument+Sans:wght@400..700",
  dm: "DM+Sans:wght@300..700",
};

/** Fuentes de Google Fonts (el único servidor de fuentes que permite la página) según la apariencia elegida. */
export function urlFuentes(apariencia) {
  const familias = [
    GOOGLE[apariencia?.fuenteTitulos] ?? GOOGLE.cormorant,
    GOOGLE[apariencia?.fuenteTexto] ?? GOOGLE.jost,
    "Courier+Prime:wght@400;700",
  ];
  return `https://fonts.googleapis.com/css2?${familias.map((f) => `family=${f}`).join("&")}&display=swap`;
}

const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** El contenido de la página (lo que va dentro de <body>), con los datos de la tienda incluidos. */
export function cuerpoPagina(tienda) {
  const datos = JSON.stringify(tienda).replace(/</g, "\\u003c");
  return `<meta charset="utf-8">
<title>${escapar(tienda?.negocio?.nombre || "San Benito")}</title>
<link rel="stylesheet" href="${urlFuentes(tienda?.apariencia)}">
<link rel="stylesheet" href="estilos.css">
<div id="raiz"></div>
<script type="application/json" id="datos-tienda">${datos}</script>
<script src="tienda.js"></script>
`;
}

/** El documento completo, con el mismo esqueleto que arma la herramienta al publicar. */
export function documentoCompleto(tienda) {
  return `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${RESET}</style></head><body>\n${cuerpoPagina(tienda)}\n</body></html>`;
}
