# UI — Precio por m² en lotes

Al crear o editar un lote el precio por m² es **opcional**. Si lo capturan, el backend calcula el monto total.

## Campos

| Campo | Tipo | Alta | Edición |
| ----- | ---- | ---- | ------- |
| `total_area` | number | obligatorio | opcional |
| `total_price` | number | uno de los dos | opcional |
| `price_per_m2` | number | uno de los dos | opcional |

`POST /tenant/properties` y `PUT /tenant/properties/:id`.

## UI sugerida

1. Campo **Área (m²)** (`total_area`).
2. Campo **Precio por m²** (`price_per_m2`) — opcional.
3. Campo **Precio total** (`total_price`).
4. Si el usuario escribe precio/m² (y hay área), puedes prellenar el total en el form: `área × precio/m²`. El backend hace el mismo cálculo si mandas `price_per_m2`.
5. Si solo escriben el total, no mandes `price_per_m2`. El API lo deriva en la respuesta.

## Ejemplos

Precio por m² → total calculado:

```json
{ "total_area": 200, "price_per_m2": 1850 }
```

→ `total_price: 370000`

Solo total:

```json
{ "total_area": 200, "total_price": 400000 }
```

→ `price_per_m2: 2000` (derivado)

Editar área con precio/m² ya guardado: se recalcula el total.

`400` si el alta no trae `total_price` ni `price_per_m2`.
