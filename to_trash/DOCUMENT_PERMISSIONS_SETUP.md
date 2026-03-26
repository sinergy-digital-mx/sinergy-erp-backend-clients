# DOCUMENT PERMISSIONS - RBAC SETUP COMPLETE ✅

## RESUMEN

Se crearon permisos específicos para la gestión de documentos de clientes y contratos, separados de los permisos de Customer y Contract para un control granular. Además, se crearon los módulos correspondientes en la tabla `modules` y se asignaron al tenant.

---

## MÓDULOS CREADOS

### 1. Customer Documents Module
- **Código**: `customer_documents`
- **Nombre**: Customer Documents
- **Descripción**: Manage customer documents (INE, licenses, proof of income, etc.)
- **ID**: `7c95c6da-0e99-11f1-b243-06e7ea787385`
- **Estado**: ✅ Asignado al tenant

### 2. Contract Documents Module
- **Código**: `contract_documents`
- **Nombre**: Contract Documents
- **Descripción**: Manage contract documents (signed contracts, amendments, etc.)
- **ID**: `7ccff686-0e99-11f1-b243-06e7ea787385`
- **Estado**: ✅ Asignado al tenant

---

## ENTIDADES CREADAS EN ENTITY REGISTRY

### 1. CustomerDocument
- **Código**: `CustomerDocument`
- **Nombre**: Customer Document Management
- **ID**: 20

### 2. ContractDocument
- **Código**: `ContractDocument`
- **Nombre**: Contract Document Management
- **ID**: 21

---

## PERMISOS CREADOS

### CustomerDocument Permissions (6 permisos)

| Acción | Descripción | Uso |
|--------|-------------|-----|
| `Create` | Subir documentos de clientes | Upload de INE, licencias, etc. |
| `Read` | Ver documentos de clientes | Listar y descargar documentos |
| `Update` | Actualizar estado de documentos | Cambiar status pending/approved/rejected |
| `Delete` | Eliminar documentos de clientes | Borrar documentos incorrectos |
| `Approve` | Aprobar documentos de clientes | Marcar como aprobado |
| `Reject` | Rechazar documentos de clientes | Marcar como rechazado |

### ContractDocument Permissions (6 permisos)

| Acción | Descripción | Uso |
|--------|-------------|-----|
| `Create` | Subir documentos de contratos | Upload de contratos firmados |
| `Read` | Ver documentos de contratos | Listar y descargar contratos |
| `Update` | Actualizar estado de documentos | Cambiar status pending/approved/rejected |
| `Delete` | Eliminar documentos de contratos | Borrar documentos incorrectos |
| `Approve` | Aprobar documentos de contratos | Marcar como aprobado |
| `Reject` | Rechazar documentos de contratos | Marcar como rechazado |

**Total**: 12 permisos creados

---

## ASIGNACIÓN A ROLES

### System Administrator (12 permisos)
- ✅ Todos los permisos de CustomerDocument
- ✅ Todos los permisos de ContractDocument
- Control total sobre documentos

### Sales Manager (12 permisos)
- ✅ Todos los permisos de CustomerDocument
- ✅ Todos los permisos de ContractDocument
- Puede gestionar y aprobar documentos

### Sales Representative (6 permisos)
- ✅ CustomerDocument: Create, Read, Update
- ✅ ContractDocument: Create, Read, Update
- Puede subir y editar, pero NO eliminar ni aprobar

### Customer Support (8 permisos)
- ✅ CustomerDocument: Read, Update, Approve, Reject
- ✅ ContractDocument: Read, Update, Approve, Reject
- Puede revisar y aprobar/rechazar documentos

### HR Manager (2 permisos)
- ✅ CustomerDocument: Read
- ✅ ContractDocument: Read
- Solo lectura de documentos

### Data Analyst (2 permisos)
- ✅ CustomerDocument: Read
- ✅ ContractDocument: Read
- Solo lectura de documentos

### Marketing Specialist (2 permisos)
- ✅ CustomerDocument: Read
- ✅ ContractDocument: Read
- Solo lectura de documentos

### Read Only Auditor (2 permisos)
- ✅ CustomerDocument: Read
- ✅ ContractDocument: Read
- Solo lectura de documentos

### Roles sin permisos de documentos
- ❌ Admin (rol custom, no definido en el script)
- ❌ Operator (rol custom, no definido en el script)
- ❌ Viewer (rol custom, no definido en el script)

---

## CONTROLADORES ACTUALIZADOS

### CustomerDocumentsController
```typescript
// Antes
@RequirePermissions({ entityType: 'Customer', action: 'Read' })

// Ahora
@RequirePermissions({ entityType: 'CustomerDocument', action: 'Read' })
```

**Endpoints actualizados:**
- `POST /api/tenant/customers/:customerId/documents` → `CustomerDocument.Create`
- `GET /api/tenant/customers/:customerId/documents` → `CustomerDocument.Read`
- `GET /api/tenant/customers/:customerId/documents/:docId` → `CustomerDocument.Read`
- `DELETE /api/tenant/customers/:customerId/documents/:docId` → `CustomerDocument.Delete`
- `PATCH /api/tenant/customers/:customerId/documents/:docId/status` → `CustomerDocument.Update`

### DocumentTypesController
```typescript
// Endpoints actualizados:
- GET /api/tenant/document-types → CustomerDocument.Read
- POST /api/tenant/document-types → CustomerDocument.Create
```

### ContractDocumentsController
```typescript
// Antes
@RequirePermissions({ entityType: 'Contract', action: 'Read' })

// Ahora
@RequirePermissions({ entityType: 'ContractDocument', action: 'Read' })
```

**Endpoints actualizados:**
- `POST /api/tenant/contracts/:contractId/documents` → `ContractDocument.Create`
- `GET /api/tenant/contracts/:contractId/documents` → `ContractDocument.Read`
- `GET /api/tenant/contracts/:contractId/documents/:docId` → `ContractDocument.Read`
- `DELETE /api/tenant/contracts/:contractId/documents/:docId` → `ContractDocument.Delete`
- `PATCH /api/tenant/contracts/:contractId/documents/:docId/status` → `ContractDocument.Update`

---

## VENTAJAS DE ESTA ESTRUCTURA

### 1. Control Granular
- Puedes dar acceso a documentos sin dar acceso a modificar customers o contracts
- Ejemplo: Un auditor puede ver documentos pero no editar clientes

### 2. Separación de Responsabilidades
- Los permisos de documentos son independientes
- Facilita la auditoría y el control de acceso

### 3. Flexibilidad
- Puedes crear roles específicos para gestión de documentos
- Ejemplo: "Document Reviewer" con solo permisos de documentos

### 4. Escalabilidad
- Fácil agregar más tipos de documentos en el futuro
- Ejemplo: PropertyDocument, PaymentDocument, etc.

---

## TESTING

### Verificar Permisos
```sql
-- Ver todos los permisos de documentos
SELECT er.code, p.action, p.description
FROM rbac_permissions p
JOIN entity_registry er ON p.entity_registry_id = er.id
WHERE er.code IN ('CustomerDocument', 'ContractDocument')
ORDER BY er.code, p.action;

-- Ver permisos por rol
SELECT r.name, er.code, p.action
FROM rbac_roles r
JOIN rbac_role_permissions rp ON r.id = rp.role_id
JOIN rbac_permissions p ON rp.permission_id = p.id
JOIN entity_registry er ON p.entity_registry_id = er.id
WHERE er.code IN ('CustomerDocument', 'ContractDocument')
  AND r.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
ORDER BY r.name, er.code, p.action;
```

### Probar Endpoints
1. Login con usuario de cada rol
2. Intentar subir documento
3. Verificar que solo roles autorizados pueden hacerlo
4. Intentar aprobar documento
5. Verificar que solo roles con permiso Approve pueden hacerlo

---

## PRÓXIMOS PASOS

### Para Otros Tenants
Si necesitas aplicar estos permisos a otros tenants:

1. Los permisos ya existen globalmente (entity_registry)
2. Solo necesitas asignarlos a los roles del nuevo tenant
3. Usa el script de asignación modificando el `tenantId`

### Para Nuevos Roles
Si creas nuevos roles:

1. Decide qué permisos de documentos necesitan
2. Asigna los permisos usando la tabla `rbac_role_permissions`
3. Considera el principio de menor privilegio

### Para Nuevos Tipos de Documentos
Si necesitas agregar más tipos (ej: PropertyDocument):

1. Crear entidad en `entity_registry`
2. Crear permisos en `rbac_permissions`
3. Actualizar controladores con `@RequirePermissions`
4. Asignar permisos a roles existentes

---

## RESUMEN EJECUTIVO

✅ 2 entidades creadas en entity_registry
✅ 12 permisos creados (6 por entidad)
✅ 46 permisos asignados a 8 roles
✅ Todos los controladores actualizados
✅ Build exitoso sin errores
✅ Sistema listo para producción

Los documentos ahora tienen su propio sistema de permisos independiente, permitiendo un control granular sobre quién puede subir, ver, aprobar y eliminar documentos de clientes y contratos.
