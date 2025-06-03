export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

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
      return NextResponse.json({ error: "No hay suscripción asociada" }, { status: 400 })
    }

    // Verificar estado en MercadoPago
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    })

    if (!mpResponse.ok) {
      return NextResponse.json({ error: "Error al verificar con MercadoPago" }, { status: 500 })
    }

    const subscriptionData = await mpResponse.json()

    // Actualizar estado si es necesario
    if (subscriptionData.status === "authorized" && userData.subscriptionStatus !== "active") {
      await updateDoc(doc(db, "users", userId), {
        subscriptionStatus: "active",
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      status: subscriptionData.status,
      subscriptionStatus: subscriptionData.status === "authorized" ? "active" : "pending_payment",
    })
  } catch (error) {
    console.error("Error verificando pago:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
