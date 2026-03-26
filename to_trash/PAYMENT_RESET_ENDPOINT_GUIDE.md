# 🔄 Endpoint para Resetear Pagos

## ✅ **Nuevo Endpoint Agregado**

### **POST** `/api/tenant/contracts/{contractId}/payments/{paymentId}/reset`

**Descripción**: Deshace un pago, volviéndolo a marcar como pendiente y reseteando todos los montos pagados.

---

## 🎯 **Casos de Uso**

### **Escenario 1: Pago Completo Erróneo**
```javascript
// Estado actual (ERROR)
{
  "amount": 283.05,
  "amount_paid": 283.05,
  "amount_pending": 0,
  "status": "pagado",
  "paid_date": "2026-03-17"
}

// Llamar endpoint reset
POST /api/tenant/contracts/{contractId}/payments/{paymentId}/reset

// Resultado
{
  "amount": 283.05,
  "amount_paid": 0,           // ✅ Reseteado a 0
  "amount_pending": 283.05,   // ✅ Vuelve a estar pendiente
  "status": "pendiente",      // ✅ Estado cambiado
  "paid_date": null,          // ✅ Fecha de pago removida
  "notes": "...Pago reseteado el 2026-03-17 (se devolvió $283.05 al balance)"
}
```

### **Escenario 2: Pago Parcial Erróneo**
```javascript
// Estado actual (ERROR)
{
  "amount": 283.05,
  "amount_paid": 150.00,
  "amount_pending": 133.05,
  "status": "parcial"
}

// Llamar endpoint reset
POST /api/tenant/contracts/{contractId}/payments/{paymentId}/reset

// Resultado
{
  "amount": 283.05,
  "amount_paid": 0,           // ✅ Reseteado
  "amount_pending": 283.05,   // ✅ Todo pendiente
  "status": "pendiente",      // ✅ Ya no parcial
  "first_partial_payment_date": null
}
```

---

## 🔧 **Funcionalidades**

### ✅ **Lo que hace el endpoint:**
1. **Resetea montos**:
   - `amount_paid` → 0
   - `amount_pending` → monto completo
   - `status` → "pendiente"

2. **Limpia fechas**:
   - `paid_date` → null
   - `first_partial_payment_date` → null

3. **Actualiza balance del contrato**:
   - Devuelve el dinero que se había "pagado" al balance pendiente

4. **Registra la acción**:
   - Agrega nota explicando el reset y cuánto se devolvió

### ❌ **Restricciones:**
- No se puede resetear pagos **cancelados**
- Solo funciona con pagos **pagados** o **parciales**

---

## 🚀 **Para el UI**

### **Botón "Deshacer Pago"**
```javascript
// Función para resetear pago
async function resetPayment(contractId, paymentId) {
  try {
    const response = await fetch(
      `/api/tenant/contracts/${contractId}/payments/${paymentId}/reset`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const updatedPayment = await response.json();
      console.log('Pago reseteado:', updatedPayment);
      // Actualizar UI
      refreshPaymentsList();
    }
  } catch (error) {
    console.error('Error al resetear pago:', error);
  }
}
```

### **Condiciones para mostrar el botón:**
```javascript
// Solo mostrar botón "Deshacer" si:
const canReset = payment.status === 'pagado' || 
                 payment.status === 'parcial';

// En la tabla de pagos
{canReset && (
  <button 
    onClick={() => resetPayment(contractId, payment.id)}
    className="btn-reset"
  >
    🔄 Deshacer
  </button>
)}
```

---

## 📊 **Impacto en Estadísticas**

Después del reset, las estadísticas se actualizan automáticamente:

```javascript
// Antes del reset
{
  "paid_count": 16,
  "partial_count": 1,
  "pending_count": 103,
  "total_paid": 4528.80
}

// Después del reset (si se resetea 1 pago de $283.05)
{
  "paid_count": 15,      // -1
  "partial_count": 1,    // Sin cambio
  "pending_count": 104,  // +1
  "total_paid": 4245.75  // -283.05
}
```

---

## 🎯 **Resumen para el UI**

**Endpoint**: `POST /api/tenant/contracts/{contractId}/payments/{paymentId}/reset`

**Usar cuando**: El usuario quiere deshacer un pago que se marcó por error

**Resultado**: El pago vuelve a estado "pendiente" con $0 pagado

**UI**: Agregar botón "🔄 Deshacer" en pagos pagados/parciales