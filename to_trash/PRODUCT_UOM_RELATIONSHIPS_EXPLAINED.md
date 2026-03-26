# Product UoM Relationships - Explicación Completa

## El Problema

La UI actual solo muestra las UoMs asignadas, pero **no muestra cómo se relacionan**. Sin las relaciones, no sabes:
- ¿Cuántas Piezas hay en una Caja?
- ¿Cuántas Displays hay en una Caja?
- ¿Cuántas Piezas hay en un Display?

## La Solución: Relaciones de Conversión

Las relaciones definen **cómo se convierten las UoMs entre sí** para cada producto.

## Ejemplo 1: Producto A (Laptop)

### Unidades Asignadas
```
✓ Pieza (Individual unit)
✓ Display (Display package)
✓ Caja (Complete box)
```

### Relaciones (Lo que FALTA en la UI)
```
Caja → Display: 10
  (1 Caja = 10 Displays)

Display → Pieza: 12
  (1 Display = 12 Piezas)
```

### Cálculo Automático
```
Sistema calcula automáticamente:
Caja → Pieza: 120
  (1 Caja = 10 Displays × 12 Piezas = 120 Piezas)
```

### Respuesta a tu pregunta
```
Si recibo 1 Caja, ¿cuántas Piezas tengo?
→ 120 Piezas (porque 1 Caja = 10 Displays = 120 Piezas)
```

## Ejemplo 2: Producto B (Otro Producto)

### Unidades Asignadas
```
✓ Pieza (Individual unit)
✓ Caja (Complete box)
```

### Relaciones
```
Caja → Pieza: 6
  (1 Caja = 6 Piezas)
```

### Respuesta a tu pregunta
```
Si recibo 1 Caja, ¿cuántas Piezas tengo?
→ 6 Piezas (porque 1 Caja = 6 Piezas)
```

## La Diferencia Clave

**Producto A:**
- 1 Caja = 120 Piezas

**Producto B:**
- 1 Caja = 6 Piezas

**¡Son diferentes porque cada producto define sus propias relaciones!**

## Cómo Funciona en la Base de Datos

### Tabla: uoms (Unidades Asignadas)
```
product_id | uom_catalog_id | name
-----------|----------------|----------
prod-A     | pieza-id       | Pieza
prod-A     | display-id     | Display
prod-A     | caja-id        | Caja
prod-B     | pieza-id       | Pieza
prod-B     | caja-id        | Caja
```

### Tabla: uom_relationships (Relaciones)
```
product_id | source_uom_id | target_uom_id | factor
-----------|---------------|---------------|--------
prod-A     | caja-uom-A    | display-uom-A | 10
prod-A     | display-uom-A | pieza-uom-A   | 12
prod-B     | caja-uom-B    | pieza-uom-B   | 6
```

## Cómo se Usa en la UI

### Paso 1: Asignar UoMs
```
Usuario selecciona: Pieza, Display, Caja
↓
POST /api/tenant/products/prod-A/uoms
{ "uom_catalog_id": "pieza-id" }
{ "uom_catalog_id": "display-id" }
{ "uom_catalog_id": "caja-id" }
↓
Se muestran en "Unidades Asignadas"
```

### Paso 2: Crear Relaciones (ESTO FALTA EN LA UI)
```
Usuario define:
De: Caja
A: Display
Factor: 10
↓
POST /api/tenant/products/prod-A/uom-relationships
{
  "source_uom_id": "caja-uom-A",
  "target_uom_id": "display-uom-A",
  "conversion_factor": 10
}
↓
Se muestra en "Relaciones de Conversión"
```

### Paso 3: Crear Segunda Relación
```
Usuario define:
De: Display
A: Pieza
Factor: 12
↓
POST /api/tenant/products/prod-A/uom-relationships
{
  "source_uom_id": "display-uom-A",
  "target_uom_id": "pieza-uom-A",
  "conversion_factor": 12
}
↓
Sistema calcula automáticamente:
Caja → Pieza: 120 (10 × 12)
```

## Visualización Correcta en la UI

```
┌────────────────────────────────────────────────────────────┐
│ Producto A - Editar                                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 1️⃣  UNIDADES ASIGNADAS                                    │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ✓ Pieza (Individual unit)                [Eliminar]  │   │
│ │ ✓ Display (Display package)              [Eliminar]  │   │
│ │ ✓ Caja (Complete box)                    [Eliminar]  │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│ 2️⃣  RELACIONES DE CONVERSIÓN                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Crear Nueva Relación:                                │   │
│ │ De: [Caja ▼]                                         │   │
│ │ A: [Display ▼]                                       │   │
│ │ Factor: [10]                                         │   │
│ │ [Crear Relación]                                     │   │
│ │                                                      │   │
│ │ Relaciones Existentes:                               │   │
│ │ ┌──────────────────────────────────────────────────┐ │   │
│ │ │ De      │ A       │ Factor │ Tipo      │ Acc    │ │   │
│ │ ├──────────────────────────────────────────────────┤ │   │
│ │ │ Caja    │ Display │ 10     │ Explícita │ [Del] │ │   │
│ │ │ Display │ Pieza   │ 12     │ Explícita │ [Del] │ │   │
│ │ │ Caja    │ Pieza   │ 120    │ Calculada │ -     │ │   │
│ │ └──────────────────────────────────────────────────┘ │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│ [Cancelar]                                  [Guardar]     │
└────────────────────────────────────────────────────────────┘
```

## Comparación: Producto A vs Producto B

### Producto A
```
Unidades:
- Pieza
- Display
- Caja

Relaciones:
- Caja → Display (10)
- Display → Pieza (12)
- Caja → Pieza (120) [calculada]

Conversión:
1 Caja = 120 Piezas
```

### Producto B
```
Unidades:
- Pieza
- Caja

Relaciones:
- Caja → Pieza (6)

Conversión:
1 Caja = 6 Piezas
```

## Cómo Saber si una Unidad se Relaciona con Otra

**Mira la tabla de "Relaciones de Conversión"**

Si existe una fila que dice:
```
Caja → Display (10)
```

Significa:
- ✅ Caja se relaciona con Display
- ✅ 1 Caja = 10 Displays
- ✅ Puedes convertir de Caja a Display

Si NO existe una fila que diga:
```
Caja → Pieza
```

Significa:
- ❌ No hay relación directa entre Caja y Pieza
- ❌ Pero si existe: Caja → Display → Pieza
- ✅ El sistema calcula automáticamente: Caja → Pieza (10 × 12 = 120)

## Endpoints Necesarios

### 1. Asignar UoM
```
POST /api/tenant/products/{productId}/uoms
{ "uom_catalog_id": "..." }
```

### 2. Crear Relación
```
POST /api/tenant/products/{productId}/uom-relationships
{
  "source_uom_id": "...",
  "target_uom_id": "...",
  "conversion_factor": 10
}
```

### 3. Obtener Relaciones
```
GET /api/tenant/products/{productId}/uom-relationships
```

### 4. Convertir Cantidad
```
POST /api/tenant/products/{productId}/uom-convert
{
  "quantity": 1,
  "from_uom_id": "caja-uom-id",
  "to_uom_id": "pieza-uom-id"
}
→ Response: { "converted_quantity": 120 }
```

## Flujo Completo en la UI

### Paso 1: Crear Producto A
```
Nombre: Laptop
SKU: LAPTOP-001
```

### Paso 2: Asignar UoMs
```
[Asignar] Pieza
[Asignar] Display
[Asignar] Caja
```

### Paso 3: Crear Relaciones
```
De: Caja → A: Display → Factor: 10 [Crear]
De: Display → A: Pieza → Factor: 12 [Crear]
```

### Paso 4: Ver Resultado
```
Relaciones:
Caja → Display (10) [Explícita]
Display → Pieza (12) [Explícita]
Caja → Pieza (120) [Calculada]
```

### Paso 5: Convertir
```
¿Cuántas Piezas hay en 1 Caja?
Cantidad: 1
De: Caja
A: Pieza
[Convertir]
→ Resultado: 120 Piezas
```

## Resumen

| Concepto | Explicación |
|----------|-------------|
| **UoM Asignada** | Una unidad que el producto usa (Pieza, Display, Caja) |
| **Relación** | Cómo se convierte una UoM a otra (1 Caja = 10 Displays) |
| **Factor** | El número de conversión (10, 12, 120, etc.) |
| **Explícita** | Relación que el usuario crea manualmente |
| **Calculada** | Relación que el sistema calcula automáticamente |
| **Conversión** | Cambiar de una UoM a otra usando las relaciones |

## Ejemplo Final: Tu Pregunta

**Producto A:**
```
Unidades: Pieza, Display, Caja
Relaciones:
- Caja → Display (10)
- Display → Pieza (12)

Pregunta: Si recibo 1 Caja, ¿cuántas Piezas tengo?
Respuesta: 120 Piezas
Cálculo: 1 Caja × 10 Displays/Caja × 12 Piezas/Display = 120 Piezas
```

**Producto B:**
```
Unidades: Pieza, Caja
Relaciones:
- Caja → Pieza (6)

Pregunta: Si recibo 1 Caja, ¿cuántas Piezas tengo?
Respuesta: 6 Piezas
Cálculo: 1 Caja × 6 Piezas/Caja = 6 Piezas
```

**¡Cada producto tiene sus propias relaciones!**
