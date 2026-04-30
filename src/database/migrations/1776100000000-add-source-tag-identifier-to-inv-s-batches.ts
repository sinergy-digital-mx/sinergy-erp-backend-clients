import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddSourceTagIdentifierToInvSBatches1776100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'inv_s_batches',
      new TableColumn({
        name: 'source_tag_identifier',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    await queryRunner.createIndex(
      'inv_s_batches',
      new TableIndex({
        name: 'idx_source_tag_identifier',
        columnNames: ['source_tag_identifier'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('inv_s_batches', 'idx_source_tag_identifier');
    await queryRunner.dropColumn('inv_s_batches', 'source_tag_identifier');
  }
}
