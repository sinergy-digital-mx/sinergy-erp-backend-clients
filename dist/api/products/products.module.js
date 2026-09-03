"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const product_entity_1 = require("../../entities/products/product.entity");
const product_uom_entity_1 = require("../../entities/products/product-uom.entity");
const price_list_entity_1 = require("../../entities/products/price-list.entity");
const product_price_entity_1 = require("../../entities/products/product-price.entity");
const product_discount_entity_1 = require("../../entities/products/product-discount.entity");
const product_vendor_cost_entity_1 = require("../../entities/products/product-vendor-cost.entity");
const vendor_entity_1 = require("../../entities/vendor/vendor.entity");
const product_attribute_entity_1 = require("../../entities/products/product-attribute.entity");
const product_attribute_value_entity_1 = require("../../entities/products/product-attribute-value.entity");
const product_attribute_assignment_entity_1 = require("../../entities/products/product-attribute-assignment.entity");
const product_controller_1 = require("./product.controller");
const product_service_1 = require("./product.service");
const product_uom_controller_1 = require("./product-uom.controller");
const product_uom_service_1 = require("./product-uom.service");
const price_list_controller_1 = require("./price-list.controller");
const price_list_service_1 = require("./price-list.service");
const product_price_controller_1 = require("./product-price.controller");
const product_price_service_1 = require("./product-price.service");
const product_discount_controller_1 = require("./product-discount.controller");
const product_discount_service_1 = require("./product-discount.service");
const product_vendor_cost_controller_1 = require("./product-vendor-cost.controller");
const product_vendor_cost_service_1 = require("./product-vendor-cost.service");
const product_attribute_controller_1 = require("./product-attribute.controller");
const product_attribute_service_1 = require("./product-attribute.service");
const product_attribute_assignment_controller_1 = require("./product-attribute-assignment.controller");
const product_attribute_assignment_service_1 = require("./product-attribute-assignment.service");
const products_export_service_1 = require("./services/products-export.service");
const product_vendor_import_service_1 = require("./services/product-vendor-import.service");
const product_vendor_import_controller_1 = require("./product-vendor-import.controller");
const rbac_module_1 = require("../rbac/rbac.module");
const uom_catalog_module_1 = require("../uom-catalog/uom-catalog.module");
const s3_service_1 = require("../../common/services/s3.service");
let ProductsModule = class ProductsModule {
};
exports.ProductsModule = ProductsModule;
exports.ProductsModule = ProductsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                product_entity_1.Product,
                product_uom_entity_1.ProductUoM,
                price_list_entity_1.PriceList,
                product_price_entity_1.ProductPrice,
                product_discount_entity_1.ProductDiscount,
                product_vendor_cost_entity_1.ProductVendorCost,
                vendor_entity_1.Vendor,
                product_attribute_entity_1.ProductAttribute,
                product_attribute_value_entity_1.ProductAttributeValue,
                product_attribute_assignment_entity_1.ProductAttributeAssignment,
            ]),
            rbac_module_1.RBACModule,
            uom_catalog_module_1.UoMCatalogModule,
        ],
        controllers: [
            product_attribute_controller_1.ProductAttributeController,
            product_attribute_assignment_controller_1.ProductAttributeAssignmentController,
            product_vendor_import_controller_1.ProductVendorImportController,
            product_controller_1.ProductController,
            product_uom_controller_1.ProductUoMController,
            price_list_controller_1.PriceListController,
            product_price_controller_1.ProductPriceController,
            product_discount_controller_1.ProductDiscountController,
            product_vendor_cost_controller_1.ProductVendorCostController,
        ],
        providers: [
            product_service_1.ProductService,
            product_uom_service_1.ProductUoMService,
            price_list_service_1.PriceListService,
            product_price_service_1.ProductPriceService,
            product_discount_service_1.ProductDiscountService,
            product_vendor_cost_service_1.ProductVendorCostService,
            product_attribute_service_1.ProductAttributeService,
            product_attribute_assignment_service_1.ProductAttributeAssignmentService,
            products_export_service_1.ProductsExportService,
            product_vendor_import_service_1.ProductVendorImportService,
            s3_service_1.S3Service,
        ],
        exports: [
            product_service_1.ProductService,
            product_uom_service_1.ProductUoMService,
            price_list_service_1.PriceListService,
            product_price_service_1.ProductPriceService,
            product_discount_service_1.ProductDiscountService,
            product_vendor_cost_service_1.ProductVendorCostService,
            product_attribute_service_1.ProductAttributeService,
            product_attribute_assignment_service_1.ProductAttributeAssignmentService,
        ],
    })
], ProductsModule);
//# sourceMappingURL=products.module.js.map