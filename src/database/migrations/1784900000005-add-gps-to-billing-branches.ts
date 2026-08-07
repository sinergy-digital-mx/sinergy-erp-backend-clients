import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGpsToBillingBranches1784900000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasLat = await queryRunner.hasColumn('billing_branches', 'latitude');
    if (!hasLat) {
      await queryRunner.addColumns('billing_branches', [
        new TableColumn({
          name: 'latitude',
          type: 'decimal',
          precision: 10,
          scale: 6,
          isNullable: true,
        }),
        new TableColumn({
          name: 'longitude',
          type: 'decimal',
          precision: 10,
          scale: 6,
          isNullable: true,
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const col of ['longitude', 'latitude']) {
      if (await queryRunner.hasColumn('billing_branches', col)) {
        await queryRunner.dropColumn('billing_branches', col);
      }
    }
  }
}
