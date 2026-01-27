# Role-Based Access Control (RBAC) System

A comprehensive multi-tenant RBAC system built with NestJS and TypeORM, providing fine-grained access control with tenant isolation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        RBAC System                              │
├─────────────────────────────────────────────────────────────────┤
│  Controllers  │  Services  │  Guards  │  Decorators  │  Filters │
├─────────────────────────────────────────────────────────────────┤
│                     Core Components                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Tenant    │ │    User     │ │    Role     │ │ Permission  ││
│  │ Management  │ │ Management  │ │ Management  │ │ Management  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    Data Layer (TypeORM)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │rbac_tenants │ │    users    │ │ rbac_roles  │ │rbac_permissions││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │rbac_user_   │ │rbac_role_   │ │rbac_audit_  │                │
│  │   roles     │ │permissions  │ │    logs     │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## Core Features

- **Multi-tenant Architecture**: Complete tenant isolation with UUID-based identification
- **Role-based Permissions**: Hierarchical role system with granular permissions
- **Permission Caching**: Redis-based caching for high-performance permission checks
- **Audit Logging**: Comprehensive audit trail for all RBAC operations
- **Guard Integration**: Seamless integration with NestJS guards and decorators
- **Error Handling**: Robust error handling with custom exceptions
- **Data Cleanup**: Automated cleanup of orphaned data and expired sessions

## Quick Start

### 1. Setup RBAC System

```bash
# Complete RBAC setup (tenants, permissions, roles)
npm run rbac:simple-complete

# Create sample users with roles
npm run rbac:users create

# List users and their roles
npm run rbac:users list
```

### 2. Protect Routes

```typescript
import { RequirePermissions } from './rbac/decorators';
import { PermissionGuard } from './rbac/guards';

@Controller('customers')
@UseGuards(PermissionGuard)
export class CustomersController {
  
  @Get()
  @RequirePermissions('customers:read')
  findAll() {
    // Only users with 'customers:read' permission can access
  }

  @Post()
  @RequirePermissions('customers:create')
  create(@Body() dto: CreateCustomerDto) {
    // Only users with 'customers:create' permission can access
  }
}
```

### 3. Check Permissions in Services

```typescript
import { PermissionService } from './rbac/services';

@Injectable()
export class MyService {
  constructor(private permissionService: PermissionService) {}

  async someMethod(userId: string, tenantId: string) {
    const hasPermission = await this.permissionService.hasPermission(
      userId, 
      tenantId, 
      'customers:update'
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
```

## Entity Relationships

```
RBACTenant (1) ──────── (*) User
    │                      │
    │                      │
    └── (*) Role ──── (*) UserRole ──── (1) User
           │
           │
           └── (*) RolePermission ──── (1) Permission
```

## Available Permissions

The system includes 47 predefined permissions across 8 entity types:

- **Users**: `users:create`, `users:read`, `users:update`, `users:delete`, `users:list`, `users:manage_roles`
- **Customers**: `customers:create`, `customers:read`, `customers:update`, `customers:delete`, `customers:list`, `customers:export`
- **Leads**: `leads:create`, `leads:read`, `leads:update`, `leads:delete`, `leads:list`, `leads:convert`, `leads:assign`, `leads:export`
- **Reports**: `reports:view`, `reports:create`, `reports:export`, `reports:analytics`
- **System**: `system:settings`, `system:backup`, `system:maintenance`, `system:logs`, `system:integrations`
- **Audit**: `audit:view`, `audit:export`
- **Roles**: `roles:create`, `roles:read`, `roles:update`, `roles:delete`, `roles:assign`
- **Tenants**: `tenants:create`, `tenants:read`, `tenants:update`, `tenants:delete`, `tenants:settings`

## Predefined Roles

- **System Administrator**: Full system access (22 permissions)
- **Sales Manager**: Lead and customer management (12 permissions)
- **Sales Representative**: Basic sales operations (5 permissions)
- **Marketing Specialist**: Lead generation and campaigns (7 permissions)
- **Customer Support**: Customer service operations (7 permissions)
- **Data Analyst**: Reporting and analytics (13 permissions)
- **HR Manager**: User and role management (11 permissions)
- **Read Only Auditor**: Audit and compliance access (8 permissions)

## API Scripts

### RBAC Management
```bash
# Complete setup
npm run rbac:simple-complete

# Setup permissions only
npm run rbac:simple-setup
```

### User Management
```bash
# Create sample users
npm run rbac:users create [tenant-subdomain]

# List all users with roles
npm run rbac:users list

# Assign role to user
npm run rbac:users assign [tenant] [email] [role-name]
```

### Data Migration
```bash
# Migrate users to new tenant system
npm run rbac:migrate-users migrate

# Verify migration results
npm run rbac:migrate-users verify
```

## Configuration

### Environment Variables
```env
# Redis for caching (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_database
```

### Module Import
```typescript
import { RBACModule } from './rbac/rbac.module';

@Module({
  imports: [
    RBACModule, // Import RBAC module
    // ... other modules
  ],
})
export class AppModule {}
```

## Error Handling

The system provides comprehensive error handling:

- **RBACPermissionDeniedError**: Insufficient permissions
- **RBACTenantNotFoundError**: Invalid tenant
- **RBACRoleNotFoundError**: Role doesn't exist
- **RBACUserNotFoundError**: User doesn't exist
- **RBACInvalidOperationError**: Invalid operation

## Performance Features

- **Permission Caching**: Redis-based caching with TTL
- **Query Optimization**: Efficient database queries with proper indexing
- **Bulk Operations**: Support for bulk role and permission assignments
- **Connection Pooling**: Optimized database connections

## Security Features

- **Tenant Isolation**: Complete data separation between tenants
- **Permission Validation**: Runtime permission checking
- **Audit Logging**: All operations are logged for compliance
- **Input Validation**: Comprehensive input validation using class-validator
- **SQL Injection Protection**: TypeORM provides built-in protection

## Testing

The system includes comprehensive tests:
- Unit tests for all services
- Integration tests for controllers
- Property-based tests for critical operations
- End-to-end tests for complete workflows

```bash
# Run RBAC tests
npm test -- --testPathPattern=rbac
```

## Migration Notes

When upgrading from the old tenant system:
1. Run the database migration: `npm run typeorm migration:run`
2. Migrate user data: `npm run rbac:migrate-users migrate`
3. Verify migration: `npm run rbac:migrate-users verify`

## Support

For issues or questions:
1. Check the error logs in `rbac_audit_logs` table
2. Verify tenant and user configurations
3. Ensure proper permissions are assigned
4. Check Redis connectivity for caching issues

---

**Note**: This RBAC system uses UUID-based tenant identification and requires proper database migrations when upgrading from legacy systems.