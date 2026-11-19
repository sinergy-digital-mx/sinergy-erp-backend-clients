# UI — Excel del inbox CRM

```
GET /api/tenant/crm/activities/export/excel
```

## Cambios

- 2026-11-02: La columna **Vendedor** usa `seller`: autor de la actividad, o el vendedor del cliente, o quien lo registró.
- 2026-10-15: El Excel respeta `outcome` y etiqueta `unsatisfied` como **No satisfecho**.

Mismos query params que el listado (`search`, `type`, `status`, `outcome`, `user_id`, `period`, `date_from`, `date_to`, `attention`). **No** pagina: exporta todas las filas del filtro.

Permiso: `customers:Read`. El alcance es el mismo que el inbox (propias vs admin CRM).

Descarga `.xlsx` (`crm-actividades-YYYY-MM-DD.xlsx`).
