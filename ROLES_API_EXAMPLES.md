# Roles API Examples - With Permission Counts

## 📊 New Endpoint: Roles Summary

### GET `/tenant/roles/summary/counts`

Returns a summary of all roles with permission and user counts.

**Response:**
```json
{
  "summary": {
    "total_roles": 11,
    "roles_with_permissions": 2,
    "roles_without_permissions": 9,
    "total_permission_assignments": 58
  },
  "roles": [
    {
      "id": "257bce95-75ee-4fcc-b941-b3d995ed4cb7",
      "name": "Admin",
      "permission_count": 56,
      "user_count": 3,
      "is_system_role": false
    },
    {
      "id": "0b964fb8-f8fd-4dca-a7ba-c2291efac416",
      "name": "Sales Representative",
      "permission_count": 2,
      "user_count": 1,
      "is_system_role": false
    },
    {
      "id": "282d224a-26f2-42ac-8f91-07858eb66902",
      "name": "Customer Support",
      "permission_count": 0,
      "user_count": 0,
      "is_system_role": false
    },
    {
      "id": "c19b4a60-efd6-4826-b3f1-3c01def414d0",
      "name": "Data Analyst",
      "permission_count": 0,
      "user_count": 0,
      "is_system_role": false
    }
  ]
}
```

## 📋 Updated Endpoint: All Roles

### GET `/tenant/roles`

Now includes `permission_count` in each role.

**Response:**
```json
{
  "roles": [
    {
      "id": "257bce95-75ee-4fcc-b941-b3d995ed4cb7",
      "name": "Admin",
      "description": "Administrator role with full access",
      "is_system_role": false,
      "user_count": 3,
      "permission_count": 56,
      "created_at": "2024-01-27T14:30:00Z",
      "updated_at": "2024-01-27T14:30:00Z"
    },
    {
      "id": "0b964fb8-f8fd-4dca-a7ba-c2291efac416",
      "name": "Sales Representative",
      "description": "Sales team member",
      "is_system_role": false,
      "user_count": 1,
      "permission_count": 2,
      "created_at": "2024-01-27T14:30:00Z",
      "updated_at": "2024-01-27T14:30:00Z"
    },
    {
      "id": "282d224a-26f2-42ac-8f91-07858eb66902",
      "name": "Customer Support",
      "description": "Customer support team",
      "is_system_role": false,
      "user_count": 0,
      "permission_count": 0,
      "created_at": "2024-01-27T14:30:00Z",
      "updated_at": "2024-01-27T14:30:00Z"
    }
  ]
}
```

## 🔍 Updated Endpoint: Single Role

### GET `/tenant/roles/:roleId`

Now includes `permission_count` in the role object.

**Response:**
```json
{
  "role": {
    "id": "257bce95-75ee-4fcc-b941-b3d995ed4cb7",
    "name": "Admin",
    "description": "Administrator role with full access",
    "is_system_role": false,
    "user_count": 3,
    "permission_count": 56,
    "created_at": "2024-01-27T14:30:00Z",
    "updated_at": "2024-01-27T14:30:00Z"
  },
  "permissions": [
    {
      "id": "perm-1",
      "module": "User",
      "action": "Create",
      "description": "Create new users"
    },
    {
      "id": "perm-2",
      "module": "User",
      "action": "Read",
      "description": "View users"
    },
    {
      "id": "perm-3",
      "module": "Lead",
      "action": "Create",
      "description": "Create new leads"
    }
  ]
}
```

## 🧪 Testing the Endpoints

### Using cURL

#### 1. Get Roles Summary
```bash
curl -X GET "http://localhost:3000/tenant/roles/summary/counts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: 54481b63-5516-458d-9bb3-d4e5cb028864" \
  -H "Content-Type: application/json"
```

#### 2. Get All Roles
```bash
curl -X GET "http://localhost:3000/tenant/roles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: 54481b63-5516-458d-9bb3-d4e5cb028864" \
  -H "Content-Type: application/json"
```

#### 3. Get Specific Role
```bash
curl -X GET "http://localhost:3000/tenant/roles/257bce95-75ee-4fcc-b941-b3d995ed4cb7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: 54481b63-5516-458d-9bb3-d4e5cb028864" \
  -H "Content-Type: application/json"
```

### Using JavaScript/Axios

```javascript
const axios = require('axios');

const headers = {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'x-tenant-id': '54481b63-5516-458d-9bb3-d4e5cb028864',
  'Content-Type': 'application/json'
};

// Get roles summary
const summary = await axios.get('http://localhost:3000/tenant/roles/summary/counts', { headers });
console.log('Summary:', summary.data);

// Get all roles
const roles = await axios.get('http://localhost:3000/tenant/roles', { headers });
console.log('Roles:', roles.data);

// Get specific role
const roleId = '257bce95-75ee-4fcc-b941-b3d995ed4cb7';
const role = await axios.get(`http://localhost:3000/tenant/roles/${roleId}`, { headers });
console.log('Role details:', role.data);
```

## 📊 Frontend Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RolesManagement = () => {
  const [rolesSummary, setRolesSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRolesSummary();
  }, []);

  const fetchRolesSummary = async () => {
    try {
      const response = await axios.get('/tenant/roles/summary/counts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-tenant-id': localStorage.getItem('tenantId')
        }
      });
      setRolesSummary(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="roles-management">
      <h2>Roles & Permissions Management</h2>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Roles</h3>
          <p>{rolesSummary.summary.total_roles}</p>
        </div>
        <div className="card">
          <h3>Roles with Permissions</h3>
          <p>{rolesSummary.summary.roles_with_permissions}</p>
        </div>
        <div className="card">
          <h3>Roles without Permissions</h3>
          <p>{rolesSummary.summary.roles_without_permissions}</p>
        </div>
        <div className="card">
          <h3>Total Permission Assignments</h3>
          <p>{rolesSummary.summary.total_permission_assignments}</p>
        </div>
      </div>

      {/* Roles List */}
      <div className="roles-list">
        <h3>Roles</h3>
        {rolesSummary.roles.map(role => (
          <div key={role.id} className="role-item">
            <div className="role-info">
              <h4>{role.name}</h4>
              <p>{role.permission_count} permissions</p>
              <p>{role.user_count} users</p>
            </div>
            <div className="role-actions">
              <button onClick={() => editRole(role.id)}>Edit</button>
              <button onClick={() => viewPermissions(role.id)}>View Permissions</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RolesManagement;
```

### Vue.js Component Example

```vue
<template>
  <div class="roles-management">
    <h2>Roles & Permissions Management</h2>
    
    <!-- Summary -->
    <div v-if="summary" class="summary">
      <div class="stat-card">
        <h3>{{ summary.total_roles }}</h3>
        <p>Total Roles</p>
      </div>
      <div class="stat-card">
        <h3>{{ summary.roles_with_permissions }}</h3>
        <p>With Permissions</p>
      </div>
      <div class="stat-card">
        <h3>{{ summary.roles_without_permissions }}</h3>
        <p>Without Permissions</p>
      </div>
    </div>

    <!-- Roles Table -->
    <table v-if="roles.length" class="roles-table">
      <thead>
        <tr>
          <th>Role Name</th>
          <th>Permissions</th>
          <th>Users</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="role in roles" :key="role.id">
          <td>{{ role.name }}</td>
          <td>{{ role.permission_count }}</td>
          <td>{{ role.user_count }}</td>
          <td>
            <button @click="editRole(role.id)">Edit</button>
            <button @click="viewPermissions(role.id)">Permissions</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RolesManagement',
  data() {
    return {
      roles: [],
      summary: null,
      loading: true
    };
  },
  async mounted() {
    await this.fetchRolesSummary();
  },
  methods: {
    async fetchRolesSummary() {
      try {
        const response = await axios.get('/tenant/roles/summary/counts');
        this.summary = response.data.summary;
        this.roles = response.data.roles;
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        this.loading = false;
      }
    },
    editRole(roleId) {
      this.$router.push(`/roles/${roleId}/edit`);
    },
    viewPermissions(roleId) {
      this.$router.push(`/roles/${roleId}/permissions`);
    }
  }
};
</script>
```

## 🔧 Error Handling

All endpoints return standard error responses:

```json
{
  "statusCode": 400,
  "message": "Tenant context is required",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 404,
  "message": "Role not found",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

## 📝 Notes

1. **Authentication Required**: All endpoints require a valid JWT token
2. **Tenant Context**: All endpoints require the `x-tenant-id` header
3. **Permissions**: User must have appropriate permissions to access role data
4. **Performance**: The summary endpoint is optimized for dashboard views
5. **Sorting**: Roles in summary are sorted by permission count (descending)

## 🚀 Next Steps

1. Test the endpoints using the provided test script
2. Integrate with your frontend application
3. Add error handling and loading states
4. Consider caching for better performance
5. Add pagination for large role lists