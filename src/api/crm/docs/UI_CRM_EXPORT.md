# UI — Excel del inbox CRM

```
GET /api/tenant/crm/activities/export/excel
```

Mismos query params que el listado (`search`, `type`, `status`, `user_id`, `period`, `date_from`, `date_to`, `attention`). **No** pagina: exporta todas las filas del filtro.

Permiso: `customers:Read`. El alcance es el mismo que el inbox (propias vs admin CRM).

Descarga `.xlsx` (`crm-actividades-YYYY-MM-DD.xlsx`).
