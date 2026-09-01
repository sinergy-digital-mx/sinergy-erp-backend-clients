import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSalesOrderReciboToEntrega1787600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const reciboRows: Array<{ id: number }> = await queryRunner.query(
      `SELECT id FROM inv_s_sales_order_document_types WHERE name = 'RECIBO' LIMIT 1`,
    );
    const recibo = reciboRows[0];
    if (!recibo) {
      await queryRunner.query(
        `INSERT INTO inv_s_sales_order_document_types (name, description)
         SELECT 'ENTREGA', 'Comprobante de entrega de la orden de venta'
         WHERE NOT EXISTS (
           SELECT 1 FROM inv_s_sales_order_document_types WHERE name = 'ENTREGA'
         )`,
      );
      return;
    }

    const entregaRows: Array<{ id: number }> = await queryRunner.query(
      `SELECT id FROM inv_s_sales_order_document_types WHERE name = 'ENTREGA' LIMIT 1`,
    );
    const entrega = entregaRows[0];

    if (entrega) {
      await queryRunner.query(
        `UPDATE inv_s_sales_order_documents SET document_type_id = ? WHERE document_type_id = ?`,
        [entrega.id, recibo.id],
      );
      await queryRunner.query(`DELETE FROM inv_s_sales_order_document_types WHERE id = ?`, [
        recibo.id,
      ]);
      return;
    }

    await queryRunner.query(
      `UPDATE inv_s_sales_order_document_types
       SET name = 'ENTREGA', description = 'Comprobante de entrega de la orden de venta'
       WHERE id = ?`,
      [recibo.id],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entregaRows: Array<{ id: number }> = await queryRunner.query(
      `SELECT id FROM inv_s_sales_order_document_types WHERE name = 'ENTREGA' LIMIT 1`,
    );
    const entrega = entregaRows[0];
    if (!entrega) return;

    const reciboRows: Array<{ id: number }> = await queryRunner.query(
      `SELECT id FROM inv_s_sales_order_document_types WHERE name = 'RECIBO' LIMIT 1`,
    );
    if (reciboRows[0]) return;

    await queryRunner.query(
      `UPDATE inv_s_sales_order_document_types
       SET name = 'RECIBO', description = 'Recibo PDF de la orden de venta'
       WHERE id = ?`,
      [entrega.id],
    );
  }
}
