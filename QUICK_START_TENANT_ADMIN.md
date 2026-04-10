# 🚀 Quick Start - Tenant Modules Admin

## Inicio Rápido (3 pasos)

### 1️⃣ Inicia el servidor backend
```bash
npm run start:dev
```

### 2️⃣ Inicia el servidor HTTP para el HTML

**Opción A - Script Automático (Recomendado):**
```bash
# Windows
.\start-admin-ui.ps1

# Linux/Mac
chmod +x start-admin-ui.sh
./start-admin-ui.sh
```

**Opción B - Manual con Python:**
```bash
python -m http.server 8000
```

**Opción C - Manual con Node.js:**
```bash
npm install -g http-server
http-server -p 8000
```

### 3️⃣ Abre en tu navegador
```
http://localhost:8000/tenant-modules-admin.html
```

### ⚠️ Nota sobre CORS
No puedes abrir el HTML directamente (doble clic) porque los navegadores bloquean peticiones desde `file://` a `http://`. Debes usar un servidor HTTP local.

Ver: **[SOLUCION_CORS.md](SOLUCION_CORS.md)** para más detalles.
- Selecciona un tenant
- Haz clic en los módulos para habilitar/deshabilitar
- O usa los botones de acciones masivas

---

## 📸 Vista Previa

```
┌─────────────────────────────────────────┐
│  🔧 Tenant Modules Admin                │
│  Administración temporal de módulos     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Seleccionar Tenant                      │
│ [Maderia Zona Norte ▼]  [🔄 Recargar]  │
└─────────────────────────────────────────┘

┌───────┬───────────┬─────────────┐
│  15   │    12     │      3      │
│ Total │ Habilitados│ Deshabilitados│
└───────┴───────────┴─────────────┘

[✅ Habilitar Todos] [❌ Deshabilitar Todos]

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Customers    │ │ Leads        │ │ Contracts    │
│ customers    │ │ leads        │ │ contracts    │
│ ✅ ACTIVO    │ │ ✅ ACTIVO    │ │ ⚪ INACTIVO  │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔌 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/tenant-modules/tenants` | Lista todos los tenants |
| GET | `/api/admin/tenant-modules/modules` | Lista todos los módulos |
| GET | `/api/admin/tenant-modules/tenants/:id/modules` | Módulos de un tenant |
| POST | `/api/admin/tenant-modules/tenants/:id/modules/:mid/enable` | Habilitar módulo |
| POST | `/api/admin/tenant-modules/tenants/:id/modules/:mid/disable` | Deshabilitar módulo |
| POST | `/api/admin/tenant-modules/tenants/:id/modules/enable-all` | Habilitar todos |
| POST | `/api/admin/tenant-modules/tenants/:id/modules/disable-all` | Deshabilitar todos |

---

## 🧪 Probar con Scripts

### PowerShell (Windows)
```powershell
.\test-tenant-modules-api.ps1
```

### Bash (Linux/Mac)
```bash
chmod +x test-tenant-modules-api.sh
./test-tenant-modules-api.sh
```

---

## 🗑️ Eliminar Cuando Termines

```bash
# Archivos a eliminar
rm src/api/rbac/controllers/admin-tenant-modules.controller.ts
rm tenant-modules-admin.html
rm test-tenant-modules-api.sh
rm test-tenant-modules-api.ps1
rm TENANT_MODULES_ADMIN_README.md
rm QUICK_START_TENANT_ADMIN.md

# Editar src/api/rbac/rbac.module.ts
# - Quitar import de AdminTenantModulesController
# - Quitar del array de controllers
```

---

## ⚠️ Importante

- ❌ NO tiene autenticación
- ❌ NO usar en producción
- ✅ Solo para desarrollo local
- ✅ Temporal hasta que termines tu app de admin

---

## 💡 Tips

1. **Ver logs del servidor**: Útil para debugging
   ```bash
   # Los logs aparecen en la terminal donde corriste npm run start:dev
   ```

2. **Ver errores del HTML**: Abre DevTools (F12) → Console

3. **Refrescar datos**: Usa el botón "🔄 Recargar" si los datos no se actualizan

4. **Probar con cURL**:
   ```bash
   # Listar tenants
   curl http://localhost:3001/api/admin/tenant-modules/tenants
   
   # Habilitar módulo
   curl -X POST http://localhost:3001/api/admin/tenant-modules/tenants/TENANT_ID/modules/MODULE_ID/enable
   ```

---

## 🆘 Problemas Comunes

### "Failed to fetch"
→ Verifica que el servidor esté corriendo en puerto 3001

### No aparecen tenants
→ Verifica que tengas tenants en la base de datos

### Cambios no se reflejan
→ Recarga la página del navegador (F5)

---

## 📚 Documentación Completa

Ver: `TENANT_MODULES_ADMIN_README.md`
