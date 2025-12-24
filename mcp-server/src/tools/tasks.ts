import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../firebase.js";
import { GTD_CATEGORIES, type GTDCategory, type TaskDocument, type SubtaskDocument } from "../types.js";

// Zod schema for GTD categories
const categorySchema = z.enum(GTD_CATEGORIES as [GTDCategory, ...GTDCategory[]]);

// Helper to convert Firestore timestamps to ISO strings
function convertTaskToResponse(id: string, data: TaskDocument): object {
  return {
    id,
    title: data.title,
    description: data.description || null,
    category: data.category,
    completed: data.completed,
    userId: data.userId,
    contextId: data.contextId || null,
    estimatedMinutes: data.estimatedMinutes || null,
    isQuickAction: data.isQuickAction || false,
    teamId: data.teamId || null,
    assignedTo: data.assignedTo || null,
    dueDate: data.dueDate?.toDate?.()?.toISOString() || null,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    lastReviewed: data.lastReviewed?.toDate?.()?.toISOString() || null,
    subtasks: data.subtasks?.map((st: SubtaskDocument) => ({
      id: st.id,
      title: st.title,
      completed: st.completed,
      dueDate: st.dueDate?.toDate?.()?.toISOString() || null
    })) || []
  };
}

export function registerTaskTools(server: McpServer, userId: string): void {
  const db = getDb();

  // List tasks
  server.tool(
    "list_tasks",
    "List all tasks with optional filters by category, context, or completion status",
    {
      category: categorySchema.optional().describe("Filter by GTD category"),
      contextId: z.string().optional().describe("Filter by context ID"),
      completed: z.boolean().optional().describe("Filter by completion status"),
      limit: z.number().min(1).max(100).optional().default(50).describe("Maximum tasks to return")
    },
    async (args) => {
      let query: FirebaseFirestore.Query = db.collection("tasks")
        .where("userId", "==", userId)
        .where("teamId", "==", null);

      if (args.category) {
        query = query.where("category", "==", args.category);
      }
      if (args.contextId) {
        query = query.where("contextId", "==", args.contextId);
      }
      if (args.completed !== undefined) {
        query = query.where("completed", "==", args.completed);
      }

      query = query.orderBy("createdAt", "desc").limit(args.limit ?? 50);

      const snapshot = await query.get();
      const tasks = snapshot.docs.map(doc =>
        convertTaskToResponse(doc.id, doc.data() as TaskDocument)
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ tasks, count: tasks.length }, null, 2)
        }]
      };
    }
  );

  // Create task
  server.tool(
    "create_task",
    "Create a new GTD task. Defaults to Inbox category if not specified.",
    {
      title: z.string().min(1).max(200).describe("Task title (required)"),
      category: categorySchema.optional().default("Inbox").describe("GTD category"),
      description: z.string().max(2000).optional().describe("Task description"),
      dueDate: z.string().optional().describe("Due date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)"),
      contextId: z.string().optional().describe("Context ID to associate with this task"),
      estimatedMinutes: z.number().min(1).max(480).optional().describe("Estimated time in minutes"),
      isQuickAction: z.boolean().optional().default(false).describe("Mark as 2-minute quick action"),
      subtasks: z.array(z.object({
        title: z.string().min(1).describe("Subtask title"),
        completed: z.boolean().optional().default(false).describe("Subtask completion status")
      })).optional().describe("Array of subtasks (for Multitarea category)")
    },
    async (args) => {
      const taskData: Record<string, unknown> = {
        title: args.title.trim(),
        category: args.category || "Inbox",
        completed: false,
        userId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        isQuickAction: args.isQuickAction || false,
        teamId: null,
        assignedTo: null
      };

      if (args.description) {
        taskData.description = args.description.trim();
      }
      if (args.contextId) {
        taskData.contextId = args.contextId;
      }
      if (args.estimatedMinutes) {
        taskData.estimatedMinutes = args.estimatedMinutes;
      }
      if (args.dueDate) {
        taskData.dueDate = new Date(args.dueDate);
      }
      if (args.subtasks && args.subtasks.length > 0) {
        taskData.subtasks = args.subtasks.map((st, i) => ({
          id: `st-${Date.now()}-${i}`,
          title: st.title.trim(),
          completed: st.completed || false
        }));
      }

      const docRef = await db.collection("tasks").add(taskData);
      const created = await docRef.get();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            task: convertTaskToResponse(created.id, created.data() as TaskDocument),
            message: `Task "${args.title}" created in ${args.category || "Inbox"}`
          }, null, 2)
        }]
      };
    }
  );

  // Update task
  server.tool(
    "update_task",
    "Update an existing task. Only provided fields will be updated.",
    {
      taskId: z.string().describe("Task ID to update (required)"),
      title: z.string().min(1).max(200).optional().describe("New title"),
      description: z.string().max(2000).nullable().optional().describe("New description (null to clear)"),
      category: categorySchema.optional().describe("New GTD category"),
      dueDate: z.string().nullable().optional().describe("New due date (null to clear)"),
      contextId: z.string().nullable().optional().describe("New context ID (null to clear)"),
      estimatedMinutes: z.number().min(1).max(480).nullable().optional().describe("New time estimate (null to clear)"),
      isQuickAction: z.boolean().optional().describe("Quick action flag"),
      completed: z.boolean().optional().describe("Completion status")
    },
    async (args) => {
      const { taskId, ...updates } = args;
      const taskRef = db.collection("tasks").doc(taskId);
      const task = await taskRef.get();

      if (!task.exists) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Task not found" }) }],
          isError: true
        };
      }

      // Verify ownership
      const taskData = task.data() as TaskDocument;
      if (taskData.userId !== userId) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Access denied" }) }],
          isError: true
        };
      }

      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp()
      };

      if (updates.title !== undefined) updateData.title = updates.title.trim();
      if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.dueDate !== undefined) {
        updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
      }
      if (updates.contextId !== undefined) updateData.contextId = updates.contextId;
      if (updates.estimatedMinutes !== undefined) updateData.estimatedMinutes = updates.estimatedMinutes;
      if (updates.isQuickAction !== undefined) updateData.isQuickAction = updates.isQuickAction;
      if (updates.completed !== undefined) updateData.completed = updates.completed;

      await taskRef.update(updateData);

      const updatedDoc = await taskRef.get();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            task: convertTaskToResponse(updatedDoc.id, updatedDoc.data() as TaskDocument),
            message: "Task updated",
            updatedFields: Object.keys(updateData).filter(k => k !== "updatedAt")
          }, null, 2)
        }]
      };
    }
  );

  // Delete task
  server.tool(
    "delete_task",
    "Permanently delete a task. This action cannot be undone.",
    {
      taskId: z.string().describe("Task ID to delete (required)")
    },
    async (args) => {
      const taskRef = db.collection("tasks").doc(args.taskId);
      const task = await taskRef.get();

      if (!task.exists) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Task not found" }) }],
          isError: true
        };
      }

      const taskData = task.data() as TaskDocument;
      if (taskData.userId !== userId) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Access denied" }) }],
          isError: true
        };
      }

      const title = taskData.title;
      await taskRef.delete();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, message: `Task "${title}" deleted` })
        }]
      };
    }
  );

  // Complete task
  server.tool(
    "complete_task",
    "Mark a task as completed or reopen it",
    {
      taskId: z.string().describe("Task ID (required)"),
      completed: z.boolean().default(true).describe("Set to true to complete, false to reopen")
    },
    async (args) => {
      const taskRef = db.collection("tasks").doc(args.taskId);
      const task = await taskRef.get();

      if (!task.exists) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Task not found" }) }],
          isError: true
        };
      }

      const taskData = task.data() as TaskDocument;
      if (taskData.userId !== userId) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Access denied" }) }],
          isError: true
        };
      }

      await taskRef.update({
        completed: args.completed,
        updatedAt: FieldValue.serverTimestamp()
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            taskId: args.taskId,
            title: taskData.title,
            message: args.completed ? "Task completed" : "Task reopened"
          })
        }]
      };
    }
  );

  // Move task (change category)
  server.tool(
    "move_task",
    "Move a task to a different GTD category",
    {
      taskId: z.string().describe("Task ID (required)"),
      category: categorySchema.describe("Target GTD category (required)")
    },
    async (args) => {
      const taskRef = db.collection("tasks").doc(args.taskId);
      const task = await taskRef.get();

      if (!task.exists) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Task not found" }) }],
          isError: true
        };
      }

      const taskData = task.data() as TaskDocument;
      if (taskData.userId !== userId) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Access denied" }) }],
          isError: true
        };
      }

      const oldCategory = taskData.category;
      await taskRef.update({
        category: args.category,
        updatedAt: FieldValue.serverTimestamp()
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            taskId: args.taskId,
            title: taskData.title,
            message: `Task moved from "${oldCategory}" to "${args.category}"`
          })
        }]
      };
    }
  );
}
