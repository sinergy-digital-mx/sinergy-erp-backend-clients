# Guía de Pagos Parciales y Documentos

## Resumen

Se ha implementado soporte completo para:
1. **Pagos parciales** - Permite registrar pagos menores al monto total esperado
2. **Documentos de pago** - Permite subir comprobantes, fotos de transferencias, recibos, etc.

## Cambios en la Base de Datos

### Tabla `payments` - Nuevos campos:

- `amount_paid` (decimal): Monto realmente pagado (puede ser parcial)
- `amount_pending` (decimal): Diferencia pendiente (amount - amount_paid)
- `first_partial_payment_date` (date): Fecha del primer pago parcial
- `status`: Ahora incluye el estado `'parcial'` además de los existentes

### Nueva tabla `payment_documents`:

- `id` (uuid): Identificador único
- `tenant_id` (uuid): ID del tenant
- `payment_id` (uuid): ID del pago
- `document_type` (enum): Tipo de documento
  - `comprobante_transferencia`
  - `foto_deposito`
  - `recibo`
  - `factura`
  - `otro`
- `file_name` (varchar): Nombre original del archivo
- `s3_key` (varchar): Ruta en S3
- `mime_type` (varchar): Tipo MIME del archivo
- `file_size` (bigint): Tamaño en bytes
- `notes` (text): Notas adicionales
- `uploaded_by` (varchar): ID del usuario que subió
- `metadata` (json): Información adicional
- `created_at`, `updated_at` (timestamp)

## API Endpoints

### 1. Registrar Pago Parcial

**POST** `/tenant/contracts/:contractId/payments/:paymentId/partial-payment`

```json
{
  "amount": 300,
  "payment_date": "2024-02-15",
  "payment_method": "transferencia",
  "reference_number": "REF123456",
  "notes": "Pago parcial - primera parte"
}
```

**Respuesta:**
```json
{
  "id": "payment-uuid",
  "payment_number": 1,
  "amount": 387,
  "amount_paid": 300,
  "amount_pending": 87,
  "status": "parcial",
  "first_partial_payment_date": "2024-02-15",
  "paid_date": "2024-02-15",
  "payment_method": "transferencia",
  "reference_number": "REF123456",
  "notes": "[2024-02-15] Pago parcial - primera parte"
}
```

### 2. Completar Pago Parcial

Puedes llamar nuevamente al endpoint de pago parcial con el monto restante:

```json
{
  "amount": 87,
  "payment_date": "2024-02-20",
  "payment_method": "efectivo",
  "notes": "Completando el pago"
}
```

El sistema automáticamente cambiará el status a `'pagado'` cuando `amount_pending` llegue a 0.

### 3. Subir Documento de Pago

**POST** `/tenant/contracts/:contractId/payments/:paymentId/documents`

**Content-Type:** `multipart/form-data`

**Campos:**
- `file` (archivo): El documento a subir
- `document_type` (string): Tipo de documento
- `notes` (string, opcional): Notas adicionales

**Ejemplo con cURL:**
```bash
curl -X POST \
  http://localhost:3000/tenant/contracts/{contractId}/payments/{paymentId}/documents \
  -H "Authorization: Bearer {token}" \
  -F "file=@comprobante.pdf" \
  -F "document_type=comprobante_transferencia" \
  -F "notes=Comprobante de transferencia bancaria"
```

**Respuesta:**
```json
{
  "id": "doc-uuid",
  "payment_id": "payment-uuid",
  "document_type": "comprobante_transferencia",
  "file_name": "comprobante.pdf",
  "s3_key": "tenant-id/payments/payment-id/uuid.pdf",
  "mime_type": "application/pdf",
  "file_size": 245678,
  "notes": "Comprobante de transferencia bancaria",
  "uploaded_by": "user-uuid",
  "created_at": "2024-02-15T10:30:00Z"
}
```

### 4. Listar Documentos de un Pago

**GET** `/tenant/contracts/:contractId/payments/:paymentId/documents`

**Respuesta:**
```json
[
  {
    "id": "doc-uuid-1",
    "document_type": "comprobante_transferencia",
    "file_name": "comprobante.pdf",
    "file_size": 245678,
    "created_at": "2024-02-15T10:30:00Z"
  },
  {
    "id": "doc-uuid-2",
    "document_type": "foto_deposito",
    "file_name": "foto.jpg",
    "file_size": 1234567,
    "created_at": "2024-02-15T11:00:00Z"
  }
]
```

### 5. Obtener URL de Descarga

**GET** `/tenant/contracts/:contractId/payments/:paymentId/documents/:documentId/url?expiresIn=3600`

**Respuesta:**
```json
{
  "url": "https://s3.amazonaws.com/bucket/path/to/file?signature=..."
}
```

### 6. Eliminar Documento

**DELETE** `/tenant/contracts/:contractId/payments/:paymentId/documents/:documentId`

**Respuesta:**
```json
{
  "message": "Document deleted successfully"
}
```

## Ejemplo de Flujo Completo

### Escenario: Pago mensual de $387, cliente paga $300 primero

1. **Registrar primer pago parcial:**
```bash
POST /tenant/contracts/contract-123/payments/payment-456/partial-payment
{
  "amount": 300,
  "payment_date": "2024-02-15",
  "payment_method": "transferencia",
  "reference_number": "TRANS001"
}
```

Estado del pago:
- `amount`: 387
- `amount_paid`: 300
- `amount_pending`: 87
- `status`: "parcial"

2. **Subir comprobante de transferencia:**
```bash
POST /tenant/contracts/contract-123/payments/payment-456/documents
- file: comprobante_300.pdf
- document_type: comprobante_transferencia
```

3. **Registrar segundo pago (completar):**
```bash
POST /tenant/contracts/contract-123/payments/payment-456/partial-payment
{
  "amount": 87,
  "payment_date": "2024-02-20",
  "payment_method": "efectivo",
  "notes": "Completando pago en efectivo"
}
```

Estado final del pago:
- `amount`: 387
- `amount_paid`: 387
- `amount_pending`: 0
- `status`: "pagado"

4. **Subir foto del recibo:**
```bash
POST /tenant/contracts/contract-123/payments/payment-456/documents
- file: recibo_87.jpg
- document_type: recibo
```

## Validaciones

### Pagos Parciales:
- ✅ El monto debe ser mayor a 0
- ✅ El monto no puede exceder el monto pendiente
- ✅ No se pueden registrar pagos en pagos cancelados
- ✅ No se pueden registrar pagos en pagos ya completados
- ✅ El sistema actualiza automáticamente el balance del contrato

### Documentos:
- ✅ Tipos de archivo permitidos: PDF, JPEG, PNG, HEIC
- ✅ Tamaño máximo: 10MB
- ✅ Los documentos se almacenan en S3 con la ruta: `{tenant_id}/payments/{payment_id}/{uuid}-{filename}`
- ✅ Al eliminar un documento, se borra tanto de la BD como de S3

## Estadísticas de Pagos

El endpoint de estadísticas ahora incluye pagos parciales:

**GET** `/tenant/contracts/:contractId/payments/stats`

```json
{
  "total_payments": 12,
  "paid_count": 8,
  "partial_count": 2,
  "pending_count": 2,
  "overdue_count": 0,
  "cancelled_count": 0,
  "total_paid": 3500.00,
  "total_pending": 774.00,
  "next_payment": {
    "id": "payment-uuid",
    "payment_number": 9,
    "amount": 387,
    "amount_paid": 300,
    "amount_pending": 87,
    "status": "parcial"
  }
}
```

## Migración

Para aplicar los cambios a la base de datos:

```bash
npm run migration:run
```

La migración:
1. Agrega los nuevos campos a la tabla `payments`
2. Actualiza el enum de `status` para incluir `'parcial'`
3. Inicializa `amount_paid` y `amount_pending` para pagos existentes
4. Crea la tabla `payment_documents` con sus índices y foreign keys

## Archivos Creados/Modificados

### Entidades:
- ✅ `src/entities/contracts/payment.entity.ts` - Actualizada con nuevos campos
- ✅ `src/entities/contracts/payment-document.entity.ts` - Nueva entidad

### DTOs:
- ✅ `src/api/contracts/dto/record-partial-payment.dto.ts` - Nuevo
- ✅ `src/api/contracts/dto/upload-payment-document.dto.ts` - Nuevo

### Servicios:
- ✅ `src/api/contracts/payments.service.ts` - Actualizado con método `recordPartialPayment()`
- ✅ `src/api/contracts/payment-documents.service.ts` - Nuevo servicio

### Controladores:
- ✅ `src/api/contracts/payments.controller.ts` - Agregado endpoint de pago parcial
- ✅ `src/api/contracts/payment-documents.controller.ts` - Nuevo controlador

### Módulos:
- ✅ `src/api/contracts/contracts.module.ts` - Actualizado con nuevas entidades y servicios

### Migraciones:
- ✅ `src/database/migrations/1771300000000-add-partial-payments-and-documents.ts` - Nueva migración

## Notas Importantes

1. **Pagos Parciales**: El sistema permite múltiples pagos parciales hasta completar el monto total
2. **Tracking**: Se guarda la fecha del primer pago parcial en `first_partial_payment_date`
3. **Notas**: Cada pago parcial puede agregar notas que se concatenan con timestamp
4. **Balance del Contrato**: Se actualiza automáticamente considerando pagos completos y parciales
5. **Documentos**: Cada pago puede tener múltiples documentos adjuntos
6. **Seguridad**: Los documentos se almacenan en S3 y se generan URLs firmadas con expiración
