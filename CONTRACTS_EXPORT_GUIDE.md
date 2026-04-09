# Guía de Exportación de Contratos a Excel

## Descripción
Se ha agregado un nuevo endpoint para descargar los contratos filtrados en formato Excel con información detallada de pagos.

## Endpoint
```
GET /api/tenant/contracts/export/excel
```

## Parámetros de Query (Opcionales)
Los mismos filtros que usa el endpoint de listado:
- `customerId` - ID del cliente
- `propertyId` - ID de la propiedad
- `status` - Estado del contrato (activo, completado, vencido, etc.)
- `hasOverdue` - true/false para filtrar contratos con pagos vencidos
- `search` - Búsqueda por nombre de cliente, número de contrato o código de lote

## Ejemplo de Uso

### Descargar todos los contratos
```
GET http://localhost:3001/api/tenant/contracts/export/excel
```

### Descargar solo contratos activos
```
GET http://localhost:3001/api/tenant/contracts/export/excel?status=activo
```

### Descargar contratos con pagos vencidos
```
GET http://localhost:3001/api/tenant/contracts/export/excel?hasOverdue=true
```

### Descargar contratos de un cliente específico
```
GET http://localhost:3001/api/tenant/contracts/export/excel?customerId=85
```

### Combinación de filtros
```
GET http://localhost:3001/api/tenant/contracts/export/excel?status=activo&hasOverdue=true&customerId=85
```

## Columnas en el Excel

| Columna | Descripción |
|---------|-------------|
| Número Contrato | Identificador único del contrato |
| Cliente | Nombre completo del cliente |
| Lote | Código del lote/propiedad |
| Fecha Inicio | Fecha de inicio del contrato |
| Precio Total | Precio total de la propiedad |
| Enganche | Monto del pago inicial |
| Monto Financiado | Monto total a financiar (Precio Total - Enganche) |
| Saldo Pendiente | Monto aún por pagar |
| Meses Pagados | Cantidad de pagos realizados |
| Monto Pagado | Monto total pagado hasta la fecha |
| Próximo Pago | Fecha del próximo pago |
| Monto Próximo Pago | Monto del próximo pago |
| Estado | Estado actual del contrato |
| Pagos Vencidos | Cantidad de pagos vencidos |

## Características

✅ **Exporta todos los registros filtrados** - No está limitado a 20 registros como la paginación
✅ **Header con estilos** - Encabezados con fondo azul oscuro y texto blanco
✅ **Columnas ajustadas** - Ancho automático para mejor legibilidad
✅ **Información de pagos** - Incluye meses pagados y monto pagado
✅ **Respeta filtros** - Exporta solo los registros que coinciden con los filtros aplicados
✅ **Formato de moneda** - Los montos se muestran con formato USD

## Implementación en Frontend

### Botón de Descarga
Agregar un botón en la UI que llame al endpoint:

```javascript
async function downloadContractsExcel(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.customerId) params.append('customerId', filters.customerId);
  if (filters.propertyId) params.append('propertyId', filters.propertyId);
  if (filters.status) params.append('status', filters.status);
  if (filters.hasOverdue) params.append('hasOverdue', filters.hasOverdue);
  if (filters.search) params.append('search', filters.search);
  
  const url = `/api/tenant/contracts/export/excel?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `contratos-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
```

## Notas Técnicas

- El endpoint respeta los mismos filtros que el listado de contratos
- No hay límite de registros en la exportación (a diferencia de la paginación)
- Los datos se obtienen en tiempo real de la base de datos
- El archivo se genera en memoria y se descarga directamente
- El nombre del archivo es `contratos.xlsx`

## Permisos Requeridos

El usuario debe tener permiso de lectura en la entidad `Contract` para acceder a este endpoint.
