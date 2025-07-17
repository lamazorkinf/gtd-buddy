export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    console.log("🚫 Cancelando suscripción para usuario:", userId)

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    // Obtener datos del usuario
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const userData = userDoc.data()
    const subscriptionId = userData.mercadoPagoSubscriptionId

    if (!subscriptionId) {
      return NextResponse.json({ error: "No hay suscripción activa" }, { status: 400 })
    }

    console.log("🔍 Cancelando suscripción en MercadoPago:", subscriptionId)

    // Cancelar suscripción en MercadoPago
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "cancelled",
      }),
    })

    if (!mpResponse.ok) {
      console.error("❌ Error al cancelar en MercadoPago:", mpResponse.status)
      const errorData = await mpResponse.text()
      console.error("❌ Detalles del error:", errorData)
      
      // Intentar cancelar localmente aunque falle en MP
      await updateDoc(doc(db, "users", userId), {
        subscriptionStatus: "cancelled",
        cancellationDate: new Date(),
        cancellationReason: "user_requested",
        updatedAt: new Date(),
      })

      return NextResponse.json(
        { 
          error: "Error parcial: La suscripción se marcó como cancelada localmente, pero hubo un problema con MercadoPago",
          details: errorData
        }, 
        { status: 207 } // Multi-status
      )
    }

    const subscriptionData = await mpResponse.json()
    console.log("✅ Suscripción cancelada en MercadoPago:", subscriptionData.status)

    // Actualizar estado en Firebase
    await updateDoc(doc(db, "users", userId), {
      subscriptionStatus: "cancelled",
      cancellationDate: new Date(),
      cancellationReason: "user_requested",
      updatedAt: new Date(),
    })

    console.log("✅ Usuario actualizado: suscripción cancelada")

    return NextResponse.json({
      success: true,
      message: "Suscripción cancelada exitosamente",
      status: subscriptionData.status,
    })
  } catch (error) {
    console.error("❌ Error cancelando suscripción:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 })
}
