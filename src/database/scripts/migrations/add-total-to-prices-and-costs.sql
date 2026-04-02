-- Agregar columna total a product_prices
ALTER TABLE product_prices 
ADD COLUMN total DECIMAL(12,2) DEFAULT 0 NOT NULL AFTER subtotal;

-- Actualizar totales existentes en product_prices
UPDATE product_prices 
SET total = subtotal + iva_unit_total + ieps_unit_total;

-- Agregar columna total a product_vendor_costs
ALTER TABLE product_vendor_costs 
ADD COLUMN total DECIMAL(12,2) DEFAULT 0 NOT NULL AFTER subtotal;

-- Actualizar totales existentes en product_vendor_costs
UPDATE product_vendor_costs 
SET total = subtotal + iva_unit_total + ieps_unit_total;

-- Verificar
SELECT id, price, iva_unit_total, ieps_unit_total, subtotal, total FROM product_prices LIMIT 5;
SELECT id, cost, iva_unit_total, ieps_unit_total, subtotal, total FROM product_vendor_costs LIMIT 5;
