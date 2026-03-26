# Inventory Management with UoM Relationships

## El Escenario

Recibes una solicitud de inventario de un proveedor:
- **Producto**: Laptop Dell XPS 13
- **Cantidad recibida**: 2 Cajas
- **Estructura de la Caja**:
  - 1 Caja = 10 Displays
  - 1 Display = 5 Piezas
  - **Total**: 1 Caja = 50 Piezas

## Cómo Manejarlo

### Paso 1: Definir las UoMs del Producto

```
Producto: Laptop Dell XPS 13
├─ Pieza (Individual unit)
├─ Display (Display package)
└─ Caja (Complete box)
```

### Paso 2: Definir las Relaciones

```
Caja → Display: 10
Display → Pieza: 5
Caja → Pieza: 50 (calculada automáticamente)
```

### Paso 3: Recibir Inventario

Cuando recibes 2 Cajas, tienes dos opciones:

#### Opción A: Almacenar en la UoM recibida (Caja)
```json
{
  "product_id": "prod-123",
  "uom_id": "uom-caja",
  "quantity": 2,
  "warehouse_location": "A-1-1",
  "received_date": "2026-03-07",
  "purchase_order": "PO-2026-001"
}
```

**Ventajas:**
- ✅ Refleja exactamente lo que recibiste
- ✅ Fácil de auditar
- ✅ Puedes convertir a otras UoMs cuando necesites

**Desventajas:**
- ❌ Necesitas convertir para saber cuántas piezas tienes

#### Opción B: Convertir y almacenar en la UoM base (Pieza)
```json
{
  "product_id": "prod-123",
  "uom_id": "uom-pieza",
  "quantity": 100,  // 2 Cajas × 50 Piezas/Caja
  "warehouse_location": "A-1-1",
  "received_date": "2026-03-07",
  "purchase_order": "PO-2026-001"
}
```

**Ventajas:**
- ✅ Todos los inventarios en la misma UoM
- ✅ Fácil de sumar/restar
- ✅ Reportes simplificados

**Desventajas:**
- ❌ Pierdes información de cómo fue recibido
- ❌ Difícil de auditar

#### Opción C: Almacenar en ambas (Recomendado)
```json
{
  "product_id": "prod-123",
  "received_uom_id": "uom-caja",
  "received_quantity": 2,
  "base_uom_id": "uom-pieza",
  "base_quantity": 100,
  "warehouse_location": "A-1-1",
  "received_date": "2026-03-07",
  "purchase_order": "PO-2026-001"
}
```

**Ventajas:**
- ✅ Refleja exactamente lo que recibiste
- ✅ Fácil de convertir
- ✅ Fácil de auditar
- ✅ Puedes hacer reportes en cualquier UoM

**Desventajas:**
- ⚠️ Requiere más campos en la base de datos

## Estructura de Base de Datos Recomendada

### Tabla: inventory_movements

```sql
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  
  -- UoM en que fue recibido
  received_uom_id UUID NOT NULL REFERENCES uoms(id) ON DELETE RESTRICT,
  received_quantity DECIMAL(18, 6) NOT NULL,
  
  -- UoM base (para cálculos)
  base_uom_id UUID NOT NULL REFERENCES uoms(id) ON DELETE RESTRICT,
  base_quantity DECIMAL(18, 6) NOT NULL,
  
  -- Metadata
  movement_type ENUM('RECEIPT', 'ISSUE', 'ADJUSTMENT', 'RETURN') NOT NULL,
  reference_type ENUM('PURCHASE_ORDER', 'SALES_ORDER', 'TRANSFER', 'ADJUSTMENT') NOT NULL,
  reference_id VARCHAR(255),
  
  warehouse_location VARCHAR(255),
  notes TEXT,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX idx_inventory_date ON inventory_movements(created_at);
```

### Tabla: inventory_balance

```sql
CREATE TABLE inventory_balance (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  
  -- Saldo en UoM base
  base_uom_id UUID NOT NULL REFERENCES uoms(id) ON DELETE RESTRICT,
  base_quantity DECIMAL(18, 6) NOT NULL DEFAULT 0,
  
  -- Saldo en UoM recibida (opcional, para auditoría)
  received_uom_id UUID REFERENCES uoms(id) ON DELETE SET NULL,
  received_quantity DECIMAL(18, 6),
  
  last_movement_date TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, product_id, warehouse_id)
);

CREATE INDEX idx_balance_product ON inventory_balance(product_id);
CREATE INDEX idx_balance_warehouse ON inventory_balance(warehouse_id);
```

## Flujo Completo: Recibir 2 Cajas

### Paso 1: Crear Movimiento de Inventario

```bash
POST /api/tenant/inventory/movements
{
  "product_id": "prod-123",
  "warehouse_id": "wh-1",
  "received_uom_id": "uom-caja",
  "received_quantity": 2,
  "base_uom_id": "uom-pieza",
  "base_quantity": 100,
  "movement_type": "RECEIPT",
  "reference_type": "PURCHASE_ORDER",
  "reference_id": "PO-2026-001",
  "warehouse_location": "A-1-1",
  "notes": "Recibido de proveedor XYZ"
}
```

**Response:**
```json
{
  "id": "mov-1",
  "product_id": "prod-123",
  "warehouse_id": "wh-1",
  "received_uom_id": "uom-caja",
  "received_quantity": 2,
  "base_uom_id": "uom-pieza",
  "base_quantity": 100,
  "movement_type": "RECEIPT",
  "reference_type": "PURCHASE_ORDER",
  "reference_id": "PO-2026-001",
  "warehouse_location": "A-1-1",
  "created_at": "2026-03-07T10:00:00Z"
}
```

### Paso 2: Sistema Actualiza Saldo

El sistema automáticamente:
1. Suma 100 piezas al saldo base
2. Registra que fueron recibidas como 2 cajas
3. Actualiza `inventory_balance`

```json
{
  "id": "bal-1",
  "product_id": "prod-123",
  "warehouse_id": "wh-1",
  "base_uom_id": "uom-pieza",
  "base_quantity": 100,
  "received_uom_id": "uom-caja",
  "received_quantity": 2,
  "last_movement_date": "2026-03-07T10:00:00Z"
}
```

### Paso 3: Consultar Saldo en Cualquier UoM

#### Opción A: Saldo en Piezas
```bash
GET /api/tenant/inventory/balance/prod-123/wh-1?uom=uom-pieza
```

**Response:**
```json
{
  "product_id": "prod-123",
  "warehouse_id": "wh-1",
  "uom_id": "uom-pieza",
  "quantity": 100
}
```

#### Opción B: Saldo en Cajas
```bash
GET /api/tenant/inventory/balance/prod-123/wh-1?uom=uom-caja
```

**Response:**
```json
{
  "product_id": "prod-123",
  "warehouse_id": "wh-1",
  "uom_id": "uom-caja",
  "quantity": 2
}
```

#### Opción C: Saldo en Displays
```bash
GET /api/tenant/inventory/balance/prod-123/wh-1?uom=uom-display
```

**Response:**
```json
{
  "product_id": "prod-123",
  "warehouse_id": "wh-1",
  "uom_id": "uom-display",
  "quantity": 20  // 100 Piezas ÷ 5 Piezas/Display
}
```

## Ejemplo Real: Múltiples Recepciones

### Recepción 1: 2 Cajas (100 Piezas)
```json
{
  "received_uom_id": "uom-caja",
  "received_quantity": 2,
  "base_quantity": 100
}
```

### Recepción 2: 5 Displays (25 Piezas)
```json
{
  "received_uom_id": "uom-display",
  "received_quantity": 5,
  "base_quantity": 25
}
```

### Recepción 3: 10 Piezas
```json
{
  "received_uom_id": "uom-pieza",
  "received_quantity": 10,
  "base_quantity": 10
}
```

### Saldo Total
```
Total en Piezas: 100 + 25 + 10 = 135 Piezas
Total en Displays: 135 ÷ 5 = 27 Displays
Total en Cajas: 135 ÷ 50 = 2.7 Cajas
```

## Salida de Inventario

Cuando necesitas sacar inventario, el proceso es similar:

```bash
POST /api/tenant/inventory/movements
{
  "product_id": "prod-123",
  "warehouse_id": "wh-1",
  "received_uom_id": "uom-pieza",
  "received_quantity": 25,
  "base_uom_id": "uom-pieza",
  "base_quantity": 25,
  "movement_type": "ISSUE",
  "reference_type": "SALES_ORDER",
  "reference_id": "SO-2026-001",
  "notes": "Enviado a cliente ABC"
}
```

El sistema automáticamente:
1. Resta 25 piezas del saldo
2. Registra la salida
3. Actualiza `inventory_balance`

## Reportes

### Reporte 1: Inventario por UoM
```bash
GET /api/tenant/inventory/report/by-uom?warehouse_id=wh-1
```

**Response:**
```json
[
  {
    "product_id": "prod-123",
    "product_name": "Laptop Dell XPS 13",
    "uom_id": "uom-pieza",
    "uom_name": "Pieza",
    "quantity": 135
  },
  {
    "product_id": "prod-123",
    "product_name": "Laptop Dell XPS 13",
    "uom_id": "uom-display",
    "uom_name": "Display",
    "quantity": 27
  },
  {
    "product_id": "prod-123",
    "product_name": "Laptop Dell XPS 13",
    "uom_id": "uom-caja",
    "uom_name": "Caja",
    "quantity": 2.7
  }
]
```

### Reporte 2: Movimientos de Inventario
```bash
GET /api/tenant/inventory/movements?product_id=prod-123&warehouse_id=wh-1
```

**Response:**
```json
[
  {
    "id": "mov-1",
    "movement_type": "RECEIPT",
    "received_uom_name": "Caja",
    "received_quantity": 2,
    "base_quantity": 100,
    "reference_id": "PO-2026-001",
    "created_at": "2026-03-07T10:00:00Z"
  },
  {
    "id": "mov-2",
    "movement_type": "RECEIPT",
    "received_uom_name": "Display",
    "received_quantity": 5,
    "base_quantity": 25,
    "reference_id": "PO-2026-002",
    "created_at": "2026-03-07T11:00:00Z"
  },
  {
    "id": "mov-3",
    "movement_type": "ISSUE",
    "received_uom_name": "Pieza",
    "received_quantity": 25,
    "base_quantity": 25,
    "reference_id": "SO-2026-001",
    "created_at": "2026-03-07T12:00:00Z"
  }
]
```

## Ventajas de Este Enfoque

| Aspecto | Ventaja |
|--------|---------|
| **Flexibilidad** | Recibe en cualquier UoM, almacena en base, consulta en cualquier UoM |
| **Auditoría** | Registra exactamente cómo fue recibido |
| **Conversión** | Usa las relaciones definidas en el producto |
| **Reportes** | Puede generar reportes en cualquier UoM |
| **Precisión** | Evita errores de conversión manual |
| **Escalabilidad** | Funciona con múltiples almacenes y productos |

## Resumen

```
Recepción: 2 Cajas
    ↓
Convertir a Piezas: 2 × 50 = 100 Piezas
    ↓
Almacenar en inventory_balance
    ↓
Consultar en cualquier UoM:
  - 100 Piezas
  - 20 Displays
  - 2 Cajas
```

## Próximos Pasos

Para implementar esto necesitarías:

1. **Crear entidades:**
   - `InventoryMovement` - Registra cada movimiento
   - `InventoryBalance` - Saldo actual por producto/almacén

2. **Crear servicios:**
   - `InventoryService` - Lógica de movimientos
   - `InventoryConversionService` - Convierte entre UoMs

3. **Crear endpoints:**
   - `POST /api/tenant/inventory/movements` - Crear movimiento
   - `GET /api/tenant/inventory/balance/:productId/:warehouseId` - Consultar saldo
   - `GET /api/tenant/inventory/movements` - Listar movimientos
   - `GET /api/tenant/inventory/report/by-uom` - Reporte

4. **Crear UI:**
   - Formulario para recibir inventario
   - Selector de UoM
   - Visualización de saldo en múltiples UoMs
   - Historial de movimientos

