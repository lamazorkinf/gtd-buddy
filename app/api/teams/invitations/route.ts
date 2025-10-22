import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin, verifyAuthToken } from "@/lib/firebase-admin"
import type { Team } from "@/types/task"

// GET - Listar invitaciones para el usuario actual (por email)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userEmail = decodedToken.email

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email del usuario no disponible" },
        { status: 400 }
      )
    }

    const { db } = getFirebaseAdmin()

    // Buscar invitaciones pendientes para este email
    const invitationsSnapshot = await db
      .collection("teamInvitations")
      .where("email", "==", userEmail.toLowerCase())
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get()

    // Para cada invitación, obtener datos del equipo
    const invitationsWithTeamData = await Promise.all(
      invitationsSnapshot.docs.map(async (doc) => {
        const invitationData = doc.data()

        // Verificar si la invitación ha expirado
        const now = new Date()
        const expiresAt = invitationData.expiresAt?.toDate?.() || invitationData.expiresAt
        const isExpired = now > expiresAt

        // Si expiró, actualizar el estado
        if (isExpired && invitationData.status === "pending") {
          await doc.ref.update({ status: "expired" })
        }

        // Obtener datos del equipo
        let teamData: Partial<Team> = {}
        try {
          const teamDoc = await db.collection("teams").doc(invitationData.teamId).get()
          if (teamDoc.exists) {
            const team = teamDoc.data()
            teamData = {
              name: team?.name,
              description: team?.description,
              ownerId: team?.ownerId,
            }
          }
        } catch (error) {
          console.error(`Error al obtener equipo ${invitationData.teamId}:`, error)
        }

        return {
          id: doc.id,
          ...invitationData,
          createdAt: invitationData.createdAt?.toDate?.()?.toISOString(),
          expiresAt: invitationData.expiresAt?.toDate?.()?.toISOString(),
          isExpired,
          team: teamData,
        }
      })
    )

    // Filtrar las que no expiraron
    const validInvitations = invitationsWithTeamData.filter(inv => !inv.isExpired)

    return NextResponse.json({
      invitations: validInvitations,
      count: validInvitations.length,
    })
  } catch (error: any) {
    console.error("Error al obtener invitaciones del usuario:", error)

    if (error.message === "Token de autorización requerido") {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
