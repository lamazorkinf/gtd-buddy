import type { User } from "@/types/task"

export interface SubscriptionStatus {
  isActive: boolean
  isExpired: boolean
  isInTrial: boolean
  canAccessDashboard: boolean
  reason: string
}

export function checkSubscriptionStatus(user: User | null): SubscriptionStatus {
  if (!user) {
    return {
      isActive: false,
      isExpired: false,
      isInTrial: false,
      canAccessDashboard: false,
      reason: "No user found",
    }
  }

  // Usuario de prueba siempre tiene acceso
  if (user.role === "test" || user.subscriptionStatus === "test") {
    return {
      isActive: true,
      isExpired: false,
      isInTrial: false,
      canAccessDashboard: true,
      reason: "Test user",
    }
  }

  const now = new Date()

  // Verificar si tiene fecha de expiración
  if (user.subscriptionEndDate) {
    const endDate =
      user.subscriptionEndDate instanceof Date
        ? user.subscriptionEndDate
        : new Date((user.subscriptionEndDate as any)?.seconds * 1000 || user.subscriptionEndDate) // Firestore Timestamp

    const isExpired = now > endDate

    if (isExpired) {
      return {
        isActive: false,
        isExpired: true,
        isInTrial: false,
        canAccessDashboard: false,
        reason: "Subscription expired",
      }
    }

    // Si no ha expirado y tiene estado activo, trial, o pendiente de cancelación
    if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trial" || user.subscriptionStatus === "pending_cancellation") {
      return {
        isActive: user.subscriptionStatus !== "pending_cancellation",
        isExpired: false,
        isInTrial: user.subscriptionStatus === "trial",
        canAccessDashboard: true,
        reason: user.subscriptionStatus === "trial"
          ? "In trial period"
          : user.subscriptionStatus === "pending_cancellation"
          ? "Active until cancellation date"
          : "Active subscription",
      }
    }
  }

  // Verificar período de prueba solo con subscriptionStatus
  if (user.subscriptionStatus === "trial") {
    return {
      isActive: true,
      isExpired: false,
      isInTrial: true,
      canAccessDashboard: true,
      reason: "In trial period",
    }
  }

  // Por defecto, no tiene acceso
  return {
    isActive: false,
    isExpired: false,
    isInTrial: false,
    canAccessDashboard: false,
    reason: "No active subscription",
  }
}
