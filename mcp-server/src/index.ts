import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { initializeFirebase, db } from './firebase.js';
import { 
  Task, 
  Context, 
  GTDCategory, 
  Priority,
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
  deleteTaskSchema,
  createContextSchema,
  listContextsSchema
} from './types.js';

// Initialize Firebase
initializeFirebase();

// Define available tools
const tools: Tool[] = [
  {
    name: 'create_task',
    description: 'Create a new GTD task',
    inputSchema: createTaskSchema,
  },
  {
    name: 'list_tasks',
    description: 'List tasks with optional filters',
    inputSchema: listTasksSchema,
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    inputSchema: updateTaskSchema,
  },
  {
    name: 'delete_task',
    description: 'Delete a task',
    inputSchema: deleteTaskSchema,
  },
  {
    name: 'create_context',
    description: 'Create a new GTD context',
    inputSchema: createContextSchema,
  },
  {
    name: 'list_contexts',
    description: 'List all contexts for a user',
    inputSchema: listContextsSchema,
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'gtd-buddy-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_task': {
        const validatedArgs = createTaskSchema.parse(args);
        const taskData: Partial<Task> = {
          title: validatedArgs.title,
          description: validatedArgs.description || '',
          userId: validatedArgs.userId,
          category: validatedArgs.category || 'inbox',
          priority: validatedArgs.priority || 'media',
          contextId: validatedArgs.contextId,
          energyLevel: validatedArgs.energyLevel || 3,
          dueDate: validatedArgs.dueDate ? new Date(validatedArgs.dueDate) : null,
          completed: false,
          isQuickAction: validatedArgs.isQuickAction || false,
          subtasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await db.collection('tasks').add(taskData);
        const newTask = { id: docRef.id, ...taskData };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, task: newTask }, null, 2),
            },
          ],
        };
      }

      case 'list_tasks': {
        const validatedArgs = listTasksSchema.parse(args);
        let query = db.collection('tasks')
          .where('userId', '==', validatedArgs.userId);

        if (validatedArgs.category) {
          query = query.where('category', '==', validatedArgs.category);
        }
        if (validatedArgs.contextId) {
          query = query.where('contextId', '==', validatedArgs.contextId);
        }
        if (validatedArgs.completed !== undefined) {
          query = query.where('completed', '==', validatedArgs.completed);
        }

        const snapshot = await query.get();
        const tasks: Task[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          tasks.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            dueDate: data.dueDate?.toDate() || null,
          } as Task);
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, tasks }, null, 2),
            },
          ],
        };
      }

      case 'update_task': {
        const validatedArgs = updateTaskSchema.parse(args);
        const { taskId, ...updates } = validatedArgs;
        
        const updateData: any = { ...updates, updatedAt: new Date() };
        if (updates.dueDate) {
          updateData.dueDate = new Date(updates.dueDate);
        }

        await db.collection('tasks').doc(taskId).update(updateData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, taskId, updates }, null, 2),
            },
          ],
        };
      }

      case 'delete_task': {
        const validatedArgs = deleteTaskSchema.parse(args);
        await db.collection('tasks').doc(validatedArgs.taskId).delete();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, taskId: validatedArgs.taskId }, null, 2),
            },
          ],
        };
      }

      case 'create_context': {
        const validatedArgs = createContextSchema.parse(args);
        const contextData: Partial<Context> = {
          name: validatedArgs.name,
          userId: validatedArgs.userId,
          color: validatedArgs.color || '#3B82F6',
          icon: validatedArgs.icon || '📁',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await db.collection('contexts').add(contextData);
        const newContext = { id: docRef.id, ...contextData };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, context: newContext }, null, 2),
            },
          ],
        };
      }

      case 'list_contexts': {
        const validatedArgs = listContextsSchema.parse(args);
        const snapshot = await db.collection('contexts')
          .where('userId', '==', validatedArgs.userId)
          .get();

        const contexts: Context[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          contexts.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Context);
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, contexts }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ 
            error: true, 
            message: error instanceof Error ? error.message : 'Unknown error' 
          }, null, 2),
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GTD Buddy MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});