# 🔧 Tenant Modules Admin - Guía de Uso

## ⚠️ IMPORTANTE
Esta herramienta es **temporal** y **NO tiene autenticación**. Solo debe usarse en desarrollo local y **NUNCA** debe desplegarse en producción.

## 📋 Descripción
Interfaz HTML simple para administrar los módulos habilitados/deshabilitados para cada tenant mientras desarrollas tu aplicación de administración completa.

## 🚀 Cómo Usar

### 1. Iniciar el servidor backend
```bash
npm run start:dev
```

El servidor debe estar corriendo en `http://localhost:3001`

### 2. Abrir el HTML
Simplemente abre el archivo `tenant-modules-admin.html` en tu navegador:
- Doble clic en el archivo
- O arrastra el archivo a tu navegador
- O usa: `file:///ruta/a/tu/proyecto/tenant-modules-admin.html`

### 3. Usar la interfaz

#### Seleccionar Tenant
1. Selecciona un tenant del dropdown
2. Se cargarán automáticamente todos los módulos disponibles

#### Ver Estadísticas
- **Total Módulos**: Cantidad total de módulos en el sistema
- **Habilitados**: Módulos activos para el tenant
- **Deshabilitados**: Módulos inactivos para el tenant

#### Habilitar/Deshabilitar Módulos Individuales
- Haz clic en cualquier tarjeta de módulo para cambiar su estado
- Los módulos habilitados se muestran en verde
- Los módulos deshabilitados se muestran en gris

#### Acciones Masivas
- **Habilitar Todos**: Activa todos los módulos para el tenant seleccionado
- **Deshabilitar Todos**: Desactiva todos los módulos (⚠️ usar con precaución)

## 🔌 Endpoints API Disponibles

### GET `/api/admin/tenant-modules/tenants`
Obtiene todos los tenants

### GET `/api/admin/tenant-modules/modules`
Obtiene todos los módulos disponibles

### GET `/api/admin/tenant-modules/tenants/:tenantId/modules`
Obtiene los módulos de un tenant específico con su estado

### POST `/api/admin/tenant-modules/tenants/:tenantId/modules/:moduleId/enable`
Habilita un módulo para un tenant

### POST `/api/admin/tenant-modules/tenants/:tenantId/modules/:moduleId/disable`
Deshabilita un módulo para un tenant

### POST `/api/admin/tenant-modules/tenants/:tenantId/modules/enable-all`
Habilita todos los módulos para un tenant

### POST `/api/admin/tenant-modules/tenants/:tenantId/modules/disable-all`
Deshabilita todos los módulos para un tenant

## 🧪 Probar con cURL

```bash
# Listar todos los tenants
curl http://localhost:3001/api/admin/tenant-modules/tenants

# Listar módulos de un tenant
curl http://localhost:3001/api/admin/tenant-modules/tenants/TENANT_ID/modules

# Habilitar un módulo
curl -X POST http://localhost:3001/api/admin/tenant-modules/tenants/TENANT_ID/modules/MODULE_ID/enable

# Deshabilitar un módulo
curl -X POST http://localhost:3001/api/admin/tenant-modules/tenants/TENANT_ID/modules/MODULE_ID/disable

# Habilitar todos los módulos
curl -X POST http://localhost:3001/api/admin/tenant-modules/tenants/TENANT_ID/modules/enable-all

# Deshabilitar todos los módulos
curl -X POST http://localhost:3001/api/admin/tenant-modules/tenants/TENANT_ID/modules/disable-all
```

## 📁 Archivos Creados

1. **src/api/rbac/controllers/admin-tenant-modules.controller.ts**
   - Controlador NestJS sin guards de autenticación
   - Endpoints para gestionar módulos de tenants

2. **tenant-modules-admin.html**
   - Interfaz HTML standalone
   - No requiere instalación de dependencias
   - Se conecta directamente a la API

3. **TENANT_MODULES_ADMIN_README.md**
   - Este archivo con las instrucciones

## 🗑️ Eliminar Cuando Ya No Se Necesite

Cuando termines tu aplicación de administración completa, elimina:

```bash
# Eliminar el controlador temporal
rm src/api/rbac/controllers/admin-tenant-modules.controller.ts

# Eliminar el HTML
rm tenant-modules-admin.html

# Eliminar este README
rm TENANT_MODULES_ADMIN_README.md
```

Y también elimina la referencia en `src/api/rbac/rbac.module.ts`:
- Quita el import de `AdminTenantModulesController`
- Quita el controlador del array de `controllers`

## 🔒 Seguridad

**NUNCA** despliegues estos archivos en producción:
- No tienen autenticación
- No tienen autorización
- Cualquiera puede modificar los módulos de cualquier tenant
- Solo para desarrollo local

## 💡 Ejemplo de Uso

1. Inicia tu servidor: `npm run start:dev`
2. Abre `tenant-modules-admin.html` en Chrome/Firefox
3. Selecciona "Maderia Zona Norte" del dropdown
4. Verás todos los módulos disponibles
5. Haz clic en un módulo para habilitarlo/deshabilitarlo
6. O usa "Habilitar Todos" para activar todos los módulos

## 🐛 Troubleshooting

### Error: "Failed to fetch"
- Verifica que el servidor esté corriendo en `http://localhost:3001`
- Verifica que no haya errores de CORS (el controlador no tiene guards, así que no debería haber problemas)

### No aparecen los tenants
- Verifica que tengas tenants en la base de datos
- Revisa la consola del navegador (F12) para ver errores

### Los cambios no se reflejan
- Haz clic en el botón "🔄 Recargar" para refrescar la lista de tenants
- Recarga la página del navegador

## 📞 Soporte

Si tienes problemas, revisa:
1. Logs del servidor NestJS
2. Consola del navegador (F12 → Console)
3. Network tab del navegador para ver las peticiones HTTP
