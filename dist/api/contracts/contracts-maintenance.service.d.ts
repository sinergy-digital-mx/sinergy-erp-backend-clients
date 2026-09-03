import { DataSource } from 'typeorm';
export declare class ContractsMaintenanceService {
    private dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    updateOverdueAndBalance(): Promise<void>;
}
