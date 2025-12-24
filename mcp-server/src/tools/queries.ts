import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDb } from "../firebase.js";
import type { TaskDocument, SubtaskDocument } from "../types.js";

// Helper to convert Firestore timestamps to ISO strings
function convertTaskToResponse(id: string, data: TaskDocument): object {
  return {
    id,
    title: data.title,
    description: data.description || null,
    category: data.category,
    completed: data.completed,
    contextId: data.contextId || null,
    estimatedMinutes: data.estimatedMinutes || null,
    isQuickAction: data.isQuickAction || false,
    dueDate: data.dueDate?.toDate?.()?.toISOString() || null,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    subtasks: data.subtasks?.map((st: SubtaskDocument) => ({
      id: st.id,
      title: st.title,
      completed: st.completed
    })) || []
  };
}

export function registerQueryTools(server: McpServer, userId: string): void {
  const db = getDb();

  // Get Inbox tasks
  server.tool(
    "get_inbox",
    "Get all tasks in the Inbox (unprocessed items that need to be categorized)",
    {
      limit: z.number().min(1).max(100).optional().default(50).describe("Maximum tasks to return")
    },
    async (args) => {
      const snapshot = await db.collection("tasks")
        .where("userId", "==", userId)
        .where("teamId", "==", null)
        .where("category", "==", "Inbox")
        .where("completed", "==", false)
        .orderBy("createdAt", "desc")
        .limit(args.limit ?? 50)
        .get();

      const tasks = snapshot.docs.map(doc =>
        convertTaskToResponse(doc.id, doc.data() as TaskDocument)
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            inbox: tasks,
            count: tasks.length,
            message: tasks.length === 0
              ? "Inbox is empty! Great job processing your tasks."
              : `You have ${tasks.length} item(s) to process in your Inbox.`
          }, null, 2)
        }]
      };
    }
  );

  // Get today's tasks
  server.tool(
    "get_today",
    "Get all tasks due today (not completed)",
    {
      limit: z.number().min(1).max(100).optional().default(50).describe("Maximum tasks to return")
    },
    async (args) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const snapshot = await db.collection("tasks")
        .where("userId", "==", userId)
        .where("teamId", "==", null)
        .where("dueDate", ">=", today)
        .where("dueDate", "<", tomorrow)
        .where("completed", "==", false)
        .limit(args.limit ?? 50)
        .get();

      const tasks = snapshot.docs.map(doc =>
        convertTaskToResponse(doc.id, doc.data() as TaskDocument)
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            today: tasks,
            count: tasks.length,
            date: today.toISOString().split("T")[0],
            message: tasks.length === 0
              ? "No tasks due today."
              : `You have ${tasks.length} task(s) due today.`
          }, null, 2)
        }]
      };
    }
  );

  // Get overdue tasks
  server.tool(
    "get_overdue",
    "Get all overdue tasks (past due date, not completed)",
    {
      limit: z.number().min(1).max(100).optional().default(50).describe("Maximum tasks to return")
    },
    async (args) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const snapshot = await db.collection("tasks")
        .where("userId", "==", userId)
        .where("teamId", "==", null)
        .where("dueDate", "<", today)
        .where("completed", "==", false)
        .orderBy("dueDate", "asc")
        .limit(args.limit ?? 50)
        .get();

      const tasks = snapshot.docs.map(doc =>
        convertTaskToResponse(doc.id, doc.data() as TaskDocument)
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            overdue: tasks,
            count: tasks.length,
            message: tasks.length === 0
              ? "No overdue tasks. You're on track!"
              : `You have ${tasks.length} overdue task(s) that need attention!`
          }, null, 2)
        }]
      };
    }
  );

  // Get quick actions
  server.tool(
    "get_quick_actions",
    "Get all 2-minute quick actions (tasks that can be done quickly)",
    {
      limit: z.number().min(1).max(50).optional().default(20).describe("Maximum tasks to return")
    },
    async (args) => {
      const snapshot = await db.collection("tasks")
        .where("userId", "==", userId)
        .where("teamId", "==", null)
        .where("isQuickAction", "==", true)
        .where("completed", "==", false)
        .limit(args.limit ?? 20)
        .get();

      const tasks = snapshot.docs.map(doc =>
        convertTaskToResponse(doc.id, doc.data() as TaskDocument)
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            quickActions: tasks,
            count: tasks.length,
            tip: tasks.length > 0
              ? "Quick actions take less than 2 minutes. Do them now!"
              : "No quick actions pending."
          }, null, 2)
        }]
      };
    }
  );

  // Get tasks by context
  server.tool(
    "get_by_context",
    "Get all tasks for a specific context",
    {
      contextId: z.string().describe("Context ID (required)"),
      includeCompleted: z.boolean().optional().default(false).describe("Include completed tasks"),
      limit: z.number().min(1).max(100).optional().default(50).describe("Maximum tasks to return")
    },
    async (args) => {
      let query: FirebaseFirestore.Query = db.collection("tasks")
        .where("userId", "==", userId)
        .where("teamId", "==", null)
        .where("contextId", "==", args.contextId);

      if (!args.includeCompleted) {
        query = query.where("completed", "==", false);
      }

      const snapshot = await query.limit(args.limit ?? 50).get();

      const tasks = snapshot.docs.map(doc =>
        convertTaskToResponse(doc.id, doc.data() as TaskDocument)
      );

      // Get context name
      const contextDoc = await db.collection("contexts").doc(args.contextId).get();
      const contextName = contextDoc.exists ? (contextDoc.data() as { name: string }).name : "Unknown";

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            context: { id: args.contextId, name: contextName },
            tasks,
            count: tasks.length
          }, null, 2)
        }]
      };
    }
  );

  // Search tasks
  server.tool(
    "search_tasks",
    "Search tasks by title or description (case-insensitive)",
    {
      query: z.string().min(1).describe("Search query"),
      includeCompleted: z.boolean().optional().default(false).describe("Include completed tasks"),
      limit: z.number().min(1).max(100).optional().default(20).describe("Maximum results to return")
    },
    async (args) => {
      // Firestore doesn't support full-text search, so we fetch and filter in memory
      // For production, consider Algolia or Elasticsearch
      let query: FirebaseFirestore.Query = db.collection("tasks")
        .where("userId", "==", userId)
        .where("teamId", "==", null);

      if (!args.includeCompleted) {
        query = query.where("completed", "==", false);
      }

      const snapshot = await query.limit(200).get(); // Fetch more for filtering

      const queryLower = args.query.toLowerCase();
      const tasks = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as TaskDocument) }))
        .filter(task =>
          task.title?.toLowerCase().includes(queryLower) ||
          task.description?.toLowerCase().includes(queryLower)
        )
        .slice(0, args.limit ?? 20)
        .map(task => convertTaskToResponse(task.id, task as TaskDocument));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            query: args.query,
            results: tasks,
            count: tasks.length
          }, null, 2)
        }]
      };
    }
  );

  // Get next actions
  server.tool(
    "get_next_actions",
    "Get all tasks in 'Próximas acciones' category (next actions to do)",
    {
      contextId: z.string().optional().describe("Filter by context ID"),
      limit: z.number().min(1).max(100).optional().default(50).describe("Maximum tasks to return")
    },
    async (args) => {
      let query: FirebaseFirestore.Query = db.collection("tasks")
        .where("userId", "==", userId)
        .where("teamId", "==", null)
        .where("category", "==", "Próximas acciones")
        .where("completed", "==", false);

      if (args.contextId) {
        query = query.where("contextId", "==", args.contextId);
      }

      query = query.orderBy("createdAt", "desc").limit(args.limit ?? 50);

      const snapshot = await query.get();

      const tasks = snapshot.docs.map(doc =>
        convertTaskToResponse(doc.id, doc.data() as TaskDocument)
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            nextActions: tasks,
            count: tasks.length,
            message: tasks.length === 0
              ? "No next actions defined. Process your Inbox!"
              : `You have ${tasks.length} next action(s) ready to do.`
          }, null, 2)
        }]
      };
    }
  );

  // Get summary/dashboard
  server.tool(
    "get_summary",
    "Get a summary of all tasks: counts by category, overdue, today, etc.",
    {},
    async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch all incomplete tasks
      const snapshot = await db.collection("tasks")
        .where("userId", "==", userId)
        .where("teamId", "==", null)
        .where("completed", "==", false)
        .get();

      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as TaskDocument),
        dueDateMs: doc.data().dueDate?.toDate?.()?.getTime() || null
      }));

      // Calculate counts
      const inbox = tasks.filter(t => t.category === "Inbox").length;
      const nextActions = tasks.filter(t => t.category === "Próximas acciones").length;
      const multitask = tasks.filter(t => t.category === "Multitarea").length;
      const waiting = tasks.filter(t => t.category === "A la espera").length;
      const someday = tasks.filter(t => t.category === "Algún día").length;

      const todayStart = today.getTime();
      const tomorrowStart = tomorrow.getTime();

      const overdue = tasks.filter(t =>
        t.dueDateMs && t.dueDateMs < todayStart
      ).length;

      const dueToday = tasks.filter(t =>
        t.dueDateMs && t.dueDateMs >= todayStart && t.dueDateMs < tomorrowStart
      ).length;

      const quickActions = tasks.filter(t => t.isQuickAction).length;

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summary: {
              total: tasks.length,
              byCategory: {
                "Inbox": inbox,
                "Próximas acciones": nextActions,
                "Multitarea": multitask,
                "A la espera": waiting,
                "Algún día": someday
              },
              overdue,
              dueToday,
              quickActions
            },
            alerts: [
              overdue > 0 ? `${overdue} overdue task(s)!` : null,
              inbox > 10 ? `Inbox has ${inbox} items - time to process!` : null,
              dueToday > 0 ? `${dueToday} task(s) due today` : null
            ].filter(Boolean),
            date: today.toISOString().split("T")[0]
          }, null, 2)
        }]
      };
    }
  );
}
