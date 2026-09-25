import { AccountingService } from './accounting.service';
import { QueryAccountingBaseDto, QueryAccountsPayableDto, QueryAccountsReceivableDto, QueryPosCollectionsDto, QueryPosTerminalSalesDto } from './dto/query-accounting-base.dto';
export declare class AccountingController {
    private readonly accountingService;
    constructor(accountingService: AccountingService);
    getPosSummary(query: QueryAccountingBaseDto, req: any): Promise<{
        filters_applied: {
            billing_branch_id: string;
            period: import("./dto/query-accounting-base.dto").AccountingReportPeriod;
            date_from: string;
            date_to: string;
        };
        unclosed_shift_alert: import("../pos-shifts/utils/unclosed-shift-alert").UnclosedShiftAlert | null;
        sales_terminals: {
            terminal_user_id: string;
            terminal_name: string;
            sales_count: number;
            amount_sold: number;
        }[];
        collection_terminal: {
            terminal_user_id: string | null;
            terminal_name: string | null;
            orders_collected: number;
            amount_collected: number;
            walk_in_count: number;
            invoiced_count: number;
            daily_shifts_count: number;
            partial_shifts_count: number;
            open_daily_shift: {
                id: string;
                shift_date: string;
                status: import("../../entities/pos/pos-daily-shift-status.enum").PosDailyShiftStatus;
                is_previous_day: boolean;
                partial_shifts_count: number;
            } | null;
        };
    }>;
    getPosTerminalSales(terminalUserId: string, query: QueryPosTerminalSalesDto, req: any): Promise<{
        terminal_user_id: string;
        terminal_name: string;
        filters_applied: {
            billing_branch_id: string;
            period: import("./dto/query-accounting-base.dto").AccountingReportPeriod;
            date_from: string;
            date_to: string;
        };
        data: {
            is_walk_in: boolean;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
            customer_company_name: string | null;
            customer_person_name: string | null;
            customer_display_name: string | null;
            id: string;
            folio: string;
            total: number;
            payment_status: string;
            general_status: string;
            created_at: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPosCollections(query: QueryPosCollectionsDto, req: any): Promise<{
        terminal_user_id: string | null;
        terminal_name: string | null;
        filters_applied: {
            billing_branch_id: string;
            period: import("./dto/query-accounting-base.dto").AccountingReportPeriod;
            date_from: string;
            date_to: string;
            customer_type: import("./dto/query-accounting-base.dto").PosCollectionCustomerType;
            search: string | null;
        };
        data: {
            is_walk_in: boolean;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
            collected_by_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
            customer_company_name: string | null;
            customer_person_name: string | null;
            customer_display_name: string | null;
            id: string;
            collection_id: string;
            folio: string;
            total: number;
            payment_status: string;
            general_status: string;
            created_at: Date;
            collected_at: Date;
            payment_method: import("../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
            payment_method_label: string;
            has_stamped_invoice: boolean;
            walk_in_name: string | null;
            walk_in_rfc: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    exportPosCollectionsExcel(query: QueryPosCollectionsDto, req: any, res: any): Promise<void>;
    getPosDailyShifts(query: QueryAccountingBaseDto, req: any): Promise<{
        filters_applied: {
            billing_branch_id: string;
            period: import("./dto/query-accounting-base.dto").AccountingReportPeriod;
            date_from: string;
            date_to: string;
        };
        data: {
            id: string;
            shift_date: string;
            status: import("../../entities/pos/pos-daily-shift-status.enum").PosDailyShiftStatus;
            is_previous_day: boolean;
            opening_cash_mxn: number;
            opening_cash_usd: number;
            terminal_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            terminal_name: string | null;
            billing_branch: {
                id: string;
                code: string;
                display_name: string;
            } | null;
            partial_shifts_count: number;
            removed_total_mxn: number;
            partial_shifts: {
                id: string;
                partial_number: number;
                removed_total_mxn: number;
                removed_total_usd: number;
                created_at: Date;
                notes: string | null;
                performed_by_user: {
                    id: string;
                    first_name: string;
                    last_name: string;
                } | null;
            }[];
        }[];
        total: number;
    }>;
    getPosDailyShiftDetail(id: string, req: any): Promise<{
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
                collected_check_mxn: number;
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
    getAccountsPayable(query: QueryAccountsPayableDto, req: any): Promise<{
        summary: {
            total_vendors: number;
            total_amount_pending: number;
        };
        data: {
            amount_pending: number;
            amount_paid: number;
            total_committed: number;
            progress_percentage: number;
            vendor_id: string;
            vendor_name: string;
            razon_social: string | null;
            company_name: string | null;
            credit_limit: number | null;
            pending_order_count: number;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAccountsPayableDetail(vendorId: string, req: any): Promise<{
        vendor: {
            id: string;
            name: string;
            razon_social: string | null;
            company_name: string | null;
            credit_limit: number | null;
        } | null;
        orders: {
            id: string;
            folio: string;
            general_status: string;
            payment_status: string;
            payment_currency: string;
            expected_delivery_date: Date;
            amount_pending: number;
            amount_paid: number;
            total: number;
            created_at: Date;
        }[];
    }>;
    getAccountsReceivable(query: QueryAccountsReceivableDto, req: any): Promise<{
        summary: {
            total_accounts: number;
            total_amount_pending: number;
        };
        data: {
            razon_social: string;
            fiscal_rfc: string | null;
            pending_order_count: number;
            amount_pending: number;
            customer_count: number;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAccountsReceivableDetail(razonSocial: string, billingBranchId: string | undefined, req: any): Promise<{
        razon_social: string;
        fiscal_rfc: string;
        pending_order_count: number;
        amount_pending: number;
        orders: {
            id: string;
            folio: string;
            total: number;
            payment_status: string;
            general_status: string;
            expected_delivery_date: Date;
            created_at: Date;
            customer_display_name: string;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
        }[];
    }>;
}
