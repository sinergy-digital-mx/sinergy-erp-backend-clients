import { Repository } from 'typeorm';
import { CustomerGroup } from '../../entities/customers/customer-group.entity';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';
export type CustomerGroupResponse = {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
    customer_count: number;
    created_at: Date;
    updated_at: Date;
};
export type CustomerGroupOption = {
    id: string;
    name: string;
};
export declare class CustomerGroupsService {
    private groupRepo;
    constructor(groupRepo: Repository<CustomerGroup>);
    create(dto: CreateCustomerGroupDto, organizationId: string): Promise<CustomerGroupResponse>;
    findAll(organizationId: string): Promise<CustomerGroupResponse[]>;
    findOptions(organizationId: string): Promise<CustomerGroupOption[]>;
    findOne(id: string, organizationId: string): Promise<CustomerGroupResponse>;
    update(id: string, dto: UpdateCustomerGroupDto, organizationId: string): Promise<CustomerGroupResponse>;
    remove(id: string, organizationId: string): Promise<{
        deleted: true;
    }>;
    assertBelongsToOrganization(groupId: string | null | undefined, organizationId: string): Promise<string | null>;
    private assertUniqueName;
    private toGroupResponse;
}
