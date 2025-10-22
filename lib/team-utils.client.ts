import type { Team } from "@/types/task"

/**
 * Verifica el estado de suscripción de un equipo
 * Similar a checkSubscriptionStatus pero para teams
 * Esta es una función client-safe (no usa Firebase Admin)
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
