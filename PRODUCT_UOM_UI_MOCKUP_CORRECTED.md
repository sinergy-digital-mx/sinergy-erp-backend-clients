# Product UoM UI - Mockup Corregido

## El Problema con la UI Actual

La UI actual solo muestra una lista de UoMs sin mostrar las relaciones entre ellas.

### ❌ Lo que está mal ahora
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

❌ PROBLEMA: No muestra cómo se relacionan
❌ PROBLEMA: No muestra factores de conversión
❌ PROBLEMA: No muestra si 1 Caja = 5 Displays
```

## La Solución: UI Corregida

### ✅ Diseño Correcto

```
┌────────────────────────────────────────────────────────────────┐
│ Editar Producto - Unidades Asignadas                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 1️⃣  ASIGNAR NUEVAS UNIDADES                             │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │                                                          │   │
│ │ Seleccionar UoM: [Seleccionar ▼]                        │   │
│ │                                                          │   │
│ │ Disponibles:                                             │   │
│ │ • Pieza (Individual unit)                               │   │
│ │ • Display (Display package)                             │   │
│ │ • Caja (Complete box)                                   │   │
│ │ • Pallet (Complete pallet)                              │   │
│ │ • Bulto (Product bundle)                                │   │
│ │ • Docena (Twelve units)                                 │   │
│ │ • Metro (Linear meter)                                  │   │
│ │ • Kilogramo (Kilogram weight)                           │   │
│ │                                                          │   │
│ │ [Asignar]                                               │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 2️⃣  UNIDADES ASIGNADAS                                  │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │                                                          │   │
│ │ ✓ Pieza (Individual unit)                   [Eliminar]  │   │
│ │ ✓ Display (Display package)                 [Eliminar]  │   │
│ │ ✓ Caja (Complete box)                       [Eliminar]  │   │
│ │                                                          │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 3️⃣  RELACIONES DE CONVERSIÓN                            │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │                                                          │   │
│ │ Crear Nueva Relación:                                    │   │
│ │ ┌────────────────────────────────────────────────────┐   │   │
│ │ │ De: [Caja ▼]                                       │   │   │
│ │ │ A: [Display ▼]                                     │   │   │
│ │ │ Factor: [5]                                        │   │   │
│ │ │ [Crear Relación]                                   │   │   │
│ │ └────────────────────────────────────────────────────┘   │   │
│ │                                                          │   │
│ │ Relaciones Existentes:                                   │   │
│ │ ┌────────────────────────────────────────────────────┐   │   │
│ │ │ De      │ A       │ Factor │ Tipo      │ Acciones │   │   │
│ │ ├────────────────────────────────────────────────────┤   │   │
│ │ │ Caja    │ Display │ 5      │ Explícita │ [Elim]   │   │   │
│ │ │ Display │ Pieza   │ 10     │ Explícita │ [Elim]   │   │   │
│ │ │ Caja    │ Pieza   │ 50     │ Calculada │ -        │   │   │
│ │ └────────────────────────────────────────────────────┘   │   │
│ │                                                          │   │
│ │ 💡 Tip: Las relaciones calculadas se generan             │   │
│ │    automáticamente a partir de las explícitas            │   │
│ │                                                          │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ [Cancelar]                                      [Guardar]     │
└────────────────────────────────────────────────────────────────┘
```

## Comparación: Antes vs Después

### ANTES (Incorrecto)
```
Tab: "Unidades Asignadas"
├─ Tabla con UoMs
│  ├─ Código
│  ├─ Nombre
│  ├─ Creado
│  └─ Acciones (Editar, Eliminar)
└─ ❌ NO muestra relaciones
```

### DESPUÉS (Correcto)
```
Tab: "Unidades Asignadas"
├─ Sección 1: Asignar nuevas UoMs
│  ├─ Dropdown con catálogo
│  └─ Botón Asignar
├─ Sección 2: UoMs asignadas
│  ├─ Lista de UoMs
│  └─ Botón Eliminar por cada una
└─ Sección 3: Relaciones de conversión ✅ NUEVA
   ├─ Formulario para crear relación
   │  ├─ Dropdown: De (solo UoMs asignadas)
   │  ├─ Dropdown: A (solo UoMs asignadas)
   │  ├─ Input: Factor
   │  └─ Botón: Crear
   └─ Tabla de relaciones
      ├─ De
      ├─ A
      ├─ Factor
      ├─ Tipo (Explícita/Calculada)
      └─ Acciones (Eliminar solo explícitas)
```

## Flujo de Interacción

### Paso 1: Asignar UoMs
```
Usuario hace clic en dropdown "Seleccionar UoM"
↓
Se muestran todas las UoMs del catálogo
↓
Usuario selecciona "Caja"
↓
Usuario hace clic en "Asignar"
↓
POST /api/tenant/products/{id}/uoms
{ "uom_catalog_id": "caja-id" }
↓
Se recarga la lista de "Unidades Asignadas"
↓
Aparece "Caja" en la lista
```

### Paso 2: Crear Relación
```
Usuario selecciona en "De": Caja
Usuario selecciona en "A": Display
Usuario ingresa "Factor": 5
↓
Usuario hace clic en "Crear Relación"
↓
POST /api/tenant/products/{id}/uom-relationships
{
  "source_uom_id": "caja-uom-id",
  "target_uom_id": "display-uom-id",
  "conversion_factor": 5
}
↓
Se recarga la tabla de relaciones
↓
Aparece nueva fila: Caja → Display (5)
```

### Paso 3: Sistema Calcula Automáticamente
```
Usuario crea segunda relación: Display → Pieza (10)
↓
Sistema detecta que existe:
- Caja → Display (5)
- Display → Pieza (10)
↓
Sistema calcula automáticamente:
- Caja → Pieza (5 × 10 = 50)
↓
Se muestra en la tabla como "Calculada"
```

## Validaciones Necesarias

### Al Asignar UoM
```
✓ Validar que no esté ya asignada
  Si está: Mostrar error "Esta UoM ya está asignada"

✓ Validar que exista en el catálogo
  Si no existe: Mostrar error "UoM no encontrada"
```

### Al Crear Relación
```
✓ Validar que ambas UoMs estén asignadas
  Si no: Mostrar error "Ambas UoMs deben estar asignadas"

✓ Validar que no sea la misma UoM
  Si es igual: Mostrar error "No puedes relacionar una UoM consigo misma"

✓ Validar que el factor sea > 0
  Si es ≤ 0: Mostrar error "El factor debe ser mayor a 0"

✓ Validar que no exista ya esa relación
  Si existe: Mostrar error "Esta relación ya existe"
```

### Al Eliminar UoM
```
✓ Verificar que no tenga relaciones
  Si tiene: Mostrar error "No puedes eliminar una UoM que tiene relaciones"
  Sugerencia: "Elimina las relaciones primero"

Si no tiene relaciones:
  DELETE /api/tenant/products/{id}/uoms/{uomId}
  ✓ Eliminar
```

### Al Eliminar Relación
```
✓ Solo permitir eliminar relaciones explícitas
  Si es calculada: No mostrar botón eliminar

✓ Permitir eliminar relaciones explícitas
  DELETE /api/tenant/products/{id}/uom-relationships/{relId}
  ✓ Eliminar
```

## Estados de la UI

### Estado: Cargando
```
┌──────────────────────────────────────────┐
│ ⟳ Cargando unidades...                   │
└──────────────────────────────────────────┘
```

### Estado: Error al Asignar
```
┌──────────────────────────────────────────┐
│ ⚠️ Error                                 │
│ Esta UoM ya está asignada                │
│ [OK]                                     │
└──────────────────────────────────────────┘
```

### Estado: Error al Crear Relación
```
┌──────────────────────────────────────────┐
│ ⚠️ Error                                 │
│ No puedes relacionar una UoM consigo     │
│ misma                                    │
│ [OK]                                     │
└──────────────────────────────────────────┘
```

### Estado: Error al Eliminar UoM
```
┌──────────────────────────────────────────┐
│ ⚠️ Error                                 │
│ No puedes eliminar una UoM que tiene     │
│ relaciones                               │
│                                          │
│ Relaciones existentes:                   │
│ • Caja → Display (5)                     │
│ • Caja → Pieza (50)                      │
│                                          │
│ Elimina estas relaciones primero         │
│ [OK]                                     │
└──────────────────────────────────────────┘
```

### Estado: Éxito
```
┌──────────────────────────────────────────┐
│ ✓ Relación creada exitosamente           │
│ Caja → Display (5)                       │
│ [OK]                                     │
└──────────────────────────────────────────┘
```

## Ejemplo Completo: Laptop

### Paso 1: Asignar Pieza
```
Usuario selecciona "Pieza" y hace clic "Asignar"
↓
Unidades Asignadas:
✓ Pieza (Individual unit)
```

### Paso 2: Asignar Display
```
Usuario selecciona "Display" y hace clic "Asignar"
↓
Unidades Asignadas:
✓ Pieza (Individual unit)
✓ Display (Display package)
```

### Paso 3: Asignar Caja
```
Usuario selecciona "Caja" y hace clic "Asignar"
↓
Unidades Asignadas:
✓ Pieza (Individual unit)
✓ Display (Display package)
✓ Caja (Complete box)
```

### Paso 4: Crear Relación Caja → Display
```
Usuario:
- De: Caja
- A: Display
- Factor: 5
- Hace clic "Crear Relación"
↓
Relaciones:
Caja → Display (5) [Explícita]
```

### Paso 5: Crear Relación Display → Pieza
```
Usuario:
- De: Display
- A: Pieza
- Factor: 10
- Hace clic "Crear Relación"
↓
Relaciones:
Caja → Display (5) [Explícita]
Display → Pieza (10) [Explícita]
Caja → Pieza (50) [Calculada] ← Sistema la calcula
```

## Código TypeScript Necesario

```typescript
interface UoMAsignada {
  id: string;
  product_id: string;
  uom_catalog_id: string;
  catalog: {
    id: string;
    name: string;
    description: string;
  };
}

interface Relacion {
  id: string;
  product_id: string;
  source_uom_id: string;
  target_uom_id: string;
  conversion_factor: number;
  calculated?: boolean; // true si es calculada
}

interface ComponentState {
  uomsAsignadas: UoMAsignada[];
  relaciones: Relacion[];
  loading: boolean;
  error: string | null;
  formData: {
    sourceUomId: string;
    targetUomId: string;
    factor: number;
  };
}
```

## Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| Secciones | 1 (solo lista) | 3 (asignar, lista, relaciones) |
| Muestra relaciones | ❌ No | ✅ Sí |
| Muestra factores | ❌ No | ✅ Sí |
| Permite crear relaciones | ❌ No | ✅ Sí |
| Muestra relaciones calculadas | ❌ No | ✅ Sí |
| Validaciones | Mínimas | Completas |
| Endpoints usados | 2 | 6 |

## Endpoints Necesarios

```
1. GET /api/uom-catalog
   → Llenar dropdown de UoMs disponibles

2. GET /api/tenant/products/{id}/uoms
   → Mostrar UoMs asignadas

3. POST /api/tenant/products/{id}/uoms
   → Asignar nueva UoM

4. DELETE /api/tenant/products/{id}/uoms/{uomId}
   → Eliminar UoM asignada

5. GET /api/tenant/products/{id}/uom-relationships
   → Mostrar relaciones

6. POST /api/tenant/products/{id}/uom-relationships
   → Crear relación

7. DELETE /api/tenant/products/{id}/uom-relationships/{relId}
   → Eliminar relación
```

## Conclusión

La UI debe mostrar **3 cosas claramente**:
1. ✅ Qué UoMs están asignadas
2. ✅ Cómo se relacionan entre sí
3. ✅ Cuáles son los factores de conversión

Sin esto, el usuario no entiende cómo funciona el sistema.
