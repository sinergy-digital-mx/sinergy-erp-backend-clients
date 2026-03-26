-- ============================================
-- ADD VIEW_MENU PERMISSION TO ALL MODULES
-- ============================================
-- This script adds a "View_Menu" permission to all existing modules
-- This permission controls sidebar visibility for each module

-- 1. ENSURE ALL MODULES HAVE ENTITY REGISTRY ENTRIES
-- First, create missing entity registry entries for modules that don't have them

INSERT INTO entity_registry (code, name)
SELECT 
    m.code,
    CONCAT(m.name, ' Management') as name
FROM modules m
WHERE NOT EXISTS (
    SELECT 1 
    FROM entity_registry er 
    WHERE er.code = m.code
);

-- 2. ADD VER_MENU PERMISSION FOR EACH MODULE
-- This will add the permission for all existing modules dynamically

INSERT INTO rbac_permissions (id, module_id, entity_registry_id, action, description, is_system_permission, created_at, updated_at)
SELECT 
    UUID() as id,
    m.id as module_id,
    er.id as entity_registry_id,
    'Ver_Menu' as action,
    CONCAT('Ver menú de ', m.name, ' en el sidebar') as description,
    true as is_system_permission,
    NOW() as created_at,
    NOW() as updated_at
FROM modules m
INNER JOIN entity_registry er ON er.code = m.code
WHERE NOT EXISTS (
    SELECT 1 
    FROM rbac_permissions p 
    WHERE p.module_id = m.id 
    AND p.action = 'Ver_Menu'
);

-- 3. ASSIGN VER_MENU PERMISSION TO ALL ADMIN ROLES
-- This ensures all Admin roles automatically get the Ver_Menu permission for all modules

INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    r.id as role_id,
    p.id as permission_id,
    NOW() as created_at
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.is_admin = true
AND p.action = 'Ver_Menu'
AND NOT EXISTS (
    SELECT 1 
    FROM rbac_role_permissions rp 
    WHERE rp.role_id = r.id 
    AND rp.permission_id = p.id
);

-- ============================================
-- VERIFY
-- ============================================

-- Check Ver_Menu permissions created
SELECT 
    m.name as module_name,
    m.code as module_code,
    p.action,
    p.description,
    er.code as entity_type
FROM rbac_permissions p
JOIN modules m ON p.module_id = m.id
LEFT JOIN entity_registry er ON p.entity_registry_id = er.id
WHERE p.action = 'Ver_Menu'
ORDER BY m.name;

-- Check Admin roles with Ver_Menu permissions
SELECT 
    r.name as role_name,
    t.name as tenant_name,
    COUNT(p.id) as ver_menu_permissions_count
FROM rbac_roles r
JOIN rbac_tenants t ON r.tenant_id = t.id
LEFT JOIN rbac_role_permissions rp ON rp.role_id = r.id
LEFT JOIN rbac_permissions p ON p.id = rp.permission_id AND p.action = 'Ver_Menu'
WHERE r.is_admin = true
GROUP BY r.id, r.name, t.name
ORDER BY t.name, r.name;

-- Check all Ver_Menu permissions by module
SELECT 
    m.name as module_name,
    COUNT(DISTINCT rp.role_id) as roles_with_permission
FROM modules m
LEFT JOIN rbac_permissions p ON p.module_id = m.id AND p.action = 'Ver_Menu'
LEFT JOIN rbac_role_permissions rp ON rp.permission_id = p.id
GROUP BY m.id, m.name
ORDER BY m.name;
