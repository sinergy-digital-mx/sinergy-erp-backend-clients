# UI Changes - Warehouse & Fiscal Configuration

## 📋 Summary

Se ha implementado un sistema de configuración fiscal separado. Ahora:
- **Fiscal Configuration** es una entidad independiente que almacena datos fiscales
- **Warehouse** se relaciona con Fiscal Configuration mediante un selector

---

## 🏗️ Architecture

```
Fiscal Configuration (Entidad Independiente)
├── Razón Social
├── RFC
├── Tipo de Persona
├── Régimen Fiscal
├── Sello Digital
├── Contraseña Sello
└── Llave Privada

        ↓ (relación)

Warehouse
├── Nombre (obligatorio)
├── Código
├── Descripción
├── Dirección
├── Status
└── Fiscal Configuration ID ← Selector para elegir configuración
```

---

## 🔄 Warehouse Form Changes

### Fields to REMOVE:
- ❌ RFC
- ❌ Razón Social
- ❌ Tipo de Persona
- ❌ Régimen Fiscal
- ❌ Sello Digital
- ❌ Contraseña Sello
- ❌ Llave Privada

### Fields to ADD:
- ✅ **Configuración Fiscal** (Select/Dropdown)
  - Mostrar lista de Fiscal Configurations disponibles
  - Permitir seleccionar una o dejar vacío
  - Mostrar: "Razón Social - RFC" como label

### Final Warehouse Form Fields:
```
┌─────────────────────────────────────┐
│ Nombre *                            │
├─────────────────────────────────────┤
│ Código                              │
├─────────────────────────────────────┤
│ Descripción                         │
├─────────────────────────────────────┤
│ Calle                               │
├─────────────────────────────────────┤
│ Ciudad                              │
├─────────────────────────────────────┤
│ Estado                              │
├─────────────────────────────────────┤
│ CP                                  │
├─────────────────────────────────────┤
│ País                                │
├─────────────────────────────────────┤
│ Configuración Fiscal                │
│ [Selecciona una configuración...]   │
├─────────────────────────────────────┤
│ Status                              │
└─────────────────────────────────────┘
```

---

## 🏛️ Fiscal Configuration Module

### New Endpoints:

#### Create Fiscal Configuration
```
POST /api/tenant/fiscal-configurations
{
  "razon_social": "GRUPO MINISTOP DE MEXICO",
  "rfc": "GMM140115PIA",
  "persona_type": "Persona Moral",
  "fiscal_regime": "601",
  "digital_seal": "...",
  "digital_seal_password": "...",
  "private_key": "..."
}
```

#### List Fiscal Configurations
```
GET /api/tenant/fiscal-configurations?page=1&limit=20
```

#### Get Fiscal Configuration by Warehouse
```
GET /api/tenant/fiscal-configurations/warehouse/{warehouseId}
```

#### Update Fiscal Configuration
```
PUT /api/tenant/fiscal-configurations/{id}
```

#### Delete Fiscal Configuration
```
DELETE /api/tenant/fiscal-configurations/{id}
```

---

## 📱 UI Components to Update

### 1. Warehouse Form
- Remover todos los campos fiscales
- Agregar selector "Configuración Fiscal"
- El selector debe cargar dinámicamente las configuraciones disponibles

### 2. Fiscal Configuration Management
- Crear nueva sección/módulo para gestionar configuraciones fiscales
- Permitir CRUD completo (Create, Read, Update, Delete)
- Mostrar tabla con: Razón Social, RFC, Tipo de Persona, Status

### 3. Warehouse Detail View
- Mostrar la configuración fiscal asignada (si existe)
- Permitir cambiar la configuración fiscal
- Mostrar datos fiscales en read-only desde la configuración

### 4. Warehouse List
- Agregar columna "Configuración Fiscal" mostrando Razón Social
- Permitir filtrar por configuración fiscal

---

## 🔗 Data Flow Example

### Crear Almacén con Configuración Fiscal:

**Step 1: Crear Fiscal Configuration**
```bash
POST /api/tenant/fiscal-configurations
{
  "razon_social": "GRUPO MINISTOP DE MEXICO",
  "rfc": "GMM140115PIA",
  "persona_type": "Persona Moral",
  "fiscal_regime": "601"
}
Response: { id: "fiscal-config-uuid", ... }
```

**Step 2: Crear Warehouse con esa Configuración**
```bash
POST /api/tenant/warehouses
{
  "name": "Almacén Centro",
  "code": "ALM-001",
  "fiscal_configuration_id": "fiscal-config-uuid"
}
Response: { id: "warehouse-uuid", fiscal_configuration_id: "fiscal-config-uuid", ... }
```

**Step 3: Obtener Warehouse con su Configuración**
```bash
GET /api/tenant/warehouses/warehouse-uuid
Response: {
  id: "warehouse-uuid",
  name: "Almacén Centro",
  fiscal_configuration_id: "fiscal-config-uuid",
  fiscal_configuration: {
    id: "fiscal-config-uuid",
    razon_social: "GRUPO MINISTOP DE MEXICO",
    rfc: "GMM140115PIA",
    ...
  }
}
```

---

## 📊 Warehouse Response Example

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
  "fiscal_configuration_id": "fiscal-config-uuid",
  "fiscal_configuration": {
    "id": "fiscal-config-uuid",
    "razon_social": "GRUPO MINISTOP DE MEXICO",
    "rfc": "GMM140115PIA",
    "persona_type": "Persona Moral",
    "fiscal_regime": "601",
    "status": "active"
  },
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## ✅ Permissions

Ambos módulos requieren permisos:
- `warehouses:Create`, `warehouses:Read`, `warehouses:Update`, `warehouses:Delete`
- `fiscal_configurations:Create`, `fiscal_configurations:Read`, `fiscal_configurations:Update`, `fiscal_configurations:Delete`

Todos asignados automáticamente al rol Admin.

---

## 🎯 Key Points for UI Team

1. **Fiscal Configuration es independiente** - Se crea primero, luego se asigna a warehouses
2. **Warehouse solo referencia** - No almacena datos fiscales, solo el ID de la configuración
3. **Selector dinámico** - El dropdown de configuración fiscal debe cargar desde `/api/tenant/fiscal-configurations`
4. **Relación opcional** - Un warehouse puede no tener configuración fiscal asignada
5. **Reutilizable** - Una configuración fiscal puede ser usada por múltiples warehouses

---

## 🚀 Migration Steps

1. Ejecutar migraciones de base de datos
2. Actualizar formulario de Warehouse (remover campos fiscales, agregar selector)
3. Crear nuevo módulo/sección para Fiscal Configuration
4. Actualizar vista de detalle de Warehouse
5. Actualizar lista de Warehouses
6. Probar flujo completo: crear config fiscal → crear warehouse → asignar config
