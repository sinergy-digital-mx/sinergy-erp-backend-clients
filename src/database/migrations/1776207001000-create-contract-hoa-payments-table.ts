import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContractHoaPaymentsTable1776207001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenantIdDefinition = await this.getColumnDefinition(
      queryRunner,
      'rbac_tenants',
      'id',
      'varchar(36)',
    );
    const contractIdDefinition = await this.getColumnDefinition(
      queryRunner,
      'contracts',
      'id',
      'varchar(36)',
    );

    await queryRunner.query(`
      CREATE TABLE contract_hoa_payments (
        id ${contractIdDefinition} NOT NULL,
        tenant_id ${tenantIdDefinition} NOT NULL,
        contract_id ${contractIdDefinition} NOT NULL,
        payment_number varchar(50) NOT NULL,
        amount decimal(15,2) NOT NULL,
        amount_paid decimal(15,2) NOT NULL DEFAULT 0,
        amount_pending decimal(15,2) NOT NULL,
        due_date date NOT NULL,
        paid_date date NULL,
        first_partial_payment_date date NULL,
        payment_method varchar(50) NULL,
        status enum ('pagado', 'pendiente', 'parcial', 'cancelado') NOT NULL DEFAULT 'pendiente',
        is_overdue tinyint NOT NULL DEFAULT 0,
        notes text NULL,
        created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        CONSTRAINT FK_contract_hoa_payments_tenant FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT FK_contract_hoa_payments_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE INDEX contract_hoa_payments_tenant_index ON contract_hoa_payments (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX contract_hoa_payments_contract_index ON contract_hoa_payments (contract_id)
    `);
    await queryRunner.query(`
      CREATE INDEX contract_hoa_payments_due_date_index ON contract_hoa_payments (due_date)
    `);
    await queryRunner.query(`
      CREATE INDEX contract_hoa_payments_status_index ON contract_hoa_payments (status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX contract_hoa_payments_status_index ON contract_hoa_payments
    `);
    await queryRunner.query(`
      DROP INDEX contract_hoa_payments_due_date_index ON contract_hoa_payments
    `);
    await queryRunner.query(`
      DROP INDEX contract_hoa_payments_contract_index ON contract_hoa_payments
    `);
    await queryRunner.query(`
      DROP INDEX contract_hoa_payments_tenant_index ON contract_hoa_payments
    `);
    await queryRunner.query(`
      DROP TABLE contract_hoa_payments
    `);
  }

  private async getColumnDefinition(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    fallbackType: string,
  ): Promise<string> {
    const databaseNameResult = await queryRunner.query(`SELECT DATABASE() as db`);
    const databaseName = databaseNameResult?.[0]?.db;

    if (!databaseName) {
      return fallbackType;
    }

    const columnMeta = await queryRunner.query(
      `
        SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `,
      [databaseName, tableName, columnName],
    );

    if (!columnMeta?.length) {
      return fallbackType;
    }

    const { COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME } = columnMeta[0];
    let definition = COLUMN_TYPE || fallbackType;

    if (CHARACTER_SET_NAME) {
      definition += ` CHARACTER SET ${CHARACTER_SET_NAME}`;
    }

    if (COLLATION_NAME) {
      definition += ` COLLATE ${COLLATION_NAME}`;
    }

    return definition;
  }
}
