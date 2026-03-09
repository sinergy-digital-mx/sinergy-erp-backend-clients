# Crear Orden POS con Líneas

## Cambios Implementados

Se ha actualizado el endpoint de crear orden POS para aceptar `line_items` en el mismo request.

### Archivos Modificados
- `src/api/pos/dto/create-pos-order.dto.ts` - Agregado campo `line_items` opcional
- `src/api/pos/pos.service.ts` - Agregado procesamiento de líneas en `createOrder`

---

## Endpoint Actualizado

### Crear Orden POS (con o sin líneas)

```http
POST /api/tenant/pos/orders
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (Opción 1 - Sin líneas):**
```json
{
  "warehouse_id": "uuid-almacen",
  "table_number": "5",
  "zone": "Terraza",
  "notes": "Cliente VIP"
}
```

**Request Body (Opción 2 - Con líneas):**
```json
{
  "warehouse_id": "uuid-almacen",
  "table_number": "5",
  "zone": "Terraza",
  "notes": "Cliente VIP",
  "line_items": [
    {
      "product_id": "uuid-producto-1",
      "uom_id": "uuid-uom",
      "quantity": 2,
      "discount_percentage": 0,
      "notes": "Sin cebolla"
    },
    {
      "product_id": "uuid-producto-2",
      "uom_id": "uuid-uom",
      "quantity": 1,
      "discount_percentage": 10,
      "notes": "Extra queso"
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "order-uuid",
  "order_number": "POS-001",
  "warehouse_id": "uuid-almacen",
  "waiter_id": "uuid-mesero",
  "table_number": "5",
  "zone": "Terraza",
  "status": "pending",
  "subtotal": 250.00,
  "tax": 40.00,
  "discount": 0,
  "tip": 0,
  "total": 290.00,
  "lines": [
    {
      "id": "line-uuid-1",
      "product_id": "uuid-producto-1",
      "product": {
        "id": "uuid-producto-1",
        "name": "Hamburguesa",
        "sku": "FOOD-001"
      },
      "quantity": 2,
      "unit_price": 100.00,
      "subtotal": 200.00,
      "discount_percentage": 0,
      "discount_amount": 0,
      "line_total": 200.00,
      "status": "pending"
    },
    {
      "id": "line-uuid-2",
      "product_id": "uuid-producto-2",
      "product": {
        "id": "uuid-producto-2",
        "name": "Refresco",
        "sku": "BEV-001"
      },
      "quantity": 1,
      "unit_price": 50.00,
      "subtotal": 50.00,
      "discount_percentage": 10,
      "discount_amount": 5.00,
      "line_total": 45.00,
      "status": "pending"
    }
  ],
  "created_at": "2026-03-09T10:00:00.000Z"
}
```

---

## Campos del DTO

### CreatePOSOrderDto

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `warehouse_id` | UUID | ✅ Sí | ID del almacén/ubicación del POS |
| `table_number` | string | ❌ No | Número de mesa |
| `zone` | string | ❌ No | Zona (ej: "Terraza", "Interior") |
| `notes` | string | ❌ No | Notas de la orden |
| `line_items` | array | ❌ No | Array de líneas a agregar |

### AddLineItemDto (dentro de line_items)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `product_id` | UUID | ✅ Sí | ID del producto |
| `uom_id` | UUID | ✅ Sí | ID de la unidad de medida |
| `quantity` | number | ✅ Sí | Cantidad (mínimo 0.0001) |
| `discount_percentage` | number | ❌ No | Porcentaje de descuento (0-100) |
| `notes` | string | ❌ No | Notas especiales (ej: "Sin cebolla") |

---

## Importante: Precios Automáticos

⚠️ **El sistema calcula automáticamente los precios** desde la tabla `vendor_product_prices`.

**NO envíes estos campos** (serán ignorados):
- ❌ `unit_price` - Se calcula automáticamente
- ❌ `iva_percentage` - No se usa en POS
- ❌ `ieps_percentage` - No se usa en POS
- ❌ `subtotal` - Se calcula automáticamente
- ❌ `line_total` - Se calcula automáticamente

**El sistema hace:**
1. Busca el precio en `vendor_product_prices` para el `product_id` y `uom_id`
2. Calcula: `subtotal = quantity × unit_price`
3. Calcula: `discount_amount = subtotal × (discount_percentage / 100)`
4. Calcula: `line_total = subtotal - discount_amount`
5. Suma todos los `line_total` para obtener el total de la orden

---

## Ejemplos de Uso

### Ejemplo 1: Orden Simple con 1 Producto

```typescript
const orderData = {
  warehouse_id: '87d51981-5697-4dc5-99e8-5149f8fbffe7',
  line_items: [
    {
      product_id: '258008be-6173-4140-a0df-6f752d691f2c',
      uom_id: '465cc000-56b9-4536-a5cd-f86f8c195151',
      quantity: 1
    }
  ]
};

this.http.post('/api/tenant/pos/orders', orderData).subscribe(
  order => console.log('Orden creada:', order),
  error => console.error('Error:', error)
);
```

### Ejemplo 2: Orden con Múltiples Productos y Descuentos

```typescript
const orderData = {
  warehouse_id: '87d51981-5697-4dc5-99e8-5149f8fbffe7',
  table_number: '12',
  zone: 'Terraza',
  line_items: [
    {
      product_id: 'uuid-hamburguesa',
      uom_id: 'uuid-pieza',
      quantity: 2,
      notes: 'Sin cebolla'
    },
    {
      product_id: 'uuid-refresco',
      uom_id: 'uuid-pieza',
      quantity: 2,
      discount_percentage: 10 // 10% de descuento
    },
    {
      product_id: 'uuid-papas',
      uom_id: 'uuid-porcion',
      quantity: 1
    }
  ]
};
```

### Ejemplo 3: Orden sin Líneas (agregar después)

```typescript
// Paso 1: Crear orden vacía
const orderData = {
  warehouse_id: '87d51981-5697-4dc5-99e8-5149f8fbffe7',
  table_number: '5'
};

this.http.post('/api/tenant/pos/orders', orderData).subscribe(order => {
  // Paso 2: Agregar líneas una por una
  const lineData = {
    product_id: 'uuid-producto',
    uom_id: 'uuid-uom',
    quantity: 1
  };
  
  this.http.post(`/api/tenant/pos/orders/${order.id}/lines`, lineData)
    .subscribe(line => console.log('Línea agregada:', line));
});
```

---

## Validaciones

### 1. Producto Debe Existir

```typescript
// El backend valida que el product_id exista y pertenezca al tenant
// Si no existe, devuelve 404:
{
  "statusCode": 404,
  "message": "Product with ID {id} not found for this tenant"
}
```

### 2. Producto Debe Tener Precio

```typescript
// Si el producto no tiene precio en vendor_product_prices,
// se usa unit_price = 0
// Recomendación: Validar en el frontend antes de enviar
```

### 3. Cantidad Mínima

```typescript
// quantity debe ser mayor a 0.0001
// Si es menor, devuelve 400:
{
  "statusCode": 400,
  "message": ["quantity must not be less than 0.0001"]
}
```

### 4. Descuento Válido

```typescript
// discount_percentage debe ser entre 0 y 100
// Si es negativo, devuelve 400:
{
  "statusCode": 400,
  "message": ["discount_percentage must not be less than 0"]
}
```

---

## Flujo Completo en Angular

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface POSOrderLine {
  product_id: string;
  uom_id: string;
  quantity: number;
  discount_percentage?: number;
  notes?: string;
}

export interface CreatePOSOrder {
  warehouse_id: string;
  table_number?: string;
  zone?: string;
  notes?: string;
  line_items?: POSOrderLine[];
}

@Injectable({ providedIn: 'root' })
export class POSService {
  constructor(private http: HttpClient) {}

  createOrder(data: CreatePOSOrder): Observable<any> {
    return this.http.post('/api/tenant/pos/orders', data);
  }

  // Helper: Crear orden desde carrito
  createOrderFromCart(
    warehouseId: string,
    cartItems: Array<{ product: any; quantity: number; discount?: number }>,
    tableNumber?: string
  ): Observable<any> {
    const orderData: CreatePOSOrder = {
      warehouse_id: warehouseId,
      table_number: tableNumber,
      line_items: cartItems.map(item => ({
        product_id: item.product.id,
        uom_id: item.product.base_uom_id, // o el UoM seleccionado
        quantity: item.quantity,
        discount_percentage: item.discount || 0
      }))
    };

    return this.createOrder(orderData);
  }
}
```

### Componente de Ejemplo

```typescript
export class POSCheckoutComponent {
  cartItems: any[] = [];
  selectedWarehouse: string = '';
  tableNumber: string = '';

  constructor(private posService: POSService) {}

  checkout() {
    if (this.cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    this.posService.createOrderFromCart(
      this.selectedWarehouse,
      this.cartItems,
      this.tableNumber
    ).subscribe(
      order => {
        console.log('Orden creada:', order);
        alert(`Orden ${order.order_number} creada exitosamente`);
        this.cartItems = []; // Limpiar carrito
      },
      error => {
        console.error('Error al crear orden:', error);
        alert('Error al crear la orden: ' + error.error.message);
      }
    );
  }
}
```

---

## Troubleshooting

### Error: "name must be a string"

**Causa:** Estás enviando campos que no existen en el DTO.

**Solución:** Elimina campos como `unit_price`, `iva_percentage`, `ieps_percentage` del payload.

**Payload correcto:**
```json
{
  "warehouse_id": "uuid",
  "line_items": [
    {
      "product_id": "uuid",
      "uom_id": "uuid",
      "quantity": 1
    }
  ]
}
```

### Error: "Product with ID {id} not found"

**Causa:** El `product_id` no existe o no pertenece al tenant.

**Solución:** Verifica que el UUID del producto sea correcto y pertenezca al tenant actual.

### Error: "Order with ID {id} not found"

**Causa:** Intentas agregar líneas a una orden que no existe.

**Solución:** Verifica que el ID de la orden sea correcto.

### Precio en 0

**Causa:** El producto no tiene precio en `vendor_product_prices`.

**Solución:** Agrega el precio del producto:
```http
POST /api/tenant/vendor-product-prices
{
  "vendor_id": "uuid-vendor",
  "product_id": "uuid-producto",
  "uom_id": "uuid-uom",
  "price": 100.00
}
```

---

## Resumen

✅ **Ahora puedes:**
- Crear órdenes POS con líneas en una sola petición
- Crear órdenes vacías y agregar líneas después
- El sistema calcula precios automáticamente

✅ **Payload correcto:**
```json
{
  "warehouse_id": "uuid",
  "line_items": [
    {
      "product_id": "uuid",
      "uom_id": "uuid",
      "quantity": 1,
      "discount_percentage": 0
    }
  ]
}
```

❌ **NO envíes:**
- `unit_price`
- `iva_percentage`
- `ieps_percentage`
- `subtotal`
- `line_total`

🔄 **Acción requerida:**
Reinicia el servidor NestJS para que los cambios tomen efecto.

