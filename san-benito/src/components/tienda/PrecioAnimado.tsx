"use client";

import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number";
import { separadores, simboloMoneda } from "@/lib/formato";
import { useCarrito } from "./carrito";

/** Importe cuyos dígitos ruedan al cambiar, como un contador (Sliding Number de Animate UI). */
export default function PrecioAnimado({ valor, className = "" }: { valor: number; className?: string }) {
  const { negocio, precio } = useCarrito();
  const { miles, decimal } = separadores(negocio.locale);
  const decimales = Number.isInteger(valor) ? 0 : 2;
  return (
    <span className={`inline-flex items-baseline gap-[0.25em] tabular-nums ${className}`} aria-label={precio(valor)}>
      <span aria-hidden>{simboloMoneda(negocio.locale, negocio.moneda)}</span>
      <SlidingNumber
        aria-hidden
        number={valor}
        thousandSeparator={miles}
        decimalSeparator={decimal}
        decimalPlaces={decimales}
        initiallyStable
      />
    </span>
  );
}
