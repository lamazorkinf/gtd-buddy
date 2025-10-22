import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin, verifyAuthToken } from "@/lib/firebase-admin"
import { isTeamAdmin, isTeamMember } from "@/lib/team-utils"
import type { TeamRole, TeamInvitation, Team } from "@/types/task"

// POST - Crear invitación
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid
    const { teamId } = params

    const { db } = getFirebaseAdmin()

    const body = await request.json()
    const { email, role = "member" } = body

    // Validaciones
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    const validRoles: TeamRole[] = ["admin", "member"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido. Debe ser: admin o member" },
        { status: 400 }
      )
    }

    // Obtener configuración del equipo
    const teamDoc = await db.collection("teams").doc(teamId).get()
    if (!teamDoc.exists) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    const teamData = teamDoc.data() as Team

    // Verificar permisos según configuración
    const isAdmin = await isTeamAdmin(userId, teamId)
    const isMember = await isTeamMember(userId, teamId)

    if (!isAdmin && !(isMember && teamData.settings.allowMemberInvites)) {
      return NextResponse.json(
        { error: "No tienes permisos para invitar miembros" },
        { status: 403 }
      )
    }

    // Verificar que el email no pertenece a un miembro existente
    const membersSnapshot = await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .get()

    const memberEmails = membersSnapshot.docs
      .map(doc => doc.data().email)
      .filter(Boolean)

    if (memberEmails.includes(email.toLowerCase())) {
      return NextResponse.json(
        { error: "Este usuario ya es miembro del equipo" },
        { status: 400 }
      )
    }

    // Verificar que no existe una invitación pendiente para este email
    const existingInvitationSnapshot = await db
      .collection("teamInvitations")
      .where("teamId", "==", teamId)
      .where("email", "==", email.toLowerCase())
      .where("status", "==", "pending")
      .get()

    if (!existingInvitationSnapshot.empty) {
      return NextResponse.json(
        { error: "Ya existe una invitación pendiente para este email" },
        { status: 400 }
      )
    }

    // Crear invitación
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 días

    const invitationData: Omit<TeamInvitation, "id"> = {
      teamId,
      email: email.toLowerCase(),
      invitedBy: userId,
      role,
      status: "pending",
      createdAt: now,
      expiresAt,
    }

    const invitationRef = await db.collection("teamInvitations").add(invitationData)

    console.log(`✅ Invitación creada: ${invitationRef.id} para ${email} al equipo ${teamId}`)

    // TODO: Enviar email de invitación (implementar en el futuro)

    return NextResponse.json(
      {
        invitation: {
          id: invitationRef.id,
          ...invitationData,
          teamName: teamData.name,
        },
        message: "Invitación enviada exitosamente",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error al crear invitación:", error)

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

// GET - Listar invitaciones del equipo
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid
    const { teamId } = params

    const { db } = getFirebaseAdmin()

    // Solo admins pueden ver las invitaciones del equipo
    const isAdmin = await isTeamAdmin(userId, teamId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos para ver las invitaciones" },
        { status: 403 }
      )
    }

    // Obtener filtro de estado desde query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status") // pending, accepted, rejected, all

    let query = db.collection("teamInvitations").where("teamId", "==", teamId)

    if (statusFilter && statusFilter !== "all") {
      query = query.where("status", "==", statusFilter)
    }

    const invitationsSnapshot = await query.orderBy("createdAt", "desc").get()

    const invitations = invitationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString(),
      acceptedAt: doc.data().acceptedAt?.toDate?.()?.toISOString() || null,
      rejectedAt: doc.data().rejectedAt?.toDate?.()?.toISOString() || null,
    }))

    return NextResponse.json({
      invitations,
      count: invitations.length,
    })
  } catch (error: any) {
    console.error("Error al obtener invitaciones:", error)

    if (error.message === "Token de autorización requerido") {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
