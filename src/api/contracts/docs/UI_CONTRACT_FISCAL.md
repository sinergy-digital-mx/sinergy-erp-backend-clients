# UI — Razón social del contrato

## Historial

- 2026-10-23: El contrato guarda la razón social emisora. El PDF y el correo del recibo toman de ahí el nombre, el RFC y el logo.

Cada contrato pertenece a **una** razón social de la organización. Eso decide qué logo y qué nombre salen en el recibo (enganche y mensualidad).

No usar la razón social de la plantilla del recibo para un contrato que ya tiene la suya. La plantilla solo es respaldo de contratos viejos sin `fiscal_configuration_id`.

## Alta y edición

En **Crear contrato** y en **Editar contrato**, selector **Razón social ***. Catálogo:

```
GET /api/tenant/fiscal-configurations?status=active&limit=100
```

Opciones: `id` + `razon_social` (y RFC si hace falta distinguir). No hardcodear nombres ni UUIDs.

Al crear es obligatorio. Al editar, si el contrato ya tiene una, prefill. Si esa razón quedó inactiva, igual debe verse y poder guardarse.

## Payload

`POST /api/tenant/contracts`

```json
{ "fiscal_configuration_id": "uuid" }
```

`PUT /api/tenant/contracts/:id` acepta el mismo campo. `GET /api/tenant/contracts/:id` responde:

```json
{
  "fiscal_configuration_id": "uuid",
  "fiscal_configuration": {
    "id": "uuid",
    "razon_social": "VAL DE TIERRA SA DE CV",
    "rfc": "VTI123456789"
  }
}
```

## Recibo

PDF y correo: `contract.fiscal_configuration_id` → logo, `razon_social` y RFC de esa configuración.

Si el contrato no tiene razón social (legado): plantilla del recibo → logo del sistema → primera razón social.

Subir logo sigue siendo por razón social, no por contrato.

## Checklist

- [ ] Crear: no deja guardar sin razón social
- [ ] Editar: prefill y se puede cambiar
- [ ] Recibo de un contrato de Val de Tierra usa ese logo, no el de Val de la NSA
- [ ] Recibo de enganche y de mensualidad usan la misma del contrato
