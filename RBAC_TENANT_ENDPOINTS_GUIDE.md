# 📚 Tenant RBAC Endpoints Quick Reference

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1️⃣ Modules Endpoints

### Get Enabled Modules
```http
GET /tenant/modules
```

**Response:**
```json
{
  "modules": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Leads",
      "code": "leads",
      "description": "Lead management module",
      "is_enabled": true,
      "permissions": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "action": "Create",
          "description": "Create new leads"
        },
        {
          "id": "660e8400-e29b-41d4-a716-446655440002",
          "action": "Read",
          "description": "View leads"
        },
        {
          "id": "660e8400-e29b-41d4-a716-446655440003",
          "action": "Update",
          "description": "Update leads"
        },
        {
          "id": "660e8400-e29b-41d4-a716-446655440004",
          "action": "Delete",
          "description": "Delete leads"
        }
      ]
    }
  ]
}
```

---

## 2️⃣ Roles Endpoints

### List All Roles
```http
GET /tenant/roles
```

**Response:**
```json
{
  "roles": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Sales Manager",
      "description": "Manages sales team and leads",
      "is_system_role": false,
      "user_count": 5,
      "created_at": "2024-01-27T14:30:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "name": "Sales Representative",
      "description": "Can manage leads and activities",
      "is_system_role": false,
      "user_count": 3,
      "created_at": "2024-01-27T14:35:00Z"
    }
  ]
}
```

### Get Role Details
```http
GET /tenant/roles/{roleId}
```

**Response:**
```json
{
  "role": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Sales Manager",
    "description": "Manages sales team and leads",
    "is_system_role": false,
    "user_count": 5,
    "created_at": "2024-01-27T14:30:00Z"
  },
  "permissions": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "module": "leads",
      "action": "Create",
      "description": "Create new leads"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "module": "leads",
      "action": "Read",
      "description": "View leads"
    }
  ]
}
```

### Create Role
```http
POST /tenant/roles
Content-Type: application/json

{
  "name": "Sales Representative",
  "description": "Can manage leads and activities",
  "permission_ids": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response:** (201 Created)
```json
{
  "role": {
    "id": "770e8400-e29b-41d4-a716-446655440001",
    "name": "Sales Representative",
    "description": "Can manage leads and activities",
    "is_system_role": false,
    "created_at": "2024-01-27T14:35:00Z"
  },
  "permissions": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "module": "leads",
      "action": "Create",
      "description": "Create new leads"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "module": "leads",
      "action": "Read",
      "description": "View leads"
    }
  ]
}
```

### Update Role
```http
PUT /tenant/roles/{roleId}
Content-Type: application/json

{
  "name": "Senior Sales Rep",
  "description": "Updated description",
  "permission_ids": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002",
    "660e8400-e29b-41d4-a716-446655440003"
  ]
}
```

### Delete Role
```http
DELETE /tenant/roles/{roleId}
```

**Response:** (204 No Content)

---

## 3️⃣ Role Permissions Endpoints

### Get Role Permissions
```http
GET /tenant/roles/{roleId}/permissions
```

**Response:**
```json
{
  "role": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Sales Manager"
  },
  "permissions": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "module": "leads",
      "action": "Create",
      "description": "Create new leads"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "module": "leads",
      "action": "Read",
      "description": "View leads"
    }
  ]
}
```

### Assign Permissions to Role
```http
POST /tenant/roles/{roleId}/permissions
Content-Type: application/json

{
  "permission_ids": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002",
    "660e8400-e29b-41d4-a716-446655440003"
  ]
}
```

**Response:** (201 Created)
```json
{
  "permissions": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "module": "leads",
      "action": "Create",
      "description": "Create new leads"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "module": "leads",
      "action": "Read",
      "description": "View leads"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440003",
      "module": "leads",
      "action": "Update",
      "description": "Update leads"
    }
  ]
}
```

### Remove Permission from Role
```http
DELETE /tenant/roles/{roleId}/permissions/{permissionId}
```

**Response:** (204 No Content)

---

## 4️⃣ User Roles & Permissions Endpoints

### Get User Permissions
```http
GET /tenant/users/{userId}/permissions
```

**Response:**
```json
{
  "user": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com"
  },
  "permissions": [
    "leads:create",
    "leads:read",
    "leads:update",
    "customers:read",
    "customers:update"
  ]
}
```

### Get User Roles
```http
GET /tenant/users/{userId}/roles
```

**Response:**
```json
{
  "user": {
    "id": "880e8400-e29b-41d4-a716-446655440000"
  },
  "roles": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Sales Manager",
      "description": "Manages sales team and leads",
      "is_system_role": false,
      "permissions": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "action": "Create",
          "description": "Create new leads"
        },
        {
          "id": "660e8400-e29b-41d4-a716-446655440002",
          "action": "Read",
          "description": "View leads"
        }
      ]
    }
  ]
}
```

### Assign Role to User
```http
POST /tenant/users/{userId}/roles/{roleId}
```

**Response:** (201 Created)
```json
{
  "message": "Role assigned successfully",
  "user_role": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "user_id": "880e8400-e29b-41d4-a716-446655440000",
    "role_id": "770e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "aa0e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Remove Role from User
```http
DELETE /tenant/users/{userId}/roles/{roleId}
```

**Response:** (204 No Content)

---

## 🔍 Common Use Cases

### Create a New Role with Permissions
```bash
# 1. Get available modules and permissions
curl -X GET http://localhost:3000/tenant/modules \
  -H "Authorization: Bearer <token>"

# 2. Create role with selected permissions
curl -X POST http://localhost:3000/tenant/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Rep",
    "description": "Can manage leads",
    "permission_ids": ["<permission-id-1>", "<permission-id-2>"]
  }'
```

### Assign Role to User
```bash
curl -X POST http://localhost:3000/tenant/users/{userId}/roles/{roleId} \
  -H "Authorization: Bearer <token>"
```

### Check User Permissions
```bash
curl -X GET http://localhost:3000/tenant/users/{userId}/permissions \
  -H "Authorization: Bearer <token>"
```

### Update Role Permissions
```bash
# 1. Get current permissions
curl -X GET http://localhost:3000/tenant/roles/{roleId}/permissions \
  -H "Authorization: Bearer <token>"

# 2. Update with new permissions
curl -X PUT http://localhost:3000/tenant/roles/{roleId} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_ids": ["<new-permission-id-1>", "<new-permission-id-2>"]
  }'
```

---

## ⚠️ Important Notes

1. **System Roles**: Cannot be deleted (Admin, Operator, Viewer)
2. **Unique Names**: Role names must be unique within a tenant
3. **Tenant Context**: All operations are scoped to the current tenant
4. **Permission Format**: Permissions are returned as `entity_type:action` (e.g., `leads:create`)
5. **Cascading Deletes**: Deleting a role removes it from all users automatically
6. **Cache Invalidation**: Permission changes are automatically cached and invalidated

---

## 🚀 Integration with UI

### Example React Hook
```typescript
// Get all roles
const { data: roles } = useQuery(['roles'], () =>
  fetch('/tenant/roles', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json())
);

// Create new role
const createRole = useMutation((roleData) =>
  fetch('/tenant/roles', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(roleData)
  }).then(r => r.json())
);

// Assign role to user
const assignRole = useMutation(({ userId, roleId }) =>
  fetch(`/tenant/users/${userId}/roles/${roleId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
);
```
