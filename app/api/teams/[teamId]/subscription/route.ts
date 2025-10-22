export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin, verifyAuthToken } from "@/lib/firebase-admin"
import { isTeamOwner } from "@/lib/team-utils"

// POST - Crear suscripción de MercadoPago para el equipo
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  console.log("🚀 Iniciando creación de suscripción para equipo...")

  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid
    const userEmail = decodedToken.email
    const { teamId } = params

    // Solo el owner puede crear suscripción para el equipo
    const isOwner = await isTeamOwner(userId, teamId)
    if (!isOwner) {
      return NextResponse.json(
        { error: "Solo el owner puede crear suscripción para el equipo" },
        { status: 403 }
      )
    }

    // Leer variables de entorno
    const accessToken = process.env.MP_ACCESS_TOKEN
    const planId = process.env.MP_PLAN_ID
    const baseUrlApp = process.env.NEXT_PUBLIC_APP_URL

    if (!accessToken || !planId || !baseUrlApp) {
      console.error("❌ Variables de entorno faltantes")
      return NextResponse.json(
        { error: "Configuración de MercadoPago incompleta" },
        { status: 500 }
      )
    }

    const { db } = getFirebaseAdmin()

    // Obtener nombre del equipo
    const teamDoc = await db.collection("teams").doc(teamId).get()
    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()
    const teamName = teamData?.name || "Equipo"

    console.log(`📋 Creando suscripción para equipo: ${teamName} (${teamId})`)

    // Verificar que el plan existe en MercadoPago
    try {
      const planResponse = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!planResponse.ok) {
        console.error("❌ Plan no encontrado en MercadoPago:", planResponse.status)
        return NextResponse.json(
          { error: "Plan de suscripción no válido" },
          { status: 400 }
        )
      }

      const planData = await planResponse.json()
      console.log("✅ Plan verificado:", planData.reason || planData.id)
    } catch (planError) {
      console.error("❌ Error verificando plan:", planError)
      return NextResponse.json(
        { error: "Error verificando plan de suscripción" },
        { status: 500 }
      )
    }

    // Crear suscripción en MercadoPago
    const preapprovalPayload = {
      reason: `GTD Buddy - Suscripción de Equipo: ${teamName}`,
      preapproval_plan_id: planId,
      external_reference: teamId, // Usar teamId como referencia
      payer_email: userEmail,
      back_url: `${baseUrlApp}/teams/${teamId}/subscription/success`,
      status: "pending",
    }

    console.log("📦 Payload de preapproval:", JSON.stringify(preapprovalPayload, null, 2))

    const createPreapprovalResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preapprovalPayload),
    })

    if (!createPreapprovalResponse.ok) {
      const errorText = await createPreapprovalResponse.text()
      console.error("❌ Error al crear preapproval:", createPreapprovalResponse.status, errorText)

      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      return NextResponse.json(
        {
          error: "Error al crear suscripción en MercadoPago",
          details: errorData.message || errorData.error || "Error desconocido",
          status: createPreapprovalResponse.status,
        },
        { status: createPreapprovalResponse.status }
      )
    }

    const preapprovalData = await createPreapprovalResponse.json()
    console.log("✅ Preapproval creado exitosamente:", preapprovalData.id)
    console.log("🔗 Init point:", preapprovalData.init_point)

    // Guardar subscriptionId en el equipo (aunque aún esté pending)
    await db.collection("teams").doc(teamId).update({
      mercadoPagoSubscriptionId: preapprovalData.id,
      updatedAt: new Date(),
    })

    return NextResponse.json(
      {
        id: preapprovalData.id,
        status: preapprovalData.status,
        init_point: preapprovalData.init_point,
        success: true,
        preapproval_id: preapprovalData.id,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("❌ Error en crear suscripción de equipo:", error)

    if (error.message === "Token de autorización requerido") {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar suscripción del equipo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  console.log("🚀 Iniciando cancelación de suscripción de equipo...")

  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid
    const { teamId } = params

    // Solo el owner puede cancelar la suscripción
    const isOwner = await isTeamOwner(userId, teamId)
    if (!isOwner) {
      return NextResponse.json(
        { error: "Solo el owner puede cancelar la suscripción del equipo" },
        { status: 403 }
      )
    }

    const { db } = getFirebaseAdmin()

    // Obtener datos del equipo
    const teamDoc = await db.collection("teams").doc(teamId).get()
    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: "Equipo no encontrado" },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()
    const subscriptionId = teamData?.mercadoPagoSubscriptionId

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "El equipo no tiene una suscripción activa" },
        { status: 400 }
      )
    }

    // Leer variables de entorno
    const accessToken = process.env.MP_ACCESS_TOKEN

    if (!accessToken) {
      console.error("❌ MP_ACCESS_TOKEN no configurado")
      return NextResponse.json(
        { error: "Configuración de MercadoPago incompleta" },
        { status: 500 }
      )
    }

    console.log(`📋 Cancelando suscripción ${subscriptionId} del equipo ${teamId}`)

    // Cancelar en MercadoPago estableciendo end_date
    const now = new Date()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 días desde ahora

    const cancelPayload = {
      end_date: endDate.toISOString(),
      status: "cancelled",
    }

    const cancelResponse = await fetch(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cancelPayload),
      }
    )

    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text()
      console.error("❌ Error al cancelar en MercadoPago:", cancelResponse.status, errorText)

      return NextResponse.json(
        {
          error: "Error al cancelar suscripción en MercadoPago",
          details: errorText,
        },
        { status: cancelResponse.status }
      )
    }

    console.log("✅ Suscripción cancelada en MercadoPago")

    // Actualizar estado del equipo
    await db.collection("teams").doc(teamId).update({
      subscriptionStatus: "pending_cancellation",
      subscriptionEndDate: endDate,
      updatedAt: now,
    })

    console.log(`✅ Equipo ${teamId} marcado como pending_cancellation`)

    return NextResponse.json({
      message: "Suscripción cancelada exitosamente",
      subscriptionEndDate: endDate.toISOString(),
      note: "El equipo mantendrá acceso hasta la fecha de finalización",
    })
  } catch (error: any) {
    console.error("❌ Error al cancelar suscripción de equipo:", error)

    if (error.message === "Token de autorización requerido") {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
