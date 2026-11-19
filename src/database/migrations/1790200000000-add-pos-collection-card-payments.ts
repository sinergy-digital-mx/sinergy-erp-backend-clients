import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Desglose de cobros mixtos con 2 o más tarjetas.
 * amount_card_mxn sigue siendo la suma; card_payments guarda cada cargo.
 */
export class AddPosCollectionCardPayments1790200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pos_sale_collections');
    if (!table?.findColumnByName('card_payments')) {
      await queryRunner.addColumn(
        'pos_sale_collections',
        new TableColumn({
          name: 'card_payments',
          type: 'json',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pos_sale_collections');
    if (table?.findColumnByName('card_payments')) {
      await queryRunner.dropColumn('pos_sale_collections', 'card_payments');
    }
  }
}
