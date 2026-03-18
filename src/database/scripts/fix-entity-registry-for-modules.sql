-- ============================================
-- FIX ENTITY REGISTRY FOR MODULES
-- ============================================
-- This script ensures all modules have corresponding entity_registry entries
-- Run this BEFORE add-view-menu-permission.sql if you encounter entity_registry_id errors

-- 1. CHECK MODULES WITHOUT ENTITY REGISTRY
SELECT 
    m.id,
    m.code,
    m.name,
    'MISSING ENTITY REGISTRY' as status
FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM entity_registry er WHERE er.code = m.code
);

-- 2. CREATE MISSING ENTITY REGISTRY ENTRIES
INSERT INTO entity_registry (code, name)
SELECT 
    m.code,
    CONCAT(m.name, ' Management') as name
FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM entity_registry er WHERE er.code = m.code
);

-- 3. VERIFY ALL MODULES HAVE ENTITY REGISTRY
SELECT 
    m.code,
    m.name as module_name,
    er.id as registry_id,
    er.name as registry_name,
    'OK' as status
FROM modules m
INNER JOIN entity_registry er ON er.code = m.code
ORDER BY m.name;

-- 4. CHECK FOR ANY REMAINING ISSUES
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'All modules have entity registry entries'
        ELSE CONCAT(COUNT(*), ' modules still missing entity registry')
    END as result
FROM modules m
WHERE NOT EXISTS (
    SELECT 1 FROM entity_registry er WHERE er.code = m.code
);
