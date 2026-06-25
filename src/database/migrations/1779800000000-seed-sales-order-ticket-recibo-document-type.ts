import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSalesOrderTicketReciboDocumentType1779800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO inv_s_sales_order_document_types (name, description)
       SELECT 'TICKET / RECIBO', 'Ticket termico ESC/POS de cobro POS'
       WHERE NOT EXISTS (
         SELECT 1 FROM inv_s_sales_order_document_types WHERE name = 'TICKET / RECIBO'
       )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM inv_s_sales_order_document_types WHERE name = 'TICKET / RECIBO'`,
    );
  }
}
