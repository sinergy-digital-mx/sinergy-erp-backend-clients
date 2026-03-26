-- Insert Price List Types
-- Note: Replace 'YOUR_TENANT_ID' with the actual tenant ID

INSERT INTO price_lists (id, tenant_id, name, description, is_default, is_active, created_at, updated_at) VALUES
(UUID(), 'YOUR_TENANT_ID', 'Mayoreo', NULL, false, true, NOW(), NOW()),
(UUID(), 'YOUR_TENANT_ID', 'Medio mayoreo', NULL, false, true, NOW(), NOW()),
(UUID(), 'YOUR_TENANT_ID', 'Precio de lista', NULL, false, true, NOW(), NOW()),
(UUID(), 'YOUR_TENANT_ID', 'Precio neto', NULL, false, true, NOW(), NOW()),
(UUID(), 'YOUR_TENANT_ID', 'Precio unitario', NULL, false, true, NOW(), NOW()),
(UUID(), 'YOUR_TENANT_ID', 'Precio de distribuidor', NULL, false, true, NOW(), NOW()),
(UUID(), 'YOUR_TENANT_ID', 'Precio al público', NULL, false, true, NOW(), NOW());
