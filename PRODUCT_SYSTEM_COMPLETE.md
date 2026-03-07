# Product System - Especificación Completa

## 📋 Tabla de Contenidos
1. [Overview](#overview)
2. [Arquitectura](#arquitectura)
3. [Entidades](#entidades)
4. [Endpoints REST](#endpoints-rest)
5. [Flujos de Uso](#flujos-de-uso)
6. [Validaciones](#validaciones)
7. [Estructura S3](#estructura-s3)
8. [Errores](#errores)

---

## Overview

Sistema completo de gestión de productos con:
- **Productos**: Catálogo con SKU único por tenant
- **Unidades de Medida (UoM)**: Jerarquía de conversiones (ej: 1 caja = 10 displays)
- **Precios de Vendor**: Precios específicos por vendor, producto y UoM
- **Fotos de Producto**: Gestión de imágenes de catálogo en S3

### Características Principales
- ✅ Multi-tenant (aislamiento por tenant)
- ✅ Conversión automática entre UoMs
- ✅ Foto principal y orden de visualización
- ✅ URLs firmadas de S3
- ✅ Cascade delete automático
- ✅ Validaciones completas

---

## Arquitectura

```
┌─────────────────────────────────────────┐
│         API/Application Layer           │
│  ProductController, UoMController, etc. │
├─────────────────────────────────────────┤
│         Service Layer                   │
│  ProductService, UoMService, etc.       │
├─────────────────────────────────────────┤
│         Repository Layer                │
│  ProductRepository, UoMRepository, etc. │
├─────────────────────────────────────────┤
│         Data Layer (Database)           │
│  products, uoms, uom_relationships,     │
│  vendor_product_prices, product_photos  │
└─────────────────────────────────────────┘
```

### Módulo
- **Nombre**: `ProductsModule`
- **Ubicación**: `src/api/products/`
- **Exporta**: ProductService, UoMService, VendorProductPriceService, ProductPhotoService

---

## Entidades

### 1. Product
**Tabla**: `products`

```typescript
{
  id: UUID,                    // Identificador único
  tenant_id: UUID,             // Tenant propietario
  sku: string,                 // Stock Keeping Unit (único por tenant)
  name: string,                // Nombre del producto
  description: string | null,  // Descripción
  created_at: timestamp,
  updated_at: timestamp,
  
  // Relaciones
  uoms: UoM[],                 // Unidades de medida
  uom_relationships: UoMRelationship[],
  vendor_prices: VendorProductPrice[],
  photos: ProductPhoto[]
}
```

**Índices**:
- `(tenant_id, sku)` - UNIQUE
- `tenant_id`
- `sku`

**Validaciones**:
- SKU no vacío
- SKU único por tenant
- Nombre no vacío

---

### 2. Unit of Measure (UoM)
**Tabla**: `uoms`

```typescript
{
  id: UUID,
  product_id: UUID,            // FK a Product
  code: string,                // Código (ej: "piece", "box", "display")
  name: string,                // Nombre descriptivo
  created_at: timestamp,
  updated_at: timestamp,
  
  // Relaciones
  source_relationships: UoMRelationship[],
  target_relationships: UoMRelationship[],
  vendor_prices: VendorProductPrice[]
}
```

**Índices**:
- `(product_id, code)` - UNIQUE
- `product_id`

**Validaciones**:
- Code no vacío
- Code único dentro del producto
- Name no vacío

---

### 3. UoM Relationship
**Tabla**: `uom_relationships`

```typescript
{
  id: UUID,
  product_id: UUID,            // FK a Product
  source_uom_id: UUID,         // UoM origen (unidad mayor)
  target_uom_id: UUID,         // UoM destino (unidad menor)
  conversion_factor: decimal,  // Cuántos target_uom = 1 source_uom
  created_at: timestamp,
  updated_at: timestamp
}
```

**Ejemplo**:
```
source_uom: "box"
target_uom: "display"
conversion_factor: 10
// Significa: 1 box = 10 displays
```

**Índices**:
- `(product_id, source_uom_id, target_uom_id)` - UNIQUE
- `product_id`

**Validaciones**:
- conversion_factor > 0
- source_uom_id ≠ target_uom_id
- Ambos UoMs pertenecen al mismo producto

---

### 4. Vendor Product Price
**Tabla**: `vendor_product_prices`

```typescript
{
  id: UUID,
  vendor_id: UUID,             // FK a Vendor
  product_id: UUID,            // FK a Product
  uom_id: UUID,                // FK a UoM (debe pertenecer al producto)
  price: decimal,              // Precio >= 0
  created_at: timestamp,
  updated_at: timestamp
}
```

**Índices**:
- `(vendor_id, product_id, uom_id)` - UNIQUE
- `vendor_id`
- `product_id`
- `uom_id`

**Validaciones**:
- price >= 0
- UoM pertenece al producto
- Combinación (vendor, product, uom) única

---

### 5. Product Photo
**Tabla**: `product_photos`

```typescript
{
  id: UUID,
  tenant_id: UUID,             // FK a Tenant
  product_id: UUID,            // FK a Product
  file_name: string,           // Nombre original
  s3_key: string,              // Ruta en S3
  mime_type: string,           // image/png, image/jpeg, etc.
  file_size: bigint,           // Bytes
  display_order: int,          // Orden en catálogo (0, 1, 2...)
  is_primary: boolean,         // Foto principal del producto
  alt_text: string | null,     // Texto alternativo (accesibilidad)
  uploaded_by: UUID | null,    // Usuario que subió
  created_at: timestamp,
  updated_at: timestamp
}
```

**Índices**:
- `tenant_id`
- `product_id`
- `(product_id, is_primary)`

**Validaciones**:
- Tipos MIME: image/png, image/jpeg, image/jpg, image/webp
- Tamaño máximo: 5MB
- Solo una foto puede ser is_primary por producto

---

## Endpoints REST

### PRODUCTOS

#### Crear Producto
```http
POST /products
Content-Type: application/json
Authorization: Bearer {token}

{
  "sku": "PROD-001",
  "name": "Producto A",
  "description": "Descripción del producto"
}

Response: 201 Created
{
  "id": "uuid",
  "tenant_id": "uuid",
  "sku": "PROD-001",
  "name": "Producto A",
  "description": "Descripción del producto",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Obtener Producto por ID
```http
GET /products/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "sku": "PROD-001",
  "name": "Producto A",
  ...
}
```

#### Obtener Producto por SKU
```http
GET /products/sku/:sku
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "sku": "PROD-001",
  ...
}
```

#### Listar Productos
```http
GET /products
Authorization: Bearer {token}

Response: 200 OK
[
  { "id": "uuid1", "sku": "PROD-001", ... },
  { "id": "uuid2", "sku": "PROD-002", ... }
]
```

#### Actualizar Producto
```http
PATCH /products/:id
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Nuevo nombre",
  "description": "Nueva descripción"
}

Response: 200 OK
{
  "id": "uuid",
  "sku": "PROD-001",
  "name": "Nuevo nombre",
  ...
}
```

#### Eliminar Producto
```http
DELETE /products/:id
Authorization: Bearer {token}

Response: 204 No Content
```

---

### UNIDADES DE MEDIDA (UoM)

#### Crear UoM
```http
POST /products/:productId/uoms
Content-Type: application/json
Authorization: Bearer {token}

{
  "code": "piece",
  "name": "Pieza"
}

Response: 201 Created
{
  "id": "uuid",
  "product_id": "uuid",
  "code": "piece",
  "name": "Pieza",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Listar UoMs del Producto
```http
GET /products/:productId/uoms
Authorization: Bearer {token}

Response: 200 OK
[
  { "id": "uuid1", "code": "piece", "name": "Pieza" },
  { "id": "uuid2", "code": "box", "name": "Caja" }
]
```

#### Obtener UoM
```http
GET /products/:productId/uoms/:uomId
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "code": "piece",
  "name": "Pieza",
  ...
}
```

#### Actualizar UoM
```http
PATCH /products/:productId/uoms/:uomId
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Nuevo nombre"
}

Response: 200 OK
{
  "id": "uuid",
  "code": "piece",
  "name": "Nuevo nombre",
  ...
}
```

#### Eliminar UoM
```http
DELETE /products/:productId/uoms/:uomId
Authorization: Bearer {token}

Response: 204 No Content
```

---

### RELACIONES DE UoM

#### Crear Relación
```http
POST /products/:productId/uoms/relationships
Content-Type: application/json
Authorization: Bearer {token}

{
  "source_uom_id": "uuid-box",
  "target_uom_id": "uuid-piece",
  "conversion_factor": 10
}

Response: 201 Created
{
  "id": "uuid",
  "product_id": "uuid",
  "source_uom_id": "uuid-box",
  "target_uom_id": "uuid-piece",
  "conversion_factor": 10,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Listar Relaciones
```http
GET /products/:productId/uoms/relationships
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "uuid1",
    "source_uom_id": "uuid-box",
    "target_uom_id": "uuid-piece",
    "conversion_factor": 10
  }
]
```

#### Eliminar Relación
```http
DELETE /products/:productId/uoms/relationships/:relationshipId
Authorization: Bearer {token}

Response: 204 No Content
```

#### Convertir Cantidad
```http
POST /products/:productId/uoms/convert
Content-Type: application/json
Authorization: Bearer {token}

{
  "quantity": 5,
  "from_uom_id": "uuid-box",
  "to_uom_id": "uuid-piece"
}

Response: 200 OK
{
  "converted_quantity": 50
}
```

---

### PRECIOS DE VENDOR

#### Crear Precio
```http
POST /vendor-product-prices
Content-Type: application/json
Authorization: Bearer {token}

{
  "vendor_id": "uuid",
  "product_id": "uuid",
  "uom_id": "uuid",
  "price": 99.99
}

Response: 201 Created
{
  "id": "uuid",
  "vendor_id": "uuid",
  "product_id": "uuid",
  "uom_id": "uuid",
  "price": 99.99,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Obtener Precio
```http
GET /vendor-product-prices/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "vendor_id": "uuid",
  "product_id": "uuid",
  "uom_id": "uuid",
  "price": 99.99,
  ...
}
```

#### Listar Precios por Producto
```http
GET /products/:productId/vendor-prices
Authorization: Bearer {token}

Response: 200 OK
[
  { "id": "uuid1", "vendor_id": "uuid", "price": 99.99 },
  { "id": "uuid2", "vendor_id": "uuid", "price": 89.99 }
]
```

#### Listar Precios por Vendor
```http
GET /vendors/:vendorId/product-prices
Authorization: Bearer {token}

Response: 200 OK
[
  { "id": "uuid1", "product_id": "uuid", "price": 99.99 },
  { "id": "uuid2", "product_id": "uuid", "price": 89.99 }
]
```

#### Obtener Precio Específico
```http
GET /vendor-product-prices/vendor/:vendorId/product/:productId/uom/:uomId
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "vendor_id": "uuid",
  "product_id": "uuid",
  "uom_id": "uuid",
  "price": 99.99,
  ...
}
```

#### Actualizar Precio
```http
PATCH /vendor-product-prices/:id
Content-Type: application/json
Authorization: Bearer {token}

{
  "price": 89.99
}

Response: 200 OK
{
  "id": "uuid",
  "price": 89.99,
  ...
}
```

#### Eliminar Precio
```http
DELETE /vendor-product-prices/:id
Authorization: Bearer {token}

Response: 204 No Content
```

---

### FOTOS DE PRODUCTO

#### Subir Foto
```http
POST /products/:productId/photos
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- file: (binary image file)
- alt_text: "Descripción de la foto" (optional)

Response: 201 Created
{
  "id": "uuid",
  "tenant_id": "uuid",
  "product_id": "uuid",
  "file_name": "photo.png",
  "s3_key": "tenant-uuid/products/product-uuid/photos/uuid-photo.png",
  "mime_type": "image/png",
  "file_size": 102400,
  "display_order": 0,
  "is_primary": false,
  "alt_text": "Descripción de la foto",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Listar Fotos del Producto
```http
GET /products/:productId/photos
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "uuid1",
    "file_name": "photo1.png",
    "display_order": 0,
    "is_primary": true,
    ...
  },
  {
    "id": "uuid2",
    "file_name": "photo2.jpg",
    "display_order": 1,
    "is_primary": false,
    ...
  }
]
```

#### Obtener Foto Principal
```http
GET /products/:productId/photos/primary
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "file_name": "photo.png",
  "is_primary": true,
  ...
}
```

#### Obtener Detalles de Foto
```http
GET /products/:productId/photos/:photoId
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "file_name": "photo.png",
  "s3_key": "...",
  ...
}
```

#### Obtener URL Firmada
```http
GET /products/:photoId/photos/:photoId/signed-url
Authorization: Bearer {token}

Response: 200 OK
{
  "signed_url": "https://s3.amazonaws.com/...?X-Amz-Signature=..."
}
```

#### Actualizar Foto
```http
PATCH /products/:productId/photos/:photoId
Content-Type: application/json
Authorization: Bearer {token}

{
  "alt_text": "Nueva descripción",
  "display_order": 1,
  "is_primary": true
}

Response: 200 OK
{
  "id": "uuid",
  "alt_text": "Nueva descripción",
  "display_order": 1,
  "is_primary": true,
  ...
}
```

#### Reordenar Fotos
```http
POST /products/:productId/photos/reorder
Content-Type: application/json
Authorization: Bearer {token}

{
  "photo_ids": ["uuid1", "uuid2", "uuid3"]
}

Response: 200 OK
[
  { "id": "uuid1", "display_order": 0 },
  { "id": "uuid2", "display_order": 1 },
  { "id": "uuid3", "display_order": 2 }
]
```

#### Eliminar Foto
```http
DELETE /products/:productId/photos/:photoId
Authorization: Bearer {token}

Response: 204 No Content
```

---

## Flujos de Uso

### Flujo 1: Crear Producto Completo

```typescript
// 1. Crear producto
const product = await POST('/products', {
  sku: 'PROD-001',
  name: 'Producto A',
  description: 'Descripción'
});

// 2. Crear UoMs
const pieceUoM = await POST(`/products/${product.id}/uoms`, {
  code: 'piece',
  name: 'Pieza'
});

const boxUoM = await POST(`/products/${product.id}/uoms`, {
  code: 'box',
  name: 'Caja'
});

// 3. Crear relación (1 box = 10 pieces)
await POST(`/products/${product.id}/uoms/relationships`, {
  source_uom_id: boxUoM.id,
  target_uom_id: pieceUoM.id,
  conversion_factor: 10
});

// 4. Crear precios de vendor
await POST('/vendor-product-prices', {
  vendor_id: 'vendor-uuid',
  product_id: product.id,
  uom_id: pieceUoM.id,
  price: 5.99
});

await POST('/vendor-product-prices', {
  vendor_id: 'vendor-uuid',
  product_id: product.id,
  uom_id: boxUoM.id,
  price: 49.99
});

// 5. Subir fotos
const formData = new FormData();
formData.append('file', imageFile);
formData.append('alt_text', 'Foto principal del producto');

const photo = await POST(`/products/${product.id}/photos`, formData);

// 6. Establecer como foto principal
await PATCH(`/products/${product.id}/photos/${photo.id}`, {
  is_primary: true
});
```

### Flujo 2: Convertir Cantidad

```typescript
// Convertir 5 cajas a piezas
const result = await POST(`/products/${productId}/uoms/convert`, {
  quantity: 5,
  from_uom_id: boxUoMId,
  to_uom_id: pieceUoMId
});

console.log(result.converted_quantity); // 50
```

### Flujo 3: Obtener Catálogo de Producto

```typescript
// Obtener producto
const product = await GET(`/products/${productId}`);

// Obtener fotos ordenadas
const photos = await GET(`/products/${productId}/photos`);

// Obtener URL firmada para foto principal
const primaryPhoto = photos.find(p => p.is_primary);
const { signed_url } = await GET(
  `/products/${primaryPhoto.id}/photos/${primaryPhoto.id}/signed-url`
);

// Mostrar en UI
<img src={signed_url} alt={primaryPhoto.alt_text} />
```

### Flujo 4: Gestionar Precios

```typescript
// Obtener todos los precios de un producto
const prices = await GET(`/products/${productId}/vendor-prices`);

// Obtener precio específico de vendor
const price = await GET(
  `/vendor-product-prices/vendor/${vendorId}/product/${productId}/uom/${uomId}`
);

// Actualizar precio
await PATCH(`/vendor-product-prices/${priceId}`, {
  price: 89.99
});
```

---

## Validaciones

### Product
- ✅ SKU no vacío
- ✅ SKU único por tenant
- ✅ Nombre no vacío

### UoM
- ✅ Code no vacío
- ✅ Code único dentro del producto
- ✅ Name no vacío

### UoM Relationship
- ✅ conversion_factor > 0
- ✅ source_uom_id ≠ target_uom_id
- ✅ Ambos UoMs pertenecen al mismo producto

### Vendor Product Price
- ✅ price >= 0
- ✅ UoM pertenece al producto
- ✅ Combinación (vendor, product, uom) única

### Product Photo
- ✅ Tipos MIME: image/png, image/jpeg, image/jpg, image/webp
- ✅ Tamaño máximo: 5MB
- ✅ Solo una foto is_primary por producto

---

## Estructura S3

```
s3://sin-customer-documents/
├── {tenant_id}/
│   └── products/
│       └── {product_id}/
│           └── photos/
│               ├── {uuid}-photo1.png
│               ├── {uuid}-photo2.jpg
│               └── {uuid}-photo3.webp
```

**Patrón de S3 Key**:
```
{tenant_id}/products/{product_id}/photos/{uuid}-{original_filename}
```

**Ejemplo**:
```
abc123/products/prod-456/photos/a1b2c3d4-e5f6-7890-abcd-ef1234567890-product-photo.png
```

---

## Errores

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "SKU cannot be empty",
  "error": "Bad Request"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "A product with this SKU already exists",
  "error": "Conflict"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Product with ID uuid not found",
  "error": "Not Found"
}
```

### Códigos de Error Específicos

| Código | Mensaje | HTTP |
|--------|---------|------|
| PRODUCT_SKU_DUPLICATE | A product with this SKU already exists | 409 |
| UOM_CODE_DUPLICATE | A UoM with this code already exists for this product | 409 |
| INVALID_CONVERSION_FACTOR | Conversion factor must be greater than zero | 400 |
| INVALID_UOM_REFERENCE | The specified UoM does not belong to this product | 400 |
| INVALID_PRICE | Price must be greater than or equal to zero | 400 |
| UOM_IN_USE_BY_PRICE | Cannot delete UoM: it is referenced by vendor product prices | 409 |
| UOM_IN_USE_BY_RELATIONSHIP | Cannot delete UoM: it is referenced by UoM relationships | 409 |
| PRODUCT_NOT_FOUND | Product with ID {id} not found | 404 |
| UOM_NOT_FOUND | UoM with ID {id} not found | 404 |
| VENDOR_PRICE_NOT_FOUND | Vendor Product Price with ID {id} not found | 404 |

---

## Archivos Implementados

```
src/
├── entities/products/
│   ├── product.entity.ts
│   ├── uom.entity.ts
│   ├── uom-relationship.entity.ts
│   ├── vendor-product-price.entity.ts
│   └── product-photo.entity.ts
├── api/products/
│   ├── repositories/
│   │   ├── product.repository.ts
│   │   ├── uom.repository.ts
│   │   ├── uom-relationship.repository.ts
│   │   ├── vendor-product-price.repository.ts
│   │   └── product-photo.repository.ts
│   ├── services/
│   │   ├── product.service.ts
│   │   ├── uom.service.ts
│   │   ├── vendor-product-price.service.ts
│   │   └── product-photo.service.ts
│   ├── controllers/
│   │   ├── product.controller.ts
│   │   ├── uom.controller.ts
│   │   ├── vendor-product-price.controller.ts
│   │   └── product-photo.controller.ts
│   ├── dto/
│   │   ├── create-product.dto.ts
│   │   ├── update-product.dto.ts
│   │   ├── create-uom.dto.ts
│   │   ├── update-uom.dto.ts
│   │   ├── create-uom-relationship.dto.ts
│   │   ├── convert-quantity.dto.ts
│   │   ├── create-vendor-product-price.dto.ts
│   │   ├── update-vendor-product-price.dto.ts
│   │   ├── upload-product-photo.dto.ts
│   │   ├── update-product-photo.dto.ts
│   │   └── reorder-product-photos.dto.ts
│   └── products.module.ts
└── database/
    └── migrations/
        ├── 1772812686000-create-product-system-tables.ts
        └── 1772812687000-create-product-photos-table.ts
```

---

## Notas Importantes

1. **Multi-Tenant**: Todos los datos están aislados por tenant_id
2. **Cascade Delete**: Eliminar un producto elimina todas sus UoMs, relaciones, precios y fotos
3. **S3 Bucket**: Usa `sin-customer-documents` (mismo que documentos de clientes)
4. **URLs Firmadas**: Válidas por 1 hora (configurable)
5. **Foto Principal**: Solo una por producto, se actualiza automáticamente
6. **Conversión de UoMs**: Usa BFS para encontrar rutas de conversión en la jerarquía
7. **Validación de Tipos**: Las fotos solo aceptan PNG, JPEG, WebP
8. **Tamaño Máximo**: 5MB por foto

---

## Próximos Pasos

1. Ejecutar migraciones: `npm run typeorm migration:run`
2. Crear permisos RBAC en setup-all-modules.ts
3. Crear UI para gestión de productos
4. Implementar búsqueda y filtros
5. Agregar reportes de inventario

