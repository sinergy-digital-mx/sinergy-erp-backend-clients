# Scripts de Seed - Ahora Idempotentes

## 📋 Cambios Realizados

Se han actualizado los scripts de seed para ser **idempotentes**, lo que significa que pueden ejecutarse múltiples veces sin causar errores de duplicados.

### Scripts Actualizados

1. **seed-products.ts** - Seed de productos, UoMs y precios
2. **seed-wood-categories.ts** - Seed de categorías de madera (ya era idempotente)

## 🔄 Comportamiento Idempotente

### Antes (Causaba Error)
```
❌ Error: Duplicate entry 'PROD-001' for key 'products.UQ_products_tenant_sku'
```

### Ahora (Maneja Duplicados)
```
⏭️  Already exists: Laptop Dell XPS 13 (PROD-001)
✅ Created: USB-C Cable (PROD-002)
```

## 🚀 Cómo Usar

Ahora puedes ejecutar los scripts múltiples veces sin problemas:

```bash
# Primera ejecución - Crea todo
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts

# Segunda ejecución - Detecta duplicados y continúa
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts

# Tercera ejecución - Sigue funcionando sin errores
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts
```

## 📊 Output Esperado (Múltiples Ejecuciones)

### Primera Ejecución
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

✅ Products seeding completed successfully!
```

### Segunda Ejecución (Detecta Duplicados)
```
🌱 Seeding Products data...

📋 Using tenant: Tenant Name
🏢 Using vendor: Vendor Name

📦 Creating products...
  ⏭️  Already exists: Laptop Dell XPS 13 (PROD-001)
  ⏭️  Already exists: USB-C Cable (PROD-002)
  ⏭️  Already exists: Wireless Mouse (PROD-003)

📏 Creating Units of Measure...
  ⏭️  Already exists: Unit (unit)
  ⏭️  Already exists: Box (10 units) (box)
  ⏭️  Already exists: Pallet (100 units) (pallet)

🔗 Creating UoM relationships...
  ⏭️  Already exists: 1 box = 10 unit(s)
  ⏭️  Already exists: 1 pallet = 100 unit(s)
  ⏭️  Already exists: 1 pallet = 10 box(es)

💰 Creating vendor prices...
  ⏭️  Already exists: 999.99 per unit
  ⏭️  Already exists: 8999.99 per box
  ⏭️  Already exists: 89999.99 per pallet

✅ Products seeding completed successfully!
```

## 🔍 Cómo Funciona

### Verificación de Duplicados

Antes de insertar, el script verifica si el registro ya existe:

```typescript
// Verificar si el producto ya existe
const existing = await AppDataSource.query(
  `SELECT id FROM products WHERE tenant_id = ? AND sku = ?`,
  [tenantId, productData.sku]
);

if (existing.length) {
  console.log(`⏭️  Already exists: ${productData.name}`);
  continue;  // Saltar a siguiente
}

// Si no existe, crear
const productId = uuidv4();
await AppDataSource.query(
  `INSERT INTO products ...`,
  [productId, tenantId, ...]
);
```

## ✅ Ventajas

- ✅ Puedes ejecutar el script múltiples veces
- ✅ No causa errores de duplicados
- ✅ Útil para desarrollo y testing
- ✅ Seguro para ejecutar en CI/CD
- ✅ Permite agregar nuevos datos sin afectar los existentes

## 📝 Ejemplo de Uso

### Ejecutar Seed Completo

```bash
# 1. Migraciones
npm run migration:run

# 2. Permisos
npx ts-node -r tsconfig-paths/register src/database/scripts/add-categories-module.ts
npx ts-node -r tsconfig-paths/register src/database/scripts/add-products-module.ts

# 3. Categorías de madera
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-wood-categories.ts

# 4. Productos (puede ejecutarse múltiples veces)
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts  # Sin errores
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts  # Sin errores
```

## 🎯 Casos de Uso

### Desarrollo Local
```bash
# Ejecutar seed cada vez que reseteas la BD
npm run migration:run
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts
```

### Testing
```bash
# Ejecutar seed antes de cada test
npm run migration:run
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts
# Ejecutar tests
npm test
```

### CI/CD
```bash
# Ejecutar en pipeline sin preocuparse por duplicados
npm run migration:run
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-products.ts
```

## 📚 Documentación Relacionada

- **QUICK_START.md** - Comandos rápidos
- **SEED_WOOD_CATEGORIES.md** - Seed de categorías
- **SETUP_COMPLETE_GUIDE.md** - Guía completa

## 🎉 ¡Listo!

Ahora puedes ejecutar los scripts de seed sin preocuparte por errores de duplicados. ¡Disfruta! 🚀
