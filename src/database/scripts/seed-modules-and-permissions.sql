-- ============================================
-- SEED MODULES AND PERMISSIONS
-- ============================================

-- 1. INSERT MODULES
INSERT INTO modules (id, name, code, description, created_at) VALUES
(UUID(), 'Leads', 'leads', 'Lead management module', NOW()),
(UUID(), 'Customers', 'customers', 'Customer management module', NOW()),
(UUID(), 'Activities', 'activities', 'Activity tracking module', NOW()),
(UUID(), 'Reports', 'reports', 'Reporting and analytics module', NOW());

-- Get the module IDs (you'll need to run this separately to get the IDs)
-- SELECT id, code FROM modules WHERE code IN ('leads', 'customers', 'activities', 'reports');

-- 2. INSERT PERMISSIONS FOR EACH MODULE
-- Replace the module_id values with the actual IDs from the query above

-- For Leads module
INSERT INTO rbac_permissions (id, module_id, entity_type, action, description, is_system_permission, created_at, updated_at) VALUES
(UUID(), (SELECT id FROM modules WHERE code = 'leads'), 'leads', 'Create', 'Create new leads', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'leads'), 'leads', 'Read', 'View leads', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'leads'), 'leads', 'Update', 'Update leads', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'leads'), 'leads', 'Delete', 'Delete leads', true, NOW(), NOW());

-- For Customers module
INSERT INTO rbac_permissions (id, module_id, entity_type, action, description, is_system_permission, created_at, updated_at) VALUES
(UUID(), (SELECT id FROM modules WHERE code = 'customers'), 'customers', 'Create', 'Create new customers', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'customers'), 'customers', 'Read', 'View customers', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'customers'), 'customers', 'Update', 'Update customers', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'customers'), 'customers', 'Delete', 'Delete customers', true, NOW(), NOW());

-- For Activities module
INSERT INTO rbac_permissions (id, module_id, entity_type, action, description, is_system_permission, created_at, updated_at) VALUES
(UUID(), (SELECT id FROM modules WHERE code = 'activities'), 'activities', 'Create', 'Create new activities', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'activities'), 'activities', 'Read', 'View activities', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'activities'), 'activities', 'Update', 'Update activities', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'activities'), 'activities', 'Delete', 'Delete activities', true, NOW(), NOW());

-- For Reports module
INSERT INTO rbac_permissions (id, module_id, entity_type, action, description, is_system_permission, created_at, updated_at) VALUES
(UUID(), (SELECT id FROM modules WHERE code = 'reports'), 'reports', 'Read', 'View reports', true, NOW(), NOW()),
(UUID(), (SELECT id FROM modules WHERE code = 'reports'), 'reports', 'Export', 'Export reports', true, NOW(), NOW());

-- 3. ENABLE MODULES FOR TENANT
-- Replace 'YOUR_TENANT_ID' with the actual tenant ID
INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at) VALUES
(UUID(), 'YOUR_TENANT_ID', (SELECT id FROM modules WHERE code = 'leads'), true, NOW()),
(UUID(), 'YOUR_TENANT_ID', (SELECT id FROM modules WHERE code = 'customers'), true, NOW()),
(UUID(), 'YOUR_TENANT_ID', (SELECT id FROM modules WHERE code = 'activities'), true, NOW());

-- Note: Reports is NOT enabled for this tenant

-- ============================================
-- VERIFY
-- ============================================

-- Check modules created
SELECT id, name, code FROM modules;

-- Check permissions created
SELECT p.id, m.code as module, p.action, p.description 
FROM rbac_permissions p
LEFT JOIN modules m ON p.module_id = m.id
ORDER BY m.code, p.action;

-- Check tenant modules
SELECT tm.id, tm.tenant_id, m.name, m.code, tm.is_enabled
FROM tenant_modules tm
JOIN modules m ON tm.module_id = m.id
WHERE tm.tenant_id = 'YOUR_TENANT_ID';
