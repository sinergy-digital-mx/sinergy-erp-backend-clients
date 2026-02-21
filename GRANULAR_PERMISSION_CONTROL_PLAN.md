# Plan de Control Granular de Permisos por Tenant

## 📋 Resumen Ejecutivo

Actualmente el sistema permite a los tenants habilitar/deshabilitar módulos completos, pero no controla qué permisos específicos dentro de cada módulo pueden asignar a sus roles. Este documento describe cómo implementar control granular de permisos para diferentes planes de suscripción y políticas de seguridad.

## 🎯 Objetivo

Permitir que el sistema controle qué permisos específicos puede asignar cada tenant a sus roles, independientemente de los módulos habilitados.

## 💼 Casos de Uso

### Planes de Suscripción
- **Plan Básico**: Solo permisos de lectura y creación
- **Plan Profesional**: Incluye actualización y algunos permisos de eliminación
- **Plan Enterprise**: Acceso completo incluyendo exportación y administración

### Políticas de Seguridad
- **Tenants Nuevos**: Restricciones adicionales hasta completar onboarding
- **Tenants en Prueba**: Sin permisos de eliminación o exportación
- **Compliance**: Restricciones específicas por industria o regulación

### Ejemplos Prácticos
```
Tenant "StartupCorp" (Plan Básico):
✅ Lead.Read, Lead.Create, Lead.Update
❌ Lead.Delete, Lead.Export, Lead.BulkDelete

Tenant "EnterpriseCorp" (Plan Enterprise):
✅ Todos los permisos disponibles

Tenant "HealthcareCorp" (Compliance HIPAA):
✅ Permisos estándar
❌ Lead.Export (por regulaciones de privacidad)
```

## 🏗️ Arquitectura Propuesta

### 1. Nueva Tabla: `rbac_tenant_permission_restrictions`

```sql
CREATE TABLE rbac_tenant_permission_restrictions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    is_allowed BOOLEAN NOT NULL DEFAULT true,
    restriction_reason ENUM('plan_limitation', 'security_policy', 'compliance', 'custom') NOT NULL,
    restriction_details TEXT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES rbac_tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES rbac_permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_tenant_permission (tenant_id, permission_id),
    INDEX idx_tenant_restrictions (tenant_id),
    INDEX idx_permission_restrictions (permission_id)
);
```

### 2. Nueva Tabla: `rbac_subscription_plans`

```sql
CREATE TABLE rbac_subscription_plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Datos iniciales
INSERT INTO rbac_subscription_plans (id, name, code, description) VALUES
(UUID(), 'Basic Plan', 'basic', 'Basic functionality with read/create permissions'),
(UUID(), 'Professional Plan', 'professional', 'Includes update and limited delete permissions'),
(UUID(), 'Enterprise Plan', 'enterprise', 'Full access to all permissions');
```

### 3. Nueva Tabla: `rbac_plan_permission_templates`

```sql
CREATE TABLE rbac_plan_permission_templates (
    id VARCHAR(36) PRIMARY KEY,
    plan_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    is_allowed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plan_id) REFERENCES rbac_subscription_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES rbac_permissions(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_plan_permission (plan_id, permission_id),
    INDEX idx_plan_templates (plan_id)
);
```

### 4. Modificar Tabla: `rbac_tenants`

```sql
ALTER TABLE rbac_tenants 
ADD COLUMN subscription_plan_id VARCHAR(36) NULL,
ADD FOREIGN KEY (subscription_plan_id) REFERENCES rbac_subscription_plans(id) ON DELETE SET NULL;
```

## 🔧 Implementación Backend

### 1. Nuevas Entidades

#### `SubscriptionPlan` Entity
```typescript
@Entity('rbac_subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => PlanPermissionTemplate, template => template.plan)
  permissionTemplates: PlanPermissionTemplate[];

  @OneToMany(() => RBACTenant, tenant => tenant.subscriptionPlan)
  tenants: RBACTenant[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

#### `TenantPermissionRestriction` Entity
```typescript
@Entity('rbac_tenant_permission_restrictions')
export class TenantPermissionRestriction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  permission_id: string;

  @Column({ default: true })
  is_allowed: boolean;

  @Column({
    type: 'enum',
    enum: ['plan_limitation', 'security_policy', 'compliance', 'custom']
  })
  restriction_reason: string;

  @Column({ type: 'text', nullable: true })
  restriction_details: string;

  @Column({ nullable: true })
  created_by: string;

  @ManyToOne(() => RBACTenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### 2. Nuevo Servicio: `TenantPermissionService`

```typescript
@Injectable()
export class TenantPermissionService {
  constructor(
    @InjectRepository(TenantPermissionRestriction)
    private restrictionRepo: Repository<TenantPermissionRestriction>,
    @InjectRepository(SubscriptionPlan)
    private planRepo: Repository<SubscriptionPlan>,
  ) {}

  // Obtener permisos permitidos para un tenant
  async getAllowedPermissionsForTenant(tenantId: string): Promise<Permission[]> {
    // 1. Obtener plan del tenant
    // 2. Obtener template de permisos del plan
    // 3. Aplicar restricciones específicas del tenant
    // 4. Retornar lista filtrada
  }

  // Validar si un tenant puede asignar un permiso
  async canTenantAssignPermission(tenantId: string, permissionId: string): Promise<boolean> {
    // Lógica de validación
  }

  // Aplicar restricciones de plan a un tenant
  async applyPlanRestrictionsToTenant(tenantId: string, planId: string): Promise<void> {
    // Aplicar template del plan al tenant
  }

  // Agregar restricción personalizada
  async addCustomRestriction(
    tenantId: string, 
    permissionId: string, 
    reason: string, 
    details?: string
  ): Promise<void> {
    // Agregar restricción específica
  }
}
```

### 3. Modificar `RoleService`

```typescript
// En role.service.ts
async getAvailablePermissionsForTenant(tenantId: string): Promise<any> {
  // 1. Obtener módulos habilitados (lógica actual)
  const enabledModules = await this.getEnabledModulesForTenant(tenantId);
  
  // 2. Obtener permisos permitidos para el tenant (NUEVO)
  const allowedPermissions = await this.tenantPermissionService
    .getAllowedPermissionsForTenant(tenantId);
  
  // 3. Filtrar permisos por módulos habilitados Y permisos permitidos
  const filteredPermissions = allPermissions.filter(permission => {
    const isModuleEnabled = enabledModuleIds.includes(permission.module_id);
    const isPermissionAllowed = allowedPermissions.some(ap => ap.id === permission.id);
    return isModuleEnabled && isPermissionAllowed;
  });

  // 4. Agrupar y retornar
  return this.groupPermissionsByModule(filteredPermissions);
}

// Validación al asignar permisos
async assignPermissionToRole(roleId: string, permissionId: string, tenantId: string): Promise<void> {
  // Validar que el tenant puede asignar este permiso
  const canAssign = await this.tenantPermissionService
    .canTenantAssignPermission(tenantId, permissionId);
  
  if (!canAssign) {
    throw new ForbiddenException('Tenant cannot assign this permission');
  }

  // Lógica actual de asignación
  // ...
}
```

## 🌐 Nuevos Endpoints

### 1. Gestión de Planes (Admin)

```typescript
// GET /admin/subscription-plans
// POST /admin/subscription-plans
// PUT /admin/subscription-plans/:planId
// DELETE /admin/subscription-plans/:planId

// GET /admin/subscription-plans/:planId/permissions
// PUT /admin/subscription-plans/:planId/permissions
```

### 2. Gestión de Restricciones por Tenant (Admin)

```typescript
// GET /admin/tenants/:tenantId/permission-restrictions
// POST /admin/tenants/:tenantId/permission-restrictions
// DELETE /admin/tenants/:tenantId/permission-restrictions/:restrictionId

// POST /admin/tenants/:tenantId/apply-plan/:planId
```

### 3. Información para Tenants

```typescript
// GET /tenant/permissions/restrictions
// Retorna qué permisos están restringidos y por qué

// GET /tenant/subscription/plan
// Información del plan actual del tenant
```

## 📱 Cambios en Frontend

### 1. Vista de Permisos de Rol (Tenant)

**Modificaciones necesarias:**
- Mostrar permisos disponibles filtrados por restricciones
- Indicar visualmente permisos restringidos con tooltips explicativos
- Mostrar razón de restricción (plan, política, compliance)

**Ejemplo visual:**
```
📦 Leads Module
├── ☑️ Lead.Read - View leads
├── ☑️ Lead.Create - Create leads  
├── ☐ Lead.Update - Update leads
├── 🚫 Lead.Delete - Delete leads (Restricted: Plan limitation)
└── 🚫 Lead.Export - Export leads (Restricted: Plan limitation)
```

### 2. Nueva Vista: Información de Plan (Tenant)

**Contenido:**
- Plan actual del tenant
- Lista de permisos incluidos en el plan
- Lista de permisos restringidos con razones
- Opción de upgrade (si aplica)

### 3. Panel Administrativo (Super Admin)

**Nuevas vistas:**
- Gestión de planes de suscripción
- Asignación de planes a tenants
- Gestión de restricciones personalizadas
- Dashboard de uso de permisos por plan

## 🗃️ Scripts de Migración

### 1. Crear Tablas
```sql
-- Ejecutar las queries de creación de tablas mencionadas arriba
```

### 2. Migrar Tenants Existentes
```typescript
// Script para asignar plan por defecto a tenants existentes
async function migrateTenantsToPlan() {
  const basicPlan = await planRepo.findOne({ where: { code: 'basic' } });
  const tenants = await tenantRepo.find();
  
  for (const tenant of tenants) {
    tenant.subscription_plan_id = basicPlan.id;
    await tenantRepo.save(tenant);
  }
}
```

### 3. Crear Templates de Planes
```typescript
// Script para definir qué permisos incluye cada plan
async function createPlanTemplates() {
  const basicPlan = await planRepo.findOne({ where: { code: 'basic' } });
  const readPermissions = await permissionRepo.find({ 
    where: { action: In(['Read', 'Create']) } 
  });
  
  // Crear templates para plan básico
  for (const permission of readPermissions) {
    await planTemplateRepo.save({
      plan_id: basicPlan.id,
      permission_id: permission.id,
      is_allowed: true
    });
  }
}
```

## 📊 Métricas y Monitoreo

### KPIs a Trackear
- Uso de permisos por plan
- Intentos de asignación de permisos restringidos
- Distribución de tenants por plan
- Permisos más solicitados por plan

### Logs de Auditoría
- Cambios en restricciones de permisos
- Asignaciones de permisos bloqueadas
- Cambios de plan de tenants
- Creación/modificación de templates de plan

## 🚀 Plan de Implementación

### Fase 1: Infraestructura Base (2-3 días)
1. Crear entidades y migraciones
2. Implementar servicios básicos
3. Crear endpoints administrativos
4. Scripts de migración de datos existentes

### Fase 2: Lógica de Negocio (3-4 días)
1. Implementar filtrado de permisos por restricciones
2. Validaciones en asignación de permisos
3. Aplicación automática de templates de plan
4. Testing de lógica de restricciones

### Fase 3: Frontend (4-5 días)
1. Modificar vista de permisos de rol
2. Crear vista de información de plan
3. Panel administrativo para gestión de planes
4. Indicadores visuales de restricciones

### Fase 4: Testing y Refinamiento (2-3 días)
1. Testing end-to-end
2. Validación con diferentes escenarios
3. Optimización de performance
4. Documentación final

## ⚠️ Consideraciones Importantes

### Compatibilidad
- Mantener compatibilidad con sistema actual
- Migración gradual sin interrumpir servicio
- Fallback a comportamiento actual si hay errores

### Performance
- Cachear restricciones de permisos por tenant
- Optimizar queries con índices apropiados
- Considerar Redis para cache de permisos frecuentes

### Seguridad
- Validar restricciones tanto en frontend como backend
- Logs de auditoría para cambios críticos
- Principio de menor privilegio por defecto

### UX
- Explicaciones claras de por qué permisos están restringidos
- Sugerencias de upgrade cuando sea apropiado
- No frustrar al usuario con restricciones sin contexto

## 📚 Documentación Adicional

### Para Desarrolladores
- Guía de implementación de nuevas restricciones
- API documentation para endpoints de restricciones
- Ejemplos de uso del TenantPermissionService

### Para Administradores
- Manual de gestión de planes
- Guía de asignación de restricciones personalizadas
- Troubleshooting de problemas de permisos

### Para Usuarios Finales
- Explicación de planes y sus limitaciones
- FAQ sobre permisos restringidos
- Proceso de solicitud de permisos adicionales

---

**Nota**: Este documento debe revisarse y actualizarse conforme evolucionen los requerimientos del negocio y la arquitectura del sistema.