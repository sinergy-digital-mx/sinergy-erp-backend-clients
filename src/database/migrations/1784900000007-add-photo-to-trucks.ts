import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhotoToTrucks1784900000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'trucks',
      new TableColumn({
        name: 'photo',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('trucks', 'photo');
  }
}
