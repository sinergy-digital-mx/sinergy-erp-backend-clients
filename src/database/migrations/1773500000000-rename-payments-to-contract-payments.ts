import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePaymentsToContractPayments1773500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if payments table exists
    const paymentsTableExists = await queryRunner.hasTable('payments');
    
    if (paymentsTableExists) {
      // Rename the payments table to contract_payments
      await queryRunner.renameTable('payments', 'contract_payments');
    }

    // Update foreign key in payment_documents table
    try {
      await queryRunner.query(
        `ALTER TABLE payment_documents DROP FOREIGN KEY FK_payment_documents_payment_id`,
      );
    } catch (e) {
      // Ignore if constraint doesn't exist
    }

    try {
      await queryRunner.query(
        `ALTER TABLE payment_documents ADD CONSTRAINT FK_payment_documents_payment_id 
         FOREIGN KEY (payment_id) REFERENCES contract_payments(id) ON DELETE CASCADE`,
      );
    } catch (e) {
      // Ignore if constraint already exists
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if contract_payments table exists
    const contractPaymentsTableExists = await queryRunner.hasTable('contract_payments');
    
    if (contractPaymentsTableExists) {
      // Rename back to payments
      await queryRunner.renameTable('contract_payments', 'payments');
    }

    // Restore foreign key
    try {
      await queryRunner.query(
        `ALTER TABLE payment_documents DROP FOREIGN KEY FK_payment_documents_payment_id`,
      );
    } catch (e) {
      // Ignore if constraint doesn't exist
    }

    try {
      await queryRunner.query(
        `ALTER TABLE payment_documents ADD CONSTRAINT FK_payment_documents_payment_id 
         FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE`,
      );
    } catch (e) {
      // Ignore if constraint already exists
    }
  }
}
