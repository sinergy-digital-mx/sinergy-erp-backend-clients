import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './category.controller';
import { SubcategoryController } from './subcategory.controller';
import { CategoryService } from './category.service';
import { SubcategoryService } from './subcategory.service';
import { Category } from '../../entities/categories/category.entity';
import { Subcategory } from '../../entities/categories/subcategory.entity';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Subcategory]),
    RBACModule,
  ],
  providers: [CategoryService, SubcategoryService],
  controllers: [CategoryController, SubcategoryController],
  exports: [CategoryService, SubcategoryService],
})
export class CategoriesModule {}
