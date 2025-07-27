# GTD Buddy MCP Server

Un servidor MCP (Model Context Protocol) para gestionar tareas siguiendo la metodología GTD (Getting Things Done).

## Instalación

1. Navega al directorio del servidor MCP:
\`\`\`bash
cd mcp-server
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configura las variables de entorno:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Edita el archivo `.env` con tus credenciales de Firebase:
   - `FIREBASE_SERVICE_ACCOUNT`: JSON completo de la cuenta de servicio de Firebase
   - `FIREBASE_PROJECT_ID`: ID de tu proyecto de Firebase

## Configuración en Claude Desktop

Agrega el servidor a tu configuración de Claude Desktop (`claude_desktop_config.json`):

\`\`\`json
{
  "mcpServers": {
    "gtd-buddy": {
      "command": "node",
      "args": ["D:/Proyectos/gtd-buddy/mcp-server/dist/index.js"],
      "env": {
        "FIREBASE_SERVICE_ACCOUNT": "{...tu JSON de service account...}",
        "FIREBASE_PROJECT_ID": "tu-project-id"
      }
    }
  }
}
\`\`\`

## Desarrollo

Para ejecutar en modo desarrollo:
\`\`\`bash
npm run dev
\`\`\`

Para compilar:
\`\`\`bash
npm run build
\`\`\`

## Herramientas Disponibles

### `create_task`
Crea una nueva tarea GTD.

Parámetros:
- `title` (requerido): Título de la tarea
- `description`: Descripción de la tarea
- `userId` (requerido): ID del usuario
- `category`: Categoría GTD (inbox, nextActions, multiStep, waiting, someday)
- `priority`: Prioridad (baja, media, alta)
- `contextId`: ID del contexto
- `energyLevel`: Nivel de energía requerido (1-5)
- `dueDate`: Fecha de vencimiento (formato ISO)
- `isQuickAction`: ¿Es una tarea de 2 minutos?

### `list_tasks`
Lista tareas con filtros opcionales.

Parámetros:
- `userId` (requerido): ID del usuario
- `category`: Filtrar por categoría GTD
- `contextId`: Filtrar por contexto
- `completed`: Filtrar por estado de completado

### `update_task`
Actualiza una tarea existente.

Parámetros:
- `taskId` (requerido): ID de la tarea a actualizar
- Todos los demás parámetros de `create_task` son opcionales

### `delete_task`
Elimina una tarea.

Parámetros:
- `taskId` (requerido): ID de la tarea a eliminar

### `create_context`
Crea un nuevo contexto GTD.

Parámetros:
- `name` (requerido): Nombre del contexto
- `userId` (requerido): ID del usuario
- `color`: Color del contexto (formato hex)
- `icon`: Icono del contexto (emoji)

### `list_contexts`
Lista todos los contextos de un usuario.

Parámetros:
- `userId` (requerido): ID del usuario

## Ejemplo de Uso en Claude

\`\`\`
Usa la herramienta create_task para crear una nueva tarea llamada "Revisar emails" para el usuario "user123" en la categoría "nextActions" con prioridad "alta".
\`\`\`
