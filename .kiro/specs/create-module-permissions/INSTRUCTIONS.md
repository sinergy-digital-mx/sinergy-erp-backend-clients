# How to Create Module Permissions

This guide explains how to use the reusable permission creation system for any module in Sinergy ERP.

## Quick Start

### For Inventory Module (Specific Tenant)

```bash
npm run seed:inventory-tenant
```

This assigns the Inventory module to tenant `afff1757-dbcf-4715-a756-6b22bb2c59d5`.

### For Sales Orders Module

```bash
# For all active tenants
npm run seed:sales-orders

# For a specific tenant
npm run seed:sales-orders -- afff1757-dbcf-4715-a756-6b22bb2c59d5
```

## How It Works

The system uses a generic seed function that:

1. **Creates Entity Registry** - Registers the entity in the system
2. **Creates Module** - Creates the module record
3. **Creates Permissions** - Creates standard permissions (read, write, delete, etc.)
4. **Assigns to Tenant(s)** - Links the module to one or all tenants

## Creating Permissions for a New Module

### Step 1: Create a New Seed File

Create a file like `src/database/seeds/seed-{module-name}-permissions.ts`:

```typescript
import { runModulePermissionsSeed } from './seed-module-permissions.js';

async function seed{ModuleName}Permissions(tenantId?: string) {
  try {
    await runModulePermissionsSeed({
      moduleName: 'Module Display Name',
      moduleCode: 'module-code',
      entityCode: 'entity_code',
      description: 'Module description',
      actions: ['read', 'write', 'delete'], // Standard actions
      tenantId: tenantId, // Optional: specific tenant
    });
  } catch (error) {
    console.error('❌ Failed to seed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  const tenantId = process.argv[2];
  seed{ModuleName}Permissions(tenantId)
    .then(() => {
      console.log('✅ Completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { seed{ModuleName}Permissions };
```

### Step 2: Add npm Script

In `package.json`, add:

```json
{
  "scripts": {
    "seed:module-name": "ts-node src/database/seeds/seed-module-name-permissions.ts"
  }
}
```

### Step 3: Run the Seed

```bash
npm run seed:module-name
# or for specific tenant
npm run seed:module-name -- tenant-id-here
```

## Configuration Options

### ModulePermissionConfig

```typescript
interface ModulePermissionConfig {
  moduleName: string;        // Display name (e.g., "Inventory Management")
  moduleCode: string;        // Kebab-case code (e.g., "inventory")
  entityCode: string;        // Snake_case entity code (e.g., "inventory")
  description?: string;      // Optional module description
  actions?: string[];        // Permissions to create (default: ['read', 'write', 'delete'])
  tenantId?: string;         // Optional: specific tenant ID
}
```

### Available Actions

- `read` - View/read access
- `write` - Create and update access
- `delete` - Delete access
- `create` - Create-only access
- `update` - Update-only access
- `export` - Export data access
- `import` - Import data access
- `approve` - Approval access
- `reject` - Rejection access

## Example: Creating POS Module Permissions

### 1. Create the seed file

```typescript
// src/database/seeds/seed-pos-permissions.ts
import { runModulePermissionsSeed } from './seed-module-permissions.js';

async function seedPosPermissions(tenantId?: string) {
  await runModulePermissionsSeed({
    moduleName: 'Point of Sale',
    moduleCode: 'pos',
    entityCode: 'pos',
    description: 'Module for managing point of sale transactions',
    actions: ['read', 'write', 'delete', 'approve'],
    tenantId: tenantId,
  });
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

### 2. Add to package.json

```json
{
  "scripts": {
    "seed:pos": "ts-node src/database/seeds/seed-pos-permissions.ts"
  }
}
```

### 3. Run it

```bash
# For all tenants
npm run seed:pos

# For specific tenant
npm run seed:pos -- afff1757-dbcf-4715-a756-6b22bb2c59d5
```

## What Gets Created

When you run a seed, it creates:

### Entity Registry Entry
- Code: `entity_code`
- Name: `moduleName`

### Module Record
- Name: `moduleName`
- Code: `moduleCode`
- Description: `description`

### Permissions
For each action, creates a permission:
- `entity_code:read`
- `entity_code:write`
- `entity_code:delete`
- etc.

### Tenant-Module Associations
- Links module to specified tenant(s)
- Sets `is_enabled: true`

## Idempotency

All seeds are idempotent - running them multiple times won't create duplicates:
- If entity registry exists, it's reused
- If module exists, it's reused
- If permission exists, it's skipped
- If tenant-module link exists, it's skipped

## Troubleshooting

### Tenant Not Found
```
Error: Tenant not found: {tenant-id}
```
Make sure the tenant ID is correct and exists in the database.

### Module Already Exists
```
⏭️  Module already exists: {module-name}
```
This is normal - the seed skips existing modules.

### Permission Already Exists
```
⏭️  Permission already exists: {entity_code}:{action}
```
This is normal - the seed skips existing permissions.

## Next Steps After Creating Permissions

1. **Assign to Roles** - Use the RBAC system to assign permissions to roles
2. **Test Access** - Verify users with the role can access the module
3. **Document** - Update module documentation with the new permissions

## Related Files

- Generic seed function: `src/database/seeds/seed-module-permissions.ts`
- Inventory seed: `src/database/seeds/seed-inventory-permissions-tenant.ts`
- Sales Orders seed: `src/database/seeds/seed-sales-orders-permissions.ts`
- Spec documentation: `.kiro/specs/create-module-permissions/spec.md`
