# Guía de Configuración de Módulos - Purchase Orders

## Resumen del Proceso

Este documento describe el proceso completo para crear un nuevo módulo en el sistema, usando **Purchase Orders** como referencia.

## 1. Crear el Módulo en RBAC

```sql
INSERT INTO modules (id, name, code, description, created_at)
VALUES (
  UUID(),
  'Nombre del Módulo',
  'module_code',
  'Descripción del módulo',
  CURRENT_TIMESTAMP
);
```

**Ejemplo - Purchase Orders:**
```sql
INSERT INTO modules (id, name, code, description, created_at)
VALUES (
  UUID(),
  'Órdenes de Compra',
  'purchase_orders',
  'Sistema de gestión de órdenes de compra',
  CURRENT_TIMESTAMP
);
```

## 2. Crear Permisos del Módulo

Los permisos estándar para un módulo son:

- **Ver menú** - Permite ver el módulo en el menú
- **Crear** - Crear nuevos registros
- **Leer** - Ver registros
- **Actualizar** - Editar registros
- **Eliminar** - Cancelar/eliminar registros
- **Acciones específicas** - Permisos adicionales según el módulo

```sql
INSERT INTO rbac_permissions (id, entity_registry_id, action, description, is_system_permission, module_id, created_at, updated_at)
VALUES
  (UUID(), 1, 'Ver menú [nombre]', 'Permite ver el módulo en el menú', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Crear [nombre]', 'Crear nuevos registros', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Leer [nombre]', 'Ver registros', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Actualizar [nombre]', 'Editar registros', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Eliminar [nombre]', 'Cancelar/eliminar registros', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

**Ejemplo - Purchase Orders:**
```sql
SET @module_id = (SELECT id FROM modules WHERE code = 'purchase_orders' LIMIT 1);

INSERT INTO rbac_permissions (id, entity_registry_id, action, description, is_system_permission, module_id, created_at, updated_at)
VALUES
  (UUID(), 1, 'Ver menú órdenes de compra', 'Permite ver el módulo en el menú', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Crear órdenes de compra', 'Crear nuevas órdenes de compra', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Leer órdenes de compra', 'Ver órdenes de compra', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Actualizar órdenes de compra', 'Editar órdenes de compra', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Eliminar órdenes de compra', 'Cancelar órdenes de compra', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Recibir órdenes de compra', 'Recibir y procesar órdenes de compra', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (UUID(), 1, 'Ver productos de proveedor', 'Ver productos disponibles de proveedores', 0, @module_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

## 3. Asignar Módulo al Tenant

Asignar el módulo al tenant para que aparezca en el menú:

```sql
INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
VALUES (
  UUID(),
  '[TENANT_ID]',
  (SELECT id FROM modules WHERE code = '[MODULE_CODE]' LIMIT 1),
  1,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE is_enabled = 1;
```

**Ejemplo - Purchase Orders:**
```sql
INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at)
VALUES (
  UUID(),
  'afff1757-dbcf-4715-a756-6b22bb2c59d5',
  (SELECT id FROM modules WHERE code = 'purchase_orders' LIMIT 1),
  1,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE is_enabled = 1;
```

## 4. Asignar Permisos a Roles

Asignar todos los permisos del módulo al rol Admin del tenant:

```sql
INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
SELECT 
  UUID(),
  (SELECT id FROM rbac_roles WHERE tenant_id = '[TENANT_ID]' AND is_admin = 1 LIMIT 1),
  rp.id,
  CURRENT_TIMESTAMP
FROM rbac_permissions rp
WHERE rp.module_id = (SELECT id FROM modules WHERE code = '[MODULE_CODE]' LIMIT 1)
AND NOT EXISTS (
  SELECT 1 FROM rbac_role_permissions rrp 
  WHERE rrp.role_id = (SELECT id FROM rbac_roles WHERE tenant_id = '[TENANT_ID]' AND is_admin = 1 LIMIT 1)
  AND rrp.permission_id = rp.id
);
```

**Ejemplo - Purchase Orders:**
```sql
INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
SELECT 
  UUID(),
  (SELECT id FROM rbac_roles WHERE tenant_id = 'afff1757-dbcf-4715-a756-6b22bb2c59d5' AND is_admin = 1 LIMIT 1),
  rp.id,
  CURRENT_TIMESTAMP
FROM rbac_permissions rp
WHERE rp.module_id = (SELECT id FROM modules WHERE code = 'purchase_orders' LIMIT 1)
AND NOT EXISTS (
  SELECT 1 FROM rbac_role_permissions rrp 
  WHERE rrp.role_id = (SELECT id FROM rbac_roles WHERE tenant_id = 'afff1757-dbcf-4715-a756-6b22bb2c59d5' AND is_admin = 1 LIMIT 1)
  AND rrp.permission_id = rp.id
);
```

## 4. Verificar Permisos Creados

```sql
SELECT rp.id, rp.action, rp.description 
FROM rbac_permissions rp
WHERE rp.module_id = (SELECT id FROM modules WHERE code = '[MODULE_CODE]' LIMIT 1);
```

## Notas Importantes

- Siempre usar `is_admin = 1` para identificar el rol Admin
- Los permisos deben estar en español
- El `entity_registry_id` es siempre 1 (entidad genérica)
- Usar `NOT EXISTS` para evitar duplicados al asignar permisos
- El permiso "Ver menú" es obligatorio para que el módulo aparezca en el menú
- **CRÍTICO**: El módulo DEBE estar asignado en `tenant_modules` con `is_enabled = 1`, de lo contrario los usuarios no podrán acceder aunque tengan permisos

## Validación de Seguridad

El sistema valida automáticamente que:
1. El usuario tenga el permiso requerido
2. El módulo esté habilitado para el tenant del usuario (`tenant_modules.is_enabled = 1`)

Si alguna validación falla, se retorna `403 Forbidden`.

## Auditoría de Permisos Huérfanos

Para encontrar usuarios con permisos a módulos no habilitados:

```sql
SELECT 
  u.id as user_id,
  u.email,
  r.tenant_id,
  m.code as module_code,
  m.name as module_name,
  rp.action as permission_action,
  CASE WHEN tm.id IS NULL THEN 'ORPHANED' ELSE 'OK' END as status
FROM rbac_user_roles ur
JOIN rbac_roles r ON ur.role_id = r.id
JOIN rbac_role_permissions rrp ON r.id = rrp.role_id
JOIN rbac_permissions rp ON rrp.permission_id = rp.id
JOIN modules m ON rp.module_id = m.id
JOIN users u ON ur.user_id = u.id
LEFT JOIN tenant_modules tm ON m.id = tm.module_id AND r.tenant_id = tm.tenant_id
WHERE tm.id IS NULL AND rp.module_id IS NOT NULL;
```
