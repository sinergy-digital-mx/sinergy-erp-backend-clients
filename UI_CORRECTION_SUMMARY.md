# UI Correction Summary - Product UoM System

## El Problema Identificado

La UI actual del tab "Unidades Asignadas" **no muestra las relaciones de conversión** entre las UoMs.

### ❌ Lo que está mal
```
Tab: "Unidades Asignadas"
├─ Tabla con UoMs
│  ├─ Código: box, caja, display, pallet, pieza, unit
│  ├─ Nombre: Box (10 units), Caja, Display, etc.
│  ├─ Creado: fechas
│  └─ Acciones: Editar, Eliminar
└─ ❌ NO MUESTRA:
   ├─ Cómo se relacionan las UoMs
   ├─ Factores de conversión (1 Caja = 5 Displays)
   ├─ Si 1 Caja = 5 Displays = 50 Piezas
   └─ Relaciones calculadas automáticamente
```

## La Solución

El tab debe tener **3 secciones claramente separadas**:

### Sección 1: Asignar Nuevas UoMs
```
Permite al usuario seleccionar UoMs del catálogo global
y asignarlas al producto
```

### Sección 2: UoMs Asignadas
```
Muestra la lista de UoMs que ya están asignadas
Permite eliminar UoMs (si no tienen relaciones)
```

### Sección 3: Relaciones de Conversión (LA NUEVA)
```
Permite crear relaciones entre UoMs asignadas
Muestra todas las relaciones (explícitas y calculadas)
Permite eliminar relaciones explícitas
```

## Documentos Creados

### 1. PRODUCT_UOM_UI_CORRECT_IMPLEMENTATION.md
**Qué contiene:**
- Explicación del problema
- Solución con 3 secciones
- Flujo correcto de datos
- Validaciones necesarias
- Estados de la UI
- Endpoints necesarios

**Para quién:**
- Frontend developers
- UI architects

**Leer en:** 15 minutos

### 2. PRODUCT_UOM_UI_MOCKUP_CORRECTED.md
**Qué contiene:**
- Mockup visual completo
- Comparación antes vs después
- Flujo de interacción paso a paso
- Validaciones detalladas
- Estados de error
- Ejemplo completo (Laptop)
- Código TypeScript necesario

**Para quién:**
- Designers
- Frontend developers
- Product managers

**Leer en:** 20 minutos

## Cambios Necesarios en la UI

### Antes (Incorrecto)
```
┌──────────────────────────────────────────────────────┐
│ Unidades Asignadas                                   │
├──────────────────────────────────────────────────────┤
│ Código    │ Nombre              │ Creado    │ Acc    │
├──────────────────────────────────────────────────────┤
│ box       │ Box (10 units)      │ 3/6/26    │ E  D   │
│ caja      │ Caja                │ 3/7/26    │ E  D   │
│ display   │ Display             │ 3/7/26    │ E  D   │
│ pallet    │ Pallet (100 units)  │ 3/6/26    │ E  D   │
│ pieza     │ Pieza               │ 3/7/26    │ E  D   │
│ unit      │ Unit                │ 3/6/26    │ E  D   │
└──────────────────────────────────────────────────────┘
```

### Después (Correcto)
```
┌────────────────────────────────────────────────────────────────┐
│ Editar Producto - Unidades Asignadas                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 1️⃣  ASIGNAR NUEVAS UNIDADES                                   │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Seleccionar UoM: [Seleccionar ▼]                        │   │
│ │ [Asignar]                                               │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ 2️⃣  UNIDADES ASIGNADAS                                        │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ ✓ Pieza (Individual unit)                   [Eliminar]  │   │
│ │ ✓ Display (Display package)                 [Eliminar]  │   │
│ │ ✓ Caja (Complete box)                       [Eliminar]  │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ 3️⃣  RELACIONES DE CONVERSIÓN ← NUEVA SECCIÓN                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Crear Nueva Relación:                                    │   │
│ │ De: [Caja ▼]  A: [Display ▼]  Factor: [5]  [Crear]     │   │
│ │                                                          │   │
│ │ Relaciones Existentes:                                   │   │
│ │ ┌──────────────────────────────────────────────────────┐ │   │
│ │ │ De      │ A       │ Factor │ Tipo      │ Acciones   │ │   │
│ │ ├──────────────────────────────────────────────────────┤ │   │
│ │ │ Caja    │ Display │ 5      │ Explícita │ [Elim]     │ │   │
│ │ │ Display │ Pieza   │ 10     │ Explícita │ [Elim]     │ │   │
│ │ │ Caja    │ Pieza   │ 50     │ Calculada │ -          │ │   │
│ │ └──────────────────────────────────────────────────────┘ │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ [Cancelar]                                      [Guardar]     │
└────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos Correcto

### Paso 1: Asignar UoMs
```
Usuario selecciona UoMs del catálogo
↓
POST /api/tenant/products/{id}/uoms
{ "uom_catalog_id": "..." }
↓
GET /api/tenant/products/{id}/uoms
→ Mostrar en "Unidades Asignadas"
```

### Paso 2: Crear Relaciones
```
Usuario define: De → A (Factor)
↓
POST /api/tenant/products/{id}/uom-relationships
{
  "source_uom_id": "...",
  "target_uom_id": "...",
  "conversion_factor": 5
}
↓
GET /api/tenant/products/{id}/uom-relationships
→ Mostrar en "Relaciones de Conversión"
```

### Paso 3: Sistema Calcula Automáticamente
```
Si existen:
- Caja → Display (5)
- Display → Pieza (10)

Sistema calcula:
- Caja → Pieza (50) ← Automáticamente
```

## Validaciones Necesarias

### Al Asignar UoM
- ✓ No permitir duplicados
- ✓ Solo mostrar UoMs del catálogo
- ✓ Mostrar descripción

### Al Crear Relación
- ✓ Ambas UoMs deben estar asignadas
- ✓ No puede ser la misma UoM
- ✓ Factor debe ser > 0
- ✓ No puede existir ya esa relación

### Al Eliminar UoM
- ✓ Verificar que no tenga relaciones
- ✓ Mostrar error si tiene relaciones
- ✓ Sugerir eliminar relaciones primero

### Al Eliminar Relación
- ✓ Solo permitir eliminar explícitas
- ✓ No permitir eliminar calculadas

## Endpoints Necesarios

```
GET /api/uom-catalog
→ Llenar dropdown de UoMs disponibles

GET /api/tenant/products/{id}/uoms
→ Mostrar UoMs asignadas

POST /api/tenant/products/{id}/uoms
→ Asignar nueva UoM

DELETE /api/tenant/products/{id}/uoms/{uomId}
→ Eliminar UoM asignada

GET /api/tenant/products/{id}/uom-relationships
→ Mostrar relaciones

POST /api/tenant/products/{id}/uom-relationships
→ Crear relación

DELETE /api/tenant/products/{id}/uom-relationships/{relId}
→ Eliminar relación
```

## Ejemplo Completo: Laptop

### Paso 1: Asignar Pieza
```
Usuario selecciona "Pieza" → [Asignar]
↓
Unidades Asignadas:
✓ Pieza (Individual unit)
```

### Paso 2: Asignar Display
```
Usuario selecciona "Display" → [Asignar]
↓
Unidades Asignadas:
✓ Pieza (Individual unit)
✓ Display (Display package)
```

### Paso 3: Asignar Caja
```
Usuario selecciona "Caja" → [Asignar]
↓
Unidades Asignadas:
✓ Pieza (Individual unit)
✓ Display (Display package)
✓ Caja (Complete box)
```

### Paso 4: Crear Relación Caja → Display
```
De: Caja
A: Display
Factor: 5
[Crear Relación]
↓
Relaciones:
Caja → Display (5) [Explícita]
```

### Paso 5: Crear Relación Display → Pieza
```
De: Display
A: Pieza
Factor: 10
[Crear Relación]
↓
Relaciones:
Caja → Display (5) [Explícita]
Display → Pieza (10) [Explícita]
Caja → Pieza (50) [Calculada] ← Sistema la calcula
```

## Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| Secciones | 1 | 3 |
| Muestra relaciones | ❌ | ✅ |
| Muestra factores | ❌ | ✅ |
| Permite crear relaciones | ❌ | ✅ |
| Muestra calculadas | ❌ | ✅ |
| Validaciones | Mínimas | Completas |
| Endpoints | 2 | 7 |

## Próximos Pasos

1. **Leer** `PRODUCT_UOM_UI_CORRECT_IMPLEMENTATION.md`
2. **Revisar** `PRODUCT_UOM_UI_MOCKUP_CORRECTED.md`
3. **Implementar** las 3 secciones
4. **Agregar** validaciones
5. **Conectar** endpoints
6. **Probar** flujo completo

## Documentos de Referencia

- `PRODUCT_UOM_UI_CORRECT_IMPLEMENTATION.md` - Guía de implementación
- `PRODUCT_UOM_UI_MOCKUP_CORRECTED.md` - Mockups visuales
- `PRODUCT_UOM_QUICK_REFERENCE.md` - Referencia rápida
- `PRODUCT_UOM_CATALOG_INTEGRATION.md` - API reference

---

**Status**: ✅ Documentación completa
**Fecha**: March 7, 2026
**Versión**: 1.0
