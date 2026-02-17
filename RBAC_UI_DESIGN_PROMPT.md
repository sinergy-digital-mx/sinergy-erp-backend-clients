# RBAC Tenant UI Design Prompt

## Backend Architecture Overview

### Data Structure

**Modules** (System-wide, Admin-defined)
- Leads, Customers, Activities
- Each module has granular permissions

**Permissions** (System-wide, per module)
- Read, Create, Edit, Delete, Download, Export
- Example: "Read Leads", "Download Customers", "Export Activities"

**Roles** (Tenant-specific)
- Created by tenant admins
- Composed of multiple permissions from enabled modules
- Example: "Sales Manager" role = [Read Leads, Create Leads, Edit Leads, Download Leads, Export Leads]

**Users** (Tenant-specific)
- Belong to a tenant
- Assigned one or more roles
- Inherit all permissions from their assigned roles

### API Endpoints

#### Modules & Permissions
```
GET /tenant/modules
Response: {
  modules: [
    {
      id: "uuid",
      name: "Leads",
      code: "leads",
      permissions: [
        { id: "uuid", action: "Read", description: "View leads" },
        { id: "uuid", action: "Create", description: "Create new leads" },
        { id: "uuid", action: "Edit", description: "Edit leads" },
        { id: "uuid", action: "Delete", description: "Delete leads" },
        { id: "uuid", action: "Download", description: "Download leads" },
        { id: "uuid", action: "Export", description: "Export leads" }
      ]
    },
    { ... Customers module ... },
    { ... Activities module ... }
  ]
}
```

#### Roles Management
```
GET /tenant/roles
Response: { roles: [{ id, name, description, permissions: [...] }] }

POST /tenant/roles
Body: { name, description, permissions: [permission_ids] }

PUT /tenant/roles/:roleId
Body: { name, description, permissions: [permission_ids] }

DELETE /tenant/roles/:roleId
```

#### Users Management
```
GET /tenant/users
Response: { users: [{ id, email, status }] }

GET /tenant/users/:userId/roles
Response: { user: { id }, roles: [{ id, name, permissions: [...] }] }

POST /tenant/users/:userId/roles/:roleId
(Assign role to user)

PUT /tenant/users/:userId/roles/:roleId
Body: { new_role_id }
(Replace user's role)
```

---

## Recommended UI Structure

### View 1: Users Management

**Purpose:** Manage tenant users and their role assignments

**Layout:**
- **Left Panel:** Users List
  - Search/filter by email
  - Status indicator (Active/Inactive)
  - Click to select user

- **Right Panel:** User Details & Role Assignment
  - User info: email, status, created date
  - Current roles assigned (with badges)
  - "Assign Role" button → opens role selector modal
  - "Change Role" button → opens role replacement modal
  - "View Permissions" → shows all inherited permissions from roles

**Actions:**
- Search users by email
- View user's current roles
- View user's inherited permissions
- Assign new role to user
- Replace user's role with another
- Filter by status

---

### View 2: Roles & Permissions Management

**Purpose:** Create, edit, and manage roles with granular permissions

**Layout:**
- **Left Panel:** Roles List
  - List all tenant roles
  - Search/filter by role name
  - "Create New Role" button
  - Click to select role

- **Right Panel:** Role Details & Permission Assignment
  - Role name & description (editable)
  - **Modules Section** (accordion/tabs for each module)
    - Each module shows its available permissions as checkboxes
    - Example:
      ```
      📦 Leads Module
        ☑ Read Leads
        ☑ Create Leads
        ☐ Edit Leads
        ☑ Delete Leads
        ☑ Download Leads
        ☑ Export Leads
      
      📦 Customers Module
        ☑ Read Customers
        ☑ Create Customers
        ☐ Edit Customers
        ...
      ```
  - "Save Changes" button
  - "Delete Role" button (with confirmation)

**Actions:**
- Create new role
- Edit role name/description
- Add/remove permissions per module
- View which users have this role
- Delete role (with warning if users assigned)
- Save changes atomically

---

## User Flow Examples

### Scenario 1: Assign Role to New User
1. Go to Users view
2. Search for user by email
3. Click user to select
4. Click "Assign Role"
5. Select role from dropdown (shows role name + permission count)
6. Confirm assignment
7. User now has that role's permissions

### Scenario 2: Create New Role
1. Go to Roles view
2. Click "Create New Role"
3. Enter role name (e.g., "Support Agent")
4. Enter description
5. Expand each module accordion
6. Check permissions needed:
   - Leads: Read, Create, Edit
   - Customers: Read, Edit
   - Activities: Read, Create
7. Click "Save"
8. Role is created and ready to assign to users

### Scenario 3: Modify Existing Role
1. Go to Roles view
2. Click role to select
3. Modify permissions (check/uncheck)
4. Click "Save Changes"
5. All users with this role immediately get updated permissions

---

## Key Design Principles

1. **Module-Centric Permission Selection**
   - Permissions grouped by module (not flat list)
   - Users see which module each permission belongs to
   - Easier to understand scope of permissions

2. **Clear Visual Hierarchy**
   - Modules as collapsible sections
   - Permissions as checkboxes within modules
   - Shows permission count per module

3. **Atomic Operations**
   - Role changes apply to all assigned users immediately
   - No partial states

4. **Safety**
   - Role replacement instead of deletion (safer)
   - Confirmation dialogs for destructive actions
   - Show user count before deleting role

5. **Discoverability**
   - Show which users have each role
   - Show permission count in role list
   - Search/filter capabilities

---

## Technical Requirements for UI

### State Management
- Current tenant context
- Selected user/role
- Module list with permissions
- Users list
- Roles list

### API Integration
- Fetch modules on load
- Fetch users list
- Fetch roles list
- Create/update/delete roles
- Assign/replace user roles

### Real-time Updates
- After role change, update user's permission display
- After user role assignment, update user's role display

---

## Suggested Tech Stack
- React/Vue/Angular for UI framework
- TailwindCSS or Material-UI for styling
- React Query/SWR for API data fetching
- Zustand/Pinia for state management
