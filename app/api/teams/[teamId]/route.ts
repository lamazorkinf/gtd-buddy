import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin, verifyAuthToken } from "@/lib/firebase-admin"
import { isTeamMember, isTeamAdmin, isTeamOwner, getTeamMemberRole } from "@/lib/team-utils"
import type { Team, TeamSettings } from "@/types/task"

// GET - Obtener detalles de un equipo específico
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

    // Verificar que el usuario es miembro del equipo
    const isMember = await isTeamMember(userId, teamId)
    if (!isMember) {
      return NextResponse.json(
        { error: "No tienes acceso a este equipo" },
        { status: 403 }
      )
    }

    // Obtener datos del equipo
    const teamDoc = await db.collection("teams").doc(teamId).get()

    if (!teamDoc.exists) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 })
    }

    const teamData = teamDoc.data() as Team
    const userRole = await getTeamMemberRole(userId, teamId)

    return NextResponse.json({
      team: {
        id: teamDoc.id,
        ...teamData,
        createdAt: teamData.createdAt?.toDate?.()?.toISOString() || teamData.createdAt,
        updatedAt: teamData.updatedAt?.toDate?.()?.toISOString() || teamData.updatedAt,
        subscriptionEndDate: teamData.subscriptionEndDate?.toDate?.()?.toISOString() || teamData.subscriptionEndDate,
        trialStartDate: teamData.trialStartDate?.toDate?.()?.toISOString() || teamData.trialStartDate,
        userRole,
      },
    })
  } catch (error: any) {
    console.error("Error al obtener equipo:", error)

    if (error.message === "Token de autorización requerido") {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT - Actualizar equipo
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid
    const { teamId } = params

    const { db } = getFirebaseAdmin()

    // Verificar que el usuario es admin o owner
    const isAdmin = await isTeamAdmin(userId, teamId)
    const isOwner = await isTeamOwner(userId, teamId)

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "No tienes permisos para actualizar este equipo" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, settings } = body

    // Preparar datos a actualizar
    const updateData: Partial<Team> = {
      updatedAt: new Date(),
    }

    // Solo admins/owners pueden actualizar el nombre
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "El nombre del equipo no puede estar vacío" },
          { status: 400 }
        )
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: "El nombre del equipo no puede exceder 100 caracteres" },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || ""
    }

    // Solo owners pueden cambiar ciertos settings críticos
    if (settings !== undefined) {
      if (!isOwner) {
        // Admins pueden actualizar algunos settings, pero no todos
        const allowedSettings: Partial<TeamSettings> = {}
        if (settings.defaultTaskCategory !== undefined) {
          allowedSettings.defaultTaskCategory = settings.defaultTaskCategory
        }
        updateData.settings = allowedSettings
      } else {
        // Owner puede actualizar todos los settings
        updateData.settings = settings
      }
    }

    // Actualizar en Firestore
    await db.collection("teams").doc(teamId).update(updateData)

    console.log(`✅ Equipo actualizado: ${teamId} por usuario ${userId}`)

    // Obtener equipo actualizado
    const updatedTeamDoc = await db.collection("teams").doc(teamId).get()
    const updatedTeamData = updatedTeamDoc.data() as Team

    return NextResponse.json({
      team: {
        id: teamId,
        ...updatedTeamData,
        createdAt: updatedTeamData.createdAt?.toDate?.()?.toISOString() || updatedTeamData.createdAt,
        updatedAt: updatedTeamData.updatedAt?.toDate?.()?.toISOString() || updatedTeamData.updatedAt,
        subscriptionEndDate: updatedTeamData.subscriptionEndDate?.toDate?.()?.toISOString() || updatedTeamData.subscriptionEndDate,
        trialStartDate: updatedTeamData.trialStartDate?.toDate?.()?.toISOString() || updatedTeamData.trialStartDate,
      },
      message: "Equipo actualizado exitosamente",
    })
  } catch (error: any) {
    console.error("Error al actualizar equipo:", error)

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

// DELETE - Eliminar equipo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid
    const { teamId } = params

    const { db } = getFirebaseAdmin()

    // Solo el owner puede eliminar el equipo
    const isOwner = await isTeamOwner(userId, teamId)
    if (!isOwner) {
      return NextResponse.json(
        { error: "Solo el owner puede eliminar el equipo" },
        { status: 403 }
      )
    }

    // 1. Obtener todos los miembros del equipo
    const membersSnapshot = await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .get()

    const memberIds = membersSnapshot.docs.map(doc => doc.id)

    // 2. Eliminar teamId del array teams de cada usuario
    const userUpdatePromises = memberIds.map(memberId =>
      db.collection("users").doc(memberId).update({
        teams: db.FieldValue.arrayRemove(teamId),
        updatedAt: new Date(),
      })
    )

    await Promise.all(userUpdatePromises)

    // 3. Eliminar todos los miembros (subcollection)
    const deleteMembersPromises = membersSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(deleteMembersPromises)

    // 4. Eliminar invitaciones pendientes del equipo
    const invitationsSnapshot = await db
      .collection("teamInvitations")
      .where("teamId", "==", teamId)
      .where("status", "==", "pending")
      .get()

    const deleteInvitationsPromises = invitationsSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(deleteInvitationsPromises)

    // 5. Manejar tareas del equipo: convertirlas a tareas personales del owner
    // (Alternativa: eliminarlas por completo - se puede hacer configurable)
    const tasksSnapshot = await db
      .collection("tasks")
      .where("teamId", "==", teamId)
      .get()

    const updateTasksPromises = tasksSnapshot.docs.map(doc =>
      doc.ref.update({
        teamId: null, // Convertir a tarea personal
        assignedTo: null,
        updatedAt: new Date(),
      })
    )

    await Promise.all(updateTasksPromises)

    // 6. Manejar contextos del equipo
    const contextsSnapshot = await db
      .collection("contexts")
      .where("teamId", "==", teamId)
      .get()

    const updateContextsPromises = contextsSnapshot.docs.map(doc =>
      doc.ref.update({
        teamId: null,
        updatedAt: new Date(),
      })
    )

    await Promise.all(updateContextsPromises)

    // 7. TODO: Cancelar suscripción de MercadoPago si existe
    // Esto se implementará en la ruta de subscription

    // 8. Finalmente, eliminar el documento del equipo
    await db.collection("teams").doc(teamId).delete()

    console.log(`✅ Equipo eliminado: ${teamId} por usuario ${userId}`)

    return NextResponse.json({
      message: "Equipo eliminado exitosamente",
      tasksConverted: tasksSnapshot.size,
      contextsConverted: contextsSnapshot.size,
      membersRemoved: memberIds.length,
    })
  } catch (error: any) {
    console.error("Error al eliminar equipo:", error)

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
