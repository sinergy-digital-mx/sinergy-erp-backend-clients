import { WarehouseControlService } from './warehouse-control.service';
import { QueryControlDeskBoardDto } from './dto/query-control-desk-board.dto';
import { AssignPositionDto } from './dto/assign-position.dto';
import { CompletePickTaskDto } from './dto/complete-pick-task.dto';
import { CorroborateSalesOrderDto } from './dto/corroborate-sales-order.dto';
import { CreateControlDeskPositionDto } from './dto/create-control-desk-position.dto';
import { UpdateControlDeskPositionDto } from './dto/update-control-desk-position.dto';
import { QueryControlDeskPositionsDto } from './dto/query-control-desk-positions.dto';
export declare class WarehouseControlController {
    private readonly service;
    constructor(service: WarehouseControlService);
    getBoard(query: QueryControlDeskBoardDto, req: any): Promise<{
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
    getStats(query: QueryControlDeskBoardDto, req: any): Promise<{
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
    listPositions(query: QueryControlDeskPositionsDto, req: any): Promise<{
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
    createPosition(dto: CreateControlDeskPositionDto, req: any): Promise<import("../../entities/control-desk").ControlDeskPosition>;
    updatePosition(positionId: string, dto: UpdateControlDeskPositionDto, req: any): Promise<import("../../entities/control-desk").ControlDeskPosition>;
    deletePosition(positionId: string, req: any): Promise<{
        id: string;
        deleted: boolean;
    }>;
    findOne(jobId: string, req: any): Promise<{
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
    assignPosition(jobId: string, dto: AssignPositionDto, req: any): Promise<{
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
    startTask(jobId: string, taskId: string, req: any): Promise<{
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
    completeTask(jobId: string, taskId: string, dto: CompletePickTaskDto, req: any): Promise<{
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
    assemble(jobId: string, req: any): Promise<{
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
    corroborate(jobId: string, dto: CorroborateSalesOrderDto, req: any): Promise<{
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
    private actor;
}
