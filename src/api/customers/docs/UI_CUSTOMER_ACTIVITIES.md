# UI — Registro de actividad del cliente

Modal de alta y edición en el detalle del cliente. El inbox CRM reusa el mismo modal.

## Cambios

- 2026-11-02: En el listado del cliente, cada actividad muestra **Vendedor**. Es el autor de la nota; si no tiene, el vendedor asignado al cliente o quien lo registró.
- 2026-10-15: El alta ya no ofrece el tipo **Tarea**. Si la actividad ya es `task`, el tipo sigue visible al editarla. Resultado nuevo: `unsatisfied` (**No satisfecho**).

## Resultado (`outcome`)

Campo texto, opcional. Vacío = sin resultado.

| Valor | Etiqueta |
|-------|----------|
| `satisfied` | Satisfecho |
| `unsatisfied` | No satisfecho |
| `issue_resolved` | Problema resuelto |
| `escalated` | Escalado |
| `follow_up_needed` | Requiere seguimiento |

El listado CRM filtra este campo con `outcome`. Ver `src/api/crm/docs/UI_CRM_INBOX.md`.
