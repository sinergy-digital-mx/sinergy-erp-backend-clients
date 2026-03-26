-- Script para agregar permisos de Contracts y Properties
-- Adapted to match the correct RBAC model schema

-- 1. Crear módulo de Contracts si no existe
INSERT IGNORE INTO modules (id, name, code, description, created_at)
VALUES (
  UUID(),
  'Contracts',
  'contracts',
  'Contract management module',
  NOW()
);

-- 2. Crear módulo de Properties si no existe
INSERT IGNORE INTO modules (id, name, code, description, created_at)
VALUES (
  UUID(),
  'Properties',
  'properties',
  'Properties/Lots management module',
  NOW()
);

-- 3. Obtener IDs de los módulos
SET @contracts_module_id = (SELECT id FROM modules WHERE code = 'contracts' LIMIT 1);
SET @properties_module_id = (SELECT id FROM modules WHERE code = 'properties' LIMIT 1);

-- 4. Crear permisos para Contracts
-- Note: entity_registry_id is required; adjust based on your entity registry setup
INSERT IGNORE INTO rbac_permissions (id, module_id, action, description, entity_registry_id, is_system_permission, created_at, updated_at)
VALUES
  (UUID(), @contracts_module_id, 'view', 'View contracts', 1, 1, NOW(), NOW()),
  (UUID(), @contracts_module_id, 'create', 'Create contracts', 1, 1, NOW(), NOW()),
  (UUID(), @contracts_module_id, 'update', 'Update contracts', 1, 1, NOW(), NOW()),
  (UUID(), @contracts_module_id, 'delete', 'Delete contracts', 1, 1, NOW(), NOW()),
  (UUID(), @contracts_module_id, 'view_stats', 'View contract statistics', 1, 1, NOW(), NOW());

-- 5. Crear permisos para Properties
INSERT IGNORE INTO rbac_permissions (id, module_id, action, description, entity_registry_id, is_system_permission, created_at, updated_at)
VALUES
  (UUID(), @properties_module_id, 'view', 'View properties', 2, 1, NOW(), NOW()),
  (UUID(), @properties_module_id, 'create', 'Create properties', 2, 1, NOW(), NOW()),
  (UUID(), @properties_module_id, 'update', 'Update properties', 2, 1, NOW(), NOW()),
  (UUID(), @properties_module_id, 'delete', 'Delete properties', 2, 1, NOW(), NOW());

-- 6. Mostrar resultados
SELECT 'Módulos creados:' as resultado;
SELECT id, name, code FROM modules WHERE code IN ('contracts', 'properties');

SELECT 'Permisos de Contracts:' as resultado;
SELECT id, action, description 
FROM rbac_permissions
WHERE module_id = @contracts_module_id;

SELECT 'Permisos de Properties:' as resultado;
SELECT id, action, description 
FROM rbac_permissions
WHERE module_id = @properties_module_id;
