"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePriceListDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_price_list_dto_1 = require("./create-price-list.dto");
class UpdatePriceListDto extends (0, swagger_1.PartialType)(create_price_list_dto_1.CreatePriceListDto) {
}
exports.UpdatePriceListDto = UpdatePriceListDto;
//# sourceMappingURL=update-price-list.dto.js.map