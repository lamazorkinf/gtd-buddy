import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "./firebase"
import type { WhatsAppLink } from "@/types/whatsapp"

/**
 * Genera un código de vinculación de 6 dígitos
 */
export function generateLinkCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Normaliza un número de WhatsApp al formato internacional
 * Ejemplo: +54 9 11 1234-5678 → 5491112345678
 */
export function normalizeWhatsAppNumber(phoneNumber: string): string {
  // Remover todos los caracteres no numéricos excepto el +
  let normalized = phoneNumber.replace(/[^\d+]/g, "")

  // Si empieza con +, quitarlo
  if (normalized.startsWith("+")) {
    normalized = normalized.slice(1)
  }

  // Si el número argentino tiene el 9 después del código de país, dejarlo
  // Formato esperado: 5491112345678 (código país + código área + número)
  return normalized
}

/**
 * Busca un link de WhatsApp activo por número
 */
export async function findWhatsAppLinkByNumber(
  whatsappNumber: string
): Promise<(WhatsAppLink & { id: string }) | null> {
  const normalized = normalizeWhatsAppNumber(whatsappNumber)
  const linksRef = collection(db, "whatsappLinks")
  const q = query(linksRef, where("whatsappNumber", "==", normalized), where("isActive", "==", true))

  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  const docData = snapshot.docs[0]
  return {
    id: docData.id,
    ...docData.data(),
    createdAt: docData.data().createdAt?.toDate() || new Date(),
    updatedAt: docData.data().updatedAt?.toDate() || new Date(),
    linkCodeExpiry: docData.data().linkCodeExpiry?.toDate() || undefined,
  } as WhatsAppLink & { id: string }
}

/**
 * Busca un link de WhatsApp por código de vinculación
 */
export async function findWhatsAppLinkByCode(
  linkCode: string
): Promise<(WhatsAppLink & { id: string }) | null> {
  const linksRef = collection(db, "whatsappLinks")
  const q = query(linksRef, where("linkCode", "==", linkCode), where("isActive", "==", true))

  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  const docData = snapshot.docs[0]
  const link = {
    id: docData.id,
    ...docData.data(),
    createdAt: docData.data().createdAt?.toDate() || new Date(),
    updatedAt: docData.data().updatedAt?.toDate() || new Date(),
    linkCodeExpiry: docData.data().linkCodeExpiry?.toDate() || undefined,
  } as WhatsAppLink & { id: string }

  // Verificar si el código expiró
  if (link.linkCodeExpiry && link.linkCodeExpiry < new Date()) {
    return null
  }

  return link
}

/**
 * Crea un nuevo link de WhatsApp para un usuario
 */
export async function createWhatsAppLink(userId: string, whatsappNumber: string): Promise<string> {
  const normalized = normalizeWhatsAppNumber(whatsappNumber)
  const linkCode = generateLinkCode()
  const expiryDate = new Date()
  expiryDate.setMinutes(expiryDate.getMinutes() + 15) // Código expira en 15 minutos

  const docRef = await addDoc(collection(db, "whatsappLinks"), {
    userId,
    whatsappNumber: normalized,
    linkCode,
    linkCodeExpiry: expiryDate,
    isActive: false, // Se activa cuando el usuario envía el código por WhatsApp
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return linkCode
}

/**
 * Activa un link de WhatsApp usando el código de vinculación
 */
export async function activateWhatsAppLink(linkCode: string, whatsappNumber: string): Promise<boolean> {
  const link = await findWhatsAppLinkByCode(linkCode)

  if (!link) {
    return false
  }

  // Verificar que el número coincida
  const normalized = normalizeWhatsAppNumber(whatsappNumber)
  if (link.whatsappNumber !== normalized) {
    return false
  }

  // Activar el link
  const linkRef = doc(db, "whatsappLinks", link.id)
  await updateDoc(linkRef, {
    isActive: true,
    linkCode: null, // Eliminar el código una vez usado
    linkCodeExpiry: null,
    updatedAt: new Date(),
  })

  return true
}

/**
 * Busca el userId asociado a un número de WhatsApp
 */
export async function getUserIdByWhatsAppNumber(whatsappNumber: string): Promise<string | null> {
  const link = await findWhatsAppLinkByNumber(whatsappNumber)
  return link?.userId || null
}

/**
 * Extrae el número de teléfono del remoteJid de WhatsApp
 * Formato: 5491112345678@s.whatsapp.net → 5491112345678
 */
export function extractPhoneNumber(remoteJid: string): string {
  return remoteJid.split("@")[0]
}
