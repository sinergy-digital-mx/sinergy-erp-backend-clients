import {
    CUSTOMER_FISCAL_READY_SQL,
    CUSTOMER_HAS_ORDER_SQL,
    customerInsightWhere,
    isCustomerListInsight,
} from '../customer-list-insight.util';

describe('customer-list-insight', () => {
    it('acepta solo los cortes del listado', () => {
        expect(isCustomerListInsight('without_orders')).toBe(true);
        expect(isCustomerListInsight('fiscal_not_ready')).toBe(true);
        expect(isCustomerListInsight('todos')).toBe(false);
        expect(isCustomerListInsight(null)).toBe(false);
    });

    it('las órdenes quedan en la misma organización y sin canceladas', () => {
        expect(CUSTOMER_HAS_ORDER_SQL).toContain('so.tenant_id = customer.tenant_id');
        expect(CUSTOMER_HAS_ORDER_SQL).toContain("general_status <> 'Cancelada'");
        expect(customerInsightWhere('without_orders')).toContain('NOT (');
        expect(customerInsightWhere('with_orders')).toBe(CUSTOMER_HAS_ORDER_SQL);
    });

    it('listo para facturar exige RFC real, razón social y CP de 5 dígitos', () => {
        expect(CUSTOMER_FISCAL_READY_SQL).toContain('XAXX010101000');
        expect(CUSTOMER_FISCAL_READY_SQL).toContain('XEXX010101000');
        expect(CUSTOMER_FISCAL_READY_SQL).toContain('fiscal_razon_social');
        expect(CUSTOMER_FISCAL_READY_SQL).toContain('fiscal_postal_code');
        expect(customerInsightWhere('fiscal_not_ready')).toContain('NOT (');
    });
});
