# GTD-Buddy MCP Server

MCP (Model Context Protocol) server for GTD-Buddy task management. Allows AI assistants like Claude to manage your tasks and contexts using the GTD methodology.

## Modos de Ejecución

| Modo | Comando | Uso |
|------|---------|-----|
| **Stdio** | `npm run dev` | Claude Desktop/Code (local) |
| **HTTP** | `npm run dev:http` | ElevenLabs, agentes remotos |

## Setup Local

### 1. Install dependencies

```bash
cd mcp-server
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `FIREBASE_SERVICE_ACCOUNT`: Your Firebase service account JSON (as a single-line string)
- `GTD_USER_ID`: Your Firebase user ID

### 3. Build the server

```bash
npm run build
```

### 4. Configure your MCP client

#### Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gtd-buddy": {
      "command": "node",
      "args": ["C:\\Desarrollo\\gtd-buddy\\mcp-server\\dist\\index.js"],
      "env": {
        "FIREBASE_SERVICE_ACCOUNT": "{...your service account JSON...}",
        "GTD_USER_ID": "your-user-id"
      }
    }
  }
}
```

#### Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "gtd-buddy": {
      "command": "node",
      "args": ["C:\\Desarrollo\\gtd-buddy\\mcp-server\\dist\\index.js"],
      "env": {
        "FIREBASE_SERVICE_ACCOUNT": "{...}",
        "GTD_USER_ID": "..."
      }
    }
  }
}
```

## Development

Run in development mode with hot reload:

```bash
npm run dev
```

## Available Tools

### Task Management
| Tool | Description |
|------|-------------|
| `list_tasks` | List tasks with optional filters (category, context, completed) |
| `create_task` | Create a new task with GTD fields |
| `update_task` | Update task properties |
| `delete_task` | Permanently delete a task |
| `complete_task` | Mark task as completed/uncompleted |
| `move_task` | Move task to different GTD category |

### Context Management
| Tool | Description |
|------|-------------|
| `list_contexts` | List all contexts |
| `create_context` | Create a new context (@home, @office, etc.) |
| `update_context` | Update context properties |
| `delete_context` | Delete a context |

### Queries
| Tool | Description |
|------|-------------|
| `get_inbox` | Get unprocessed inbox items |
| `get_today` | Get tasks due today |
| `get_overdue` | Get overdue tasks |
| `get_quick_actions` | Get 2-minute quick actions |
| `get_next_actions` | Get next actions (with optional context filter) |
| `get_by_context` | Get tasks for a specific context |
| `search_tasks` | Search tasks by title/description |
| `get_summary` | Get dashboard summary with counts |

## GTD Categories

- **Inbox**: Unprocessed items
- **Proximas acciones**: Next actions to do now
- **Multitarea**: Multi-step projects with subtasks
- **A la espera**: Waiting for others
- **Algun dia**: Someday/maybe ideas

## Example Usage

Ask Claude:

- "Show me my inbox"
- "Create a task to buy groceries for tomorrow"
- "What tasks are overdue?"
- "Move task X to next actions"
- "Create a context called @errands"
- "Show me all tasks in the @office context"
- "Give me a summary of my tasks"

---

## Deploy en VPS (para ElevenLabs)

### 1. Setup inicial del VPS

```bash
# Conectar al VPS
ssh usuario@tu-vps.com

# Instalar Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Clonar el repositorio
cd ~
git clone https://github.com/tu-usuario/gtd-buddy.git
cd gtd-buddy/mcp-server

# Instalar dependencias y compilar
npm install
npm run build

# Crear directorio de logs
sudo mkdir -p /var/log/gtd-mcp
sudo chown $USER:$USER /var/log/gtd-mcp

# Crear archivo .env
cp .env.example .env
nano .env  # Configurar FIREBASE_SERVICE_ACCOUNT y GTD_USER_ID

# Iniciar con PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Seguir instrucciones para auto-inicio
```

### 2. Configurar GitHub Secrets

En tu repositorio GitHub, ve a **Settings > Secrets and variables > Actions** y agrega:

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | IP o dominio de tu VPS |
| `VPS_USER` | Usuario SSH (ej: `root`) |
| `VPS_SSH_KEY` | Tu clave SSH privada |
| `VPS_PORT` | Puerto SSH (default: 22) |

### 3. Deploy automático

Cada push a `main` que modifique `mcp-server/` desplegará automáticamente.

Para deploy manual: **Actions > Deploy MCP Server to VPS > Run workflow**

### 4. Configurar en ElevenLabs

- **URL:** `http://tu-vps.com:3001/mcp`
- **Transport:** Streamable HTTP

### Comandos útiles PM2

```bash
pm2 status          # Ver estado
pm2 logs gtd-mcp    # Ver logs
pm2 restart gtd-mcp # Reiniciar
pm2 stop gtd-mcp    # Detener
```
