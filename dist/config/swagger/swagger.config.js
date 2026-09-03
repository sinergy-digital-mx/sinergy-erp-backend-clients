"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerConfig = void 0;
const swagger_1 = require("@nestjs/swagger");
exports.swaggerConfig = new swagger_1.DocumentBuilder()
    .setTitle('Synergy API')
    .setDescription('Synergy ERP Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
//# sourceMappingURL=swagger.config.js.map