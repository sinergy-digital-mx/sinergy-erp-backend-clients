# UI — Sucursales de configuración fiscal

Guía para Pollux: pestaña **Sucursales** en el modal **Editar Configuración Fiscal**.

Base API: `/api/tenant/fiscal-configurations/:fiscalConfigId/branches`

| Método | Ruta | Permiso | Uso |
|--------|------|---------|-----|
| GET | `.../branches` | `FiscalConfiguration:Read` | Cargar tabla al abrir pestaña |
| GET | `.../branches/:id` | `FiscalConfiguration:Read` | Editar (opcional si GET lista trae todo) |
| POST | `.../branches` | `FiscalConfiguration:Create` | Crear sucursal |
| PUT | `.../branches/:id` | `FiscalConfiguration:Update` | Actualizar sucursal |
| DELETE | `.../branches/:id` | `FiscalConfiguration:Delete` | Eliminar |

Listado global (otros módulos): `GET /api/tenant/billing/branches`

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
    "created_at": "2026-06-01T12:00:00.000Z",
    "updated_at": "2026-06-01T12:00:00.000Z"
  }
]
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
  "status": 1
}
```

| Campo | Tipo | Obligatorio | Validación UI |
|-------|------|-------------|---------------|
| `code` | string | Sí | Nombre/código de sucursal |
| `address` | string | Sí | Calle y número |
| `city` | string | Sí | Ciudad |
| `state` | string | Sí | Estado |
| `country` | string | Sí | País |
| `postal_code` | string | Sí | C.P. |
| `phone` | string \| null | No | Teléfono de contacto (hasta 50 caracteres) |
| `status` | 0 \| 1 | No | Default `1` (Activo) |

---

## PUT actualizar

Mismos campos, todos opcionales. Para quitar teléfono enviar `"phone": null`.

```json
{
  "phone": "6649876543"
}
```

---

## Tabla principal (pestaña Sucursales)

Columnas sugeridas:

| Columna | Origen | Formato |
|---------|--------|---------|
| Código | `code` | Texto |
| Dirección | `address` | Texto |
| Ciudad | `city` | Texto |
| Estado | `state` | Texto |
| C.P. | `postal_code` | Texto |
| Teléfono | `phone` | Texto o "—" si es null |
| Status | `status` | `1` → badge verde "Activo", `0` → gris "Inactivo" |
| Acciones | — | ✏️ Editar, 🗑 Eliminar |

---

## Modal — Agregar / Editar sucursal

```
┌─────────────────────────────────────────────┐
│  Agregar sucursal                     [ X ] │
├─────────────────────────────────────────────┤
│  Código *                                   │
│  [ Zona Norte Tijuana________________ ]     │
│                                             │
│  Dirección *                                │
│  [ Test 123__________________________ ]     │
│                                             │
│  Ciudad *          Estado *                 │
│  [ Tijuana____ ]   [ Baja California ]      │
│                                             │
│  País *            C.P. *                   │
│  [ México____ ]    [ 22000___________ ]     │
│                                             │
│  Teléfono                                   │
│  [ 6641234567________________________ ]     │
│  (opcional — contacto de la sucursal)       │
│                                             │
│  [x] Activo                                 │
│                                             │
│              [ Cancelar ]  [ Guardar ]      │
└─────────────────────────────────────────────┘
```

Validaciones cliente:
- Campos obligatorios excepto `phone`.
- `phone`: opcional; si se captura, solo dígitos o formato libre (máx. 50 caracteres).

---

## Flujo en componente

```typescript
async loadBranches(fiscalConfigId: string) {
  const branches = await api.get(
    `/tenant/fiscal-configurations/${fiscalConfigId}/branches`,
  );
  this.branches = branches;
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

- [ ] Columna **Teléfono** en tabla de sucursales (`phone` o "—")
- [ ] Campo **Teléfono** en modal crear sucursal
- [ ] Campo **Teléfono** en modal editar sucursal (precargar `phone`)
- [ ] Enviar `phone` en POST y PUT
- [ ] Permitir dejar vacío o enviar `null` al borrar teléfono en edición
