import type { AnchorHTMLAttributes } from "react";

/** Reemplazo de next/link para la vista previa, que no corre sobre Next.js. */
export default function Link({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props} />;
}
