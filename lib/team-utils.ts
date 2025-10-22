import { getFirebaseAdmin } from "./firebase-admin"
import type { Team, TeamMember, TeamRole, TeamSubscriptionStatus } from "@/types/task"

/**
 * Verifica el estado de suscripción de un equipo
 * Similar a checkSubscriptionStatus pero para teams
 */
export function checkTeamSubscriptionStatus(team: Team) {
  const now = new Date()

  // Si el equipo está en trial
  if (team.subscriptionStatus === "trial" && team.subscriptionEndDate) {
    const trialEnd = team.subscriptionEndDate instanceof Date
      ? team.subscriptionEndDate
      : team.subscriptionEndDate.toDate()

    if (now > trialEnd) {
      return {
        isActive: false,
        isExpired: true,
        isInTrial: false,
        canAccessTeam: false,
        reason: "trial_expired"
      }
    }
    return {
      isActive: true,
      isExpired: false,
      isInTrial: true,
      canAccessTeam: true,
      reason: "trial_active"
    }
  }

  // Si tiene suscripción activa
  if (team.subscriptionStatus === "active") {
    if (team.subscriptionEndDate) {
      const endDate = team.subscriptionEndDate instanceof Date
        ? team.subscriptionEndDate
        : team.subscriptionEndDate.toDate()

      if (now > endDate) {
        return {
          isActive: false,
          isExpired: true,
          isInTrial: false,
          canAccessTeam: false,
          reason: "subscription_expired"
        }
      }
    }
    return {
      isActive: true,
      isExpired: false,
      isInTrial: false,
      canAccessTeam: true,
      reason: "active"
    }
  }

  // Si está pendiente de cancelación, mantener acceso hasta la fecha de fin
  if (team.subscriptionStatus === "pending_cancellation" && team.subscriptionEndDate) {
    const endDate = team.subscriptionEndDate instanceof Date
      ? team.subscriptionEndDate
      : team.subscriptionEndDate.toDate()

    if (now <= endDate) {
      return {
        isActive: true,
        isExpired: false,
        isInTrial: false,
        canAccessTeam: true,
        reason: "pending_cancellation_active"
      }
    }
  }

  // Estados inactivos o sin suscripción
  return {
    isActive: false,
    isExpired: true,
    isInTrial: false,
    canAccessTeam: false,
    reason: "inactive"
  }
}

/**
 * Verifica si un usuario es miembro de un equipo
 */
export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const { db } = getFirebaseAdmin()

  try {
    const memberDoc = await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(userId)
      .get()

    return memberDoc.exists
  } catch (error) {
    console.error(`Error verificando membresía: ${error}`)
    return false
  }
}

/**
 * Verifica si un usuario es admin u owner de un equipo
 */
export async function isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const { db } = getFirebaseAdmin()

  try {
    const memberDoc = await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(userId)
      .get()

    if (!memberDoc.exists) return false

    const memberData = memberDoc.data() as TeamMember
    return memberData.role === "admin" || memberData.role === "owner"
  } catch (error) {
    console.error(`Error verificando rol de admin: ${error}`)
    return false
  }
}

/**
 * Verifica si un usuario es owner de un equipo
 */
export async function isTeamOwner(userId: string, teamId: string): Promise<boolean> {
  const { db } = getFirebaseAdmin()

  try {
    const teamDoc = await db.collection("teams").doc(teamId).get()

    if (!teamDoc.exists) return false

    const teamData = teamDoc.data() as Team
    return teamData.ownerId === userId
  } catch (error) {
    console.error(`Error verificando ownership: ${error}`)
    return false
  }
}

/**
 * Obtiene el rol de un usuario en un equipo
 */
export async function getTeamMemberRole(userId: string, teamId: string): Promise<TeamRole | null> {
  const { db } = getFirebaseAdmin()

  try {
    const memberDoc = await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(userId)
      .get()

    if (!memberDoc.exists) return null

    const memberData = memberDoc.data() as TeamMember
    return memberData.role
  } catch (error) {
    console.error(`Error obteniendo rol: ${error}`)
    return null
  }
}

/**
 * Obtiene todos los equipos de un usuario
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  const { db } = getFirebaseAdmin()

  try {
    // Query usando collectionGroup para buscar en todas las subcollections "members"
    const membersSnapshot = await db
      .collectionGroup("members")
      .where("userId", "==", userId)
      .get()

    const teamIds = membersSnapshot.docs.map(doc => doc.ref.parent.parent?.id).filter(Boolean) as string[]

    if (teamIds.length === 0) return []

    // Obtener los datos de los equipos
    const teamsPromises = teamIds.map(teamId =>
      db.collection("teams").doc(teamId).get()
    )

    const teamsDocs = await Promise.all(teamsPromises)

    return teamsDocs
      .filter(doc => doc.exists)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate(),
        updatedAt: doc.data()?.updatedAt?.toDate(),
        subscriptionEndDate: doc.data()?.subscriptionEndDate?.toDate(),
        trialStartDate: doc.data()?.trialStartDate?.toDate(),
      })) as Team[]
  } catch (error) {
    console.error(`Error obteniendo equipos del usuario: ${error}`)
    return []
  }
}

/**
 * Obtiene todos los miembros de un equipo
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { db } = getFirebaseAdmin()

  try {
    const membersSnapshot = await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .orderBy("joinedAt", "desc")
      .get()

    return membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toDate(),
    })) as TeamMember[]
  } catch (error) {
    console.error(`Error obteniendo miembros del equipo: ${error}`)
    return []
  }
}
