import { PosShiftsService } from './pos-shifts.service';
import { ValidateSellerCodeDto } from './dto/validate-seller-code.dto';
import { OpenDailyShiftDto } from './dto/open-daily-shift.dto';
import { CreatePartialShiftDto } from './dto/create-partial-shift.dto';
import { QueryDailyShiftDto } from './dto/query-daily-shift.dto';
import { CloseDailyShiftDto } from './dto/close-daily-shift.dto';
import { CollectPosSaleDto } from './dto/collect-pos-sale.dto';
import { QueryCollectedSalesDto } from './dto/query-collected-sales.dto';
export declare class PosShiftsController {
    private readonly posShiftsService;
    constructor(posShiftsService: PosShiftsService);
    validateSellerCode(dto: ValidateSellerCodeDto, req: any): Promise<{
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
            status: import("../../entities/pos/pos-daily-shift-status.enum").PosDailyShiftStatus;
            opening_cash_mxn: number;
            opening_cash_usd: number;
        } | null;
        requires_daily_shift: boolean;
        pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
    }>;
    getCurrentDailyShift(req: any): Promise<{
        daily_shift: {
            id: string;
            shift_date: string;
            status: import("../../entities/pos/pos-daily-shift-status.enum").PosDailyShiftStatus;
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
                    currency: "USD" | "MXN";
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
    openDailyShift(dto: OpenDailyShiftDto, req: any): Promise<{
        message: string;
        daily_shift: {
            id: string;
            shift_date: string;
            status: import("../../entities/pos/pos-daily-shift-status.enum").PosDailyShiftStatus;
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
                    currency: "USD" | "MXN";
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
    findDailyShifts(query: QueryDailyShiftDto, req: any): Promise<{
        daily_shifts: {
            id: string;
            shift_date: string;
            status: import("../../entities/pos/pos-daily-shift-status.enum").PosDailyShiftStatus;
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
                    currency: "USD" | "MXN";
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
        }[];
    }>;
    findDailyShiftById(id: string, req: any): Promise<{
        daily_shift: {
            id: string;
            shift_date: string;
            status: import("../../entities/pos/pos-daily-shift-status.enum").PosDailyShiftStatus;
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
                    currency: "USD" | "MXN";
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
    }>;
    createPartialShift(id: string, dto: CreatePartialShiftDto, req: any): Promise<{
        message: string;
        partial_shift: {
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
                currency: "USD" | "MXN";
                denomination: number;
                bill_count: number;
                amount: number;
            }[];
        };
    }>;
    closeDailyShift(id: string, dto: CloseDailyShiftDto, req: any): Promise<{
        message: string;
        daily_shift: {
            id: string;
            shift_date: string;
            status: import("../../entities/pos/pos-daily-shift-status.enum").PosDailyShiftStatus;
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
                    currency: "USD" | "MXN";
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
    }>;
    getPendingSales(req: any): Promise<{
        pending_sales: {
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
        }[];
    }>;
    getCollectedSales(query: QueryCollectedSalesDto, req: any): Promise<{
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
            status: import("../../entities/pos/pos-daily-shift-status.enum").PosDailyShiftStatus;
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
                payment_method: import("../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
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
    collectSale(salesOrderId: string, dto: CollectPosSaleDto, req: any): Promise<{
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
            payment_method: import("../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
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
        receipt: import("../sales-orders/services/sales-order-pos-receipt.service").PosReceiptResult | null;
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
    getSaleCollection(salesOrderId: string, req: any): Promise<{
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
            payment_method: import("../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
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
    getSaleReceipt(salesOrderId: string, req: any): Promise<{
        receipt: import("../sales-orders/services/sales-order-pos-receipt.service").PosReceiptResult;
    }>;
    getSaleReceiptRaw(salesOrderId: string, req: any, res: any): Promise<void>;
}
