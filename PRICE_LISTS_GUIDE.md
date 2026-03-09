# Sistema de Listas de Precios - Guía Completa

## Introducción

El sistema de Listas de Precios permite gestionar múltiples precios para los mismos productos, ideal para:
- Precios de mayoreo vs menudeo
- Precios especiales para clientes VIP
- Precios por canal de venta (POS, ecommerce, distribuidores)
- Promociones temporales
- Precios por región o sucursal

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      PRICE LISTS                             │
│  (Listas de precios: Menudeo, Mayoreo, VIP, etc.)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCT PRICES                            │
│  (Precios específicos de productos en cada lista)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ N:1
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       PRODUCTS                               │
│  (Productos del catálogo)                                    │
└─────────────────────────────────────────────────────────────┘
```

## Tablas de Base de Datos

### price_lists
```sql
CREATE TABLE price_lists (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from DATE,
  valid_to DATE,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (tenant_id, name)
);
```

### product_prices
```sql
CREATE TABLE product_prices (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  price_list_id VARCHAR(36) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (product_id, price_list_id)
);
```

## Endpoints

### Listas de Precios

#### 1. Crear Lista de Precios

**Endpoint:** `POST /tenant/price-lists`

**Request Body:**
```json
{
  "name": "Mayoreo",
  "description": "Precios para ventas al mayoreo (mínimo 10 unidades)",
  "is_default": false,
  "is_active": true,
  "valid_from": "2026-01-01",
  "valid_to": "2026-12-31",
  "metadata": {
    "min_quantity": 10,
    "discount_type": "wholesale"
  }
}
```

**Response (201):**
```json
{
  "id": "price-list-uuid",
  "tenant_id": "tenant-uuid",
  "name": "Mayoreo",
  "description": "Precios para ventas al mayoreo (mínimo 10 unidades)",
  "is_default": false,
  "is_active": true,
  "valid_from": "2026-01-01",
  "valid_to": "2026-12-31",
  "metadata": {
    "min_quantity": 10,
    "discount_type": "wholesale"
  },
  "created_at": "2026-03-09T00:00:00.000Z",
  "updated_at": "2026-03-09T00:00:00.000Z"
}
```

#### 2. Listar Listas de Precios

**Endpoint:** `GET /tenant/price-lists`

**Query Parameters:**
- `page` (number): Número de página (default: 1)
- `limit` (number): Registros por página (default: 20, max: 100)
- `search` (string): Búsqueda por nombre
- `is_active` (boolean): Filtrar por activas/inactivas
- `is_default` (boolean): Filtrar por lista por defecto

**Response (200):**
```json
{
  "data": [
    {
      "id": "price-list-1",
      "name": "Menudeo",
      "description": "Precios al público general",
      "is_default": true,
      "is_active": true,
      "valid_from": null,
      "valid_to": null
    },
    {
      "id": "price-list-2",
      "name": "Mayoreo",
      "description": "Precios para ventas al mayoreo",
      "is_default": false,
      "is_active": true,
      "valid_from": "2026-01-01",
      "valid_to": "2026-12-31"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

#### 3. Obtener Lista de Precios por Defecto

**Endpoint:** `GET /tenant/price-lists/default`

**Response (200):**
```json
{
  "id": "price-list-1",
  "name": "Menudeo",
  "description": "Precios al público general",
  "is_default": true,
  "is_active": true
}
```

#### 4. Obtener Lista de Precios por ID

**Endpoint:** `GET /tenant/price-lists/:id`

**Response (200):**
```json
{
  "id": "price-list-uuid",
  "name": "Mayoreo",
  "description": "Precios para ventas al mayoreo",
  "is_default": false,
  "is_active": true,
  "product_prices": [
    {
      "id": "product-price-1",
      "product_id": "product-uuid-1",
      "price": 120.00,
      "discount_percentage": 0,
      "product": {
        "id": "product-uuid-1",
        "name": "Hamburguesa",
        "sku": "BURG-001"
      }
    }
  ]
}
```

#### 5. Actualizar Lista de Precios

**Endpoint:** `PUT /tenant/price-lists/:id`

**Request Body:** (todos los campos opcionales)
```json
{
  "name": "Mayoreo Premium",
  "is_active": true,
  "is_default": false
}
```

#### 6. Eliminar Lista de Precios

**Endpoint:** `DELETE /tenant/price-lists/:id`

**Nota:** No se puede eliminar la lista por defecto.

---

### Precios de Productos

#### 1. Agregar Precio de Producto

**Endpoint:** `POST /tenant/price-lists/product-prices`

**Request Body:**
```json
{
  "product_id": "258008be-6173-4140-a0df-6f752d691f2c",
  "price_list_id": "price-list-uuid",
  "price": 120.00,
  "discount_percentage": 10,
  "valid_from": "2026-03-01",
  "valid_to": "2026-12-31",
  "is_active": true,
  "metadata": {
    "promotion": "Spring Sale"
  }
}
```

**Response (201):**
```json
{
  "id": "product-price-uuid",
  "tenant_id": "tenant-uuid",
  "product_id": "258008be-6173-4140-a0df-6f752d691f2c",
  "price_list_id": "price-list-uuid",
  "price": 120.00,
  "discount_percentage": 10,
  "valid_from": "2026-03-01",
  "valid_to": "2026-12-31",
  "is_active": true,
  "created_at": "2026-03-09T00:00:00.000Z"
}
```

**Cálculo del Precio Final:**
```
Precio base: $120.00
Descuento: 10%
Precio final: $120.00 × (1 - 0.10) = $108.00
```

#### 2. Actualizar Precio de Producto

**Endpoint:** `PUT /tenant/price-lists/product-prices/:id`

**Request Body:**
```json
{
  "price": 130.00,
  "discount_percentage": 15
}
```

#### 3. Eliminar Precio de Producto

**Endpoint:** `DELETE /tenant/price-lists/product-prices/:id`

#### 4. Obtener Todos los Precios de un Producto

**Endpoint:** `GET /tenant/price-lists/products/:productId/prices`

**Response (200):**
```json
[
  {
    "id": "product-price-1",
    "price": 150.00,
    "discount_percentage": 0,
    "price_list": {
      "id": "price-list-1",
      "name": "Menudeo",
      "is_default": true
    }
  },
  {
    "id": "product-price-2",
    "price": 120.00,
    "discount_percentage": 10,
    "price_list": {
      "id": "price-list-2",
      "name": "Mayoreo",
      "is_default": false
    }
  }
]
```

#### 5. Obtener Precio Específico de un Producto

**Endpoint:** `GET /tenant/price-lists/:priceListId/products/:productId/price`

**Response (200):**
```json
108.00
```

Este endpoint devuelve el precio final calculado (con descuento aplicado).

---

## Integración con POS y Sales Orders

### Modificar POS para Usar Listas de Precios

El servicio POS debe modificarse para obtener el precio de la lista correspondiente:

```typescript
// src/api/pos/pos.service.ts
async addLineToOrder(orderId: string, dto: CreatePOSOrderLineDto, priceListId?: string) {
  const order = await this.findOne(orderId);
  
  // Determinar qué lista de precios usar
  const effectivePriceListId = priceListId || await this.getDefaultPriceListId();
  
  // Obtener precio de la lista
  const unit_price = await this.priceListService.getProductPrice(
    dto.product_id,
    effectivePriceListId,
    tenantId
  );
  
  // Continuar con la creación de la línea...
  const subtotal = dto.quantity * unit_price;
  // ...
}
```

### Agregar price_list_id a las Órdenes

Puedes agregar un campo `price_list_id` a las tablas `pos_orders` y `sales_orders` para registrar qué lista de precios se usó:

```sql
ALTER TABLE pos_orders ADD COLUMN price_list_id VARCHAR(36);
ALTER TABLE sales_orders ADD COLUMN price_list_id VARCHAR(36);
```

---

## Casos de Uso

### Caso 1: Precios de Menudeo y Mayoreo

```json
// Lista: Menudeo (por defecto)
{
  "name": "Menudeo",
  "is_default": true
}

// Lista: Mayoreo
{
  "name": "Mayoreo",
  "is_default": false,
  "metadata": {
    "min_quantity": 10
  }
}

// Precios del producto "Hamburguesa"
Menudeo: $150.00
Mayoreo: $120.00 (20% menos)
```

### Caso 2: Precios por Canal de Venta

```json
// Lista: POS (Tienda física)
{
  "name": "POS",
  "is_default": true
}

// Lista: Ecommerce (Tienda en línea)
{
  "name": "Ecommerce",
  "is_default": false
}

// Lista: Distribuidores
{
  "name": "Distribuidores",
  "is_default": false
}
```

### Caso 3: Promociones Temporales

```json
{
  "name": "Black Friday 2026",
  "valid_from": "2026-11-25",
  "valid_to": "2026-11-30",
  "is_active": true
}

// Precios con descuento del 30%
{
  "product_id": "product-uuid",
  "price_list_id": "black-friday-list",
  "price": 150.00,
  "discount_percentage": 30
  // Precio final: $105.00
}
```

---

## Permisos RBAC

| Permiso | Descripción |
|---------|-------------|
| `price_lists:Create` | Crear listas de precios y precios de productos |
| `price_lists:Read` | Ver listas de precios y precios |
| `price_lists:Update` | Actualizar listas y precios |
| `price_lists:Delete` | Eliminar listas y precios |

---

## Mejores Prácticas

### 1. Siempre Tener una Lista por Defecto

```typescript
// Al crear la primera lista, marcarla como default
if (isFirstPriceList) {
  dto.is_default = true;
}
```

### 2. Validar Fechas de Vigencia

```typescript
// El backend valida automáticamente
if (productPrice.valid_from && new Date(productPrice.valid_from) > now) {
  throw new BadRequestException('Price is not yet valid');
}
```

### 3. Usar Metadata para Reglas de Negocio

```json
{
  "metadata": {
    "min_quantity": 10,
    "customer_type": "wholesale",
    "requires_approval": true
  }
}
```

### 4. Mantener Historial de Precios

No elimines precios antiguos, márcalos como inactivos:

```json
{
  "is_active": false,
  "valid_to": "2026-03-08"
}
```

---

## Migración desde Precio Simple

Si actualmente tienes un campo `price` en la tabla `products`, puedes migrar así:

```sql
-- 1. Crear lista por defecto
INSERT INTO price_lists (id, tenant_id, name, is_default, is_active)
VALUES (UUID(), 'tenant-uuid', 'Precio Estándar', TRUE, TRUE);

-- 2. Migrar precios existentes
INSERT INTO product_prices (id, tenant_id, product_id, price_list_id, price, is_active)
SELECT 
  UUID(),
  tenant_id,
  id,
  (SELECT id FROM price_lists WHERE tenant_id = products.tenant_id AND is_default = TRUE),
  price,
  TRUE
FROM products
WHERE price IS NOT NULL;

-- 3. (Opcional) Eliminar columna price de products
-- ALTER TABLE products DROP COLUMN price;
```

---

## Resumen

✅ Sistema completo de listas de precios implementado
✅ Soporte para múltiples precios por producto
✅ Descuentos por lista de precios
✅ Fechas de vigencia para promociones
✅ Lista por defecto automática
✅ Integración lista con POS y Sales Orders
✅ Multi-tenancy completo
✅ RBAC para control de acceso

El sistema está listo para usar. Solo necesitas:
1. Ejecutar las migraciones
2. Crear tus listas de precios
3. Asignar precios a los productos
4. Actualizar POS/Sales Orders para usar las listas
