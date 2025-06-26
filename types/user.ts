export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL?: string | null
  subscriptionStatus?: "active" | "pending_payment" | "inactive" | "trial" | "test"
  subscriptionEndDate?: any // Firestore Timestamp or Date
  firstName?: string
  lastName?: string
  role?: "user" | "test"
  trialStartDate?: any // Firestore Timestamp
  // Eliminar isInTrialPeriod - ya no es necesario
}
