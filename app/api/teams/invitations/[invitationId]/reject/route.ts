import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin, verifyAuthToken } from "@/lib/firebase-admin"
import type { TeamInvitation } from "@/types/task"

// POST - Rechazar invitación
export async function POST(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userEmail = decodedToken.email
    const { invitationId } = params

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email del usuario no disponible" },
        { status: 400 }
      )
    }

    const { db } = getFirebaseAdmin()

    // Obtener la invitación
    const invitationDoc = await db.collection("teamInvitations").doc(invitationId).get()

    if (!invitationDoc.exists) {
      return NextResponse.json(
        { error: "Invitación no encontrada" },
        { status: 404 }
      )
    }

    const invitationData = invitationDoc.data() as TeamInvitation

    // Verificar que el email coincide
    if (invitationData.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Esta invitación no es para ti" },
        { status: 403 }
      )
    }

    // Verificar que está pendiente
    if (invitationData.status !== "pending") {
      return NextResponse.json(
        { error: `Esta invitación ya fue ${invitationData.status}` },
        { status: 400 }
      )
    }

    const now = new Date()

    // Actualizar invitación como rechazada
    await invitationDoc.ref.update({
      status: "rejected",
      rejectedAt: now,
    })

    console.log(`✅ Usuario ${userEmail} rechazó invitación ${invitationId}`)

    return NextResponse.json({
      message: "Invitación rechazada exitosamente",
    })
  } catch (error: any) {
    console.error("Error al rechazar invitación:", error)

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
