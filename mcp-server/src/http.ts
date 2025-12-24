#!/usr/bin/env node
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { initializeFirebase } from "./firebase.js";
import { createMcpServer } from "./server.js";

// Configuration
const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Debug log storage (last 50 entries)
const debugLogs: { timestamp: string; type: string; data: unknown }[] = [];
function addLog(type: string, data: unknown) {
  debugLogs.push({
    timestamp: new Date().toISOString(),
    type,
    data
  });
  if (debugLogs.length > 50) debugLogs.shift();
  console.log(`[${type}]`, JSON.stringify(data).slice(0, 500));
}

function getUserId(): string {
  const userId = process.env.GTD_USER_ID;
  if (!userId) {
    console.error("Error: GTD_USER_ID environment variable is required");
    process.exit(1);
  }
  return userId;
}

async function main() {
  const userId = getUserId();

  // Initialize Firebase
  try {
    initializeFirebase();
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    process.exit(1);
  }

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", server: "gtd-buddy-mcp", userId });
  });

  // Debug endpoint - view recent logs
  app.get("/debug", (_req: Request, res: Response) => {
    res.json({
      logs: debugLogs,
      activeSessions: transports.size,
      userId
    });
  });

  // Store transports for session management
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // MCP endpoint - handles all MCP protocol messages
  app.all("/mcp", async (req: Request, res: Response) => {
    addLog("MCP_REQUEST", {
      method: req.method,
      headers: {
        "content-type": req.headers["content-type"],
        "mcp-session-id": req.headers["mcp-session-id"]
      },
      body: req.body
    });

    // Get or create session ID
    const sessionId = req.headers["mcp-session-id"] as string || "default";

    let transport = transports.get(sessionId);

    // Create new transport and server for new sessions
    if (!transport) {
      console.log(`New MCP session: ${sessionId}`);

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        onsessioninitialized: (id) => {
          console.log(`Session initialized: ${id}`);
        }
      });

      // Create and connect MCP server
      const server = createMcpServer(userId);
      await server.connect(transport);

      transports.set(sessionId, transport);

      // Clean up on close
      transport.onclose = () => {
        console.log(`Session closed: ${sessionId}`);
        transports.delete(sessionId);
      };
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  });

  // DELETE endpoint for session cleanup
  app.delete("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string;

    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId)!;
      await transport.close();
      transports.delete(sessionId);
      res.json({ status: "session closed" });
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  });

  // Start server
  app.listen(PORT, HOST, () => {
    console.log(`GTD-Buddy MCP Server (HTTP) running at http://${HOST}:${PORT}`);
    console.log(`MCP endpoint: http://${HOST}:${PORT}/mcp`);
    console.log(`User ID: ${userId}`);
    console.log("");
    console.log("For ElevenLabs, use:");
    console.log(`  URL: http://your-server:${PORT}/mcp`);
    console.log("  Transport: Streamable HTTP");
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
