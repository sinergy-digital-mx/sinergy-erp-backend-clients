# Warehouse & Fiscal Configuration - UI Update Guide

## 🔄 Changes Summary

El formulario de Warehouse ha sido simplificado. Ahora la información fiscal se maneja en un módulo separado llamado **Fiscal Configuration**.

---

## 📋 Warehouse Form - UPDATED

### Fields to REMOVE from Warehouse form:
- ❌ RFC
- ❌ Razón Social
- ❌ Tipo de Persona
- ❌ Sello Digital
- ❌ Contraseña del Sello Digital
- ❌ Llave Privada

### Fields to KEEP in Warehouse form:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| **Nombre** | Text | ✅ YES | Warehouse name |
| **Código** | Text | ❌ NO | Optional warehouse code |
| **Descripción** | Text | ❌ NO | Optional description |
| **Calle** | Text | ❌ NO | Street address |
| **Ciudad** | Text | ❌ NO | City |
| **Estado** | Text | ❌ NO | State/Province |
| **CP** | Text | ❌ NO | Postal code |
| **País** | Select | ❌ NO | Country dropdown |
| **Status** | Select | ❌ NO | active/inactive |

### Warehouse Create Endpoint:
```
POST /api/tenant/warehouses
Content-Type: application/json

{
  "name": "Almacén Central",
  "code": "ALM-001",
  "description": "Almacén principal",
  "street": "Calle Principal 123",
  "city": "México",
  "state": "CDMX",
  "zip_code": "06500",
  "country": "México",
  "status": "active"
}
```

### Warehouse Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-uuid",
  "name": "Almacén Central",
  "code": "ALM-001",
  "description": "Almacén principal",
  "street": "Calle Principal 123",
  "city": "México",
  "state": "CDMX",
  "zip_code": "06500",
  "country": "México",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## 🏛️ Fiscal Configuration - NEW MODULE

### Purpose:
Manage fiscal/billing information for each warehouse independently.

### Fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| **Warehouse ID** | UUID | ✅ YES | Link to warehouse |
| **Razón Social** | Text | ✅ YES | Legal business name |
| **RFC** | Text | ✅ YES | Format: 3-4 letters + 6 digits + 3 alphanumeric |
| **Tipo de Persona** | Select | ✅ YES | "Persona Física" or "Persona Moral" |
| **Régimen Fiscal** | Select | ❌ NO | 601, 603, 605, 606, 607, 608, 609, 610, 611, 614, 616, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630 |
| **Sello Digital** | Text | ❌ NO | Digital certificate |
| **Contraseña Sello** | Password | ❌ NO | Digital seal password |
| **Llave Privada** | Text | ❌ NO | Private key |
| **Status** | Select | ❌ NO | active/inactive |

### Fiscal Configuration Create Endpoint:
```
POST /api/tenant/fiscal-configurations
Content-Type: application/json

{
  "warehouse_id": "550e8400-e29b-41d4-a716-446655440000",
  "razon_social": "GRUPO MINISTOP DE MEXICO",
  "rfc": "GMM140115PIA",
  "persona_type": "Persona Moral",
  "fiscal_regime": "601",
  "digital_seal": "-----BEGIN CERTIFICATE-----...",
  "digital_seal_password": "password123",
  "private_key": "-----BEGIN PRIVATE KEY-----...",
  "status": "active"
}
```

### Fiscal Configuration Response:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "tenant_id": "tenant-uuid",
  "warehouse_id": "550e8400-e29b-41d4-a716-446655440000",
  "razon_social": "GRUPO MINISTOP DE MEXICO",
  "rfc": "GMM140115PIA",
  "persona_type": "Persona Moral",
  "fiscal_regime": "601",
  "digital_seal": "-----BEGIN CERTIFICATE-----...",
  "digital_seal_password": "password123",
  "private_key": "-----BEGIN PRIVATE KEY-----...",
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Get Fiscal Configuration by Warehouse:
```
GET /api/tenant/fiscal-configurations/warehouse/{warehouseId}
```

### List All Fiscal Configurations:
```
GET /api/tenant/fiscal-configurations?page=1&limit=20&warehouse_id={warehouseId}&status=active
```

### Update Fiscal Configuration:
```
PUT /api/tenant/fiscal-configurations/{id}
Content-Type: application/json

{
  "razon_social": "GRUPO MINISTOP DE MEXICO S.A.",
  "rfc": "GMM140115PIA",
  "persona_type": "Persona Moral",
  "fiscal_regime": "601",
  "status": "active"
}
```

### Delete Fiscal Configuration:
```
DELETE /api/tenant/fiscal-configurations/{id}
```

---

## 🔗 Workflow Example

### 1. Create Warehouse:
```bash
POST /api/tenant/warehouses
{
  "name": "Almacén Centro",
  "code": "ALM-001"
}
```

### 2. Create Fiscal Configuration for that Warehouse:
```bash
POST /api/tenant/fiscal-configurations
{
  "warehouse_id": "550e8400-e29b-41d4-a716-446655440000",
  "razon_social": "GRUPO MINISTOP",
  "rfc": "GMM140115PIA",
  "persona_type": "Persona Moral"
}
```

### 3. Get Warehouse with its Fiscal Config:
```bash
GET /api/tenant/warehouses/550e8400-e29b-41d4-a716-446655440000
GET /api/tenant/fiscal-configurations/warehouse/550e8400-e29b-41d4-a716-446655440000
```

---

## 📱 UI Components to Update

### Warehouse Form:
- Remove all fiscal fields (RFC, Razón Social, etc.)
- Keep only: Nombre, Código, Descripción, Dirección, Status

### New Fiscal Configuration Form:
- Create new modal/page for fiscal configuration
- Link to warehouse via dropdown
- Show all fiscal fields
- Allow create/edit/delete operations

### Warehouse Detail View:
- Show warehouse info
- Add button: "Configurar Facturación" → Opens Fiscal Configuration form
- Show linked fiscal configuration if exists

---

## ✅ Permissions Required

Both modules require these permissions:
- `fiscal_configurations:Create`
- `fiscal_configurations:Read`
- `fiscal_configurations:Update`
- `fiscal_configurations:Delete`

These are automatically assigned to Admin role.
