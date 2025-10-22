import { initializeApp, getApps, cert, App } from "firebase-admin/app"
import { getAuth, Auth } from "firebase-admin/auth"
import { getFirestore, Firestore } from "firebase-admin/firestore"

let app: App | undefined
let auth: Auth | undefined
let db: Firestore | undefined

/**
 * Inicializa Firebase Admin SDK si no está ya inicializado
 * @returns {Object} Objeto con instancias de auth y db
 */
export function initializeFirebaseAdmin() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")

    if (!serviceAccount || !serviceAccount.project_id) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT no está configurado correctamente")
    }

    app = initializeApp({
      credential: cert(serviceAccount),
    })
  } else {
    app = getApps()[0]
  }

  if (!auth) {
    auth = getAuth(app)
  }

  if (!db) {
    db = getFirestore(app)
  }

  return { auth, db }
}

/**
 * Obtiene las instancias de auth y db (inicializa si es necesario)
 */
export function getFirebaseAdmin() {
  if (!auth || !db) {
    return initializeFirebaseAdmin()
  }
  return { auth, db }
}

/**
 * Verifica el token de autorización del request
 * @param authHeader - Header de autorización (Bearer token)
 * @returns DecodedIdToken con información del usuario
 * @throws Error si el token es inválido
 */
export async function verifyAuthToken(authHeader: string | null) {
  const { auth } = getFirebaseAdmin()

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token de autorización requerido")
  }

  const token = authHeader.split("Bearer ")[1]
  return await auth.verifyIdToken(token)
}
