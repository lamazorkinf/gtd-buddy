import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin, verifyAuthToken } from "@/lib/firebase-admin"
import { getUserTeams, getTeamMemberRole } from "@/lib/team-utils"
import type { Team, TeamSettings } from "@/types/task"

// GET - Listar equipos del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid

    // Obtener todos los equipos del usuario
    const teams = await getUserTeams(userId)

    // Obtener el rol del usuario en cada equipo
    const teamsWithRole = await Promise.all(
      teams.map(async (team) => {
        const role = await getTeamMemberRole(userId, team.id)
        return {
          ...team,
          userRole: role,
        }
      })
    )

    return NextResponse.json({
      teams: teamsWithRole,
      count: teamsWithRole.length,
    })
  } catch (error: any) {
    console.error("Error al obtener equipos:", error)

    if (error.message === "Token de autorización requerido") {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST - Crear nuevo equipo
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid
    const userEmail = decodedToken.email

    const { db } = getFirebaseAdmin()

    const body = await request.json()
    const { name, description } = body

    // Validaciones
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre del equipo es requerido" },
        { status: 400 }
      )
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "El nombre del equipo no puede exceder 100 caracteres" },
        { status: 400 }
      )
    }

    const now = new Date()
    const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 días

    // Configuración por defecto del equipo
    const defaultSettings: TeamSettings = {
      allowMemberInvites: false, // Solo admins pueden invitar por defecto
      defaultTaskCategory: "Inbox",
      requireTaskAssignment: false,
    }

    // Preparar datos del equipo
    const teamData: Omit<Team, "id"> = {
      name: name.trim(),
      description: description?.trim() || "",
      ownerId: userId,
      subscriptionStatus: "trial",
      trialStartDate: now,
      subscriptionEndDate: trialEndDate,
      settings: defaultSettings,
      createdAt: now,
      updatedAt: now,
    }

    // Crear equipo en Firestore
    const teamRef = await db.collection("teams").add(teamData)
    const teamId = teamRef.id

    // Crear documento de miembro para el owner
    const memberData = {
      teamId,
      userId,
      role: "owner" as const,
      invitedBy: userId, // Se auto-invitó al crear el equipo
      joinedAt: now,
      // Datos desnormalizados del usuario
      displayName: decodedToken.name || null,
      email: userEmail || null,
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

    console.log(`✅ Equipo creado: ${teamId} por usuario ${userId}`)

    // Retornar el equipo creado
    return NextResponse.json(
      {
        team: {
          id: teamId,
          ...teamData,
          userRole: "owner",
        },
        message: "Equipo creado exitosamente",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error al crear equipo:", error)

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
