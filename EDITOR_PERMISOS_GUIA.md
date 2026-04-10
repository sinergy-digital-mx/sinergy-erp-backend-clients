# 🔐 Editor de Permisos - Guía de Uso

## ✨ Nueva Funcionalidad Agregada

Ahora el HTML incluye un editor completo de permisos para cada módulo.

---

## 🎯 Cómo Usar

### 1. Acceder al Editor de Permisos

1. Abre `http://localhost:8000/tenant-modules-admin.html`
2. Selecciona un tenant
3. Haz clic en la pestaña **"🔐 Permisos"**

### 2. Ver Permisos de un Módulo

1. En la pestaña de Permisos, selecciona un módulo del dropdown
2. Verás todos los permisos existentes para ese módulo
3. Los permisos se muestran con badges:
   - **Sistema**: Permisos predefinidos (no se pueden eliminar)
   - **Personalizado**: Permisos creados por ti (se pueden editar/eliminar)

### 3. Crear un Nuevo Permiso

1. Selecciona un módulo
2. Haz clic en **"➕ Crear Permiso"**
3. Completa el formulario:
   - **Acción**: Nombre del permiso (ej: `Download_Report`, `Export_Data`, `View_Analytics`)
   - **Descripción**: Descripción opcional del permiso
4. Haz clic en **"Guardar"**

### 4. Editar un Permiso

1. Encuentra el permiso en la lista
2. Haz clic en **"✏️ Editar"**
3. Modifica la acción o descripción
4. Haz clic en **"Guardar"**

### 5. Eliminar un Permiso

1. Encuentra el permiso personalizado en la lista
2. Haz clic en **"🗑️"**
3. Confirma la eliminación

⚠️ **Nota**: Solo puedes eliminar permisos personalizados, no los del sistema.

---

## 📋 Ejemplos de Permisos Personalizados

### Reportes
- `Download_Report` - Descargar reportes
- `Export_Excel` - Exportar a Excel
- `Export_PDF` - Exportar a PDF
- `View_Analytics` - Ver analíticas

### Datos
- `Import_Data` - Importar datos
- `Export_Data` - Exportar datos
- `Bulk_Delete` - Eliminación masiva
- `Bulk_Update` - Actualización masiva

### Avanzado
- `Manage_Settings` - Gestionar configuración
- `View_Audit_Log` - Ver logs de auditoría
- `Approve_Changes` - Aprobar cambios
- `Override_Validation` - Omitir validaciones

---

## 🔌 Endpoints API Nuevos

### Listar Todos los Permisos
```bash
GET /api/admin/tenant-modules/permissions
```

### Obtener Permisos de un Módulo
```bash
GET /api/admin/tenant-modules/modules/:moduleId/permissions
```

### Crear Permiso
```bash
POST /api/admin/tenant-modules/modules/:moduleId/permissions
Content-Type: application/json

{
  "action": "Download_Report",
  "description": "Permite descargar reportes en PDF"
}
```

### Actualizar Permiso
```bash
PUT /api/admin/tenant-modules/permissions/:permissionId
Content-Type: application/json

{
  "action": "Download_Report",
  "description": "Nueva descripción"
}
```

### Eliminar Permiso
```bash
DELETE /api/admin/tenant-modules/permissions/:permissionId
```

---

## 💡 Casos de Uso

### Caso 1: Agregar Permiso de Descarga de Reportes

1. Selecciona el módulo "Customers"
2. Clic en "➕ Crear Permiso"
3. Acción: `Download_Report`
4. Descripción: `Permite descargar reportes de clientes`
5. Guardar

### Caso 2: Agregar Múltiples Permisos de Exportación

Para el módulo "Contracts":
- `Export_Excel` - Exportar contratos a Excel
- `Export_PDF` - Exportar contratos a PDF
- `Export_CSV` - Exportar contratos a CSV

### Caso 3: Permisos de Administración

Para el módulo "Users":
- `Reset_Password` - Resetear contraseña de usuario
- `Unlock_Account` - Desbloquear cuenta
- `View_Login_History` - Ver historial de logins

---

## 🎨 Interfaz

### Pestaña de Módulos
- Vista de tarjetas con módulos
- Habilitar/deshabilitar módulos
- Acciones masivas

### Pestaña de Permisos
- Selector de módulo
- Lista de permisos con badges
- Botones de acción (Editar/Eliminar)
- Modal para crear/editar

---

## ⚠️ Restricciones

### Permisos del Sistema
- ❌ No se pueden eliminar
- ✅ Se pueden editar (acción y descripción)
- 🔵 Marcados con badge azul "Sistema"

### Permisos Personalizados
- ✅ Se pueden editar
- ✅ Se pueden eliminar
- 🟡 Marcados con badge amarillo "Personalizado"

---

## 🔄 Flujo Completo

```
1. Seleccionar Tenant
   ↓
2. Ir a pestaña "Permisos"
   ↓
3. Seleccionar Módulo
   ↓
4. Ver permisos existentes
   ↓
5. Crear/Editar/Eliminar permisos
   ↓
6. Los cambios se guardan inmediatamente
```

---

## 🧪 Probar con cURL

### Crear un permiso
```bash
curl -X POST http://localhost:3001/api/admin/tenant-modules/modules/MODULE_ID/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "Download_Report",
    "description": "Permite descargar reportes"
  }'
```

### Listar permisos de un módulo
```bash
curl http://localhost:3001/api/admin/tenant-modules/modules/MODULE_ID/permissions
```

### Actualizar un permiso
```bash
curl -X PUT http://localhost:3001/api/admin/tenant-modules/permissions/PERMISSION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "action": "Download_Report_V2",
    "description": "Nueva descripción"
  }'
```

### Eliminar un permiso
```bash
curl -X DELETE http://localhost:3001/api/admin/tenant-modules/permissions/PERMISSION_ID
```

---

## 📝 Convenciones de Nombres

### Recomendadas
- `PascalCase`: `DownloadReport`, `ExportData`
- `Snake_Case`: `Download_Report`, `Export_Data`
- `UPPER_SNAKE_CASE`: `DOWNLOAD_REPORT`, `EXPORT_DATA`

### Evitar
- `camelCase`: `downloadReport` (puede confundirse con variables)
- Espacios: `Download Report` (causará problemas)
- Caracteres especiales: `Download-Report!` (no recomendado)

---

## ✅ Resumen

Ahora puedes:
- ✅ Ver todos los permisos de cada módulo
- ✅ Crear permisos personalizados (ej: `Download_Report`)
- ✅ Editar permisos existentes
- ✅ Eliminar permisos personalizados
- ✅ Distinguir entre permisos del sistema y personalizados

Todo desde una interfaz visual simple y sin necesidad de tocar la base de datos directamente.

---

## 🔄 Reiniciar Backend

Recuerda reiniciar el backend para que los nuevos endpoints estén disponibles:

```bash
# Detener (Ctrl+C)
# Iniciar de nuevo
npm run start:dev
```

¡Listo para usar! 🎉
