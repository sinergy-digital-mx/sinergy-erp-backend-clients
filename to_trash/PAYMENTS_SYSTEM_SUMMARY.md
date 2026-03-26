# SISTEMA DE PAGOS - RESUMEN PARA UI

## 🎯 Funcionalidad Principal

El sistema de pagos permite gestionar todos los pagos de un contrato de forma automática. Cuando se crea un contrato, se pueden auto-generar todos los pagos mensuales, y luego modificarlos, marcarlos como pagados, o cancelarlos individualmente.

---

## 📡 Endpoints

### 1. Auto-Generar Pagos
```
POST /api/tenant/contracts/:contractId/payments/generate
```
**Descripción:** Genera automáticamente todos los pagos del contrato basándose en `payment_months`, `monthly_payment` y `first_payment_date`.

**Ejemplo:** Si el contrato tiene 12 meses de pago, genera 12 pagos con fechas mensuales consecutivas.

**Respuesta:** Array de pagos creados.

---

### 2. Listar Pagos del Contrato
```
GET /api/tenant/contracts/:contractId/payments
```
**Respuesta:**
```json
[
  {
    "id": "uuid",
    "payment_number": 1,
    "amount": 71.85,
    "due_date": "2024-01-15",
    "paid_date": "2024-01-16",
    "status": "pagado",
    "payment_method": "transferencia",
    "reference_number": "REF123456",
    "notes": null
  },
  {
    "id": "uuid",
    "payment_number": 2,
    "amount": 71.85,
    "due_date": "2024-02-15",
    "paid_date": null,
    "status": "pendiente",
    "payment_method": null,
    "reference_number": null,
    "notes": null
  }
]
```

---

### 3. Obtener Estadísticas de Pagos
```
GET /api/tenant/contracts/:contractId/payments/stats
```
**Respuesta:**
```json
{
  "total_payments": 12,
  "paid_count": 3,
  "pending_count": 8,
  "overdue_count": 1,
  "cancelled_count": 0,
  "total_paid": 215.55,
  "total_pending": 646.65,
  "next_payment": {
    "id": "uuid",
    "payment_number": 4,
    "amount": 71.85,
    "due_date": "2024-04-15",
    "status": "pendiente"
  }
}
```

---

### 4. Obtener Pago Específico
```
GET /api/tenant/contracts/:contractId/payments/:paymentId
```

---

### 5. Actualizar Pago
```
PUT /api/tenant/contracts/:contractId/payments/:paymentId
```
**Body:**
```json
{
  "amount": 80.00,
  "due_date": "2024-02-20",
  "notes": "Ajuste por acuerdo"
}
```
**Nota:** Solo se pueden actualizar pagos con status `pendiente` o `vencido`.

---

### 6. Marcar como Pagado
```
POST /api/tenant/contracts/:contractId/payments/:paymentId/pay
```
**Body:**
```json
{
  "paid_date": "2024-01-16",
  "payment_method": "transferencia",
  "reference_number": "REF123456"
}
```
**Efecto:** 
- Cambia status a `pagado`
- Actualiza `remaining_balance` del contrato
- Si todos los pagos están pagados, marca el contrato como `completado`

---

### 7. Cancelar Pago
```
POST /api/tenant/contracts/:contractId/payments/:paymentId/cancel
```
**Efecto:** Cambia status a `cancelado`. No se puede cancelar un pago ya pagado.

---

### 8. Eliminar Pago
```
DELETE /api/tenant/contracts/:contractId/payments/:paymentId
```
**Nota:** Solo se pueden eliminar pagos con status `pendiente` o `cancelado`.

---

## 🔄 Estados de Pago

| Estado | Descripción | Puede Modificar | Puede Pagar | Puede Eliminar |
|--------|-------------|-----------------|-------------|----------------|
| `pendiente` | Pago no realizado | ✅ | ✅ | ✅ |
| `pagado` | Pago completado | ❌ | ❌ | ❌ |
| `vencido` | Pago atrasado | ✅ | ✅ | ✅ |
| `cancelado` | Pago cancelado | ❌ | ❌ | ✅ |

---

## 💡 Flujo de Trabajo Recomendado

### Opción 1: Auto-Generar al Crear Contrato
```typescript
// 1. Crear contrato
const contract = await createContract({
  customer_id: 67,
  property_id: 'uuid',
  total_price: 71115.34,
  down_payment: 989.71,
  payment_months: 12,
  monthly_payment: 71.85,
  first_payment_date: '2024-01-15'
});

// 2. Auto-generar pagos
const payments = await generatePayments(contract.id);
// Resultado: 12 pagos creados automáticamente
```

### Opción 2: Generar Después
```typescript
// 1. Crear contrato sin pagos
const contract = await createContract({...});

// 2. Más tarde, generar pagos
const payments = await generatePayments(contract.id);
```

---

## 🎨 UI Sugerencias

### Vista de Pagos en Contract Detail

```typescript
// Component
payments: Payment[] = [];
stats: PaymentStats = null;

loadPayments() {
  // Cargar pagos
  this.http.get(`/api/tenant/contracts/${contractId}/payments`)
    .subscribe(payments => this.payments = payments);
  
  // Cargar estadísticas
  this.http.get(`/api/tenant/contracts/${contractId}/payments/stats`)
    .subscribe(stats => this.stats = stats);
}

generatePayments() {
  this.http.post(`/api/tenant/contracts/${contractId}/payments/generate`, {})
    .subscribe(() => {
      this.loadPayments();
      alert('Pagos generados exitosamente');
    });
}

markAsPaid(paymentId: string) {
  const data = {
    paid_date: new Date().toISOString().split('T')[0],
    payment_method: 'transferencia',
    reference_number: prompt('Número de referencia:')
  };
  
  this.http.post(`/api/tenant/contracts/${contractId}/payments/${paymentId}/pay`, data)
    .subscribe(() => {
      this.loadPayments();
      alert('Pago registrado');
    });
}
```

### HTML Template
```html
<div class="payments-section">
  <div class="payments-header">
    <h3>Pagos del Contrato</h3>
    <button (click)="generatePayments()" *ngIf="payments.length === 0">
      Generar Pagos
    </button>
  </div>

  <!-- Estadísticas -->
  <div class="payment-stats" *ngIf="stats">
    <div class="stat">
      <span>Total Pagos:</span>
      <strong>{{stats.total_payments}}</strong>
    </div>
    <div class="stat">
      <span>Pagados:</span>
      <strong class="text-success">{{stats.paid_count}}</strong>
    </div>
    <div class="stat">
      <span>Pendientes:</span>
      <strong class="text-warning">{{stats.pending_count}}</strong>
    </div>
    <div class="stat">
      <span>Total Pagado:</span>
      <strong>${{stats.total_paid}}</strong>
    </div>
    <div class="stat">
      <span>Total Pendiente:</span>
      <strong>${{stats.total_pending}}</strong>
    </div>
  </div>

  <!-- Lista de Pagos -->
  <table class="payments-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Monto</th>
        <th>Fecha Vencimiento</th>
        <th>Fecha Pago</th>
        <th>Estado</th>
        <th>Método</th>
        <th>Referencia</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let payment of payments" [class]="'status-' + payment.status">
        <td>{{payment.payment_number}}</td>
        <td>${{payment.amount}}</td>
        <td>{{payment.due_date | date}}</td>
        <td>{{payment.paid_date | date}}</td>
        <td>
          <span class="badge" [class]="'badge-' + payment.status">
            {{payment.status}}
          </span>
        </td>
        <td>{{payment.payment_method || '-'}}</td>
        <td>{{payment.reference_number || '-'}}</td>
        <td>
          <button *ngIf="payment.status === 'pendiente'" 
                  (click)="markAsPaid(payment.id)">
            Marcar Pagado
          </button>
          <button *ngIf="payment.status === 'pendiente'" 
                  (click)="editPayment(payment)">
            Editar
          </button>
          <button *ngIf="payment.status === 'pendiente'" 
                  (click)="cancelPayment(payment.id)">
            Cancelar
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🔒 Permisos

Todos los endpoints usan los permisos de `Contract`:
- `Contract:Read` - Ver pagos
- `Contract:Create` - Generar pagos
- `Contract:Update` - Modificar, pagar, cancelar pagos
- `Contract:Delete` - Eliminar pagos

---

## ⚡ Características Clave

1. **Auto-Generación**: Un click genera todos los pagos del contrato
2. **Modificación Flexible**: Cambia montos y fechas antes de pagar
3. **Balance Automático**: El `remaining_balance` del contrato se actualiza automáticamente
4. **Completado Automático**: Cuando todos los pagos están pagados, el contrato se marca como `completado`
5. **Protección**: No se pueden modificar o eliminar pagos ya pagados
6. **Historial**: Cada pago guarda método de pago, referencia y fecha real de pago

---

## 📊 Ejemplo Real: Contrato LOT-1-02

```
Contrato: LOT-1-02 - Jason Gomez
├── Total: $71,115.34
├── Enganche: $989.71
├── Saldo: $70,125.63
├── Meses: 12
├── Pago Mensual: $71.85
└── Primera Fecha: 2024-01-15

Pagos Generados:
├── Pago 1: $71.85 - 2024-01-15 (pendiente)
├── Pago 2: $71.85 - 2024-02-15 (pendiente)
├── Pago 3: $71.85 - 2024-03-15 (pendiente)
├── ...
└── Pago 12: $71.85 - 2024-12-15 (pendiente)
```

Después de marcar Pago 1 como pagado:
```
Contrato: LOT-1-02
├── Saldo Restante: $70,053.78 (actualizado automáticamente)
└── Pagos:
    ├── Pago 1: $71.85 - 2024-01-15 (pagado ✅)
    ├── Pago 2: $71.85 - 2024-02-15 (pendiente)
    └── ...
```
