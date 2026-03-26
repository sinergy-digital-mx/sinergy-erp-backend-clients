# Seed - Categorías de Madera

Script para crear categorías y subcategorías de madera para el tenant especificado.

## 📋 Datos a Crear

### Categoría 1: Madera sólida
- **Subcategorías:**
  - Pino
  - Encino
  - Cedro
  - Caoba

### Categoría 2: Tableros de madera
- **Subcategorías:**
  - MDF
  - Triplay
  - OSB
  - Aglomerado

## 🚀 Ejecución

```bash
npx ts-node -r tsconfig-paths/register src/database/scripts/seed-wood-categories.ts
```

## 📊 Output Esperado

```
🌱 Seeding Wood Categories and Subcategories...

📋 Using tenant: Tenant Name

📦 Creating categories and subcategories...

✅ Created category: Madera sólida
   └─ ✅ Created subcategory: Pino
   └─ ✅ Created subcategory: Encino
   └─ ✅ Created subcategory: Cedro
   └─ ✅ Created subcategory: Caoba

✅ Created category: Tableros de madera
   └─ ✅ Created subcategory: MDF
   └─ ✅ Created subcategory: Triplay
   └─ ✅ Created subcategory: OSB
   └─ ✅ Created subcategory: Aglomerado

============================================================
✅ Wood categories seeding completed successfully!
============================================================

📊 Summary:
   - Categories created: 2
   - Subcategories created: 8
   - Tenant: Tenant Name

💡 Next steps:
   1. Create products with these categories
   2. Use category_id and subcategory_id when creating products
   3. Test endpoints to list products by category
```

## 🔍 Verificación

Después de ejecutar el script, verifica que se crearon correctamente:

```bash
# Ver categorías creadas
mysql -u root -p -e "USE sinergy_erp; SELECT id, name FROM categories WHERE tenant_id = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';"

# Ver subcategorías creadas
mysql -u root -p -e "USE sinergy_erp; SELECT id, name, category_id FROM subcategories WHERE tenant_id = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';"
```

## 📝 Ejemplo de Uso

Una vez creadas las categorías, puedes crear productos con ellas:

### 1. Obtener IDs de Categoría y Subcategoría

```bash
# Obtener ID de "Madera sólida"
mysql -u root -p -e "USE sinergy_erp; SELECT id FROM categories WHERE name = 'Madera sólida' AND tenant_id = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';"

# Obtener ID de "Pino"
mysql -u root -p -e "USE sinergy_erp; SELECT id FROM subcategories WHERE name = 'Pino' AND tenant_id = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';"
```

### 2. Crear Producto con Categoría

```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PINO-001",
    "name": "Tabla de Pino 2x4",
    "description": "Tabla de pino de 2 pulgadas x 4 pulgadas",
    "category_id": "{category_id_madera_solida}",
    "subcategory_id": "{subcategory_id_pino}"
  }'
```

### 3. Listar Productos por Categoría

```bash
curl -X GET http://localhost:3000/products/category/{category_id_madera_solida} \
  -H "Authorization: Bearer {token}"
```

### 4. Listar Productos por Subcategoría

```bash
curl -X GET http://localhost:3000/products/subcategory/{subcategory_id_pino} \
  -H "Authorization: Bearer {token}"
```

## 🧪 Verificación de Endpoints

### Obtener Categorías

```bash
curl -X GET http://localhost:3000/categories \
  -H "Authorization: Bearer {token}"
```

### Obtener Subcategorías de una Categoría

```bash
curl -X GET http://localhost:3000/categories/{category_id}/subcategories \
  -H "Authorization: Bearer {token}"
```

## 📚 Documentación Relacionada

- **QUICK_START.md** - Comandos rápidos de setup
- **SETUP_COMPLETE_GUIDE.md** - Guía completa de setup
- **PRODUCTS_WITH_CATEGORIES.md** - Integración de categorías con productos

## ✅ Checklist

- [ ] Ejecutar migraciones: `npm run migration:run`
- [ ] Ejecutar script de categorías: `npx ts-node -r tsconfig-paths/register src/database/scripts/seed-wood-categories.ts`
- [ ] Verificar categorías en BD
- [ ] Verificar subcategorías en BD
- [ ] Crear producto con categoría
- [ ] Listar productos por categoría
- [ ] Listar productos por subcategoría

## 🎉 ¡Listo!

Una vez ejecutado el script, tienes:
- ✅ 2 categorías de madera
- ✅ 8 subcategorías
- ✅ Listas para usar en productos

¡Disfruta! 🚀
