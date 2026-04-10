# Module Permissions Template

Copy and paste this template to create permissions for a new module.

## Step 1: Create Seed File

Create a new file: `src/database/seeds/seed-{module-name}-permissions.ts`

Replace `{module-name}` with your module name (e.g., `pos`, `crm`, `accounting`).

```typescript
import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seed{ModuleName}Permissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: '{Display Name}',
      moduleCode: '{module-code}',
      entityCode: '{entity_code}',
      description: '{Module description}',
      actions: ['read', 'update', 'delete'],
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
  seed{ModuleName}Permissions(tenantId)
    .then(() => {
      console.log('✅ {Module Name} permissions created');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { seed{ModuleName}Permissions };
```

## Step 2: Update package.json

Add this script to `package.json`:

```json
{
  "scripts": {
    "seed:{module-name}": "ts-node -r tsconfig-paths/register src/database/seeds/seed-{module-name}-permissions.ts"
  }
}
```

## Step 3: Run It

```bash
# For all tenants
npm run seed:{module-name}

# For specific tenant
npm run seed:{module-name} -- {tenant-id}
```

## Configuration Reference

### ModulePermissionConfig

```typescript
{
  moduleName: string;        // Display name (e.g., "Point of Sale")
  moduleCode: string;        // Kebab-case code (e.g., "pos")
  entityCode: string;        // Snake_case entity code (e.g., "pos")
  description?: string;      // Optional description
  actions?: string[];        // Permissions to create
  tenantId?: string;         // Optional: specific tenant ID
}
```

### Available Actions

- `read` - View/read access
- `update` - Create and update access
- `delete` - Delete access
- `create` - Create-only access
- `update` - Update-only access
- `export` - Export data access
- `import` - Import data access
- `approve` - Approval access
- `reject` - Rejection access

## Example: POS Module

### Seed File: `src/database/seeds/seed-pos-permissions.ts`

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

### package.json

```json
{
  "scripts": {
    "seed:pos": "ts-node -r tsconfig-paths/register src/database/seeds/seed-pos-permissions.ts"
  }
}
```

### Run

```bash
# For all tenants
npm run seed:pos

# For specific tenant
npm run seed:pos -- afff1757-dbcf-4715-a756-6b22bb2c59d5
```

## Example: CRM Module with Custom Actions

### Seed File: `src/database/seeds/seed-crm-permissions.ts`

```typescript
import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedModulePermissions } from './seed-module-permissions';

async function seedCrmPermissions(tenantId?: string) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await seedModulePermissions(AppDataSource, {
      moduleName: 'Customer Relationship Management',
      moduleCode: 'crm',
      entityCode: 'crm',
      description: 'Module for managing customer relationships and interactions',
      actions: ['read', 'update', 'delete', 'export', 'import'],
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
  seedCrmPermissions(tenantId)
    .then(() => {
      console.log('✅ CRM permissions created');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { seedCrmPermissions };
```

### package.json

```json
{
  "scripts": {
    "seed:crm": "ts-node -r tsconfig-paths/register src/database/seeds/seed-crm-permissions.ts"
  }
}
```

### Run

```bash
npm run seed:crm -- afff1757-dbcf-4715-a756-6b22bb2c59d5
```

## Naming Conventions

- **Module Name**: Use title case (e.g., "Point of Sale", "Customer Relationship Management")
- **Module Code**: Use kebab-case (e.g., "pos", "crm", "sales-orders")
- **Entity Code**: Use snake_case (e.g., "pos", "crm", "sales_orders")
- **File Name**: Use kebab-case (e.g., "seed-pos-permissions.ts")
- **Function Name**: Use PascalCase (e.g., "seedPosPermissions")

## What Gets Created

When you run the seed, it creates:

1. **Entity Registry Entry**
   - Code: `entity_code`
   - Name: `moduleName`

2. **Module Record**
   - Name: `moduleName`
   - Code: `moduleCode`
   - Description: `description`

3. **Permissions** (for each action)
   - `entity_code:read`
   - `entity_code:update`
   - `entity_code:delete`
   - etc.

4. **Tenant-Module Links**
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
⏭️  Module already exists
```
This is normal - the seed skips existing modules.

### Permission Already Exists
```
⏭️  Permission already exists
```
This is normal - the seed skips existing permissions.

## Next Steps

1. Create the seed file
2. Add the npm script
3. Run the seed
4. Assign permissions to roles
5. Test access with users
