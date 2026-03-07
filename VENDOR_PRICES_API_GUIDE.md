# Vendor Product Prices API Guide

## Overview

El sistema retorna los precios de vendors de dos formas:

1. **Incluidos en el producto** - Cuando obtienes un producto, ya vienen los vendor_prices
2. **Endpoint específico** - Para obtener solo los precios de un producto

## Opción 1: Precios Incluidos en el Producto

### Endpoint
```
GET /api/tenant/products/:productId
```

### Response
```json
{
  "id": "prod-123",
  "tenant_id": "tenant-1",
  "sku": "LAPTOP-001",
  "name": "Laptop",
  "description": "High-performance laptop",
  "category_id": "cat-1",
  "subcategory_id": "subcat-1",
  "created_at": "2026-03-07T10:00:00Z",
  "updated_at": "2026-03-07T10:00:00Z",
  
  "uoms": [
    {
      "id": "uom-1",
      "product_id": "prod-123",
      "uom_catalog_id": "catalog-pieza",
      "name": "Pieza"
    },
    {
      "id": "uom-2",
      "product_id": "prod-123",
      "uom_catalog_id": "catalog-caja",
      "name": "Caja"
    }
  ],
  
  "uom_relationships": [
    {
      "id": "rel-1",
      "product_id": "prod-123",
      "source_uom_id": "uom-2",
      "target_uom_id": "uom-1",
      "conversion_factor": 10,
      "is_calculated": false
    }
  ],
  
  "vendor_prices": [
    {
      "id": "vp-1",
      "vendor_id": "vendor-1",
      "product_id": "prod-123",
      "uom_id": "uom-1",
      "price": 100.00,
      "created_at": "2026-03-07T10:00:00Z",
      "updated_at": "2026-03-07T10:00:00Z"
    },
    {
      "id": "vp-2",
      "vendor_id": "vendor-1",
      "product_id": "prod-123",
      "uom_id": "uom-2",
      "price": 950.00,
      "created_at": "2026-03-07T10:00:00Z",
      "updated_at": "2026-03-07T10:00:00Z"
    },
    {
      "id": "vp-3",
      "vendor_id": "vendor-2",
      "product_id": "prod-123",
      "uom_id": "uom-1",
      "price": 95.00,
      "created_at": "2026-03-07T10:00:00Z",
      "updated_at": "2026-03-07T10:00:00Z"
    }
  ],
  
  "photos": []
}
```

### Ventajas
- ✅ Una sola llamada retorna todo (producto + UoMs + relaciones + precios)
- ✅ Ideal para editar un producto completo
- ✅ Incluye todos los datos necesarios para la UI

### Desventajas
- ❌ Retorna más datos de los que podrías necesitar
- ❌ Si solo necesitas precios, es ineficiente

## Opción 2: Endpoint Específico para Precios

### Endpoint
```
GET /api/tenant/vendor-product-prices/products/:productId
```

### Response
```json
[
  {
    "id": "vp-1",
    "vendor_id": "vendor-1",
    "product_id": "prod-123",
    "uom_id": "uom-1",
    "price": 100.00,
    "created_at": "2026-03-07T10:00:00Z",
    "updated_at": "2026-03-07T10:00:00Z"
  },
  {
    "id": "vp-2",
    "vendor_id": "vendor-1",
    "product_id": "prod-123",
    "uom_id": "uom-2",
    "price": 950.00,
    "created_at": "2026-03-07T10:00:00Z",
    "updated_at": "2026-03-07T10:00:00Z"
  },
  {
    "id": "vp-3",
    "vendor_id": "vendor-2",
    "product_id": "prod-123",
    "uom_id": "uom-1",
    "price": 95.00,
    "created_at": "2026-03-07T10:00:00Z",
    "updated_at": "2026-03-07T10:00:00Z"
  }
]
```

### Ventajas
- ✅ Retorna solo los precios
- ✅ Más eficiente si solo necesitas precios
- ✅ Ideal para listados de precios

### Desventajas
- ❌ Requiere una llamada adicional si necesitas el producto también

## Otros Endpoints Disponibles

### Obtener precio específico de un vendor para un producto y UoM
```
GET /api/tenant/vendor-product-prices/vendor/:vendorId/product/:productId/uom/:uomId
```

**Response:**
```json
{
  "id": "vp-1",
  "vendor_id": "vendor-1",
  "product_id": "prod-123",
  "uom_id": "uom-1",
  "price": 100.00,
  "created_at": "2026-03-07T10:00:00Z",
  "updated_at": "2026-03-07T10:00:00Z"
}
```

### Obtener todos los precios de un vendor
```
GET /api/tenant/vendor-product-prices/vendors/:vendorId
```

**Response:**
```json
[
  {
    "id": "vp-1",
    "vendor_id": "vendor-1",
    "product_id": "prod-123",
    "uom_id": "uom-1",
    "price": 100.00,
    "created_at": "2026-03-07T10:00:00Z",
    "updated_at": "2026-03-07T10:00:00Z"
  },
  {
    "id": "vp-4",
    "vendor_id": "vendor-1",
    "product_id": "prod-456",
    "uom_id": "uom-3",
    "price": 50.00,
    "created_at": "2026-03-07T10:00:00Z",
    "updated_at": "2026-03-07T10:00:00Z"
  }
]
```

## Crear Vendor Price

### Endpoint
```
POST /api/tenant/vendor-product-prices
```

### Request Body
```json
{
  "vendor_id": "vendor-1",
  "product_id": "prod-123",
  "uom_id": "uom-1",
  "price": 100.00
}
```

### Response
```json
{
  "id": "vp-1",
  "vendor_id": "vendor-1",
  "product_id": "prod-123",
  "uom_id": "uom-1",
  "price": 100.00,
  "created_at": "2026-03-07T10:00:00Z",
  "updated_at": "2026-03-07T10:00:00Z"
}
```

## Actualizar Vendor Price

### Endpoint
```
PATCH /api/tenant/vendor-product-prices/:id
```

### Request Body
```json
{
  "price": 105.00
}
```

### Response
```json
{
  "id": "vp-1",
  "vendor_id": "vendor-1",
  "product_id": "prod-123",
  "uom_id": "uom-1",
  "price": 105.00,
  "created_at": "2026-03-07T10:00:00Z",
  "updated_at": "2026-03-07T10:00:00Z"
}
```

## Eliminar Vendor Price

### Endpoint
```
DELETE /api/tenant/vendor-product-prices/:id
```

### Response
```
204 No Content
```

## Flujo Completo: Editar Producto con Precios

### Paso 1: Obtener producto con todos sus datos
```bash
GET /api/tenant/products/prod-123
```

Retorna: producto + UoMs + relaciones + precios

### Paso 2: Mostrar en la UI
```
Producto: Laptop
├─ UoMs Asignadas
│  ├─ Pieza
│  └─ Caja
├─ Relaciones
│  └─ Caja = 10 Piezas
└─ Precios de Vendors
   ├─ Vendor 1
   │  ├─ Pieza: $100.00
   │  └─ Caja: $950.00
   └─ Vendor 2
      └─ Pieza: $95.00
```

### Paso 3: Actualizar precio
```bash
PATCH /api/tenant/vendor-product-prices/vp-1
{
  "price": 105.00
}
```

### Paso 4: Crear nuevo precio
```bash
POST /api/tenant/vendor-product-prices
{
  "vendor_id": "vendor-3",
  "product_id": "prod-123",
  "uom_id": "uom-1",
  "price": 98.00
}
```

## Resumen

| Caso de Uso | Endpoint | Método |
|-------------|----------|--------|
| Obtener producto con todo | `GET /api/tenant/products/:id` | GET |
| Obtener solo precios | `GET /api/tenant/vendor-product-prices/products/:productId` | GET |
| Obtener precio específico | `GET /api/tenant/vendor-product-prices/vendor/:vendorId/product/:productId/uom/:uomId` | GET |
| Obtener precios de vendor | `GET /api/tenant/vendor-product-prices/vendors/:vendorId` | GET |
| Crear precio | `POST /api/tenant/vendor-product-prices` | POST |
| Actualizar precio | `PATCH /api/tenant/vendor-product-prices/:id` | PATCH |
| Eliminar precio | `DELETE /api/tenant/vendor-product-prices/:id` | DELETE |

## Notas Importantes

1. **Los precios se retornan automáticamente** cuando obtienes un producto
2. **No puedes eliminar una UoM** si tiene vendor prices asignados (error: `UOM_IN_USE_BY_PRICE`)
3. **Debes eliminar los vendor prices primero** antes de eliminar una UoM
4. **Cada vendor puede tener múltiples precios** para el mismo producto en diferentes UoMs
5. **Los precios son específicos por UoM** - un vendor puede tener diferentes precios para Pieza vs Caja

