# 🔧 Fix: Error entity_registry_id

## ❌ Problema Original

Al actualizar un permiso, aparecía este error:
```
ER_NO_DEFAULT_FOR_FIELD: Field 'entity_registry_id' doesn't have a default value
```

## 🔍 Causa

La entidad `Permission` tiene una relación obligatoria con `EntityRegistry`:

```typescript
@Column()
entity_registry_id: number; // NOT NULL - requerido
```

Cuando usábamos `.save()` en TypeORM, intentaba crear un nuevo registro en lugar de actualizar el existente, y como no enviábamos `entity_registry_id`, fallaba.

## ✅ Solución Aplicada

### 1. Endpoint de Actualización (PUT)

Cambié de `.save()` a `.update()`:

```typescript
// ❌ ANTES (causaba el error)
const saved = await this.permissionRepository.save(permission);

// ✅ AHORA (funciona correctamente)
await this.permissionRepository.update(
  { id: permissionId },
  {
    action: permission.action,
    description: permission.description,
  }
);
```

**Por qué funciona:**
- `.update()` solo actualiza los campos especificados
- No intenta recrear el registro
- No requiere `entity_registry_id` porque no lo estamos tocando

### 2. Endpoint de Creación (POST)

Agregué la búsqueda del `entity_registry_id`:

```typescript
// Buscar el entity registry del módulo
const entityRegistry = await this.permissionRepository.manager
  .getRepository('EntityRegistry')
  .findOne({
    where: { code: module.code },
  });

// Crear el permiso con el entity_registry_id correcto
const permission = this.permissionRepository.create({
  module_id: moduleId,
  entity_registry_id: entityRegistry.id, // ← IMPORTANTE
  action: body.action,
  description: body.description,
  is_system_permission: false,
});
```

## 🧪 Cómo Probar

### Actualizar un Permiso

```bash
# 1. Obtener permisos de un módulo
curl http://localhost:3001/api/admin/tenant-modules/modules/MODULE_ID/permissions

# 2. Actualizar un permiso
curl -X PUT http://localhost:3001/api/admin/tenant-modules/permissions/PERMISSION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "action": "Download_Report_V2",
    "description": "Nueva descripción"
  }'

# ✅ Debería funcionar sin errores
```

### Crear un Permiso

```bash
curl -X POST http://localhost:3001/api/admin/tenant-modules/modules/MODULE_ID/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "Export_Data",
    "description": "Exportar datos"
  }'

# ✅ Debería crear el permiso correctamente
```

## 📋 Qué Cambió

### Archivo Modificado
- `src/api/rbac/controllers/admin-tenant-modules.controller.ts`

### Métodos Actualizados

1. **`updatePermission()`**
   - Cambió de `.save()` a `.update()`
   - Solo actualiza `action` y `description`
   - No toca `entity_registry_id`

2. **`createPermission()`**
   - Busca el `entity_registry` del módulo
   - Asigna el `entity_registry_id` correctamente
   - Valida que exista antes de crear

## 🔄 Reiniciar Backend

Para aplicar los cambios:

```bash
# Detener el servidor (Ctrl+C)
# Iniciar de nuevo
npm run start:dev
```

## ✅ Verificación

Después de reiniciar, prueba:

1. **Editar un permiso desde el HTML:**
   - Selecciona un módulo
   - Haz clic en "✏️ Editar" en un permiso
   - Cambia la descripción
   - Guarda
   - ✅ Debería funcionar sin errores

2. **Crear un permiso desde el HTML:**
   - Selecciona un módulo
   - Haz clic en "➕ Crear Permiso"
   - Acción: `Test_Permission`
   - Descripción: `Permiso de prueba`
   - Guarda
   - ✅ Debería crear correctamente

## 📝 Notas Técnicas

### entity_registry vs entity_type

- `entity_registry_id`: Campo real en la BD (número, NOT NULL)
- `entity_type`: Propiedad computada (string, derivada de entity_registry.code)

```typescript
// En la entidad Permission
get entity_type(): string {
  return this.entity_registry?.code || '';
}
```

### Por qué .update() vs .save()

- **`.save()`**: Puede crear o actualizar. Si el objeto no tiene todos los campos requeridos, falla.
- **`.update()`**: Solo actualiza campos específicos. No requiere todos los campos.

```typescript
// .save() - requiere TODOS los campos NOT NULL
await repo.save(permission); // ❌ Falla si falta entity_registry_id

// .update() - solo actualiza campos especificados
await repo.update({ id }, { action, description }); // ✅ Funciona
```

## 🎯 Resumen

**Problema:** Error al actualizar permisos por falta de `entity_registry_id`

**Solución:** 
- Usar `.update()` en lugar de `.save()` para actualizaciones
- Buscar y asignar `entity_registry_id` correctamente al crear

**Resultado:** Ahora puedes crear y editar permisos sin errores ✅

---

¡Fix aplicado! Reinicia el backend y prueba de nuevo. 🎉
