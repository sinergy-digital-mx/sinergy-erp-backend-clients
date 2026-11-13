import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Shipping } from '../../../entities/logistics/shipping.entity';
import { ShippingStop } from '../../../entities/logistics/shipping-stop.entity';
import { ShippingInventoryTransfer } from '../../../entities/logistics/shipping-inventory-transfer.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { InventoryTransfer } from '../../../entities/inventory/inventory-transfer.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
import { FinkokProviderConfigurationService } from '../../electronic-invoicing/services/finkok-provider-configuration.service';
import {
    FinkokSoapClient,
    FinkokStampResult,
} from '../../electronic-invoicing/services/finkok-soap.client';
import { finkokErrorMessage } from '../../electronic-invoicing/utils/finkok-error-message.util';
import {
    buildCartaPorteXml,
    CartaPorteGoodsLine,
    CartaPorteLocation,
    CartaPorteXmlInput,
} from '../utils/carta-porte-xml.util';
import {
    assessDriver,
    assessTruck,
    decorateShippingCartaPorte,
    isValidRfc,
    normalizeLicense,
    normalizeRfc,
    plateCode,
    postalCode,
    satStateCode,
    splitWeightKg,
} from '../utils/carta-porte.util';

interface TransferAddress {
    street: string | null;
    state: string | null;
    postalCode: string | null;
}

@Injectable()
export class CartaPorteService {
    constructor(
        @InjectRepository(Shipping)
        private readonly shippingRepo: Repository<Shipping>,
        @InjectRepository(SalesOrderDetail)
        private readonly detailRepo: Repository<SalesOrderDetail>,
        private readonly finkokConfig: FinkokProviderConfigurationService,
        private readonly finkok: FinkokSoapClient,
    ) {}
    async stamp(
        id: string,
        tenantId: string,
        pesoBrutoKg: number,
        environment?: FinkokEnvironment,
    ): Promise<Shipping> {
        const shipping = await this.load(id, tenantId);
        if (shipping.status === 'Cancelado') {
            throw new BadRequestException('Un viaje cancelado no genera carta porte');
        }
        if (shipping.carta_porte_uuid && shipping.carta_porte_environment !== 'demo') {
            throw new BadRequestException('Este viaje ya tiene carta porte timbrada');
        }
        if (!Number.isFinite(pesoBrutoKg) || pesoBrutoKg <= 0) {
            throw new BadRequestException('Indica el peso bruto de la carga en kilogramos');
        }
        const missing = this.collectMissing(shipping);
        const goods = await this.goodsOf(shipping, pesoBrutoKg, missing);
        if (missing.length) {
            throw new BadRequestException(missing.join('. '));
        }
        const fiscal = shipping.origin_billing_branch?.fiscal_configuration;
        if (fiscal?.finkok_registration_status !== 'registered') {
            throw new BadRequestException('La razón emisora debe estar registrada en Finkok antes de timbrar la carta porte.');
        }
        const built = buildCartaPorteXml({ ...this.toXmlInput(shipping), goods });
        const credentials = await this.finkokConfig.getCredentials(tenantId, environment);
        let result: FinkokStampResult;
        try {
            result = await this.finkok.signStamp(credentials, built.xml);
        }
        catch (error) {
            const message = finkokErrorMessage(undefined, error instanceof Error ? error.message : 'Error de comunicación con Finkok');
            shipping.carta_porte_error = message;
            await this.shippingRepo.save(shipping);
            throw new BadRequestException(message);
        }
        if (!result.success || !result.uuid) {
            const raw = result.incidencias?.map((item) => item.mensajeIncidencia).filter(Boolean).join('. ') ||
                result.codEstatus ||
                'Finkok rechazó la carta porte';
            const message = finkokErrorMessage(result.incidencias?.[0]?.codigoError, raw);
            shipping.carta_porte_error = message;
            await this.shippingRepo.save(shipping);
            throw new BadRequestException(message);
        }
        shipping.carta_porte_uuid = result.uuid;
        shipping.carta_porte_idccp = built.idCcp;
        shipping.carta_porte_xml = result.xml || built.xml;
        shipping.carta_porte_stamped_at = new Date();
        shipping.carta_porte_error = null;
        shipping.carta_porte_peso_kg = pesoBrutoKg;
        shipping.carta_porte_environment = credentials.environment;
        await this.shippingRepo.save(shipping);
        return decorateShippingCartaPorte(shipping);
    }
    async loadForPdf(id: string, tenantId: string): Promise<Shipping> {
        const shipping = await this.load(id, tenantId);
        if (!shipping.carta_porte_uuid) {
            throw new BadRequestException('Este viaje todavía no tiene carta porte timbrada');
        }
        return shipping;
    }
    private async load(id: string, tenantId: string): Promise<Shipping> {
        const shipping = await this.shippingRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: [
                'truck',
                'driver',
                'origin_billing_branch',
                'origin_billing_branch.fiscal_configuration',
                'stops',
                'stops.sales_order',
                'stops.sales_order.customer',
                'stops.customer_address',
                'transfer_links',
                'transfer_links.inventory_transfer',
                'transfer_links.inventory_transfer.lines',
                'transfer_links.inventory_transfer.lines.source_inventory_batch',
                'transfer_links.inventory_transfer.lines.source_inventory_batch.product',
                'transfer_links.inventory_transfer.destination_warehouse',
                'transfer_links.inventory_transfer.destination_warehouse.billing_branch',
                'transfer_links.inventory_transfer.destination_warehouse.billing_branch.fiscal_configuration',
            ],
            order: { stops: { stop_sequence: 'ASC' } },
        });
        if (!shipping)
            throw new NotFoundException('Envío no encontrado');
        return shipping;
    }
    private collectMissing(shipping: Shipping): string[] {
        const missing: string[] = [
            ...assessDriver(shipping.driver).missing,
            ...assessTruck(shipping.truck).missing,
        ];
        const branch = shipping.origin_billing_branch;
        const fiscal = branch?.fiscal_configuration;
        if (!branch)
            missing.push('El viaje no tiene sucursal de origen');
        if (!fiscal?.rfc || !fiscal.razon_social)
            missing.push('Falta la razón social emisora');
        if (!fiscal?.fiscal_regime)
            missing.push('La razón social no tiene régimen fiscal');
        if (!postalCode(branch?.postal_code)) {
            missing.push('La sucursal origen no tiene código postal de 5 dígitos');
        }
        if (!satStateCode(branch?.state))
            missing.push('La sucursal origen no tiene un estado reconocible');
        if (!(branch?.address ?? '').trim())
            missing.push('La sucursal origen no tiene calle');
        const km = Number(shipping.distance_km);
        if (!Number.isFinite(km) || km <= 0) {
            missing.push('El viaje no tiene kilómetros. Recalcula la ruta');
        }
        const stops = [...(shipping.stops ?? [])].sort((a, b) => (a.stop_sequence ?? 0) - (b.stop_sequence ?? 0));
        const links = shipping.transfer_links ?? [];
        if (!stops.length && !links.length) {
            missing.push('El viaje no tiene paradas ni transferencias');
        }
        stops.forEach((stop, index) => this.collectStopMissing(stop, index, missing));
        links.forEach((link) => this.collectTransferMissing(link, missing));
        return missing;
    }
    private collectStopMissing(stop: ShippingStop, index: number, missing: string[]): void {
        const label = stop.sales_order?.folio || `parada ${index + 1}`;
        const customer = stop.sales_order?.customer;
        const address = stop.customer_address;
        if (!customer) {
            missing.push(`${label}: sin cliente`);
            return;
        }
        if (!isValidRfc(customer.fiscal_rfc))
            missing.push(`${label}: el cliente no tiene RFC`);
        if (!address) {
            missing.push(`${label}: falta la dirección de entrega`);
            return;
        }
        if (!(address.street_address ?? '').trim())
            missing.push(`${label}: la dirección no tiene calle`);
        if (!satStateCode(address.state))
            missing.push(`${label}: el estado de entrega no es reconocible`);
        if (!postalCode(address.postal_code)) {
            missing.push(`${label}: el código postal de entrega no tiene 5 dígitos`);
        }
    }
    private collectTransferMissing(link: ShippingInventoryTransfer, missing: string[]): void {
        const transfer = link.inventory_transfer;
        const label = transfer?.folio || 'transferencia';
        const fiscal = transfer?.destination_warehouse?.billing_branch?.fiscal_configuration;
        if (!fiscal?.rfc || !isValidRfc(fiscal.rfc)) {
            missing.push(`${label}: la razón social destino no tiene RFC`);
        }
        if (!fiscal?.razon_social?.trim()) {
            missing.push(`${label}: falta la razón social destino`);
        }
        const address = transferAddress(transfer);
        if (!(address.street ?? '').trim())
            missing.push(`${label}: falta la calle de destino`);
        if (!satStateCode(address.state))
            missing.push(`${label}: el estado de destino no es reconocible`);
        if (!postalCode(address.postalCode)) {
            missing.push(`${label}: el código postal de destino no tiene 5 dígitos`);
        }
    }
    private async goodsOf(
        shipping: Shipping,
        pesoBrutoKg: number,
        missing: string[],
    ): Promise<CartaPorteGoodsLine[]> {
        const orderIds = (shipping.stops ?? []).map((stop) => stop.sales_order_id);
        const details = orderIds.length
            ? await this.detailRepo.find({
                where: { sales_order_id: In(orderIds) },
                relations: ['product'],
            })
            : [];
        const transferLines = (shipping.transfer_links ?? []).flatMap((link) => link.inventory_transfer?.lines ?? []);
        if (!details.length && !transferLines.length) {
            missing.push('El viaje no tiene productos');
            return [];
        }
        const orderMissing = details.filter((line) => !(line.product?.sat_clave ?? '').trim());
        const transferMissing = transferLines.filter((line) => !(line.source_inventory_batch?.product?.sat_clave ?? '').trim());
        if (orderMissing.length || transferMissing.length) {
            const names = [
                ...new Set([
                    ...orderMissing.map((line) => line.product?.sku || line.product?.name),
                    ...transferMissing.map((line) => line.source_inventory_batch?.product?.sku ||
                        line.source_inventory_batch?.product?.name),
                ]),
            ]
                .filter(Boolean)
                .join(', ');
            missing.push(`Falta la clave SAT del producto: ${names}`);
            return [];
        }
        const quantities = [
            ...details.map((line) => Number(line.quantity) || 0),
            ...transferLines.map((line) => Number(line.quantity) || 0),
        ];
        const weights = splitWeightKg(pesoBrutoKg, quantities);
        const orderGoods: CartaPorteGoodsLine[] = details.map((line, index) => ({
            satClave: line.product.sat_clave!.trim(),
            description: (line.product.name || line.product.sku || 'Mercancía').trim(),
            quantity: Number(line.quantity) || 0,
            weightKg: weights[index],
        }));
        const transferGoods = transferLines.map((line, index) => {
            const product = line.source_inventory_batch!.product!;
            return {
                satClave: product.sat_clave!.trim(),
                description: (product.name || product.sku || 'Mercancía').trim(),
                quantity: Number(line.quantity) || 0,
                weightKg: weights[details.length + index],
            };
        });
        return [...orderGoods, ...transferGoods];
    }
    private toXmlInput(shipping: Shipping): Omit<CartaPorteXmlInput, 'goods'> {
        const branch = shipping.origin_billing_branch;
        const fiscal = branch!.fiscal_configuration!;
        const stops = [...(shipping.stops ?? [])].sort((a, b) => (a.stop_sequence ?? 0) - (b.stop_sequence ?? 0));
        const transferDestinations = uniqueTransferDestinations(shipping.transfer_links ?? []);
        const totalKm = Number(shipping.distance_km);
        const shares = splitWeightKg(totalKm, [
            ...stops.map(() => 1),
            ...transferDestinations.map(() => 1),
        ]);
        const truck = shipping.truck;
        const driver = shipping.driver;
        const orderDestinations: CartaPorteLocation[] = stops.map((stop, index) => {
            const customer = stop.sales_order.customer;
            const address = stop.customer_address;
            return {
                rfc: normalizeRfc(customer.fiscal_rfc),
                nombre: customerLabel(customer),
                distanceKm: shares[index],
                address: {
                    street: address!.street_address!.trim(),
                    stateCode: satStateCode(address!.state)!,
                    postalCode: postalCode(address!.postal_code)!,
                },
            };
        });
        const transferXmlDestinations: CartaPorteLocation[] = transferDestinations.map((item, index) => ({
            rfc: item.rfc,
            nombre: item.nombre,
            distanceKm: shares[stops.length + index],
            address: item.address,
        }));
        return {
            folio: shipping.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
            fecha: cfdiFechaLocal(),
            shippingDate: dateOnly(shipping.shipping_date),
            totalDistanceKm: totalKm,
            emisor: {
                rfc: normalizeRfc(fiscal.rfc),
                nombre: fiscal.razon_social!.trim(),
                regimen: String(fiscal.fiscal_regime).trim(),
                postalCode: postalCode(branch!.postal_code)!,
            },
            origin: {
                rfc: normalizeRfc(fiscal.rfc),
                nombre: fiscal.razon_social!.trim(),
                address: {
                    street: branch!.address!.trim(),
                    stateCode: satStateCode(branch!.state)!,
                    postalCode: postalCode(branch!.postal_code)!,
                },
            },
            destinations: [...orderDestinations, ...transferXmlDestinations],
            vehicle: {
                permSct: truck.permiso_sct!.trim(),
                numPermisoSct: truck.numero_permiso_sct!.trim(),
                configVehicular: truck.tipo_auto_transporte!.trim(),
                pesoBrutoVehicularTon: Number(truck.peso_bruto_vehicular),
                placa: plateCode(truck.placa),
                anio: truck.anio!.trim(),
                aseguraRespCivil: truck.aseguradora_rc!.trim(),
                polizaRespCivil: truck.poliza_rc!.trim(),
                remolqueSubtipo: truck.subtipo_remolque1,
                remolquePlaca: truck.placa_remolque1,
            },
            operator: {
                rfc: normalizeRfc(driver.driver_rfc),
                licencia: normalizeLicense(driver.driver_license_number),
                nombre: [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim(),
            },
        };
    }
}
function dateOnly(value: Date | string): string {
    if (typeof value === 'string')
        return value.slice(0, 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}
function cfdiFechaLocal(now = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
function transferAddress(transfer: InventoryTransfer | null | undefined): TransferAddress {
    const warehouse = transfer?.destination_warehouse;
    const branch = warehouse?.billing_branch;
    const warehouseScore = addressScore(warehouse?.street, warehouse?.state, warehouse?.zip_code);
    const branchScore = addressScore(branch?.address, branch?.state, branch?.postal_code);
    if (warehouseScore >= branchScore && warehouseScore > 0) {
        return {
            street: warehouse?.street ?? null,
            state: warehouse?.state ?? null,
            postalCode: warehouse?.zip_code ?? null,
        };
    }
    return {
        street: branch?.address ?? null,
        state: branch?.state ?? null,
        postalCode: branch?.postal_code ?? null,
    };
}
function addressScore(
    street: string | null | undefined,
    state: string | null | undefined,
    postal: string | null | undefined,
): number {
    return [street?.trim(), satStateCode(state), postalCode(postal)].filter(Boolean).length;
}
function uniqueTransferDestinations(
    links: ShippingInventoryTransfer[],
): Omit<CartaPorteLocation, 'distanceKm'>[] {
    const seen = new Set<string>();
    const destinations: Omit<CartaPorteLocation, 'distanceKm'>[] = [];
    for (const link of links) {
        const transfer = link.inventory_transfer;
        const warehouseId = transfer?.destination_warehouse_id;
        if (!transfer || !warehouseId || seen.has(warehouseId))
            continue;
        seen.add(warehouseId);
        const fiscal = transfer.destination_warehouse?.billing_branch?.fiscal_configuration;
        const address = transferAddress(transfer);
        destinations.push({
            rfc: normalizeRfc(fiscal?.rfc),
            nombre: (fiscal?.razon_social || transfer.destination_warehouse?.name || 'Destino').trim(),
            address: {
                street: (address.street ?? '').trim(),
                stateCode: satStateCode(address.state) || '',
                postalCode: postalCode(address.postalCode) || '',
            },
        });
    }
    return destinations;
}
function customerLabel(customer: Customer): string {
    return (customer.fiscal_razon_social?.trim() ||
        [customer.name, customer.lastname].filter(Boolean).join(' ').trim() ||
        'Cliente');
}
