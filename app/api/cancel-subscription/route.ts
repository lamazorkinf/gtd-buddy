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

    console.log("🔍 Programando cancelación de suscripción en MercadoPago:", subscriptionId)

    // Primero obtener los detalles de la suscripción actual
    const getResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    })

    if (!getResponse.ok) {
      console.error("❌ Error al obtener suscripción de MercadoPago:", getResponse.status)
      return NextResponse.json({ error: "No se pudo obtener información de la suscripción" }, { status: 500 })
    }

    const currentSubscription = await getResponse.json()
    const subscriptionEndDate = userData.subscriptionEndDate

    // Usar la fecha de fin actual del usuario (que ya tiene calculado el período pagado)
    const endDate = subscriptionEndDate
      ? new Date((subscriptionEndDate as any)?.seconds
          ? (subscriptionEndDate as any).seconds * 1000
          : subscriptionEndDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Fallback: +30 días

    console.log("📅 La suscripción continuará activa hasta:", endDate.toISOString())

    // Actualizar suscripción en MercadoPago para que NO se renueve automáticamente
    // pero mantenga acceso hasta el final del período pagado
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auto_recurring: {
          frequency: currentSubscription.auto_recurring?.frequency || 1,
          frequency_type: currentSubscription.auto_recurring?.frequency_type || "months",
          end_date: endDate.toISOString(),
        },
      }),
    })

    if (!mpResponse.ok) {
      console.error("❌ Error al programar cancelación en MercadoPago:", mpResponse.status)
      const errorData = await mpResponse.text()
      console.error("❌ Detalles del error:", errorData)

      // Marcar localmente como "pendiente de cancelación"
      await updateDoc(doc(db, "users", userId), {
        subscriptionStatus: "pending_cancellation",
        cancellationDate: new Date(),
        cancellationReason: "user_requested",
        willCancelAt: endDate,
        updatedAt: new Date(),
      })

      return NextResponse.json(
        {
          error: "Error parcial: La suscripción se marcó para cancelar localmente, pero hubo un problema con MercadoPago",
          details: errorData
        },
        { status: 207 } // Multi-status
      )
    }

    const subscriptionData = await mpResponse.json()
    console.log("✅ Cancelación programada en MercadoPago para:", endDate.toISOString())

    // Actualizar estado en Firebase - mantener "active" pero marcar para cancelación
    await updateDoc(doc(db, "users", userId), {
      subscriptionStatus: "pending_cancellation", // Nuevo estado
      cancellationDate: new Date(),
      cancellationReason: "user_requested",
      willCancelAt: endDate, // Fecha en que se cancelará
      updatedAt: new Date(),
    })

    console.log("✅ Usuario actualizado: suscripción programada para cancelar en", endDate.toISOString())

    return NextResponse.json({
      success: true,
      message: `Tu suscripción continuará activa hasta ${endDate.toLocaleDateString('es-AR')} y luego se cancelará automáticamente. No se te cobrará más.`,
      willCancelAt: endDate,
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
