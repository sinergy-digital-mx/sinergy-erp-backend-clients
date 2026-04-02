-- Agregar columna is_active a products

ALTER TABLE products 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL AFTER description;

-- Actualizar productos existentes como activos
UPDATE products SET is_active = TRUE WHERE is_active IS NULL;

-- Verificar
SELECT id, sku, name, is_active FROM products LIMIT 5;
