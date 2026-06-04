import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSalesDashboardToDivinoDashboard1776210300000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE modules
      SET name = 'Divino Dashboard', code = 'divino_dashboard',
          description = 'Dashboard analítico de ventas Divino (tenant exclusivo)'
      WHERE code = 'sales_dashboard'
    `);

    await queryRunner.query(`
      UPDATE entity_registry
      SET code = 'DivinoDashboard', name = 'Divino Dashboard'
      WHERE code = 'SalesDashboard'
    `);

    await queryRunner.query(`
      UPDATE entity_registry
      SET code = 'divino_dashboard', name = 'Divino Dashboard Menu'
      WHERE code = 'sales_dashboard'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE modules
      SET name = 'Dashboard de Ventas', code = 'sales_dashboard',
          description = 'Dashboard analítico de ventas de lotes (tenant exclusivo)'
      WHERE code = 'divino_dashboard'
    `);

    await queryRunner.query(`
      UPDATE entity_registry
      SET code = 'SalesDashboard', name = 'Sales Dashboard'
      WHERE code = 'DivinoDashboard'
    `);

    await queryRunner.query(`
      UPDATE entity_registry
      SET code = 'sales_dashboard', name = 'Sales Dashboard Menu'
      WHERE code = 'divino_dashboard'
    `);
  }
}
