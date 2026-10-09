import { Repository } from 'typeorm';
import { Shipping } from '../../../entities/logistics/shipping.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { FinkokProviderConfigurationService } from '../../electronic-invoicing/services/finkok-provider-configuration.service';
import { FinkokSoapClient } from '../../electronic-invoicing/services/finkok-soap.client';
export declare class CartaPorteService {
    private readonly shippingRepo;
    private readonly detailRepo;
    private readonly finkokConfig;
    private readonly finkok;
    constructor(shippingRepo: Repository<Shipping>, detailRepo: Repository<SalesOrderDetail>, finkokConfig: FinkokProviderConfigurationService, finkok: FinkokSoapClient);
    stamp(id: string, tenantId: string, pesoBrutoKg: number): Promise<Shipping>;
    loadForPdf(id: string, tenantId: string): Promise<Shipping>;
    private load;
    private collectMissing;
    private collectStopMissing;
    private goodsOf;
    private toXmlInput;
}
