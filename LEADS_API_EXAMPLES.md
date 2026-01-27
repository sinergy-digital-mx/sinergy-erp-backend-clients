# Leads API - Ejemplos de Uso

## 1. Obtener Leads con Paginación

### GET /leads

**Parámetros de Query:**

```typescript
interface QueryLeadsDto {
    page?: number;      // Página (por defecto: 1)
    limit?: number;     // Elementos por página (por defecto: 20, máximo: 100)
    search?: string;    // Búsqueda en name, lastname, email, phone, company_name
    status_id?: number; // Filtrar por ID de status
}
```

### Ejemplos de Requests:

#### Obtener primera página (20 leads por defecto)
```bash
GET /leads
Authorization: Bearer your-jwt-token
```

#### Obtener página 2 con 50 leads por página
```bash
GET /leads?page=2&limit=50
Authorization: Bearer your-jwt-token
```

#### Buscar leads que contengan "john"
```bash
GET /leads?search=john
Authorization: Bearer your-jwt-token
```

#### Buscar leads con status específico
```bash
GET /leads?status_id=1
Authorization: Bearer your-jwt-token
```

#### Búsqueda combinada
```bash
GET /leads?search=john&status_id=1&page=1&limit=10
Authorization: Bearer your-jwt-token
```

### Respuesta Paginada:

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
            "created_at": "2025-01-27T10:00:00.000Z",
            "status": {
                "id": 1,
                "name": "New",
                "code": "new"
            },
            "tenant": {
                "id": "tenant-uuid",
                "name": "My Company"
            }
        }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
}
```

## 2. Obtener Detalle de Lead con Addresses y Activities

### GET /leads/:id

**Incluye automáticamente:**
- Información básica del lead
- Status del lead
- Tenant information
- **Addresses** (direcciones asociadas)
- **Activities** (actividades del lead)

### Ejemplo de Request:

```bash
GET /leads/123
Authorization: Bearer your-jwt-token
```

### Respuesta con Relaciones:

```json
{
    "id": 123,
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
    "created_at": "2025-01-27T10:00:00.000Z",
    "status": {
        "id": 1,
        "name": "New",
        "code": "new"
    },
    "tenant": {
        "id": "tenant-uuid",
        "name": "My Company"
    },
    "addresses": [
        {
            "id": 1,
            "type": "business",
            "street_address": "123 Main St",
            "street_address_2": "Suite 100",
            "city": "Phoenix",
            "state": "AZ",
            "postal_code": "85086",
            "country": "United States",
            "is_primary": true,
            "created_at": "2025-01-27T10:00:00.000Z"
        }
    ],
    "activities": [
        {
            "id": 1,
            "type": "call",
            "description": "Initial contact call",
            "notes": "Customer interested in our services",
            "scheduled_at": "2025-01-27T14:00:00.000Z",
            "completed_at": null,
            "created_at": "2025-01-27T10:00:00.000Z"
        }
    ]
}
```

## 3. Crear Lead

### POST /leads

```bash
POST /leads
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
    "name": "Jane",
    "lastname": "Smith",
    "email": "jane@example.com",
    "phone": "+1987654321",
    "phone_country": "US",
    "phone_code": "+1",
    "source": "Website Form",
    "company_name": "Smith Industries",
    "company_phone": "+1987654321",
    "website": "https://smithindustries.com",
    "status_id": 1
}
```

## 4. Actualizar Lead

### PUT /leads/:id

```bash
PUT /leads/123
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
    "name": "Jane",
    "lastname": "Smith Updated",
    "email": "jane.updated@example.com",
    "status_id": 2
}
```

## Notas Importantes:

1. **Autenticación**: Todos los endpoints requieren el header `Authorization: Bearer <token>`
2. **Paginación**: La página es 1-based (primera página = 1)
3. **Límites**: Máximo 100 elementos por página
4. **Búsqueda**: Case-insensitive, busca en múltiples campos
5. **Relaciones**: El detalle incluye automáticamente addresses y activities
6. **Tenant**: Todos los datos están filtrados por el tenant del usuario autenticado