"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryVendorExportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const query_vendor_dto_1 = require("./query-vendor.dto");
class QueryVendorExportDto extends (0, swagger_1.OmitType)(query_vendor_dto_1.QueryVendorDto, [
    'page',
    'limit',
]) {
}
exports.QueryVendorExportDto = QueryVendorExportDto;
//# sourceMappingURL=query-vendor-export.dto.js.map