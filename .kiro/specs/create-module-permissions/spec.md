# Create Module Permissions Spec

This spec is a reusable template for creating standard RBAC permissions for any module in Sinergy ERP.

## Overview

This spec automates the creation of:
1. Module entity in the database
2. Standard permissions (read, read, delete)
3. Entity registry entry
4. Tenant-module associations

## Parameters

- **Module Name**: The display name of the module (e.g., "Inventory Management", "Sales Orders")
- **Module Code**: The kebab-case code (e.g., "inventory", "sales-orders")
- **Entity Code**: The entity registry code (e.g., "inventory", "sales_orders")
- **Tenant ID**: (Optional) Specific tenant to assign the module to. If not provided, enables for all tenants.

## Standard Actions

Each module gets these standard permissions:
- `read` - View/read access to the module
- `read` - Create and update access
- `delete` - Delete access

## Tasks

### Task 1: Validate Inputs
- Verify module code is unique
- Verify entity code is unique
- Verify tenant exists (if provided)

### Task 2: Create Entity Registry
- Create or get entity registry entry with the provided entity code
- Set name to module name

### Task 3: Create Module
- Create module with provided name and code
- Set description based on module name

### Task 4: Create Permissions
- Create read permission
- Create read permission
- Create delete permission

### Task 5: Assign to Tenant(s)
- If tenant ID provided: assign only to that tenant
- If no tenant ID: assign to all active tenants

### Task 6: Verify and Report
- List all created permissions
- Show tenant assignments
- Provide next steps for role assignment

## Usage Example

```
User: "Create permissions for 'pos' module"
Agent: "I'll create permissions for the POS module. What's the tenant ID you want to assign it to? (or leave blank for all tenants)"
User: "afff1757-dbcf-4715-a756-6b22bb2c59d5"
Agent: Creates module, permissions, and assigns to tenant
```

## Notes

- This spec is idempotent - running it multiple times won't create duplicates
- Permissions follow the pattern: `{entity_code}:{action}`
- Module codes should be unique across the system
- Entity codes should match the entity registry
