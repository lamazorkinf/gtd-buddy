// GTD Categories
export type GTDCategory = 'inbox' | 'nextActions' | 'multiStep' | 'waiting' | 'someday';

// Priority levels
export type Priority = 'baja' | 'media' | 'alta';

// Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  userId: string;
  category: GTDCategory;
  priority: Priority;
  contextId?: string;
  energyLevel: number;
  dueDate: Date | null;
  completed: boolean;
  completedAt?: Date;
  isQuickAction: boolean;
  subtasks: Subtask[];
  createdAt: Date;
  updatedAt: Date;
}

// Subtask interface
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

// Context interface
export interface Context {
  id: string;
  name: string;
  userId: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}