import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconoTicket = (p: P) => (
  <Base {...p}>
    <path d="M5 2h14v20l-2.33-1.5L14.33 22 12 20.5 9.67 22l-2.34-1.5L5 22z" />
    <path d="M9 7h6M9 11h6M9 15h4" />
  </Base>
);

export const IconoMas = (p: P) => (
  <Base {...p}>
    <path d="M12 4v16M4 12h16" />
  </Base>
);

export const IconoMenos = (p: P) => (
  <Base {...p}>
    <path d="M4 12h16" />
  </Base>
);

export const IconoCerrar = (p: P) => (
  <Base {...p}>
    <path d="M5 5l14 14M19 5L5 19" />
  </Base>
);

export const IconoBuscar = (p: P) => (
  <Base {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
  </Base>
);

export const IconoFlecha = (p: P) => (
  <Base {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Base>
);

export const IconoCopiar = (p: P) => (
  <Base {...p}>
    <rect x="8" y="8" width="12" height="12" />
    <path d="M4 16V4h12" />
  </Base>
);

export const IconoMensaje = (p: P) => (
  <Base {...p}>
    <path d="M3 4h18v13H8l-5 4z" />
    <path d="M7 9h10M7 13h6" />
  </Base>
);

export const IconoUbicacion = (p: P) => (
  <Base {...p}>
    <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Base>
);

export const IconoReloj = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Base>
);

export const IconoCamara = (p: P) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17 7h.01" />
  </Base>
);

export const IconoMenu = (p: P) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);
