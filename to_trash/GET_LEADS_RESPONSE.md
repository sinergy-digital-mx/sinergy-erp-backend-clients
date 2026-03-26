# GET /leads - Respuesta Completa

## Endpoint
```
GET /leads?page=1&limit=20&search=john
```

## Respuesta JSON

```json
{
  "data": [
    {
      "id": 1,
      "name": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "phone_country": "US",
      "phone_code": "+1",
      "source": "Google Business Import",
      "company_name": "Acme Corp",
      "company_phone": "+1234567890",
      "website": "https://example.com",
      "created_at": "2024-01-27T14:30:00.000Z",
      "status": {
        "id": 1,
        "code": "new",
        "name": "New"
      },
      "tenant": {
        "id": "tenant-uuid",
        "name": "Divino"
      }
    }
  ],
  "total": 5637,           // ✅ TOTAL DE LEADS (para paginación)
  "page": 1,               // Página actual
  "limit": 20,             // Leads por página
  "totalPages": 282,       // Total de páginas (5637 / 20 = 282)
  "hasNext": true,         // ¿Hay siguiente página?
  "hasPrev": false         // ¿Hay página anterior?
}
```

## Campos para Paginación

| Campo | Uso |
|-------|-----|
| `total` | **Total de leads** - Úsalo para calcular páginas |
| `totalPages` | Total de páginas disponibles |
| `page` | Página actual |
| `limit` | Leads por página |
| `hasNext` | Si hay más páginas |
| `hasPrev` | Si hay página anterior |

## Cálculo de Paginación

```javascript
// En tu frontend:
const totalPages = Math.ceil(response.total / response.limit);
// Ejemplo: Math.ceil(5637 / 20) = 282 páginas
```

## Búsqueda Funcionando ✅

```
GET /leads?search=john
GET /leads?search=john@example.com
GET /leads?search=+1234567890
GET /leads?search=acme
```

Busca en: `name`, `lastname`, `email`, `phone`, `company_name`

## Filtros Disponibles

```
GET /leads?page=1&limit=20&search=john&status_id=1
```

- `page` - Número de página (default: 1)
- `limit` - Leads por página (default: 20, máximo: 100)
- `search` - Búsqueda por texto
- `status_id` - Filtrar por status