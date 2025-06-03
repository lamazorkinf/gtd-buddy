export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 Webhook de MercadoPago recibido")

    const body = await request.json()
    console.log("📋 Datos del webhook:", body)

    // Verificar que es una notificación de preapproval (suscripción)
    if (body.type === "preapproval") {
      const preapprovalId = body.data?.id

      if (!preapprovalId) {
        console.log("❌ No se encontró ID de preapproval")
        return NextResponse.json({ error: "ID de preapproval faltante" }, { status: 400 })
      }

      // Obtener detalles de la suscripción desde MercadoPago
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      })

      if (!mpResponse.ok) {
        console.error("❌ Error al obtener datos de MercadoPago")
        return NextResponse.json({ error: "Error al verificar suscripción" }, { status: 500 })
      }

      const subscriptionData = await mpResponse.json()
      console.log("📊 Datos de suscripción:", subscriptionData)

      // Actualizar estado del usuario en Firebase
      if (subscriptionData.external_reference && subscriptionData.status === "authorized") {
        const userId = subscriptionData.external_reference

        try {
          await updateDoc(doc(db, "users", userId), {
            subscriptionStatus: "active",
            subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
            mercadoPagoSubscriptionId: preapprovalId,
            updatedAt: new Date(),
          })

          console.log("✅ Usuario actualizado exitosamente:", userId)
        } catch (error) {
          console.error("❌ Error al actualizar usuario:", error)
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("❌ Error en webhook:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Webhook de MercadoPago activo" }, { status: 200 })
}
