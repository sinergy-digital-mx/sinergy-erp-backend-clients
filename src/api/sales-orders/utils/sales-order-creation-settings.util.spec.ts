import {
  defaultSalesOrderCreationFields,
  normalizeSalesOrderCreationFields,
  resolveDeliveryDateDefault,
  resolveOrderLogistics,
  shouldHideBillingBranch,
} from './sales-order-creation-settings.util';

describe('sales-order-creation-settings', () => {
  it('no deja ocultar ni hacer opcionales cliente y razón social', () => {
    const fields = normalizeSalesOrderCreationFields({
      customer: { visible: false, required: false },
      fiscal_configuration_id: { visible: false, required: false, default_value: 'otra' },
    });

    expect(fields.customer).toMatchObject({ visible: true, required: true, locked: true });
    expect(fields.fiscal_configuration_id).toMatchObject({
      visible: true,
      required: true,
      locked: true,
      default_value: 'user_primary',
    });
  });

  it('conserva el alta actual cuando no hay configuración guardada', () => {
    const fields = normalizeSalesOrderCreationFields(undefined);
    expect(fields).toEqual(defaultSalesOrderCreationFields());
  });

  it('oculta la sucursal si así se configuró o si solo hay una', () => {
    const fields = normalizeSalesOrderCreationFields({
      billing_branch_id: { visible: false, required: false },
    });
    expect(shouldHideBillingBranch(fields, 4)).toBe(true);
    expect(fields.billing_branch_id.required).toBe(false);

    const visible = defaultSalesOrderCreationFields();
    expect(shouldHideBillingBranch(visible, 1)).toBe(true);
    expect(shouldHideBillingBranch(visible, 2)).toBe(false);
    expect(visible.billing_branch_id.required).toBe(true);
  });

  it('normaliza mesa de control y la fecha de entrega', () => {
    const fields = normalizeSalesOrderCreationFields({
      requires_selection_assembly: { visible: false, default_value: true, required: true },
      sale_scope: { default_value: 'no-existe' },
      currency: { default_value: 'USD' },
    });
    expect(fields.requires_selection_assembly).toMatchObject({
      visible: false,
      required: false,
      default_value: true,
    });
    expect(fields.sale_scope.default_value).toBe('inventory');
    expect(fields.currency.default_value).toBe('USD');
    expect(resolveDeliveryDateDefault('today', new Date('2026-11-12T20:00:00Z'))).toBe('2026-11-12');
    expect(resolveDeliveryDateDefault('2026-01-02')).toBe('2026-01-02');
  });

  it('oculta la fecha tentativa y la ruta cuando no hay envío', () => {
    const fields = normalizeSalesOrderCreationFields({
      route_id: { visible: true, required: true, only_when_shipping: true },
      estimated_delivery_date: { visible: true, required: true, only_when_shipping: true },
    });
    const counter = resolveOrderLogistics(fields, true, {
      forShipping: false,
      estimatedDeliveryDate: '2026-12-01',
      routeId: 'route-1',
    });
    expect(counter.error).toBeNull();
    expect(counter.estimated_delivery_date).toBeNull();
    expect(counter.route_id).toBeNull();
    expect(counter.requires_shipping).toBe(false);

    const delivery = resolveOrderLogistics(fields, true, { forShipping: true });
    expect(delivery.error).toBe('La fecha tentativa de entrega es obligatoria');
  });
});
