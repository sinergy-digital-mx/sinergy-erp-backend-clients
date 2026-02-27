import { MigrationInterface, QueryRunner, TableColumn, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddPartialPaymentsAndDocuments1771350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar nuevos campos a la tabla payments para pagos parciales
    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'amount_paid',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0,
        comment: 'Monto realmente pagado (puede ser parcial)',
      }),
    );

    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'amount_pending',
        type: 'decimal',
        precision: 15,
        scale: 2,
        default: 0,
        comment: 'Diferencia pendiente (amount - amount_paid)',
      }),
    );

    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'first_partial_payment_date',
        type: 'date',
        isNullable: true,
        comment: 'Fecha del primer pago parcial',
      }),
    );

    // 2. Actualizar el enum de status para incluir 'parcial'
    await queryRunner.query(`
      ALTER TABLE payments 
      MODIFY COLUMN status ENUM('pendiente', 'pagado', 'parcial', 'vencido', 'cancelado') 
      DEFAULT 'pendiente'
    `);

    // 3. Actualizar comentario de la columna amount
    await queryRunner.query(`
      ALTER TABLE payments 
      MODIFY COLUMN amount DECIMAL(15,2) COMMENT 'Monto total esperado del pago'
    `);

    // 4. Actualizar comentario de paid_date
    await queryRunner.query(`
      ALTER TABLE payments 
      MODIFY COLUMN paid_date DATE NULL COMMENT 'Fecha del último pago'
    `);

    // 5. Inicializar amount_paid con el valor de amount para pagos ya pagados
    await queryRunner.query(`
      UPDATE payments 
      SET amount_paid = amount, 
          amount_pending = 0 
      WHERE status = 'pagado'
    `);

    // 6. Inicializar amount_pending con el valor de amount para pagos pendientes
    await queryRunner.query(`
      UPDATE payments 
      SET amount_pending = amount 
      WHERE status IN ('pendiente', 'vencido')
    `);

    // 7. Crear tabla payment_documents
    await queryRunner.createTable(
      new Table({
        name: 'payment_documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'tenant_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'payment_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'document_type',
            type: 'enum',
            enum: ['comprobante_transferencia', 'foto_deposito', 'recibo', 'factura', 'otro'],
            default: "'comprobante_transferencia'",
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 's3_key',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'file_size',
            type: 'bigint',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'uploaded_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 8. Crear foreign keys para payment_documents
    await queryRunner.createForeignKey(
      'payment_documents',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payment_documents',
      new TableForeignKey({
        columnNames: ['payment_id'],
        referencedTableName: 'payments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 9. Crear índices para payment_documents
    await queryRunner.createIndex(
      'payment_documents',
      new TableIndex({
        name: 'tenant_index',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'payment_documents',
      new TableIndex({
        name: 'payment_index',
        columnNames: ['payment_id'],
      }),
    );

    await queryRunner.createIndex(
      'payment_documents',
      new TableIndex({
        name: 'document_type_index',
        columnNames: ['document_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla payment_documents
    await queryRunner.dropTable('payment_documents', true);

    // Revertir enum de status
    await queryRunner.query(`
      ALTER TABLE payments 
      MODIFY COLUMN status ENUM('pendiente', 'pagado', 'vencido', 'cancelado') 
      DEFAULT 'pendiente'
    `);

    // Eliminar columnas agregadas
    await queryRunner.dropColumn('payments', 'first_partial_payment_date');
    await queryRunner.dropColumn('payments', 'amount_pending');
    await queryRunner.dropColumn('payments', 'amount_paid');
  }
}
