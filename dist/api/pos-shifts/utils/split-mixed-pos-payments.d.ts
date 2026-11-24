import { QueryRunner } from 'typeorm';
export type SplitMixedPosPaymentsResult = {
    split: number;
    skipped: number;
};
export declare function splitMixedPosPayments(queryRunner: QueryRunner): Promise<SplitMixedPosPaymentsResult>;
