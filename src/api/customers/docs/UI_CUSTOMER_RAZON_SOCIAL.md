# UI — Quitar almacén, poner razón social (Crear / Editar cliente)

Contrato para Pollux. El cliente **no se asocia a un almacén**. El dropdown de Bodega / Racks / Mostrador / UUIDs en **Crear Cliente** está mal: ese slot es **Razón social**.

`warehouse_id` no entra en este formulario. El almacén es de inventario, OC y POS; no del maestro de clientes.

---

## Qué cambiar (tab Información del Cliente)

Quitar el select de almacenes (label tipo “Almacén”, valor “Sin almacén”, lista con UUID entre paréntesis).

Poner un **input de texto** en el mismo lugar, encima de **Estatus**:

```
┌─────────────────────────────────────────────────────┐
│ Crear Cliente                                 [ X ] │
├─────────────────────────────────────────────────────┤
│ Razón social                                        │
│ [ SINERGY SW SOLUTIONS                    ]         │
│                                                     │
│ Estatus *                                           │
│ [ Activo                                  ▼ ]       │
│                                                     │
│ Persona adicional (opcional)              [Agregar] │
│                                                     │
│              [ Cancelar ]              [ Crear ]    │
└─────────────────────────────────────────────────────┘
```

| UI | Tipo | Body | Obligatorio |
|----|------|------|-------------|
| Razón social | Texto | `fiscal_razon_social` | No para guardar. Sí para timbrar |
| Estatus | Select | `status_id` | Sí (catálogo `GET /statuses`) |

Mismo campo que el tab **Información Fiscal**. Un solo estado de formulario: si el usuario lo llena aquí, el tab fiscal lo muestra; no dos inputs independientes.

No usar `company_name` para este label. `company_name` es **Empresa** (nombre comercial). Razón social SAT = `fiscal_razon_social`.

---

## Qué dejar de hacer

- No llamar catálogo de almacenes al abrir el modal.
- No enviar `warehouse_id` en `POST` / `PUT` de clientes (ni `null` “Sin almacén”).
- No pintar columna Almacén en listado de clientes.
- No usar UUIDs de Bodega/Racks/Mostrador como opciones de “razón social”. Las razones del tab Crédito salen de `credits[]` (`fiscal_configuration_id` + `razon_social`), no de almacenes.

---

## Guardar

```
POST /api/tenant/customers
PUT  /api/tenant/customers/:id
Permiso: customers:Create / customers:Update
```

```json
{
  "name": "María",
  "lastname": "López",
  "fiscal_razon_social": "SINERGY SW SOLUTIONS",
  "status_id": 1
}
```

Texto libre, opcional. Vacío o omitido = se guarda sin razón social.

Para borrar en edición: `"fiscal_razon_social": null` o `""`.

Copiar de la CSF, MAYÚSCULAS SAT. Es el `Receptor/@Nombre` del CFDI 4.0. Detalle de domicilio: `src/api/customers/docs/UI_CUSTOMER_FISCAL.md`.

---

## Lectura (editar)

`GET /api/tenant/customers/:id` trae `fiscal_razon_social`. Prefill el input.

Si viene `null`, dejar el campo vacío. No mapear `warehouse` ni `warehouse_id`.

---

## Listado (opcional)

Si hay columna de empresa/razón: `fiscal_razon_social` (fallback `company_name`). **No** `warehouse.name`.

---

## Checklist Pollux

- [ ] Quitar select de almacenes del modal Crear / Editar Cliente
- [ ] Input **Razón social** → `fiscal_razon_social` (mismo valor que tab fiscal)
- [ ] No fetch de almacenes; no enviar `warehouse_id`
- [ ] Prefill en editar desde `GET` → `fiscal_razon_social`
- [ ] Tab Crédito: opciones = `credits[].razon_social`, no almacenes
