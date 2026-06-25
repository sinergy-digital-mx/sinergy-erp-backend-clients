import { Customer } from '../../../entities/customers/customer.entity';
import { PosSaleCollection } from '../../../entities/pos/pos-sale-collection.entity';
import { User } from '../../../entities/users/user.entity';

const WALK_IN_FISCAL_NAME = 'VENTA DE MOSTRADOR';
const WALK_IN_DISPLAY_NAME = 'Público en General';

export function isWalkInCustomer(customer: Customer): boolean {
  return (
    customer.fiscal_razon_social === WALK_IN_FISCAL_NAME ||
    customer.name === WALK_IN_DISPLAY_NAME
  );
}

export function formatCustomerDisplayName(customer?: Customer | null): string | null {
  if (!customer) return null;
  if (customer.company_name?.trim()) return customer.company_name.trim();
  const fullName = [customer.name, customer.lastname].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (customer.fiscal_razon_social?.trim()) return customer.fiscal_razon_social.trim();
  return null;
}

export function mapPosCustomer(customer?: Customer | null) {
  if (!customer) return null;
  return {
    id: customer.id,
    name: customer.name,
    lastname: customer.lastname,
    company_name: customer.company_name,
    fiscal_razon_social: customer.fiscal_razon_social,
    display_name: formatCustomerDisplayName(customer),
    is_walk_in: isWalkInCustomer(customer),
  };
}

export function mapPosUser(user?: User | null) {
  if (!user) return null;
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    pos_user_code: user.pos_user_code ?? null,
    pos_user_type: user.pos_user_type ?? null,
  };
}

export function mapPosSaleCollection(collection: PosSaleCollection) {
  return {
    id: collection.id,
    sales_order_id: collection.sales_order_id,
    pos_daily_shift_id: collection.pos_daily_shift_id,
    customer_id: collection.customer_id,
    customer: mapPosCustomer(collection.customer),
    payment_method: collection.payment_method,
    order_total_mxn: Number(collection.order_total_mxn),
    amount_cash_mxn: Number(collection.amount_cash_mxn),
    amount_cash_usd: Number(collection.amount_cash_usd),
    usd_exchange_rate: collection.usd_exchange_rate
      ? Number(collection.usd_exchange_rate)
      : null,
    amount_transfer_mxn: Number(collection.amount_transfer_mxn),
    transfer_reference: collection.transfer_reference,
    amount_card_mxn: Number(collection.amount_card_mxn),
    card_reference: collection.card_reference,
    received_cash_mxn: Number(collection.received_cash_mxn),
    received_cash_usd: Number(collection.received_cash_usd),
    change_cash_mxn: Number(collection.change_cash_mxn),
    change_cash_usd: Number(collection.change_cash_usd),
    collected_by_user_id: collection.collected_by_user_id,
    collected_by_user: mapPosUser(collection.collected_by_user),
    notes: collection.notes,
    collected_at: collection.created_at,
    created_at: collection.created_at,
  };
}
