import { MessageEvent } from '@nestjs/common';
import { PosShiftsService } from './pos-shifts.service';
import { QuotationAdvanceInvoiceService } from '../quotations/services/quotation-advance-invoice.service';
import { ValidateSellerCodeDto } from './dto/validate-seller-code.dto';
import { OpenDailyShiftDto } from './dto/open-daily-shift.dto';
import { CreatePartialShiftDto } from './dto/create-partial-shift.dto';
import { QueryDailyShiftDto } from './dto/query-daily-shift.dto';
import { QueryPosBranchDto } from './dto/query-pos-branch.dto';
import { QueryPosFolioQuotationsDto } from './dto/query-pos-folio-quotations.dto';
import { CloseDailyShiftDto } from './dto/close-daily-shift.dto';
import { CollectPosSaleDto } from './dto/collect-pos-sale.dto';
import { RegisterPosAbonoDto } from './dto/register-pos-abono.dto';
import { QueryCollectedSalesDto } from './dto/query-collected-sales.dto';
import { ReplacePosSaleCartDto } from './dto/replace-pos-sale-cart.dto';
import { SendQuotationToCajaDto } from './dto/send-quotation-to-caja.dto';
import { UpdatePosCustomerDto } from './dto/update-pos-customer.dto';
import { RecallFromCajaDto } from './dto/recall-from-caja.dto';
import { PosCajaRecallHub } from './pos-caja-recall.hub';
import { Observable } from 'rxjs';
export declare class PosShiftsController {
    private readonly posShiftsService;
    private readonly quotationAdvances;
    private readonly cajaRecallHub;
    constructor(posShiftsService: PosShiftsService, quotationAdvances: QuotationAdvanceInvoiceService, cajaRecallHub: PosCajaRecallHub);
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
    getCurrentDailyShift(query: QueryPosBranchDto, req: any): Promise<{
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
                collected_check_usd: number;
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
            advance_payments: {
                id: string;
                folio: string;
                payment_method: import("../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
                payment_method_label: string;
                amount_mxn: number;
                document_total: number;
                amount_pending: number;
                payer_summary: string | null;
            }[];
        } | null;
        requires_previous_close: boolean;
        unclosed_shift_alert: import("./utils/unclosed-shift-alert").UnclosedShiftAlert | null;
        usd_exchange_rate: number | null;
        usd_exchange_rate_date: string | null;
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
                collected_check_mxn: number;
                collected_check_usd: number;
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
            advance_payments: {
                id: string;
                folio: string;
                payment_method: import("../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
                payment_method_label: string;
                amount_mxn: number;
                document_total: number;
                amount_pending: number;
                payer_summary: string | null;
            }[];
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
                collected_check_mxn: number;
                collected_check_usd: number;
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
            advance_payments: {
                id: string;
                folio: string;
                payment_method: import("../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
                payment_method_label: string;
                amount_mxn: number;
                document_total: number;
                amount_pending: number;
                payer_summary: string | null;
            }[];
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
                collected_check_mxn: number;
                collected_check_usd: number;
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
            advance_payments: {
                id: string;
                folio: string;
                payment_method: import("../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
                payment_method_label: string;
                amount_mxn: number;
                document_total: number;
                amount_pending: number;
                payer_summary: string | null;
            }[];
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
                collected_check_mxn: number;
                collected_check_usd: number;
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
            advance_payments: {
                id: string;
                folio: string;
                payment_method: import("../../entities/pos/pos-sale-payment-method.enum").PosSalePaymentMethod;
                payment_method_label: string;
                amount_mxn: number;
                document_total: number;
                amount_pending: number;
                payer_summary: string | null;
            }[];
        };
    }>;
    getPendingSales(query: QueryPosBranchDto, req: any): Promise<{
        pending_sales: ({
            kind: string;
            id: string;
            folio: string;
            quotation_folio: string | null;
            total: number;
            subtotal: number;
            discount_total: number;
            iva_total: number;
            ieps_total: number;
            global_discount_amount: number;
            lines: {
                product_name: string;
                product_sku: string;
                quantity: number;
                uom_name: string;
                unit_price: number;
                discount_percentage: number;
                line_total: number;
            }[];
            currency: string;
            exchange_rate: number | null;
            amount_pending: number;
            created_at: Date;
            notes: string | null;
            walk_in_name: string | null;
            walk_in_rfc: string | null;
            for_shipping: boolean;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
                credit_enabled: boolean;
            } | null;
            caja_open: boolean;
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
        } | {
            kind: string;
            id: string;
            folio: string;
            quotation_folio: null;
            total: number;
            subtotal: number;
            discount_total: number;
            iva_total: number;
            ieps_total: number;
            global_discount_amount: number;
            lines: {
                product_name: string;
                product_sku: string;
                quantity: number;
                uom_name: string;
                unit_price: number;
                discount_percentage: number;
                line_total: number;
            }[];
            amount_pending: number;
            advance_uso_cfdi: string;
            advance_metodo_pago: "PUE" | "PPD";
            created_at: Date;
            notes: string | null;
            walk_in_name: null;
            walk_in_rfc: null;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
                credit_enabled: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
            terminal_user: null;
            caja_open: boolean;
        })[];
    }>;
    getSalesInProgress(query: QueryPosBranchDto, req: any): Promise<{
        sales_in_progress: ({
            customer_id: number;
            global_discount_id: string | null;
            global_discount: {
                id: string;
                name: string;
                discount_type: import("../../entities/global-discounts/global-discount.entity").GlobalDiscountType;
                value: number;
                is_active: boolean;
            } | null;
            line_items: {
                id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                product_uom_id: string;
                uom_id: string;
                uom_name: string;
                quantity: number;
                unit_price: number;
                iva_percentage: number;
                ieps_percentage: number;
                discount_percentage: number;
                product_discount_id: string | null;
                selected_discount: {
                    id: string;
                    name: string;
                    discount_type: import("../../entities/products").ProductDiscountType;
                    value: number;
                    product_uom_id: string | null;
                } | null;
            }[];
            kind: "sale";
            id: string;
            folio: string;
            total: number;
            subtotal: number;
            created_at: Date;
            updated_at: Date;
            general_status: string;
            payment_status: string;
            pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
            notes: string | null;
            walk_in_name: string | null;
            walk_in_rfc: string | null;
            for_shipping: boolean;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
        } | {
            customer_id: number;
            global_discount_id: string | null;
            global_discount: {
                id: string;
                name: string;
                discount_type: import("../../entities/global-discounts/global-discount.entity").GlobalDiscountType;
                value: number;
                is_active: boolean;
            } | null;
            line_items: {
                id: string;
                product_id: string;
                product_name: string;
                product_sku: string;
                product_uom_id: string;
                uom_id: string;
                uom_name: string;
                quantity: number;
                unit_price: number;
                iva_percentage: number;
                ieps_percentage: number;
                discount_percentage: number;
                product_discount_id: string | null;
                selected_discount: {
                    id: string;
                    name: string;
                    discount_type: import("../../entities/products").ProductDiscountType;
                    value: number;
                    product_uom_id: string | null;
                } | null;
            }[];
            kind: string;
            id: string;
            folio: string;
            total: number;
            subtotal: number;
            amount_pending: number;
            advance_uso_cfdi: string;
            advance_metodo_pago: "PUE" | "PPD";
            created_at: Date;
            updated_at: Date;
            general_status: string;
            pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
            notes: string | null;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
        })[];
    }>;
    listFolioQuotations(query: QueryPosFolioQuotationsDto, req: any): Promise<{
        data: {
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            assigned_seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            terminal_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
                pos_user_type: import("../../entities/users/pos-user-type.enum").PosUserType | null;
            } | null;
            razon_social: string;
            sucursal: string | null;
            expires_at: string | null;
            quotation_expiration_days: number | null;
            fiscal_configuration: {
                id: string;
                razon_social: string;
                rfc: string;
            } | null;
            billing_branch_id: string | null;
            billing_branch: {
                id: string;
                code: string;
                address: string;
                city: string;
                state: string;
                country: string;
                postal_code: string;
            } | null;
            id: string;
            tenant: import("../rbac").RBACTenant;
            tenant_id: string;
            folio: string;
            fiscal_configuration_id: string;
            warehouse_id: string | null;
            customer: import("../../entities/customers/customer.entity").Customer;
            customer_id: number;
            expected_delivery_date: Date;
            quotation_type: string;
            fiscal_razon_social: string | null;
            general_status: string;
            notes: string | null;
            subtotal: number;
            iva_total: number;
            ieps_total: number;
            discount_total: number;
            global_discount: import("../../entities/global-discounts/global-discount.entity").GlobalDiscount | null;
            global_discount_id: string | null;
            global_discount_amount: number;
            total: number;
            advance_requested_total: number | null;
            advance_uso_cfdi: string | null;
            advance_metodo_pago: "PUE" | "PPD" | null;
            advance_case: "unknown" | "products" | null;
            pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
            pos_caja_opened_at: Date | null;
            pos_caja_opened_by: string | null;
            created_by: string;
            terminal_user_id: string | null;
            seller_user_id: string | null;
            assigned_seller_user_id: string | null;
            converted_to_sales_order_id: string | null;
            created_at: Date;
            updated_by: string;
            updated_at: Date;
            line_items: import("../../entities/quotations").QuotationDetail[];
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
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
            check_mxn: number;
            check_usd: number;
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
                transfer_payer_name: string | null;
                transfer_payer_business_name: string | null;
                amount_card_mxn: number;
                amount_credit_mxn: number;
                amount_check_mxn: number;
                amount_check_usd: number;
                check_reference: string | null;
                check_payer_name: string | null;
                check_payer_phone: string | null;
                card_reference: string | null;
                card_kind: "credit" | "debit" | null;
                card_payer_name: string | null;
                card_payer_phone: string | null;
                card_payments: import("./utils/pos-card-payments.util").PosCardPayment[];
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
                walk_in_name: string | null;
                walk_in_rfc: string | null;
                for_shipping: boolean;
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
            check_mxn: number;
            check_usd: number;
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
            transfer_payer_name: string | null;
            transfer_payer_business_name: string | null;
            amount_card_mxn: number;
            amount_credit_mxn: number;
            amount_check_mxn: number;
            amount_check_usd: number;
            check_reference: string | null;
            check_payer_name: string | null;
            check_payer_phone: string | null;
            card_reference: string | null;
            card_kind: "credit" | "debit" | null;
            card_payer_name: string | null;
            card_payer_phone: string | null;
            card_payments: import("./utils/pos-card-payments.util").PosCardPayment[];
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
            currency: "USD" | "MXN";
            exchange_rate: number | null;
            amount_collected: number;
            amount_on_credit: number;
        };
    }>;
    registerAbono(salesOrderId: string, dto: RegisterPosAbonoDto, req: any): Promise<{
        folio: string;
        abono_id: string;
        payment_id: string;
        amount: number;
        payment_status: string;
        amount_pending: number;
    }>;
    collectQuotationAdvance(quotationId: string, dto: CollectPosSaleDto, req: any): Promise<{
        folio: string;
        customer_name: string | null;
        change_cash_mxn: number;
        change_cash_usd: number;
        usd_exchange_rate: number | null;
        invoice_id: string;
    }>;
    returnSaleToVentas(salesOrderId: string, req: any): Promise<{
        message: string;
        sales_order: {
            kind: "sale";
            id: string;
            folio: string;
            total: number;
            subtotal: number;
            created_at: Date;
            updated_at: Date;
            general_status: string;
            payment_status: string;
            pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
            notes: string | null;
            walk_in_name: string | null;
            walk_in_rfc: string | null;
            for_shipping: boolean;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
        };
    }>;
    returnQuotationToVentas(quotationId: string, req: any): Promise<{
        message: string;
        quotation: {
            kind: string;
            id: string;
            folio: string;
            total: number;
            subtotal: number;
            amount_pending: number;
            advance_uso_cfdi: string;
            advance_metodo_pago: "PUE" | "PPD";
            created_at: Date;
            updated_at: Date;
            general_status: string;
            pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
            notes: string | null;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
        };
    }>;
    getSalesAwaitingCaja(query: QueryPosBranchDto, req: any): Promise<{
        sales_in_caja: ({
            kind: string;
            id: string;
            folio: string;
            quotation_folio: string | null;
            total: number;
            subtotal: number;
            discount_total: number;
            iva_total: number;
            ieps_total: number;
            global_discount_amount: number;
            lines: {
                product_name: string;
                product_sku: string;
                quantity: number;
                uom_name: string;
                unit_price: number;
                discount_percentage: number;
                line_total: number;
            }[];
            currency: string;
            exchange_rate: number | null;
            amount_pending: number;
            created_at: Date;
            notes: string | null;
            walk_in_name: string | null;
            walk_in_rfc: string | null;
            for_shipping: boolean;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
                credit_enabled: boolean;
            } | null;
            caja_open: boolean;
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
        } | {
            kind: string;
            id: string;
            folio: string;
            quotation_folio: null;
            total: number;
            subtotal: number;
            discount_total: number;
            iva_total: number;
            ieps_total: number;
            global_discount_amount: number;
            lines: {
                product_name: string;
                product_sku: string;
                quantity: number;
                uom_name: string;
                unit_price: number;
                discount_percentage: number;
                line_total: number;
            }[];
            amount_pending: number;
            advance_uso_cfdi: string;
            advance_metodo_pago: "PUE" | "PPD";
            created_at: Date;
            notes: string | null;
            walk_in_name: null;
            walk_in_rfc: null;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
                credit_enabled: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
            terminal_user: null;
            caja_open: boolean;
        })[];
    }>;
    recallSaleFromCaja(salesOrderId: string, dto: RecallFromCajaDto, req: any): Promise<{
        message: string;
        caja_was_open: boolean;
        recalled_by_name: string;
        sales_order: {
            kind: "sale";
            id: string;
            folio: string;
            total: number;
            subtotal: number;
            created_at: Date;
            updated_at: Date;
            general_status: string;
            payment_status: string;
            pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
            notes: string | null;
            walk_in_name: string | null;
            walk_in_rfc: string | null;
            for_shipping: boolean;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
        };
    }>;
    recallQuotationFromCaja(quotationId: string, dto: RecallFromCajaDto, req: any): Promise<{
        message: string;
        caja_was_open: boolean;
        recalled_by_name: string;
        quotation: {
            kind: string;
            id: string;
            folio: string;
            total: number;
            subtotal: number;
            amount_pending: number;
            advance_uso_cfdi: string;
            advance_metodo_pago: "PUE" | "PPD";
            created_at: Date;
            updated_at: Date;
            general_status: string;
            pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
            notes: string | null;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
        };
    }>;
    cajaRecalls(query: QueryPosBranchDto, req: any): Observable<MessageEvent>;
    touchSaleCajaPresence(salesOrderId: string, req: any): Promise<{
        in_caja: boolean;
        reason: string;
        recalled_by_name: string | null;
        message: string;
    } | {
        in_caja: boolean;
        reason: null;
        message: null;
        recalled_by_name?: undefined;
    }>;
    releaseSaleCajaPresence(salesOrderId: string, req: any): Promise<{
        released: boolean;
    }>;
    touchQuotationCajaPresence(quotationId: string, req: any): Promise<{
        in_caja: boolean;
        reason: string;
        recalled_by_name: string | null;
        message: string;
    } | {
        in_caja: boolean;
        reason: null;
        message: null;
        recalled_by_name?: undefined;
    }>;
    releaseQuotationCajaPresence(quotationId: string, req: any): Promise<{
        released: boolean;
    }>;
    updateSaleCustomer(salesOrderId: string, dto: UpdatePosCustomerDto, req: any): Promise<{
        message: string;
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
        walk_in_name: string | null;
        walk_in_rfc: string | null;
    }>;
    updateQuotationCustomer(quotationId: string, dto: UpdatePosCustomerDto, req: any): Promise<{
        message: string;
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
    }>;
    replaceSaleCart(salesOrderId: string, dto: ReplacePosSaleCartDto, req: any): Promise<{
        customer_id: number;
        global_discount_id: string | null;
        global_discount: {
            id: string;
            name: string;
            discount_type: import("../../entities/global-discounts/global-discount.entity").GlobalDiscountType;
            value: number;
            is_active: boolean;
        } | null;
        line_items: {
            id: string;
            product_id: string;
            product_name: string;
            product_sku: string;
            product_uom_id: string;
            uom_id: string;
            uom_name: string;
            quantity: number;
            unit_price: number;
            iva_percentage: number;
            ieps_percentage: number;
            discount_percentage: number;
            product_discount_id: string | null;
            selected_discount: {
                id: string;
                name: string;
                discount_type: import("../../entities/products").ProductDiscountType;
                value: number;
                product_uom_id: string | null;
            } | null;
        }[];
        kind: "sale";
        id: string;
        folio: string;
        total: number;
        subtotal: number;
        created_at: Date;
        updated_at: Date;
        general_status: string;
        payment_status: string;
        pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
        notes: string | null;
        walk_in_name: string | null;
        walk_in_rfc: string | null;
        for_shipping: boolean;
        fiscal_configuration_id: string;
        customer: {
            id: number;
            name: string;
            lastname: string;
            company_name: string;
            fiscal_razon_social: string;
            display_name: string | null;
            is_walk_in: boolean;
        } | null;
        seller_user: {
            id: string;
            first_name: string;
            last_name: string;
            pos_user_code: number | null;
        } | null;
    }>;
    sendSaleToCaja(salesOrderId: string, req: any): Promise<{
        message: string;
        sales_order: {
            kind: "sale";
            id: string;
            folio: string;
            total: number;
            subtotal: number;
            created_at: Date;
            updated_at: Date;
            general_status: string;
            payment_status: string;
            pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
            notes: string | null;
            walk_in_name: string | null;
            walk_in_rfc: string | null;
            for_shipping: boolean;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
        };
    }>;
    sendQuotationToCaja(quotationId: string, dto: SendQuotationToCajaDto, req: any): Promise<{
        message: string;
        quotation: {
            kind: string;
            id: string;
            folio: string;
            total: number;
            subtotal: number;
            amount_pending: number;
            advance_uso_cfdi: string;
            advance_metodo_pago: "PUE" | "PPD";
            created_at: Date;
            updated_at: Date;
            general_status: string;
            pos_stage: import("../../entities/sales-orders").SalesOrderPosStage | null;
            notes: string | null;
            fiscal_configuration_id: string;
            customer: {
                id: number;
                name: string;
                lastname: string;
                company_name: string;
                fiscal_razon_social: string;
                display_name: string | null;
                is_walk_in: boolean;
            } | null;
            seller_user: {
                id: string;
                first_name: string;
                last_name: string;
                pos_user_code: number | null;
            } | null;
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
            transfer_payer_name: string | null;
            transfer_payer_business_name: string | null;
            amount_card_mxn: number;
            amount_credit_mxn: number;
            amount_check_mxn: number;
            amount_check_usd: number;
            check_reference: string | null;
            check_payer_name: string | null;
            check_payer_phone: string | null;
            card_reference: string | null;
            card_kind: "credit" | "debit" | null;
            card_payer_name: string | null;
            card_payer_phone: string | null;
            card_payments: import("./utils/pos-card-payments.util").PosCardPayment[];
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
