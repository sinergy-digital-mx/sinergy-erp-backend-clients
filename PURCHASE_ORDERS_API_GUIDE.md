# Purchase Orders API Guide - Angular UI Integration

## Overview

This guide documents all endpoints available for the Purchase Orders module. All endpoints require JWT authentication and are protected by RBAC permissions.

**Base URL:** `/tenant/purchase-orders`

**Authentication:** Bearer token in Authorization header

**Permissions Required:**
- `purchase_orders:Create` - Create new purchase orders
- `purchase_orders:Read` - View purchase orders
- `purchase_orders:Update` - Edit purchase orders, line items, payments, documents
- `purchase_orders:Delete` - Delete purchase orders

---

## 1. Purchase Order Management

### 1.1 Create Purchase Order
**Endpoint:** `POST /tenant/purchase-orders`

**Permission:** `purchase_orders:Create`

**Request Body:**
```json
{
  "vendor_id": "uuid-string",
  "purpose": "string (description of the order)",
  "warehouse_id": "uuid-string",
  "tentative_receipt_date": "YYYY-MM-DD"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "vendor_id": "uuid",
  "creator_id": "uuid",
  "purpose": "string",
  "warehouse_id": "uuid",
  "tentative_receipt_date": "2024-01-15",
  "status": "En Proceso",
  "payment_status": "No pagado",
  "total_subtotal": 0,
  "total_iva": 0,
  "total_ieps": 0,
  "grand_total": 0,
  "remaining_amount": 0,
  "line_items": [],
  "payments": [],
  "documents": [],
  "created_at": "2024-01-10T10:00:00Z",
  "updated_at": "2024-01-10T10:00:00Z"
}
```

**Error Responses:**
- 400: Invalid vendor_id or warehouse_id
- 401: Unauthorized
- 403: Insufficient permissions

---

### 1.2 Get All Purchase Orders (Paginated)
**Endpoint:** `GET /tenant/purchase-orders`

**Permission:** `purchase_orders:Read`

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `vendor_id` (optional): Filter by vendor UUID
- `status` (optional): Filter by status (En Proceso, Recibida, Cancelada)
- `start_date` (optional): Filter by creation date (YYYY-MM-DD)
- `end_date` (optional): Filter by creation date (YYYY-MM-DD)

**Example Request:**
```
GET /tenant/purchase-orders?page=1&limit=20&status=En%20Proceso&vendor_id=abc-123
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "vendor_id": "uuid",
      "purpose": "string",
      "status": "En Proceso",
      "payment_status": "No pagado",
      "grand_total": 1000.00,
      "created_at": "2024-01-10T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasNext": true,
  "hasPrev": false
}
```

---

### 1.3 Get Purchase Order by ID
**Endpoint:** `GET /tenant/purchase-orders/:id`

**Permission:** `purchase_orders:Read`

**Path Parameters:**
- `id`: Purchase Order UUID

**Response (200 OK):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "creator_id": "uuid",
  "purpose": "string",
  "warehouse_id": "uuid",
  "tentative_receipt_date": "2024-01-15",
  "status": "En Proceso",
  "payment_status": "No pagado",
  "total_subtotal": 1000.00,
  "total_iva": 160.00,
  "total_ieps": 80.00,
  "grand_total": 1240.00,
  "remaining_amount": 1240.00,
  "line_items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "quantity": 10,
      "unit_price": 100.00,
      "subtotal": 1000.00,
      "iva_percentage": 16,
      "iva_amount": 160.00,
      "ieps_percentage": 8,
      "ieps_amount": 80.00,
      "line_total": 1240.00
    }
  ],
  "payments": [],
  "documents": [],
  "created_at": "2024-01-10T10:00:00Z",
  "updated_at": "2024-01-10T10:00:00Z"
}
```

**Error Responses:**
- 404: Purchase order not found
- 401: Unauthorized
- 403: Forbidden (different tenant)

---

### 1.4 Update Purchase Order
**Endpoint:** `PUT /tenant/purchase-orders/:id`

**Permission:** `purchase_orders:Update`

**Path Parameters:**
- `id`: Purchase Order UUID

**Request Body (all fields optional):**
```json
{
  "purpose": "string",
  "tentative_receipt_date": "YYYY-MM-DD"
}
```

**Response (200 OK):** Updated purchase order object

**Restrictions:**
- Cannot update cancelled purchase orders (status = 'Cancelada')
- Cannot modify vendor_id, warehouse_id, or creator_id

---

### 1.5 Update Purchase Order Status
**Endpoint:** `PUT /tenant/purchase-orders/:id/status`

**Permission:** `purchase_orders:Update`

**Path Parameters:**
- `id`: Purchase Order UUID

**Request Body:**
```json
{
  "status": "En Proceso | Recibida | Cancelada"
}
```

**Response (200 OK):** Updated purchase order with new status

**Valid Status Transitions:**
- En Proceso → Recibida
- En Proceso → Cancelada
- Recibida → Cancelada

**Error Responses:**
- 400: Invalid status or invalid transition
- 409: Already in that status

---

### 1.6 Cancel Purchase Order
**Endpoint:** `POST /tenant/purchase-orders/:id/cancel`

**Permission:** `purchase_orders:Update`

**Path Parameters:**
- `id`: Purchase Order UUID

**Request Body:**
```json
{
  "cancellation_reason": "string (minimum 10 characters)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "Cancelada",
  "cancellation_date": "2024-01-10",
  "cancellation_reason": "string",
  "...": "other fields"
}
```

**Effects:**
- Sets status to 'Cancelada'
- Records cancellation_date and cancellation_reason
- Prevents further modifications to line items and payments
- Preserves all historical data for audit

---

### 1.7 Delete Purchase Order
**Endpoint:** `DELETE /tenant/purchase-orders/:id`

**Permission:** `purchase_orders:Delete`

**Path Parameters:**
- `id`: Purchase Order UUID

**Response (200 OK):**
```json
{
  "message": "Purchase order deleted successfully"
}
```

**Effects:**
- Deletes purchase order
- Cascade deletes all line items
- Cascade deletes all payments
- Cascade deletes all documents from database AND AWS S3

---

## 2. Line Items Management

### 2.1 Add Line Item to Purchase Order
**Endpoint:** `POST /tenant/purchase-orders/:po-id/line-items`

**Permission:** `purchase_orders:Update`

**Path Parameters:**
- `po-id`: Purchase Order UUID

**Request Body:**
```json
{
  "product_id": "uuid-string",
  "quantity": 10,
  "unit_price": 100.00,
  "iva_percentage": 16,
  "ieps_percentage": 8
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "purchase_order_id": "uuid",
  "product_id": "uuid",
  "quantity": 10,
  "unit_price": 100.00,
  "subtotal": 1000.00,
  "iva_percentage": 16,
  "iva_amount": 160.00,
  "ieps_percentage": 8,
  "ieps_amount": 80.00,
  "line_total": 1240.00,
  "created_at": "2024-01-10T10:00:00Z",
  "updated_at": "2024-01-10T10:00:00Z"
}
```

**Automatic Calculations:**
- `subtotal` = quantity × unit_price
- `iva_amount` = subtotal × (iva_percentage / 100)
- `ieps_amount` = subtotal × (ieps_percentage / 100)
- `line_total` = subtotal + iva_amount + ieps_amount
- Purchase order totals are recalculated

**Error Responses:**
- 400: Invalid product_id or invalid quantities/prices
- 404: Purchase order not found
- 409: Cannot add items to cancelled purchase order

---

### 2.2 Edit Line Item
**Endpoint:** `PUT /tenant/purchase-orders/:po-id/line-items/:item-id`

**Permission:** `purchase_orders:Update`

**Path Parameters:**
- `po-id`: Purchase Order UUID
- `item-id`: Line Item UUID

**Request Body (all fields optional):**
```json
{
  "quantity": 15,
  "unit_price": 120.00,
  "iva_percentage": 16,
  "ieps_percentage": 8
}
```

**Response (200 OK):** Updated line item with recalculated totals

**Effects:**
- Recalculates line item totals
- Recalculates purchase order totals
- Updates purchase order updated_at timestamp

**Error Responses:**
- 409: Cannot edit items in cancelled purchase order

---

### 2.3 Remove Line Item
**Endpoint:** `DELETE /tenant/purchase-orders/:po-id/line-items/:item-id`

**Permission:** `purchase_orders:Update`

**Path Parameters:**
- `po-id`: Purchase Order UUID
- `item-id`: Line Item UUID

**Response (200 OK):**
```json
{
  "message": "Line item removed successfully"
}
```

**Effects:**
- Deletes line item
- Recalculates purchase order totals
- Updates purchase order updated_at timestamp

**Error Responses:**
- 409: Cannot remove items from cancelled purchase order

---

## 3. Payments Management

### 3.1 Record Payment
**Endpoint:** `POST /tenant/purchase-orders/:id/payments`

**Permission:** `purchase_orders:Update`

**Path Parameters:**
- `id`: Purchase Order UUID

**Request Body:**
```json
{
  "payment_date": "YYYY-MM-DD",
  "payment_amount": 500.00,
  "payment_method": "Transferencia | Cheque | Efectivo | Tarjeta",
  "reference_number": "string (optional)"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "purchase_order_id": "uuid",
  "payment_date": "2024-01-10",
  "payment_amount": 500.00,
  "payment_method": "Transferencia",
  "reference_number": "REF-123",
  "created_at": "2024-01-10T10:00:00Z"
}
```

**Automatic Updates to Purchase Order:**
- `payment_status` is calculated:
  - "Pagada" if payment_amount = grand_total
  - "Parcial" if payment_amount < grand_total
  - "No pagado" if payment_amount = 0
- `remaining_amount` = grand_total - payment_amount
- `payment_date` and `payment_method` are stored

**Error Responses:**
- 400: Invalid payment amount or date
- 404: Purchase order not found
- 409: Cannot record payment on cancelled purchase order

---

### 3.2 Get Payment Information
**Endpoint:** `GET /tenant/purchase-orders/:id/payments`

**Permission:** `purchase_orders:Read`

**Path Parameters:**
- `id`: Purchase Order UUID

**Response (200 OK):**
```json
{
  "payment_status": "Parcial",
  "payment_date": "2024-01-10",
  "payment_amount": 500.00,
  "payment_method": "Transferencia",
  "remaining_amount": 740.00,
  "payments": [
    {
      "id": "uuid",
      "payment_date": "2024-01-10",
      "payment_amount": 500.00,
      "payment_method": "Transferencia",
      "reference_number": "REF-123"
    }
  ]
}
```

---

## 4. Documents Management

### 4.1 Upload Document
**Endpoint:** `POST /tenant/purchase-orders/:id/documents`

**Permission:** `purchase_orders:Update`

**Path Parameters:**
- `id`: Purchase Order UUID

**Request Body:** Form-data (multipart/form-data)
- `file`: Binary file (PDF, Excel, Image, etc.)

**Response (201 Created):**
```json
{
  "id": "uuid",
  "purchase_order_id": "uuid",
  "filename": "invoice.pdf",
  "file_type": "application/pdf",
  "s3_key": "purchase-orders/po-uuid/invoice.pdf",
  "s3_url": "https://s3.amazonaws.com/bucket/purchase-orders/po-uuid/invoice.pdf",
  "uploader_id": "uuid",
  "file_size": 102400,
  "upload_date": "2024-01-10T10:00:00Z"
}
```

**Features:**
- Automatically uploads to AWS S3
- Generates secure S3 URL
- Stores file metadata
- Supports any file type

**Error Responses:**
- 400: No file provided or file too large
- 404: Purchase order not found

---

### 4.2 Get All Documents
**Endpoint:** `GET /tenant/purchase-orders/:id/documents`

**Permission:** `purchase_orders:Read`

**Path Parameters:**
- `id`: Purchase Order UUID

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "filename": "invoice.pdf",
    "file_type": "application/pdf",
    "s3_url": "https://s3.amazonaws.com/bucket/purchase-orders/po-uuid/invoice.pdf",
    "uploader_id": "uuid",
    "file_size": 102400,
    "upload_date": "2024-01-10T10:00:00Z"
  }
]
```

---

### 4.3 Delete Document
**Endpoint:** `DELETE /tenant/purchase-orders/:po-id/documents/:doc-id`

**Permission:** `purchase_orders:Update`

**Path Parameters:**
- `po-id`: Purchase Order UUID
- `doc-id`: Document UUID

**Response (200 OK):**
```json
{
  "message": "Document deleted successfully"
}
```

**Effects:**
- Deletes document from database
- Deletes file from AWS S3
- Removes document metadata

---

## 5. Data Models & Field Descriptions

### Purchase Order Object
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| vendor_id | UUID | Reference to vendor |
| creator_id | UUID | User who created the PO |
| purpose | String | Description/purpose of order |
| warehouse_id | UUID | Destination warehouse |
| tentative_receipt_date | Date | Expected delivery date |
| status | Enum | En Proceso, Recibida, Cancelada |
| payment_status | Enum | Pagada, Parcial, No pagado |
| total_subtotal | Decimal | Sum of all line item subtotals |
| total_iva | Decimal | Sum of all IVA amounts |
| total_ieps | Decimal | Sum of all IEPS amounts |
| grand_total | Decimal | total_subtotal + total_iva + total_ieps |
| remaining_amount | Decimal | grand_total - payment_amount |
| cancellation_date | Date | When PO was cancelled |
| cancellation_reason | String | Why PO was cancelled |
| created_at | Timestamp | Creation timestamp |
| updated_at | Timestamp | Last update timestamp |

### Line Item Object
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| product_id | UUID | Reference to product |
| quantity | Decimal | Quantity ordered |
| unit_price | Decimal | Price per unit |
| subtotal | Decimal | quantity × unit_price |
| iva_percentage | Decimal | IVA tax percentage (0-100) |
| iva_amount | Decimal | subtotal × (iva_percentage/100) |
| ieps_percentage | Decimal | IEPS tax percentage (0-100) |
| ieps_amount | Decimal | subtotal × (ieps_percentage/100) |
| line_total | Decimal | subtotal + iva_amount + ieps_amount |

### Payment Object
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| payment_date | Date | When payment was made |
| payment_amount | Decimal | Amount paid |
| payment_method | String | Transferencia, Cheque, Efectivo, Tarjeta |
| reference_number | String | Payment reference/transaction ID |

### Document Object
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| filename | String | Original filename |
| file_type | String | MIME type |
| s3_url | String | Secure URL to download from S3 |
| uploader_id | UUID | User who uploaded |
| file_size | Number | File size in bytes |
| upload_date | Timestamp | Upload timestamp |

---

## 6. Common Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized - Invalid or missing token",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Purchase order not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Cannot modify cancelled purchase order",
  "error": "Conflict"
}
```

---

## 7. Angular Service Example Structure

Your Angular service should have methods like:

```typescript
// Purchase Orders
createPurchaseOrder(dto: CreatePurchaseOrderDto)
getPurchaseOrders(query: QueryPurchaseOrderDto)
getPurchaseOrderById(id: string)
updatePurchaseOrder(id: string, dto: UpdatePurchaseOrderDto)
updatePurchaseOrderStatus(id: string, status: string)
cancelPurchaseOrder(id: string, reason: string)
deletePurchaseOrder(id: string)

// Line Items
addLineItem(poId: string, dto: CreateLineItemDto)
editLineItem(poId: string, itemId: string, dto: UpdateLineItemDto)
removeLineItem(poId: string, itemId: string)

// Payments
recordPayment(poId: string, dto: RecordPaymentDto)
getPaymentInfo(poId: string)

// Documents
uploadDocument(poId: string, file: File)
getDocuments(poId: string)
deleteDocument(poId: string, docId: string)
```

---

## 8. Key Features & Behaviors

### Automatic Calculations
- Line item totals are calculated automatically when added/edited
- Purchase order totals are recalculated whenever line items change
- Payment status is calculated based on payment amount vs grand total
- Remaining amount is calculated automatically

### Immutability Rules
- Cancelled purchase orders cannot be modified
- Cannot add/edit/remove line items from cancelled POs
- Cannot record payments on cancelled POs
- Cannot change status of cancelled POs

### Tenant Isolation
- All operations are automatically filtered by tenant
- Users can only see/modify their own tenant's purchase orders
- Cross-tenant access is denied with 403 Forbidden

### Cascade Deletes
- Deleting a PO deletes all line items, payments, and documents
- Documents are deleted from both database and AWS S3
- Historical data is preserved for cancelled POs

---

## 9. Tax Calculation Examples

### Example 1: Single Line Item
```
Quantity: 10
Unit Price: 100.00
IVA %: 16
IEPS %: 8

Subtotal = 10 × 100.00 = 1,000.00
IVA Amount = 1,000.00 × 0.16 = 160.00
IEPS Amount = 1,000.00 × 0.08 = 80.00
Line Total = 1,000.00 + 160.00 + 80.00 = 1,240.00
```

### Example 2: Multiple Line Items
```
Line Item 1: 1,240.00
Line Item 2: 500.00
Line Item 3: 300.00

Total Subtotal = 1,000.00 + 500.00 + 300.00 = 1,800.00
Total IVA = 160.00 + 80.00 + 48.00 = 288.00
Total IEPS = 80.00 + 40.00 + 24.00 = 144.00
Grand Total = 1,800.00 + 288.00 + 144.00 = 2,232.00
```

---

## 10. Status Flow Diagram

```
┌─────────────┐
│ En Proceso  │ ← Initial status when PO is created
└──────┬──────┘
       │
       ├─→ Recibida (goods received)
       │
       └─→ Cancelada (order cancelled)
           ↓
       (No further changes allowed)
```

---

## Notes for Angular UI Development

1. **Always include Authorization header** with Bearer token
2. **Handle pagination** - implement page/limit controls
3. **Show status badges** - En Proceso (yellow), Recibida (green), Cancelada (red)
4. **Show payment status** - Pagada (green), Parcial (orange), No pagado (red)
5. **Disable actions on cancelled POs** - hide edit/delete buttons
6. **Validate before submit** - check required fields and formats
7. **Show loading states** - especially for file uploads
8. **Handle errors gracefully** - show user-friendly error messages
9. **Implement search/filter** - use query parameters for filtering
10. **Show calculated totals** - display grand_total, remaining_amount prominently
