# 🧪 Ejemplos de Testing - Flujo Completo

## 🔑 Obtener JWT Token

```bash
# Login como admin del tenant
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "christopher.sandoval@test.com",
    "password": "123"
  }'

# Respuesta:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Guardar el token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📦 1. Ver Módulos Habilitados

```bash
# Ver qué módulos tiene habilitados el tenant
curl -X GET http://localhost:3000/tenant/modules \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
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

# Guardar IDs de permisos para usar después
LEADS_CREATE_ID="660e8400-e29b-41d4-a716-446655440001"
LEADS_READ_ID="660e8400-e29b-41d4-a716-446655440002"
LEADS_UPDATE_ID="660e8400-e29b-41d4-a716-446655440003"
LEADS_DELETE_ID="660e8400-e29b-41d4-a716-446655440004"
```

---

## 👥 2. Ver Roles Existentes

```bash
# Listar todos los roles del tenant
curl -X GET http://localhost:3000/tenant/roles \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
{
  "roles": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Admin",
      "description": "Full access to all entities and actions",
      "is_system_role": true,
      "user_count": 1,
      "created_at": "2024-01-27T14:30:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "name": "Operator",
      "description": "Read access to customers and leads, no user management",
      "is_system_role": true,
      "user_count": 0,
      "created_at": "2024-01-27T14:30:00Z"
    }
  ]
}
```

---

## ➕ 3. Crear Nuevo Rol

```bash
# Crear rol "Sales Manager" con permisos de Leads
curl -X POST http://localhost:3000/tenant/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Manager",
    "description": "Can manage leads and activities",
    "permission_ids": [
      "'$LEADS_CREATE_ID'",
      "'$LEADS_READ_ID'",
      "'$LEADS_UPDATE_ID'"
    ]
  }'

# Respuesta esperada:
{
  "role": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "Sales Manager",
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
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440003",
      "module": "leads",
      "action": "Update",
      "description": "Update leads"
    }
  ]
}

# Guardar el ID del rol
SALES_MANAGER_ROLE_ID="880e8400-e29b-41d4-a716-446655440000"
```

---

## ❌ 4. Intentar Crear Rol con Permiso No Habilitado (DEBE FALLAR)

```bash
# Intentar crear rol con permiso de "Reports" (no habilitado)
curl -X POST http://localhost:3000/tenant/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Reporter",
    "description": "Can view reports",
    "permission_ids": [
      "999e8400-e29b-41d4-a716-446655440999"
    ]
  }'

# Respuesta esperada (ERROR):
{
  "statusCode": 404,
  "message": "Permission with ID 999e8400-e29b-41d4-a716-446655440999 not found",
  "error": "Not Found"
}

# O si el permiso existe pero el módulo no está habilitado:
{
  "statusCode": 400,
  "message": "Permission belongs to a module that is not enabled for this tenant",
  "error": "Bad Request"
}
```

---

## 👤 5. Ver Usuarios del Tenant

```bash
# Obtener ID del usuario (Christopher)
# Normalmente lo obtendrías de una lista de usuarios
# Para este ejemplo usamos el ID conocido:
USER_ID="763b6926-fb57-11f0-a52e-06e7ea787385"

# Ver roles del usuario
curl -X GET http://localhost:3000/tenant/users/$USER_ID/roles \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
{
  "user": {
    "id": "763b6926-fb57-11f0-a52e-06e7ea787385"
  },
  "roles": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Admin",
      "description": "Full access to all entities and actions",
      "is_system_role": true,
      "permissions": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "action": "Create",
          "description": "Create new leads"
        },
        ...
      ]
    }
  ]
}
```

---

## 🔗 6. Asignar Rol a Usuario

```bash
# Asignar rol "Sales Manager" a usuario Rodolfo
RODOLFO_ID="763b6ebe-fb57-11f0-a52e-06e7ea787385"

curl -X POST http://localhost:3000/tenant/users/$RODOLFO_ID/roles/$SALES_MANAGER_ROLE_ID \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
{
  "message": "Role assigned successfully",
  "user_role": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "user_id": "763b6ebe-fb57-11f0-a52e-06e7ea787385",
    "role_id": "880e8400-e29b-41d4-a716-446655440000",
    "tenant_id": "54481b63-5516-458d-9bb3-d4e5cb028864"
  }
}
```

---

## 🔐 7. Ver Permisos del Usuario

```bash
# Ver todos los permisos que tiene Rodolfo
curl -X GET http://localhost:3000/tenant/users/$RODOLFO_ID/permissions \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
{
  "user": {
    "id": "763b6ebe-fb57-11f0-a52e-06e7ea787385",
    "email": "rodolfo.rodriguez@test.com"
  },
  "permissions": [
    "leads:create",
    "leads:read",
    "leads:update"
  ]
}
```

---

## 📝 8. Actualizar Rol (Cambiar Permisos)

```bash
# Actualizar rol "Sales Manager" para agregar permiso de Delete
curl -X PUT http://localhost:3000/tenant/roles/$SALES_MANAGER_ROLE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Sales Manager",
    "description": "Can manage leads with full access",
    "permission_ids": [
      "'$LEADS_CREATE_ID'",
      "'$LEADS_READ_ID'",
      "'$LEADS_UPDATE_ID'",
      "'$LEADS_DELETE_ID'"
    ]
  }'

# Respuesta esperada:
{
  "role": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "Senior Sales Manager",
    "description": "Can manage leads with full access",
    "is_system_role": false,
    "created_at": "2024-01-27T14:35:00Z"
  },
  "permissions": [
    { "id": "...", "module": "leads", "action": "Create" },
    { "id": "...", "module": "leads", "action": "Read" },
    { "id": "...", "module": "leads", "action": "Update" },
    { "id": "...", "module": "leads", "action": "Delete" }
  ]
}

# Rodolfo ahora tiene permisos adicionales:
# leads:create, leads:read, leads:update, leads:delete
```

---

## 🗑️ 9. Remover Rol de Usuario

```bash
# Remover rol "Sales Manager" de Rodolfo
curl -X DELETE http://localhost:3000/tenant/users/$RODOLFO_ID/roles/$SALES_MANAGER_ROLE_ID \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
# 204 No Content

# Verificar que se removió:
curl -X GET http://localhost:3000/tenant/users/$RODOLFO_ID/permissions \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada (sin permisos):
{
  "user": {
    "id": "763b6ebe-fb57-11f0-a52e-06e7ea787385",
    "email": "rodolfo.rodriguez@test.com"
  },
  "permissions": []
}
```

---

## 🗑️ 10. Eliminar Rol

```bash
# Eliminar rol "Sales Manager"
curl -X DELETE http://localhost:3000/tenant/roles/$SALES_MANAGER_ROLE_ID \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
# 204 No Content

# Verificar que se eliminó:
curl -X GET http://localhost:3000/tenant/roles \
  -H "Authorization: Bearer $TOKEN"

# El rol no debe aparecer en la lista
```

---

## 🔄 Script Completo de Testing

```bash
#!/bin/bash

# Variables
TOKEN="tu-jwt-token-aqui"
LEADS_CREATE_ID="660e8400-e29b-41d4-a716-446655440001"
LEADS_READ_ID="660e8400-e29b-41d4-a716-446655440002"
LEADS_UPDATE_ID="660e8400-e29b-41d4-a716-446655440003"
LEADS_DELETE_ID="660e8400-e29b-41d4-a716-446655440004"
RODOLFO_ID="763b6ebe-fb57-11f0-a52e-06e7ea787385"

echo "1. Ver módulos habilitados..."
curl -X GET http://localhost:3000/tenant/modules \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n2. Ver roles existentes..."
curl -X GET http://localhost:3000/tenant/roles \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n3. Crear rol 'Sales Manager'..."
ROLE_RESPONSE=$(curl -s -X POST http://localhost:3000/tenant/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Manager",
    "description": "Can manage leads",
    "permission_ids": [
      "'$LEADS_CREATE_ID'",
      "'$LEADS_READ_ID'",
      "'$LEADS_UPDATE_ID'"
    ]
  }')

SALES_MANAGER_ROLE_ID=$(echo $ROLE_RESPONSE | jq -r '.role.id')
echo "Rol creado con ID: $SALES_MANAGER_ROLE_ID"

echo -e "\n4. Asignar rol a Rodolfo..."
curl -X POST http://localhost:3000/tenant/users/$RODOLFO_ID/roles/$SALES_MANAGER_ROLE_ID \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n5. Ver permisos de Rodolfo..."
curl -X GET http://localhost:3000/tenant/users/$RODOLFO_ID/permissions \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n✅ Testing completado!"
```

---

## 📊 Checklist de Validaciones

- [ ] Ver módulos habilitados (solo ve Leads y Customers)
- [ ] Crear rol con permisos válidos (éxito)
- [ ] Intentar crear rol con permiso no habilitado (falla)
- [ ] Asignar rol a usuario (éxito)
- [ ] Ver permisos del usuario (muestra permisos correctos)
- [ ] Actualizar rol (agrega/quita permisos)
- [ ] Remover rol de usuario (usuario pierde permisos)
- [ ] Eliminar rol (no aparece en lista)

---

## 🐛 Troubleshooting

### Error: "Permission belongs to a module that is not enabled for this tenant"
**Causa:** Intentaste asignar un permiso de un módulo no habilitado
**Solución:** Verifica que el módulo esté habilitado en `GET /tenant/modules`

### Error: "Role with name already exists in this tenant"
**Causa:** Ya existe un rol con ese nombre
**Solución:** Usa otro nombre o elimina el rol anterior

### Error: "User already has role in this tenant"
**Causa:** El usuario ya tiene asignado ese rol
**Solución:** Verifica con `GET /tenant/users/{userId}/roles`

### Error: "System roles cannot be deleted"
**Causa:** Intentaste eliminar un rol del sistema (Admin, Operator, Viewer)
**Solución:** Solo puedes eliminar roles personalizados
