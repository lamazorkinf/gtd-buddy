import { z } from 'zod';

// GTD Categories
export const GTDCategory = z.enum([
  'inbox',
  'nextActions',
  'multiStep',
  'waiting',
  'someday'
]);
export type GTDCategory = z.infer<typeof GTDCategory>;

// Priority levels
export const Priority = z.enum(['baja', 'media', 'alta']);
export type Priority = z.infer<typeof Priority>;

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

// Tool schemas
export const createTaskSchema = z.object({
  title: z.string().min(1).describe('Task title'),
  description: z.string().optional().describe('Task description'),
  userId: z.string().describe('User ID who owns the task'),
  category: GTDCategory.optional().describe('GTD category (defaults to inbox)'),
  priority: Priority.optional().describe('Task priority (defaults to media)'),
  contextId: z.string().optional().describe('Context ID for the task'),
  energyLevel: z.number().min(1).max(5).optional().describe('Energy level required (1-5)'),
  dueDate: z.string().optional().describe('Due date in ISO format'),
  isQuickAction: z.boolean().optional().describe('Is this a 2-minute task?'),
});

export const updateTaskSchema = z.object({
  taskId: z.string().describe('Task ID to update'),
  title: z.string().optional().describe('New task title'),
  description: z.string().optional().describe('New task description'),
  category: GTDCategory.optional().describe('New GTD category'),
  priority: Priority.optional().describe('New priority'),
  contextId: z.string().optional().describe('New context ID'),
  energyLevel: z.number().min(1).max(5).optional().describe('New energy level'),
  dueDate: z.string().optional().describe('New due date in ISO format'),
  completed: z.boolean().optional().describe('Mark as completed/uncompleted'),
  isQuickAction: z.boolean().optional().describe('Update quick action status'),
});

export const listTasksSchema = z.object({
  userId: z.string().describe('User ID to filter tasks'),
  category: GTDCategory.optional().describe('Filter by GTD category'),
  contextId: z.string().optional().describe('Filter by context'),
  completed: z.boolean().optional().describe('Filter by completion status'),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().describe('Task ID to delete'),
});

export const createContextSchema = z.object({
  name: z.string().min(1).describe('Context name'),
  userId: z.string().describe('User ID who owns the context'),
  color: z.string().optional().describe('Context color (hex format)'),
  icon: z.string().optional().describe('Context icon (emoji)'),
});

export const listContextsSchema = z.object({
  userId: z.string().describe('User ID to list contexts for'),
});
