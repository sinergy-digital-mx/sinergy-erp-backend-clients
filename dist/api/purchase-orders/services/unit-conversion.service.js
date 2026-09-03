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
var UnitConversionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitConversionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const products_1 = require("../../../entities/products");
let UnitConversionService = UnitConversionService_1 = class UnitConversionService {
    productUomRepository;
    logger = new common_1.Logger(UnitConversionService_1.name);
    constructor(productUomRepository) {
        this.productUomRepository = productUomRepository;
    }
    async getProductUomsByProductId(productId) {
        return await this.productUomRepository.find({
            where: { product_id: productId },
        });
    }
    async getProductUomId(uomId, productId) {
        this.logger.debug(`Getting product_uom.id for UOM ${uomId} and product ${productId}`);
        let productUom = await this.productUomRepository.findOne({
            where: {
                id: uomId,
                product_id: productId,
            },
        });
        if (!productUom) {
            productUom = await this.productUomRepository.findOne({
                where: {
                    uom_catalog_id: uomId,
                    product_id: productId,
                },
            });
        }
        if (!productUom) {
            this.logger.error(`ProductUoM not found for product ${productId} with UOM ${uomId}`);
            throw new common_1.BadRequestException(`Unidad de medida no soportada para este producto`);
        }
        this.logger.debug(`Product UOM ID: ${productUom.id}`);
        return productUom.id;
    }
    async getConversionFactor(productUomId) {
        const productUom = await this.productUomRepository.findOne({
            where: { id: productUomId },
        });
        if (!productUom) {
            throw new common_1.BadRequestException(`Unidad de medida no encontrada: ${productUomId}`);
        }
        return productUom.factor || 1;
    }
    async getBaseUom(productId) {
        this.logger.debug(`Getting base UOM for product: ${productId}`);
        const baseUom = await this.productUomRepository.findOne({
            where: {
                product_id: productId,
                is_base: true,
            },
        });
        if (!baseUom) {
            this.logger.error(`Unidad de medida base no encontrada para el producto: ${productId}`);
            throw new common_1.BadRequestException(`Unidad de medida base no encontrada para el producto: ${productId}`);
        }
        this.logger.debug(`Base UOM found: ${baseUom.uom_catalog_id}`);
        return baseUom.uom_catalog_id;
    }
    async convertToBaseUnit(quantity, productUomId, productId) {
        this.logger.debug(`Converting quantity ${quantity} from product UOM ${productUomId} for product ${productId}`);
        const productUom = await this.productUomRepository.findOne({
            where: {
                id: productUomId,
                product_id: productId,
            },
        });
        if (!productUom) {
            this.logger.error(`ProductUoM not found for product ${productId} with ID ${productUomId}`);
            throw new common_1.BadRequestException(`Unidad de medida no soportada para este producto`);
        }
        this.logger.debug(`ProductUoM found: is_base=${productUom.is_base}, factor=${productUom.factor}`);
        if (productUom.is_base) {
            this.logger.debug(`UOM is already base, no conversion needed`);
            return quantity;
        }
        const factor = productUom.factor || 1;
        const convertedQuantity = quantity * factor;
        this.logger.debug(`Converted quantity: ${quantity} * ${factor} = ${convertedQuantity}`);
        return convertedQuantity;
    }
};
exports.UnitConversionService = UnitConversionService;
exports.UnitConversionService = UnitConversionService = UnitConversionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(products_1.ProductUoM)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UnitConversionService);
//# sourceMappingURL=unit-conversion.service.js.map