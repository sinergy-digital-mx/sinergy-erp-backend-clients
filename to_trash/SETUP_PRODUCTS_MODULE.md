# Setup del Módulo de Productos

Guía paso a paso para configurar el módulo de productos con permisos RBAC y datos de ejemplo.

## 📋 Requisitos Previos

- Base de datos inicializada
- Al menos un tenant creado
- Al menos un vendor creado
- Migraciones ejecutadas

## 🚀 Pasos de Setup

### 1. Ejecutar Migraciones

Primero, ejecuta las migraciones para crear las tablas del módulo de productos:

```bash
npm run typeorm migration:run
```

Esto creará las siguientes tablas:
- `products`
- `uoms`
- `uom_relationships`
- `vendor_product_prices`
- `product_photos`

### 2. Configurar Módulo y Permisos

Ejecuta el script para crear el módulo de productos y sus permisos RBAC:

```bash
npx ts-node src/database/scripts/add-products-module.ts
```

**Qué hace este script:**
- ✅ Crea el módulo "Product Management"
- ✅ Registra 5 entidades en el entity registry:
  - Product
  - UoM (Unit of Measure)
  - UoMRelationship
  - VendorProductPrice
  - ProductPhoto
- ✅ Crea 20 permisos (4 acciones × 5 entidades):
  - Create, Read, Update, Delete para cada entidad
- ✅ Habilita el módulo para todos los tenants
- ✅ Asigna todos los permisos al rol Admin de cada tenant

**Output esperado:**
```
🔧 Adding Products module and permissions...

📦 Setting up Products module...
✅ Created products module with ID: uuid

📋 Setting up entities...
  ✅ Created Product entity
  ✅ Created UoM entity
  ✅ Created UoMRelationship entity
  ✅ Created VendorProductPrice entity
  ✅ Created ProductPhoto entity

📝 Creating permissions...
  Product:
    ✅ Created Create permission
    ✅ Created Read permission
    ✅ Created Update permission
    ✅ Created Delete permission
  ... (repetido para cada entidad)

🏢 Enabling products module for all tenants...
📋 Found 1 tenant(s)
  ✅ Enabled products module for tenant: Tenant Name

🔑 Assigning product permissions to Admin roles...
  ✅ Assigned all product permissions to Admin role for tenant: Tenant Name

============================================================
✅ Products module setup completed successfully!
============================================================

📊 Summary:
   - Module: Product Management
   - Entities: 5
   - Permissions per entity: 4
   - Total permissions: 20
   - Tenants enabled: 1
```

### 3. Seed de Datos de Ejemplo (Opcional)

Para crear datos de ejemplo (productos, UoMs, precios):

```bash
npx ts-node src/database/scripts/seed-products.ts
```

**Qué hace este script:**
- ✅ Crea 3 productos de ejemplo
- ✅ Crea 3 UoMs para el primer producto (unit, box, pallet)
- ✅ Crea 3 relaciones de conversión
- ✅ Crea 3 precios de vendor

**Output esperado:**
```
🌱 Seeding Products data...

📋 Using tenant: Tenant Name

🏢 Using vendor: Vendor Name

📦 Creating products...
  ✅ Created: Laptop Dell XPS 13 (PROD-001)
  ✅ Created: USB-C Cable (PROD-002)
  ✅ Created: Wireless Mouse (PROD-003)

📏 Creating Units of Measure...
  ✅ Created: Unit (unit)
  ✅ Created: Box (10 units) (box)
  ✅ Created: Pallet (100 units) (pallet)

🔗 Creating UoM relationships...
  ✅ Created: 1 box = 10 unit(s)
  ✅ Created: 1 pallet = 100 unit(s)
  ✅ Created: 1 pallet = 10 box(es)

💰 Creating vendor prices...
  ✅ Created: 999.99 per unit
  ✅ Created: 8999.99 per box
  ✅ Created: 89999.99 per pallet

============================================================
✅ Products seeding completed successfully!
============================================================

📊 Summary:
   - Products created: 3
   - UoMs created: 3
   - Relationships created: 3
   - Vendor prices created: 3

💡 Next steps:
   1. Run migrations: npm run typeorm migration:run
   2. Test endpoints with the created data
   3. Upload product photos via the API
```

## 🧪 Verificar Setup

### Verificar Módulo Creado

```bash
# Listar módulos
SELECT * FROM modules WHERE code = 'products';

# Listar entidades
SELECT * FROM entity_registry WHERE code IN ('Product', 'UoM', 'UoMRelationship', 'VendorProductPrice', 'ProductPhoto');

# Listar permisos
SELECT * FROM rbac_permissions WHERE module_id = (SELECT id FROM modules WHERE code = 'products');

# Verificar asignación a Admin
SELECT rp.* FROM rbac_role_permissions rp
JOIN rbac_permissions p ON rp.permission_id = p.id
JOIN rbac_roles r ON rp.role_id = r.id
WHERE r.name = 'Admin' AND p.module_id = (SELECT id FROM modules WHERE code = 'products');
```

### Verificar Datos de Ejemplo

```bash
# Listar productos
SELECT * FROM products;

# Listar UoMs
SELECT * FROM uoms;

# Listar relaciones
SELECT * FROM uom_relationships;

# Listar precios
SELECT * FROM vendor_product_prices;
```

## 🔐 Permisos Creados

El script crea los siguientes permisos para cada entidad:

| Entidad | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Product | ✅ | ✅ | ✅ | ✅ |
| UoM | ✅ | ✅ | ✅ | ✅ |
| UoMRelationship | ✅ | ✅ | ✅ | ✅ |
| VendorProductPrice | ✅ | ✅ | ✅ | ✅ |
| ProductPhoto | ✅ | ✅ | ✅ | ✅ |

**Total: 20 permisos**

Todos estos permisos se asignan automáticamente al rol Admin de cada tenant.

## 🧑‍💻 Usar los Endpoints

Una vez completado el setup, puedes hacer requests a los endpoints:

### Crear Producto
```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-004",
    "name": "Nuevo Producto",
    "description": "Descripción"
  }'
```

### Listar Productos
```bash
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer {token}"
```

### Crear UoM
```bash
curl -X POST http://localhost:3000/products/{productId}/uoms \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "piece",
    "name": "Pieza"
  }'
```

### Subir Foto
```bash
curl -X POST http://localhost:3000/products/{productId}/photos \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/image.png" \
  -F "alt_text=Descripción de la foto"
```

## 📝 Notas Importantes

1. **Orden de Ejecución**: Siempre ejecuta las migraciones ANTES de los scripts de setup
2. **Tenant Requerido**: Asegúrate de tener al menos un tenant creado
3. **Vendor Requerido**: Para el seed de datos, necesitas al menos un vendor
4. **Idempotente**: Los scripts son idempotentes, puedes ejecutarlos múltiples veces sin problemas
5. **Admin Role**: Los permisos se asignan al rol "Admin" de cada tenant

## 🆘 Troubleshooting

### Error: "No tenants found"
```
Solución: Crea un tenant primero
npx ts-node src/database/scripts/create-tenant.ts
```

### Error: "No vendors found"
```
Solución: Crea un vendor primero
npx ts-node src/database/scripts/create-vendor.ts
```

### Error: "Module already exists"
```
Solución: Es normal, el script es idempotente. Continúa.
```

### Error: "Permission denied" en requests
```
Solución: Verifica que:
1. El token es válido
2. El usuario tiene rol Admin
3. El módulo está habilitado para el tenant
4. Los permisos están asignados al rol
```

## 📚 Archivos Relacionados

- **Especificación**: `PRODUCT_SYSTEM_COMPLETE.md`
- **Estructura de Fotos**: `PRODUCT_PHOTOS_STRUCTURE.md`
- **Script de Setup**: `src/database/scripts/add-products-module.ts`
- **Script de Seed**: `src/database/scripts/seed-products.ts`
- **Migraciones**: 
  - `src/database/migrations/1772812686000-create-product-system-tables.ts`
  - `src/database/migrations/1772812687000-create-product-photos-table.ts`

## ✅ Checklist de Setup

- [ ] Base de datos inicializada
- [ ] Tenant creado
- [ ] Vendor creado
- [ ] Migraciones ejecutadas: `npm run typeorm migration:run`
- [ ] Script de módulo ejecutado: `npx ts-node src/database/scripts/add-products-module.ts`
- [ ] Script de seed ejecutado (opcional): `npx ts-node src/database/scripts/seed-products.ts`
- [ ] Verificar permisos en BD
- [ ] Probar endpoints con token válido
- [ ] Subir fotos de prueba

## 🎉 ¡Listo!

Una vez completados todos los pasos, el módulo de productos está completamente configurado y listo para usar.

Puedes comenzar a:
1. Crear productos
2. Definir unidades de medida
3. Crear relaciones de conversión
4. Establecer precios de vendor
5. Subir fotos de productos

¡Disfruta! 🚀
