# UI — Compras de los últimos 12 meses

Gráfica de línea en el **detalle del cliente**, debajo de las tarjetas de resumen y arriba de las órdenes de venta.

La ventana es móvil: termina en el mes en curso (calendario `America/Mexico_City`) y retrocede 11 meses. No es enero–diciembre.

---

## Endpoint

```http
GET /api/tenant/customers/:id/purchase-trend
Permiso: customers:Read
```

Cargar al abrir el detalle, en paralelo con el resto de la ficha.

---

## Respuesta

```json
{
  "currency": "MXN",
  "from": "2025-11",
  "to": "2026-10",
  "total": 169.51,
  "orders_count": 5,
  "months": [
    { "month": "2025-11", "label": "nov 25", "total": 100.5, "orders_count": 1 },
    { "month": "2025-12", "label": "dic 25", "total": 0, "orders_count": 0 }
  ]
}
```

`months` siempre trae 12 puntos, en orden, con ceros donde no hubo compras.

### Reglas

| Regla | Detalle |
|-------|---------|
| Qué suma | `total` de órdenes de venta del cliente |
| Excluye | `general_status = Cancelada` |
| Mes | `created_at` interpretado en UTC y asignado al mes de México |
| Etiqueta | mes corto en español + año de dos dígitos (`oct 26`) |
