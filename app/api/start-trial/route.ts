export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    console.log("🆓 Iniciando período de prueba para usuario:", userId)

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    // Obtener datos del usuario
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const userData = userDoc.data()

    // Verificar si ya tuvo período de prueba
    if (userData.trialStartDate || userData.subscriptionStatus === "trial") {
      return NextResponse.json({ 
        error: "Ya has usado tu período de prueba gratuito" 
      }, { status: 400 })
    }

    // Verificar si ya tiene suscripción activa
    if (userData.subscriptionStatus === "active") {
      return NextResponse.json({ 
        error: "Ya tienes una suscripción activa" 
      }, { status: 400 })
    }

    // Calcular fecha de expiración del trial (7 días desde ahora)
    const trialStartDate = new Date()
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    console.log("📅 Configurando período de prueba:", {
      inicio: trialStartDate,
      fin: trialEndDate
    })

    // Actualizar usuario con período de prueba
    await updateDoc(doc(db, "users", userId), {
      subscriptionStatus: "trial",
      trialStartDate: trialStartDate,
      subscriptionEndDate: trialEndDate,
      isInTrialPeriod: true,
      updatedAt: new Date(),
    })

    console.log("✅ Período de prueba iniciado exitosamente")

    return NextResponse.json({
      success: true,
      message: "Período de prueba iniciado exitosamente",
      trialEndDate: trialEndDate,
    })
  } catch (error) {
    console.error("❌ Error iniciando período de prueba:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 })
}
