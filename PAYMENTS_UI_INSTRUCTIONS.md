# INSTRUCCIONES PARA UI - SISTEMA DE PAGOS

## OBJETIVO
Crear una sección de pagos dentro de la vista de detalle de contratos que permita auto-generar, visualizar, modificar y registrar pagos mensuales.

---

## UBICACIÓN
Agregar una nueva pestaña o sección llamada "Pagos" en la página de detalle del contrato (Contract Detail).

---

## ENDPOINTS DISPONIBLES

### 1. Auto-Generar Pagos
**POST** `/api/tenant/contracts/:contractId/payments/generate`

Genera automáticamente todos los pagos del contrato basándose en los campos payment_months, monthly_payment y first_payment_date del contrato. Solo se puede ejecutar una vez por contrato.

**Respuesta:** Array de pagos creados con todos sus campos.

---

### 2. Listar Pagos
**GET** `/api/tenant/contracts/:contractId/payments`

Obtiene todos los pagos del contrato ordenados por número de pago.

**Respuesta:** Array de objetos con: id, payment_number, amount, due_date, paid_date, status, payment_method, reference_number, notes.

---

### 3. Estadísticas de Pagos
**GET** `/api/tenant/contracts/:contractId/payments/stats`

Obtiene un resumen con: total_payments, paid_count, pending_count, overdue_count, cancelled_count, total_paid, total_pending, next_payment.

**Respuesta:** Objeto con todas las estadísticas calculadas.

---

### 4. Ver Pago Individual
**GET** `/api/tenant/contracts/:contractId/payments/:paymentId`

Obtiene los detalles de un pago específico incluyendo la relación con el contrato.

---

### 5. Modificar Pago
**PUT** `/api/tenant/contracts/:contractId/payments/:paymentId`

Permite modificar amount, due_date o notes de un pago. Solo funciona si el pago tiene status pendiente o vencido.

**Body:** Enviar los campos que quieres modificar: amount (número), due_date (fecha YYYY-MM-DD), notes (texto).

---

### 6. Marcar como Pagado
**POST** `/api/tenant/contracts/:contractId/payments/:paymentId/pay`

Registra un pago como completado. Actualiza automáticamente el remaining_balance del contrato y marca el contrato como completado si todos los pagos están pagados.

**Body requerido:**
- paid_date: fecha en formato YYYY-MM-DD
- payment_method: texto (transferencia, efectivo, tarjeta, cheque)
- reference_number: texto opcional con el número de referencia bancaria

---

### 7. Cancelar Pago
**POST** `/api/tenant/contracts/:contractId/payments/:paymentId/cancel`

Cambia el status del pago a cancelado. No se puede cancelar un pago ya pagado.

---

### 8. Eliminar Pago
**DELETE** `/api/tenant/contracts/:contractId/payments/:paymentId`

Elimina permanentemente un pago. Solo funciona si el pago NO está pagado.

---

## FLUJO DE TRABAJO

### Escenario 1: Contrato Nuevo
1. Usuario crea un contrato con los campos: total_price, down_payment, payment_months, monthly_payment, first_payment_date
2. En la vista de detalle del contrato, mostrar un botón "Generar Pagos"
3. Al hacer click, llamar al endpoint POST generate
4. Mostrar la tabla de pagos generados

### Escenario 2: Contrato Existente con Pagos
1. Al abrir el detalle del contrato, cargar automáticamente los pagos con GET payments
2. Cargar las estadísticas con GET stats
3. Mostrar tabla con todos los pagos y sus estados

---

## COMPONENTES UI NECESARIOS

### 1. Header de Pagos
Mostrar:
- Título "Pagos del Contrato"
- Botón "Generar Pagos" (solo visible si no hay pagos creados)
- Botón "Actualizar" para recargar la lista

### 2. Tarjetas de Estadísticas
Mostrar en cards o badges:
- Total de pagos
- Pagos completados (en verde)
- Pagos pendientes (en amarillo)
- Pagos vencidos (en rojo)
- Total pagado en dólares
- Total pendiente en dólares
- Próximo pago (número y fecha)

### 3. Tabla de Pagos
Columnas:
- Número de Pago (payment_number)
- Monto (amount) en formato moneda
- Fecha de Vencimiento (due_date)
- Fecha de Pago (paid_date, mostrar guión si es null)
- Estado (status) con badge de color según el estado
- Método de Pago (payment_method, mostrar guión si es null)
- Referencia (reference_number, mostrar guión si es null)
- Acciones (botones según el estado)

### 4. Botones de Acción por Fila
Según el status del pago:

**Si status es "pendiente" o "vencido":**
- Botón "Marcar como Pagado" (abre modal)
- Botón "Editar" (abre modal)
- Botón "Cancelar"
- Botón "Eliminar"

**Si status es "pagado":**
- Solo mostrar información, sin botones

**Si status es "cancelado":**
- Botón "Eliminar"

### 5. Modal para Marcar como Pagado
Campos del formulario:
- Fecha de Pago (date picker, por defecto hoy)
- Método de Pago (dropdown: transferencia, efectivo, tarjeta, cheque)
- Número de Referencia (input text, opcional)
- Botón "Confirmar Pago"

Al confirmar, llamar al endpoint POST pay y recargar la tabla y estadísticas.

### 6. Modal para Editar Pago
Campos del formulario:
- Monto (input number)
- Fecha de Vencimiento (date picker)
- Notas (textarea)
- Botón "Guardar Cambios"

Al guardar, llamar al endpoint PUT y recargar la tabla.

---

## ESTADOS Y COLORES

- **pendiente**: Badge amarillo o naranja
- **pagado**: Badge verde
- **vencido**: Badge rojo
- **cancelado**: Badge gris

---

## VALIDACIONES

1. No permitir generar pagos si ya existen pagos para el contrato
2. No permitir editar o eliminar pagos con status "pagado"
3. No permitir cancelar pagos con status "pagado"
4. Mostrar confirmación antes de eliminar un pago
5. Validar que la fecha de pago no sea futura al marcar como pagado
6. Validar que el monto sea mayor a 0 al editar

---

## COMPORTAMIENTO AUTOMÁTICO

Cuando se marca un pago como pagado:
- El sistema actualiza automáticamente el campo remaining_balance del contrato
- Si todos los pagos están pagados, el contrato cambia su status a "completado"
- Estos cambios se reflejan automáticamente en la vista del contrato

---

## PERMISOS

Todos los endpoints usan permisos de Contract:
- Ver pagos: requiere Contract:Read
- Generar pagos: requiere Contract:Create
- Modificar/Pagar/Cancelar: requiere Contract:Update
- Eliminar: requiere Contract:Delete

---

## EJEMPLO DE USO

Contrato: LOT-1-02 de Jason Gomez
- Total: $71,115.34
- Enganche: $989.71
- Meses de pago: 12
- Pago mensual: $71.85
- Primera fecha: 2024-01-15

Al generar pagos, se crean 12 pagos:
- Pago 1: $71.85 vence 2024-01-15
- Pago 2: $71.85 vence 2024-02-15
- Pago 3: $71.85 vence 2024-03-15
- ... hasta el pago 12

Usuario puede:
- Marcar el pago 1 como pagado hoy con método "transferencia"
- Editar el pago 5 para cambiar el monto a $80.00
- Marcar el pago 3 como pagado antes que el pago 2 (pagos adelantados)
- Ver que el saldo restante del contrato se actualiza automáticamente

---

## NOTAS IMPORTANTES

1. Los pagos se pueden pagar en cualquier orden, no es necesario pagar en secuencia
2. Se pueden pagar múltiples pagos por adelantado
3. El sistema calcula automáticamente el saldo restante cada vez que se marca un pago como pagado
4. Cuando el saldo llega a cero, el contrato se marca como completado automáticamente
5. Los pagos vencidos se marcan automáticamente por el sistema (hay un proceso que revisa las fechas)
