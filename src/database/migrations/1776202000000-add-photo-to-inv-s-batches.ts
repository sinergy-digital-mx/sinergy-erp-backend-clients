import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhotoToInvSBatches1776202000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_batches',
      new TableColumn({
        name: 'photo',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inv_s_batches', 'photo');
  }
}
