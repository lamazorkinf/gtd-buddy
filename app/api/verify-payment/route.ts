export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { userId, paymentId, subscriptionId } = await request.json()

    console.log("🔍 Verificando pago para usuario:", userId)

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    // Obtener datos del usuario
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const userData = userDoc.data()
    const subscriptionIdToCheck = subscriptionId || userData.mercadoPagoSubscriptionId

    if (!subscriptionIdToCheck) {
      return NextResponse.json({ error: "No hay suscripción asociada" }, { status: 400 })
    }

    console.log("🔍 Verificando suscripción:", subscriptionIdToCheck)

    // Verificar estado en MercadoPago
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionIdToCheck}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    })

    if (!mpResponse.ok) {
      console.error("❌ Error al verificar con MercadoPago:", mpResponse.status)
      return NextResponse.json({ error: "Error al verificar con MercadoPago" }, { status: 500 })
    }

    const subscriptionData = await mpResponse.json()
    console.log("📊 Estado actual de la suscripción:", subscriptionData.status)

    // Actualizar estado si es necesario
    if (subscriptionData.status === "authorized" && userData.subscriptionStatus !== "active") {
      console.log("✅ Activando suscripción...")

      const newEndDate = new Date()
      newEndDate.setDate(newEndDate.getDate() + 30)

      await updateDoc(doc(db, "users", userId), {
        subscriptionStatus: "active",
        subscriptionEndDate: newEndDate,
        isInTrialPeriod: false,
        mercadoPagoSubscriptionId: subscriptionIdToCheck,
        updatedAt: new Date(),
      })

      return NextResponse.json({
        status: "authorized",
        subscriptionStatus: "active",
        message: "Suscripción activada exitosamente",
        endDate: newEndDate,
      })
    }

    // Mapear estados de MercadoPago a nuestros estados
    let ourStatus = "pending_payment"
    switch (subscriptionData.status) {
      case "authorized":
        ourStatus = "active"
        break
      case "pending":
        ourStatus = "pending_payment"
        break
      case "cancelled":
        ourStatus = "cancelled"
        break
      case "paused":
        ourStatus = "paused"
        break
    }

    return NextResponse.json({
      status: subscriptionData.status,
      subscriptionStatus: ourStatus,
      message: `Estado de suscripción: ${subscriptionData.status}`,
    })
  } catch (error) {
    console.error("❌ Error verificando pago:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
