#!/usr/bin/env node
import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeFirebase } from "./firebase.js";
import { createMcpServer } from "./server.js";

function getUserId(): string {
  const userId = process.env.GTD_USER_ID;
  if (!userId) {
    console.error("Error: GTD_USER_ID environment variable is required");
    console.error("Set it to your Firebase user ID to access your tasks");
    process.exit(1);
  }
  return userId;
}

async function main() {
  const userId = getUserId();

  // Initialize Firebase Admin SDK
  try {
    initializeFirebase();
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    process.exit(1);
  }

  // Create MCP server with all tools
  const server = createMcpServer(userId);

  // Connect using stdio transport (for Claude Desktop/Code)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error("GTD-Buddy MCP Server started (stdio)");
  console.error(`User ID: ${userId}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
