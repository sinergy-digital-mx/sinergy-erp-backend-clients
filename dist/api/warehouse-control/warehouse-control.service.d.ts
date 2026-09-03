import { DataSource, Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { ControlDeskJob } from '../../entities/control-desk/control-desk-job.entity';
import { ControlDeskPickTask } from '../../entities/control-desk/control-desk-pick-task.entity';
import { ControlDeskPosition } from '../../entities/control-desk/control-desk-position.entity';
import { UserWarehouseAssignment } from '../../entities/control-desk/user-warehouse-assignment.entity';
import { SalesOrderFulfillmentService } from '../sales-orders/services/sales-order-fulfillment.service';
import { ControlDeskLifecycleService } from './control-desk-lifecycle.service';
import { QueryControlDeskBoardDto } from './dto/query-control-desk-board.dto';
import { AssignPositionDto } from './dto/assign-position.dto';
import { CompletePickTaskDto } from './dto/complete-pick-task.dto';
import { CorroborateSalesOrderDto } from './dto/corroborate-sales-order.dto';
import { CreateControlDeskPositionDto } from './dto/create-control-desk-position.dto';
import { UpdateControlDeskPositionDto } from './dto/update-control-desk-position.dto';
import { QueryControlDeskPositionsDto } from './dto/query-control-desk-positions.dto';
type Actor = {
    userId: string;
    hasAdminRole: boolean;
};
export declare class WarehouseControlService {
    private readonly soRepo;
    private readonly jobRepo;
    private readonly taskRepo;
    private readonly positionRepo;
    private readonly assignmentRepo;
    private readonly branchRepo;
    private readonly warehouseRepo;
    private readonly fulfillmentService;
    private readonly lifecycle;
    private readonly dataSource;
    private readonly logger;
    constructor(soRepo: Repository<SalesOrder>, jobRepo: Repository<ControlDeskJob>, taskRepo: Repository<ControlDeskPickTask>, positionRepo: Repository<ControlDeskPosition>, assignmentRepo: Repository<UserWarehouseAssignment>, branchRepo: Repository<BillingBranch>, warehouseRepo: Repository<Warehouse>, fulfillmentService: SalesOrderFulfillmentService, lifecycle: ControlDeskLifecycleService, dataSource: DataSource);
    getBoard(tenantId: string, actor: Actor, filters: QueryControlDeskBoardDto): Promise<{
        view: string;
        scope_label: string | null;
        assigned_warehouses: {
            id: string;
            name: string;
            code: string;
            billing_branch_id: string;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
            } | null;
        }[];
        billing_branches: {
            id: string;
            code: string;
            display_name: string;
        }[];
        billing_branch_id: string | null;
        stats: {
            warehouse: {
                pending: number;
                in_progress: number;
                picked_today: number;
            };
            in_desk: number;
            released: number;
            picking: number;
            waiting_assembly: number;
            assembling: number;
            assembled: number;
            with_shortage: number;
            positions_free: number;
            positions_occupied: number;
        };
        positions: never[] | {
            id: string;
            code: string;
            name: string | null;
            row: number;
            col: number;
            sort_order: number;
            is_active: boolean;
            occupied: boolean;
            job: {
                id: string;
                folio: string;
                customer_name: string | null;
                customer_display_name: string | null;
                expected_delivery_date: Date;
                status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
                has_shortage: boolean;
                created_at: Date;
                sales_order: {
                    id: string;
                    folio: string;
                    general_status: string;
                    expected_delivery_date: Date;
                    notes: string | null;
                    total: number;
                    created_at: Date;
                    customer_display_name: string | null;
                    customer: {
                        id: number;
                        name: string;
                        lastname: string;
                        display_name: string | null;
                        phone: string;
                        company_name: string;
                    } | null;
                } | null;
                billing_branch: {
                    id: string;
                    code: string;
                    display_name: string;
                } | null;
                position: {
                    id: string;
                    code: string;
                    name: string | null;
                    row: number;
                    col: number;
                } | null;
                progress: {
                    warehouses_done: number;
                    warehouses_total: number;
                };
                tasks: {
                    id: string;
                    status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
                    warehouse: {
                        id: string;
                        name: string;
                        code: string;
                    } | null;
                    started_at: Date | null;
                    completed_at: Date | null;
                    started_by_user: {
                        id: string;
                        first_name: string;
                        last_name: string;
                        pos_user_code: number | null;
                        pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                    } | null;
                    completed_by_user: {
                        id: string;
                        first_name: string;
                        last_name: string;
                        pos_user_code: number | null;
                        pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                    } | null;
                    lines_count: number;
                    quantity_requested_total: number;
                    lines: {
                        id: string;
                        sales_order_detail_id: string;
                        product_id: string;
                        product_name: string;
                        product_sku: string;
                        quantity: number;
                        quantity_picked: number;
                        uom_name: string;
                        quantity_base_requested: number;
                        quantity_base_picked: number;
                        quantity_base_missing: number;
                        status: "pending" | "cancelled" | "short" | "picked";
                    }[];
                }[];
                pick_tasks: {
                    id: string;
                    status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
                    warehouse: {
                        id: string;
                        name: string;
                        code: string;
                    } | null;
                    started_at: Date | null;
                    completed_at: Date | null;
                    started_by_user: {
                        id: string;
                        first_name: string;
                        last_name: string;
                        pos_user_code: number | null;
                        pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                    } | null;
                    completed_by_user: {
                        id: string;
                        first_name: string;
                        last_name: string;
                        pos_user_code: number | null;
                        pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                    } | null;
                    lines_count: number;
                    quantity_requested_total: number;
                    lines: {
                        id: string;
                        sales_order_detail_id: string;
                        product_id: string;
                        product_name: string;
                        product_sku: string;
                        quantity: number;
                        quantity_picked: number;
                        uom_name: string;
                        quantity_base_requested: number;
                        quantity_base_picked: number;
                        quantity_base_missing: number;
                        status: "pending" | "cancelled" | "short" | "picked";
                    }[];
                }[];
                missing: {
                    warehouse_id: string | null;
                    warehouse_name: string | null;
                    product_name: string;
                    product_sku: string;
                    quantity_base_missing: number;
                }[];
            } | null;
        }[];
        queue: {
            id: string;
            folio: string;
            customer_name: string | null;
            customer_display_name: string | null;
            expected_delivery_date: Date;
            status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
            has_shortage: boolean;
            created_at: Date;
            sales_order: {
                id: string;
                folio: string;
                general_status: string;
                expected_delivery_date: Date;
                notes: string | null;
                total: number;
                created_at: Date;
                customer_display_name: string | null;
                customer: {
                    id: number;
                    name: string;
                    lastname: string;
                    display_name: string | null;
                    phone: string;
                    company_name: string;
                } | null;
            } | null;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
            } | null;
            position: {
                id: string;
                code: string;
                name: string | null;
                row: number;
                col: number;
            } | null;
            progress: {
                warehouses_done: number;
                warehouses_total: number;
            };
            tasks: {
                id: string;
                status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
                warehouse: {
                    id: string;
                    name: string;
                    code: string;
                } | null;
                started_at: Date | null;
                completed_at: Date | null;
                started_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                completed_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                lines_count: number;
                quantity_requested_total: number;
                lines: {
                    id: string;
                    sales_order_detail_id: string;
                    product_id: string;
                    product_name: string;
                    product_sku: string;
                    quantity: number;
                    quantity_picked: number;
                    uom_name: string;
                    quantity_base_requested: number;
                    quantity_base_picked: number;
                    quantity_base_missing: number;
                    status: "pending" | "cancelled" | "short" | "picked";
                }[];
            }[];
            pick_tasks: {
                id: string;
                status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
                warehouse: {
                    id: string;
                    name: string;
                    code: string;
                } | null;
                started_at: Date | null;
                completed_at: Date | null;
                started_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                completed_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                lines_count: number;
                quantity_requested_total: number;
                lines: {
                    id: string;
                    sales_order_detail_id: string;
                    product_id: string;
                    product_name: string;
                    product_sku: string;
                    quantity: number;
                    quantity_picked: number;
                    uom_name: string;
                    quantity_base_requested: number;
                    quantity_base_picked: number;
                    quantity_base_missing: number;
                    status: "pending" | "cancelled" | "short" | "picked";
                }[];
            }[];
            missing: {
                warehouse_id: string | null;
                warehouse_name: string | null;
                product_name: string;
                product_sku: string;
                quantity_base_missing: number;
            }[];
        }[];
        jobs: {
            id: string;
            folio: string;
            customer_name: string | null;
            customer_display_name: string | null;
            expected_delivery_date: Date;
            status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
            has_shortage: boolean;
            created_at: Date;
            sales_order: {
                id: string;
                folio: string;
                general_status: string;
                expected_delivery_date: Date;
                notes: string | null;
                total: number;
                created_at: Date;
                customer_display_name: string | null;
                customer: {
                    id: number;
                    name: string;
                    lastname: string;
                    display_name: string | null;
                    phone: string;
                    company_name: string;
                } | null;
            } | null;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
            } | null;
            position: {
                id: string;
                code: string;
                name: string | null;
                row: number;
                col: number;
            } | null;
            progress: {
                warehouses_done: number;
                warehouses_total: number;
            };
            tasks: {
                id: string;
                status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
                warehouse: {
                    id: string;
                    name: string;
                    code: string;
                } | null;
                started_at: Date | null;
                completed_at: Date | null;
                started_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                completed_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                lines_count: number;
                quantity_requested_total: number;
                lines: {
                    id: string;
                    sales_order_detail_id: string;
                    product_id: string;
                    product_name: string;
                    product_sku: string;
                    quantity: number;
                    quantity_picked: number;
                    uom_name: string;
                    quantity_base_requested: number;
                    quantity_base_picked: number;
                    quantity_base_missing: number;
                    status: "pending" | "cancelled" | "short" | "picked";
                }[];
            }[];
            pick_tasks: {
                id: string;
                status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
                warehouse: {
                    id: string;
                    name: string;
                    code: string;
                } | null;
                started_at: Date | null;
                completed_at: Date | null;
                started_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                completed_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                lines_count: number;
                quantity_requested_total: number;
                lines: {
                    id: string;
                    sales_order_detail_id: string;
                    product_id: string;
                    product_name: string;
                    product_sku: string;
                    quantity: number;
                    quantity_picked: number;
                    uom_name: string;
                    quantity_base_requested: number;
                    quantity_base_picked: number;
                    quantity_base_missing: number;
                    status: "pending" | "cancelled" | "short" | "picked";
                }[];
            }[];
            missing: {
                warehouse_id: string | null;
                warehouse_name: string | null;
                product_name: string;
                product_sku: string;
                quantity_base_missing: number;
            }[];
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(tenantId: string, actor: Actor, filters: QueryControlDeskBoardDto): Promise<{
        view: string;
        scope_label: string | null;
        assigned_warehouses: {
            id: string;
            name: string;
            code: string;
            billing_branch_id: string;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
            } | null;
        }[];
        billing_branches: {
            id: string;
            code: string;
            display_name: string;
        }[];
        billing_branch_id: string | null;
        stats: {
            warehouse: {
                pending: number;
                in_progress: number;
                picked_today: number;
            };
            in_desk: number;
            released: number;
            picking: number;
            waiting_assembly: number;
            assembling: number;
            assembled: number;
            with_shortage: number;
            positions_free: number;
            positions_occupied: number;
        };
    }>;
    findOneJob(id: string, tenantId: string, actor: Actor): Promise<{
        id: string;
        folio: string;
        customer_name: string | null;
        customer_display_name: string | null;
        expected_delivery_date: Date;
        status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
        has_shortage: boolean;
        created_at: Date;
        sales_order: {
            id: string;
            folio: string;
            general_status: string;
            expected_delivery_date: Date;
            notes: string | null;
            total: number;
            created_at: Date;
            customer_display_name: string | null;
            customer: {
                id: number;
                name: string;
                lastname: string;
                display_name: string | null;
                phone: string;
                company_name: string;
            } | null;
        } | null;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
        } | null;
        position: {
            id: string;
            code: string;
            name: string | null;
            row: number;
            col: number;
        } | null;
        progress: {
            warehouses_done: number;
            warehouses_total: number;
        };
        tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        pick_tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        missing: {
            warehouse_id: string | null;
            warehouse_name: string | null;
            product_name: string;
            product_sku: string;
            quantity_base_missing: number;
        }[];
    }>;
    assignPosition(jobId: string, dto: AssignPositionDto, tenantId: string, actor: Actor): Promise<{
        id: string;
        folio: string;
        customer_name: string | null;
        customer_display_name: string | null;
        expected_delivery_date: Date;
        status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
        has_shortage: boolean;
        created_at: Date;
        sales_order: {
            id: string;
            folio: string;
            general_status: string;
            expected_delivery_date: Date;
            notes: string | null;
            total: number;
            created_at: Date;
            customer_display_name: string | null;
            customer: {
                id: number;
                name: string;
                lastname: string;
                display_name: string | null;
                phone: string;
                company_name: string;
            } | null;
        } | null;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
        } | null;
        position: {
            id: string;
            code: string;
            name: string | null;
            row: number;
            col: number;
        } | null;
        progress: {
            warehouses_done: number;
            warehouses_total: number;
        };
        tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        pick_tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        missing: {
            warehouse_id: string | null;
            warehouse_name: string | null;
            product_name: string;
            product_sku: string;
            quantity_base_missing: number;
        }[];
    }>;
    startTask(jobId: string, taskId: string, tenantId: string, actor: Actor): Promise<{
        id: string;
        folio: string;
        customer_name: string | null;
        customer_display_name: string | null;
        expected_delivery_date: Date;
        status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
        has_shortage: boolean;
        created_at: Date;
        sales_order: {
            id: string;
            folio: string;
            general_status: string;
            expected_delivery_date: Date;
            notes: string | null;
            total: number;
            created_at: Date;
            customer_display_name: string | null;
            customer: {
                id: number;
                name: string;
                lastname: string;
                display_name: string | null;
                phone: string;
                company_name: string;
            } | null;
        } | null;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
        } | null;
        position: {
            id: string;
            code: string;
            name: string | null;
            row: number;
            col: number;
        } | null;
        progress: {
            warehouses_done: number;
            warehouses_total: number;
        };
        tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        pick_tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        missing: {
            warehouse_id: string | null;
            warehouse_name: string | null;
            product_name: string;
            product_sku: string;
            quantity_base_missing: number;
        }[];
    }>;
    completeTask(jobId: string, taskId: string, dto: CompletePickTaskDto, tenantId: string, actor: Actor): Promise<{
        id: string;
        folio: string;
        customer_name: string | null;
        customer_display_name: string | null;
        expected_delivery_date: Date;
        status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
        has_shortage: boolean;
        created_at: Date;
        sales_order: {
            id: string;
            folio: string;
            general_status: string;
            expected_delivery_date: Date;
            notes: string | null;
            total: number;
            created_at: Date;
            customer_display_name: string | null;
            customer: {
                id: number;
                name: string;
                lastname: string;
                display_name: string | null;
                phone: string;
                company_name: string;
            } | null;
        } | null;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
        } | null;
        position: {
            id: string;
            code: string;
            name: string | null;
            row: number;
            col: number;
        } | null;
        progress: {
            warehouses_done: number;
            warehouses_total: number;
        };
        tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        pick_tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        missing: {
            warehouse_id: string | null;
            warehouse_name: string | null;
            product_name: string;
            product_sku: string;
            quantity_base_missing: number;
        }[];
    }>;
    assemble(jobId: string, tenantId: string, actor: Actor): Promise<{
        id: string;
        folio: string;
        customer_name: string | null;
        customer_display_name: string | null;
        expected_delivery_date: Date;
        status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
        has_shortage: boolean;
        created_at: Date;
        sales_order: {
            id: string;
            folio: string;
            general_status: string;
            expected_delivery_date: Date;
            notes: string | null;
            total: number;
            created_at: Date;
            customer_display_name: string | null;
            customer: {
                id: number;
                name: string;
                lastname: string;
                display_name: string | null;
                phone: string;
                company_name: string;
            } | null;
        } | null;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
        } | null;
        position: {
            id: string;
            code: string;
            name: string | null;
            row: number;
            col: number;
        } | null;
        progress: {
            warehouses_done: number;
            warehouses_total: number;
        };
        tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        pick_tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        missing: {
            warehouse_id: string | null;
            warehouse_name: string | null;
            product_name: string;
            product_sku: string;
            quantity_base_missing: number;
        }[];
    }>;
    corroborate(jobId: string, dto: CorroborateSalesOrderDto, tenantId: string, actor: Actor): Promise<{
        id: string;
        folio: string;
        customer_name: string | null;
        customer_display_name: string | null;
        expected_delivery_date: Date;
        status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
        has_shortage: boolean;
        created_at: Date;
        sales_order: {
            id: string;
            folio: string;
            general_status: string;
            expected_delivery_date: Date;
            notes: string | null;
            total: number;
            created_at: Date;
            customer_display_name: string | null;
            customer: {
                id: number;
                name: string;
                lastname: string;
                display_name: string | null;
                phone: string;
                company_name: string;
            } | null;
        } | null;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
        } | null;
        position: {
            id: string;
            code: string;
            name: string | null;
            row: number;
            col: number;
        } | null;
        progress: {
            warehouses_done: number;
            warehouses_total: number;
        };
        tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        pick_tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        missing: {
            warehouse_id: string | null;
            warehouse_name: string | null;
            product_name: string;
            product_sku: string;
            quantity_base_missing: number;
        }[];
    }>;
    listPositions(tenantId: string, query: QueryControlDeskPositionsDto): Promise<{
        id: string;
        code: string;
        name: string | null;
        row: number;
        col: number;
        sort_order: number;
        is_active: boolean;
        occupied: boolean;
        job: {
            id: string;
            folio: string;
            customer_name: string | null;
            customer_display_name: string | null;
            expected_delivery_date: Date;
            status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
            has_shortage: boolean;
            created_at: Date;
            sales_order: {
                id: string;
                folio: string;
                general_status: string;
                expected_delivery_date: Date;
                notes: string | null;
                total: number;
                created_at: Date;
                customer_display_name: string | null;
                customer: {
                    id: number;
                    name: string;
                    lastname: string;
                    display_name: string | null;
                    phone: string;
                    company_name: string;
                } | null;
            } | null;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
            } | null;
            position: {
                id: string;
                code: string;
                name: string | null;
                row: number;
                col: number;
            } | null;
            progress: {
                warehouses_done: number;
                warehouses_total: number;
            };
            tasks: {
                id: string;
                status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
                warehouse: {
                    id: string;
                    name: string;
                    code: string;
                } | null;
                started_at: Date | null;
                completed_at: Date | null;
                started_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                completed_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                lines_count: number;
                quantity_requested_total: number;
                lines: {
                    id: string;
                    sales_order_detail_id: string;
                    product_id: string;
                    product_name: string;
                    product_sku: string;
                    quantity: number;
                    quantity_picked: number;
                    uom_name: string;
                    quantity_base_requested: number;
                    quantity_base_picked: number;
                    quantity_base_missing: number;
                    status: "pending" | "cancelled" | "short" | "picked";
                }[];
            }[];
            pick_tasks: {
                id: string;
                status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
                warehouse: {
                    id: string;
                    name: string;
                    code: string;
                } | null;
                started_at: Date | null;
                completed_at: Date | null;
                started_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                completed_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                lines_count: number;
                quantity_requested_total: number;
                lines: {
                    id: string;
                    sales_order_detail_id: string;
                    product_id: string;
                    product_name: string;
                    product_sku: string;
                    quantity: number;
                    quantity_picked: number;
                    uom_name: string;
                    quantity_base_requested: number;
                    quantity_base_picked: number;
                    quantity_base_missing: number;
                    status: "pending" | "cancelled" | "short" | "picked";
                }[];
            }[];
            missing: {
                warehouse_id: string | null;
                warehouse_name: string | null;
                product_name: string;
                product_sku: string;
                quantity_base_missing: number;
            }[];
        } | null;
    }[]>;
    createPosition(tenantId: string, dto: CreateControlDeskPositionDto): Promise<ControlDeskPosition>;
    updatePosition(id: string, tenantId: string, dto: UpdateControlDeskPositionDto): Promise<ControlDeskPosition>;
    deletePosition(id: string, tenantId: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    getSalesOrderSummary(salesOrderId: string, tenantId: string): Promise<{
        id: string;
        folio: string;
        customer_name: string | null;
        customer_display_name: string | null;
        expected_delivery_date: Date;
        status: "cancelled" | "released" | "picking" | "waiting_assembly" | "assembling" | "assembled";
        has_shortage: boolean;
        created_at: Date;
        sales_order: {
            id: string;
            folio: string;
            general_status: string;
            expected_delivery_date: Date;
            notes: string | null;
            total: number;
            created_at: Date;
            customer_display_name: string | null;
            customer: {
                id: number;
                name: string;
                lastname: string;
                display_name: string | null;
                phone: string;
                company_name: string;
            } | null;
        } | null;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
        } | null;
        position: {
            id: string;
            code: string;
            name: string | null;
            row: number;
            col: number;
        } | null;
        progress: {
            warehouses_done: number;
            warehouses_total: number;
        };
        tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        pick_tasks: {
            id: string;
            status: "pending" | "cancelled" | "in_progress" | "short" | "picked";
            warehouse: {
                id: string;
                name: string;
                code: string;
            } | null;
            started_at: Date | null;
            completed_at: Date | null;
            started_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            completed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            lines_count: number;
            quantity_requested_total: number;
            lines: {
                id: string;
                sales_order_detail_id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                quantity: number;
                quantity_picked: number;
                uom_name: string;
                quantity_base_requested: number;
                quantity_base_picked: number;
                quantity_base_missing: number;
                status: "pending" | "cancelled" | "short" | "picked";
            }[];
        }[];
        missing: {
            warehouse_id: string | null;
            warehouse_name: string | null;
            product_name: string;
            product_sku: string;
            quantity_base_missing: number;
        }[];
    } | null>;
    private ensureJobsForOpenOrders;
    private resolveScope;
    private uniqueBranches;
    private formatBranch;
    private getAssignedWarehouses;
    private buildStats;
    private listPositionsInternal;
    private mapJob;
    private mapTask;
    private toQty;
    private toSalesUomQty;
    private loadJobOrFail;
    private requireTask;
    private assertTasksTerminal;
    private assertCanActOnWarehouse;
    private assertAdminOrUnscoped;
    private requirePosition;
    private nextFreePosition;
    private assertBranch;
}
export {};
