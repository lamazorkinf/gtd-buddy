"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db, googleProvider } from "@/lib/firebase"
import type { User } from "@/types/task"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Asegurarse de que auth esté inicializado
    if (!auth) {
      console.error("Firebase auth no está inicializado")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            // Fetch user data from Firestore
            const userDocRef = doc(db, "users", firebaseUser.uid)
            const userDocSnap = await getDoc(userDocRef)

            if (userDocSnap.exists()) {
              const userDataFromFirestore = userDocSnap.data() as User
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                // Prioriza displayName de Firebase Auth, luego de Firestore, luego construye
                displayName:
                  firebaseUser.displayName ||
                  userDataFromFirestore.displayName ||
                  `${userDataFromFirestore.firstName || ""} ${userDataFromFirestore.lastName || ""}`.trim() ||
                  null,
                photoURL: firebaseUser.photoURL || userDataFromFirestore.photoURL,
                role: userDataFromFirestore.role || "user",
                subscriptionStatus: userDataFromFirestore.subscriptionStatus || "inactive",
                subscriptionEndDate: userDataFromFirestore.subscriptionEndDate,
                firstName: userDataFromFirestore.firstName,
                lastName: userDataFromFirestore.lastName,
                isInTrialPeriod: userDataFromFirestore.isInTrialPeriod === true, // Asegurar que sea booleano
                trialStartDate: userDataFromFirestore.trialStartDate,
              })
            } else {
              // This case might happen if user was created via Google Sign-In for the first time
              // and the document wasn't created yet. Or if there's an issue.
              // For now, we'll set a default user structure.
              // The signUp and signInWithGoogle methods should handle creating the user doc.
              const newUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: "user",
                subscriptionStatus: "trial", // Cambiar a "trial" para nuevos usuarios
                isInTrialPeriod: true, // Nuevos usuarios comienzan en período de prueba
              }
              // Optionally create the user document here if it doesn't exist
              // await setDoc(userDocRef, { ...newUser, createdAt: serverTimestamp() });
              setUser(newUser)
            }
          } catch (error) {
            console.error("Error al obtener datos del usuario:", error)
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error en onAuthStateChanged:", error)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // User data will be fetched by onAuthStateChanged
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      if (firebaseUser) {
        // Opcional: Actualizar el perfil de Firebase Auth con displayName
        const displayName = `${firstName} ${lastName}`.trim()
        if (displayName) {
          await updateProfile(firebaseUser, { displayName })
        }

        const userDocRef = doc(db, "users", firebaseUser.uid)
        const newUserFirestoreData: Omit<User, "uid" | "email" | "photoURL" | "displayName"> & {
          email: string | null
          photoURL: string | null
          displayName: string | null
          createdAt: any
          uid: string
        } = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName || null,
          photoURL: firebaseUser.photoURL,
          firstName: firstName,
          lastName: lastName,
          role: "user",
          subscriptionStatus: "trial", // Cambiar a "trial"
          isInTrialPeriod: true, // Establecer período de prueba
          trialStartDate: serverTimestamp(), // Marcar inicio de prueba
          createdAt: serverTimestamp(),
        }
        await setDoc(userDocRef, newUserFirestoreData)
        // setUser será actualizado por onAuthStateChanged, que ahora leerá firstName y lastName
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid)
        const userDocSnap = await getDoc(userDocRef)
        if (!userDocSnap.exists()) {
          // Create user document if it's their first time with Google
          const displayNameParts = firebaseUser.displayName?.split(" ") || ["", ""]
          const firstName = displayNameParts[0]
          const lastName = displayNameParts.slice(1).join(" ")

          const newUser: Omit<User, "uid"> = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            firstName: firstName,
            lastName: lastName,
            role: "user",
            subscriptionStatus: "trial", // Cambiar a "trial"
            isInTrialPeriod: true, // Establecer período de prueba
            trialStartDate: serverTimestamp(), // Marcar inicio de prueba
          }
          await setDoc(userDocRef, { ...newUser, createdAt: serverTimestamp(), uid: firebaseUser.uid })
        }
        // setUser will be updated by onAuthStateChanged
      }
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
