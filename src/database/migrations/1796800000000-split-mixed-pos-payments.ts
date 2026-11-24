import { MigrationInterface, QueryRunner } from 'typeorm';
import { splitMixedPosPayments } from '../../api/pos-shifts/utils/split-mixed-pos-payments';

/**
 * Un cobro mixto de POS se guardaba como un solo pago "Mixto" con una referencia.
 * Cada medio (y cada tarjeta) pasa a ser su propio pago. La suma no cambia.
 */
export class SplitMixedPosPayments1796800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await splitMixedPosPayments(queryRunner);
    console.log(
      `Cobros mixtos de POS separados: ${result.split}. Omitidos: ${result.skipped}.`,
    );
  }

  public async down(): Promise<void> {
    // Los pagos ya quedaron como efectivo, tarjeta, transferencia o cheque.
  }
}
