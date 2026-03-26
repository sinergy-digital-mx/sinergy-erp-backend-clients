# Flujo Completo para Procesar Pagos en POS

## Error: "No active cash shift found"

Este error aparece porque el sistema POS requiere que el cajero tenga un **turno de caja activo** antes de procesar cualquier pago.

## Solución: Abrir Turno de Caja

### Paso 1: Abrir Turno de Caja

**Endpoint:** `POST /api/tenant/pos/cash-shifts/open`

**Request Body (Opción 1 - Recomendado):**
```json
{
  "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
  "initial_cash": 1000,
  "notes": "Turno matutino"
}
```

**Request Body (Opción 2 - También válido):**
```json
{
  "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
  "opening_balance": 1000,
  "notes": "Turno matutino"
}
```

**Nota:** 
- El campo `initial_cash` o `opening_balance` acepta tanto números como strings (ej: `"1000"` o `1000`)
- Puedes usar `initial_cash` o `opening_balance` indistintamente
- NO envíes `cashier_id` - se obtiene automáticamente del token JWT

**Respuesta:**
```json
{
  "id": "shift-uuid",
  "cashier_id": "user-uuid",
  "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
  "initial_cash": 1000.00,
  "current_cash": 1000.00,
  "status": "open",
  "opened_at": "2026-03-09T10:00:00Z",
  "notes": "Turno matutino"
}
```

### Paso 2: Procesar Pago

Ahora sí puedes procesar el pago:

**Endpoint:** `POST /api/tenant/pos/orders/45b7e6aa-d8d4-4da1-a9cd-7bda86db2aaa/payment`

**Request Body:**
```json
{
  "payment_method": "cash",
  "amount_paid": "17999.98",
  "tip": 0
}
```

O con números:
```json
{
  "payment_method": "cash",
  "amount_paid": 17999.98,
  "received_amount": 20000,
  "tip": 0
}
```

### Paso 3: Cerrar Turno (Al Final del Día)

**Endpoint:** `POST /api/tenant/pos/cash-shifts/{shift-id}/close`

**Request Body:**
```json
{
  "final_cash": 18999.98,
  "notes": "Turno cerrado correctamente"
}
```

## Flujo Completo del Día

```
1. INICIO DEL DÍA
   └─> Cajero abre turno: POST /api/tenant/pos/cash-shifts/open

2. DURANTE EL DÍA
   ├─> Mesero crea orden: POST /api/tenant/pos/orders
   ├─> Mesero agrega productos: (incluidos en create o POST /api/tenant/pos/orders/:id/lines)
   └─> Cajero procesa pago: POST /api/tenant/pos/orders/:id/payment

3. FIN DEL DÍA
   └─> Cajero cierra turno: POST /api/tenant/pos/cash-shifts/:id/close
```

## Verificar Turno Actual

Si no estás seguro si tienes un turno abierto:

**Endpoint:** `GET /api/tenant/pos/cash-shifts/current?warehouse_id=87d51981-5697-4dc5-99e8-5149f8fbffe7`

**Respuestas posibles:**

- **Turno abierto:** Retorna el turno actual
- **Sin turno:** Retorna 404 o null

## Notas Importantes

1. **Un cajero solo puede tener un turno abierto a la vez** por almacén
2. **Todos los pagos se asocian al turno activo** del cajero
3. **El turno se identifica automáticamente** usando el `cashier_id` del JWT token
4. **El warehouse_id debe coincidir** entre la orden y el turno de caja
5. **Al cerrar el turno**, el sistema calcula automáticamente:
   - Total de ventas
   - Efectivo esperado
   - Diferencia (si hay)
   - Desglose por método de pago

## Ejemplo Completo con cURL

```bash
# 1. Abrir turno
curl -X POST http://localhost:3001/api/tenant/pos/cash-shifts/open \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_id": "87d51981-5697-4dc5-99e8-5149f8fbffe7",
    "initial_cash": 1000.00
  }'

# 2. Procesar pago
curl -X POST http://localhost:3001/api/tenant/pos/orders/45b7e6aa-d8d4-4da1-a9cd-7bda86db2aaa/payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "cash",
    "amount_paid": 17999.98,
    "tip": 0
  }'

# 3. Cerrar turno (al final del día)
curl -X POST http://localhost:3001/api/tenant/pos/cash-shifts/SHIFT_ID/close \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "final_cash": 18999.98
  }'
```

## Troubleshooting

### Error: "Cash shift already open"
- Ya tienes un turno abierto
- Usa `GET /api/tenant/pos/cash-shifts/current` para obtener el turno actual
- Cierra el turno anterior antes de abrir uno nuevo

### Error: "No active cash shift found"
- No has abierto un turno de caja
- Abre un turno con `POST /api/tenant/pos/cash-shifts/open`

### Error: "Warehouse mismatch"
- El warehouse_id de la orden no coincide con el del turno
- Asegúrate de usar el mismo warehouse_id en ambos
