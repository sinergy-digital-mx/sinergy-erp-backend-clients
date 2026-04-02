import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePurchaseOrderDocumentTypes1743668000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inv_s_purchase_order_document_types',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: true,
          },
        ],
      }),
    );

    // Insert default document types
    await queryRunner.query(
      `INSERT INTO inv_s_purchase_order_document_types (name, description) VALUES 
       ('DOCUMENTO_ORIGINAL', 'Documento original de la orden de compra'),
       ('FACTURA', 'Factura del proveedor'),
       ('REMISIÓN', 'Remisión de entrega'),
       ('RECEPCIÓN', 'Comprobante de recepción'),
       ('OTRO', 'Otro tipo de documento')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inv_s_purchase_order_document_types');
  }
}
