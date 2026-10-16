export { SHIPPING_CARGO_KINDS, type ShippingCargoKind, } from '../../../entities/logistics/shipping.entity';
import { ShippingCargoKind } from '../../../entities/logistics/shipping.entity';
export declare function resolveCargoKind(orderCount: number, transferCount: number): ShippingCargoKind;
