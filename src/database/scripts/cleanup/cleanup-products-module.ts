// Script para limpiar el módulo de productos de la base de datos
import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../../data-source';
import * as fs from 'fs';
import * as path from 'path';

async function cleanupProductsModule() {
  await AppDataSource.initialize();

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('🗑️  Iniciando limpieza del módulo de productos...\n');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'drop-products-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Dividir por comandos SQL (separados por punto y coma)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log('📋 Ejecutando comandos SQL...\n');

    for (const command of sqlCommands) {
      if (command.includes('DROP TABLE')) {
        const tableName = command.match(/DROP TABLE IF EXISTS `?(\w+)`?/)?.[1];
        if (tableName) {
          console.log(`   🗑️  Eliminando tabla: ${tableName}`);
        }
      }
      
      try {
        await queryRunner.query(command);
      } catch (error: any) {
        // Ignorar errores de tablas que no existen
        if (!error.message.includes('Unknown table')) {
          console.error(`   ⚠️  Error en comando: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Tablas eliminadas exitosamente\n');

    // Verificar tablas restantes
    console.log('🔍 Verificando tablas restantes relacionadas con productos...\n');
    const remainingTables = await queryRunner.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
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
        )
    `);

    if (remainingTables.length === 0) {
      console.log('✅ Todas las tablas de productos fueron eliminadas correctamente\n');
    } else {
      console.log('⚠️  Las siguientes tablas aún existen:\n');
      remainingTables.forEach((row: any) => {
        console.log(`   - ${row.TABLE_NAME}`);
      });
    }

    // Limpiar permisos y módulos relacionados con productos
    console.log('\n🧹 Limpiando permisos y módulos de productos...\n');

    // Eliminar permisos de productos
    await queryRunner.query(`
      DELETE rp FROM rbac_role_permissions rp
      INNER JOIN rbac_permissions p ON rp.permission_id = p.id
      INNER JOIN entity_registry er ON p.entity_registry_id = er.id
      WHERE er.code IN ('Product', 'UoM', 'ProductPrice', 'VendorProductPrice')
    `);
    console.log('   ✅ Permisos de productos eliminados');

    // Eliminar registros de entidades
    await queryRunner.query(`
      DELETE FROM entity_registry 
      WHERE code IN ('Product', 'UoM', 'ProductPrice', 'VendorProductPrice')
    `);
    console.log('   ✅ Registros de entidades eliminados');

    // Eliminar módulo de productos
    await queryRunner.query(`
      DELETE tm FROM rbac_tenant_modules tm
      INNER JOIN modules m ON tm.module_id = m.id
      WHERE m.code = 'products'
    `);
    console.log('   ✅ Módulo de productos desvinculado de tenants');

    await queryRunner.query(`
      DELETE FROM modules WHERE code = 'products'
    `);
    console.log('   ✅ Módulo de productos eliminado');

    console.log('\n✅ Limpieza completada exitosamente!\n');
    console.log('📋 Resumen:');
    console.log('   - Tablas de productos eliminadas');
    console.log('   - Permisos de productos eliminados');
    console.log('   - Módulo de productos eliminado');
    console.log('   - Sistema listo para recrear el módulo desde cero\n');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

cleanupProductsModule()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });
