"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductAttributeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_product_attribute_dto_1 = require("./create-product-attribute.dto");
class UpdateProductAttributeDto extends (0, swagger_1.PartialType)(create_product_attribute_dto_1.CreateProductAttributeDto) {
}
exports.UpdateProductAttributeDto = UpdateProductAttributeDto;
//# sourceMappingURL=update-product-attribute.dto.js.map