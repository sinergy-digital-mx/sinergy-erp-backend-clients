"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
const swagger_config_1 = require("./swagger.config");
function setupSwagger(app) {
    const document = swagger_1.SwaggerModule.createDocument(app, swagger_config_1.swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
}
//# sourceMappingURL=swagger.setup.js.map