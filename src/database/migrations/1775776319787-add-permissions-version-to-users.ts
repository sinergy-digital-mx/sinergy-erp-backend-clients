import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPermissionsVersionToUsers1775776319787 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add permissions_version column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'permissions_version',
        type: 'int',
        default: 1,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove permissions_version column from users table
    await queryRunner.dropColumn('users', 'permissions_version');
  }
}
