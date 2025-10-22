import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin, verifyAuthToken } from "@/lib/firebase-admin"
import type { TeamInvitation, Team } from "@/types/task"

// POST - Aceptar invitación
export async function POST(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid
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

    // Verificar que no ha expirado
    const now = new Date()
    const expiresAt = invitationData.expiresAt instanceof Date
      ? invitationData.expiresAt
      : invitationData.expiresAt.toDate()

    if (now > expiresAt) {
      // Marcar como expirada
      await invitationDoc.ref.update({
        status: "expired",
      })

      return NextResponse.json(
        { error: "Esta invitación ha expirado" },
        { status: 400 }
      )
    }

    const { teamId, role } = invitationData

    // Verificar que el equipo existe
    const teamDoc = await db.collection("teams").doc(teamId).get()
    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: "El equipo ya no existe" },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data() as Team

    // Verificar que el usuario no es ya miembro
    const existingMemberDoc = await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(userId)
      .get()

    if (existingMemberDoc.exists) {
      // Actualizar invitación como aceptada (aunque ya era miembro)
      await invitationDoc.ref.update({
        status: "accepted",
        acceptedAt: now,
      })

      return NextResponse.json(
        { error: "Ya eres miembro de este equipo" },
        { status: 400 }
      )
    }

    // Crear documento de miembro
    const memberData = {
      teamId,
      userId,
      role,
      invitedBy: invitationData.invitedBy,
      joinedAt: now,
      // Datos desnormalizados del usuario
      displayName: decodedToken.name || null,
      email: userEmail,
      photoURL: decodedToken.picture || null,
    }

    await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(userId)
      .set(memberData)

    // Actualizar array de teams del usuario
    const userRef = db.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (userDoc.exists) {
      const currentTeams = userDoc.data()?.teams || []
      await userRef.update({
        teams: [...currentTeams, teamId],
        updatedAt: now,
      })
    }

    // Actualizar invitación como aceptada
    await invitationDoc.ref.update({
      status: "accepted",
      acceptedAt: now,
    })

    console.log(`✅ Usuario ${userId} aceptó invitación y se unió al equipo ${teamId}`)

    return NextResponse.json({
      message: "Te has unido al equipo exitosamente",
      team: {
        id: teamId,
        name: teamData.name,
        description: teamData.description,
        userRole: role,
      },
    })
  } catch (error: any) {
    console.error("Error al aceptar invitación:", error)

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
