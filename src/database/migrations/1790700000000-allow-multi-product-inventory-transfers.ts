import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * El encabezado de la transferencia deja de exigir un solo producto.
 * Si las líneas mezclan productos o unidades, product_id y uom_id quedan nulos.
 */
export class AllowMultiProductInventoryTransfers1790700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `inv_s_inventory_transfers` MODIFY `product_id` varchar(36) NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `inv_s_inventory_transfers` MODIFY `uom_id` varchar(36) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `inv_s_inventory_transfers` MODIFY `product_id` varchar(36) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `inv_s_inventory_transfers` MODIFY `uom_id` varchar(36) NOT NULL',
    );
  }
}
