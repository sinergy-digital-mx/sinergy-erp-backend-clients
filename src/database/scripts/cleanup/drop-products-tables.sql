-- Script para eliminar todas las tablas relacionadas con productos
-- ADVERTENCIA: Este script eliminará TODOS los datos de productos
-- Ejecutar con precaución en producción

-- Desactivar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas relacionadas con productos (en orden de dependencias)
DROP TABLE IF EXISTS `vendor_product_prices`;
DROP TABLE IF EXISTS `product_prices`;
DROP TABLE IF EXISTS `product_photos`;
DROP TABLE IF EXISTS `uom_relationships`;
DROP TABLE IF EXISTS `product_uoms`;
DROP TABLE IF EXISTS `sales_order_lines`;
DROP TABLE IF EXISTS `line_items`;
DROP TABLE IF EXISTS `inventory_items`;
DROP TABLE IF EXISTS `inventory_movements`;
DROP TABLE IF EXISTS `stock_reservations`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `uom_catalog`;
DROP TABLE IF EXISTS `price_lists`;

-- Reactivar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que las tablas fueron eliminadas
SELECT 
    TABLE_NAME 
FROM 
    INFORMATION_SCHEMA.TABLES 
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN (
        'products',
        'product_uoms',
        'product_prices',
        'product_photos',
        'uom_relationships',
        'vendor_product_prices',
        'uom_catalog',
        'price_lists',
        'sales_order_lines',
        'line_items',
        'inventory_items',
        'inventory_movements',
        'stock_reservations'
    );

-- Si no hay resultados, las tablas fueron eliminadas exitosamente
