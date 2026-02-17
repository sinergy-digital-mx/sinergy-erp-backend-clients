import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserProfileFields1770100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let table = await queryRunner.getTable('users');

    const columns = ['first_name', 'last_name', 'phone', 'language_code'];
    const columnDefs = {
      first_name: new TableColumn({
        name: 'first_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      last_name: new TableColumn({
        name: 'last_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      phone: new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
      language_code: new TableColumn({
        name: 'language_code',
        type: 'varchar',
        length: '10',
        isNullable: true,
        default: "'es'",
      }),
    };

    for (const col of columns) {
      const exists = table?.columns.some(c => c.name === col);
      if (!exists) {
        await queryRunner.addColumn('users', columnDefs[col]);
        // Refresh table reference after adding column
        table = await queryRunner.getTable('users');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let table = await queryRunner.getTable('users');
    const columns = ['language_code', 'phone', 'last_name', 'first_name'];

    for (const col of columns) {
      const exists = table?.columns.some(c => c.name === col);
      if (exists) {
        await queryRunner.dropColumn('users', col);
        // Refresh table reference after dropping column
        table = await queryRunner.getTable('users');
      }
    }
  }
}
