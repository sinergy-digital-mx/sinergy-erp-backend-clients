export {
  SHIPPING_CARGO_KINDS,
  type ShippingCargoKind,
} from '../../../entities/logistics/shipping.entity';
import { ShippingCargoKind } from '../../../entities/logistics/shipping.entity';

export function resolveCargoKind(
  orderCount: number,
  transferCount: number,
): ShippingCargoKind {
  if (orderCount > 0 && transferCount > 0) return 'mixed';
  if (transferCount > 0) return 'inventory_transfer';
  return 'order_delivery';
}
