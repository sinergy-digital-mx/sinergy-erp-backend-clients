# Module Permissions Creation System

A reusable, standardized system for creating RBAC permissions for any module in Sinergy ERP.

## What's Included

### 1. Generic Seed Function
**File**: `src/database/seeds/seed-module-permissions.ts`

A reusable function that handles all the logic for creating module permissions:
- Creates entity registry entries
- Creates module records
- Creates standard permissions (read, write, delete, etc.)
- Assigns modules to tenants

### 2. Pre-built Seeds

#### Inventory Module (Specific Tenant)
**File**: `src/database/seeds/seed-inventory-permissions-tenant.ts`
**Command**: `npm run seed:inventory-tenant`

Assigns the Inventory module to tenant `afff1757-dbcf-4715-a756-6b22bb2c59d5`

#### Sales Orders Module
**File**: `src/database/seeds/seed-sales-orders-permissions.ts`
**Command**: `npm run seed:sales-orders [tenant-id]`

Creates Sales Orders module permissions. Optionally assign to a specific tenant.

### 3. Documentation

- **spec.md** - Overview and task breakdown
- **INSTRUCTIONS.md** - Detailed how-to guide with examples
- **README.md** - This file

## Quick Start

### Run Inventory Permissions for Specific Tenant
```bash
npm run seed:inventory-tenant
```

### Run Sales Orders Permissions
```bash
# For all active tenants
npm run seed:sales-orders

# For specific tenant
npm run seed:sales-orders -- afff1757-dbcf-4715-a756-6b22bb2c59d5
```

## Creating Permissions for a New Module

### 1. Create Seed File
Create `src/database/seeds/seed-{module-name}-permissions.ts`:

```typescript
import { runModulePermissionsSeed } from './seed-module-permissions.js';

async function seed{ModuleName}Permissions(tenantId?: string) {
  await runModulePermissionsSeed({
    moduleName: 'Display Name',
    moduleCode: 'module-code',
    entityCode: 'entity_code',
    description: 'Module description',
    actions: ['read', 'write', 'delete'],
    tenantId: tenantId,
  });
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

### 2. Add npm Script
In `package.json`:
```json
{
  "scripts": {
    "seed:module-name": "ts-node -r tsconfig-paths/register src/database/seeds/seed-module-name-permissions.ts"
  }
}
```

### 3. Run It
```bash
npm run seed:module-name
# or with specific tenant
npm run seed:module-name -- tenant-id
```

## Configuration

### ModulePermissionConfig Interface

```typescript
interface ModulePermissionConfig {
  moduleName: string;        // Display name
  moduleCode: string;        // Kebab-case code
  entityCode: string;        // Snake_case entity code
  description?: string;      // Optional description
  actions?: string[];        // Permissions to create
  tenantId?: string;         // Optional: specific tenant
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

## What Gets Created

When you run a seed, it creates:

1. **Entity Registry Entry**
   - Code: `entity_code`
   - Name: `moduleName`

2. **Module Record**
   - Name: `moduleName`
   - Code: `moduleCode`
   - Description: `description`

3. **Permissions** (for each action)
   - `entity_code:read`
   - `entity_code:write`
   - `entity_code:delete`
   - etc.

4. **Tenant-Module Links**
   - Links module to specified tenant(s)
   - Sets `is_enabled: true`

## Key Features

✅ **Idempotent** - Safe to run multiple times
✅ **Flexible** - Works with any module
✅ **Reusable** - Generic function for all modules
✅ **Tenant-aware** - Assign to specific tenant or all tenants
✅ **Extensible** - Add custom actions as needed

## Example: Creating POS Module

### 1. Create seed file
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
    "seed:pos": "ts-node -r tsconfig-paths/register src/database/seeds/seed-pos-permissions.ts"
  }
}
```

### 3. Run it
```bash
npm run seed:pos -- afff1757-dbcf-4715-a756-6b22bb2c59d5
```

## Files Structure

```
.kiro/specs/create-module-permissions/
├── spec.md              # Overview and tasks
├── INSTRUCTIONS.md      # Detailed how-to guide
└── README.md           # This file

src/database/seeds/
├── seed-module-permissions.ts              # Generic function
├── seed-inventory-permissions-tenant.ts    # Inventory for specific tenant
└── seed-sales-orders-permissions.ts        # Sales Orders module
```

## Next Steps

1. **Run Inventory Seed**: `npm run seed:inventory-tenant`
2. **Run Sales Orders Seed**: `npm run seed:sales-orders`
3. **Create POS Module**: Follow the example above
4. **Assign to Roles**: Use RBAC system to assign permissions to roles
5. **Test Access**: Verify users can access modules

## Troubleshooting

### Tenant Not Found
```
Error: Tenant not found: {tenant-id}
```
Verify the tenant ID exists in the database.

### Module Already Exists
```
⏭️  Module already exists
```
This is normal - the seed skips existing modules.

### Permission Already Exists
```
⏭️  Permission already exists
```
This is normal - the seed skips existing permissions.

## Related Documentation

- Module Standard: `.kiro/specs/MODULE_STANDARD.md`
- RBAC System: `src/api/rbac/`
- Entity Registry: `src/entities/entity-registry/`
