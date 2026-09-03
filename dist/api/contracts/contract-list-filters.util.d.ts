import { SelectQueryBuilder } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
export type ContractListFilters = {
    customerId?: number;
    propertyId?: string;
    status?: string;
    hasOverdue?: boolean;
    search?: string;
    group_id?: string;
};
export declare function joinContractFilterRelations(query: SelectQueryBuilder<Contract>, opts?: {
    select?: boolean;
}): void;
export declare function applyContractListFilters(query: SelectQueryBuilder<Contract>, filters: ContractListFilters): void;
