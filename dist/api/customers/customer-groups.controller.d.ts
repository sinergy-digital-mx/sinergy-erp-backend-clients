import { CustomerGroupsService } from './customer-groups.service';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';
export declare class CustomerGroupsController {
    private groupsService;
    constructor(groupsService: CustomerGroupsService);
    create(dto: CreateCustomerGroupDto, req: any): Promise<import("./customer-groups.service").CustomerGroupResponse>;
    findAll(req: any): Promise<import("./customer-groups.service").CustomerGroupResponse[]>;
    findOne(id: string, req: any): Promise<import("./customer-groups.service").CustomerGroupResponse>;
    update(id: string, dto: UpdateCustomerGroupDto, req: any): Promise<import("./customer-groups.service").CustomerGroupResponse>;
    remove(id: string, req: any): Promise<{
        deleted: true;
    }>;
    private organizationId;
}
