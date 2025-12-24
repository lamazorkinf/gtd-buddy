import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../firebase.js";
import type { ContextDocument } from "../types.js";

// Helper to convert Firestore timestamps to ISO strings
function convertContextToResponse(id: string, data: ContextDocument): object {
  return {
    id,
    name: data.name,
    description: data.description || null,
    status: data.status || "active",
    userId: data.userId,
    teamId: data.teamId || null,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    lastReviewed: data.lastReviewed?.toDate?.()?.toISOString() || null
  };
}

export function registerContextTools(server: McpServer, userId: string): void {
  const db = getDb();

  // List contexts
  server.tool(
    "list_contexts",
    "List all GTD contexts. Contexts represent locations or situations where tasks can be done (e.g., @home, @office, @phone).",
    {
      status: z.enum(["active", "inactive"]).optional().describe("Filter by status (default: returns all)")
    },
    async (args) => {
      let query: FirebaseFirestore.Query = db.collection("contexts")
        .where("userId", "==", userId);

      if (args.status) {
        query = query.where("status", "==", args.status);
      }

      query = query.orderBy("name");

      const snapshot = await query.get();
      const contexts = snapshot.docs.map(doc =>
        convertContextToResponse(doc.id, doc.data() as ContextDocument)
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ contexts, count: contexts.length }, null, 2)
        }]
      };
    }
  );

  // Create context
  server.tool(
    "create_context",
    "Create a new GTD context. Use contexts to organize tasks by location or situation (e.g., @home, @office, @phone, @computer).",
    {
      name: z.string().min(1).max(100).describe("Context name (e.g., '@home', '@office', 'errands')"),
      description: z.string().max(500).optional().describe("Description of when to use this context"),
      status: z.enum(["active", "inactive"]).optional().default("active").describe("Context status")
    },
    async (args) => {
      // Check if context with same name already exists
      const existing = await db.collection("contexts")
        .where("userId", "==", userId)
        .where("name", "==", args.name.trim())
        .limit(1)
        .get();

      if (!existing.empty) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Context "${args.name}" already exists`
            })
          }],
          isError: true
        };
      }

      const contextData = {
        name: args.name.trim(),
        description: args.description?.trim() || "",
        status: args.status || "active",
        userId,
        teamId: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const docRef = await db.collection("contexts").add(contextData);
      const created = await docRef.get();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            context: convertContextToResponse(created.id, created.data() as ContextDocument),
            message: `Context "${args.name}" created`
          }, null, 2)
        }]
      };
    }
  );

  // Update context
  server.tool(
    "update_context",
    "Update an existing context",
    {
      contextId: z.string().describe("Context ID to update (required)"),
      name: z.string().min(1).max(100).optional().describe("New name"),
      description: z.string().max(500).nullable().optional().describe("New description (null to clear)"),
      status: z.enum(["active", "inactive"]).optional().describe("New status")
    },
    async (args) => {
      const { contextId, ...updates } = args;
      const contextRef = db.collection("contexts").doc(contextId);
      const context = await contextRef.get();

      if (!context.exists) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Context not found" }) }],
          isError: true
        };
      }

      const contextData = context.data() as ContextDocument;
      if (contextData.userId !== userId) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Access denied" }) }],
          isError: true
        };
      }

      // Check for duplicate name if name is being changed
      if (updates.name && updates.name.trim() !== contextData.name) {
        const existing = await db.collection("contexts")
          .where("userId", "==", userId)
          .where("name", "==", updates.name.trim())
          .limit(1)
          .get();

        if (!existing.empty) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Context "${updates.name}" already exists`
              })
            }],
            isError: true
          };
        }
      }

      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp()
      };

      if (updates.name !== undefined) updateData.name = updates.name.trim();
      if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
      if (updates.status !== undefined) updateData.status = updates.status;

      await contextRef.update(updateData);

      const updatedDoc = await contextRef.get();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            context: convertContextToResponse(updatedDoc.id, updatedDoc.data() as ContextDocument),
            message: "Context updated"
          }, null, 2)
        }]
      };
    }
  );

  // Delete context
  server.tool(
    "delete_context",
    "Delete a context. Tasks using this context will have their contextId cleared.",
    {
      contextId: z.string().describe("Context ID to delete (required)")
    },
    async (args) => {
      const contextRef = db.collection("contexts").doc(args.contextId);
      const context = await contextRef.get();

      if (!context.exists) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Context not found" }) }],
          isError: true
        };
      }

      const contextData = context.data() as ContextDocument;
      if (contextData.userId !== userId) {
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: "Access denied" }) }],
          isError: true
        };
      }

      const name = contextData.name;

      // Count tasks using this context
      const tasksWithContext = await db.collection("tasks")
        .where("userId", "==", userId)
        .where("contextId", "==", args.contextId)
        .count()
        .get();

      const affectedTasks = tasksWithContext.data().count;

      // Delete the context
      await contextRef.delete();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `Context "${name}" deleted`,
            affectedTasks,
            warning: affectedTasks > 0
              ? `${affectedTasks} task(s) were using this context and now have no context assigned`
              : undefined
          })
        }]
      };
    }
  );
}
