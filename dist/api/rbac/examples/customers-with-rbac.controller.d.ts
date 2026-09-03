interface CreateCustomerDto {
    name: string;
    email: string;
}
interface UpdateCustomerDto {
    name?: string;
    email?: string;
}
export declare class CustomersWithRBACController {
    create(dto: CreateCustomerDto, req: any): {
        message: string;
        tenantId: any;
        data: CreateCustomerDto;
    };
    update(id: string, dto: UpdateCustomerDto, req: any): {
        message: string;
        tenantId: any;
        data: UpdateCustomerDto;
    };
    findAll(req: any): {
        message: string;
        tenantId: any;
        data: never[];
    };
    findOne(id: string, req: any): {
        message: string;
        tenantId: any;
        data: {
            id: string;
            name: string;
        };
    };
}
export {};
