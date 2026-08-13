import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSerialNumberToTrucks1785300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'trucks',
      new TableColumn({
        name: 'serial_number',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('trucks', 'serial_number');
  }
}
