# UI — Sucursales de configuración fiscal

Guía para Pollux: pestaña **Sucursales** en el modal **Editar Configuración Fiscal**.

Los **almacenes** ya no se gestionan en un módulo aparte dentro de esta pantalla: viven anidados en la sucursal (igual que las sucursales viven en la config fiscal).

Base API: `/api/tenant/fiscal-configurations/:fiscalConfigId/branches`

| Método | Ruta | Permiso | Uso |
|--------|------|---------|-----|
| GET | `.../branches` | `FiscalConfiguration:Read` | Cargar tabla al abrir pestaña |
| GET | `.../branches/:id` | `FiscalConfiguration:Read` | Abrir modal editar (trae `warehouses`) |
| POST | `.../branches` | `FiscalConfiguration:Create` | Crear sucursal (+ almacenes opcionales) |
| PUT | `.../branches/:id` | `FiscalConfiguration:Update` | Actualizar sucursal y sincronizar almacenes |
| DELETE | `.../branches/:id` | `FiscalConfiguration:Delete` | Eliminar sucursal y sus almacenes |

Listado global (otros módulos): `GET /api/tenant/billing/branches`

> `GET/POST/PUT /api/tenant/warehouses` siguen existiendo para otros flujos del ERP, pero **esta pantalla no debe usarlos**.

---

## GET lista — respuesta esperada

```json
[
  {
    "id": "uuid",
    "fiscal_configuration_id": "uuid",
    "code": "Zona Norte Tijuana",
    "address": "Test 123",
    "city": "Tijuana",
    "state": "Baja California",
    "country": "México",
    "postal_code": "22000",
    "phone": "6641234567",
    "status": 1,
    "warehouses_count": 3,
    "created_at": "2026-06-01T12:00:00.000Z",
    "updated_at": "2026-06-01T12:00:00.000Z"
  }
]
```

---

## GET detalle — editar sucursal

Al abrir el modal de edición, cargar el detalle para obtener el array de almacenes:

```
GET /api/tenant/fiscal-configurations/:fiscalConfigId/branches/:branchId
```

```json
{
  "id": "uuid",
  "fiscal_configuration_id": "uuid",
  "code": "Zona Norte Tijuana",
  "address": "Test 123",
  "city": "Tijuana",
  "state": "Baja California",
  "country": "México",
  "postal_code": "22000",
  "phone": null,
  "status": 1,
  "warehouses_count": 2,
  "warehouses": [
    {
      "id": "warehouse-uuid-1",
      "name": "Almacén Principal",
      "code": "ALM-001",
      "prefix": null,
      "description": null,
      "street": "Av. Industrial 100",
      "city": "Tijuana",
      "state": "Baja California",
      "zip_code": "22000",
      "country": "México",
      "status": "active",
      "metadata": null,
      "created_at": "2026-06-01T12:00:00.000Z",
      "updated_at": "2026-06-01T12:00:00.000Z"
    }
  ],
  "created_at": "2026-06-01T12:00:00.000Z",
  "updated_at": "2026-06-01T12:00:00.000Z"
}
```

---

## POST crear sucursal

```json
{
  "code": "Zona Norte Tijuana",
  "address": "Test 123",
  "city": "Tijuana",
  "state": "Baja California",
  "country": "México",
  "postal_code": "22000",
  "phone": "6641234567",
  "status": 1,
  "warehouses": [
    {
      "name": "Almacén Principal",
      "code": "ALM-001",
      "street": "Av. Industrial 100",
      "city": "Tijuana",
      "state": "Baja California",
      "zip_code": "22000",
      "country": "México",
      "status": "active"
    }
  ]
}
```

| Campo sucursal | Tipo | Obligatorio | Validación UI |
|----------------|------|-------------|---------------|
| `code` | string | Sí | Nombre/código de sucursal |
| `address` | string | Sí | Calle y número |
| `city` | string | Sí | Ciudad |
| `state` | string | Sí | Estado |
| `country` | string | Sí | País |
| `postal_code` | string | Sí | C.P. |
| `phone` | string \| null | No | Teléfono de contacto (hasta 50 caracteres) |
| `status` | 0 \| 1 | No | Default `1` (Activo) |
| `warehouses` | array | No | Almacenes iniciales (puede ir vacío `[]`) |

### Campos de cada almacén (`warehouses[]`)

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `name` | string | Sí (al crear) | Nombre del almacén |
| `code` | string | No | Código interno |
| `prefix` | string | No | Prefijo (máx. 10) |
| `description` | string | No | |
| `street` | string | No | Calle |
| `city` | string | No | Ciudad |
| `state` | string | No | Estado |
| `zip_code` | string | No | C.P. |
| `country` | string | No | País |
| `status` | `active` \| `inactive` | No | Default `active` |
| `metadata` | object | No | Extensible |

---

## PUT actualizar sucursal + almacenes

Campos de sucursal: todos opcionales.

`warehouses` es **sincronización completa** del array:
- Con `id` → actualiza ese almacén de la sucursal.
- Sin `id` → crea almacén nuevo en la sucursal.
- Almacenes existentes que **no** vengan en el array → se eliminan.

```json
{
  "phone": "6649876543",
  "warehouses": [
    {
      "id": "warehouse-uuid-1",
      "name": "Almacén Principal",
      "code": "ALM-001",
      "status": "active"
    },
    {
      "name": "Almacén Secundario",
      "code": "ALM-002",
      "status": "active"
    }
  ]
}
```

Para quitar teléfono enviar `"phone": null`.

Para dejar los almacenes sin cambios, **omitir** `warehouses` en el body.
Para vaciar todos los almacenes, enviar `"warehouses": []`.

---

## Tabla principal (pestaña Sucursales)

| Columna | Origen | Formato |
|---------|--------|---------|
| Código | `code` | Texto |
| Dirección | `address` | Texto |
| Ciudad | `city` | Texto |
| Estado | `state` | Texto |
| C.P. | `postal_code` | Texto |
| Teléfono | `phone` | Texto o "—" si es null |
| Almacenes | `warehouses_count` | Número entero |
| Status | `status` | `1` → badge verde "Activo", `0` → gris "Inactivo" |
| Acciones | — | ✏️ Editar, 🗑 Eliminar |

---

## Modal — Agregar / Editar sucursal

```
┌──────────────────────────────────────────────────────┐
│  Editar sucursal                               [ X ] │
├──────────────────────────────────────────────────────┤
│  Código *                                            │
│  [ Zona Norte Tijuana___________________________ ]   │
│                                                      │
│  Dirección *                                         │
│  [ Test 123____________________________________ ]   │
│                                                      │
│  Ciudad *          Estado *                          │
│  [ Tijuana____ ]   [ Baja California_________ ]    │
│                                                      │
│  País *            C.P. *                            │
│  [ México____ ]    [ 22000____________________ ]    │
│                                                      │
│  Teléfono                                            │
│  [ 6641234567_________________________________ ]    │
│                                                      │
│  [x] Activo                                          │
│                                                      │
│  ── Almacenes ───────────────────── [ + Agregar ]   │
│  ┌──────────┬────────┬────────┬────────┬──────────┐   │
│  │ Nombre   │ Código │ Ciudad │ Status │ Acciones │   │
│  ├──────────┼────────┼────────┼────────┼──────────┤   │
│  │ Alm Ppal │ ALM-01 │ Tijuana│ Activo │ ✏️ 🗑    │   │
│  └──────────┴────────┴────────┴────────┴──────────┘   │
│                                                      │
│                    [ Cancelar ]  [ Guardar ]         │
└──────────────────────────────────────────────────────┘
```

Al editar un almacén en sub-modal, los campos son los de la tabla **Campos de cada almacén**.

---

## Flujo en componente

```typescript
async loadBranches(fiscalConfigId: string) {
  this.branches = await api.get(
    `/tenant/fiscal-configurations/${fiscalConfigId}/branches`,
  );
}

async openEditBranch(fiscalConfigId: string, branchId: string) {
  const branch = await api.get(
    `/tenant/fiscal-configurations/${fiscalConfigId}/branches/${branchId}`,
  );
  this.form = { ...branch };
  this.warehouses = branch.warehouses ?? [];
}

async saveBranch(fiscalConfigId: string, form: BranchForm, editingId?: string) {
  const body = {
    code: form.code.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    postal_code: form.postalCode.trim(),
    phone: form.phone?.trim() || null,
    status: form.isActive ? 1 : 0,
    warehouses: this.warehouses.map((warehouse) => ({
      ...(warehouse.id ? { id: warehouse.id } : {}),
      name: warehouse.name.trim(),
      code: warehouse.code?.trim() || undefined,
      prefix: warehouse.prefix?.trim() || undefined,
      description: warehouse.description?.trim() || undefined,
      street: warehouse.street?.trim() || undefined,
      city: warehouse.city?.trim() || undefined,
      state: warehouse.state?.trim() || undefined,
      zip_code: warehouse.zipCode?.trim() || undefined,
      country: warehouse.country?.trim() || undefined,
      status: warehouse.isActive ? 'active' : 'inactive',
    })),
  };

  if (editingId) {
    await api.put(
      `/tenant/fiscal-configurations/${fiscalConfigId}/branches/${editingId}`,
      body,
    );
  } else {
    await api.post(
      `/tenant/fiscal-configurations/${fiscalConfigId}/branches`,
      body,
    );
  }

  await this.loadBranches(fiscalConfigId);
}
```

---

## Checklist Pollux

- [ ] Quitar pantalla/flujo separado de almacenes en config fiscal
- [ ] Al editar sucursal: `GET .../branches/:id` y precargar `warehouses`
- [ ] Sección **Almacenes** dentro del modal de sucursal (tabla + agregar/editar/eliminar local)
- [ ] En guardar: enviar `warehouses` en POST/PUT (sincronización completa)
- [ ] Columna **Almacenes** en tabla de sucursales (`warehouses_count`)
- [ ] Columna **Teléfono** en tabla de sucursales (`phone` o "—")
- [ ] Campo **Teléfono** en modal crear/editar sucursal
- [ ] Enviar `phone` en POST y PUT; permitir `null` al borrar teléfono
