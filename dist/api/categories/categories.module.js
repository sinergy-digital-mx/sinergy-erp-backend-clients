"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const category_controller_1 = require("./category.controller");
const subcategory_controller_1 = require("./subcategory.controller");
const category_service_1 = require("./category.service");
const subcategory_service_1 = require("./subcategory.service");
const category_entity_1 = require("../../entities/categories/category.entity");
const subcategory_entity_1 = require("../../entities/categories/subcategory.entity");
const rbac_module_1 = require("../rbac/rbac.module");
let CategoriesModule = class CategoriesModule {
};
exports.CategoriesModule = CategoriesModule;
exports.CategoriesModule = CategoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([category_entity_1.Category, subcategory_entity_1.Subcategory]),
            rbac_module_1.RBACModule,
        ],
        providers: [category_service_1.CategoryService, subcategory_service_1.SubcategoryService],
        controllers: [category_controller_1.CategoryController, subcategory_controller_1.SubcategoryController],
        exports: [category_service_1.CategoryService, subcategory_service_1.SubcategoryService],
    })
], CategoriesModule);
//# sourceMappingURL=categories.module.js.map