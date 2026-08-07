# Plan: Módulo de Productos desde Cero

## 🎯 Objetivo
Rediseñar completamente el módulo de productos con una arquitectura limpia, simple y escalable.

## 📋 Paso 1: Limpieza Completa

### Ejecutar script de limpieza:
```bash
npm run cleanup:products
```

Este script:
- ✅ Elimina todas las tablas relacionadas con productos
- ✅ Elimina permisos y módulos de productos
- ✅ Deja el sistema listo para empezar desde cero

## 🏗️ Paso 2: Diseño de la Nueva Arquitectura

### 2.1 Entidades Core (Mínimas y Esenciales)

#### **Product** (Tabla principal)
```typescript
- id: UUID
- tenant_id: UUID (FK)
- sku: string (único por tenant)
- name: string
- description: text
- category_id: UUID (FK - opcional)
- subcategory_id: UUID (FK - opcional)
- base_unit: string (ej: "pieza", "kg", "litro")
- is_active: boolean
- metadata: JSON (para campos personalizados)
- created_at: timestamp
- updated_at: timestamp
```

#### **ProductPrice** (Precios por lista)
```typescript
- id: UUID
- tenant_id: UUID (FK)
- product_id: UUID (FK)
- price_list_id: UUID (FK)
- price: decimal(12,2)
- cost: decimal(12,2) - opcional
- currency: string (default: "MXN")
- is_active: boolean
- valid_from: date (opcional)
- valid_to: date (opcional)
- created_at: timestamp
- updated_at: timestamp
```

#### **ProductImage** (Imágenes del producto)
```typescript
- id: UUID
- tenant_id: UUID (FK)
- product_id: UUID (FK)
- url: string (S3)
- display_order: integer
- is_primary: boolean
- created_at: timestamp
```

#### **ProductInventory** (Stock por almacén)
```typescript
- id: UUID
- tenant_id: UUID (FK)
- product_id: UUID (FK)
- warehouse_id: UUID (FK)
- quantity: decimal(12,4)
- reserved_quantity: decimal(12,4)
- available_quantity: decimal(12,4) (computed)
- min_stock: decimal(12,4) (opcional)
- max_stock: decimal(12,4) (opcional)
- updated_at: timestamp
```

### 2.2 Características Clave

✅ **Simplicidad**: Sin UoM complejas al inicio (solo unidad base)
✅ **Multi-tenant**: Aislamiento completo por tenant
✅ **Flexible**: Campo metadata JSON para extensiones
✅ **Performante**: Índices optimizados
✅ **Escalable**: Fácil agregar features después

### 2.3 Relaciones Simplificadas

```
Product
  ├── ProductPrice (1:N)
  ├── ProductImage (1:N)
  ├── ProductInventory (1:N por warehouse)
  ├── Category (N:1 - opcional)
  └── Subcategory (N:1 - opcional)
```

## 📦 Paso 3: Estructura de Archivos

```
src/
├── entities/
│   └── products/
│       ├── product.entity.ts
│       ├── product-price.entity.ts
│       ├── product-image.entity.ts
│       └── product-inventory.entity.ts
│
├── api/
│   └── products/
│       ├── products.module.ts
│       ├── controllers/
│       │   ├── product.controller.ts
│       │   ├── product-price.controller.ts
│       │   └── product-image.controller.ts
│       ├── services/
│       │   ├── product.service.ts
│       │   ├── product-price.service.ts
│       │   └── product-image.service.ts
│       └── dto/
│           ├── create-product.dto.ts
│           ├── update-product.dto.ts
│           ├── query-product.dto.ts
│           ├── create-product-price.dto.ts
│           └── upload-product-image.dto.ts
│
└── database/
    └── seeds/
        └── seed-products-module.ts
```

## 🔧 Paso 4: Endpoints API

### Productos
- `GET /api/products` - Listar productos (paginado, filtros)
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto
- `PATCH /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `GET /api/products/:id/inventory` - Ver inventario del producto

### Precios
- `GET /api/products/:id/prices` - Listar precios del producto
- `POST /api/products/:id/prices` - Agregar precio
- `PATCH /api/products/:id/prices/:priceId` - Actualizar precio
- `DELETE /api/products/:id/prices/:priceId` - Eliminar precio

### Imágenes
- `GET /api/products/:id/images` - Listar imágenes
- `POST /api/products/:id/images` - Subir imagen
- `PATCH /api/products/:id/images/:imageId` - Actualizar orden/primary
- `DELETE /api/products/:id/images/:imageId` - Eliminar imagen

## 🎨 Paso 5: Features Opcionales (Fase 2)

Estas features se pueden agregar DESPUÉS si son necesarias:

- [ ] Unidades de medida (UoM) con conversiones
- [ ] Variantes de productos (tallas, colores)
- [ ] Kits/Bundles (productos compuestos)
- [ ] Precios por proveedor
- [ ] Historial de precios
- [ ] Códigos de barras múltiples
- [ ] Atributos personalizados por categoría
- [ ] Productos serializados (números de serie)

## 🚀 Paso 6: Orden de Implementación

1. ✅ **Ejecutar limpieza** (cleanup script)
2. 📝 **Crear entidades** (product, product-price, product-image, product-inventory)
3. 🔧 **Crear servicios** (lógica de negocio)
4. 🎮 **Crear controladores** (endpoints API)
5. 📋 **Crear DTOs** (validación)
6. 🌱 **Crear seed** (módulo y permisos)
7. 🧪 **Probar endpoints** (Postman/Insomnia)
8. 📚 **Documentar** (Swagger)

## 💡 Principios de Diseño

1. **KISS (Keep It Simple, Stupid)**: Empezar simple, agregar complejidad solo cuando sea necesario
2. **YAGNI (You Aren't Gonna Need It)**: No agregar features "por si acaso"
3. **DRY (Don't Repeat Yourself)**: Reutilizar código común
4. **Single Responsibility**: Cada clase/función hace una cosa bien
5. **Multi-tenant First**: Aislamiento de datos desde el diseño

## ⚠️ Consideraciones Importantes

- **Migración de datos**: Si hay datos existentes, crear script de migración
- **Backward compatibility**: Verificar dependencias en otros módulos (sales-orders, purchase-orders, inventory)
- **Performance**: Agregar índices en campos de búsqueda frecuente
- **Validación**: SKU único por tenant, precios >= 0, etc.

## 📊 Métricas de Éxito

- ✅ Tiempo de respuesta < 200ms para listados
- ✅ Código < 50% del tamaño actual
- ✅ 100% cobertura de casos de uso básicos
- ✅ Fácil de entender y mantener
- ✅ Documentación completa

---

## 🎬 ¿Listo para empezar?

1. Revisa este plan
2. Confirma que estás de acuerdo con el diseño
3. Ejecutamos el script de limpieza
4. Empezamos a crear las entidades nuevas

**¿Qué te parece este enfoque?** ¿Hay algo que quieras cambiar o agregar?
