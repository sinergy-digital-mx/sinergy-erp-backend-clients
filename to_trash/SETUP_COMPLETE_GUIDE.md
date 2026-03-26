# Guía Completa de Setup - Módulo de Productos con Categorías

## 🎯 Objetivo

Configurar completamente el módulo de productos con categorías, subcategorías, UoMs, precios de vendor y fotos.

## 📋 Requisitos Previos

- Base de datos inicializada
- Al menos un tenant creado
- Al menos un vendor creado
- Node.js y npm instalados

## 🚀 Pasos de Setup

### Paso 1: Ejecutar Migraciones

Ejecuta todas las migraciones para crear las tablas:

```bash
npm run typeorm migration:run
```

**Tablas creadas:**
- `products` - Productos
- `uoms` - Unidades de medida
- `uom_relationships` - Relaciones entre UoMs
- `vendor_product_prices` - Precios de vendor
- `product_photos` - Fotos de productos
- `categories` - Categorías (ya existía)
- `subcategories` - Subcategorías (ya existía)

**Nueva migración agregada:**
- `1772812688000-add-category-to-products.ts` - Agrega category_id y subcategory_id a products

### Paso 2: Configurar Permisos RBAC para Categories

Ejecuta el script para crear permisos de categories (si no existen):

```bash
npx ts-node src/database/scripts/add-categories-module.ts
```

**Qué hace:**
- ✅ Crea/obtiene entidades Category y Subcategory en registry
- ✅ Crea módulo "Categories Management"
- ✅ Crea 8 permisos (4 acciones × 2 entidades):
  - Category: Create, Read, Update, Delete
  - Subcategory: Create, Read, Update, Delete
- ✅ Habilita módulo para todos los tenants
- ✅ Asigna permisos a rol Admin

### Paso 3: Configurar Permisos RBAC para Products

Ejecuta el script para crear permisos de products:

```bash
npx ts-node src/database/scripts/add-products-module.ts
```

**Qué hace:**
- ✅ Crea módulo "Product Management"
- ✅ Registra 5 entidades:
  - Product
  - UoM (Unit of Measure)
  - UoMRelationship
  - VendorProductPrice
  - ProductPhoto
- ✅ Crea 20 permisos (4 acciones × 5 entidades)
- ✅ Habilita módulo para todos los tenants
- ✅ Asigna permisos a rol Admin

### Paso 4: Seed de Datos de Ejemplo (Opcional)

Crea datos de ejemplo para probar:

```bash
npx ts-node src/database/scripts/seed-products.ts
```

**Qué crea:**
- 3 productos de ejemplo
- 3 UoMs (unit, box, pallet)
- 3 relaciones de conversión
- 3 precios de vendor

## 📊 Resumen de Permisos

### Categories Module (8 permisos)

| Entidad | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Category | ✅ | ✅ | ✅ | ✅ |
| Subcategory | ✅ | ✅ | ✅ | ✅ |

### Products Module (20 permisos)

| Entidad | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Product | ✅ | ✅ | ✅ | ✅ |
| UoM | ✅ | ✅ | ✅ | ✅ |
| UoMRelationship | ✅ | ✅ | ✅ | ✅ |
| VendorProductPrice | ✅ | ✅ | ✅ | ✅ |
| ProductPhoto | ✅ | ✅ | ✅ | ✅ |

**Total: 28 permisos** - Todos asignados a rol Admin

## 🔌 Endpoints Disponibles

### Categories (6 endpoints)
```
POST   /categories                    - Crear categoría
GET    /categories                    - Listar categorías
GET    /categories/:id                - Obtener categoría
PATCH  /categories/:id                - Actualizar categoría
DELETE /categories/:id                - Eliminar categoría
GET    /categories/:id/subcategories  - Listar subcategorías
```

### Subcategories (6 endpoints)
```
POST   /categories/:categoryId/subcategories              - Crear
GET    /categories/:categoryId/subcategories              - Listar
GET    /categories/:categoryId/subcategories/:id          - Obtener
PATCH  /categories/:categoryId/subcategories/:id          - Actualizar
DELETE /categories/:categoryId/subcategories/:id          - Eliminar
```

### Products (8 endpoints)
```
POST   /products                      - Crear producto
GET    /products                      - Listar productos
GET    /products/:id                  - Obtener producto
GET    /products/sku/:sku             - Obtener por SKU
GET    /products/category/:categoryId - Listar por categoría
GET    /products/subcategory/:subcategoryId - Listar por subcategoría
PATCH  /products/:id                  - Actualizar producto
DELETE /products/:id                  - Eliminar producto
```

### UoMs (5 endpoints)
```
POST   /products/:productId/uoms                    - Crear UoM
GET    /products/:productId/uoms                    - Listar UoMs
GET    /products/:productId/uoms/:uomId             - Obtener UoM
PATCH  /products/:productId/uoms/:uomId             - Actualizar UoM
DELETE /products/:productId/uoms/:uomId             - Eliminar UoM
```

### UoM Relationships (4 endpoints)
```
POST   /products/:productId/uoms/relationships                    - Crear relación
GET    /products/:productId/uoms/relationships                    - Listar relaciones
DELETE /products/:productId/uoms/relationships/:relationshipId    - Eliminar relación
POST   /products/:productId/uoms/convert                          - Convertir cantidad
```

### Vendor Prices (7 endpoints)
```
POST   /vendor-product-prices                                                    - Crear precio
GET    /vendor-product-prices/:id                                                - Obtener precio
GET    /products/:productId/vendor-prices                                         - Listar por producto
GET    /vendors/:vendorId/product-prices                                          - Listar por vendor
GET    /vendor-product-prices/vendor/:vendorId/product/:productId/uom/:uomId     - Obtener específico
PATCH  /vendor-product-prices/:id                                                - Actualizar precio
DELETE /vendor-product-prices/:id                                                - Eliminar precio
```

### Product Photos (8 endpoints)
```
POST   /products/:productId/photos                    - Subir foto
GET    /products/:productId/photos                    - Listar fotos
GET    /products/:productId/photos/primary            - Obtener foto principal
GET    /products/:productId/photos/:photoId           - Obtener detalles
GET    /products/:photoId/photos/:photoId/signed-url  - Obtener URL firmada
PATCH  /products/:productId/photos/:photoId           - Actualizar foto
POST   /products/:productId/photos/reorder            - Reordenar fotos
DELETE /products/:productId/photos/:photoId           - Eliminar foto
```

**Total: 44 endpoints**

## 🧪 Verificación

### Verificar Migraciones

```bash
# Ver tablas creadas
SHOW TABLES LIKE 'product%';
SHOW TABLES LIKE 'categor%';

# Ver estructura de products
DESCRIBE products;
# Debe mostrar: category_id, subcategory_id
```

### Verificar Permisos

```bash
# Ver módulos
SELECT * FROM modules WHERE code IN ('categories', 'products');

# Ver entidades
SELECT * FROM entity_registry WHERE code IN ('Category', 'Subcategory', 'Product', 'UoM', 'UoMRelationship', 'VendorProductPrice', 'ProductPhoto');

# Contar permisos
SELECT COUNT(*) FROM rbac_permissions WHERE module_id IN (SELECT id FROM modules WHERE code IN ('categories', 'products'));
# Debe retornar: 28

# Ver asignación a Admin
SELECT COUNT(*) FROM rbac_role_permissions rp
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE p.module_id IN (SELECT id FROM modules WHERE code IN ('categories', 'products'));
```

## 📝 Flujo Completo de Uso

### 1. Crear Categoría

```bash
curl -X POST http://localhost:3000/categories \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices"
  }'

# Response:
{
  "id": "cat-uuid-123",
  "name": "Electronics",
  "description": "Electronic devices",
  "status": "active",
  "display_order": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 2. Crear Subcategoría

```bash
curl -X POST http://localhost:3000/categories/cat-uuid-123/subcategories \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computers",
    "description": "Computer devices"
  }'

# Response:
{
  "id": "subcat-uuid-456",
  "category_id": "cat-uuid-123",
  "name": "Computers",
  "description": "Computer devices",
  "status": "active",
  "display_order": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 3. Crear Producto con Categoría

```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "LAPTOP-001",
    "name": "Dell XPS 13",
    "description": "High-performance laptop",
    "category_id": "cat-uuid-123",
    "subcategory_id": "subcat-uuid-456"
  }'

# Response:
{
  "id": "prod-uuid-789",
  "sku": "LAPTOP-001",
  "name": "Dell XPS 13",
  "description": "High-performance laptop",
  "category_id": "cat-uuid-123",
  "subcategory_id": "subcat-uuid-456",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 4. Crear UoM

```bash
curl -X POST http://localhost:3000/products/prod-uuid-789/uoms \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "unit",
    "name": "Unit"
  }'
```

### 5. Crear Precio de Vendor

```bash
curl -X POST http://localhost:3000/vendor-product-prices \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "vendor-uuid",
    "product_id": "prod-uuid-789",
    "uom_id": "uom-uuid",
    "price": 999.99
  }'
```

### 6. Subir Foto

```bash
curl -X POST http://localhost:3000/products/prod-uuid-789/photos \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/image.png" \
  -F "alt_text=Laptop photo"
```

### 7. Listar Productos por Categoría

```bash
curl -X GET http://localhost:3000/products/category/cat-uuid-123 \
  -H "Authorization: Bearer {token}"
```

## ✅ Checklist de Setup

- [ ] Base de datos inicializada
- [ ] Tenant creado
- [ ] Vendor creado
- [ ] Migraciones ejecutadas: `npm run typeorm migration:run`
- [ ] Script de categories ejecutado: `npx ts-node src/database/scripts/add-categories-module.ts`
- [ ] Script de products ejecutado: `npx ts-node src/database/scripts/add-products-module.ts`
- [ ] Script de seed ejecutado (opcional): `npx ts-node src/database/scripts/seed-products.ts`
- [ ] Verificar permisos en BD
- [ ] Probar crear categoría
- [ ] Probar crear subcategoría
- [ ] Probar crear producto con categoría
- [ ] Probar listar productos por categoría
- [ ] Probar crear UoM
- [ ] Probar crear precio de vendor
- [ ] Probar subir foto
- [ ] Probar convertir cantidad

## 📚 Documentación Relacionada

- **PRODUCT_SYSTEM_COMPLETE.md** - Especificación completa del sistema
- **PRODUCTS_WITH_CATEGORIES.md** - Integración de categorías con productos
- **PRODUCTS_MODULE_READY.md** - Estado del módulo de productos
- **SETUP_PRODUCTS_MODULE.md** - Guía de setup del módulo de productos

## 🎉 ¡Listo!

Una vez completados todos los pasos, tienes:
- ✅ 28 permisos RBAC configurados
- ✅ 44 endpoints disponibles
- ✅ Categorías y subcategorías por tenant
- ✅ Productos con categorías
- ✅ UoMs con conversiones
- ✅ Precios de vendor
- ✅ Fotos de productos en S3

¡Disfruta! 🚀
