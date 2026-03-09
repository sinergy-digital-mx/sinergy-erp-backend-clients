# Troubleshooting: Price Lists

## Problema: No aparecen las listas de precios al consultar

### Diagnóstico

Según los logs del servidor, la query está filtrando por `is_active = false`:

```sql
WHERE `price_list`.`is_active` = ? 
-- PARAMETERS: ["afff1757-dbcf-4715-a756-6b22bb2c59d5", false]
```

Esto significa que tu frontend está enviando `is_active=false` en la petición, pero las listas de precios por defecto se crean con `is_active=true`.

---

## Solución 1: Corregir la Petición del Frontend (RECOMENDADO)

### Opción A: No enviar el parámetro is_active

```typescript
// ❌ INCORRECTO
this.http.get('/api/tenant/price-lists?is_active=false')

// ✅ CORRECTO - Sin filtro
this.http.get('/api/tenant/price-lists')

// ✅ CORRECTO - Filtrar solo activas
this.http.get('/api/tenant/price-lists?is_active=true')
```

### Opción B: Verificar el servicio Angular

```typescript
// Busca en tu código algo como esto:
getPriceLists() {
  // ❌ Si tienes esto, cámbialo:
  return this.http.get('/api/tenant/price-lists?is_active=false');
  
  // ✅ Debería ser:
  return this.http.get('/api/tenant/price-lists');
  // o
  return this.http.get('/api/tenant/price-lists?is_active=true');
}
```

---

## Solución 2: Verificar/Actualizar la Base de Datos

### Ver el estado actual de las listas

```sql
SELECT id, name, is_active, is_default 
FROM price_lists 
WHERE tenant_id = 'afff1757-dbcf-4715-a756-6b22bb2c59d5';
```

### Si la lista existe pero está inactiva, activarla

```sql
UPDATE price_lists 
SET is_active = 1 
WHERE tenant_id = 'afff1757-dbcf-4715-a756-6b22bb2c59d5' 
AND name = 'Menudeo';
```

---

## Solución 3: Eliminar la Lista Duplicada y Crear Nueva

Si quieres empezar de cero:

### 1. Eliminar la lista existente

```sql
DELETE FROM price_lists 
WHERE tenant_id = 'afff1757-dbcf-4715-a756-6b22bb2c59d5' 
AND name = 'Menudeo';
```

### 2. Crear nueva lista (asegurándote de que is_active sea true)

```http
POST /api/tenant/price-lists
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Menudeo",
  "description": "Precios para venta al menudeo",
  "is_default": true,
  "is_active": true
}
```

**Nota:** `is_active` por defecto es `true`, así que no es necesario enviarlo explícitamente.

---

## Endpoints Correctos para Listar

### Listar TODAS las listas de precios (activas e inactivas)

```http
GET /api/tenant/price-lists
```

### Listar solo listas ACTIVAS

```http
GET /api/tenant/price-lists?is_active=true
```

### Listar solo listas INACTIVAS

```http
GET /api/tenant/price-lists?is_active=false
```

### Obtener la lista por defecto

```http
GET /api/tenant/price-lists/default
```

---

## Verificación Rápida

### 1. Probar con cURL o Postman

```bash
# Sin filtro (debería mostrar todas)
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/api/tenant/price-lists

# Solo activas
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/api/tenant/price-lists?is_active=true
```

### 2. Verificar la respuesta

Deberías ver algo como:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Menudeo",
      "is_active": true,
      "is_default": true,
      "created_at": "2026-03-09T..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## Problema: Error al Crear Lista Duplicada

### Síntoma

```json
{
  "error": "ER_DUP_ENTRY: Duplicate entry 'tenant-id-Menudeo' for key 'price_lists_tenant_name_idx'"
}
```

### Causa

Ya existe una lista de precios con el nombre "Menudeo" para ese tenant.

### Solución

**Opción 1:** Usar un nombre diferente
```json
{
  "name": "Menudeo 2",
  "is_default": false
}
```

**Opción 2:** Actualizar la lista existente en lugar de crear una nueva
```http
PUT /api/tenant/price-lists/{id}
Content-Type: application/json

{
  "description": "Nueva descripción",
  "is_active": true
}
```

**Opción 3:** Eliminar la lista existente primero (ver SQL arriba)

---

## Checklist de Diagnóstico

- [ ] Verificar que el frontend NO esté enviando `is_active=false`
- [ ] Verificar en la base de datos que la lista existe y está activa
- [ ] Probar el endpoint sin filtros: `GET /api/tenant/price-lists`
- [ ] Verificar que el token JWT sea válido y tenga el tenant_id correcto
- [ ] Verificar permisos: el usuario debe tener `PriceList:Read`
- [ ] Reiniciar el servidor NestJS si hiciste cambios en el código

---

## Ejemplo Completo: Servicio Angular Correcto

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PriceList {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
}

export interface PriceListResponse {
  data: PriceList[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class PriceListService {
  private apiUrl = '/api/tenant/price-lists';

  constructor(private http: HttpClient) {}

  // ✅ CORRECTO: Listar todas las listas activas
  getPriceLists(page: number = 1, limit: number = 20): Observable<PriceListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('is_active', 'true'); // Solo activas
    
    return this.http.get<PriceListResponse>(this.apiUrl, { params });
  }

  // ✅ CORRECTO: Obtener lista por defecto
  getDefaultPriceList(): Observable<PriceList> {
    return this.http.get<PriceList>(`${this.apiUrl}/default`);
  }

  // ✅ CORRECTO: Crear nueva lista
  createPriceList(data: Partial<PriceList>): Observable<PriceList> {
    return this.http.post<PriceList>(this.apiUrl, {
      ...data,
      is_active: true // Asegurar que sea activa
    });
  }

  // ✅ CORRECTO: Actualizar lista existente
  updatePriceList(id: string, data: Partial<PriceList>): Observable<PriceList> {
    return this.http.put<PriceList>(`${this.apiUrl}/${id}`, data);
  }
}
```

---

## Resumen de Acciones

1. **Inmediato:** Cambia tu petición GET para no enviar `is_active=false`
2. **Verificar:** Consulta la base de datos para ver el estado de la lista "Menudeo"
3. **Si es necesario:** Actualiza `is_active = 1` en la base de datos
4. **Alternativa:** Elimina la lista duplicada y créala de nuevo con el frontend corregido

