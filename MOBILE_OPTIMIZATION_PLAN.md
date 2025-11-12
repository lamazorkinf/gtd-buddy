# 📱 Plan de Optimización Mobile - GTD Buddy

## 🎯 Objetivos

1. ✅ **Prevenir scroll horizontal** en todos los dispositivos móviles
2. ✅ **Deshabilitar zoom** de manera accesible
3. ✅ **Eliminar text overflow** en todos los contenedores
4. ✅ **Priorizar iconos sobre texto** donde sea apropiado
5. ✅ **Optimizar calendario** para vistas móviles (mes y semana)
6. ✅ **Aplicar responsive best practices** con enfoque mobile-first

---

## 📊 Auditoría Actual: Problemas Detectados

### ❌ **Problema #1: Falta de Viewport Meta Tag**

**Ubicación:** `app/layout.tsx`

**Problema:**
```typescript
export const metadata: Metadata = {
  title: "GTD Buddy - Tu mente libre, tu sistema claro",
  description: "...",
  generator: "v0.dev",
  // ❌ NO HAY viewport configurado
}
```

**Impacto:**
- Usuarios pueden hacer zoom involuntario
- Layout puede no ajustarse correctamente al ancho del dispositivo
- Posible scroll horizontal en algunos dispositivos

**Solución:**
```typescript
export const metadata: Metadata = {
  title: "GTD Buddy - Tu mente libre, tu sistema claro",
  description: "...",
  generator: "v0.dev",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}
```

---

### ❌ **Problema #2: Calendario No Optimizado para Mobile**

**Ubicación:** `components/calendar/calendar-view.tsx`

#### **2.1 Vista de Mes - Grid de 7 columnas fijo**

**Código problemático:**
```typescript
// Línea 125
<div className="grid grid-cols-7 gap-2">
  {monthDays.map((date) => {
    // ...
    return (
      <div className="min-h-[120px] p-2 border rounded-lg">
        {/* Contenido del día */}
      </div>
    )
  })}
</div>
```

**Problemas:**
- Grid de 7 columnas en mobile = celdas muy pequeñas (aprox. 40-50px)
- Texto truncado ilegible
- `min-h-[120px]` demasiado alto para mobile
- Difícil hacer tap en días específicos

**Solución propuesta:**
- Mobile: Vista de lista (1 columna) con días que tienen tareas
- Tablet: Grid de 7 columnas con altura reducida
- Desktop: Grid actual

#### **2.2 Vista de Semana - Muy ancha para mobile**

**Código problemático:**
```typescript
// Línea 190
<div className={`grid gap-4 ${showWeekends ? "grid-cols-7" : "grid-cols-5"}`}>
  {displayWeekDays.map((date) => (
    <div className="min-h-[300px] border rounded-lg">
      {/* Día completo */}
    </div>
  ))}
</div>
```

**Problemas:**
- 7 columnas en mobile = scroll horizontal inevitable
- Cada columna tiene ~45px de ancho (ilegible)
- `min-h-[300px]` ocupa toda la pantalla vertical

**Solución propuesta:**
- Mobile: Carrusel horizontal con swipe (1 día visible)
- Indicadores de navegación (dots o flechas)
- Altura adaptativa según contenido

#### **2.3 Header con demasiados controles**

**Código problemático:**
```typescript
// Línea 282-348
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <CardTitle>{/* Título muy largo */}</CardTitle>
  <div className="flex items-center gap-2">
    <Tabs>...</Tabs>
    <Switch>...</Switch> {/* "Fines de semana" con texto */}
    <Button>ChevronLeft</Button>
    <Button>Hoy</Button>
    <Button>ChevronRight</Button>
  </div>
</div>
```

**Problemas:**
- Demasiados elementos en una línea en mobile
- Texto "Fines de semana" ocupa espacio innecesario
- Botones pueden solaparse o hacer wrap

**Solución propuesta:**
- Ocultar label "Fines de semana" en mobile, solo mostrar switch con tooltip
- Tabs con solo iconos en mobile
- Grupo de navegación más compacto

---

### ❌ **Problema #3: Dashboard - Overflow de Texto**

**Ubicación:** `components/dashboard/dashboard.tsx`

#### **3.1 Títulos largos sin truncate**

**Problemas potenciales:**
```typescript
<h3 className="font-medium">{task.title}</h3>
```

Sin clases de truncate, títulos largos pueden:
- Expandir contenedores más allá del viewport
- Crear scroll horizontal
- Romper el layout

**Solución:**
```typescript
<h3 className="font-medium truncate">{task.title}</h3>
// O en contextos donde se necesitan 2 líneas:
<h3 className="font-medium line-clamp-2">{task.title}</h3>
```

#### **3.2 Badges con texto largo**

```typescript
<Badge>{context.name}</Badge> {/* Sin límite de ancho */}
```

**Solución:**
```typescript
<Badge className="max-w-[120px] truncate">{context.name}</Badge>
```

---

### ❌ **Problema #4: Botones con Texto en Mobile**

**Ubicaciones:** Múltiples páginas (`calendar/page.tsx`, `profile/page.tsx`, etc.)

**Ejemplo:**
```typescript
<Button>
  <Plus className="h-4 w-4" />
  <span className="hidden sm:inline">Nueva Tarea</span>
</Button>
```

✅ **Este patrón es CORRECTO** pero no se usa consistentemente en toda la app.

**Lugares donde se debe aplicar:**
- Todos los botones del header
- Acciones secundarias en cards
- Botones de navegación

---

### ❌ **Problema #5: Modales y Formularios**

**Ubicación:** `components/tasks/task-form.tsx`, `components/contexts/context-form.tsx`

#### **5.1 Ancho fijo en modales**

```typescript
<DialogContent className="max-w-2xl">
  {/* Formulario */}
</DialogContent>
```

**Problema:**
- `max-w-2xl` = 672px, demasiado ancho en tablets pequeñas
- Sin padding horizontal puede tocar bordes de pantalla

**Solución:**
```typescript
<DialogContent className="max-w-2xl w-[95vw] sm:w-full mx-4">
```

#### **5.2 Formularios con inputs side-by-side**

```typescript
<div className="grid grid-cols-2 gap-4">
  <Input />
  <Input />
</div>
```

**Problema en mobile:**
- Inputs muy angostos
- Difícil escribir en campos pequeños

**Solución:**
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input />
  <Input />
</div>
```

---

### ❌ **Problema #6: Tablas y Listas Anchas**

**Ubicación:** `components/tasks/task-list.tsx`

Si hay componentes con tablas o listas horizontales:

**Problema:**
- Scroll horizontal dentro de contenedores
- Columnas no priorizadas para mobile

**Solución:**
- Cambiar a cards apiladas en mobile
- Usar listas verticales con información condensada
- Implementar expansión de detalles (collapsible)

---

## 🎨 Diseño Mobile-First: Propuesta de Mejoras

### **1. Calendario Mobile Redesign**

#### **Vista de Mes (Mobile)**

**Nueva estructura:**
```typescript
// Mobile: Vista de lista compacta
{isMobile ? (
  <div className="space-y-2">
    {daysWithTasks.map((date) => (
      <Card className="p-3" key={date.toISOString()}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold">{format(date, "EEEE d")}</span>
          <Badge>{dayTasks.length} tareas</Badge>
        </div>
        {/* Lista de tareas condensada */}
      </Card>
    ))}
  </div>
) : (
  // Desktop: Grid 7x7 actual
  <div className="grid grid-cols-7 gap-2">...</div>
)}
```

**Ventajas:**
- Solo muestra días con tareas (menos scroll)
- Información legible
- Fácil navegación
- Sin scroll horizontal

#### **Vista de Semana (Mobile)**

**Nueva estructura con carrusel:**
```typescript
import { Swiper, SwiperSlide } from 'swiper/react'

<Swiper
  spaceBetween={16}
  slidesPerView={1}
  onSlideChange={(swiper) => setCurrentDayIndex(swiper.activeIndex)}
>
  {weekDays.map((date) => (
    <SwiperSlide key={date.toISOString()}>
      <Card className="min-h-[400px]">
        <CardHeader>
          <h3>{format(date, "EEEE d MMMM")}</h3>
        </CardHeader>
        <CardContent>
          {/* Lista de tareas del día */}
        </CardContent>
      </Card>
    </SwiperSlide>
  ))}
</Swiper>

{/* Indicadores de navegación */}
<div className="flex justify-center gap-2 mt-4">
  {weekDays.map((_, i) => (
    <button
      className={`w-2 h-2 rounded-full ${i === currentDayIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
      onClick={() => swiperRef.current?.slideTo(i)}
    />
  ))}
</div>
```

**Alternativa sin librerías:**
```typescript
// Navegación con botones prev/next
const [currentDayIndex, setCurrentDayIndex] = useState(0)
const currentDay = weekDays[currentDayIndex]

<div className="relative">
  <Card className="min-h-[400px]">
    {/* Contenido del día actual */}
  </Card>

  <div className="flex items-center justify-between mt-4">
    <Button
      disabled={currentDayIndex === 0}
      onClick={() => setCurrentDayIndex(i => i - 1)}
    >
      <ChevronLeft />
    </Button>

    <span className="text-sm">
      {currentDayIndex + 1} / {weekDays.length}
    </span>

    <Button
      disabled={currentDayIndex === weekDays.length - 1}
      onClick={() => setCurrentDayIndex(i => i + 1)}
    >
      <ChevronRight />
    </Button>
  </div>
</div>
```

---

### **2. Header Responsive Pattern**

**Patrón actual (parcialmente implementado):**
```typescript
<Button variant="outline" size="sm">
  <LayoutDashboard className="h-4 w-4" />
  <span className="hidden sm:inline">Dashboard</span>
</Button>
```

**Aplicar en TODOS los headers:**

✅ **Calendario** (ya tiene)
✅ **Dashboard** (revisar)
✅ **Perfil** (revisar)
✅ **Teams** (revisar)

**Pattern library a crear:**
```typescript
// components/ui/responsive-button.tsx
interface ResponsiveButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  hideLabel?: 'mobile' | 'tablet' | 'never'
  // ... otros props de Button
}

export function ResponsiveButton({
  icon: Icon,
  label,
  hideLabel = 'mobile',
  ...buttonProps
}: ResponsiveButtonProps) {
  return (
    <Button {...buttonProps}>
      <Icon className="h-4 w-4" />
      <span className={hideLabel === 'mobile' ? 'hidden sm:inline' :
                       hideLabel === 'tablet' ? 'hidden md:inline' : ''}>
        {label}
      </span>
    </Button>
  )
}
```

---

### **3. Responsive Card Layout**

**Problema común:**
```typescript
<div className="grid grid-cols-3 gap-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

**Solución mobile-first:**
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

**Pattern para GTD Buddy:**
- **Mobile (< 640px):** 1 columna
- **Tablet (640-1024px):** 2 columnas
- **Desktop (> 1024px):** 3 columnas

---

### **4. Prevención de Overflow Global**

**Agregar a `globals.css`:**
```css
/* Prevenir scroll horizontal en toda la app */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* Asegurar que ningún elemento exceda el viewport */
* {
  box-sizing: border-box;
}

/* Truncate por defecto en textos largos dentro de cards */
.card-title,
.task-title,
.context-name {
  @apply truncate max-w-full;
}

/* Imágenes responsive por defecto */
img {
  max-width: 100%;
  height: auto;
}

/* Evitar que pre/code cause overflow */
pre, code {
  overflow-x: auto;
  max-width: 100%;
}
```

---

### **5. Touch Target Sizes (Accesibilidad Mobile)**

**Mínimo recomendado:** 44x44px según WCAG 2.1

**Áreas a revisar:**
```typescript
// ❌ Checkbox muy pequeño
<Checkbox className="w-4 h-4" />

// ✅ Checkbox con área de tap adecuada
<div className="p-2"> {/* Aumenta área táctil */}
  <Checkbox className="w-5 h-5" />
</div>

// ❌ Botón pequeño
<Button size="sm" className="h-6">

// ✅ Botón con tamaño mínimo
<Button size="sm" className="min-h-[44px] sm:h-auto">
```

**Aplicar en:**
- Checkboxes de tareas
- Botones de navegación
- Iconos interactivos
- Links en listas

---

## 🔧 Plan de Implementación: Fase por Fase

### **Fase 1: Fundamentos (Crítico - 1 día)**

**Objetivo:** Prevenir problemas básicos de mobile

#### Tarea 1.1: Agregar Viewport Meta Tag
- [ ] Editar `app/layout.tsx`
- [ ] Agregar viewport a metadata
- [ ] Probar en dispositivo real

#### Tarea 1.2: CSS Global Anti-Overflow
- [ ] Editar `app/globals.css`
- [ ] Agregar reglas de prevención
- [ ] Verificar no rompe estilos existentes

#### Tarea 1.3: Auditoría de Overflow
- [ ] Usar browser DevTools para detectar elementos > viewport
- [ ] Marcar todos los componentes problemáticos
- [ ] Crear lista de prioridades

**Entregable:** App sin scroll horizontal en ninguna página

---

### **Fase 2: Calendario Mobile (Alta prioridad - 2-3 días)**

#### Tarea 2.1: Vista de Mes Responsive
- [ ] Detectar tamaño de pantalla con hook
- [ ] Implementar vista de lista para mobile
- [ ] Mantener grid para desktop
- [ ] Agregar transiciones suaves

#### Tarea 2.2: Vista de Semana Responsive
- [ ] Elegir entre carrusel o navegación con botones
- [ ] Implementar vista de día único para mobile
- [ ] Optimizar altura de cards
- [ ] Agregar indicadores visuales

#### Tarea 2.3: Header del Calendario
- [ ] Reducir controles en mobile
- [ ] Iconos solo en botones pequeños
- [ ] Agregar menu dropdown para opciones extra
- [ ] Probar usabilidad

**Entregable:** Calendario completamente usable en mobile

---

### **Fase 3: Dashboard y Listas (Media prioridad - 2 días)**

#### Tarea 3.1: Componentes de Tarea
- [ ] Agregar `truncate` a todos los títulos
- [ ] Limitar ancho de badges
- [ ] Optimizar spacing en mobile
- [ ] Probar con nombres muy largos

#### Tarea 3.2: Grids Responsive
- [ ] Convertir todos los grids fijos a responsive
- [ ] Aplicar pattern: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- [ ] Verificar gaps adecuados

#### Tarea 3.3: Tabs y Navegación
- [ ] Reducir padding en tabs mobile
- [ ] Iconos + texto opcional
- [ ] Scroll horizontal para muchas tabs (si aplica)

**Entregable:** Dashboard optimizado para todos los tamaños

---

### **Fase 4: Formularios y Modales (Media prioridad - 1-2 días)**

#### Tarea 4.1: Ancho de Modales
- [ ] Ajustar todos los DialogContent con `w-[95vw] sm:w-full`
- [ ] Agregar padding horizontal apropiado
- [ ] Probar en diferentes tamaños

#### Tarea 4.2: Inputs Responsive
- [ ] Convertir grids de inputs a 1 columna en mobile
- [ ] Agregar labels claros en mobile
- [ ] Verificar tamaño de font legible

#### Tarea 4.3: Botones de Acción
- [ ] Botones full-width en mobile para acciones primarias
- [ ] Agrupar acciones secundarias en menu
- [ ] Asegurar espaciado entre botones

**Entregable:** Formularios cómodos de usar en mobile

---

### **Fase 5: Iconos y Micro-interacciones (Baja prioridad - 1 día)**

#### Tarea 5.1: Reemplazo de Texto por Iconos
- [ ] Auditar todos los botones con texto largo
- [ ] Aplicar pattern ResponsiveButton
- [ ] Agregar tooltips donde se oculta texto
- [ ] Mantener accesibilidad (aria-labels)

#### Tarea 5.2: Touch Targets
- [ ] Verificar tamaños mínimos (44x44px)
- [ ] Aumentar padding donde sea necesario
- [ ] Probar en dispositivo táctil real

**Entregable:** UI pulida con interacciones fluidas

---

### **Fase 6: Testing y Refinamiento (1-2 días)**

#### Tarea 6.1: Testing Cross-Device
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad/Android)
- [ ] Desktop (varios tamaños)

#### Tarea 6.2: Performance
- [ ] Lighthouse mobile score > 90
- [ ] Reducir bundle size si es necesario
- [ ] Lazy loading de componentes pesados

#### Tarea 6.3: Accessibility
- [ ] WAVE test sin errores críticos
- [ ] Screen reader navigation
- [ ] Contrast ratios WCAG AA

**Entregable:** App probada y optimizada en todos los dispositivos

---

## 📏 Breakpoints y Utilities

### **Tailwind Breakpoints (Mobile-First)**

```typescript
// sm: 640px (tablet pequeña)
// md: 768px (tablet)
// lg: 1024px (desktop pequeño)
// xl: 1280px (desktop)
// 2xl: 1536px (desktop grande)
```

### **Hooks Útiles para Responsive**

```typescript
// hooks/use-media-query.ts
import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Uso en componentes
const isMobile = useMediaQuery('(max-width: 640px)')
const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
const isDesktop = useMediaQuery('(min-width: 1025px)')
```

### **Component Helper**

```typescript
// hooks/use-responsive.ts
export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch: isMobile || isTablet,
  }
}
```

---

## 🎯 Checklist Final de Mobile Optimization

### Configuración Base
- [ ] Viewport meta tag configurado
- [ ] CSS global para prevenir overflow
- [ ] max-width en imágenes
- [ ] Box-sizing en todos los elementos

### Componentes Responsive
- [ ] Calendario optimizado para mobile
- [ ] Dashboard con grids responsive
- [ ] Headers con iconos en mobile
- [ ] Modales con ancho apropiado
- [ ] Formularios en 1 columna mobile

### Tipografía y Contenido
- [ ] Truncate en todos los títulos
- [ ] Max-width en badges
- [ ] Font-size legible (min 16px para inputs)
- [ ] Line-height adecuado

### Interacciones Touch
- [ ] Touch targets >= 44x44px
- [ ] Spacing entre elementos interactivos
- [ ] Estados hover/active apropiados
- [ ] Feedback visual en taps

### Testing
- [ ] Sin scroll horizontal en todas las páginas
- [ ] Zoom deshabilitado (pero accesible)
- [ ] Lighthouse mobile > 90
- [ ] Testing en dispositivos reales
- [ ] Accesibilidad WCAG AA

---

## 📦 Librerías Recomendadas (Opcional)

### Para Calendario Avanzado
- **react-swipeable** - Gestos de swipe
- **embla-carousel-react** - Carrusel ligero
- **react-day-picker** - Alternativa a implementación custom

### Para Detección de Dispositivo
- **react-device-detect** - Detectar tipo de dispositivo
- **react-responsive** - Componentes responsive declarativos

**Nota:** Evaluar si vale la pena agregar dependencias vs implementar custom.

---

## 🚨 Problemas Comunes y Soluciones

### Problema: "Aparece scroll horizontal en iOS Safari"
**Causa:** Elementos con width: 100vw o margin negativo
**Solución:**
```css
body {
  overflow-x: hidden;
  position: relative;
}
```

### Problema: "Inputs causan zoom en iOS"
**Causa:** Font-size < 16px en inputs
**Solución:**
```typescript
<Input className="text-base" /> {/* 16px mínimo */}
```

### Problema: "Modal ocupa toda la pantalla en mobile"
**Causa:** Falta de padding/margin
**Solución:**
```typescript
<DialogContent className="w-[95vw] max-w-2xl mx-auto">
```

### Problema: "Grid causa overflow"
**Causa:** Gap + padding excede 100vw
**Solución:**
```typescript
<div className="px-4">
  <div className="grid grid-cols-2 gap-4 -mx-4 px-4">
```

---

## 📝 Notas de Implementación

### **Prioridad Alta** (Hacer primero)
1. Viewport meta tag
2. CSS anti-overflow global
3. Calendario mobile
4. Truncate en textos largos

### **Prioridad Media** (Hacer después)
5. Grids responsive
6. Modales optimizados
7. Botones con iconos

### **Prioridad Baja** (Nice to have)
8. Animaciones de transición
9. Gestos de swipe avanzados
10. PWA features (si aplica)

---

**Última actualización:** 12 de noviembre de 2025
**Estimación total:** 8-12 días de desarrollo
**Versión:** 1.0
