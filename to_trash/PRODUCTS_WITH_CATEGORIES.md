# Productos con Categorías y Subcategorías

## 📋 Resumen de Integración

Se ha integrado el módulo de **Categories** y **Subcategories** (que ya existía) con el módulo de **Products**. Ahora los productos pueden tener una categoría y una subcategoría asociadas.

## 🏗️ Estructura

### Relaciones

```
Product
├── Category (Many-to-One, nullable, SET NULL on delete)
└── Subcategory (Many-to-One, nullable, SET NULL on delete)

Category
└── Subcategories (One-to-Many)

Subcategory
├── Category (Many-to-One)
└── Products (One-to-Many)
```

### Campos Agregados a Product

```typescript
{
  category_id: UUID | null,      // FK a Category
  subcategory_id: UUID | null,   // FK a Subcategory
  
  // Relaciones
  category: Category | null,
  subcategory: Subcategory | null
}
```

### Índices Creados

- `category_id` - Para búsquedas rápidas
- `subcategory_id` - Para búsquedas rápidas
- `(tenant_id, category_id)` - Para listar productos por categoría por tenant
- `(tenant_id, subcategory_id)` - Para listar productos por subcategoría por tenant

## 📝 DTOs Actualizados

### CreateProductDto

```typescript
{
  sku: string,                    // Requerido
  name: string,                   // Requerido
  description?: string,           // Opcional
  category_id?: UUID,             // Opcional
  subcategory_id?: UUID           // Opcional
}
```

### UpdateProductDto

```typescript
{
  sku?: string,                   // Opcional
  name?: string,                  // Opcional
  description?: string,           // Opcional
  category_id?: UUID,             // Opcional
  subcategory_id?: UUID           // Opcional
}
```

## 🔐 Validaciones

### Al Crear Producto

1. **SKU**: No vacío, único por tenant
2. **Name**: No vacío
3. **Category**: Si se proporciona, debe existir y pertenecer al tenant
4. **Subcategory**: Si se proporciona:
   - Debe existir y pertenecer al tenant
   - Si también se proporciona category, la subcategoría debe pertenecer a esa categoría

### Al Actualizar Producto

Las mismas validaciones que al crear, pero solo para los campos que se actualizan.

## 🔌 Nuevos Endpoints

### Listar Productos por Categoría

```http
GET /products/category/:categoryId
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "uuid",
    "sku": "PROD-001",
    "name": "Producto A",
    "category_id": "uuid",
    "subcategory_id": "uuid",
    ...
  }
]
```

### Listar Productos por Subcategoría

```http
GET /products/subcategory/:subcategoryId
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "uuid",
    "sku": "PROD-001",
    "name": "Producto A",
    "category_id": "uuid",
    "subcategory_id": "uuid",
    ...
  }
]
```

## 📊 Ejemplos de Uso

### Crear Producto con Categoría

```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Laptop",
    "description": "High-performance laptop",
    "category_id": "cat-uuid-123",
    "subcategory_id": "subcat-uuid-456"
  }'
```

### Actualizar Producto - Cambiar Categoría

```bash
curl -X PATCH http://localhost:3000/products/prod-uuid \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "cat-uuid-789",
    "subcategory_id": "subcat-uuid-012"
  }'
```

### Listar Productos de una Categoría

```bash
curl -X GET http://localhost:3000/products/category/cat-uuid-123 \
  -H "Authorization: Bearer {token}"
```

### Listar Productos de una Subcategoría

```bash
curl -X GET http://localhost:3000/products/subcategory/subcat-uuid-456 \
  -H "Authorization: Bearer {token}"
```

## 🗄️ Migración

Se ha creado la migración:
```
src/database/migrations/1772812688000-add-category-to-products.ts
```

**Qué hace:**
- Agrega columna `category_id` a tabla `products`
- Agrega columna `subcategory_id` a tabla `products`
- Crea índices para búsquedas rápidas
- Crea foreign keys con `SET NULL on delete`

**Ejecutar:**
```bash
npm run typeorm migration:run
```

## 📁 Archivos Modificados

### Entidades
- `src/entities/products/product.entity.ts` - Agregadas relaciones con Category y Subcategory

### DTOs
- `src/api/products/dto/create-product.dto.ts` - Agregados category_id y subcategory_id
- `src/api/products/dto/update-product.dto.ts` - Agregados category_id y subcategory_id

### Servicios
- `src/api/products/services/product.service.ts` - Agregadas validaciones y métodos de filtrado

### Controladores
- `src/api/products/controllers/product.controller.ts` - Agregados endpoints de filtrado

### Migraciones
- `src/database/migrations/1772812688000-add-category-to-products.ts` - Nueva migración

## 🔄 Flujo Completo

### 1. Crear Categoría

```bash
POST /categories
{
  "name": "Electronics",
  "description": "Electronic devices"
}
```

### 2. Crear Subcategoría

```bash
POST /categories/{categoryId}/subcategories
{
  "name": "Computers",
  "description": "Computer devices"
}
```

### 3. Crear Producto con Categoría

```bash
POST /products
{
  "sku": "LAPTOP-001",
  "name": "Dell XPS 13",
  "category_id": "{categoryId}",
  "subcategory_id": "{subcategoryId}"
}
```

### 4. Listar Productos por Categoría

```bash
GET /products/category/{categoryId}
```

### 5. Listar Productos por Subcategoría

```bash
GET /products/subcategory/{subcategoryId}
```

## 🧪 Verificación

### Verificar Migración

```sql
-- Ver estructura de products
DESCRIBE products;

-- Debe mostrar:
-- category_id VARCHAR(36) NULL
-- subcategory_id VARCHAR(36) NULL
```

### Verificar Índices

```sql
-- Ver índices
SHOW INDEX FROM products;

-- Debe mostrar:
-- IDX_products_category_id
-- IDX_products_subcategory_id
-- IDX_products_tenant_category
-- IDX_products_tenant_subcategory
```

### Verificar Foreign Keys

```sql
-- Ver foreign keys
SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'products' AND COLUMN_NAME IN ('category_id', 'subcategory_id');

-- Debe mostrar:
-- FK_products_category_id -> categories
-- FK_products_subcategory_id -> subcategories
```

## 📚 Documentación Relacionada

- **PRODUCT_SYSTEM_COMPLETE.md** - Especificación completa del sistema de productos
- **PRODUCTS_MODULE_READY.md** - Estado del módulo de productos
- **SETUP_PRODUCTS_MODULE.md** - Guía de setup

## ✅ Checklist de Setup

- [ ] Ejecutar migración: `npm run typeorm migration:run`
- [ ] Verificar que las columnas se agregaron
- [ ] Verificar que los índices se crearon
- [ ] Verificar que los foreign keys se crearon
- [ ] Probar crear producto sin categoría
- [ ] Probar crear producto con categoría válida
- [ ] Probar crear producto con subcategoría válida
- [ ] Probar crear producto con categoría y subcategoría válidas
- [ ] Probar error: subcategoría que no pertenece a la categoría
- [ ] Probar listar productos por categoría
- [ ] Probar listar productos por subcategoría
- [ ] Probar actualizar categoría de producto
- [ ] Probar eliminar categoría (debe SET NULL en productos)

## 🎯 Comportamiento

### Crear Producto

```typescript
// Sin categoría - OK
POST /products
{ sku: "P1", name: "Product 1" }
// Result: category_id = null, subcategory_id = null

// Con categoría - OK
POST /products
{ sku: "P2", name: "Product 2", category_id: "cat-1" }
// Result: category_id = "cat-1", subcategory_id = null

// Con categoría y subcategoría - OK
POST /products
{ 
  sku: "P3", 
  name: "Product 3", 
  category_id: "cat-1",
  subcategory_id: "subcat-1"
}
// Result: category_id = "cat-1", subcategory_id = "subcat-1"

// Subcategoría que no pertenece a categoría - ERROR
POST /products
{ 
  sku: "P4", 
  name: "Product 4", 
  category_id: "cat-1",
  subcategory_id: "subcat-2"  // pertenece a cat-2
}
// Error: "Subcategory does not belong to the specified category"
```

### Eliminar Categoría

```sql
DELETE FROM categories WHERE id = 'cat-1';

-- Resultado:
-- Todos los productos con category_id = 'cat-1' tendrán category_id = NULL
-- Todos los productos con subcategory_id de esa categoría tendrán subcategory_id = NULL
```

## 🚀 Próximos Pasos

1. Ejecutar migración
2. Probar endpoints
3. Crear UI para seleccionar categoría/subcategoría
4. Agregar filtros avanzados (por categoría + subcategoría)
5. Agregar búsqueda por categoría en catálogo

## 📞 Notas

- Las categorías y subcategorías ya existían en el sistema
- Se agregó la integración con el módulo de productos
- El aislamiento por tenant se mantiene automáticamente
- Las relaciones son opcionales (nullable)
- Al eliminar categoría/subcategoría, los productos no se eliminan (SET NULL)
- Al eliminar producto, no afecta categoría/subcategoría

