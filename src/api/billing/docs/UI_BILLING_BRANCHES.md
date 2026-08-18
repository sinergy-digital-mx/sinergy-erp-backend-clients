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
    "name": "Zona Norte Tijuana",
    "code": "Zona Norte Tijuana",
    "prefix": "SBA",
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

> En GET, pintar `name`. `code` llega igual (legado); no mostrarlo como “Código”. En `warehouses[]`, `code` también es legado: no precargarlo ni enviarlo.

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
  "name": "Zona Norte Tijuana",
  "code": "Zona Norte Tijuana",
  "prefix": "SBA",
  "address": "Test 123",
  "city": "Tijuana",
  "state": "Baja California",
  "country": "México",
  "postal_code": "22000",
  "phone": null,
  "latitude": 32.5149,
  "longitude": -117.0382,
  "status": 1,
  "warehouses_count": 2,
  "warehouses": [
    {
      "id": "warehouse-uuid-1",
      "name": "Almacén Principal",
      "code": "ALM-001",
      "prefix": "BDGA",
      "description": null,
      "street": "Av. Industrial 100",
      "city": "Tijuana",
      "state": "Baja California",
      "zip_code": "22000",
      "country": "México",
      "latitude": 32.5201,
      "longitude": -117.041,
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
  "name": "Zona Norte Tijuana",
  "prefix": "SBA",
  "address": "Test 123",
  "city": "Tijuana",
  "state": "Baja California",
  "country": "México",
  "postal_code": "22000",
  "phone": "6641234567",
  "latitude": 32.5149,
  "longitude": -117.0382,
  "status": 1,
  "warehouses": [
    {
      "name": "Almacén Principal",
      "prefix": "BDGA",
      "street": "Av. Industrial 100",
      "city": "Tijuana",
      "state": "Baja California",
      "zip_code": "22000",
      "country": "México",
      "latitude": 32.5201,
      "longitude": -117.041,
      "status": "active"
    }
  ]
}
```

Ver tablas de campos en la sección **Modal — Agregar / Editar sucursal** más abajo.

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
      "prefix": "BDGA",
      "status": "active"
    },
    {
      "name": "Almacén Secundario",
      "prefix": "SEC",
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
| Nombre | `name` | Texto (fallback `code` si no viene `name`) |
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

Reutilizar el **mismo componente de dirección + Google Maps** que direcciones de cliente.

**Diferencias vs cliente:**
- **No hay campo `type`** (billing / shipping). La dirección es de la sucursal misma.
- Campos de dirección de sucursal: `address`, `city`, `state`, `country`, `postal_code`, `latitude`, `longitude`.

```
┌──────────────────────────────────────────────────────┐
│  Editar sucursal                               [ X ] │
├──────────────────────────────────────────────────────┤
│  Nombre *                                            │
│  [ Zona Norte Tijuana___________________________ ]   │
│  Prefijo                                             │
│  [ SBA__________________________________________ ]   │
│                                                      │
│  ── Ubicación (Google Maps) ─────────────────────── │
│  [ buscador Places / pin en mapa ]                   │
│  Dirección *  Ciudad *  Estado *  País *  C.P. *    │
│  Lat / Lng (llenados por el mapa)                    │
│                                                      │
│  Teléfono                                            │
│  Status                                              │
│                                                      │
│  ── Almacenes ───────────────────── [ + Agregar ]   │
│  (sub-modal almacén: misma UX de mapa, sin type)    │
│                                                      │
│                    [ Cancelar ]  [ Guardar ]         │
└──────────────────────────────────────────────────────┘
```

### Body sucursal (POST/PUT) — GPS

```json
{
  "name": "Zona Norte Tijuana",
  "prefix": "SBA",
  "address": "Test 123",
  "city": "Tijuana",
  "state": "Baja California",
  "country": "México",
  "postal_code": "22000",
  "phone": "6641234567",
  "latitude": 32.5149,
  "longitude": -117.0382,
  "status": 1,
  "warehouses": [
    {
      "id": "warehouse-uuid",
      "name": "Almacén Principal",
      "prefix": "BDGA",
      "street": "Av. Industrial 100",
      "city": "Tijuana",
      "state": "Baja California",
      "zip_code": "22000",
      "country": "México",
      "latitude": 32.5201,
      "longitude": -117.0410,
      "status": "active"
    }
  ]
}
```

| Campo GPS | Sucursal | Almacén (`warehouses[]`) |
|-----------|----------|--------------------------|
| Latitud | `latitude` | `latitude` |
| Longitud | `longitude` | `longitude` |
| Calle | `address` | `street` |

> **Logística:** el origen de ruta del wizard de envío es la **sucursal** (`billing_branches.latitude/longitude`), no el almacén. Ver `src/api/shippings/docs/UI_LOGISTICS.md`.

### Campos de cada almacén (`warehouses[]`)

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `name` | string | Sí (al crear) | Nombre del almacén |
| `prefix` | string | No | Prefijo de lote (máx. 10, sin guiones). Ej. `BDGA`. Obligatorio antes de recibir OC. **No enviar `code`.** Ver `UI_DOCUMENT_PREFIXES.md` |
| `description` | string | No | |
| `street` | string | No | Calle |
| `city` | string | No | Ciudad |
| `state` | string | No | Estado |
| `zip_code` | string | No | C.P. |
| `country` | string | No | País |
| `latitude` | number \| null | No | GPS (Google Maps) |
| `longitude` | number \| null | No | GPS (Google Maps) |
| `status` | `active` \| `inactive` | No | Default `active` |
| `metadata` | object | No | Extensible |

### Campos sucursal

| Campo sucursal | Tipo | Obligatorio | Validación UI |
|----------------|------|-------------|---------------|
| `name` | string | Sí | Nombre de sucursal. **No usar label “Código”.** |
| `prefix` | string \| null | No | Prefijo corto (ej. `SBA`). Distinto del nombre. Obligatorio antes de recibir OC |
| `address` | string | Sí | Calle y número |
| `city` | string | Sí | Ciudad |
| `state` | string | Sí | Estado |
| `country` | string | Sí | País |
| `postal_code` | string | Sí | C.P. |
| `phone` | string \| null | No | Teléfono de contacto (hasta 50 caracteres) |
| `latitude` | number \| null | No | GPS desde Google Maps |
| `longitude` | number \| null | No | GPS desde Google Maps |
| `status` | 0 \| 1 | No | Default `1` (Activo) |
| `warehouses` | array | No | Almacenes iniciales (puede ir vacío `[]`) |
---

## Flujo en componente

```typescript
async saveBranch(fiscalConfigId: string, form: BranchForm, editingId?: string) {
  const body = {
    name: form.name.trim(),
    prefix: form.prefix?.trim().toUpperCase() || null,
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    postal_code: form.postalCode.trim(),
    phone: form.phone?.trim() || null,
    latitude: form.latitude ?? null,
    longitude: form.longitude ?? null,
    status: form.isActive ? 1 : 0,
    warehouses: this.warehouses.map((warehouse) => ({
      ...(warehouse.id ? { id: warehouse.id } : {}),
      name: warehouse.name.trim(),
      prefix: warehouse.prefix?.trim().toUpperCase() || undefined,
      street: warehouse.street?.trim() || undefined,
      city: warehouse.city?.trim() || undefined,
      state: warehouse.state?.trim() || undefined,
      zip_code: warehouse.zipCode?.trim() || undefined,
      country: warehouse.country?.trim() || undefined,
      latitude: warehouse.latitude ?? null,
      longitude: warehouse.longitude ?? null,
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
}
```

---

## Checklist Pollux

- [ ] Modal sucursal: **Nombre** + **Prefijo** (no campo Código)
- [ ] Sub-modal almacén: **Nombre** + **Prefijo** (quitar Código)
- [ ] Reusar componente Google Maps de direcciones de cliente (**sin campo `type`**)
- [ ] Modal sucursal: dirección + lat/lng desde mapa
- [ ] Sub-modal almacén: misma UX de mapa (`street` + lat/lng)
- [ ] Enviar `latitude` / `longitude` en POST/PUT de sucursal y de `warehouses[]`
- [ ] Al editar: `GET .../branches/:id` y precargar coords
- [ ] Modal CEDIS en preview de ruta: mismo componente → `PUT /tenant/warehouses/:id`
