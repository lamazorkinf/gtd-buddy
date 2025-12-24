// GTD Categories - Spanish UI
export type GTDCategory = "Inbox" | "Próximas acciones" | "Multitarea" | "A la espera" | "Algún día"

// All valid GTD categories as array for validation
export const GTD_CATEGORIES: GTDCategory[] = [
  "Inbox",
  "Próximas acciones",
  "Multitarea",
  "A la espera",
  "Algún día"
]

export interface Subtask {
  id: string
  title: string
  completed: boolean
  dueDate?: Date
}

export interface Task {
  id: string
  title: string
  description?: string
  category: GTDCategory
  dueDate?: Date
  completed: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
  contextId?: string
  estimatedMinutes?: number
  isQuickAction?: boolean
  lastReviewed?: Date
  subtasks?: Subtask[]
  teamId?: string | null
  assignedTo?: string
}

export interface Context {
  id: string
  name: string
  description?: string
  status?: "active" | "inactive"
  userId: string
  teamId?: string | null
  createdAt: Date
  updatedAt?: Date
  lastReviewed?: Date
}

// Firestore document data (before conversion)
export interface TaskDocument {
  title: string
  description?: string
  category: GTDCategory
  dueDate?: FirebaseFirestore.Timestamp | null
  completed: boolean
  userId: string
  createdAt: FirebaseFirestore.Timestamp
  updatedAt: FirebaseFirestore.Timestamp
  contextId?: string
  estimatedMinutes?: number
  isQuickAction?: boolean
  lastReviewed?: FirebaseFirestore.Timestamp
  subtasks?: SubtaskDocument[]
  teamId?: string | null
  assignedTo?: string
}

export interface SubtaskDocument {
  id: string
  title: string
  completed: boolean
  dueDate?: FirebaseFirestore.Timestamp
}

export interface ContextDocument {
  name: string
  description?: string
  status?: "active" | "inactive"
  userId: string
  teamId?: string | null
  createdAt: FirebaseFirestore.Timestamp
  updatedAt?: FirebaseFirestore.Timestamp
  lastReviewed?: FirebaseFirestore.Timestamp
}
