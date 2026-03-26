-- Add Lead:Activity permissions
INSERT IGNORE INTO rbac_permissions (entity_type, action, description, is_system_permission, created_at, updated_at) VALUES
('Lead:Activity', 'Create', 'Create lead activities', false, NOW(), NOW()),
('Lead:Activity', 'Read', 'Read lead activities', false, NOW(), NOW()),
('Lead:Activity', 'Update', 'Update lead activities', false, NOW(), NOW()),
('Lead:Activity', 'Delete', 'Delete lead activities', false, NOW(), NOW()),
('Lead:Activity', 'Export', 'Export lead activities', false, NOW(), NOW()),
('Lead:Activity', 'View_All', 'View all lead activities across the tenant', false, NOW(), NOW());

-- Update Sales Representative role to have Lead:Activity permissions
INSERT IGNORE INTO rbac_role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.name = 'Sales Representative' 
  AND r.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
  AND p.entity_type = 'Lead:Activity'
  AND p.action IN ('Create', 'Read', 'Update', 'Delete');

-- Update Sales Manager role to have Lead:Activity permissions
INSERT IGNORE INTO rbac_role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.name = 'Sales Manager' 
  AND r.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
  AND p.entity_type = 'Lead:Activity'
  AND p.action IN ('Create', 'Read', 'Update', 'Delete', 'Export', 'View_All');

-- Update Customer Support role to have Lead:Activity permissions
INSERT IGNORE INTO rbac_role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.name = 'Customer Support' 
  AND r.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
  AND p.entity_type = 'Lead:Activity'
  AND p.action IN ('Create', 'Read', 'Update');

-- Verify the permissions were added
SELECT 'Lead:Activity Permissions:' as info;
SELECT entity_type, action, description FROM rbac_permissions WHERE entity_type = 'Lead:Activity';

-- Verify role assignments
SELECT 'Sales Representative Lead:Activity Permissions:' as info;
SELECT r.name as role_name, p.entity_type, p.action
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE r.name = 'Sales Representative' 
  AND r.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
  AND p.entity_type = 'Lead:Activity';