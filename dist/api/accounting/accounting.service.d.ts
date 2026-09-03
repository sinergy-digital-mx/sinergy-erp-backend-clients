import { Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { PosSaleCollection } from '../../entities/pos/pos-sale-collection.entity';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosDailyShiftStatus } from '../../entities/pos/pos-daily-shift-status.enum';
import { ElectronicInvoice } from '../../entities/electronic-invoicing/electronic-invoice.entity';
import { PurchaseOrderBatch } from '../../entities/purchase-orders/purchase-order-batch.entity';
import { User } from '../../entities/users/user.entity';
import { AccountingReportPeriod, PosCollectionCustomerType, QueryAccountsPayableDto, QueryAccountsReceivableDto, QueryAccountingBaseDto, QueryPosCollectionsDto, QueryPosTerminalSalesDto } from './dto/query-accounting-base.dto';
export declare class AccountingService {
    private readonly salesOrderRepo;
    private readonly collectionRepo;
    private readonly dailyShiftRepo;
    private readonly electronicInvoiceRepo;
    private readonly purchaseOrderRepo;
    private readonly userRepo;
    constructor(salesOrderRepo: Repository<SalesOrder>, collectionRepo: Repository<PosSaleCollection>, dailyShiftRepo: Repository<PosDailyShift>, electronicInvoiceRepo: Repository<ElectronicInvoice>, purchaseOrderRepo: Repository<PurchaseOrderBatch>, userRepo: Repository<User>);
    getPosSummary(tenantId: string, filters: QueryAccountingBaseDto): Promise<{
        filters_applied: {
            billing_branch_id: string;
            period: AccountingReportPeriod;
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
                status: PosDailyShiftStatus;
                is_previous_day: boolean;
                partial_shifts_count: number;
            } | null;
        };
    }>;
    getPosTerminalSales(tenantId: string, terminalUserId: string, filters: QueryPosTerminalSalesDto): Promise<{
        terminal_user_id: string;
        terminal_name: string;
        filters_applied: {
            billing_branch_id: string;
            period: AccountingReportPeriod;
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
    getPosCollections(tenantId: string, filters: QueryPosCollectionsDto): Promise<{
        terminal_user_id: string | null;
        terminal_name: string | null;
        filters_applied: {
            billing_branch_id: string;
            period: AccountingReportPeriod;
            date_from: string;
            date_to: string;
            customer_type: PosCollectionCustomerType;
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
            has_stamped_invoice: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAccountsPayable(tenantId: string, filters: QueryAccountsPayableDto): Promise<{
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
    getAccountsPayableDetail(tenantId: string, vendorId: string): Promise<{
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
    getAccountsReceivable(tenantId: string, filters: QueryAccountsReceivableDto): Promise<{
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
    getAccountsReceivableDetail(tenantId: string, razonSocial: string, billingBranchId?: string): Promise<{
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
    private walkInCustomerSql;
    private stampedInvoiceExistsSql;
    private getStampedInvoiceOrderIds;
    private buildPurchaseOrderPaymentSummary;
    private resolveDateRange;
    private startOfDay;
    private endOfDay;
    private buildUserName;
    private buildCustomerFields;
}
