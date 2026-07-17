import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateDivinoReservationFormatsTable1784600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'divino_reservation_formats',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'folio', type: 'varchar', length: '50', isNullable: false },

          // Encabezado / razón social
          {
            name: 'fiscal_configuration_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'payable_to', type: 'varchar', length: '255', isNullable: true },

          // Recepción de fondos
          { name: 'received_from', type: 'varchar', length: '255', isNullable: true },
          { name: 'amount_in_words', type: 'varchar', length: '255', isNullable: true },
          { name: 'evidenced_by', type: 'varchar', length: '255', isNullable: true },

          // LOTE
          { name: 'property_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'block', type: 'varchar', length: '50', isNullable: true },
          { name: 'lot_number', type: 'varchar', length: '50', isNullable: true },
          {
            name: 'surface',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'purchase_price',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          { name: 'currency', type: 'varchar', length: '10', default: "'MXN'" },

          // Plan de pagos
          {
            name: 'reservation_deposit',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          { name: 'reservation_date', type: 'date', isNullable: true },
          {
            name: 'down_payment',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          { name: 'down_payment_date', type: 'date', isNullable: true },
          {
            name: 'financed_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          { name: 'financing_years', type: 'int', isNullable: true },
          { name: 'monthly_payments_count', type: 'int', isNullable: true },
          {
            name: 'monthly_payment_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'maintenance_fee',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 50,
          },
          {
            name: 'maintenance_currency',
            type: 'varchar',
            length: '10',
            default: "'USD'",
          },
          { name: 'payment_day', type: 'enum', enum: ['1', '15'], isNullable: true },

          // Comprador
          { name: 'buyer_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'buyer_address', type: 'varchar', length: '500', isNullable: true },
          { name: 'buyer_phone', type: 'varchar', length: '50', isNullable: true },
          { name: 'buyer_email', type: 'varchar', length: '255', isNullable: true },

          // Cómo se enteró
          {
            name: 'lead_source',
            type: 'enum',
            enum: [
              'facebook',
              'instagram',
              'google',
              'restaurante',
              'walkin',
              'referido',
              'otro',
            ],
            isNullable: true,
          },
          {
            name: 'lead_source_other',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },

          // Pie
          { name: 'format_date', type: 'date', isNullable: true },
          { name: 'agent_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'sent'],
            default: "'draft'",
          },

          // Auditoría
          { name: 'created_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'created_by_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'sent_at', type: 'timestamp', isNullable: true },
          { name: 'sent_to', type: 'varchar', length: '255', isNullable: true },
          { name: 'sent_by', type: 'varchar', length: '36', isNullable: true },
          { name: 'metadata', type: 'json', isNullable: true },

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

    await queryRunner.createForeignKey(
      'divino_reservation_formats',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rbac_tenants',
        onDelete: 'CASCADE',
        name: 'FK_divino_reservation_formats_tenant',
      }),
    );

    await queryRunner.createForeignKey(
      'divino_reservation_formats',
      new TableForeignKey({
        columnNames: ['property_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'properties',
        onDelete: 'RESTRICT',
        name: 'FK_divino_reservation_formats_property',
      }),
    );

    await queryRunner.createForeignKey(
      'divino_reservation_formats',
      new TableForeignKey({
        columnNames: ['fiscal_configuration_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_configurations',
        onDelete: 'SET NULL',
        name: 'FK_divino_reservation_formats_fiscal_configuration',
      }),
    );

    await queryRunner.createIndex(
      'divino_reservation_formats',
      new TableIndex({
        name: 'IDX_divino_reservation_formats_tenant',
        columnNames: ['tenant_id'],
      }),
    );

    await queryRunner.createIndex(
      'divino_reservation_formats',
      new TableIndex({
        name: 'IDX_divino_reservation_formats_property',
        columnNames: ['property_id'],
      }),
    );

    await queryRunner.createIndex(
      'divino_reservation_formats',
      new TableIndex({
        name: 'IDX_divino_reservation_formats_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'divino_reservation_formats',
      new TableIndex({
        name: 'IDX_divino_reservation_formats_tenant_folio',
        columnNames: ['tenant_id', 'folio'],
        isUnique: true,
      }),
    );

    console.log('✅ Migration: Created divino_reservation_formats table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('divino_reservation_formats');

    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('divino_reservation_formats', fk);
      }
    }

    await queryRunner.dropTable('divino_reservation_formats', true);

    console.log('✅ Migration rollback: Dropped divino_reservation_formats table');
  }
}
