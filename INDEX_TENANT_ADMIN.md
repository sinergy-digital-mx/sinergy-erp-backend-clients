# 📚 Índice - Tenant Modules Admin Tool

Documentación completa de la herramienta temporal de administración de módulos por tenant.

---

## 🚀 Inicio Rápido

**¿Primera vez? Empieza aquí:**

1. 📖 **[QUICK_START_TENANT_ADMIN.md](QUICK_START_TENANT_ADMIN.md)**
   - Guía de inicio rápido en 3 pasos
   - Vista previa de la interfaz
   - Tips básicos

2. 🌐 **[tenant-modules-admin.html](tenant-modules-admin.html)**
   - Interfaz web standalone
   - Abre directamente en tu navegador
   - No requiere instalación

---

## 📖 Documentación Completa

### 📘 Guías Principales

1. **[TENANT_MODULES_ADMIN_README.md](TENANT_MODULES_ADMIN_README.md)**
   - Documentación completa y detallada
   - Descripción de todos los endpoints
   - Guía de uso paso a paso
   - Troubleshooting
   - Instrucciones de limpieza

2. **[TENANT_ADMIN_SUMMARY.md](TENANT_ADMIN_SUMMARY.md)**
   - Resumen ejecutivo
   - Archivos creados
   - Características principales
   - Ejemplos de uso real
   - Checklist de limpieza

3. **[API_EXAMPLES.md](API_EXAMPLES.md)**
   - Ejemplos en múltiples lenguajes
   - JavaScript, Python, Node.js, PowerShell, Bash
   - Rust, Go, React
   - Postman Collection

---

## 🛠️ Archivos de Código

### Backend (NestJS)

```
src/api/rbac/controllers/
└── admin-tenant-modules.controller.ts
```

**Descripción:** Controlador NestJS sin autenticación para gestionar módulos de tenants.

**Endpoints:**
- `GET /admin/tenant-modules/tenants` - Lista tenants
- `GET /admin/tenant-modules/modules` - Lista módulos
- `GET /admin/tenant-modules/tenants/:id/modules` - Módulos de un tenant
- `POST /admin/tenant-modules/tenants/:id/modules/:mid/enable` - Habilitar módulo
- `POST /admin/tenant-modules/tenants/:id/modules/:mid/disable` - Deshabilitar módulo
- `POST /admin/tenant-modules/tenants/:id/modules/enable-all` - Habilitar todos
- `POST /admin/tenant-modules/tenants/:id/modules/disable-all` - Deshabilitar todos

### Frontend (HTML)

```
tenant-modules-admin.html
```

**Descripción:** Interfaz web standalone con diseño moderno.

**Características:**
- ✅ Selección de tenant
- ✅ Vista de módulos en cuadrícula
- ✅ Toggle individual de módulos
- ✅ Acciones masivas
- ✅ Estadísticas en tiempo real
- ✅ Diseño responsive

---

## 🧪 Scripts de Prueba

### PowerShell (Windows)

```
test-tenant-modules-api.ps1
```

**Uso:**
```powershell
.\test-tenant-modules-api.ps1
```

**Características:**
- Prueba todos los endpoints
- Interactivo (pide tenant ID)
- Output con colores
- Verificación de estados

### Bash (Linux/Mac)

```
test-tenant-modules-api.sh
```

**Uso:**
```bash
chmod +x test-tenant-modules-api.sh
./test-tenant-modules-api.sh
```

**Características:**
- Prueba todos los endpoints
- Interactivo (pide tenant ID)
- Output con colores
- Usa jq para formatear JSON

---

## 📚 Documentación por Tema

### 🎯 Por Caso de Uso

| Quiero... | Lee esto... |
|-----------|-------------|
| Empezar rápido | [QUICK_START_TENANT_ADMIN.md](QUICK_START_TENANT_ADMIN.md) |
| Entender todo | [TENANT_MODULES_ADMIN_README.md](TENANT_MODULES_ADMIN_README.md) |
| Ver ejemplos de código | [API_EXAMPLES.md](API_EXAMPLES.md) |
| Probar con scripts | [test-tenant-modules-api.ps1](test-tenant-modules-api.ps1) o [test-tenant-modules-api.sh](test-tenant-modules-api.sh) |
| Ver resumen | [TENANT_ADMIN_SUMMARY.md](TENANT_ADMIN_SUMMARY.md) |
| Usar la interfaz web | [tenant-modules-admin.html](tenant-modules-admin.html) |

### 🔧 Por Tecnología

| Tecnología | Archivo |
|------------|---------|
| HTML/JavaScript | [tenant-modules-admin.html](tenant-modules-admin.html) |
| NestJS | [admin-tenant-modules.controller.ts](src/api/rbac/controllers/admin-tenant-modules.controller.ts) |
| PowerShell | [test-tenant-modules-api.ps1](test-tenant-modules-api.ps1) |
| Bash | [test-tenant-modules-api.sh](test-tenant-modules-api.sh) |
| Python | [API_EXAMPLES.md#python](API_EXAMPLES.md) |
| Node.js | [API_EXAMPLES.md#nodejs](API_EXAMPLES.md) |
| React | [API_EXAMPLES.md#react](API_EXAMPLES.md) |

---

## 🎓 Tutoriales Paso a Paso

### Tutorial 1: Usar la Interfaz Web

1. Inicia el servidor:
   ```bash
   npm run start:dev
   ```

2. Abre `tenant-modules-admin.html` en tu navegador

3. Selecciona un tenant del dropdown

4. Haz clic en cualquier módulo para cambiar su estado

5. O usa los botones de acciones masivas

**Documentación:** [QUICK_START_TENANT_ADMIN.md](QUICK_START_TENANT_ADMIN.md)

### Tutorial 2: Usar Scripts de Prueba

**Windows (PowerShell):**
```powershell
.\test-tenant-modules-api.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x test-tenant-modules-api.sh
./test-tenant-modules-api.sh
```

**Documentación:** [TENANT_MODULES_ADMIN_README.md](TENANT_MODULES_ADMIN_README.md)

### Tutorial 3: Integrar en tu Código

1. Elige tu lenguaje en [API_EXAMPLES.md](API_EXAMPLES.md)
2. Copia el ejemplo
3. Reemplaza `your-tenant-id` y `your-module-id`
4. Ejecuta

**Documentación:** [API_EXAMPLES.md](API_EXAMPLES.md)

---

## 🔍 Referencia Rápida

### Endpoints API

```
GET    /admin/tenant-modules/tenants
GET    /admin/tenant-modules/modules
GET    /admin/tenant-modules/tenants/:tenantId/modules
POST   /admin/tenant-modules/tenants/:tenantId/modules/:moduleId/enable
POST   /admin/tenant-modules/tenants/:tenantId/modules/:moduleId/disable
POST   /admin/tenant-modules/tenants/:tenantId/modules/enable-all
POST   /admin/tenant-modules/tenants/:tenantId/modules/disable-all
```

### Ejemplos cURL

```bash
# Listar tenants
curl http://localhost:3001/admin/tenant-modules/tenants

# Ver módulos de un tenant
curl http://localhost:3001/admin/tenant-modules/tenants/TENANT_ID/modules

# Habilitar módulo
curl -X POST http://localhost:3001/admin/tenant-modules/tenants/TENANT_ID/modules/MODULE_ID/enable

# Habilitar todos
curl -X POST http://localhost:3001/admin/tenant-modules/tenants/TENANT_ID/modules/enable-all
```

---

## ⚠️ Importante

### Seguridad

**Esta herramienta NO tiene:**
- ❌ Autenticación
- ❌ Autorización
- ❌ Validación de permisos

**Solo para:**
- ✅ Desarrollo local
- ✅ Uso temporal
- ✅ Testing

**NUNCA en producción**

### Limpieza

Cuando termines tu app de admin completa, elimina:

```bash
rm src/api/rbac/controllers/admin-tenant-modules.controller.ts
rm tenant-modules-admin.html
rm test-tenant-modules-api.sh
rm test-tenant-modules-api.ps1
rm TENANT_MODULES_ADMIN_README.md
rm QUICK_START_TENANT_ADMIN.md
rm TENANT_ADMIN_SUMMARY.md
rm API_EXAMPLES.md
rm INDEX_TENANT_ADMIN.md
```

Y edita `src/api/rbac/rbac.module.ts` para quitar el controlador.

**Documentación:** [TENANT_ADMIN_SUMMARY.md#limpieza](TENANT_ADMIN_SUMMARY.md)

---

## 🆘 Ayuda y Soporte

### Problemas Comunes

| Problema | Solución | Documentación |
|----------|----------|---------------|
| "Failed to fetch" | Verifica que el servidor esté en puerto 3001 | [TENANT_MODULES_ADMIN_README.md#troubleshooting](TENANT_MODULES_ADMIN_README.md) |
| No aparecen tenants | Verifica la base de datos | [TENANT_MODULES_ADMIN_README.md#troubleshooting](TENANT_MODULES_ADMIN_README.md) |
| Cambios no se reflejan | Recarga la página (F5) | [QUICK_START_TENANT_ADMIN.md#tips](QUICK_START_TENANT_ADMIN.md) |

### Debugging

1. **Logs del servidor:**
   ```bash
   # Terminal donde corre npm run start:dev
   ```

2. **Consola del navegador:**
   ```
   F12 → Console
   ```

3. **Network tab:**
   ```
   F12 → Network → Ver peticiones HTTP
   ```

**Documentación:** [TENANT_MODULES_ADMIN_README.md#troubleshooting](TENANT_MODULES_ADMIN_README.md)

---

## 📊 Estructura de Archivos

```
proyecto/
├── src/
│   └── api/
│       └── rbac/
│           ├── controllers/
│           │   └── admin-tenant-modules.controller.ts  ← Backend
│           └── rbac.module.ts  ← Modificado
│
├── tenant-modules-admin.html  ← Frontend
│
├── test-tenant-modules-api.sh  ← Script Bash
├── test-tenant-modules-api.ps1  ← Script PowerShell
│
├── TENANT_MODULES_ADMIN_README.md  ← Docs completa
├── QUICK_START_TENANT_ADMIN.md  ← Inicio rápido
├── TENANT_ADMIN_SUMMARY.md  ← Resumen
├── API_EXAMPLES.md  ← Ejemplos código
└── INDEX_TENANT_ADMIN.md  ← Este archivo
```

---

## 🎯 Checklist de Uso

### Configuración Inicial
- [ ] Servidor corriendo (`npm run start:dev`)
- [ ] Puerto 3001 disponible
- [ ] Base de datos con tenants

### Primer Uso
- [ ] Leer [QUICK_START_TENANT_ADMIN.md](QUICK_START_TENANT_ADMIN.md)
- [ ] Abrir `tenant-modules-admin.html`
- [ ] Seleccionar un tenant
- [ ] Probar habilitar/deshabilitar un módulo

### Desarrollo
- [ ] Usar la interfaz web para gestión diaria
- [ ] Usar scripts para testing automatizado
- [ ] Consultar [API_EXAMPLES.md](API_EXAMPLES.md) para integración

### Limpieza Final
- [ ] Terminar app de admin completa
- [ ] Eliminar archivos temporales
- [ ] Editar `rbac.module.ts`
- [ ] Recompilar proyecto

---

## 📞 Contacto y Contribuciones

Esta es una herramienta temporal para desarrollo local. No está diseñada para producción ni para contribuciones externas.

---

## 📝 Notas de Versión

### v1.0.0 (Actual)
- ✅ Controlador NestJS sin autenticación
- ✅ Interfaz HTML standalone
- ✅ Scripts de prueba (PowerShell y Bash)
- ✅ Documentación completa
- ✅ Ejemplos en múltiples lenguajes

---

## 🎉 ¡Listo para Usar!

**Inicio rápido:**
```bash
npm run start:dev
# Abre tenant-modules-admin.html
```

**Documentación completa:**
- [QUICK_START_TENANT_ADMIN.md](QUICK_START_TENANT_ADMIN.md) - Empieza aquí
- [TENANT_MODULES_ADMIN_README.md](TENANT_MODULES_ADMIN_README.md) - Guía completa
- [API_EXAMPLES.md](API_EXAMPLES.md) - Ejemplos de código

---

**Última actualización:** $(date)
**Versión:** 1.0.0
**Estado:** Temporal - Solo desarrollo local
