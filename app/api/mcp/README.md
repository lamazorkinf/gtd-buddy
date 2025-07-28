# MCP API para Vercel

Este directorio contiene la implementación de la API REST del MCP (Model Context Protocol) optimizada para desplegarse en Vercel.

## Endpoint

`POST /api/mcp`

## Autenticación

Todas las peticiones requieren un token de Firebase Auth en el header:

```
Authorization: Bearer <firebase-id-token>
```

## Acciones disponibles

### 1. Crear tarea (`create_task`)

```json
{
  "action": "create_task",
  "params": {
    "title": "Mi nueva tarea",
    "description": "Descripción opcional",
    "category": "inbox", // inbox, nextActions, multiStep, waiting, someday
    "priority": "media", // baja, media, alta
    "contextId": "id-del-contexto",
    "energyLevel": 3, // 1-5
    "dueDate": "2024-12-31T23:59:59Z",
    "isQuickAction": false
  }
}
```

### 2. Listar tareas (`list_tasks`)

```json
{
  "action": "list_tasks",
  "params": {
    "category": "nextActions", // opcional
    "contextId": "id-del-contexto", // opcional
    "completed": false // opcional
  }
}
```

### 3. Actualizar tarea (`update_task`)

```json
{
  "action": "update_task",
  "params": {
    "taskId": "id-de-la-tarea",
    "title": "Nuevo título",
    "completed": true
    // ... cualquier campo de la tarea
  }
}
```

### 4. Eliminar tarea (`delete_task`)

```json
{
  "action": "delete_task",
  "params": {
    "taskId": "id-de-la-tarea"
  }
}
```

### 5. Crear contexto (`create_context`)

```json
{
  "action": "create_context",
  "params": {
    "name": "Mi contexto",
    "color": "#3B82F6",
    "icon": "📁"
  }
}
```

### 6. Listar contextos (`list_contexts`)

```json
{
  "action": "list_contexts",
  "params": {}
}
```

## Ejemplo de uso

```javascript
// Obtener el token de Firebase Auth
const token = await firebase.auth().currentUser.getIdToken();

// Hacer la petición
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    action: 'list_tasks',
    params: {
      category: 'nextActions'
    }
  })
});

const data = await response.json();
console.log(data);
```

## Respuestas

### Éxito
```json
{
  "success": true,
  "task": { ... } // o tasks, context, contexts según la acción
}
```

### Error
```json
{
  "error": "Mensaje de error"
}
```

## Códigos de estado HTTP

- `200` - Operación exitosa
- `400` - Petición inválida (acción desconocida, parámetros faltantes)
- `401` - No autenticado
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

## GET /api/mcp

Devuelve la lista de acciones disponibles:

```json
{
  "actions": [
    {
      "name": "create_task",
      "description": "Create a new GTD task",
      "params": ["title", "description?", "category?", ...]
    },
    ...
  ]
}
```

Los parámetros marcados con `?` son opcionales.