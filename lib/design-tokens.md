# GTD Buddy - Design Tokens

Sistema de diseño tokenizado para GTD Buddy. Todos los colores, efectos y estilos están centralizados como CSS variables y expuestos a través de Tailwind CSS.

## Tabla de Contenidos

1. [Colores Semánticos](#colores-semánticos)
2. [Categorías GTD](#categorías-gtd)
3. [Efectos Glassmorphism](#efectos-glassmorphism)
4. [Estados Interactivos](#estados-interactivos)
5. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Colores Semánticos

Colores que representan conceptos y emociones del sistema GTD.

### Clarity (Purple/Violeta)
**Uso**: Claridad mental, headers, botones primarios, acciones principales

**CSS Variable**: `--gtd-clarity`

**Variantes**:
- `--gtd-clarity` (262 84% 71%) - Color base
- `--gtd-clarity-light` (262 100% 95%) - Fondos suaves
- `--gtd-clarity-dark` (262 84% 45%) - Textos oscuros
- `--gtd-clarity-hover` (262 84% 65%) - Estado hover
- `--gtd-clarity-active` (262 84% 55%) - Estado active

**Clases Tailwind**:
```tsx
bg-gtd-clarity          // Fondo con color base
text-gtd-clarity-dark   // Texto oscuro
border-gtd-clarity      // Borde
bg-gtd-clarity-hover    // Fondo hover
```

**Ejemplo**:
```tsx
<button className="bg-gtd-clarity hover:bg-gtd-clarity-hover active:bg-gtd-clarity-active text-white">
  Acción Principal
</button>
```

---

### Action (Pink/Magenta)
**Uso**: CTAs, acciones inmediatas, botones "Nueva Tarea"

**CSS Variable**: `--gtd-action`

**Variantes**:
- `--gtd-action` (330 81% 60%)
- `--gtd-action-light` (330 100% 97%)
- `--gtd-action-dark` (330 81% 36%)
- `--gtd-action-hover` (330 81% 54%)
- `--gtd-action-active` (330 81% 48%)

**Clases Tailwind**: `bg-gtd-action`, `text-gtd-action-dark`, `border-gtd-action`

**Ejemplo**:
```tsx
<Button className="bg-gradient-to-r from-gtd-clarity to-gtd-action text-white">
  Nueva Tarea
</Button>
```

---

### Focus (Blue/Azul)
**Uso**: Enfoque, próximas acciones, filtros activos

**CSS Variable**: `--gtd-focus`

**Variantes**:
- `--gtd-focus` (201 96% 63%)
- `--gtd-focus-light` (201 100% 95%)
- `--gtd-focus-dark` (201 96% 36%)
- `--gtd-focus-hover` (201 96% 57%)
- `--gtd-focus-active` (201 96% 50%)

**Clases Tailwind**: `bg-gtd-focus`, `text-gtd-focus-dark`, `border-gtd-focus`

---

### Confidence (Green/Verde)
**Uso**: Tareas completadas, logros, revisiones exitosas

**CSS Variable**: `--gtd-confidence`

**Variantes**:
- `--gtd-confidence` (142 69% 64%)
- `--gtd-confidence-light` (142 76% 95%)
- `--gtd-confidence-dark` (142 69% 36%)
- `--gtd-confidence-hover` (142 69% 58%)
- `--gtd-confidence-active` (142 69% 50%)

**Clases Tailwind**: `bg-gtd-confidence`, `text-gtd-confidence-dark`, `border-gtd-confidence`

**Ejemplo**:
```tsx
<Badge className="bg-gtd-confidence-light text-gtd-completed">
  Completada ✓
</Badge>
```

---

### Neutral (Lavender Gray)
**Uso**: Elementos secundarios, cards, listas

**CSS Variable**: `--gtd-neutral`

**Variantes**:
- `--gtd-neutral` (253 41% 91%)
- `--gtd-neutral-dark` (253 41% 20%)

**Clases Tailwind**: `bg-gtd-neutral`, `text-gtd-neutral-dark`

---

## Categorías GTD

Colores específicos para cada categoría del método Getting Things Done.

### Inbox
**Categoría**: Elementos sin procesar
**Color Base**: Slate (220 14% 46%)

**CSS Variables**:
- `--gtd-inbox`
- `--gtd-inbox-light`
- `--gtd-inbox-bg`

**Uso en components**:
```tsx
// Card
<Card className={modernTheme.colors.cardInbox}>
  <CardTitle className={modernTheme.colors.textInbox}>
    Inbox
  </CardTitle>
</Card>

// Badge
<Badge className={modernTheme.colors.badgeInbox}>
  Inbox
</Badge>
```

---

### Next (Próximas Acciones)
**Categoría**: Tareas listas para ejecutar
**Color Base**: Blue (201 96% 50%)

**CSS Variables**:
- `--gtd-next`
- `--gtd-next-light`
- `--gtd-next-bg`

**modernTheme tokens**:
- `cardNext` - Card con fondo semitransparente
- `textNext` - Texto de color azul
- `badgeNext` - Badge azul

---

### Project (Multitarea)
**Categoría**: Proyectos con múltiples pasos
**Color Base**: Purple (262 84% 58%)

**CSS Variables**:
- `--gtd-project`
- `--gtd-project-light`
- `--gtd-project-bg`

**modernTheme tokens**:
- `cardProject`
- `textProject`
- `badgeProject`

---

### Waiting (A la Espera)
**Categoría**: Esperando respuesta de otros
**Color Base**: Orange (25 95% 53%)

**CSS Variables**:
- `--gtd-waiting`
- `--gtd-waiting-light`
- `--gtd-waiting-bg`

**modernTheme tokens**:
- `cardWaiting`
- `textWaiting`
- `badgeWaiting`

---

### Someday (Algún Día)
**Categoría**: Ideas futuras, maybe/someday
**Color Base**: Amber (45 93% 47%)

**CSS Variables**:
- `--gtd-someday`
- `--gtd-someday-light`
- `--gtd-someday-bg`

**modernTheme tokens**:
- `cardSomeday`
- `textSomeday`
- `badgeSomeday`

---

### Completed & Overdue
**Estados especiales de tareas**

**Completed**:
- `--gtd-completed` (142 71% 45%) - Green-600
- `badgeCompleted`

**Overdue**:
- `--gtd-overdue` (0 84% 60%) - Red-500
- `badgeOverdue`

---

## Efectos Glassmorphism

Sistema de efectos de vidrio (glassmorphism) para cards y containers.

### Clase `.glassmorphism`

Efecto de vidrio con backdrop blur y transparencia.

**CSS Variables**:
```css
--glass-bg: 0 0% 100%
--glass-bg-opacity: 0.4
--glass-border: 0 0% 100%
--glass-border-opacity: 0.5
--glass-blur: 24px
```

**Uso**:
```tsx
<div className="glassmorphism p-6">
  {/* Contenido con efecto vidrio */}
</div>
```

**Con hover**:
```tsx
<Card className="glassmorphism hover:bg-white/50">
  {/* El hover aumenta la opacidad */}
</Card>
```

---

### Fondo Degradado

**Clase**: `.gtd-gradient-bg`

Fondo característico de la aplicación con degradado suave.

```tsx
<div className="min-h-screen gtd-gradient-bg">
  {/* Contenido de la página */}
</div>
```

**CSS**:
```css
background: linear-gradient(to bottom right,
  theme('colors.purple.100'),
  theme('colors.pink.50'),
  theme('colors.blue.100')
);
```

---

## Estados Interactivos

### Hover States

Todos los colores semánticos tienen variante hover:

```tsx
// Clarity
bg-gtd-clarity hover:bg-gtd-clarity-hover

// Action
bg-gtd-action hover:bg-gtd-action-hover

// Focus
bg-gtd-focus hover:bg-gtd-focus-hover

// Confidence
bg-gtd-confidence hover:bg-gtd-confidence-hover
```

**Ejemplo de botón**:
```tsx
<button className="bg-gtd-clarity text-white hover:bg-gtd-clarity-hover active:bg-gtd-clarity-active transition-all duration-300">
  Botón Interactivo
</button>
```

---

### Active States

Estado cuando el elemento está siendo clickeado:

```tsx
active:bg-gtd-clarity-active
active:bg-gtd-action-active
active:bg-gtd-focus-active
active:bg-gtd-confidence-active
```

---

### Disabled State

**CSS Variables**:
```css
--gtd-disabled: 0 0% 70%
--gtd-disabled-text: 0 0% 40%
--gtd-disabled-bg: 0 0% 95%
```

**Clases Tailwind**:
```tsx
bg-gtd-disabled
text-gtd-disabled-text
bg-gtd-disabled-bg
```

**Clase utility**: `.disabled-gtd`

```tsx
<button disabled className="disabled-gtd">
  Botón Deshabilitado
</button>
```

---

## Ejemplos de Uso

### Card de Categoría GTD

```tsx
import { modernTheme } from "@/lib/theme"

<Card className={`${modernTheme.colors.cardNext} ${modernTheme.container.radius} ${modernTheme.container.shadowMd}`}>
  <CardHeader>
    <CardTitle className={modernTheme.colors.textNext}>
      Próximas Acciones
    </CardTitle>
    <Badge className={modernTheme.colors.badgeNext}>
      {tasks.length}
    </Badge>
  </CardHeader>
  <CardContent>
    {/* Lista de tareas */}
  </CardContent>
</Card>
```

---

### Badge de Estado

```tsx
const CATEGORY_COLORS = {
  Inbox: modernTheme.colors.badgeInbox,
  "Próximas acciones": modernTheme.colors.badgeNext,
  Multitarea: modernTheme.colors.badgeProject,
  "A la espera": modernTheme.colors.badgeWaiting,
  "Algún día": modernTheme.colors.badgeSomeday,
}

<Badge className={CATEGORY_COLORS[task.category]}>
  {task.category}
</Badge>
```

---

### Botón con Gradiente Semántico

```tsx
<Button className="bg-gradient-to-r from-gtd-clarity to-gtd-action hover:from-gtd-clarity-dark hover:to-gtd-action-dark text-white transition-all duration-300">
  <Plus className="h-4 w-4 mr-2" />
  Nueva Tarea
</Button>
```

---

### Modal con Glassmorphism

```tsx
<Dialog>
  <DialogContent className="glassmorphism sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle className="text-gtd-clarity-dark">
        Título del Modal
      </DialogTitle>
    </DialogHeader>
    {/* Contenido */}
  </DialogContent>
</Dialog>
```

---

### Layout con Fondo y Header

```tsx
<div className="min-h-screen gtd-gradient-bg">
  <header className="glassmorphism border-b border-white/20 sticky top-0">
    <div className="max-w-7xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-gtd-clarity-dark">
        GTD Buddy
      </h1>
    </div>
  </header>

  <main className="max-w-7xl mx-auto px-4 py-8">
    {/* Contenido */}
  </main>
</div>
```

---

## Migración de Código Legacy

Si encuentras código con nombres antiguos, aquí está el mapeo:

| Legacy | Semántico |
|--------|-----------|
| `cardBlue` | `cardNext` |
| `cardGreen` | `cardNext` |
| `cardPurple` | `cardProject` |
| `cardOrange` | `cardWaiting` |
| `cardAmber` | `cardSomeday` |
| `textBlue` | `textNext` |
| `textGreen` | `textNext` |
| `textPurple` | `textProject` |
| `textOrange` | `textWaiting` |
| `textAmber` | `textSomeday` |
| `badgeBlue` | `badgeInbox` |
| `badgeGreen` | `badgeNext` |
| `badgePurple` | `badgeProject` |
| `badgeOrange` | `badgeWaiting` |
| `badgeAmber` | `badgeSomeday` |

---

## Arquitectura del Sistema

```
CSS Variables (globals.css)
    ↓
Tailwind Config (tailwind.config.ts)
    ↓
Theme Object (lib/theme.ts)
    ↓
Components
```

### Ventajas

✅ **Un solo lugar para cambiar colores** - Modifica `globals.css`
✅ **Semántica clara** - Nombres descriptivos (clarity, action, inbox)
✅ **Consistencia garantizada** - Todos usan los mismos tokens
✅ **Fácil mantenimiento** - Cambios centralizados
✅ **Preparado para dark mode** - Solo agregar variables `.dark`
✅ **Accesibilidad** - Ratios de contraste calculados

---

## Contribuir

Al agregar nuevos colores o variantes:

1. Define la CSS variable en `app/globals.css`
2. Expón en `tailwind.config.ts`
3. Agrega al `modernTheme` en `lib/theme.ts`
4. Documenta aquí con ejemplos
5. Usa nombres semánticos, no colores literales
