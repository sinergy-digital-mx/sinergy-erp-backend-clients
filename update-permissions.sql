-- Script para actualizar permisos de Activity a Lead:Activity:*

-- Crear los nuevos permisos Lead:Activity:*
INSERT INTO rbac_permissions (id, entity_type, action, description, is_system_permission) VALUES
(UUID(), 'Lead', 'Activity:Create', 'Create activities for leads', false),
(UUID(), 'Lead', 'Activity:Read', 'Read activities for leads', false),
(UUID(), 'Lead', 'Activity:Update', 'Update activities for leads', false),
(UUID(), 'Lead', 'Activity:Delete', 'Delete activities for leads', false),
(UUID(), 'Lead', 'Activity:Export', 'Export activities for leads', false),
(UUID(), 'Lead', 'Activity:View_All', 'View all activities for leads', false);

-- Actualizar las asignaciones de roles para usar los nuevos permisos
-- Sales Manager: todos los permisos de Lead:Activity
INSERT INTO rbac_role_permissions (id, role_id, permission_id)
SELECT UUID(), r.id, p.id 
FROM rbac_roles r 
CROSS JOIN rbac_permissions p 
WHERE r.name = 'Sales Manager' 
  AND r.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
  AND p.entity_type = 'Lead' 
  AND p.action LIKE 'Activity:%'
  AND NOT EXISTS (
    SELECT 1 FROM rbac_role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Sales Representative: permisos básicos de Lead:Activity
INSERT INTO rbac_role_permissions (id, role_id, permission_id)
SELECT UUID(), r.id, p.id 
FROM rbac_roles r 
CROSS JOIN rbac_permissions p 
WHERE r.name = 'Sales Representative' 
  AND r.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
  AND p.entity_type = 'Lead' 
  AND p.action IN ('Activity:Create', 'Activity:Read', 'Activity:Update', 'Activity:Delete')
  AND NOT EXISTS (
    SELECT 1 FROM rbac_role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Customer Support: permisos básicos de Lead:Activity
INSERT INTO rbac_role_permissions (id, role_id, permission_id)
SELECT UUID(), r.id, p.id 
FROM rbac_roles r 
CROSS JOIN rbac_permissions p 
WHERE r.name = 'Customer Support' 
  AND r.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
  AND p.entity_type = 'Lead' 
  AND p.action IN ('Activity:Create', 'Activity:Read', 'Activity:Update')
  AND NOT EXISTS (
    SELECT 1 FROM rbac_role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Eliminar los permisos antiguos de Activity después de confirmar que todo funciona
-- DELETE FROM rbac_role_permissions WHERE permission_id IN (
--   SELECT id FROM rbac_permissions WHERE entity_type = 'Activity'
-- );
-- DELETE FROM rbac_permissions WHERE entity_type = 'Activity';