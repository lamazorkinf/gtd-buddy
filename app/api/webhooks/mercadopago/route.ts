export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import crypto from "crypto"

function validateMercadoPagoSignature(request: NextRequest, body: string): boolean {
  try {
    const signature = request.headers.get("x-signature")
    const requestId = request.headers.get("x-request-id")
    const webhookSecret = process.env.MP_WEBHOOK_SECRET
    
    if (!signature || !requestId) {
      console.log("⚠️ Faltan headers de validación")
      return !webhookSecret // Si no hay secret configurado, permitir. Si hay secret, requerir headers
    }

    if (!webhookSecret) {
      console.log("⚠️ Webhook secret no configurado, saltando validación")
      return true
    }

    // Validar la firma con el webhook secret
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')
    const isValid = signature === `sha256=${expectedSignature}`
    
    if (!isValid) {
      console.error("❌ Firma de webhook inválida")
      console.log("🔍 Signature recibida:", signature)
      console.log("🔍 Signature esperada:", `sha256=${expectedSignature}`)
    } else {
      console.log("✅ Webhook signature válida")
    }
    
    return isValid
  } catch (error) {
    console.error("❌ Error validando firma:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 Webhook de MercadoPago recibido")

    const bodyText = await request.text()
    
    // Validar firma del webhook
    if (!validateMercadoPagoSignature(request, bodyText)) {
      console.error("❌ Firma de webhook inválida")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = JSON.parse(bodyText)
    console.log("📋 Datos del webhook:", JSON.stringify(body, null, 2))

    // Verificar que es una notificación de preapproval (suscripción)
    if (body.type === "preapproval") {
      const preapprovalId = body.data?.id

      if (!preapprovalId) {
        console.log("❌ No se encontró ID de preapproval")
        return NextResponse.json({ error: "ID de preapproval faltante" }, { status: 400 })
      }

      console.log("🔍 Consultando suscripción:", preapprovalId)

      // Obtener detalles de la suscripción desde MercadoPago
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      })

      if (!mpResponse.ok) {
        console.error("❌ Error al obtener datos de MercadoPago:", mpResponse.status, mpResponse.statusText)
        return NextResponse.json({ error: "Error al verificar suscripción" }, { status: 500 })
      }

      const subscriptionData = await mpResponse.json()
      console.log("📊 Datos de suscripción de MP:", JSON.stringify(subscriptionData, null, 2))

      // Actualizar estado del usuario en Firebase
      if (subscriptionData.external_reference) {
        const userId = subscriptionData.external_reference

        try {
          // Verificar que el usuario existe
          const userDocRef = doc(db, "users", userId)
          const userDoc = await getDoc(userDocRef)

          if (!userDoc.exists()) {
            console.error("❌ Usuario no encontrado:", userId)
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
          }

          console.log("👤 Usuario encontrado, actualizando estado...")

          // Calcular nueva fecha de expiración basada en el plan
          const calculateEndDate = (startDate: Date, billingFrequency: string = "monthly"): Date => {
            const endDate = new Date(startDate)
            switch (billingFrequency.toLowerCase()) {
              case "monthly":
                endDate.setMonth(endDate.getMonth() + 1)
                break
              case "yearly":
                endDate.setFullYear(endDate.getFullYear() + 1)
                break
              default:
                endDate.setMonth(endDate.getMonth() + 1) // Default mensual
            }
            return endDate
          }

          const newEndDate = calculateEndDate(new Date())

          const updateData: any = {
            mercadoPagoSubscriptionId: preapprovalId,
            updatedAt: new Date(),
          }

          // Actualizar según el estado de la suscripción
          switch (subscriptionData.status) {
            case "authorized":
              updateData.subscriptionStatus = "active"
              updateData.subscriptionEndDate = newEndDate
              updateData.isInTrialPeriod = false
              updateData.lastPaymentDate = new Date()
              console.log("✅ Suscripción autorizada - activando hasta:", newEndDate)
              break

            case "pending":
              updateData.subscriptionStatus = "pending_payment"
              console.log("⏳ Suscripción pendiente de pago")
              break

            case "cancelled":
              updateData.subscriptionStatus = "cancelled"
              updateData.cancellationDate = new Date()
              console.log("❌ Suscripción cancelada")
              break

            case "paused":
              updateData.subscriptionStatus = "paused"
              updateData.pausedDate = new Date()
              console.log("⏸️ Suscripción pausada")
              break

            case "suspended":
              updateData.subscriptionStatus = "suspended"
              updateData.suspendedDate = new Date()
              console.log("🚫 Suscripción suspendida")
              break

            default:
              console.log("⚠️ Estado de suscripción no reconocido:", subscriptionData.status)
              updateData.subscriptionStatus = subscriptionData.status
              updateData.unknownStatusData = subscriptionData
          }

          await updateDoc(userDocRef, updateData)
          console.log("✅ Usuario actualizado exitosamente:", userId, updateData)
        } catch (error) {
          console.error("❌ Error al actualizar usuario:", error)
          return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
        }
      } else {
        console.log("⚠️ No se encontró external_reference en la suscripción")
      }
    } else if (body.type === "payment") {
      // Manejar pagos individuales si es necesario
      console.log("💳 Notificación de pago recibida:", body.data?.id)

      const paymentId = body.data?.id
      if (paymentId) {
        // Obtener detalles del pago
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        })

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json()
          console.log("💰 Datos del pago:", JSON.stringify(paymentData, null, 2))

          // Aquí puedes manejar pagos individuales si tu modelo lo requiere
        }
      }
    } else {
      console.log("ℹ️ Tipo de notificación no manejada:", body.type)
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
