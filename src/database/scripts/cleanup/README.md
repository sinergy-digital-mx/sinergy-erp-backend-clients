# 🗑️ Scripts de Limpieza - Módulo de Productos

## ⚠️ ADVERTENCIA

Estos scripts **ELIMINARÁN PERMANENTEMENTE** todos los datos relacionados con productos. Úsalos con extrema precaución, especialmente en producción.

## 📋 Archivos

1. **drop-products-tables.sql** - Script SQL puro para eliminar tablas
2. **cleanup-products-module.ts** - Script TypeScript completo que:
   - Elimina todas las tablas de productos
   - Limpia permisos relacionados
   - Elimina el módulo de productos
   - Verifica que todo fue eliminado correctamente

## 🚀 Cómo Usar

### Opción 1: Script TypeScript (Recomendado)

```bash
npm run cleanup:products
```

Este script:
- ✅ Elimina tablas: products, product_uoms, product_prices, product_photos, etc.
- ✅ Elimina permisos de productos del RBAC
- ✅ Elimina el módulo de productos
- ✅ Verifica que todo fue eliminado
- ✅ Muestra un resumen completo

### Opción 2: SQL Directo

Si prefieres ejecutar el SQL manualmente:

```bash
mysql -u usuario -p nombre_base_datos < src/database/scripts/cleanup/drop-products-tables.sql
```

## 📊 Tablas que se Eliminarán

- `products` - Tabla principal de productos
- `product_uoms` - Unidades de medida por producto
- `product_prices` - Precios por lista
- `product_photos` - Imágenes de productos
- `uom_relationships` - Conversiones entre unidades
- `vendor_product_prices` - Precios por proveedor
- `uom_catalog` - Catálogo de unidades de medida
- `price_lists` - Listas de precios
- `sales_order_lines` - Líneas de órdenes de venta (referencias a productos)
- `line_items` - Líneas de órdenes de compra (referencias a productos)
- `inventory_items` - Items de inventario
- `inventory_movements` - Movimientos de inventario
- `stock_reservations` - Reservas de stock

## ⚠️ Impacto en Otros Módulos

La eliminación de productos afectará:

- **Órdenes de Venta**: Las líneas de orden que referencian productos serán eliminadas
- **Órdenes de Compra**: Las líneas de orden que referencian productos serán eliminadas
- **Inventario**: Todo el inventario será eliminado
- **Precios**: Todas las listas de precios serán eliminadas

## 🔄 Después de la Limpieza

Una vez ejecutado el script de limpieza:

1. ✅ El sistema estará listo para recrear el módulo desde cero
2. ✅ No habrá conflictos con datos antiguos
3. ✅ Puedes seguir el plan en `PLAN-MODULO-PRODUCTOS.md`

## 🛡️ Backup Recomendado

**ANTES** de ejecutar estos scripts en producción:

```bash
# Backup de la base de datos completa
mysqldump -u usuario -p nombre_base_datos > backup_antes_limpieza_$(date +%Y%m%d_%H%M%S).sql

# O solo las tablas de productos
mysqldump -u usuario -p nombre_base_datos \
  products product_uoms product_prices product_photos \
  uom_relationships vendor_product_prices uom_catalog price_lists \
  > backup_productos_$(date +%Y%m%d_%H%M%S).sql
```

## 📝 Log de Ejecución

El script mostrará:
- ✅ Cada tabla eliminada
- ✅ Permisos eliminados
- ✅ Módulos eliminados
- ✅ Verificación final
- ✅ Resumen completo

## 🆘 En Caso de Error

Si algo sale mal:

1. Restaura el backup:
   ```bash
   mysql -u usuario -p nombre_base_datos < backup_antes_limpieza_YYYYMMDD_HHMMSS.sql
   ```

2. Revisa los logs del script

3. Contacta al equipo de desarrollo

## ✅ Verificación Post-Limpieza

Después de ejecutar el script, verifica:

```sql
-- No debería retornar ninguna fila
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME LIKE '%product%';

-- Verificar que no hay permisos de productos
SELECT * FROM rbac_permissions p
INNER JOIN entity_registry er ON p.entity_registry_id = er.id
WHERE er.code IN ('Product', 'UoM', 'ProductPrice');

-- Verificar que no hay módulo de productos
SELECT * FROM modules WHERE code = 'products';
```

Todas estas consultas deberían retornar 0 filas.
