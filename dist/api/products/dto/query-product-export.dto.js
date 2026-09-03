"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryProductExportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const query_product_dto_1 = require("./query-product.dto");
class QueryProductExportDto extends (0, swagger_1.OmitType)(query_product_dto_1.QueryProductDto, [
    'page',
    'limit',
]) {
}
exports.QueryProductExportDto = QueryProductExportDto;
//# sourceMappingURL=query-product-export.dto.js.map