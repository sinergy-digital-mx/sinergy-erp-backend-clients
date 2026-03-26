# Integración de Listas de Precios con Módulos Existentes

## Resumen de Cambios Implementados

### ✅ Completado

1. **Entidades Creadas:**
   - `PriceList` - Listas de precios
   - `ProductPrice` - Precios por producto y lista
   - Relación agregada en `Product` entity

2. **Migraciones Creadas:**
   - `1773000000000-create-price-lists-table.ts`
   - `1773000000001-create-product-prices-table.ts`

3. **API Completa:**
   - DTOs (Create, Update, Query)
   - Service con toda la lógica
   - Controller con todos los endpoints
   - Module configurado

4. **Documentación:**
   - `PRICE_LISTS_GUIDE.md` - Guía completa del sistema

---

## Cambios Pendientes en Módulos Existentes

### 1. Módulo POS

**Archivo:** `src/api/pos/pos.service.ts`

**Cambios necesarios:**

#### A. Agregar campo price_list_id a POSOrder

```typescript
// src/entities/pos/pos-order.entity.ts
@Column({ nullable: true })
price_list_id: string;

@ManyToOne(() => PriceList, { onDelete: 'SET NULL', nullable: true })
@JoinColumn({ name: 'price_list_id' })
price_list: PriceList;
```

#### B. Migración para agregar columna

```sql
ALTER TABLE pos_orders ADD COLUMN price_list_id VARCHAR(36);
ALTER TABLE pos_orders ADD FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE SET NULL;
```

#### C. Actualizar servicio POS

```typescript
// src/api/pos/pos.service.ts
import { PriceListService } from '../price-lists/price-list.service';

constructor(
  // ... otros repositorios
  private readonly priceListService: PriceListService,
) {}

async createOrder(dto: CreatePOSOrderDto, tenantId: string, userId: string) {
  // Obtener lista de precios por defecto si no se especifica
  const priceListId = dto.price_list_id || 
    (await this.priceListService.getDefault(tenantId))?.id;

  const order = this.posOrderRepository.create({
    ...dto,
    tenant_id: tenantId,
    waiter_id: userId,
    price_list_id: priceListId,
    // ...
  });

  return this.posOrderRepository.save(order);
}

async addLineToOrder(orderId: string, dto: CreatePOSOrderLineDto, tenantId: string) {
  const order = await this.findOne(orderId, tenantId);
  
  // Obtener precio de la lista de precios
  let unit_price: number;
  
  if (order.price_list_id) {
    // Usar precio de la lista
    unit_price = await this.priceListService.getProductPrice(
      dto.product_id,
      order.price_list_id,
      tenantId
    );
  } else {
    // Fallback: usar precio por defecto
    const defaultPriceList = await this.priceListService.getDefault(tenantId);
    if (defaultPriceList) {
      unit_price = await this.priceListService.getProductPrice(
        dto.product_id,
        defaultPriceList.id,
        tenantId
      );
    } else {
      throw new BadRequestException('No price list configured');
    }
  }

  // Continuar con la creación de la línea...
  const subtotal = dto.quantity * unit_price;
  // ...
}
```

#### D. Actualizar DTO

```typescript
// src/api/pos/dto/create-pos-order.dto.ts
@IsOptional()
@IsString()
price_list_id?: string;
```

#### E. Actualizar módulo POS

```typescript
// src/api/pos/pos.module.ts
import { PriceListModule } from '../price-lists/price-list.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([...]),
    PriceListModule,  // ← Agregar
  ],
  // ...
})
```

---

### 2. Módulo Sales Orders

**Archivo:** `src/api/sales-orders/sales-order.service.ts`

**Cambios necesarios:**

#### A. Agregar campo price_list_id a SalesOrder

```typescript
// src/entities/sales-orders/sales-order.entity.ts
@Column({ nullable: true })
price_list_id: string;

@ManyToOne(() => PriceList, { onDelete: 'SET NULL', nullable: true })
@JoinColumn({ name: 'price_list_id' })
price_list: PriceList;
```

#### B. Migración

```sql
ALTER TABLE sales_orders ADD COLUMN price_list_id VARCHAR(36);
ALTER TABLE sales_orders ADD FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE SET NULL;
```

#### C. Actualizar servicio

```typescript
// src/api/sales-orders/sales-order.service.ts
import { PriceListService } from '../price-lists/price-list.service';

constructor(
  // ... otros repositorios
  private readonly priceListService: PriceListService,
) {}

async create(dto: CreateSalesOrderDto, tenantId: string): Promise<SalesOrder> {
  // Obtener lista de precios
  const priceListId = dto.price_list_id || 
    (await this.priceListService.getDefault(tenantId))?.id;

  let processedLineItems: SalesOrderLine[] = [];

  if (dto.line_items && dto.line_items.length > 0) {
    processedLineItems = await Promise.all(
      dto.line_items.map(async (item) => {
        // Obtener precio de la lista
        const unit_price = item.unit_price || 
          await this.priceListService.getProductPrice(
            item.product_id,
            priceListId,
            tenantId
          );

        const subtotal = Number(item.quantity) * Number(unit_price);
        // ... resto del cálculo
        
        return this.salesOrderLineRepository.create({
          product_id: item.product_id,
          uom_id: item.uom_id,
          quantity: Number(item.quantity),
          unit_price: Number(unit_price),
          subtotal: Number(subtotal.toFixed(2)),
          // ...
        });
      })
    );
  }

  const salesOrder = this.salesOrderRepository.create({
    tenant_id: tenantId,
    price_list_id: priceListId,
    // ... resto de campos
    lines: processedLineItems,
  });

  return this.salesOrderRepository.save(salesOrder);
}
```

#### D. Actualizar DTO

```typescript
// src/api/sales-orders/dto/create-sales-order.dto.ts
@IsOptional()
@IsString()
price_list_id?: string;

// src/api/sales-orders/dto/create-sales-order-line.dto.ts
// unit_price ahora es opcional (se obtiene de la lista)
@IsOptional()
@IsNumber()
@Min(0)
unit_price?: number;
```

#### E. Actualizar módulo

```typescript
// src/api/sales-orders/sales-orders.module.ts
import { PriceListModule } from '../price-lists/price-list.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([...]),
    PriceListModule,  // ← Agregar
  ],
  // ...
})
```

---

### 3. Módulo Purchase Orders (Opcional)

Purchase Orders usa `VendorProductPrice` que es diferente (precios de proveedores).
No necesita cambios, pero podrías agregar una relación si quieres vincular precios de compra con precios de venta.

---

## Migraciones Adicionales Necesarias

### Migración 1: Agregar price_list_id a pos_orders

```typescript
// src/database/migrations/1773000000002-add-price-list-to-pos-orders.ts
import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddPriceListToPosOrders1773000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pos_orders',
      new TableColumn({
        name: 'price_list_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'pos_orders',
      new TableForeignKey({
        columnNames: ['price_list_id'],
        referencedTableName: 'price_lists',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pos_orders');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('price_list_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('pos_orders', foreignKey);
    }
    await queryRunner.dropColumn('pos_orders', 'price_list_id');
  }
}
```

### Migración 2: Agregar price_list_id a sales_orders

```typescript
// src/database/migrations/1773000000003-add-price-list-to-sales-orders.ts
import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddPriceListToSalesOrders1773000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'sales_orders',
      new TableColumn({
        name: 'price_list_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'sales_orders',
      new TableForeignKey({
        columnNames: ['price_list_id'],
        referencedTableName: 'price_lists',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('sales_orders');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('price_list_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('sales_orders', foreignKey);
    }
    await queryRunner.dropColumn('sales_orders', 'price_list_id');
  }
}
```

---

## Orden de Implementación

1. ✅ **Ejecutar migraciones de listas de precios**
   ```bash
   npm run migration:run
   ```

2. ✅ **Crear lista de precios por defecto**
   ```bash
   POST /tenant/price-lists
   {
     "name": "Precio Estándar",
     "is_default": true,
     "is_active": true
   }
   ```

3. ✅ **Agregar precios a productos**
   ```bash
   POST /tenant/price-lists/product-prices
   {
     "product_id": "...",
     "price_list_id": "...",
     "price": 150.00
   }
   ```

4. **Actualizar módulo POS** (opcional, puede seguir usando precio simple)
   - Agregar migración para price_list_id
   - Actualizar entity, DTO, service
   - Importar PriceListModule

5. **Actualizar módulo Sales Orders** (opcional)
   - Agregar migración para price_list_id
   - Actualizar entity, DTO, service
   - Importar PriceListModule

---

## Compatibilidad Hacia Atrás

El sistema es compatible hacia atrás:

- Si no especificas `price_list_id`, usa la lista por defecto
- Si no hay lista de precios, puede fallar o usar un precio por defecto
- Los módulos existentes pueden seguir funcionando sin cambios

---

## Testing

### 1. Crear lista de precios
```bash
curl -X POST http://localhost:3000/tenant/price-lists \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Menudeo",
    "is_default": true
  }'
```

### 2. Agregar precio de producto
```bash
curl -X POST http://localhost:3000/tenant/price-lists/product-prices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product-uuid",
    "price_list_id": "price-list-uuid",
    "price": 150.00
  }'
```

### 3. Obtener precio
```bash
curl -X GET "http://localhost:3000/tenant/price-lists/price-list-uuid/products/product-uuid/price" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Resumen

✅ **Sistema de listas de precios completamente implementado**
✅ **API completa con todos los endpoints**
✅ **Migraciones de base de datos listas**
✅ **Documentación completa**

⚠️ **Pendiente (opcional):**
- Actualizar POS para usar listas de precios
- Actualizar Sales Orders para usar listas de precios
- Ejecutar migraciones adicionales

El sistema está listo para usar de forma independiente. Los módulos POS y Sales Orders pueden seguir funcionando sin cambios, o puedes integrarlos gradualmente.
