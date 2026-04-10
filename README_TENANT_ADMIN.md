# 🔧 Tenant Modules Admin Tool

> Herramienta temporal para administrar módulos de tenants durante el desarrollo

[![Status](https://img.shields.io/badge/status-development%20only-orange)]()
[![Security](https://img.shields.io/badge/security-no%20auth-red)]()
[![License](https://img.shields.io/badge/license-temporary-yellow)]()

---

## 🎯 ¿Qué es esto?

Una herramienta temporal y sencilla para administrar qué módulos están habilitados para cada tenant mientras desarrollas tu aplicación de administración completa.

**Incluye:**
- 🌐 Interfaz web HTML standalone (sin dependencias)
- 🔌 API REST sin autenticación (solo desarrollo)
- 🧪 Scripts de prueba automatizados
- 📚 Documentación completa

---

## ⚡ Inicio Rápido (30 segundos)

```bash
# 1. Inicia el servidor
npm run start:dev

# 2. Abre en tu navegador
tenant-modules-admin.html
```

**¡Listo!** Ahora puedes:
- ✅ Ver todos tus tenants
- ✅ Habilitar/deshabilitar módulos con un clic
- ✅ Acciones masivas (habilitar/deshabilitar todos)

---

## 📸 Vista Previa

![Tenant Admin Interface](https://via.placeholder.com/800x400/667eea/ffffff?text=Tenant+Modules+Admin+Interface)

**Características:**
- 🎨 Diseño moderno con gradientes
- 📊 Estadísticas en tiempo real
- 🎯 Toggle de módulos con un clic
- ⚡ Acciones masivas
- 📱 Responsive design

---

## 📚 Documentación

### 🚀 Para Empezar

| Documento | Descripción | Tiempo |
|-----------|-------------|--------|
| **[QUICK_START_TENANT_ADMIN.md](QUICK_START_TENANT_ADMIN.md)** | Guía de inicio rápido | 2 min |
| **[tenant-modules-admin.html](tenant-modules-admin.html)** | Interfaz web | 0 min |

### 📖 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| **[INDEX_TENANT_ADMIN.md](INDEX_TENANT_ADMIN.md)** | Índice de toda la documentación |
| **[TENANT_MODULES_ADMIN_README.md](TENANT_MODULES_ADMIN_README.md)** | Guía completa y detallada |
| **[TENANT_ADMIN_SUMMARY.md](TENANT_ADMIN_SUMMARY.md)** | Resumen ejecutivo |
| **[API_EXAMPLES.md](API_EXAMPLES.md)** | Ejemplos en múltiples lenguajes |

### 🧪 Scripts de Prueba

| Script | Plataforma | Uso |
|--------|-----------|-----|
| **[test-tenant-modules-api.ps1](test-tenant-modules-api.ps1)** | Windows | `.\test-tenant-modules-api.ps1` |
| **[test-tenant-modules-api.sh](test-tenant-modules-api.sh)** | Linux/Mac | `./test-tenant-modules-api.sh` |

---

## 🔌 API Endpoints

```
Base URL: http://localhost:3001/admin/tenant-modules
```

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/tenants` | Lista todos los tenants |
| `GET` | `/modules` | Lista todos los módulos |
| `GET` | `/tenants/:id/modules` | Módulos de un tenant |
| `POST` | `/tenants/:id/modules/:mid/enable` | Habilitar módulo |
| `POST` | `/tenants/:id/modules/:mid/disable` | Deshabilitar módulo |
| `POST` | `/tenants/:id/modules/enable-all` | Habilitar todos |
| `POST` | `/tenants/:id/modules/disable-all` | Deshabilitar todos |

**Ejemplo:**
```bash
curl http://localhost:3001/admin/tenant-modules/tenants
```

---

## 💻 Ejemplos de Uso

### JavaScript (Fetch)
```javascript
fetch('http://localhost:3001/admin/tenant-modules/tenants')
  .then(res => res.json())
  .then(data => console.log(data.tenants));
```

### Python
```python
import requests
response = requests.get('http://localhost:3001/admin/tenant-modules/tenants')
print(response.json()['tenants'])
```

### PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/admin/tenant-modules/tenants"
```

### cURL
```bash
curl http://localhost:3001/admin/tenant-modules/tenants
```

**Más ejemplos:** [API_EXAMPLES.md](API_EXAMPLES.md)

---

## 🎨 Características

### Interfaz Web
- ✅ Diseño moderno y responsive
- ✅ Selección de tenant con dropdown
- ✅ Vista de módulos en cuadrícula
- ✅ Toggle individual con un clic
- ✅ Acciones masivas (habilitar/deshabilitar todos)
- ✅ Estadísticas en tiempo real
- ✅ Indicadores visuales de estado
- ✅ Confirmaciones antes de acciones críticas

### API Backend
- ✅ Endpoints RESTful
- ✅ Sin autenticación (temporal)
- ✅ Respuestas JSON
- ✅ Manejo de errores
- ✅ Integración con servicios existentes

### Scripts de Prueba
- ✅ Prueba todos los endpoints
- ✅ Interactivos (piden input)
- ✅ Output con colores
- ✅ Verificación de estados

---

## 📁 Archivos Creados

```
proyecto/
├── src/api/rbac/controllers/
│   └── admin-tenant-modules.controller.ts  ← Backend NestJS
│
├── tenant-modules-admin.html  ← Interfaz web
│
├── test-tenant-modules-api.sh  ← Script Bash
├── test-tenant-modules-api.ps1  ← Script PowerShell
│
├── TENANT_MODULES_ADMIN_README.md  ← Docs completa
├── QUICK_START_TENANT_ADMIN.md  ← Inicio rápido
├── TENANT_ADMIN_SUMMARY.md  ← Resumen
├── API_EXAMPLES.md  ← Ejemplos
├── INDEX_TENANT_ADMIN.md  ← Índice
└── README_TENANT_ADMIN.md  ← Este archivo
```

---

## ⚠️ Importante - Seguridad

### ❌ Esta herramienta NO tiene:
- Autenticación (sin JWT)
- Autorización (sin guards)
- Validación de permisos
- Rate limiting
- CORS restrictivo

### ✅ Solo para:
- Desarrollo local
- Uso temporal
- Testing

### 🚫 NUNCA:
- Desplegar en producción
- Exponer públicamente
- Usar con datos sensibles

---

## 🗑️ Limpieza (Cuando Termines)

### 1. Eliminar Archivos
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
rm README_TENANT_ADMIN.md
```

### 2. Editar rbac.module.ts
```typescript
// Quitar import
import { AdminTenantModulesController } from './controllers/admin-tenant-modules.controller';

// Quitar del array de controllers
controllers: [
  TenantController,
  AuditLogController,
  DataCleanupController,
  ModulesController,
  RolesController,
  // AdminTenantModulesController,  ← ELIMINAR
],
```

### 3. Recompilar
```bash
npm run build
```

---

## 🆘 Troubleshooting

### "Failed to fetch"
**Causa:** Servidor no está corriendo o puerto incorrecto

**Solución:**
```bash
npm run start:dev
# Verifica que esté en puerto 3001
```

### No aparecen tenants
**Causa:** Base de datos vacía o sin conexión

**Solución:**
```bash
# Verifica la conexión a la base de datos
# Verifica que tengas tenants creados
```

### Cambios no se reflejan
**Causa:** Caché del navegador

**Solución:**
```
F5 (Recargar página)
Ctrl+Shift+R (Recarga forzada)
```

**Más ayuda:** [TENANT_MODULES_ADMIN_README.md#troubleshooting](TENANT_MODULES_ADMIN_README.md)

---

## 💡 Tips y Trucos

### 1. Ver Logs en Tiempo Real
```bash
npm run start:dev
# Los logs aparecen en esta terminal
```

### 2. Debugging del HTML
```
F12 → Console → Ver errores
F12 → Network → Ver peticiones HTTP
```

### 3. Probar Rápidamente
```bash
# Habilitar todos los módulos
curl -X POST http://localhost:3001/admin/tenant-modules/tenants/TENANT_ID/modules/enable-all
```

### 4. Ver Estado Actual
```bash
# Módulos habilitados de un tenant
curl http://localhost:3001/admin/tenant-modules/tenants/TENANT_ID/modules | jq '.modules[] | select(.isEnabled) | .name'
```

---

## 🎓 Tutoriales

### Tutorial 1: Primera Vez
1. Lee [QUICK_START_TENANT_ADMIN.md](QUICK_START_TENANT_ADMIN.md)
2. Inicia el servidor: `npm run start:dev`
3. Abre `tenant-modules-admin.html`
4. Selecciona un tenant
5. Haz clic en un módulo para cambiar su estado

### Tutorial 2: Usar Scripts
**Windows:**
```powershell
.\test-tenant-modules-api.ps1
```

**Linux/Mac:**
```bash
chmod +x test-tenant-modules-api.sh
./test-tenant-modules-api.sh
```

### Tutorial 3: Integrar en tu Código
1. Ve a [API_EXAMPLES.md](API_EXAMPLES.md)
2. Elige tu lenguaje
3. Copia el ejemplo
4. Adapta a tu caso de uso

---

## 📊 Estadísticas

- **Archivos creados:** 10
- **Endpoints API:** 7
- **Ejemplos de código:** 8+ lenguajes
- **Documentación:** 6 archivos
- **Scripts de prueba:** 2 (PowerShell + Bash)

---

## 🎯 Casos de Uso

### Caso 1: Habilitar Módulo de Inventario
```
1. Abre tenant-modules-admin.html
2. Selecciona "Maderia Zona Norte"
3. Busca tarjeta "Inventory"
4. Clic en la tarjeta
5. Confirma
✅ Módulo habilitado
```

### Caso 2: Habilitar Todos los Módulos
```
1. Abre tenant-modules-admin.html
2. Selecciona tenant
3. Clic en "✅ Habilitar Todos"
4. Confirma
✅ Todos los módulos habilitados
```

### Caso 3: Probar con Script
```bash
.\test-tenant-modules-api.ps1
# Sigue las instrucciones interactivas
```

---

## 🔗 Enlaces Rápidos

| Recurso | Enlace |
|---------|--------|
| 🚀 Inicio Rápido | [QUICK_START_TENANT_ADMIN.md](QUICK_START_TENANT_ADMIN.md) |
| 📖 Documentación Completa | [TENANT_MODULES_ADMIN_README.md](TENANT_MODULES_ADMIN_README.md) |
| 📚 Índice | [INDEX_TENANT_ADMIN.md](INDEX_TENANT_ADMIN.md) |
| 💻 Ejemplos de Código | [API_EXAMPLES.md](API_EXAMPLES.md) |
| 📊 Resumen | [TENANT_ADMIN_SUMMARY.md](TENANT_ADMIN_SUMMARY.md) |
| 🌐 Interfaz Web | [tenant-modules-admin.html](tenant-modules-admin.html) |

---

## 📝 Changelog

### v1.0.0 (Actual)
- ✅ Controlador NestJS sin autenticación
- ✅ Interfaz HTML standalone
- ✅ Scripts de prueba (PowerShell y Bash)
- ✅ Documentación completa
- ✅ Ejemplos en 8+ lenguajes
- ✅ Diseño moderno y responsive

---

## 🎉 ¡Listo para Usar!

```bash
# Paso 1: Inicia el servidor
npm run start:dev

# Paso 2: Abre en tu navegador
tenant-modules-admin.html

# ¡Eso es todo!
```

---

## 📞 Soporte

Esta es una herramienta temporal para desarrollo local. Para ayuda:

1. **Revisa la documentación:**
   - [QUICK_START_TENANT_ADMIN.md](QUICK_START_TENANT_ADMIN.md)
   - [TENANT_MODULES_ADMIN_README.md](TENANT_MODULES_ADMIN_README.md)

2. **Revisa los logs:**
   - Terminal del servidor
   - Consola del navegador (F12)

3. **Prueba los scripts:**
   - `test-tenant-modules-api.ps1` (Windows)
   - `test-tenant-modules-api.sh` (Linux/Mac)

---

**Versión:** 1.0.0  
**Estado:** Temporal - Solo desarrollo local  
**Última actualización:** 2024

---

**⚠️ Recuerda:** Esta herramienta es temporal. Elimínala cuando termines tu aplicación de administración completa.
