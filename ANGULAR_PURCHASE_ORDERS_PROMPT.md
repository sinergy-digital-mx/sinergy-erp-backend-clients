# Prompt para Implementar Módulo de Purchase Orders (Órdenes de Compra) en Angular

## Contexto del Proyecto

Necesito implementar un módulo completo de Purchase Orders (Órdenes de Compra) en Angular 17+ que se conecte a un backend NestJS ya implementado. El módulo debe seguir las mejores prácticas de Angular, ser responsive, y proporcionar una experiencia de usuario fluida para gestionar órdenes de compra.

## Arquitectura del Backend (Ya Implementado)

### Base URL
```
https://api.example.com/tenant/purchase-orders
```

### Autenticación
- Tipo: JWT Bearer Token
- Header: `Authorization: Bearer {token}`
- El token incluye: `tenantId` y `userId`

### Endpoints Disponibles

#### 1. Crear Orden de Compra
```
POST /tenant/purchase-orders
```

**Request Body:**
```typescript
{
  vendor_id: string;           // UUID del proveedor
  purpose: string;             // Propósito de la compra
  warehouse_id: string;        // UUID del almacén
  tentative_receipt_date: string; // Fecha estimada de recepción (ISO 8601)
  status?: 'En Proceso' | 'Recibida' | 'Cancelada'; // Opcional, default: 'En Proceso'
}
```

**Response (201):**
```typescript
{
  id: string;
  vendor_id: string;
  creator_id: string;
  purpose: string;
  warehouse_id: string;
  tentative_receipt_date: string;
  status: 'En Proceso' | 'Recibida' | 'Cancelada';
  payment_status: 'Pagada' | 'Parcial' | 'No pagado';
  total_subtotal: number;
  total_iva: number;
  total_ieps: number;
  grand_total: number;
  remaining_amount: number;
  line_items: LineItem[];
  payments: Payment[];
  created_at: string;
  updated_at: string;
}
```

#### 2. Listar Órdenes de Compra (con paginación y filtros)
```
GET /tenant/purchase-orders?page=1&limit=20&vendor_id={uuid}&status={status}&start_date={date}&end_date={date}
```

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `vendor_id`: string (UUID, opcional)
- `status`: 'En Proceso' | 'Recibida' | 'Cancelada' (opcional)
- `start_date`: string (ISO 8601, opcional)
- `end_date`: string (ISO 8601, opcional)

**Response (200):**
```typescript
{
  data: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### 3. Obtener Orden de Compra por ID
```
GET /tenant/purchase-orders/:id
```

**Response (200):** Objeto PurchaseOrder completo con relaciones

#### 4. Actualizar Orden de Compra
```
PUT /tenant/purchase-orders/:id
```

**Request Body:** Todos los campos opcionales
```typescript
{
  vendor_id?: string;
  purpose?: string;
  warehouse_id?: string;
  tentative_receipt_date?: string;
  status?: 'En Proceso' | 'Recibida' | 'Cancelada';
}
```

#### 5. Actualizar Estado de Orden
```
PUT /tenant/purchase-orders/:id/status
```

**Request Body:**
```typescript
{
  status: 'En Proceso' | 'Recibida' | 'Cancelada';
}
```

**Nota:** Cuando el status cambia a 'Recibida', automáticamente se crean movimientos de inventario.

#### 6. Cancelar Orden de Compra
```
POST /tenant/purchase-orders/:id/cancel
```

**Request Body:**
```typescript
{
  reason: string; // Razón de cancelación (requerido)
}
```

#### 7. Eliminar Orden de Compra
```
DELETE /tenant/purchase-orders/:id
```

**Response (200):** Confirmación de eliminación

### Modelos de Datos

#### PurchaseOrder
```typescript
interface PurchaseOrder {
  id: string;
  tenant_id: string;
  vendor_id: string;
  creator_id: string;
  purpose: string;
  warehouse_id: string;
  tentative_receipt_date: string;
  status: 'En Proceso' | 'Recibida' | 'Cancelada';
  cancellation_date?: string;
  cancellation_reason?: string;
  payment_status: 'Pagada' | 'Parcial' | 'No pagado';
  payment_date?: string;
  payment_amount?: number;
  payment_method?: string;
  remaining_amount: number;
  total_subtotal: number;
  total_iva: number;
  total_ieps: number;
  grand_total: number;
  line_items: LineItem[];
  payments: Payment[];
  documents?: Document[];
  warehouse?: Warehouse;
  created_at: string;
  updated_at: string;
}
```

#### LineItem
```typescript
interface LineItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  uom_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  iva_percentage: number;
  iva_amount: number;
  ieps_percentage: number;
  ieps_amount: number;
  line_total: number;
  product?: Product;
  uom?: UoM;
  created_at: string;
  updated_at: string;
}
```

#### Payment
```typescript
interface Payment {
  id: string;
  purchase_order_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

## Requisitos de Implementación

### 1. Estructura del Módulo Angular

Crear un módulo standalone o tradicional con la siguiente estructura:

```
src/app/modules/purchase-orders/
├── components/
│   ├── purchase-order-list/
│   │   ├── purchase-order-list.component.ts
│   │   ├── purchase-order-list.component.html
│   │   ├── purchase-order-list.component.scss
│   │   └── purchase-order-list.component.spec.ts
│   ├── purchase-order-form/
│   │   ├── purchase-order-form.component.ts
│   │   ├── purchase-order-form.component.html
│   │   ├── purchase-order-form.component.scss
│   │   └── purchase-order-form.component.spec.ts
│   ├── purchase-order-detail/
│   │   ├── purchase-order-detail.component.ts
│   │   ├── purchase-order-detail.component.html
│   │   ├── purchase-order-detail.component.scss
│   │   └── purchase-order-detail.component.spec.ts
│   ├── line-item-form/
│   │   ├── line-item-form.component.ts
│   │   ├── line-item-form.component.html
│   │   └── line-item-form.component.scss
│   └── payment-form/
│       ├── payment-form.component.ts
│       ├── payment-form.component.html
│       └── payment-form.component.scss
├── services/
│   ├── purchase-order.service.ts
│   └── purchase-order.service.spec.ts
├── models/
│   ├── purchase-order.model.ts
│   ├── line-item.model.ts
│   └── payment.model.ts
├── guards/
│   └── purchase-order.guard.ts
├── purchase-orders-routing.module.ts
└── purchase-orders.module.ts
```

### 2. Servicio HTTP (purchase-order.service.ts)

Implementar un servicio con los siguientes métodos:

```typescript
@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private apiUrl = environment.apiUrl + '/tenant/purchase-orders';

  constructor(private http: HttpClient) {}

  // CRUD Operations
  create(data: CreatePurchaseOrderDto): Observable<PurchaseOrder>;
  findAll(params: QueryParams): Observable<PaginatedResponse<PurchaseOrder>>;
  findOne(id: string): Observable<PurchaseOrder>;
  update(id: string, data: UpdatePurchaseOrderDto): Observable<PurchaseOrder>;
  updateStatus(id: string, status: string): Observable<PurchaseOrder>;
  cancel(id: string, reason: string): Observable<PurchaseOrder>;
  delete(id: string): Observable<void>;

  // Helper methods
  calculateTotals(lineItems: LineItem[]): Totals;
  exportToPDF(id: string): Observable<Blob>;
  exportToExcel(params: QueryParams): Observable<Blob>;
}
```

**Características requeridas:**
- Manejo de errores con interceptores
- Loading states
- Retry logic para requests fallidos
- Caching opcional para listados

### 3. Componente de Lista (purchase-order-list.component)

**Funcionalidades:**
- Tabla responsive con las siguientes columnas:
  - Número de orden (generado automáticamente)
  - Proveedor (nombre)
  - Almacén (nombre)
  - Fecha de creación
  - Fecha estimada de recepción
  - Estado (badge con colores)
  - Estado de pago (badge con colores)
  - Total
  - Acciones (ver, editar, cancelar, eliminar)

- Filtros:
  - Búsqueda por proveedor (dropdown/autocomplete)
  - Filtro por estado (dropdown)
  - Filtro por rango de fechas (date picker)
  - Filtro por almacén (dropdown)

- Paginación:
  - Controles de página anterior/siguiente
  - Selector de items por página (10, 20, 50, 100)
  - Indicador de total de registros

- Acciones masivas:
  - Exportar a Excel
  - Exportar a PDF

- Ordenamiento:
  - Por fecha de creación (default: DESC)
  - Por total
  - Por proveedor

**Estados visuales:**
- Loading skeleton mientras carga
- Empty state cuando no hay datos
- Error state con opción de retry

### 4. Componente de Formulario (purchase-order-form.component)

**Modo Crear y Editar:**

**Sección 1: Información General**
- Proveedor (dropdown con búsqueda)
- Almacén (dropdown)
- Propósito (textarea)
- Fecha estimada de recepción (date picker)

**Sección 2: Líneas de Orden (Line Items)**
- Tabla editable con:
  - Producto (autocomplete con búsqueda)
  - Unidad de medida (dropdown basado en producto)
  - Cantidad (input numérico)
  - Precio unitario (input numérico)
  - % IVA (input numérico, default: 16)
  - % IEPS (input numérico, default: 0)
  - Subtotal (calculado automáticamente)
  - IVA (calculado automáticamente)
  - IEPS (calculado automáticamente)
  - Total de línea (calculado automáticamente)
  - Acciones (eliminar)

- Botón "Agregar Producto"
- Validación: Al menos 1 línea requerida

**Sección 3: Resumen de Totales**
- Subtotal (suma de todos los subtotales)
- Total IVA (suma de todos los IVA)
- Total IEPS (suma de todos los IEPS)
- Gran Total (subtotal + IVA + IEPS)

**Validaciones:**
- Todos los campos requeridos marcados
- Cantidad > 0
- Precio unitario > 0
- Fecha estimada >= fecha actual
- Al menos 1 línea de orden

**Botones:**
- Guardar como borrador (status: 'En Proceso')
- Cancelar (volver a lista)

### 5. Componente de Detalle (purchase-order-detail.component)

**Vista de solo lectura con:**

**Sección 1: Encabezado**
- Número de orden (destacado)
- Estado (badge grande)
- Estado de pago (badge)
- Fecha de creación
- Creado por (nombre del usuario)

**Sección 2: Información General**
- Proveedor (nombre completo)
- Almacén (nombre)
- Propósito
- Fecha estimada de recepción
- Fecha de cancelación (si aplica)
- Razón de cancelación (si aplica)

**Sección 3: Líneas de Orden**
- Tabla con todas las líneas
- Totales al final

**Sección 4: Pagos** (si existen)
- Lista de pagos realizados
- Total pagado
- Monto restante

**Sección 5: Documentos** (si existen)
- Lista de documentos adjuntos
- Botón para descargar

**Acciones disponibles:**
- Editar (si status = 'En Proceso')
- Cambiar estado a 'Recibida' (si status = 'En Proceso')
- Cancelar (si status = 'En Proceso')
- Eliminar (si status = 'Cancelada')
- Imprimir PDF
- Volver a lista

### 6. Componente de Línea de Orden (line-item-form.component)

Componente reutilizable para agregar/editar líneas:

**Campos:**
- Producto (autocomplete)
- UoM (dropdown)
- Cantidad
- Precio unitario
- % IVA
- % IEPS

**Cálculos automáticos:**
- Subtotal = cantidad × precio_unitario
- IVA = subtotal × (iva_percentage / 100)
- IEPS = subtotal × (ieps_percentage / 100)
- Total = subtotal + IVA + IEPS

### 7. Diálogos/Modales

**Modal de Cancelación:**
- Campo de texto para razón de cancelación (requerido)
- Botones: Confirmar / Cancelar

**Modal de Confirmación de Eliminación:**
- Mensaje de advertencia
- Botones: Eliminar / Cancelar

**Modal de Cambio de Estado:**
- Dropdown para seleccionar nuevo estado
- Mensaje de confirmación
- Botones: Confirmar / Cancelar

### 8. Rutas

```typescript
const routes: Routes = [
  {
    path: '',
    component: PurchaseOrderListComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'purchase_orders:Read' }
  },
  {
    path: 'new',
    component: PurchaseOrderFormComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'purchase_orders:Create' }
  },
  {
    path: ':id',
    component: PurchaseOrderDetailComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'purchase_orders:Read' }
  },
  {
    path: ':id/edit',
    component: PurchaseOrderFormComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'purchase_orders:Update' }
  }
];
```

### 9. Guards de Permisos

Implementar guard que verifique permisos RBAC:
- `purchase_orders:Create`
- `purchase_orders:Read`
- `purchase_orders:Update`
- `purchase_orders:Delete`

### 10. Estilos y UX

**Framework de UI:** (especificar: Angular Material, PrimeNG, Bootstrap, etc.)

**Colores de Estados:**
- En Proceso: Azul (#2196F3)
- Recibida: Verde (#4CAF50)
- Cancelada: Rojo (#F44336)

**Colores de Estado de Pago:**
- Pagada: Verde (#4CAF50)
- Parcial: Naranja (#FF9800)
- No pagado: Gris (#9E9E9E)

**Responsive:**
- Desktop: Tabla completa
- Tablet: Tabla con scroll horizontal
- Mobile: Cards en lugar de tabla

### 11. Manejo de Errores

**Errores HTTP a manejar:**
- 400: Mostrar errores de validación en el formulario
- 401: Redirigir a login
- 403: Mostrar mensaje "No tienes permisos"
- 404: Mostrar mensaje "Orden no encontrada"
- 409: Mostrar mensaje de conflicto (ej: ya cancelada)
- 500: Mostrar mensaje genérico de error

### 12. Testing

Implementar tests unitarios para:
- Servicio HTTP (mocking HttpClient)
- Componentes (mocking service)
- Cálculos de totales
- Validaciones de formularios

### 13. Características Adicionales (Opcionales)

- Búsqueda en tiempo real con debounce
- Autoguardado de borradores
- Historial de cambios
- Notificaciones push cuando cambia el estado
- Exportación a PDF con logo de empresa
- Impresión optimizada
- Modo offline con sincronización

## Integración con Otros Módulos

El módulo debe integrarse con:

1. **Módulo de Proveedores (Vendors):**
   - Endpoint: `GET /tenant/vendors`
   - Para dropdown de selección

2. **Módulo de Productos:**
   - Endpoint: `GET /tenant/products`
   - Para autocomplete de productos

3. **Módulo de Almacenes (Warehouses):**
   - Endpoint: `GET /tenant/warehouses`
   - Para dropdown de almacenes

4. **Módulo de Inventario:**
   - Integración automática al cambiar estado a 'Recibida'
   - Los movimientos de inventario se crean en el backend

## Notas Importantes

1. **Multi-tenant:** Todas las requests incluyen automáticamente el `tenantId` del token JWT
2. **Integración con Inventario:** Al marcar una orden como 'Recibida', el backend automáticamente crea movimientos de inventario tipo `purchase_receipt`
3. **Cálculos:** Todos los cálculos de totales deben hacerse en el frontend y validarse en el backend
4. **Permisos:** Verificar permisos antes de mostrar botones de acción
5. **Optimistic Updates:** Actualizar UI inmediatamente y revertir si falla

## Entregables Esperados

1. Código fuente completo del módulo
2. Tests unitarios con cobertura >80%
3. Documentación de componentes
4. README con instrucciones de instalación
5. Ejemplos de uso
6. Screenshots de las pantallas principales

## Stack Tecnológico Sugerido

- Angular 17+
- RxJS para manejo de estado
- Angular Material / PrimeNG para UI
- NgRx o Akita para state management (opcional)
- Chart.js para gráficos (opcional)
- jsPDF para exportación a PDF
- XLSX para exportación a Excel

## Preguntas para Aclarar

Antes de comenzar, por favor confirma:

1. ¿Qué framework de UI prefieres? (Angular Material, PrimeNG, Bootstrap, etc.)
2. ¿Necesitas state management global? (NgRx, Akita, etc.)
3. ¿Qué idioma debe usar la interfaz? (Español, Inglés, ambos)
4. ¿Necesitas soporte para múltiples monedas?
5. ¿Hay algún diseño específico o mockups que deba seguir?
6. ¿Necesitas funcionalidad offline?
7. ¿Qué navegadores deben ser soportados?

