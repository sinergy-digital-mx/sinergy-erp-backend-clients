# Quick Start - Module Permissions

## What You Have

A reusable system to create RBAC permissions for any module in Sinergy ERP.

## What Was Done

✅ **Inventory Module** - Assigned to tenant `afff1757-dbcf-4715-a756-6b22bb2c59d5`
✅ **Sales Orders Module** - Created with 5 permissions (read, update, delete, approve, reject)

## How to Use

### Run Existing Seeds

```bash
# Inventory for specific tenant
npm run seed:inventory-tenant

# Sales Orders for specific tenant
npm run seed:sales-orders -- afff1757-dbcf-4715-a756-6b22bb2c59d5

# Sales Orders for all tenants
npm run seed:sales-orders
```

### Create Permissions for a New Module (e.g., POS)

#### Step 1: Create Seed File
Create `src/database/seeds/seed-pos-permissions.ts`:

```typescript
import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedPosPermissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Point of Sale',
      moduleCode: 'pos',
      entityCode: 'pos',
      description: 'Module for managing point of sale transactions',
      actions: ['read', 'update', 'delete', 'approve'],
      tenantId: tenantId,
    });
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  const tenantId = process.argv[2];
  seedPosPermissions(tenantId)
    .then(() => {
      console.log('✅ POS permissions created');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { seedPosPermissions };
```

#### Step 2: Add npm Script
In `package.json`, add:
```json
{
  "scripts": {
    "seed:pos": "ts-node -r tsconfig-paths/register src/database/seeds/seed-pos-permissions.ts"
  }
}
```

#### Step 3: Run It
```bash
# For all tenants
npm run seed:pos

# For specific tenant
npm run seed:pos -- afff1757-dbcf-4715-a756-6b22bb2c59d5
```

## Configuration

```typescript
{
  moduleName: string;        // Display name
  moduleCode: string;        // Kebab-case code
  entityCode: string;        // Snake_case entity code
  description?: string;      // Optional description
  actions?: string[];        // Permissions (default: ['read', 'update', 'delete'])
  tenantId?: string;         // Optional: specific tenant
}
```

## Available Actions

- `read` - View/read access
- `update` - Create and update access
- `delete` - Delete access
- `create` - Create-only access
- `update` - Update-only access
- `export` - Export data access
- `import` - Import data access
- `approve` - Approval access
- `reject` - Rejection access

## What Gets Created

For each module, the system creates:

1. **Entity Registry Entry** - Registers the entity
2. **Module Record** - Creates the module
3. **Permissions** - Creates permissions for each action
4. **Tenant Links** - Assigns module to tenant(s)

## Example Output

```
📦 Creating permissions for module: Sales Orders Management
   Code: sales-orders
   Entity: sales_orders
   Tenant: afff1757-dbcf-4715-a756-6b22bb2c59d5

✅ Created entity registry: sales_orders
✅ Created module: Sales Orders Management
✅ Created permission: sales_orders:read
✅ Created permission: sales_orders:update
✅ Created permission: sales_orders:delete
✅ Created permission: sales_orders:approve
✅ Created permission: sales_orders:reject
✅ Enabled module for tenant: Maderia Zona Norte

🎉 Module permissions setup completed!
✅ Module: Sales Orders Management (sales-orders)
✅ Created permissions: 5
   sales_orders:read, sales_orders:update, sales_orders:delete, sales_orders:approve, sales_orders:reject
✅ Enabled for tenants: 1
   Maderia Zona Norte
```

## Key Features

✅ **Idempotent** - Safe to run multiple times
✅ **Flexible** - Works with any module
✅ **Reusable** - Generic function for all modules
✅ **Tenant-aware** - Assign to specific tenant or all tenants

## Files

- **Generic Function**: `src/database/seeds/seed-module-permissions.ts`
- **Inventory Seed**: `src/database/seeds/seed-inventory-permissions-tenant.ts`
- **Sales Orders Seed**: `src/database/seeds/seed-sales-orders-permissions.ts`
- **Documentation**: `.kiro/specs/create-module-permissions/`

## Next Steps

1. Create permissions for other modules (POS, etc.)
2. Assign permissions to roles
3. Test access with users
4. Document the new modules

## Need Help?

- **How-to Guide**: See `INSTRUCTIONS.md`
- **Complete Reference**: See `README.md`
- **Implementation Details**: See `spec.md`
