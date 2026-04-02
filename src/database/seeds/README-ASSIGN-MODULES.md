# Asignar Todos los Módulos a un Usuario

Este script asigna todos los módulos disponibles en el sistema a un usuario específico, convirtiéndolo en administrador con acceso completo.

## Configuración Actual

El script está configurado para:
- **Tenant ID**: `afff1757-dbcf-4715-a756-6b22bb2c59d5`
- **User ID**: `95acc142-ec8f-4928-96ba-f715431709c0`

## ¿Qué hace el script?

1. ✅ Verifica que el tenant y usuario existan
2. 👑 Crea o actualiza el rol "Admin" para el tenant
3. 🔗 Asigna el rol Admin al usuario
4. 📦 Habilita TODOS los módulos para el tenant
5. 🔑 Asigna TODOS los permisos al rol Admin

## Cómo ejecutar

```bash
npm run seed:assign-all-modules
```

## Modificar para otro usuario

Si necesitas asignar módulos a otro usuario, edita el archivo:
`src/database/seeds/assign-all-modules-to-user.ts`

Y cambia las constantes al inicio del archivo:

```typescript
const TENANT_ID = 'tu-tenant-id-aqui';
const USER_ID = 'tu-user-id-aqui';
```

## Resultado

Después de ejecutar el script, el usuario tendrá:
- ✅ Rol de Admin (is_admin: true)
- ✅ Acceso a todos los módulos del sistema
- ✅ Todos los permisos asignados (Create, Read, Update, Delete, etc.)

## Notas

- El script es idempotente: puedes ejecutarlo múltiples veces sin problemas
- No elimina permisos o módulos existentes, solo agrega los faltantes
- Si el usuario ya tiene el rol Admin, no lo duplica
- Si un módulo ya está habilitado, no lo modifica
