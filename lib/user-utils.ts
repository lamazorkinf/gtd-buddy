/**
 * Lightweight utilities for persisting and retrieving
 * datos del usuario provenientes de Firestore en el
 * lado del cliente.
 *
 * ⚠️  Si más adelante prefieres guardar esta información
 *      en un store global (p. ej. Zustand, Jotai) o en el
 *      contexto de React, simplemente importa y usa estas
 *      funciones como puente temporal.
 */

/**
 * Guarda los datos de Firestore en `sessionStorage`
 * para que otros componentes puedan leerlos sin
 * volver a consultar la base cada vez.
 */
export const setFirestoreUser = (userData: any) => {
  // Esta función puede ser utilizada para actualizar el estado del usuario
  // Por ahora es una función simple que no hace nada específico
  // pero puede ser expandida en el futuro para manejar lógica de usuario
  console.log("Setting Firestore user data:", userData)
}

/**
 * Recupera los datos previamente almacenados.
 */
export function getFirestoreUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem("firestoreUser")
    return raw ? (JSON.parse(raw) as T) : null
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error leyendo firestoreUser:", err)
    return null
  }
}
