"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartaPorteService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shipping_entity_1 = require("../../../entities/logistics/shipping.entity");
const sales_order_detail_entity_1 = require("../../../entities/sales-orders/sales-order-detail.entity");
const finkok_provider_configuration_service_1 = require("../../electronic-invoicing/services/finkok-provider-configuration.service");
const finkok_soap_client_1 = require("../../electronic-invoicing/services/finkok-soap.client");
const finkok_error_message_util_1 = require("../../electronic-invoicing/utils/finkok-error-message.util");
const carta_porte_xml_util_1 = require("../utils/carta-porte-xml.util");
const carta_porte_util_1 = require("../utils/carta-porte.util");
let CartaPorteService = class CartaPorteService {
    shippingRepo;
    detailRepo;
    finkokConfig;
    finkok;
    constructor(shippingRepo, detailRepo, finkokConfig, finkok) {
        this.shippingRepo = shippingRepo;
        this.detailRepo = detailRepo;
        this.finkokConfig = finkokConfig;
        this.finkok = finkok;
    }
    async stamp(id, tenantId, pesoBrutoKg) {
        const shipping = await this.load(id, tenantId);
        if (shipping.status === 'Cancelado') {
            throw new common_1.BadRequestException('Un viaje cancelado no genera carta porte');
        }
        if (shipping.carta_porte_uuid) {
            throw new common_1.BadRequestException('Este viaje ya tiene carta porte timbrada');
        }
        if (!Number.isFinite(pesoBrutoKg) || pesoBrutoKg <= 0) {
            throw new common_1.BadRequestException('Indica el peso bruto de la carga en kilogramos');
        }
        const missing = this.collectMissing(shipping);
        const goods = await this.goodsOf(shipping, pesoBrutoKg, missing);
        if (missing.length) {
            throw new common_1.BadRequestException(missing.join('. '));
        }
        const fiscal = shipping.origin_billing_branch?.fiscal_configuration;
        if (fiscal?.finkok_registration_status !== 'registered') {
            throw new common_1.BadRequestException('La razón emisora debe estar registrada en Finkok antes de timbrar la carta porte.');
        }
        const built = (0, carta_porte_xml_util_1.buildCartaPorteXml)({ ...this.toXmlInput(shipping), goods });
        const credentials = await this.finkokConfig.getCredentials(tenantId);
        let result;
        try {
            result = await this.finkok.signStamp(credentials, built.xml);
        }
        catch (error) {
            const message = (0, finkok_error_message_util_1.finkokErrorMessage)(undefined, error instanceof Error ? error.message : 'Error de comunicación con Finkok');
            shipping.carta_porte_error = message;
            await this.shippingRepo.save(shipping);
            throw new common_1.BadRequestException(message);
        }
        if (!result.success || !result.uuid) {
            const raw = result.incidencias?.map((item) => item.mensajeIncidencia).filter(Boolean).join('. ') ||
                result.codEstatus ||
                'Finkok rechazó la carta porte';
            const message = (0, finkok_error_message_util_1.finkokErrorMessage)(result.incidencias?.[0]?.codigoError, raw);
            shipping.carta_porte_error = message;
            await this.shippingRepo.save(shipping);
            throw new common_1.BadRequestException(message);
        }
        shipping.carta_porte_uuid = result.uuid;
        shipping.carta_porte_idccp = built.idCcp;
        shipping.carta_porte_xml = result.xml || built.xml;
        shipping.carta_porte_stamped_at = new Date();
        shipping.carta_porte_error = null;
        shipping.carta_porte_peso_kg = pesoBrutoKg;
        await this.shippingRepo.save(shipping);
        return (0, carta_porte_util_1.decorateShippingCartaPorte)(shipping);
    }
    async loadForPdf(id, tenantId) {
        const shipping = await this.load(id, tenantId);
        if (!shipping.carta_porte_uuid) {
            throw new common_1.BadRequestException('Este viaje todavía no tiene carta porte timbrada');
        }
        return shipping;
    }
    async load(id, tenantId) {
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
            ],
            order: { stops: { stop_sequence: 'ASC' } },
        });
        if (!shipping)
            throw new common_1.NotFoundException('Envío no encontrado');
        return shipping;
    }
    collectMissing(shipping) {
        const missing = [
            ...(0, carta_porte_util_1.assessDriver)(shipping.driver).missing,
            ...(0, carta_porte_util_1.assessTruck)(shipping.truck).missing,
        ];
        const branch = shipping.origin_billing_branch;
        const fiscal = branch?.fiscal_configuration;
        if (!branch)
            missing.push('El viaje no tiene sucursal de origen');
        if (!fiscal?.rfc || !fiscal.razon_social)
            missing.push('Falta la razón social emisora');
        if (!fiscal?.fiscal_regime)
            missing.push('La razón social no tiene régimen fiscal');
        if (!(0, carta_porte_util_1.postalCode)(branch?.postal_code)) {
            missing.push('La sucursal origen no tiene código postal de 5 dígitos');
        }
        if (!(0, carta_porte_util_1.satStateCode)(branch?.state))
            missing.push('La sucursal origen no tiene un estado reconocible');
        if (!(branch?.address ?? '').trim())
            missing.push('La sucursal origen no tiene calle');
        const km = Number(shipping.distance_km);
        if (!Number.isFinite(km) || km <= 0) {
            missing.push('El viaje no tiene kilómetros. Recalcula la ruta');
        }
        const stops = [...(shipping.stops ?? [])].sort((a, b) => (a.stop_sequence ?? 0) - (b.stop_sequence ?? 0));
        if (!stops.length)
            missing.push('El viaje no tiene paradas');
        stops.forEach((stop, index) => this.collectStopMissing(stop, index, missing));
        return missing;
    }
    collectStopMissing(stop, index, missing) {
        const label = stop.sales_order?.folio || `parada ${index + 1}`;
        const customer = stop.sales_order?.customer;
        const address = stop.customer_address;
        if (!customer) {
            missing.push(`${label}: sin cliente`);
            return;
        }
        if (!(0, carta_porte_util_1.isValidRfc)(customer.fiscal_rfc))
            missing.push(`${label}: el cliente no tiene RFC`);
        if (!address) {
            missing.push(`${label}: falta la dirección de entrega`);
            return;
        }
        if (!(address.street_address ?? '').trim())
            missing.push(`${label}: la dirección no tiene calle`);
        if (!(0, carta_porte_util_1.satStateCode)(address.state))
            missing.push(`${label}: el estado de entrega no es reconocible`);
        if (!(0, carta_porte_util_1.postalCode)(address.postal_code)) {
            missing.push(`${label}: el código postal de entrega no tiene 5 dígitos`);
        }
    }
    async goodsOf(shipping, pesoBrutoKg, missing) {
        const orderIds = (shipping.stops ?? []).map((stop) => stop.sales_order_id);
        if (!orderIds.length)
            return [];
        const details = await this.detailRepo.find({
            where: { sales_order_id: (0, typeorm_2.In)(orderIds) },
            relations: ['product'],
        });
        if (!details.length) {
            missing.push('Las órdenes del viaje no tienen productos');
            return [];
        }
        const withoutClave = details.filter((line) => !(line.product?.sat_clave ?? '').trim());
        if (withoutClave.length) {
            const names = [...new Set(withoutClave.map((line) => line.product?.sku || line.product?.name))]
                .filter(Boolean)
                .join(', ');
            missing.push(`Falta la clave SAT del producto: ${names}`);
            return [];
        }
        const quantities = details.map((line) => Number(line.quantity) || 0);
        const weights = (0, carta_porte_util_1.splitWeightKg)(pesoBrutoKg, quantities);
        return details.map((line, index) => ({
            satClave: line.product.sat_clave.trim(),
            description: (line.product.name || line.product.sku || 'Mercancía').trim(),
            quantity: Number(line.quantity) || 0,
            weightKg: weights[index],
        }));
    }
    toXmlInput(shipping) {
        const branch = shipping.origin_billing_branch;
        const fiscal = branch.fiscal_configuration;
        const stops = [...(shipping.stops ?? [])].sort((a, b) => (a.stop_sequence ?? 0) - (b.stop_sequence ?? 0));
        const totalKm = Number(shipping.distance_km);
        const shares = (0, carta_porte_util_1.splitWeightKg)(totalKm, stops.map(() => 1));
        const truck = shipping.truck;
        const driver = shipping.driver;
        return {
            folio: shipping.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
            fecha: cfdiFechaLocal(),
            shippingDate: dateOnly(shipping.shipping_date),
            totalDistanceKm: totalKm,
            emisor: {
                rfc: (0, carta_porte_util_1.normalizeRfc)(fiscal.rfc),
                nombre: fiscal.razon_social.trim(),
                regimen: String(fiscal.fiscal_regime).trim(),
                postalCode: (0, carta_porte_util_1.postalCode)(branch.postal_code),
            },
            origin: {
                rfc: (0, carta_porte_util_1.normalizeRfc)(fiscal.rfc),
                nombre: fiscal.razon_social.trim(),
                address: {
                    street: branch.address.trim(),
                    stateCode: (0, carta_porte_util_1.satStateCode)(branch.state),
                    postalCode: (0, carta_porte_util_1.postalCode)(branch.postal_code),
                },
            },
            destinations: stops.map((stop, index) => {
                const customer = stop.sales_order.customer;
                const address = stop.customer_address;
                return {
                    rfc: (0, carta_porte_util_1.normalizeRfc)(customer.fiscal_rfc),
                    nombre: customerLabel(customer),
                    distanceKm: shares[index],
                    address: {
                        street: address.street_address.trim(),
                        stateCode: (0, carta_porte_util_1.satStateCode)(address.state),
                        postalCode: (0, carta_porte_util_1.postalCode)(address.postal_code),
                    },
                };
            }),
            vehicle: {
                permSct: truck.permiso_sct.trim(),
                numPermisoSct: truck.numero_permiso_sct.trim(),
                configVehicular: truck.tipo_auto_transporte.trim(),
                pesoBrutoVehicularTon: Number(truck.peso_bruto_vehicular),
                placa: (0, carta_porte_util_1.plateCode)(truck.placa),
                anio: truck.anio.trim(),
                aseguraRespCivil: truck.aseguradora_rc.trim(),
                polizaRespCivil: truck.poliza_rc.trim(),
                remolqueSubtipo: truck.subtipo_remolque1,
                remolquePlaca: truck.placa_remolque1,
            },
            operator: {
                rfc: (0, carta_porte_util_1.normalizeRfc)(driver.driver_rfc),
                licencia: (0, carta_porte_util_1.normalizeLicense)(driver.driver_license_number),
                nombre: [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim(),
            },
        };
    }
};
exports.CartaPorteService = CartaPorteService;
exports.CartaPorteService = CartaPorteService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shipping_entity_1.Shipping)),
    __param(1, (0, typeorm_1.InjectRepository)(sales_order_detail_entity_1.SalesOrderDetail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        finkok_provider_configuration_service_1.FinkokProviderConfigurationService,
        finkok_soap_client_1.FinkokSoapClient])
], CartaPorteService);
function dateOnly(value) {
    if (typeof value === 'string')
        return value.slice(0, 10);
    const pad = (n) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}
function cfdiFechaLocal(now = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
function customerLabel(customer) {
    return (customer.fiscal_razon_social?.trim() ||
        [customer.name, customer.lastname].filter(Boolean).join(' ').trim() ||
        'Cliente');
}
//# sourceMappingURL=carta-porte.service.js.map