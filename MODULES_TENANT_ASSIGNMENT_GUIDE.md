# Modules Tenant Assignment Guide

## Problem
The customer groups endpoints (and other module endpoints) were returning 404 errors because the modules weren't assigned to the tenants in the database.

## Solution
Modules need to be explicitly assigned to each tenant via the `tenant_modules` table. This is a multi-tenant security feature that controls which modules are available to each tenant.

## Steps to Fix

### 1. Run the Module Assignment Script
```bash
npm run rbac:assign-modules
```

This script will:
- Create default modules if they don't exist (leads, customers, properties, contracts, payments, transactions, email, reports, users, roles, permissions, audit)
- Assign all modules to all active tenants
- Display a verification report

### 2. Verify the Assignment
After running the script, you should see output like:
```
🏢 Demo Company: 12 modules
   📦 Leads Management, Customers Management, Properties Management, ...
```

### 3. Test the Endpoints
Now the endpoints should work:
- `GET /api/tenant/customer-groups` - List customer groups
- `GET /api/tenant/customers` - List customers
- `GET /api/tenant/leads` - List leads
- etc.

## What Was Fixed

### Module Dependency Injection Issues
Fixed all feature modules to properly export RBAC dependencies:
- TransactionsModule
- PaymentsModule
- ContractsModule
- PropertiesModule
- CustomersModule
- LeadsModule
- EmailModule

Each module now explicitly provides:
- `PermissionService`
- `TenantContextService`
- `PermissionGuard`

This ensures the `PermissionGuard` can resolve all its dependencies when used in controllers.

### Module-Tenant Assignment
Created a new script `assign-modules-to-tenants.ts` that:
1. Creates default modules if missing
2. Assigns all modules to all active tenants
3. Verifies the assignment

## How It Works

The RBAC system uses a `tenant_modules` table to control which modules are available to each tenant. When a user makes a request:

1. The `PermissionGuard` checks if the user has the required permission
2. The permission is linked to a module
3. The module must be enabled for the user's tenant
4. If all checks pass, the request is allowed

## Running the Complete Setup

If you're setting up a new tenant, run:
```bash
npm run rbac:complete setup "Tenant Name" "subdomain"
npm run rbac:assign-modules
```

This will:
1. Create the tenant
2. Create roles and permissions
3. Create sample users
4. Assign all modules to the tenant

## Troubleshooting

If endpoints still return 404:

1. **Check if tenant exists:**
   ```bash
   npm run rbac:complete status
   ```

2. **Check if modules are assigned:**
   ```sql
   SELECT t.name, COUNT(tm.id) as module_count
   FROM rbac_tenants t
   LEFT JOIN tenant_modules tm ON t.id = tm.tenant_id
   GROUP BY t.id;
   ```

3. **Check if module is enabled:**
   ```sql
   SELECT * FROM tenant_modules 
   WHERE tenant_id = 'your-tenant-id' 
   AND is_enabled = true;
   ```

4. **Check if user has permission:**
   ```sql
   SELECT * FROM rbac_permissions 
   WHERE entity_type = 'CustomerGroup' 
   AND action = 'Read';
   ```
