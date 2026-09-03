import { Repository } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
import { AssignmentChangeItem, CustomerAssignmentChange } from '../../../entities/customers/customer-assignment-change.entity';
import { AssignmentHistoryRow } from '../../../common/utils/assignment-change.util';
export type RecordCustomerAssignmentInput = {
    tenantId: string;
    customerId: number;
    actorId: string | null;
    type?: 'assignment_initialized' | 'assignment_updated';
    changes: AssignmentChangeItem[];
    occurredAt?: Date;
};
export declare class CustomerAssignmentService {
    private readonly changeRepo;
    private readonly customerRepo;
    constructor(changeRepo: Repository<CustomerAssignmentChange>, customerRepo: Repository<Customer>);
    record(input: RecordCustomerAssignmentInput): Promise<void>;
    listForCustomer(customerId: number, tenantId: string): Promise<AssignmentHistoryRow[]>;
    listForExistingCustomer(customerId: number, tenantId: string): Promise<AssignmentHistoryRow[]>;
    private seedCurrentAssignmentIfEmpty;
    private mapRow;
}
