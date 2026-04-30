import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTypeToPosConfigurations1776205000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pos_configurations',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        length: '20',
        isNullable: false,
        default: "'VENTAS'",
        comment: 'Equipment type: VENTAS or COBRANZA',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pos_configurations', 'type');
  }
}
