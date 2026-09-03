export declare class ProtectedCustomersController {
    findAll(req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
    findOne(id: string, req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
    create(createDto: any, req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
    update(id: string, updateDto: any, req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
    bulkImport(importData: any, req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
    exportCustomers(req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
    getDashboard(req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
}
export declare class AdminController {
    getUsers(req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
    createUser(createDto: any, req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
    deleteUser(id: string, req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
}
export declare class MixedAccessController {
    getPublicInfo(): Promise<{
        message: string;
    }>;
    getProtectedInfo(req: any): Promise<{
        message: string;
        tenantId: any;
    }>;
}
