import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerContextTools } from "./tools/contexts.js";
import { registerQueryTools } from "./tools/queries.js";

export function createMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "gtd-buddy",
    version: "1.0.0"
  }, {
    capabilities: {
      tools: {}
    },
    instructions: `
GTD-Buddy MCP Server - Personal Task Management with GTD Methodology

This server provides tools to manage tasks and contexts following the Getting Things Done (GTD) methodology.

## GTD Categories:
- **Inbox**: Unprocessed items that need to be categorized
- **Próximas acciones**: Next actions - concrete tasks you can do right now
- **Multitarea**: Multi-step projects with subtasks
- **A la espera**: Waiting for - tasks delegated or waiting on others
- **Algún día**: Someday/maybe - ideas for the future

## Contexts:
Contexts represent locations or situations where tasks can be done (e.g., @home, @office, @phone, @computer).

## Quick Actions:
Tasks that take less than 2 minutes should be marked as quick actions (isQuickAction: true) and done immediately.

## Available Tools:

### Task Management:
- list_tasks: List all tasks with filters
- create_task: Create a new task
- update_task: Update task fields
- delete_task: Delete a task
- complete_task: Mark as completed/uncompleted
- move_task: Change GTD category

### Context Management:
- list_contexts: List all contexts
- create_context: Create a new context
- update_context: Update a context
- delete_context: Delete a context

### Queries:
- get_inbox: Get unprocessed inbox items
- get_today: Get tasks due today
- get_overdue: Get overdue tasks
- get_quick_actions: Get 2-minute quick actions
- get_next_actions: Get next actions (with optional context filter)
- get_by_context: Get tasks for a specific context
- search_tasks: Search tasks by title/description
- get_summary: Get dashboard summary with counts

## Tips:
1. Process your Inbox regularly - categorize or delete items
2. Keep next actions concrete and actionable
3. Use contexts to filter tasks by where you are
4. Review "Algún día" items periodically
5. Complete quick actions immediately (2-minute rule)
    `.trim()
  });

  // Register all tools
  registerTaskTools(server, userId);
  registerContextTools(server, userId);
  registerQueryTools(server, userId);

  return server;
}
