import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { userCanViewPurchaseOrderRealCost } from '../constants/purchase-order-real-cost-permission';
import { omitPurchaseOrderRealCost } from '../utils/omit-purchase-order-real-cost.util';

@Injectable()
export class HidePurchaseOrderRealCostInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (userCanViewPurchaseOrderRealCost(request?.user)) {
      return next.handle();
    }
    return next.handle().pipe(map((body) => omitPurchaseOrderRealCost(body)));
  }
}
