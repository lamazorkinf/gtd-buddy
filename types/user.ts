export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL?: string | null
  subscriptionStatus?: "active" | "pending_payment" | "inactive"
  // Otros campos que puedas necesitar
}
