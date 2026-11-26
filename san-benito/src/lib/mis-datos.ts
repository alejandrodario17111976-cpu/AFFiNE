"use client";

import { useSyncExternalStore } from "react";
import type { Cliente, EstadoPedido } from "./tipos";

/**
 * Lo que el cliente guarda en su propio teléfono: sus datos (para no escribirlos cada vez)
 * y el último pedido que mandó (para ver si ya está listo). No sale del dispositivo salvo
 * cuando manda un pedido.
 */
export interface UltimoPedido {
  numero: string;
  dni: string;
  total: number;
  creado: string;
  estado: EstadoPedido;
}

function almacen<T>(clave: string) {
  let actual: T | null | undefined;
  const oyentes = new Set<() => void>();
  const leer = (): T | null => {
    if (actual === undefined) {
      try {
        actual = JSON.parse(window.localStorage.getItem(clave) ?? "null") as T | null;
      } catch {
        actual = null;
      }
    }
    return actual ?? null;
  };
  const escribir = (valor: T | null) => {
    actual = valor;
    try {
      if (valor === null) window.localStorage.removeItem(clave);
      else window.localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      /* sin almacenamiento: dura mientras la página esté abierta */
    }
    oyentes.forEach((f) => f());
  };
  const suscribir = (f: () => void) => {
    oyentes.add(f);
    const alCambiar = (e: StorageEvent) => {
      if (e.key === clave) {
        actual = undefined;
        f();
      }
    };
    window.addEventListener("storage", alCambiar);
    return () => {
      oyentes.delete(f);
      window.removeEventListener("storage", alCambiar);
    };
  };
  const useValor = () => useSyncExternalStore(suscribir, leer, () => null);
  return { leer, escribir, useValor };
}

const cliente = almacen<Cliente>("san-benito-cliente");
const ultimo = almacen<UltimoPedido>("san-benito-ultimo-pedido");

export const useMiCliente = cliente.useValor;
export const guardarMiCliente = cliente.escribir;
export const useUltimoPedido = ultimo.useValor;
export const guardarUltimoPedido = ultimo.escribir;
export const leerUltimoPedido = ultimo.leer;
