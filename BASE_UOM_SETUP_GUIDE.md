# Base UoM Setup Guide

## ¿Qué es la UoM Base?

La **UoM Base** es la unidad de medida fundamental que usarás para almacenar y calcular inventarios. Todas las conversiones se hacen a partir de esta UoM.

## Por Qué es Importante

Cuando recibes inventario en diferentes UoMs:
- Recepción 1: 2 Cajas
- Recepción 2: 5 Displays
- Recepción 3: 10 Piezas

Sin una UoM base, es difícil sumar estos valores. Con una UoM base (Pieza), todo se convierte a la misma unidad:
- Recepción 1: 2 Cajas = 100 Piezas
- Recepción 2: 5 Displays = 25 Piezas
- Recepción 3: 10 Piezas = 10 Piezas
- **Total: 135 Piezas**

## Cómo Configurar la UoM Base

### Paso 1: Obtener el ID de la UoM Catalog

Primero, obtén el ID de la UoM que quieres usar como base:

```bash
GET /api/uom-catalog
```

**Response:**
```json
[
  {
    "id": "uom-cat-1",
    "name": "Pieza",
    "description": "Individual unit"
  },
  {
    "id": "uom-cat-2",
    "name": "Display",
    "description": "Display package"
  },
  {
    "id": "uom-cat-3",
    "name": "Caja",
    "description": "Complete box"
  }
]
```

### Paso 2: Crear Producto con UoM Base

Cuando creas un producto, especifica la UoM base:

```bash
POST /api/tenant/products
{
  "sku": "PROD-001",
  "name": "Laptop Dell XPS 13",
  "description": "High-performance laptop",
  "category_id": "cat-1",
  "subcategory_id": "subcat-1",
  "base_uom_id": "uom-cat-1"  ← UoM Base (Pieza)
}
```

**Response:**
```json
{
  "id": "prod-123",
  "sku": "PROD-001",
  "name": "Laptop Dell XPS 13",
  "base_uom_id": "uom-cat-1",
  "created_at": "2026-03-07T10:00:00Z"
}
```

### Paso 3: Asignar UoMs al Producto

Asigna las UoMs que usarás para este producto:

```bash
POST /api/tenant/products/prod-123/uoms
{ "uom_catalog_id": "uom-cat-1" }  // Pieza

POST /api/tenant/products/prod-123/uoms
{ "uom_catalog_id": "uom-cat-2" }  // Display

POST /api/tenant/products/prod-123/uoms
{ "uom_catalog_id": "uom-cat-3" }  // Caja
```

### Paso 4: Definir Relaciones

Define cómo se relacionan las UoMs:

```bash
POST /api/tenant/products/prod-123/uom-relationships
{
  "source_uom_id": "uom-prod-3",  // Caja
  "target_uom_id": "uom-prod-2",  // Display
  "conversion_factor": 10
}

POST /api/tenant/products/prod-123/uom-relationships
{
  "source_uom_id": "uom-prod-2",  // Display
  "target_uom_id": "uom-prod-1",  // Pieza
  "conversion_factor": 5
}
```

## Cómo Usar la UoM Base en Inventario

### Recibir Inventario

Cuando recibes 2 Cajas:

```bash
POST /api/tenant/inventory/movements
{
  "product_id": "prod-123",
  "warehouse_id": "wh-1",
  "received_uom_id": "uom-prod-3",  // Caja
  "received_quantity": 2,
  "base_uom_id": "uom-cat-1",       // Pieza (UoM Base)
  "base_quantity": 100,              // 2 Cajas × 50 Piezas/Caja
  "movement_type": "RECEIPT",
  "reference_type": "PURCHASE_ORDER",
  "reference_id": "PO-2026-001"
}
```

El sistema automáticamente:
1. Registra que recibiste 2 Cajas
2. Convierte a 100 Piezas (usando la UoM base)
3. Almacena el saldo en Piezas

### Consultar Saldo

Puedes consultar el saldo en cualquier UoM:

```bash
# Saldo en Piezas (UoM Base)
GET /api/tenant/inventory/balance/prod-123/wh-1?uom=uom-cat-1
→ 100 Piezas

# Saldo en Displays
GET /api/tenant/inventory/balance/prod-123/wh-1?uom=uom-cat-2
→ 20 Displays (100 ÷ 5)

# Saldo en Cajas
GET /api/tenant/inventory/balance/prod-123/wh-1?uom=uom-cat-3
→ 2 Cajas (100 ÷ 50)
```

## Actualizar UoM Base

Si necesitas cambiar la UoM base de un producto:

```bash
PATCH /api/tenant/products/prod-123
{
  "base_uom_id": "uom-cat-2"  // Cambiar a Display
}
```

**Nota:** Cambiar la UoM base después de tener inventario puede causar inconsistencias. Es mejor definirla correctamente desde el inicio.

## Mejores Prácticas

### 1. Elige la UoM Más Pequeña como Base
```
❌ Malo:  Base = Caja
✅ Bueno: Base = Pieza
```

**Razón:** Evita decimales en conversiones.

### 2. Asegúrate de que Todas las Relaciones Convergen a la Base
```
Caja → Display → Pieza (Base) ✅
Caja → Pieza (Base) ✅
Display → Pieza (Base) ✅
```

### 3. Define la UoM Base Antes de Recibir Inventario
```
1. Crear producto
2. Definir UoM base
3. Asignar UoMs
4. Definir relaciones
5. Recibir inventario
```

### 4. Usa Factores de Conversión Consistentes
```
❌ Malo:
Caja → Display: 10
Display → Pieza: 5.5

✅ Bueno:
Caja → Display: 10
Display → Pieza: 5
```

## Ejemplo Completo

### Producto: Laptop Dell XPS 13

**Paso 1: Crear Producto**
```bash
POST /api/tenant/products
{
  "sku": "LAPTOP-001",
  "name": "Laptop Dell XPS 13",
  "base_uom_id": "uom-cat-pieza"  ← Pieza como base
}
```

**Paso 2: Asignar UoMs**
```bash
POST /api/tenant/products/prod-123/uoms
{ "uom_catalog_id": "uom-cat-pieza" }

POST /api/tenant/products/prod-123/uoms
{ "uom_catalog_id": "uom-cat-display" }

POST /api/tenant/products/prod-123/uoms
{ "uom_catalog_id": "uom-cat-caja" }
```

**Paso 3: Definir Relaciones**
```bash
POST /api/tenant/products/prod-123/uom-relationships
{
  "source_uom_id": "uom-prod-caja",
  "target_uom_id": "uom-prod-display",
  "conversion_factor": 10
}

POST /api/tenant/products/prod-123/uom-relationships
{
  "source_uom_id": "uom-prod-display",
  "target_uom_id": "uom-prod-pieza",
  "conversion_factor": 5
}
```

**Paso 4: Recibir Inventario**
```bash
POST /api/tenant/inventory/movements
{
  "product_id": "prod-123",
  "warehouse_id": "wh-1",
  "received_uom_id": "uom-prod-caja",
  "received_quantity": 2,
  "base_quantity": 100,
  "movement_type": "RECEIPT",
  "reference_id": "PO-2026-001"
}
```

**Paso 5: Consultar Saldo**
```bash
GET /api/tenant/inventory/balance/prod-123/wh-1?uom=uom-cat-pieza
→ 100 Piezas

GET /api/tenant/inventory/balance/prod-123/wh-1?uom=uom-cat-display
→ 20 Displays

GET /api/tenant/inventory/balance/prod-123/wh-1?uom=uom-cat-caja
→ 2 Cajas
```

## Resumen

| Concepto | Descripción |
|----------|-------------|
| **UoM Base** | La unidad fundamental para almacenar inventario |
| **Ventaja** | Todas las conversiones se hacen a partir de una unidad común |
| **Mejor Práctica** | Usar la UoM más pequeña como base |
| **Configuración** | Se define al crear el producto |
| **Cambio** | Puede cambiar, pero es mejor definirla correctamente desde el inicio |

