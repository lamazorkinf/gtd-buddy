import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdmin, verifyAuthToken } from "@/lib/firebase-admin"
import { isTeamOwner } from "@/lib/team-utils"
import type { TeamRole } from "@/types/task"

// PUT - Cambiar rol de un miembro
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

    // Solo el owner puede cambiar roles
    const isOwner = await isTeamOwner(userId, teamId)
    if (!isOwner) {
      return NextResponse.json(
        { error: "Solo el owner puede cambiar roles de miembros" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId: targetUserId, newRole } = body

    // Validaciones
    if (!targetUserId || !newRole) {
      return NextResponse.json(
        { error: "userId y newRole son requeridos" },
        { status: 400 }
      )
    }

    const validRoles: TeamRole[] = ["owner", "admin", "member"]
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Rol inválido. Debe ser: owner, admin o member" },
        { status: 400 }
      )
    }

    // Obtener datos del miembro
    const memberRef = db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(targetUserId)

    const memberDoc = await memberRef.get()

    if (!memberDoc.exists) {
      return NextResponse.json(
        { error: "El miembro no existe en este equipo" },
        { status: 404 }
      )
    }

    const memberData = memberDoc.data()

    // No permitir cambiar el rol del owner actual (excepto si se está transfiriendo ownership)
    if (memberData?.role === "owner" && newRole !== "owner") {
      return NextResponse.json(
        { error: "Para cambiar el rol del owner, debes transferir la propiedad del equipo" },
        { status: 400 }
      )
    }

    // Si se está transfiriendo ownership (newRole === "owner")
    if (newRole === "owner") {
      // El owner actual debe convertirse en admin
      const currentOwnerRef = db
        .collection("teams")
        .doc(teamId)
        .collection("members")
        .doc(userId)

      await currentOwnerRef.update({
        role: "admin",
      })

      // Actualizar el ownerId en el documento del equipo
      await db.collection("teams").doc(teamId).update({
        ownerId: targetUserId,
        updatedAt: new Date(),
      })

      console.log(`✅ Ownership transferido de ${userId} a ${targetUserId} en equipo ${teamId}`)
    }

    // Actualizar el rol del miembro objetivo
    await memberRef.update({
      role: newRole,
    })

    console.log(`✅ Rol actualizado: usuario ${targetUserId} ahora es ${newRole} en equipo ${teamId}`)

    return NextResponse.json({
      message: newRole === "owner"
        ? "Propiedad del equipo transferida exitosamente"
        : "Rol de miembro actualizado exitosamente",
      newRole,
      targetUserId,
    })
  } catch (error: any) {
    console.error("Error al cambiar rol:", error)

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
