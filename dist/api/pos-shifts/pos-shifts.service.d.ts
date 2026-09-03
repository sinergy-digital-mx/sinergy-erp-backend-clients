import { Repository } from 'typeorm';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosPartialShift } from '../../entities/pos/pos-partial-shift.entity';
import { PosDailyShiftStatus } from '../../entities/pos/pos-daily-shift-status.enum';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { PosSalePaymentMethod } from '../../entities/pos/pos-sale-payment-method.enum';
import { User } from '../../entities/users/user.entity';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { OpenDailyShiftDto } from './dto/open-daily-shift.dto';
import { CreatePartialShiftDto } from './dto/create-partial-shift.dto';
import { QueryDailyShiftDto } from './dto/query-daily-shift.dto';
import { CloseDailyShiftDto } from './dto/close-daily-shift.dto';
import { CollectPosSaleDto } from './dto/collect-pos-sale.dto';
import { SalesOrderPosReceiptService, PosReceiptResult } from '../sales-orders/services/sales-order-pos-receipt.service';
import { SalesOrderService } from '../sales-orders/services/sales-order.service';
import { CustomerCreditService } from '../customers/services/customer-credit.service';
export declare class PosShiftsService {
    private readonly dailyShiftRepo;
    private readonly partialShiftRepo;
    private readonly userRepo;
    private readonly salesOrderRepo;
    private readonly customerRepo;
    private readonly warehouseRepo;
    private readonly collectionRepo;
    private readonly posReceiptService;
    private readonly salesOrderService;
    private readonly customerCreditService;
    private readonly logger;
    constructor(dailyShiftRepo: Repository<PosDailyShift>, partialShiftRepo: Repository<PosPartialShift>, userRepo: Repository<User>, salesOrderRepo: Repository<SalesOrder>, customerRepo: Repository<Customer>, warehouseRepo: Repository<Warehouse>, collectionRepo: Repository<PosSaleCollection>, posReceiptService: SalesOrderPosReceiptService, salesOrderService: SalesOrderService, customerCreditService: CustomerCreditService);
    validateSellerCode(tenantId: string, terminalUserId: string, code: number): Promise<{
        seller: {
            id: string;
            first_name: string;
            last_name: string;
            email: string | null;
            pos_user_code: number | null;
        };
        terminal_user: {
            id: string;
            first_name: string;
            last_name: string;
            email: string | null;
            billing_branch_id: string | null;
            pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            billing_branch: {
                id: string;
                code: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
        };
        daily_shift: {
            id: string;
            shift_date: string;
            status: PosDailyShiftStatus;
            opening_cash_mxn: number;
            opening_cash_usd: number;
        } | null;
        requires_daily_shift: boolean;
        pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
    }>;
    getCurrentDailyShift(tenantId: string, terminalUserId: string): Promise<PosDailyShift | null>;
    getCurrentDailyShiftResponse(tenantId: string, terminalUserId: string): Promise<{
        daily_shift: {
            id: string;
            shift_date: string;
            status: PosDailyShiftStatus;
            is_previous_day: boolean;
            opening_cash_mxn: number;
            opening_cash_usd: number;
            closed_at: Date | null;
            notes: string | null;
            created_at: Date;
            updated_at: Date;
            terminal_user: {
                id: string;
                first_name: string;
                last_name: string;
                email: string | null;
                billing_branch_id: string | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                billing_branch: {
                    id: string;
                    code: string;
                    fiscal_configuration: {
                        id: string;
                        razon_social: string;
                        rfc: string;
                    } | null;
                } | null;
            } | null;
            billing_branch_id: string;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
            sales_summary: {
                total_mxn: number;
                sales_count: number;
                seller_user_ids: string[];
                sellers_count: number;
            };
            partial_shifts: {
                id: string;
                partial_number: number;
                removed_total_mxn: number;
                removed_total_usd: number;
                total_mxn: number;
                total_usd: number;
                sales_total_mxn: number;
                sales_count: number;
                notes: string | null;
                created_at: Date;
                performed_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    email: string | null;
                    pos_user_code: number | null;
                } | null;
                denominations: {
                    id: string;
                    currency: "MXN" | "USD";
                    denomination: number;
                    bill_count: number;
                    amount: number;
                }[];
            }[];
            totals: {
                partial_shifts_count: number;
                removed_total_mxn: number;
                removed_total_usd: number;
                sales_total_mxn: number;
            };
            cash_drawer: {
                opening_cash_mxn: number;
                opening_cash_usd: number;
                collected_cash_mxn: number;
                collected_cash_usd: number;
                collected_transfer_mxn: number;
                collected_card_mxn: number;
                collected_credit_mxn: number;
                removed_total_mxn: number;
                removed_total_usd: number;
                expected_cash_mxn: number;
                expected_cash_usd: number;
                closing_cash_mxn: number | null;
                closing_cash_usd: number | null;
                cash_difference_mxn: number | null;
                cash_difference_usd: number | null;
                closing_denominations: {
                    currency: "MXN" | "USD";
                    denomination: number;
                    bill_count: number;
                    amount: number;
                }[] | null;
            };
        } | null;
        requires_previous_close: boolean;
        unclosed_shift_alert: import("./utils/unclosed-shift-alert").UnclosedShiftAlert | null;
    }>;
    resolveOpenDailyShiftId(tenantId: string, terminalUserId: string): Promise<string>;
    getBranchOpenDailyShift(tenantId: string, billingBranchId: string): Promise<PosDailyShift | null>;
    private buildOpenShiftConflictMessage;
    openDailyShift(tenantId: string, terminalUserId: string, dto: OpenDailyShiftDto): Promise<{
        shift: {
            id: string;
            shift_date: string;
            status: PosDailyShiftStatus;
            is_previous_day: boolean;
            opening_cash_mxn: number;
            opening_cash_usd: number;
            closed_at: Date | null;
            notes: string | null;
            created_at: Date;
            updated_at: Date;
            terminal_user: {
                id: string;
                first_name: string;
                last_name: string;
                email: string | null;
                billing_branch_id: string | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                billing_branch: {
                    id: string;
                    code: string;
                    fiscal_configuration: {
                        id: string;
                        razon_social: string;
                        rfc: string;
                    } | null;
                } | null;
            } | null;
            billing_branch_id: string;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
            sales_summary: {
                total_mxn: number;
                sales_count: number;
                seller_user_ids: string[];
                sellers_count: number;
            };
            partial_shifts: {
                id: string;
                partial_number: number;
                removed_total_mxn: number;
                removed_total_usd: number;
                total_mxn: number;
                total_usd: number;
                sales_total_mxn: number;
                sales_count: number;
                notes: string | null;
                created_at: Date;
                performed_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    email: string | null;
                    pos_user_code: number | null;
                } | null;
                denominations: {
                    id: string;
                    currency: "MXN" | "USD";
                    denomination: number;
                    bill_count: number;
                    amount: number;
                }[];
            }[];
            totals: {
                partial_shifts_count: number;
                removed_total_mxn: number;
                removed_total_usd: number;
                sales_total_mxn: number;
            };
            cash_drawer: {
                opening_cash_mxn: number;
                opening_cash_usd: number;
                collected_cash_mxn: number;
                collected_cash_usd: number;
                collected_transfer_mxn: number;
                collected_card_mxn: number;
                collected_credit_mxn: number;
                removed_total_mxn: number;
                removed_total_usd: number;
                expected_cash_mxn: number;
                expected_cash_usd: number;
                closing_cash_mxn: number | null;
                closing_cash_usd: number | null;
                cash_difference_mxn: number | null;
                cash_difference_usd: number | null;
                closing_denominations: {
                    currency: "MXN" | "USD";
                    denomination: number;
                    bill_count: number;
                    amount: number;
                }[] | null;
            };
        };
        queued_sales_assigned: number;
    }>;
    findDailyShiftById(id: string, tenantId: string): Promise<{
        id: string;
        shift_date: string;
        status: PosDailyShiftStatus;
        is_previous_day: boolean;
        opening_cash_mxn: number;
        opening_cash_usd: number;
        closed_at: Date | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
        terminal_user: {
            id: string;
            first_name: string;
            last_name: string;
            email: string | null;
            billing_branch_id: string | null;
            pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            billing_branch: {
                id: string;
                code: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
        } | null;
        billing_branch_id: string;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
            fiscal_configuration: {
                id: string;
                razon_social: string;
                rfc: string;
            } | null;
        } | null;
        sales_summary: {
            total_mxn: number;
            sales_count: number;
            seller_user_ids: string[];
            sellers_count: number;
        };
        partial_shifts: {
            id: string;
            partial_number: number;
            removed_total_mxn: number;
            removed_total_usd: number;
            total_mxn: number;
            total_usd: number;
            sales_total_mxn: number;
            sales_count: number;
            notes: string | null;
            created_at: Date;
            performed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                email: string | null;
                pos_user_code: number | null;
            } | null;
            denominations: {
                id: string;
                currency: "MXN" | "USD";
                denomination: number;
                bill_count: number;
                amount: number;
            }[];
        }[];
        totals: {
            partial_shifts_count: number;
            removed_total_mxn: number;
            removed_total_usd: number;
            sales_total_mxn: number;
        };
        cash_drawer: {
            opening_cash_mxn: number;
            opening_cash_usd: number;
            collected_cash_mxn: number;
            collected_cash_usd: number;
            collected_transfer_mxn: number;
            collected_card_mxn: number;
            collected_credit_mxn: number;
            removed_total_mxn: number;
            removed_total_usd: number;
            expected_cash_mxn: number;
            expected_cash_usd: number;
            closing_cash_mxn: number | null;
            closing_cash_usd: number | null;
            cash_difference_mxn: number | null;
            cash_difference_usd: number | null;
            closing_denominations: {
                currency: "MXN" | "USD";
                denomination: number;
                bill_count: number;
                amount: number;
            }[] | null;
        };
    }>;
    findDailyShifts(tenantId: string, query: QueryDailyShiftDto): Promise<{
        id: string;
        shift_date: string;
        status: PosDailyShiftStatus;
        is_previous_day: boolean;
        opening_cash_mxn: number;
        opening_cash_usd: number;
        closed_at: Date | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
        terminal_user: {
            id: string;
            first_name: string;
            last_name: string;
            email: string | null;
            billing_branch_id: string | null;
            pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            billing_branch: {
                id: string;
                code: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
        } | null;
        billing_branch_id: string;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
            fiscal_configuration: {
                id: string;
                razon_social: string;
                rfc: string;
            } | null;
        } | null;
        sales_summary: {
            total_mxn: number;
            sales_count: number;
            seller_user_ids: string[];
            sellers_count: number;
        };
        partial_shifts: {
            id: string;
            partial_number: number;
            removed_total_mxn: number;
            removed_total_usd: number;
            total_mxn: number;
            total_usd: number;
            sales_total_mxn: number;
            sales_count: number;
            notes: string | null;
            created_at: Date;
            performed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                email: string | null;
                pos_user_code: number | null;
            } | null;
            denominations: {
                id: string;
                currency: "MXN" | "USD";
                denomination: number;
                bill_count: number;
                amount: number;
            }[];
        }[];
        totals: {
            partial_shifts_count: number;
            removed_total_mxn: number;
            removed_total_usd: number;
            sales_total_mxn: number;
        };
        cash_drawer: {
            opening_cash_mxn: number;
            opening_cash_usd: number;
            collected_cash_mxn: number;
            collected_cash_usd: number;
            collected_transfer_mxn: number;
            collected_card_mxn: number;
            collected_credit_mxn: number;
            removed_total_mxn: number;
            removed_total_usd: number;
            expected_cash_mxn: number;
            expected_cash_usd: number;
            closing_cash_mxn: number | null;
            closing_cash_usd: number | null;
            cash_difference_mxn: number | null;
            cash_difference_usd: number | null;
            closing_denominations: {
                currency: "MXN" | "USD";
                denomination: number;
                bill_count: number;
                amount: number;
            }[] | null;
        };
    }[]>;
    createPartialShift(tenantId: string, terminalUserId: string, dailyShiftId: string, dto: CreatePartialShiftDto): Promise<{
        id: string;
        partial_number: number;
        removed_total_mxn: number;
        removed_total_usd: number;
        total_mxn: number;
        total_usd: number;
        sales_total_mxn: number;
        sales_count: number;
        notes: string | null;
        created_at: Date;
        performed_by_user: {
            id: string;
            first_name: string;
            last_name: string;
            email: string | null;
            pos_user_code: number | null;
        } | null;
        denominations: {
            id: string;
            currency: "MXN" | "USD";
            denomination: number;
            bill_count: number;
            amount: number;
        }[];
    }>;
    closeDailyShift(tenantId: string, terminalUserId: string, dailyShiftId: string, dto: CloseDailyShiftDto): Promise<{
        id: string;
        shift_date: string;
        status: PosDailyShiftStatus;
        is_previous_day: boolean;
        opening_cash_mxn: number;
        opening_cash_usd: number;
        closed_at: Date | null;
        notes: string | null;
        created_at: Date;
        updated_at: Date;
        terminal_user: {
            id: string;
            first_name: string;
            last_name: string;
            email: string | null;
            billing_branch_id: string | null;
            pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            billing_branch: {
                id: string;
                code: string;
                fiscal_configuration: {
                    id: string;
                    razon_social: string;
                    rfc: string;
                } | null;
            } | null;
        } | null;
        billing_branch_id: string;
        billing_branch: {
            id: string;
            code: string;
            display_name: string;
            fiscal_configuration: {
                id: string;
                razon_social: string;
                rfc: string;
            } | null;
        } | null;
        sales_summary: {
            total_mxn: number;
            sales_count: number;
            seller_user_ids: string[];
            sellers_count: number;
        };
        partial_shifts: {
            id: string;
            partial_number: number;
            removed_total_mxn: number;
            removed_total_usd: number;
            total_mxn: number;
            total_usd: number;
            sales_total_mxn: number;
            sales_count: number;
            notes: string | null;
            created_at: Date;
            performed_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                email: string | null;
                pos_user_code: number | null;
            } | null;
            denominations: {
                id: string;
                currency: "MXN" | "USD";
                denomination: number;
                bill_count: number;
                amount: number;
            }[];
        }[];
        totals: {
            partial_shifts_count: number;
            removed_total_mxn: number;
            removed_total_usd: number;
            sales_total_mxn: number;
        };
        cash_drawer: {
            opening_cash_mxn: number;
            opening_cash_usd: number;
            collected_cash_mxn: number;
            collected_cash_usd: number;
            collected_transfer_mxn: number;
            collected_card_mxn: number;
            collected_credit_mxn: number;
            removed_total_mxn: number;
            removed_total_usd: number;
            expected_cash_mxn: number;
            expected_cash_usd: number;
            closing_cash_mxn: number | null;
            closing_cash_usd: number | null;
            cash_difference_mxn: number | null;
            cash_difference_usd: number | null;
            closing_denominations: {
                currency: "MXN" | "USD";
                denomination: number;
                bill_count: number;
                amount: number;
            }[] | null;
        };
    }>;
    resolvePosSaleContext(tenantId: string, terminalUserId: string, sellerUserId: string, dailyShiftId?: string): Promise<{
        shift: null;
        terminalUser: User;
        queued: boolean;
    } | {
        shift: PosDailyShift;
        terminalUser: User;
        queued: boolean;
    }>;
    assertPosWarehouseForTerminal(tenantId: string, terminalUserId: string, warehouseId: string): Promise<void>;
    assertOpenShiftForSale(tenantId: string, terminalUserId: string, sellerUserId: string, dailyShiftId?: string): Promise<{
        shift: PosDailyShift;
        terminalUser: User;
    }>;
    resolveWalkInCustomerId(tenantId: string): Promise<number>;
    getPendingSales(tenantId: string, terminalUserId: string): Promise<{
        id: string;
        folio: string;
        total: number;
        amount_pending: number;
        subtotal: number;
        created_at: Date;
        notes: string | null;
        fiscal_configuration_id: string;
        customer: {
            id: number;
            name: string;
            lastname: string;
            company_name: string;
            fiscal_razon_social: string;
            is_walk_in: boolean;
            credit_enabled: boolean;
        } | null;
        seller_user: {
            id: string;
            first_name: string;
            last_name: string;
            pos_user_code: number | null;
        } | null;
        terminal_user: {
            id: string;
            first_name: string;
            last_name: string;
            pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
        } | null;
    }[]>;
    getCollectedSales(tenantId: string, terminalUserId: string, dailyShiftId?: string): Promise<{
        daily_shift: null;
        collected_sales: never[];
        summary: {
            count: number;
            total_mxn: number;
            cash_mxn: number;
            cash_usd: number;
            transfer_mxn: number;
            card_mxn: number;
            credit_mxn: number;
        };
    } | {
        daily_shift: {
            id: string;
            shift_date: string;
            status: PosDailyShiftStatus;
            opening_cash_mxn: number;
            opening_cash_usd: number;
        };
        collected_sales: {
            collection_id: string;
            collected_at: Date;
            payment: {
                id: string;
                sales_order_id: string;
                pos_daily_shift_id: string;
                customer_id: number;
                customer: {
                    id: number;
                    name: string;
                    lastname: string;
                    company_name: string;
                    fiscal_razon_social: string;
                    display_name: string | null;
                    is_walk_in: boolean;
                } | null;
                payment_method: PosSalePaymentMethod;
                order_total_mxn: number;
                amount_cash_mxn: number;
                amount_cash_usd: number;
                usd_exchange_rate: number | null;
                amount_transfer_mxn: number;
                transfer_reference: string | null;
                amount_card_mxn: number;
                amount_credit_mxn: number;
                card_reference: string | null;
                received_cash_mxn: number;
                received_cash_usd: number;
                change_cash_mxn: number;
                change_cash_usd: number;
                collected_by_user_id: string;
                collected_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
                notes: string | null;
                collected_at: Date;
                created_at: Date;
            };
            sales_order: {
                id: string;
                folio: string;
                total: number;
                subtotal: number;
                created_at: Date;
                seller_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_code: number | null;
                } | null;
                terminal_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                    pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
                } | null;
            } | null;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                is_walk_in: boolean;
            } | null;
            collected_by_user: {
                id: string;
                first_name: string;
                last_name: string;
            } | null;
        }[];
        summary: {
            count: number;
            total_mxn: number;
            cash_mxn: number;
            cash_usd: number;
            transfer_mxn: number;
            card_mxn: number;
            credit_mxn: number;
        };
    }>;
    collectSale(tenantId: string, cobranzaUserId: string, salesOrderId: string, dto: CollectPosSaleDto): Promise<{
        message: string;
        collection: {
            id: string;
            sales_order_id: string;
            pos_daily_shift_id: string;
            customer_id: number;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            payment_method: PosSalePaymentMethod;
            order_total_mxn: number;
            amount_cash_mxn: number;
            amount_cash_usd: number;
            usd_exchange_rate: number | null;
            amount_transfer_mxn: number;
            transfer_reference: string | null;
            amount_card_mxn: number;
            amount_credit_mxn: number;
            card_reference: string | null;
            received_cash_mxn: number;
            received_cash_usd: number;
            change_cash_mxn: number;
            change_cash_usd: number;
            collected_by_user_id: string;
            collected_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            notes: string | null;
            collected_at: Date;
            created_at: Date;
        };
        receipt: PosReceiptResult | null;
        receipt_error: string | null;
        invoice: {
            requested: boolean;
            fiscal_ready: boolean;
            fiscal_missing_fields: ("fiscal_rfc" | "fiscal_razon_social" | "fiscal_postal_code")[];
            stamp_path: string | null;
        };
        sales_order: {
            id: string;
            folio: string;
            payment_status: string;
            is_credit: boolean;
            invoice_requested: boolean;
            collected_by_user_id: string;
            customer_id: number;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            pos_daily_shift_id: string;
            total: number;
            amount_collected: number;
            amount_on_credit: number;
        };
    }>;
    private assignQueuedSalesToShift;
    private requireSellerUser;
    private resolveCollectionCustomerId;
    private validateAndNormalizePayment;
    private assertPaymentMethodShape;
    private assertCustomerCanUseCredit;
    private mapCollectedSaleRow;
    private buildCollectedSalesSummary;
    getSaleReceipt(tenantId: string, salesOrderId: string): Promise<{
        receipt: PosReceiptResult;
    }>;
    getSaleReceiptRaw(tenantId: string, salesOrderId: string, res: any): Promise<void>;
    getSaleCollection(tenantId: string, salesOrderId: string): Promise<{
        collection: {
            id: string;
            sales_order_id: string;
            pos_daily_shift_id: string;
            customer_id: number;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            payment_method: PosSalePaymentMethod;
            order_total_mxn: number;
            amount_cash_mxn: number;
            amount_cash_usd: number;
            usd_exchange_rate: number | null;
            amount_transfer_mxn: number;
            transfer_reference: string | null;
            amount_card_mxn: number;
            amount_credit_mxn: number;
            card_reference: string | null;
            received_cash_mxn: number;
            received_cash_usd: number;
            change_cash_mxn: number;
            change_cash_usd: number;
            collected_by_user_id: string;
            collected_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            notes: string | null;
            collected_at: Date;
            created_at: Date;
        };
    }>;
    private requireCobranzaTerminal;
    private requirePosTerminal;
    private requireOpenDailyShift;
    private getShiftRemovedTotals;
    private getShiftCashTotals;
    private getShiftSalesStats;
    private getShiftSellerUserIds;
    private computeDenominations;
    private mapSeller;
    private mapTerminalUser;
    private mapDailyShiftSummary;
    private mapDailyShiftDetail;
    private mapPartialShift;
}
