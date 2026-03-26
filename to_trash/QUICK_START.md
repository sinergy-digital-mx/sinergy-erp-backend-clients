# Quick Start - Ejecutar Setup

## 🚀 Comandos Rápidos

### 1. Ejecutar Migraciones

```bash
npm run migration:run
```

**Output esperado:**
```
🔄 Initializing database connection...
✅ Database connected

🔄 Running pending migrations...
✅ Successfully ran X migration(s):
   - CreateProductSystemTables1772812686000
   - CreateProductPhotosTable1772812687000
   - AddCategoryToProducts1772812688000

✅ Migration process completed
🔌 Database connection closed
```

### 2. Configurar Permisos de Categories

```bash
npx ts-node -r tsconfig-paths/register src/database/scripts/add-categories-module.ts
```

**Output esperado:**
```
🔧 Adding Categories module and permissions...

📦 Setting up Categories module...
✅ Created categories module with ID: uuid

📋 Setting up entities...
  ✅ Created Category entity
  ✅ Created Subcategory entity

📝 Creating category permissions...
  ✅ Added Category Create permission
  ✅ Added Category Read permission
  ✅ Added Category Update permission
  ✅ Added Category Delete permission
  ✅ Added Subcategory Create permission
  ✅ Added Subcategory Read permission
  ✅ Added Subcategory Update permission
  ✅ Added Subcategory Delete permission

🏢 Enabling categories module for all tenants...
📋 Found 1 tenant(s)
  ✅ Enabled categories module for tenant: Tenant Name

🔑 Assigning categories permissions to Admin roles...
  ✅ Assigned all categories permissions to Admin role for tenant: Tenant Name

✅ Categories module setup completed successfully!
```

### 3. Configurar Permisos de Products

```bash
npx ts-node -r tsconfig-paths/register src/database/scripts/add-products-module.ts
```

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

### 4. Seed de Datos (Opcional)

```bash
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts
```

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
```

## 📋 Orden Correcto de Ejecución

```bash
# 1. Migraciones (PRIMERO)
npm run migration:run

# 2. Permisos de categories
npx ts-node -r tsconfig-paths/register src/database/scripts/add-categories-module.ts

# 3. Permisos de products
npx ts-node -r tsconfig-paths/register src/database/scripts/add-products-module.ts

# 4. (Opcional) Datos de ejemplo
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts
```

## ✅ Verificación

Después de ejecutar los comandos, verifica que todo funcionó:

```bash
# Ver si las tablas se crearon
mysql -u root -p -e "USE sinergy_erp; SHOW TABLES LIKE 'product%';"

# Ver si los permisos se crearon
mysql -u root -p -e "USE sinergy_erp; SELECT COUNT(*) FROM rbac_permissions WHERE module_id IN (SELECT id FROM modules WHERE code IN ('categories', 'products'));"
# Debe retornar: 28
```

## 🆘 Troubleshooting

### Error: "Cannot find module"
```
Solución: Asegúrate de estar en la raíz del proyecto
cd /c/Projects/Synergy/sinergy-erp-backend-clients
```

### Error: "No tenants found"
```
Solución: Crea un tenant primero
npx ts-node -r tsconfig-paths/register src/database/scripts/create-tenant.ts
```

### Error: "No vendors found"
```
Solución: Crea un vendor primero
npx ts-node -r tsconfig-paths/register src/database/scripts/create-vendor.ts
```

### Error: "Database connection failed"
```
Solución: Verifica que:
1. MySQL está corriendo
2. Las credenciales en .env son correctas
3. La base de datos existe
```

## 🎉 ¡Listo!

Una vez completados todos los comandos, tienes:
- ✅ Tablas de productos creadas
- ✅ 28 permisos RBAC configurados
- ✅ Módulos habilitados para todos los tenants
- ✅ Datos de ejemplo (opcional)

Ahora puedes hacer requests a los endpoints:

```bash
# Crear producto
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-001",
    "name": "Test Product",
    "category_id": "{categoryId}",
    "subcategory_id": "{subcategoryId}"
  }'

# Listar productos
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer {token}"
```

¡Disfruta! 🚀
