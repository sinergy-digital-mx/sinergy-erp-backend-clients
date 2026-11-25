import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { userCanViewInventoryMargin } from '../../inventory/constants/inventory-margin-permission';
import { omitPurchaseOrderLotCosts } from '../utils/omit-purchase-order-lot-cost.util';

@Injectable()
export class HideInventoryCostColumnsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (userCanViewInventoryMargin(request?.user)) {
      return next.handle();
    }
    return next.handle().pipe(map((body) => omitPurchaseOrderLotCosts(body)));
  }
}
