# Product UoM UI - Correct Implementation Guide

## El Problema

El tab "Unidades Asignadas" actualmente solo muestra una lista de UoMs sin mostrar:
- Las relaciones entre ellas
- Los factores de conversión
- Cómo se relacionan unas con otras

## La Solución

El tab debe tener **3 secciones**:

### Sección 1: Asignar Nuevas UoMs
```
┌─────────────────────────────────────────┐
│ Asignar Unidades de Medida              │
├─────────────────────────────────────────┤
│ Seleccionar UoM: [Pieza ▼]              │
│                                         │
│ [Asignar]                               │
└─────────────────────────────────────────┘
```

### Sección 2: UoMs Asignadas (Sin Relaciones)
```
┌─────────────────────────────────────────┐
│ Unidades Asignadas                      │
├─────────────────────────────────────────┤
│ ✓ Pieza (Individual unit)      [Remove] │
│ ✓ Display (Display package)    [Remove] │
│ ✓ Caja (Complete box)          [Remove] │
└─────────────────────────────────────────┘
```

### Sección 3: Relaciones de Conversión (NUEVA)
```
┌─────────────────────────────────────────┐
│ Relaciones de Conversión                │
├─────────────────────────────────────────┤
│ Crear Nueva Relación:                   │
│ De: [Caja ▼]                            │
│ A: [Display ▼]                          │
│ Factor: [5]                             │
│ [Crear]                                 │
│                                         │
│ Relaciones Existentes:                  │
│ ┌───────────────────────────────────┐   │
│ │ De      │ A       │ Factor │ Acc  │   │
│ ├───────────────────────────────────┤   │
│ │ Caja    │ Display │ 5      │ Del  │   │
│ │ Display │ Pieza   │ 10     │ Del  │   │
│ │ Caja    │ Pieza   │ 50*    │ -    │   │
│ └───────────────────────────────────┘   │
│ * Calculada automáticamente             │
└─────────────────────────────────────────┘
```

## Flujo Correcto en la UI

### Paso 1: Asignar UoMs
```
Usuario selecciona: Pieza, Display, Caja
↓
POST /api/tenant/products/{id}/uoms
{ "uom_catalog_id": "pieza-id" }
{ "uom_catalog_id": "display-id" }
{ "uom_catalog_id": "caja-id" }
↓
Se muestran en "Unidades Asignadas"
```

### Paso 2: Crear Relaciones
```
Usuario define:
- De: Caja
- A: Display
- Factor: 5
↓
POST /api/tenant/products/{id}/uom-relationships
{
  "source_uom_id": "caja-uom-id",
  "target_uom_id": "display-uom-id",
  "conversion_factor": 5
}
↓
Se muestra en "Relaciones de Conversión"
```

### Paso 3: Ver Relaciones Calculadas
```
Sistema calcula automáticamente:
- Caja → Display (5)
- Display → Pieza (10)
- Caja → Pieza (50) ← Calculada
↓
Se muestran todas en la tabla
```

## Diseño Correcto del Tab

```
┌──────────────────────────────────────────────────────────┐
│ Editar Producto - Unidades Asignadas                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 1. Asignar Nuevas Unidades                         │   │
│ ├────────────────────────────────────────────────────┤   │
│ │ Seleccionar: [Pieza ▼]                             │   │
│ │ [Asignar]                                          │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 2. Unidades Asignadas                              │   │
│ ├────────────────────────────────────────────────────┤   │
│ │ ✓ Pieza (Individual unit)           [Eliminar]    │   │
│ │ ✓ Display (Display package)         [Eliminar]    │   │
│ │ ✓ Caja (Complete box)               [Eliminar]    │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 3. Relaciones de Conversión                        │   │
│ ├────────────────────────────────────────────────────┤   │
│ │ Crear Nueva Relación:                              │   │
│ │ De: [Caja ▼]                                       │   │
│ │ A: [Display ▼]                                     │   │
│ │ Factor: [5]                                        │   │
│ │ [Crear Relación]                                   │   │
│ │                                                    │   │
│ │ Relaciones Existentes:                             │   │
│ │ ┌──────────────────────────────────────────────┐   │   │
│ │ │ De      │ A       │ Factor │ Acciones       │   │   │
│ │ ├──────────────────────────────────────────────┤   │   │
│ │ │ Caja    │ Display │ 5      │ [Eliminar]     │   │   │
│ │ │ Display │ Pieza   │ 10     │ [Eliminar]     │   │   │
│ │ │ Caja    │ Pieza   │ 50*    │ (Calculada)    │   │   │
│ │ └──────────────────────────────────────────────┘   │   │
│ │ * Calculada automáticamente                        │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ [Cancelar]                              [Guardar]       │
└──────────────────────────────────────────────────────────┘
```

## Lógica de la UI

### Cuando se Asigna una UoM
```typescript
// 1. Obtener UoMs asignadas
GET /api/tenant/products/{productId}/uoms
→ Mostrar en "Unidades Asignadas"

// 2. Obtener relaciones existentes
GET /api/tenant/products/{productId}/uom-relationships
→ Mostrar en "Relaciones de Conversión"

// 3. En el dropdown "De" y "A"
→ Solo mostrar UoMs que están asignadas
```

### Cuando se Crea una Relación
```typescript
// 1. Validar que ambas UoMs estén asignadas
if (!uomsAsignadas.includes(sourceUoM)) {
  mostrar error: "La UoM origen no está asignada"
}

// 2. Validar que no sea la misma UoM
if (sourceUoM === targetUoM) {
  mostrar error: "No puedes relacionar una UoM consigo misma"
}

// 3. Crear relación
POST /api/tenant/products/{productId}/uom-relationships
{
  "source_uom_id": sourceUoM,
  "target_uom_id": targetUoM,
  "conversion_factor": factor
}

// 4. Recargar relaciones
GET /api/tenant/products/{productId}/uom-relationships
→ Actualizar tabla
```

### Cuando se Elimina una UoM
```typescript
// 1. Verificar si tiene relaciones
GET /api/tenant/products/{productId}/uom-relationships
if (relaciones.some(r => r.source_uom_id === uomId || r.target_uom_id === uomId)) {
  mostrar error: "No puedes eliminar una UoM que tiene relaciones"
  sugerencia: "Elimina las relaciones primero"
}

// 2. Si no tiene relaciones, eliminar
DELETE /api/tenant/products/{productId}/uoms/{uomId}

// 3. Recargar
GET /api/tenant/products/{productId}/uoms
→ Actualizar lista
```

## Ejemplo Completo: Laptop

### Estado Inicial
```
Unidades Asignadas: (vacío)
Relaciones: (vacío)
```

### Después de Asignar UoMs
```
Unidades Asignadas:
✓ Pieza
✓ Display
✓ Caja

Relaciones: (vacío)
```

### Después de Crear Primera Relación
```
Usuario crea: Caja → Display (5)

Relaciones:
Caja → Display (5)
```

### Después de Crear Segunda Relación
```
Usuario crea: Display → Pieza (10)

Relaciones:
Caja → Display (5)
Display → Pieza (10)
Caja → Pieza (50) ← Calculada automáticamente
```

## Validaciones en la UI

### Al Asignar UoM
- ✓ No permitir duplicados
- ✓ Solo mostrar UoMs del catálogo
- ✓ Mostrar descripción de cada UoM

### Al Crear Relación
- ✓ Validar que ambas UoMs estén asignadas
- ✓ Validar que no sea la misma UoM
- ✓ Validar que el factor sea > 0
- ✓ Validar que no exista ya esa relación

### Al Eliminar UoM
- ✓ Verificar que no tenga relaciones
- ✓ Mostrar error si tiene relaciones
- ✓ Sugerir eliminar relaciones primero

### Al Eliminar Relación
- ✓ Permitir eliminar solo relaciones explícitas
- ✓ No permitir eliminar relaciones calculadas
- ✓ Recargar tabla después de eliminar

## Estados de la UI

### Estado: Cargando
```
┌─────────────────────────────────────────┐
│ Cargando unidades...                    │
│ ⟳ Loading...                            │
└─────────────────────────────────────────┘
```

### Estado: Error
```
┌─────────────────────────────────────────┐
│ ⚠️ Error                                │
│ No se pudieron cargar las unidades      │
│ [Reintentar]                            │
└─────────────────────────────────────────┘
```

### Estado: Éxito
```
┌─────────────────────────────────────────┐
│ ✓ Relación creada exitosamente          │
│ Caja → Display (5)                      │
└─────────────────────────────────────────┘
```

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                    Component State                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ uomsAsignadas: [                                        │
│   { id: "uom-1", catalog: { name: "Pieza" } },        │
│   { id: "uom-2", catalog: { name: "Display" } },      │
│   { id: "uom-3", catalog: { name: "Caja" } }          │
│ ]                                                       │
│                                                         │
│ relaciones: [                                           │
│   { id: "rel-1", source: "uom-3", target: "uom-2",    │
│     factor: 5 },                                        │
│   { id: "rel-2", source: "uom-2", target: "uom-1",    │
│     factor: 10 },                                       │
│   { id: "rel-3", source: "uom-3", target: "uom-1",    │
│     factor: 50, calculated: true }                      │
│ ]                                                       │
│                                                         │
│ loading: false                                          │
│ error: null                                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Endpoints Necesarios

```
GET /api/uom-catalog
→ Para llenar dropdown de UoMs disponibles

GET /api/tenant/products/{productId}/uoms
→ Para mostrar UoMs asignadas

POST /api/tenant/products/{productId}/uoms
→ Para asignar nueva UoM

DELETE /api/tenant/products/{productId}/uoms/{uomId}
→ Para eliminar UoM asignada

GET /api/tenant/products/{productId}/uom-relationships
→ Para mostrar relaciones

POST /api/tenant/products/{productId}/uom-relationships
→ Para crear relación

DELETE /api/tenant/products/{productId}/uom-relationships/{relId}
→ Para eliminar relación
```

## Resumen

**Lo que faltaba:**
- Mostrar relaciones de conversión
- Permitir crear relaciones
- Mostrar factores de conversión
- Mostrar relaciones calculadas

**Lo que debe hacer la UI:**
1. Mostrar UoMs asignadas
2. Permitir crear relaciones entre ellas
3. Mostrar todas las relaciones (explícitas y calculadas)
4. Validar que no haya conflictos
5. Permitir eliminar relaciones

**Endpoints que necesita:**
- GET/POST/DELETE para UoMs
- GET/POST/DELETE para relaciones
