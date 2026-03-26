# 🚀 Tenant RBAC Setup Instructions

## Step 1: Run Database Migration

The migration creates the necessary tables and updates existing ones.

```bash
npm run typeorm migration:run
```

This will:
- Create `modules` table
- Create `tenant_modules` table
- Add `module_id` column to `rbac_permissions` table
- Create all necessary indexes and foreign keys

---

## Step 2: Seed Initial Modules

Create a script to seed the initial modules. Add this to `src/database/seeds/seed-modules.ts`:

```typescript
import { DataSource } from 'typeorm';
import { Module } from '../../entities/rbac/module.entity';

export async function seedModules(dataSource: DataSource) {
  const moduleRepository = dataSource.getRepository(Module);

  const modules = [
    {
      name: 'Leads',
      code: 'leads',
      description: 'Lead management module',
    },
    {
      name: 'Customers',
      code: 'customers',
      description: 'Customer management module',
    },
    {
      name: 'Activities',
      code: 'activities',
      description: 'Activity tracking module',
    },
    {
      name: 'Reports',
      code: 'reports',
      description: 'Reporting and analytics module',
    },
  ];

  for (const moduleData of modules) {
    const existing = await moduleRepository.findOne({
      where: { code: moduleData.code },
    });

    if (!existing) {
      const module = moduleRepository.create(moduleData);
      await moduleRepository.save(module);
      console.log(`✓ Created module: ${moduleData.name}`);
    } else {
      console.log(`✓ Module already exists: ${moduleData.name}`);
    }
  }
}
```

Run it:
```bash
npm run seed:modules
```

---

## Step 3: Seed Module Permissions

Create a script to seed permissions for each module. Add this to `src/database/seeds/seed-module-permissions.ts`:

```typescript
import { DataSource } from 'typeorm';
import { Module } from '../../entities/rbac/module.entity';
import { Permission } from '../../entities/rbac/permission.entity';

export async function seedModulePermissions(dataSource: DataSource) {
  const moduleRepository = dataSource.getRepository(Module);
  const permissionRepository = dataSource.getRepository(Permission);

  const actions = ['Create', 'Read', 'Update', 'Delete'];
  const moduleCodes = ['leads', 'customers', 'activities', 'reports'];

  for (const code of moduleCodes) {
    const module = await moduleRepository.findOne({ where: { code } });
    if (!module) {
      console.log(`⚠ Module not found: ${code}`);
      continue;
    }

    for (const action of actions) {
      const existing = await permissionRepository.findOne({
        where: {
          module_id: module.id,
          action: action,
        },
      });

      if (!existing) {
        const permission = permissionRepository.create({
          module_id: module.id,
          entity_type: code,
          action: action,
          description: `${action} ${module.name}`,
          is_system_permission: true,
        });
        await permissionRepository.save(permission);
        console.log(`✓ Created permission: ${code}:${action}`);
      }
    }
  }
}
```

Run it:
```bash
npm run seed:module-permissions
```

---

## Step 4: Enable Modules for Existing Tenant

Create a script to enable modules for your tenant. Add this to `src/database/scripts/enable-tenant-modules.ts`:

```typescript
import { DataSource } from 'typeorm';
import { Module } from '../../entities/rbac/module.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';

export async function enableTenantModules(
  dataSource: DataSource,
  tenantId: string,
) {
  const moduleRepository = dataSource.getRepository(Module);
  const tenantModuleRepository = dataSource.getRepository(TenantModule);

  const modules = await moduleRepository.find();

  for (const module of modules) {
    const existing = await tenantModuleRepository.findOne({
      where: {
        tenant_id: tenantId,
        module_id: module.id,
      },
    });

    if (!existing) {
      const tenantModule = tenantModuleRepository.create({
        tenant_id: tenantId,
        module_id: module.id,
        is_enabled: true,
      });
      await tenantModuleRepository.save(tenantModule);
      console.log(`✓ Enabled module for tenant: ${module.name}`);
    } else {
      console.log(`✓ Module already enabled: ${module.name}`);
    }
  }
}
```

Run it with your tenant ID:
```bash
npm run script:enable-tenant-modules -- --tenantId=<your-tenant-id>
```

---

## Step 5: Verify Setup

### Check Modules
```bash
curl -X GET http://localhost:3000/tenant/modules \
  -H "Authorization: Bearer <your-jwt-token>"
```

Expected response:
```json
{
  "modules": [
    {
      "id": "...",
      "name": "Leads",
      "code": "leads",
      "description": "Lead management module",
      "is_enabled": true,
      "permissions": [
        { "id": "...", "action": "Create", "description": "..." },
        { "id": "...", "action": "Read", "description": "..." },
        { "id": "...", "action": "Update", "description": "..." },
        { "id": "...", "action": "Delete", "description": "..." }
      ]
    }
  ]
}
```

### Check Roles
```bash
curl -X GET http://localhost:3000/tenant/roles \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Step 6: Create Your First Role

```bash
curl -X POST http://localhost:3000/tenant/roles \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Manager",
    "description": "Can manage leads and customers",
    "permission_ids": [
      "<leads-create-permission-id>",
      "<leads-read-permission-id>",
      "<leads-update-permission-id>",
      "<customers-read-permission-id>"
    ]
  }'
```

---

## Step 7: Assign Role to User

```bash
curl -X POST http://localhost:3000/tenant/users/{userId}/roles/{roleId} \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Step 8: Verify User Permissions

```bash
curl -X GET http://localhost:3000/tenant/users/{userId}/permissions \
  -H "Authorization: Bearer <your-jwt-token>"
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com"
  },
  "permissions": [
    "leads:create",
    "leads:read",
    "leads:update",
    "customers:read"
  ]
}
```

---

## 🔧 Troubleshooting

### Migration Fails
- Ensure database is running
- Check that `rbac_permissions` table exists
- Verify TypeORM connection is configured correctly

### Modules Not Showing
- Verify modules were seeded: `SELECT * FROM modules;`
- Verify tenant_modules were created: `SELECT * FROM tenant_modules;`
- Check tenant ID is correct

### Permissions Not Showing
- Verify permissions were seeded: `SELECT * FROM rbac_permissions;`
- Check that permissions have correct `module_id`
- Verify role has permissions assigned: `SELECT * FROM rbac_role_permissions;`

### User Permissions Empty
- Verify user has roles assigned: `SELECT * FROM rbac_user_roles;`
- Verify roles have permissions: `SELECT * FROM rbac_role_permissions;`
- Check tenant context is set correctly

---

## 📊 Database Schema

### modules
```sql
CREATE TABLE modules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tenant_modules
```sql
CREATE TABLE tenant_modules (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  module_id VARCHAR(36) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY tenant_module_index (tenant_id, module_id),
  FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);
```

### rbac_permissions (updated)
```sql
ALTER TABLE rbac_permissions ADD COLUMN module_id VARCHAR(36);
ALTER TABLE rbac_permissions ADD FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
ALTER TABLE rbac_permissions ADD UNIQUE KEY module_action_index (module_id, action);
```

---

## 🎯 Next Steps

1. ✅ Run migration
2. ✅ Seed modules
3. ✅ Seed permissions
4. ✅ Enable modules for tenant
5. ✅ Create roles
6. ✅ Assign roles to users
7. 🔄 Build UI for role/permission management
8. 🔄 Integrate with frontend

---

## 📝 Example Complete Setup Script

```typescript
// src/database/scripts/complete-rbac-setup.ts
import { DataSource } from 'typeorm';
import { seedModules } from '../seeds/seed-modules';
import { seedModulePermissions } from '../seeds/seed-module-permissions';
import { enableTenantModules } from './enable-tenant-modules';

export async function completeRBACSetup(
  dataSource: DataSource,
  tenantId: string,
) {
  console.log('🚀 Starting RBAC setup...\n');

  console.log('📦 Seeding modules...');
  await seedModules(dataSource);

  console.log('\n🔐 Seeding permissions...');
  await seedModulePermissions(dataSource);

  console.log('\n🔗 Enabling modules for tenant...');
  await enableTenantModules(dataSource, tenantId);

  console.log('\n✅ RBAC setup complete!');
}
```

Run it:
```bash
npm run script:complete-rbac-setup -- --tenantId=<your-tenant-id>
```
