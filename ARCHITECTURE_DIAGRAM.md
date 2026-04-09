# 🏗️ Arquitectura - Exportación de Contratos a Excel

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Página de Contratos                                         │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ Filtros:                                               │  │   │
│  │  │ - Status (activo, completado, etc.)                   │  │   │
│  │  │ - Cliente                                              │  │   │
│  │  │ - Propiedad                                            │  │   │
│  │  │ - Pagos Vencidos                                       │  │   │
│  │  │ - Búsqueda                                             │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ [Crear Contrato] [Descargar Excel] ← NUEVO BOTÓN      │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ Tabla de Contratos (Paginada)                          │  │   │
│  │  │ - Número Contrato                                      │  │   │
│  │  │ - Cliente                                              │  │   │
│  │  │ - Lote                                                 │  │   │
│  │  │ - Estado                                               │  │   │
│  │  │ - Acciones                                             │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP GET
                                  │ /api/tenant/contracts/export/excel
                                  │ ?status=activo&hasOverdue=true
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (NestJS)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ContractsController                                          │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ @Get('export/excel')                                  │   │   │
│  │ │ async exportToExcel(                                  │   │   │
│  │ │   @Query() filters,                                   │   │   │
│  │ │   @Response() res                                     │   │   │
│  │ │ )                                                      │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                    │
│                                  │ Inyecta                            │
│                                  ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ContractsExportService (NUEVO)                              │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ async exportToExcel(                                  │   │   │
│  │ │   tenantId,                                           │   │   │
│  │ │   customerId?,                                        │   │   │
│  │ │   propertyId?,                                        │   │   │
│  │ │   status?,                                            │   │   │
│  │ │   hasOverdue?,                                        │   │   │
│  │ │   search?                                             │   │   │
│  │ │ ): Promise<Buffer>                                    │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                    │
│                                  │ Construye Query                    │
│                                  ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ TypeORM Query Builder                                        │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ SELECT c.*, customer.*, property.*                    │   │   │
│  │ │ FROM contracts c                                      │   │   │
│  │ │ LEFT JOIN customers                                   │   │   │
│  │ │ LEFT JOIN properties                                  │   │   │
│  │ │ WHERE c.tenant_id = ?                                 │   │   │
│  │ │ AND c.status = ? (si aplica)                          │   │   │
│  │ │ AND c.customer_id = ? (si aplica)                     │   │   │
│  │ │ ... (más filtros)                                     │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                    │
│                                  │ Obtiene Contratos                  │
│                                  ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Base de Datos (MySQL)                                        │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ contracts                                              │   │   │
│  │ │ customers                                              │   │   │
│  │ │ properties                                             │   │   │
│  │ │ contract_payments                                      │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                    │
│                                  │ Retorna Contratos                  │
│                                  ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ContractsExportService (continuación)                        │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ 1. Obtiene pagos realizados (meses pagados)           │   │   │
│  │ │    SELECT COUNT(*), SUM(amount)                        │   │   │
│  │ │    FROM contract_payments                              │   │   │
│  │ │    WHERE status = 'pagado'                             │   │   │
│  │ │                                                         │   │   │
│  │ │ 2. Obtiene próximo pago                                │   │   │
│  │ │    SELECT * FROM contract_payments                     │   │   │
│  │ │    WHERE status IN ('pendiente', 'parcial', 'vencido') │   │   │
│  │ │    ORDER BY due_date ASC LIMIT 1                       │   │   │
│  │ │                                                         │   │   │
│  │ │ 3. Obtiene pagos vencidos                              │   │   │
│  │ │    SELECT COUNT(*) FROM contract_payments              │   │   │
│  │ │    WHERE payment_date < TODAY                          │   │   │
│  │ │    AND status IN ('pendiente', 'parcial')              │   │   │
│  │ │                                                         │   │   │
│  │ │ 4. Prepara datos para Excel                            │   │   │
│  │ │    - Formatea fechas (es-MX)                           │   │   │
│  │ │    - Formatea montos (USD)                             │   │   │
│  │ │    - Calcula monto financiado                          │   │   │
│  │ │                                                         │   │   │
│  │ │ 5. Crea workbook con XLSX                              │   │   │
│  │ │    - Agrega estilos al header                          │   │   │
│  │ │    - Ajusta ancho de columnas                          │   │   │
│  │ │    - Genera buffer                                     │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                    │
│                                  │ Retorna Buffer                     │
│                                  ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ContractsController                                          │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ res.setHeader('Content-Type',                         │   │   │
│  │ │   'application/vnd.openxmlformats...')                │   │   │
│  │ │ res.setHeader('Content-Disposition',                  │   │   │
│  │ │   'attachment; filename=\"contratos.xlsx\"')          │   │   │
│  │ │ res.send(buffer)                                      │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP Response
                                  │ Content-Type: application/vnd.openxmlformats...
                                  │ Content-Disposition: attachment; filename="contratos.xlsx"
                                  │ Body: Buffer (archivo Excel)
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR (Cliente)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Descarga Automática                                          │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ Archivo: contratos-2026-04-09.xlsx                    │   │   │
│  │ │ Tamaño: ~50-500 KB (depende de registros)             │   │   │
│  │ │ Ubicación: Carpeta de Descargas                        │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Usuario Abre en Excel                                        │   │
│  │ ┌────────────────────────────────────────────────────────┐   │   │
│  │ │ ┌─────────────────────────────────────────────────┐    │   │   │
│  │ │ │ Número │ Cliente │ Lote │ Fecha │ Precio │ ... │    │   │   │
│  │ │ │ Contrato                                        │    │   │   │
│  │ │ ├─────────────────────────────────────────────────┤    │   │   │
│  │ │ │ CONT-1-3 │ Jacobo Noe │ LOT-1-03 │ Mar 19 │ ... │    │   │   │
│  │ │ │ CONT-2-12 │ Mario Alberto │ LOT-2-12 │ Ene 1 │ ... │    │   │   │
│  │ │ │ ... (más registros)                            │    │   │   │
│  │ │ └─────────────────────────────────────────────────┘    │   │   │
│  │ └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. ContractsExportService
```typescript
exportToExcel(
  tenantId: string,
  customerId?: number,
  propertyId?: string,
  status?: string,
  hasOverdue?: boolean,
  search?: string
): Promise<Buffer>
```

**Responsabilidades:**
- Construir query con filtros
- Obtener contratos de BD
- Obtener datos de pagos
- Formatear datos
- Generar Excel
- Retornar buffer

### 2. ContractsController
```typescript
@Get('export/excel')
async exportToExcel(
  @Query() filters,
  @Response() res
)
```

**Responsabilidades:**
- Validar autenticación
- Validar permisos
- Obtener tenant context
- Llamar servicio
- Enviar respuesta HTTP

### 3. Base de Datos
```
Queries:
1. Contratos con filtros
2. Pagos realizados (count + sum)
3. Próximo pago
4. Pagos vencidos (count)
```

## Flujo de Datos Detallado

```
1. Usuario hace clic en "Descargar Excel"
   ↓
2. Frontend envía GET /api/tenant/contracts/export/excel?filters
   ↓
3. Backend valida JWT y permisos
   ↓
4. Backend obtiene tenant_id del contexto
   ↓
5. ContractsExportService construye query con filtros
   ↓
6. Query obtiene contratos de BD
   ↓
7. Para cada contrato, obtiene:
   - Pagos realizados (count + sum)
   - Próximo pago
   - Pagos vencidos
   ↓
8. Formatea datos:
   - Fechas: es-MX
   - Montos: USD
   - Cálculos: monto financiado
   ↓
9. Crea workbook XLSX con:
   - Header con estilos
   - Datos formateados
   - Columnas ajustadas
   ↓
10. Genera buffer
    ↓
11. Envía respuesta HTTP con:
    - Content-Type: application/vnd.openxmlformats...
    - Content-Disposition: attachment; filename="contratos.xlsx"
    - Body: Buffer
    ↓
12. Navegador descarga archivo
    ↓
13. Usuario abre en Excel
```

## Seguridad

```
┌─────────────────────────────────────────┐
│ Request HTTP                             │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ 1. Validar JWT                          │
│    - Token válido?                      │
│    - No expirado?                       │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ 2. Validar Permisos                     │
│    - Usuario tiene permiso Read?        │
│    - En entidad Contract?               │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ 3. Obtener Tenant Context               │
│    - Tenant ID del usuario              │
│    - Validar que sea válido             │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ 4. Filtrar por Tenant                   │
│    - WHERE tenant_id = ?                │
│    - Solo datos del tenant              │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Generar Excel                           │
└─────────────────────────────────────────┘
```

## Rendimiento

```
Operación                    Tiempo Estimado
─────────────────────────────────────────
Validación JWT               ~1ms
Validación Permisos          ~5ms
Query Contratos              ~50-200ms (depende de registros)
Query Pagos Realizados       ~50-200ms
Query Próximo Pago           ~50-200ms
Query Pagos Vencidos         ~50-200ms
Formateo de Datos            ~10-50ms
Generación Excel             ~50-200ms
─────────────────────────────────────────
Total                        ~300-1000ms
```

## Escalabilidad

```
Registros    Tiempo Estimado    Tamaño Archivo
─────────────────────────────────────────────
10           ~300ms             ~5 KB
100          ~400ms             ~50 KB
1000         ~600ms             ~500 KB
10000        ~1000ms            ~5 MB
```

---

**Nota:** Los tiempos son estimados y pueden variar según:
- Velocidad de la BD
- Carga del servidor
- Tamaño de los registros
- Índices disponibles
