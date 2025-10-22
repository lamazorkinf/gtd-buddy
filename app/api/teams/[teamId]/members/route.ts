import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin, verifyAuthToken } from "@/lib/firebase-admin"
import { isTeamMember, isTeamAdmin, getTeamMembers } from "@/lib/team-utils"

// GET - Listar miembros del equipo
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const decodedToken = await verifyAuthToken(authHeader)
    const userId = decodedToken.uid
    const { teamId } = params

    // Verificar que el usuario es miembro del equipo
    const isMember = await isTeamMember(userId, teamId)
    if (!isMember) {
      return NextResponse.json(
        { error: "No tienes acceso a este equipo" },
        { status: 403 }
      )
    }

    // Obtener miembros del equipo
    const members = await getTeamMembers(teamId)

    return NextResponse.json({
      members,
      count: members.length,
    })
  } catch (error: any) {
    console.error("Error al obtener miembros:", error)

    if (error.message === "Token de autorización requerido") {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// DELETE - Remover miembro del equipo
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

    // Obtener el userId del miembro a remover desde query params
    const { searchParams } = new URL(request.url)
    const memberToRemove = searchParams.get("userId")

    if (!memberToRemove) {
      return NextResponse.json(
        { error: "userId del miembro a remover es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el usuario actual es admin/owner O que se está removiendo a sí mismo
    const isAdmin = await isTeamAdmin(userId, teamId)
    const isSelfRemoval = userId === memberToRemove

    if (!isAdmin && !isSelfRemoval) {
      return NextResponse.json(
        { error: "No tienes permisos para remover miembros" },
        { status: 403 }
      )
    }

    // Obtener datos del miembro a remover
    const memberDoc = await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(memberToRemove)
      .get()

    if (!memberDoc.exists) {
      return NextResponse.json(
        { error: "El miembro no existe en este equipo" },
        { status: 404 }
      )
    }

    const memberData = memberDoc.data()

    // No permitir remover al owner
    if (memberData?.role === "owner") {
      return NextResponse.json(
        { error: "No se puede remover al owner del equipo" },
        { status: 400 }
      )
    }

    // 1. Eliminar el documento del miembro
    await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(memberToRemove)
      .delete()

    // 2. Actualizar el array teams del usuario
    await db.collection("users").doc(memberToRemove).update({
      teams: db.FieldValue.arrayRemove(teamId),
      updatedAt: new Date(),
    })

    // 3. Reasignar tareas asignadas a este miembro (opcional: asignar a null)
    const tasksSnapshot = await db
      .collection("tasks")
      .where("teamId", "==", teamId)
      .where("assignedTo", "==", memberToRemove)
      .get()

    if (!tasksSnapshot.empty) {
      const updateTasksPromises = tasksSnapshot.docs.map(doc =>
        doc.ref.update({
          assignedTo: null,
          updatedAt: new Date(),
        })
      )
      await Promise.all(updateTasksPromises)
    }

    console.log(`✅ Miembro ${memberToRemove} removido del equipo ${teamId}`)

    return NextResponse.json({
      message: isSelfRemoval
        ? "Has abandonado el equipo exitosamente"
        : "Miembro removido exitosamente",
      tasksReassigned: tasksSnapshot.size,
    })
  } catch (error: any) {
    console.error("Error al remover miembro:", error)

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
