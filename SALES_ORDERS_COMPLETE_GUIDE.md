# Sales Orders - Guía Completa para Frontend

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Integraciones Automáticas](#integraciones-automáticas)
4. [Endpoints](#endpoints)
5. [Modelos de Datos](#modelos-de-datos)
6. [Permisos RBAC](#permisos-rbac)
7. [Estados de Orden](#estados-de-orden)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [Troubleshooting](#troubleshooting)

---

## Introducción

El módulo de Sales Orders (Órdenes de Venta) permite crear, gestionar y consultar órdenes de venta con:

- **CRUD completo**: Crear, leer, actualizar y eliminar órdenes
- **Line Items (Productos)**: Agregar productos con cantidades, precios e impuestos
- **Cálculo automático de totales**: Subtotal, IVA, IEPS y total general
- **Paginación**: Listado eficiente con límites configurables
- **Búsqueda y filtrado**: Por nombre y estado
- **Multi-tenancy**: Aislamiento completo de datos por tenant
- **RBAC**: Control de acceso basado en permisos
- **Integración con Inventory**: Reservas automáticas de stock

### Base URL
```
/tenant/sales-orders
```

---

## Autenticación

Todos los endpoints requieren autenticación mediante JWT token:

```
Authorization: Bearer {jwt_token}
```

El token incluye automáticamente:
- `tenantId`: ID del tenant (multi-tenancy)
- `userId`: ID del usuario autenticado

**No es necesario enviar estos campos en el body**, el backend los extrae del token.

---

## Integraciones Automáticas

### 🔄 Sales Orders → Inventory (Reservas de Stock)

**Cuando una Sales Order cambia de estado:**

#### Estado: `draft` → `confirmed`
- Crea automáticamente `StockReservation` para cada línea
- Reduce `quantity_available` en el inventario
- Incrementa `quantity_reserved`
- ⚠️ Si no hay stock suficiente, la operación falla

#### Estado: `confirmed` → `completed`
- Cumple las reservas existentes
- Crea `InventoryMovement` tipo `sales_shipment`
- Reduce `quantity_on_hand` y `quantity_reserved`

#### Estado: `confirmed` → `cancelled`
- Cancela las reservas existentes
- Libera el stock reservado
- NO crea movimientos de inventario

**✅ No requiere acción del frontend** - Es completamente automático.


---

## Endpoints

### 1. Crear Sales Order

**Endpoint:** `POST /tenant/sales-orders`

**Request Body (con line items):**
```json
{
  "customer_id": 123,
  "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
  "name": "Order #12345",
  "description": "Monthly subscription renewal",
  "delivery_date": "2026-03-15",
  "status": "draft",
  "metadata": {
    "customer_notes": "Urgent delivery",
    "priority": "high"
  },
  "line_items": [
    {
      "product_id": "258008be-6173-4140-a0df-6f752d691f2c",
      "uom_id": "82f13c32-df50-4918-9306-f1e7079920ef",
      "quantity": 10,
      "unit_price": 100.00,
      "iva_percentage": 16,
      "ieps_percentage": 0
    },
    {
      "product_id": "358008be-6173-4140-a0df-6f752d691f2d",
      "uom_id": "92f13c32-df50-4918-9306-f1e7079920f0",
      "quantity": 5,
      "unit_price": 200.00,
      "iva_percentage": 16,
      "ieps_percentage": 8
    }
  ]
}
```

**Campos requeridos:**
- `name` (string): Nombre de la orden
- `warehouse_id` (UUID): ID del almacén

**Campos opcionales:**
- `customer_id` (number): ID del cliente (opcional)
- `description` (string): Descripción de la orden
- `delivery_date` (string): Fecha de entrega (formato ISO 8601: YYYY-MM-DD)
- `status` (enum): Estado inicial (default: "draft")
- `metadata` (object): Datos adicionales en formato JSON
- `line_items` (array): Productos de la orden

**Line Item Fields:**
- `product_id` (UUID): ID del producto (requerido)
- `uom_id` (UUID): ID de la unidad de medida (requerido)
- `quantity` (number): Cantidad (requerido, min: 0.01)
- `unit_price` (number): Precio unitario (requerido, min: 0)
- `iva_percentage` (number): Porcentaje de IVA (opcional, 0-100, default: 0)
- `ieps_percentage` (number): Porcentaje de IEPS (opcional, 0-100, default: 0)

**Cálculos Automáticos:**
El backend calcula automáticamente:
- `subtotal` = quantity × unit_price
- `iva_amount` = subtotal × (iva_percentage / 100)
- `ieps_amount` = subtotal × (ieps_percentage / 100)
- `line_total` = subtotal + iva_amount + ieps_amount
- `total_subtotal` = suma de todos los subtotales
- `total_iva` = suma de todos los iva_amount
- `total_ieps` = suma de todos los ieps_amount
- `grand_total` = total_subtotal + total_iva + total_ieps

**Response (201):**
```json
{
  "id": "sales-order-uuid",
  "tenant_id": "tenant-uuid",
  "customer_id": 123,
  "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
  "name": "Order #12345",
  "description": "Monthly subscription renewal",
  "delivery_date": "2026-03-15",
  "status": "draft",
  "total_subtotal": 2000.00,
  "total_iva": 320.00,
  "total_ieps": 80.00,
  "grand_total": 2400.00,
  "metadata": {
    "customer_notes": "Urgent delivery",
    "priority": "high"
  },
  "lines": [
    {
      "id": "line-uuid-1",
      "sales_order_id": "sales-order-uuid",
      "product_id": "258008be-6173-4140-a0df-6f752d691f2c",
      "uom_id": "82f13c32-df50-4918-9306-f1e7079920ef",
      "quantity": 10.00,
      "unit_price": 100.00,
      "subtotal": 1000.00,
      "iva_percentage": 16.00,
      "iva_amount": 160.00,
      "ieps_percentage": 0.00,
      "ieps_amount": 0.00,
      "line_total": 1160.00,
      "created_at": "2026-03-09T00:00:00.000Z",
      "updated_at": "2026-03-09T00:00:00.000Z"
    },
    {
      "id": "line-uuid-2",
      "sales_order_id": "sales-order-uuid",
      "product_id": "358008be-6173-4140-a0df-6f752d691f2d",
      "uom_id": "92f13c32-df50-4918-9306-f1e7079920f0",
      "quantity": 5.00,
      "unit_price": 200.00,
      "subtotal": 1000.00,
      "iva_percentage": 16.00,
      "iva_amount": 160.00,
      "ieps_percentage": 8.00,
      "ieps_amount": 80.00,
      "line_total": 1240.00,
      "created_at": "2026-03-09T00:00:00.000Z",
      "updated_at": "2026-03-09T00:00:00.000Z"
    }
  ],
  "created_at": "2026-03-09T00:00:00.000Z",
  "updated_at": "2026-03-09T00:00:00.000Z"
}
```

---

### 2. Listar Sales Orders (con paginación)

**Endpoint:** `GET /tenant/sales-orders`

**Query Parameters:**
- `page`: number (default: 1, min: 1)
- `limit`: number (default: 20, min: 1, max: 100)
- `search`: string (búsqueda por nombre, case-insensitive)
- `status`: string (filtrar por estado exacto)

**Ejemplo:** `GET /tenant/sales-orders?page=1&limit=20&status=confirmed&search=Order`

**Response (200):**
```json
{
  "data": [
    {
      "id": "sales-order-uuid",
      "tenant_id": "tenant-uuid",
      "customer_id": 123,
      "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
      "name": "Order #12345",
      "description": "Monthly subscription renewal",
      "delivery_date": "2026-03-15",
      "status": "confirmed",
      "total_subtotal": 2000.00,
      "total_iva": 320.00,
      "total_ieps": 80.00,
      "grand_total": 2400.00,
      "metadata": {},
      "customer": {
        "id": 123,
        "name": "John",
        "lastname": "Doe",
        "email": "john@example.com"
      },
      "warehouse": {
        "id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
        "name": "Main Warehouse",
        "code": "WH001"
      },
      "lines": [
        {
          "id": "line-uuid-1",
          "product_id": "258008be-6173-4140-a0df-6f752d691f2c",
          "quantity": 10.00,
          "unit_price": 100.00,
          "line_total": 1160.00,
          "product": {
            "id": "258008be-6173-4140-a0df-6f752d691f2c",
            "name": "Product A",
            "sku": "SKU001"
          },
          "uom": {
            "id": "82f13c32-df50-4918-9306-f1e7079920ef",
            "name": "Piece",
            "abbreviation": "pcs"
          }
        }
      ],
      "created_at": "2026-03-09T00:00:00.000Z",
      "updated_at": "2026-03-09T00:00:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "hasNext": true,
  "hasPrev": false
}
```

---

### 3. Obtener Sales Order por ID

**Endpoint:** `GET /tenant/sales-orders/:id`

**Response (200):**
```json
{
  "id": "sales-order-uuid",
  "tenant_id": "tenant-uuid",
  "customer_id": 123,
  "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
  "name": "Order #12345",
  "description": "Monthly subscription renewal",
  "delivery_date": "2026-03-15",
  "status": "confirmed",
  "total_subtotal": 2000.00,
  "total_iva": 320.00,
  "total_ieps": 80.00,
  "grand_total": 2400.00,
  "metadata": {
    "customer_notes": "Urgent delivery"
  },
  "customer": {
    "id": 123,
    "name": "John",
    "lastname": "Doe",
    "email": "john@example.com"
  },
  "warehouse": {
    "id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
    "name": "Main Warehouse",
    "code": "WH001"
  },
  "lines": [
    {
      "id": "line-uuid-1",
      "sales_order_id": "sales-order-uuid",
      "product_id": "258008be-6173-4140-a0df-6f752d691f2c",
      "uom_id": "82f13c32-df50-4918-9306-f1e7079920ef",
      "quantity": 10.00,
      "unit_price": 100.00,
      "subtotal": 1000.00,
      "iva_percentage": 16.00,
      "iva_amount": 160.00,
      "ieps_percentage": 0.00,
      "ieps_amount": 0.00,
      "line_total": 1160.00,
      "product": {
        "id": "258008be-6173-4140-a0df-6f752d691f2c",
        "name": "Product A",
        "sku": "SKU001",
        "description": "Product description"
      },
      "uom": {
        "id": "82f13c32-df50-4918-9306-f1e7079920ef",
        "name": "Piece",
        "abbreviation": "pcs"
      },
      "created_at": "2026-03-09T00:00:00.000Z",
      "updated_at": "2026-03-09T00:00:00.000Z"
    }
  ],
  "created_at": "2026-03-09T00:00:00.000Z",
  "updated_at": "2026-03-09T00:00:00.000Z"
}
```

---

### 4. Actualizar Sales Order

**Endpoint:** `PUT /tenant/sales-orders/:id`

**Request Body:** (todos los campos opcionales)
```json
{
  "name": "Order #12345 - Updated",
  "description": "Updated description",
  "status": "confirmed",
  "metadata": {
    "updated_by": "admin",
    "reason": "customer request"
  }
}
```

**⚠️ Importante:** Cambiar el `status` puede desencadenar integraciones automáticas con Inventory.

**Response (200):**
```json
{
  "id": "sales-order-uuid",
  "name": "Order #12345 - Updated",
  "description": "Updated description",
  "status": "confirmed",
  "updated_at": "2026-03-09T01:00:00.000Z"
}
```

---

### 5. Eliminar Sales Order

**Endpoint:** `DELETE /tenant/sales-orders/:id`

**Response (200):**
```json
{
  "message": "Sales order deleted successfully"
}
```

**⚠️ Nota:** Es un hard delete (eliminación permanente).


---

## Modelos de Datos

### SalesOrder

```typescript
{
  id: string;                    // UUID
  tenant_id: string;             // UUID del tenant
  name: string;                  // Nombre de la orden
  description?: string;          // Descripción opcional
  status: "draft" | "confirmed" | "processing" | "completed" | "cancelled";
  metadata?: Record<string, any>; // Datos adicionales en JSON
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

### PaginatedResponse

```typescript
{
  data: SalesOrder[];            // Array de órdenes
  total: number;                 // Total de registros
  page: number;                  // Página actual
  limit: number;                 // Registros por página
  totalPages: number;            // Total de páginas
  hasNext: boolean;              // Hay página siguiente
  hasPrev: boolean;              // Hay página anterior
}
```

---

## Permisos RBAC

Los usuarios necesitan los siguientes permisos para acceder a los endpoints:

| Permiso | Descripción | Endpoints |
|---------|-------------|-----------|
| `sales_orders:Create` | Crear órdenes de venta | POST /tenant/sales-orders |
| `sales_orders:Read` | Ver órdenes de venta | GET /tenant/sales-orders, GET /tenant/sales-orders/:id |
| `sales_orders:Update` | Actualizar órdenes de venta | PUT /tenant/sales-orders/:id |
| `sales_orders:Delete` | Eliminar órdenes de venta | DELETE /tenant/sales-orders/:id |

### Ejemplo de Validación en Angular

```typescript
// auth.service.ts
export class AuthService {
  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions?.includes(permission) || false;
  }
}

// sales-orders.component.ts
export class SalesOrdersComponent {
  canCreate = this.authService.hasPermission('sales_orders:Create');
  canUpdate = this.authService.hasPermission('sales_orders:Update');
  canDelete = this.authService.hasPermission('sales_orders:Delete');
}
```

```html
<!-- sales-orders.component.html -->
<button *ngIf="canCreate" (click)="createOrder()">
  Nueva Orden
</button>

<button *ngIf="canUpdate" (click)="editOrder(order)">
  Editar
</button>

<button *ngIf="canDelete" (click)="deleteOrder(order.id)">
  Eliminar
</button>
```

---

## Estados de Orden

### Ciclo de Vida de una Sales Order

```
draft → confirmed → processing → completed
  ↓         ↓           ↓
  └─────→ cancelled ←───┘
```

### Descripción de Estados

| Estado | Descripción | Integración con Inventory |
|--------|-------------|---------------------------|
| `draft` | Orden en borrador, sin confirmar | Ninguna |
| `confirmed` | Orden confirmada, lista para procesar | ✅ Crea reservas de stock |
| `processing` | Orden en proceso de preparación | Mantiene reservas |
| `completed` | Orden completada y entregada | ✅ Crea movimientos de salida |
| `cancelled` | Orden cancelada | ✅ Cancela reservas de stock |

### Transiciones de Estado Recomendadas

**Flujo normal:**
1. `draft` → `confirmed` (usuario confirma la orden)
2. `confirmed` → `processing` (comienza preparación)
3. `processing` → `completed` (orden entregada)

**Cancelación:**
- Desde `draft` → `cancelled` (sin impacto en inventario)
- Desde `confirmed` → `cancelled` (libera reservas)
- Desde `processing` → `cancelled` (libera reservas)

**⚠️ Importante:** No se recomienda cancelar órdenes en estado `completed`.


---

## Ejemplos de Uso

### Ejemplo 1: Crear Servicio en Angular

```typescript
// sales-order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderService {
  private baseUrl = '/tenant/sales-orders';

  constructor(private http: HttpClient) {}

  // Crear orden
  create(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  // Listar órdenes con filtros
  findAll(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(this.baseUrl, { params: httpParams });
  }

  // Obtener por ID
  findOne(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  // Actualizar orden
  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  // Eliminar orden
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
```

### Ejemplo 2: Componente de Lista

```typescript
// sales-orders-list.component.ts
import { Component, OnInit } from '@angular/core';
import { SalesOrderService } from './sales-order.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-sales-orders-list',
  templateUrl: './sales-orders-list.component.html'
})
export class SalesOrdersListComponent implements OnInit {
  orders: any[] = [];
  loading = false;
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  // Permisos
  canCreate = false;
  canUpdate = false;
  canDelete = false;

  // Filtros
  searchTerm = '';
  selectedStatus = '';

  statuses = ['draft', 'confirmed', 'processing', 'completed', 'cancelled'];

  constructor(
    private salesOrderService: SalesOrderService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkPermissions();
    this.loadOrders();
  }

  checkPermissions() {
    this.canCreate = this.authService.hasPermission('sales_orders:Create');
    this.canUpdate = this.authService.hasPermission('sales_orders:Update');
    this.canDelete = this.authService.hasPermission('sales_orders:Delete');
  }

  loadOrders() {
    this.loading = true;
    const params = {
      page: this.page,
      limit: this.limit,
      search: this.searchTerm || undefined,
      status: this.selectedStatus || undefined
    };

    this.salesOrderService.findAll(params).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadOrders();
  }

  onStatusChange() {
    this.page = 1;
    this.loadOrders();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadOrders();
  }

  deleteOrder(id: string) {
    if (confirm('¿Estás seguro de eliminar esta orden?')) {
      this.salesOrderService.delete(id).subscribe({
        next: () => {
          this.loadOrders();
        },
        error: (error) => {
          console.error('Error deleting order:', error);
        }
      });
    }
  }

  updateStatus(order: any, newStatus: string) {
    this.salesOrderService.update(order.id, { status: newStatus }).subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        alert('Error al actualizar estado: ' + error.error.message);
      }
    });
  }
}
```

### Ejemplo 3: Template HTML

```html
<!-- sales-orders-list.component.html -->
<div class="sales-orders-container">
  <div class="header">
    <h2>Órdenes de Venta</h2>
    <button *ngIf="canCreate" (click)="createOrder()" class="btn-primary">
      Nueva Orden
    </button>
  </div>

  <!-- Filtros -->
  <div class="filters">
    <input 
      type="text" 
      [(ngModel)]="searchTerm" 
      (keyup.enter)="onSearch()"
      placeholder="Buscar por nombre..."
    >
    
    <select [(ngModel)]="selectedStatus" (change)="onStatusChange()">
      <option value="">Todos los estados</option>
      <option *ngFor="let status of statuses" [value]="status">
        {{ status }}
      </option>
    </select>

    <button (click)="onSearch()">Buscar</button>
  </div>

  <!-- Tabla -->
  <table class="orders-table">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Descripción</th>
        <th>Estado</th>
        <th>Fecha Creación</th>
        <th *ngIf="canUpdate || canDelete">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let order of orders">
        <td>{{ order.name }}</td>
        <td>{{ order.description || '-' }}</td>
        <td>
          <span [class]="'status-badge status-' + order.status">
            {{ order.status }}
          </span>
        </td>
        <td>{{ order.created_at | date:'short' }}</td>
        <td *ngIf="canUpdate || canDelete">
          <button *ngIf="canUpdate" (click)="editOrder(order)" class="btn-edit">
            Editar
          </button>
          
          <!-- Cambio rápido de estado -->
          <select 
            *ngIf="canUpdate" 
            [value]="order.status"
            (change)="updateStatus(order, $event.target.value)"
            class="status-select"
          >
            <option *ngFor="let status of statuses" [value]="status">
              {{ status }}
            </option>
          </select>

          <button *ngIf="canDelete" (click)="deleteOrder(order.id)" class="btn-delete">
            Eliminar
          </button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Paginación -->
  <div class="pagination">
    <button [disabled]="page === 1" (click)="onPageChange(page - 1)">
      Anterior
    </button>
    <span>Página {{ page }} de {{ totalPages }}</span>
    <button [disabled]="page >= totalPages" (click)="onPageChange(page + 1)">
      Siguiente
    </button>
  </div>
</div>
```

### Ejemplo 4: Crear Orden con Validación de Stock

```typescript
// Antes de confirmar una orden, validar stock disponible
async confirmOrder(orderId: string) {
  // 1. Obtener la orden
  const order = await this.salesOrderService.findOne(orderId).toPromise();
  
  // 2. Validar stock para cada línea (si tienes line_items)
  for (const line of order.line_items) {
    const inventory = await this.inventoryService.getItems({
      product_id: line.product_id,
      warehouse_id: order.warehouse_id
    }).toPromise();

    if (inventory.data.length === 0) {
      alert(`No hay inventario para el producto ${line.product.name}`);
      return;
    }

    const item = inventory.data[0];
    if (item.quantity_available < line.quantity) {
      alert(`Stock insuficiente para ${line.product.name}. Disponible: ${item.quantity_available}, Requerido: ${line.quantity}`);
      return;
    }
  }

  // 3. Confirmar la orden (esto creará las reservas automáticamente)
  this.salesOrderService.update(orderId, { status: 'confirmed' }).subscribe({
    next: () => {
      alert('Orden confirmada exitosamente');
      this.loadOrders();
    },
    error: (error) => {
      alert('Error al confirmar orden: ' + error.error.message);
    }
  });
}
```


---

## Troubleshooting

### Problema: "Insufficient stock" al confirmar orden

**Causa:** No hay suficiente `quantity_available` en el inventario para las líneas de la orden.

**Solución:**
1. Verificar el inventario actual antes de confirmar
2. Usar el endpoint de inventory para validar stock disponible
3. Mostrar mensaje claro al usuario sobre qué productos no tienen stock

```typescript
// Validación antes de confirmar
const hasStock = await this.validateStock(order);
if (!hasStock) {
  alert('No hay stock suficiente para confirmar esta orden');
  return;
}
```

### Problema: Error 404 al actualizar orden

**Causa:** La orden no existe o pertenece a otro tenant.

**Solución:**
1. Verificar que el ID de la orden sea correcto
2. Verificar que el usuario tenga acceso al tenant correcto
3. Recargar la lista de órdenes para obtener IDs actualizados

### Problema: Error 403 al intentar crear/actualizar/eliminar

**Causa:** El usuario no tiene los permisos necesarios.

**Solución:**
1. Verificar que el usuario tenga el permiso correspondiente:
   - `sales_orders:Create` para crear
   - `sales_orders:Update` para actualizar
   - `sales_orders:Delete` para eliminar
2. Contactar al administrador para solicitar permisos
3. Ocultar botones de acciones no permitidas en el frontend

### Problema: Las reservas no se cancelan al cancelar la orden

**Causa:** Error en el backend o la orden no estaba en estado `confirmed`.

**Solución:**
1. Verificar logs del servidor
2. Consultar reservas manualmente:
   ```
   GET /tenant/inventory/reservations?reference_id=sales-order-id
   ```
3. Cancelar manualmente si es necesario:
   ```
   POST /tenant/inventory/reservations/:id/cancel
   ```

### Problema: Paginación no funciona correctamente

**Causa:** Parámetros de paginación inválidos o fuera de rango.

**Solución:**
1. Validar que `page` sea >= 1
2. Validar que `limit` esté entre 1 y 100
3. Usar valores por defecto si los parámetros son inválidos

```typescript
// Normalización de parámetros
let page = Math.max(1, Number(this.page) || 1);
let limit = Math.min(100, Math.max(1, Number(this.limit) || 20));
```

---

## Códigos de Estado HTTP

- **200**: OK - Operación exitosa
- **201**: Created - Orden creada exitosamente
- **400**: Bad Request - Datos de entrada inválidos
- **401**: Unauthorized - Token inválido o faltante
- **403**: Forbidden - Sin permisos suficientes
- **404**: Not Found - Orden no encontrada
- **409**: Conflict - Conflicto (ej: stock insuficiente al confirmar)
- **500**: Internal Server Error - Error del servidor

---

## Mejores Prácticas

### 1. Validación de Stock Antes de Confirmar

Siempre valida el stock disponible antes de permitir que el usuario confirme una orden:

```typescript
async canConfirmOrder(order: any): Promise<boolean> {
  for (const line of order.line_items) {
    const inventory = await this.checkInventory(line.product_id, order.warehouse_id);
    if (inventory.quantity_available < line.quantity) {
      return false;
    }
  }
  return true;
}
```

### 2. Manejo de Errores Centralizado

```typescript
handleOrderError(operation: string) {
  return (error: any) => {
    console.error(`${operation} failed:`, error);

    let userMessage = 'Error en operación de orden';

    if (error.status === 409) {
      userMessage = 'Stock insuficiente para confirmar la orden';
    } else if (error.status === 404) {
      userMessage = 'Orden no encontrada';
    } else if (error.status === 403) {
      userMessage = 'No tienes permisos para realizar esta operación';
    } else if (error.error?.message) {
      userMessage = error.error.message;
    }

    alert(userMessage);
    return throwError(() => error);
  };
}
```

### 3. Indicadores Visuales de Estado

Usa colores y badges para mostrar el estado de las órdenes:

```css
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-draft {
  background-color: #e0e0e0;
  color: #666;
}

.status-confirmed {
  background-color: #2196F3;
  color: white;
}

.status-processing {
  background-color: #FF9800;
  color: white;
}

.status-completed {
  background-color: #4CAF50;
  color: white;
}

.status-cancelled {
  background-color: #F44336;
  color: white;
}
```

### 4. Confirmación de Acciones Destructivas

Siempre pide confirmación antes de eliminar o cancelar:

```typescript
async deleteOrder(id: string) {
  const confirmed = await this.confirmDialog(
    '¿Eliminar orden?',
    'Esta acción no se puede deshacer'
  );
  
  if (confirmed) {
    this.salesOrderService.delete(id).subscribe({
      next: () => this.loadOrders(),
      error: (error) => this.handleError(error)
    });
  }
}
```

### 5. Caché de Datos Frecuentes

```typescript
// Cachear estados para evitar múltiples requests
private statusesCache$: Observable<string[]> | null = null;

getStatuses(): Observable<string[]> {
  if (!this.statusesCache$) {
    this.statusesCache$ = of([
      'draft', 'confirmed', 'processing', 'completed', 'cancelled'
    ]).pipe(shareReplay(1));
  }
  return this.statusesCache$;
}
```

---

## Resumen de Endpoints

| Método | Endpoint | Descripción | Permiso Requerido |
|--------|----------|-------------|-------------------|
| POST | `/tenant/sales-orders` | Crear orden | `sales_orders:Create` |
| GET | `/tenant/sales-orders` | Listar órdenes | `sales_orders:Read` |
| GET | `/tenant/sales-orders/:id` | Obtener orden | `sales_orders:Read` |
| PUT | `/tenant/sales-orders/:id` | Actualizar orden | `sales_orders:Update` |
| DELETE | `/tenant/sales-orders/:id` | Eliminar orden | `sales_orders:Delete` |

---

## Integración con Otros Módulos

### Módulos Requeridos

| Módulo | Requerido | Propósito |
|--------|-----------|-----------|
| Inventory | ⚠️ Automático | Reservas y movimientos de stock |
| Products | ✅ Sí | Productos en las líneas de orden |
| Customers | ✅ Sí | Cliente asociado a la orden |
| Warehouses | ✅ Sí | Almacén de donde sale el stock |
| Users | ✅ Sí | Usuario creador de la orden |
| RBAC | ✅ Sí | Control de acceso |

### Flujo Completo de Integración

1. **Crear orden en estado draft**
   ```
   POST /tenant/sales-orders
   ```

2. **Agregar líneas de productos** (si tienes módulo de line items)
   ```
   POST /tenant/sales-orders/:id/lines
   ```

3. **Validar stock disponible**
   ```
   GET /tenant/inventory/items?product_id=xxx&warehouse_id=yyy
   ```

4. **Confirmar orden** (crea reservas automáticamente)
   ```
   PUT /tenant/sales-orders/:id
   Body: { "status": "confirmed" }
   ```

5. **Procesar orden**
   ```
   PUT /tenant/sales-orders/:id
   Body: { "status": "processing" }
   ```

6. **Completar orden** (crea movimientos de salida automáticamente)
   ```
   PUT /tenant/sales-orders/:id
   Body: { "status": "completed" }
   ```

---

## Conclusión

Este documento contiene toda la información necesaria para integrar el módulo de Sales Orders en tu interfaz gráfica:

✅ **Endpoints completos** con request/response examples
✅ **Integración automática** con Inventory
✅ **Modelos de datos** TypeScript
✅ **Permisos RBAC** requeridos
✅ **Estados de orden** y transiciones
✅ **Código de ejemplo** en Angular
✅ **Mejores prácticas** de implementación
✅ **Troubleshooting** para problemas comunes

Para cualquier duda adicional, consulta los logs del servidor o revisa la documentación de los módulos complementarios (Inventory, Products, Customers).

