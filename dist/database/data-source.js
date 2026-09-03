"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const typeorm_options_1 = require("./typeorm.options");
exports.AppDataSource = new typeorm_1.DataSource(typeorm_options_1.typeOrmOptions);
//# sourceMappingURL=data-source.js.map