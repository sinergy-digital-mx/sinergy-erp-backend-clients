import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Traduce nombres y descripciones visibles de módulos, permisos y entity_registry a español.
 * No modifica codes/actions (claves de sistema).
 */
export class TranslateModulesAndPermissionsToSpanish1784800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const modules: Array<{
      code: string;
      name: string;
      description: string;
    }> = [
      {
        code: 'users',
        name: 'Usuarios',
        description: 'Gestión de usuarios y cuentas',
      },
      {
        code: 'roles',
        name: 'Roles y Permisos',
        description: 'Gestión de roles y permisos',
      },
      {
        code: 'products',
        name: 'Productos',
        description: 'Gestión de productos, unidades de medida, precios y fotos',
      },
      {
        code: 'categories',
        name: 'Categorías',
        description: 'Gestión de categorías y subcategorías',
      },
      {
        code: 'subcategories',
        name: 'Subcategorías',
        description: 'Gestión de subcategorías',
      },
      {
        code: 'uom_catalog',
        name: 'Unidades de Medida',
        description: 'Gestión de unidades de medida (UM) por cliente',
      },
      {
        code: 'warehouses',
        name: 'Almacenes',
        description: 'Gestión de almacenes y ubicaciones de inventario',
      },
      {
        code: 'exchange-rate',
        name: 'Tipo de Cambio',
        description: 'Gestión diaria del tipo de cambio por cliente',
      },
      {
        code: 'leads',
        name: 'Prospectos',
        description: 'Gestión de prospectos',
      },
      {
        code: 'customers',
        name: 'Clientes',
        description: 'Gestión de clientes',
      },
      {
        code: 'customer-groups',
        name: 'Grupos de Clientes',
        description: 'Gestión de grupos y segmentación de clientes',
      },
      {
        code: 'customer_activities',
        name: 'Actividades de Clientes',
        description: 'Gestión de actividades de clientes',
      },
      {
        code: 'activities',
        name: 'Actividades',
        description: 'Seguimiento de actividades',
      },
      {
        code: 'customer_documents',
        name: 'Documentos de Clientes',
        description:
          'Gestión de documentos de clientes (INE, licencias, comprobantes, etc.)',
      },
      {
        code: 'billing',
        name: 'Facturación',
        description: 'Gestión de configuraciones fiscales y facturación',
      },
      {
        code: 'electronic_invoicing',
        name: 'Facturación electrónica',
        description: 'Timbrado, cancelación y sincronización SAT vía Finkok',
      },
      {
        code: 'accounting',
        name: 'Cobranza / Contabilidad',
        description: 'Dashboard de POS, cuentas por pagar y cuentas por cobrar',
      },
      {
        code: 'payments',
        name: 'Pagos',
        description: 'Gestión de pagos',
      },
      {
        code: 'inventory',
        name: 'Inventario',
        description: 'Gestión de lotes de inventario y existencias',
      },
      {
        code: 'purchase_orders',
        name: 'Órdenes de Compra',
        description: 'Sistema de gestión de órdenes de compra',
      },
      {
        code: 'vendors',
        name: 'Proveedores',
        description: 'Gestión de proveedores',
      },
      {
        code: 'properties',
        name: 'Propiedades',
        description: 'Gestión de propiedades/lotes',
      },
      {
        code: 'contracts',
        name: 'Contratos',
        description: 'Gestión de contratos',
      },
      {
        code: 'contract_documents',
        name: 'Documentos de Contratos',
        description:
          'Gestión de documentos de contratos (contratos firmados, anexos, etc.)',
      },
      {
        code: 'sales_orders',
        name: 'Órdenes de Venta',
        description: 'Gestión de órdenes de venta y su procesamiento',
      },
      {
        code: 'pos',
        name: 'Punto de Venta',
        description: 'Gestión de transacciones y operaciones de punto de venta',
      },
      {
        code: 'pos-shifts',
        name: 'Turnos de Caja',
        description: 'Turnos diarios de POS, retiros parciales y cobros',
      },
      {
        code: 'pos-configuration',
        name: 'Configuración de POS',
        description: 'Gestión de la configuración del punto de venta',
      },
      {
        code: 'goals',
        name: 'Metas',
        description: 'Metas de ventas por sucursal y por rol de usuario',
      },
      {
        code: 'zona_norte_custom_report',
        name: 'Reporte de Ventas',
        description: 'Módulo personalizado para reportes de ventas de Zona Norte',
      },
      {
        code: 'divino_dashboard',
        name: 'Dashboard Divino',
        description: 'Dashboard analítico de ventas Divino (exclusivo del cliente)',
      },
      {
        code: 'global_discounts',
        name: 'Descuentos globales',
        description: 'Descuentos generales aplicables a toda la orden de venta',
      },
      {
        code: 'mailer_configurations',
        name: 'Configuraciones de Correo',
        description: 'Configuraciones del proveedor de correo del cliente',
      },
      {
        code: 'resend_configuration',
        name: 'Configuración de Resend',
        description: 'Gestión de configuraciones del servicio de correo (Resend)',
      },
      {
        code: 'email-templates',
        name: 'Plantillas de Correo',
        description: 'Gestión de plantillas de correo del cliente',
      },
      {
        code: 'divino_reservation_formats',
        name: 'Formatos de Reservación Divino',
        description:
          'Cotizaciones/apartados de lotes mediante formato de reservación Divino',
      },
      {
        code: 'employees',
        name: 'Empleados',
        description:
          'Gestión de empleados: datos de RH/nómina, vacaciones y solicitudes',
      },
      {
        code: 'employee_portal',
        name: 'Portal de empleado',
        description:
          'Autoservicio del empleado: perfil, foto, contraseña y solicitudes de vacaciones',
      },
    ];

    for (const m of modules) {
      await queryRunner.query(
        `UPDATE modules SET name = ?, description = ? WHERE code = ?`,
        [m.name, m.description, m.code],
      );
    }

    const entityRegistry: Array<{ code: string; name: string }> = [
      { code: 'Accounting', name: 'Contabilidad' },
      { code: 'activities', name: 'Actividades' },
      { code: 'Activity', name: 'Actividades' },
      { code: 'AuditLog', name: 'Bitácora de auditoría' },
      { code: 'billing', name: 'Facturación' },
      { code: 'categories', name: 'Categorías' },
      { code: 'Category', name: 'Categorías' },
      { code: 'Contract', name: 'Contratos' },
      { code: 'contract_documents', name: 'Documentos de Contratos' },
      { code: 'ContractDocument', name: 'Documentos de Contratos' },
      { code: 'contracts', name: 'Contratos' },
      { code: 'Customer OLD', name: 'Clientes' },
      { code: 'customer_activities', name: 'Actividades de Clientes' },
      { code: 'customer_documents', name: 'Documentos de Clientes' },
      { code: 'CustomerDocument', name: 'Documentos de Clientes' },
      { code: 'CustomerGroup', name: 'Grupos de Clientes' },
      { code: 'customers', name: 'Clientes' },
      { code: 'divino_dashboard', name: 'Menú Dashboard Divino' },
      { code: 'DivinoDashboard', name: 'Dashboard Divino' },
      {
        code: 'DivinoReservationFormat',
        name: 'Formatos de Reservación Divino',
      },
      { code: 'electronic_invoices', name: 'Facturas electrónicas' },
      { code: 'electronic_invoicing', name: 'Menú Facturación electrónica' },
      { code: 'ElectronicInvoice', name: 'Factura electrónica' },
      { code: 'email-templates', name: 'Plantillas de Correo' },
      { code: 'EmailMessage', name: 'Mensajes de correo' },
      { code: 'EmailThread', name: 'Hilos de correo' },
      { code: 'Employee', name: 'Empleados' },
      { code: 'EmployeePortal', name: 'Portal de empleado' },
      { code: 'exchange-rate', name: 'Menú Tipo de Cambio' },
      { code: 'ExchangeRate', name: 'Tipo de Cambio' },
      { code: 'FiscalConfiguration', name: 'Configuración fiscal' },
      { code: 'GlobalDiscount', name: 'Descuentos globales' },
      { code: 'Goals', name: 'Metas' },
      { code: 'Inventory', name: 'Inventario' },
      { code: 'leadOLD', name: 'Prospectos' },
      { code: 'leads', name: 'Prospectos' },
      { code: 'mailer_configurations', name: 'Configuraciones de Correo' },
      { code: 'Payment', name: 'Pagos' },
      { code: 'payments', name: 'Pagos' },
      { code: 'Permission', name: 'Permisos' },
      { code: 'POS', name: 'Punto de Venta' },
      { code: 'pos_configuration', name: 'Configuración de POS' },
      { code: 'PosShift', name: 'Turnos de Caja' },
      { code: 'Product', name: 'Productos' },
      { code: 'ProductPhoto', name: 'Fotos de producto' },
      { code: 'products', name: 'Productos' },
      { code: 'properties', name: 'Propiedades' },
      { code: 'Property', name: 'Propiedades' },
      { code: 'purchase_orders', name: 'Órdenes de Compra' },
      { code: 'Report', name: 'Reportes' },
      { code: 'resend_configurations', name: 'Configuraciones de Resend' },
      { code: 'Role', name: 'Roles' },
      { code: 'sales_orders', name: 'Órdenes de Venta' },
      { code: 'subcategories', name: 'Subcategorías' },
      { code: 'Subcategory', name: 'Subcategorías' },
      { code: 'Tenant', name: 'Clientes del sistema' },
      { code: 'transactions', name: 'Transacciones' },
      { code: 'UoM', name: 'Unidades de Medida' },
      { code: 'UoMCatalog', name: 'Catálogo de Unidades de Medida' },
      { code: 'User', name: 'Usuarios' },
      { code: 'users', name: 'Usuarios' },
      { code: 'Vendor', name: 'Proveedores' },
      { code: 'VendorProductPrice', name: 'Precios de producto por proveedor' },
      { code: 'vendors', name: 'Proveedores' },
      { code: 'Warehouse', name: 'Almacenes' },
      { code: 'warehouses', name: 'Almacenes' },
      { code: 'zona_norte_custom_report', name: 'Reporte de Ventas' },
    ];

    for (const e of entityRegistry) {
      await queryRunner.query(
        `UPDATE entity_registry SET name = ? WHERE code = ?`,
        [e.name, e.code],
      );
    }

    // Permisos ligados a módulo: (module_code, action) -> description
    const modulePermissions: Array<{
      moduleCode: string;
      action: string;
      description: string;
    }> = [
      {
        moduleCode: 'accounting',
        action: 'Read',
        description: 'Ver dashboard y reportes de cobranza/contabilidad',
      },
      {
        moduleCode: 'accounting',
        action: 'ViewMenu',
        description: 'Ver módulo de Cobranza / Contabilidad en el menú',
      },
      {
        moduleCode: 'activities',
        action: 'ViewMenu',
        description: 'Ver menú de Actividades',
      },
      {
        moduleCode: 'billing',
        action: 'Create',
        description: 'Crear configuraciones fiscales',
      },
      {
        moduleCode: 'billing',
        action: 'Delete',
        description: 'Eliminar configuraciones fiscales',
      },
      {
        moduleCode: 'billing',
        action: 'Read',
        description: 'Ver configuraciones fiscales',
      },
      {
        moduleCode: 'billing',
        action: 'Update',
        description: 'Editar configuraciones fiscales',
      },
      {
        moduleCode: 'billing',
        action: 'ViewMenu',
        description: 'Ver menú de Facturación',
      },
      {
        moduleCode: 'categories',
        action: 'Create',
        description: 'Crear categorías',
      },
      {
        moduleCode: 'categories',
        action: 'Delete',
        description: 'Eliminar categorías',
      },
      {
        moduleCode: 'categories',
        action: 'Read',
        description: 'Ver categorías',
      },
      {
        moduleCode: 'categories',
        action: 'Update',
        description: 'Editar categorías',
      },
      {
        moduleCode: 'categories',
        action: 'ViewMenu',
        description: 'Ver menú de Categorías',
      },
      {
        moduleCode: 'contract_documents',
        action: 'Approve',
        description: 'Aprobar documentos de contratos',
      },
      {
        moduleCode: 'contract_documents',
        action: 'Create',
        description: 'Subir documentos de contratos',
      },
      {
        moduleCode: 'contract_documents',
        action: 'Delete',
        description: 'Eliminar documentos de contratos',
      },
      {
        moduleCode: 'contract_documents',
        action: 'Read',
        description: 'Ver documentos de contratos',
      },
      {
        moduleCode: 'contract_documents',
        action: 'Reject',
        description: 'Rechazar documentos de contratos',
      },
      {
        moduleCode: 'contract_documents',
        action: 'Update',
        description: 'Actualizar estado de documentos de contratos',
      },
      {
        moduleCode: 'contract_documents',
        action: 'ViewMenu',
        description: 'Ver menú de Documentos de Contratos',
      },
      {
        moduleCode: 'contracts',
        action: 'create',
        description: 'Crear contratos',
      },
      {
        moduleCode: 'contracts',
        action: 'delete',
        description: 'Eliminar contratos',
      },
      {
        moduleCode: 'contracts',
        action: 'read',
        description: 'Ver contratos',
      },
      {
        moduleCode: 'contracts',
        action: 'update',
        description: 'Actualizar contratos',
      },
      {
        moduleCode: 'contracts',
        action: 'view',
        description: 'Consultar contratos',
      },
      {
        moduleCode: 'contracts',
        action: 'view_stats',
        description: 'Ver estadísticas de contratos',
      },
      {
        moduleCode: 'contracts',
        action: 'ViewMenu',
        description: 'Ver menú de Contratos',
      },
      {
        moduleCode: 'customer_activities',
        action: 'Crear',
        description: 'Crear actividades de cliente',
      },
      {
        moduleCode: 'customer_activities',
        action: 'Eliminar',
        description: 'Eliminar actividades de cliente',
      },
      {
        moduleCode: 'customer_activities',
        action: 'read',
        description: 'Leer actividades de cliente',
      },
      {
        moduleCode: 'customer_activities',
        action: 'update',
        description: 'Actualizar actividades de cliente',
      },
      {
        moduleCode: 'customer_activities',
        action: 'ViewMenu',
        description: 'Ver menú de Actividades de Clientes',
      },
      {
        moduleCode: 'customer_documents',
        action: 'Approve',
        description: 'Aprobar documentos de clientes',
      },
      {
        moduleCode: 'customer_documents',
        action: 'Create',
        description: 'Subir documentos de clientes',
      },
      {
        moduleCode: 'customer_documents',
        action: 'Delete',
        description: 'Eliminar documentos de clientes',
      },
      {
        moduleCode: 'customer_documents',
        action: 'Read',
        description: 'Ver documentos de clientes',
      },
      {
        moduleCode: 'customer_documents',
        action: 'Reject',
        description: 'Rechazar documentos de clientes',
      },
      {
        moduleCode: 'customer_documents',
        action: 'Update',
        description: 'Actualizar estado de documentos de clientes',
      },
      {
        moduleCode: 'customer_documents',
        action: 'ViewMenu',
        description: 'Ver menú de Documentos de Clientes',
      },
      {
        moduleCode: 'customer-groups',
        action: 'delete',
        description: 'Eliminar grupos de clientes',
      },
      {
        moduleCode: 'customer-groups',
        action: 'read',
        description: 'Ver grupos de clientes',
      },
      {
        moduleCode: 'customer-groups',
        action: 'ViewMenu',
        description: 'Ver Grupos de Clientes en el menú',
      },
      {
        moduleCode: 'customer-groups',
        action: 'write',
        description: 'Crear y actualizar grupos de clientes',
      },
      {
        moduleCode: 'customers',
        action: 'create',
        description: 'Crear clientes',
      },
      {
        moduleCode: 'customers',
        action: 'delete',
        description: 'Eliminar clientes',
      },
      {
        moduleCode: 'customers',
        action: 'Download',
        description: 'Descargar clientes',
      },
      {
        moduleCode: 'customers',
        action: 'read',
        description: 'Ver clientes',
      },
      {
        moduleCode: 'customers',
        action: 'ViewMenu',
        description: 'Ver menú de Clientes',
      },
      {
        moduleCode: 'divino_dashboard',
        action: 'Read',
        description: 'Ver datos del dashboard de ventas',
      },
      {
        moduleCode: 'divino_dashboard',
        action: 'ViewMenu',
        description: 'Mostrar Dashboard Divino en el menú lateral',
      },
      {
        moduleCode: 'divino_reservation_formats',
        action: 'Create',
        description: 'Crear formatos de reservación Divino',
      },
      {
        moduleCode: 'divino_reservation_formats',
        action: 'Delete',
        description: 'Eliminar formatos de reservación Divino',
      },
      {
        moduleCode: 'divino_reservation_formats',
        action: 'Read',
        description: 'Ver formatos de reservación Divino',
      },
      {
        moduleCode: 'divino_reservation_formats',
        action: 'Send',
        description: 'Enviar formatos de reservación Divino',
      },
      {
        moduleCode: 'divino_reservation_formats',
        action: 'Update',
        description: 'Actualizar formatos de reservación Divino',
      },
      {
        moduleCode: 'divino_reservation_formats',
        action: 'ViewMenu',
        description: 'Ver Formatos de Reservación Divino en el menú',
      },
      {
        moduleCode: 'electronic_invoicing',
        action: 'Cancel',
        description: 'Cancelar CFDI timbrado',
      },
      {
        moduleCode: 'electronic_invoicing',
        action: 'Read',
        description: 'Ver facturas electrónicas',
      },
      {
        moduleCode: 'electronic_invoicing',
        action: 'Stamp',
        description: 'Timbrar CFDI vía Finkok',
      },
      {
        moduleCode: 'electronic_invoicing',
        action: 'SyncSat',
        description: 'Sincronizar estatus de CFDI con el SAT',
      },
      {
        moduleCode: 'electronic_invoicing',
        action: 'ViewMenu',
        description: 'Ver Facturación electrónica en el menú',
      },
      {
        moduleCode: 'email-templates',
        action: 'Create',
        description: 'Crear plantillas de correo',
      },
      {
        moduleCode: 'email-templates',
        action: 'Delete',
        description: 'Eliminar plantillas de correo',
      },
      {
        moduleCode: 'email-templates',
        action: 'Read',
        description: 'Ver plantillas de correo y variables disponibles',
      },
      {
        moduleCode: 'email-templates',
        action: 'Send',
        description:
          'Enviar plantillas de correo con la configuración de correo activa',
      },
      {
        moduleCode: 'email-templates',
        action: 'Update',
        description: 'Actualizar plantillas de correo',
      },
      {
        moduleCode: 'email-templates',
        action: 'ViewMenu',
        description: 'Mostrar Plantillas de Correo en el menú lateral',
      },
      {
        moduleCode: 'employee_portal',
        action: 'Read',
        description: 'Ver portal de empleado',
      },
      {
        moduleCode: 'employee_portal',
        action: 'RequestLeave',
        description: 'Solicitar vacaciones desde el portal de empleado',
      },
      {
        moduleCode: 'employee_portal',
        action: 'Update',
        description: 'Actualizar perfil en el portal de empleado',
      },
      {
        moduleCode: 'employee_portal',
        action: 'ViewMenu',
        description: 'Ver Portal de empleado en el menú',
      },
      {
        moduleCode: 'employees',
        action: 'Create',
        description: 'Crear empleados',
      },
      {
        moduleCode: 'employees',
        action: 'Delete',
        description: 'Eliminar empleados',
      },
      {
        moduleCode: 'employees',
        action: 'ManageLeave',
        description: 'Gestionar vacaciones de empleados',
      },
      {
        moduleCode: 'employees',
        action: 'Read',
        description: 'Ver empleados',
      },
      {
        moduleCode: 'employees',
        action: 'Update',
        description: 'Actualizar empleados',
      },
      {
        moduleCode: 'employees',
        action: 'ViewMenu',
        description: 'Ver Empleados en el menú',
      },
      {
        moduleCode: 'exchange-rate',
        action: 'Create',
        description: 'Crear registros de tipo de cambio',
      },
      {
        moduleCode: 'exchange-rate',
        action: 'Delete',
        description: 'Eliminar tipos de cambio',
      },
      {
        moduleCode: 'exchange-rate',
        action: 'Read',
        description: 'Ver tipos de cambio',
      },
      {
        moduleCode: 'exchange-rate',
        action: 'Update',
        description: 'Crear o editar el tipo de cambio del día',
      },
      {
        moduleCode: 'exchange-rate',
        action: 'ViewMenu',
        description: 'Mostrar Tipo de Cambio en el menú lateral',
      },
      {
        moduleCode: 'global_discounts',
        action: 'Create',
        description: 'Crear descuentos globales',
      },
      {
        moduleCode: 'global_discounts',
        action: 'Delete',
        description: 'Eliminar descuentos globales',
      },
      {
        moduleCode: 'global_discounts',
        action: 'Read',
        description: 'Ver descuentos globales',
      },
      {
        moduleCode: 'global_discounts',
        action: 'Update',
        description: 'Actualizar descuentos globales',
      },
      {
        moduleCode: 'global_discounts',
        action: 'ViewMenu',
        description: 'Ver Descuentos globales en el menú',
      },
      {
        moduleCode: 'goals',
        action: 'Create',
        description: 'Crear metas de ventas',
      },
      {
        moduleCode: 'goals',
        action: 'Delete',
        description: 'Eliminar metas de ventas',
      },
      {
        moduleCode: 'goals',
        action: 'Read',
        description: 'Ver metas de ventas',
      },
      {
        moduleCode: 'goals',
        action: 'Update',
        description: 'Actualizar metas de ventas',
      },
      {
        moduleCode: 'goals',
        action: 'ViewMenu',
        description: 'Ver módulo de Metas en el menú',
      },
      {
        moduleCode: 'inventory',
        action: 'Read',
        description: 'Ver inventario',
      },
      {
        moduleCode: 'inventory',
        action: 'ViewMenu',
        description: 'Ver Inventario en el menú',
      },
      {
        moduleCode: 'leads',
        action: 'Actualizar',
        description: 'Actualizar prospectos',
      },
      {
        moduleCode: 'leads',
        action: 'Crear',
        description: 'Crear prospectos',
      },
      {
        moduleCode: 'leads',
        action: 'Download',
        description: 'Descargar prospectos',
      },
      {
        moduleCode: 'leads',
        action: 'Editar',
        description: 'Editar prospectos',
      },
      {
        moduleCode: 'leads',
        action: 'Eliminar',
        description: 'Eliminar prospectos',
      },
      {
        moduleCode: 'leads',
        action: 'Export',
        description: 'Exportar prospectos',
      },
      {
        moduleCode: 'leads',
        action: 'Leer',
        description: 'Ver prospectos',
      },
      {
        moduleCode: 'leads',
        action: 'ViewMenu',
        description: 'Ver menú de Prospectos',
      },
      {
        moduleCode: 'mailer_configurations',
        action: 'Create',
        description: 'Crear configuraciones de correo',
      },
      {
        moduleCode: 'mailer_configurations',
        action: 'Delete',
        description: 'Eliminar configuraciones de correo',
      },
      {
        moduleCode: 'mailer_configurations',
        action: 'Read',
        description: 'Ver configuraciones de correo',
      },
      {
        moduleCode: 'mailer_configurations',
        action: 'Update',
        description: 'Actualizar y activar configuraciones de correo',
      },
      {
        moduleCode: 'mailer_configurations',
        action: 'ViewMenu',
        description: 'Mostrar Configuraciones de Correo en el menú lateral',
      },
      {
        moduleCode: 'payments',
        action: 'Actualizar',
        description: 'Actualizar pagos',
      },
      {
        moduleCode: 'payments',
        action: 'Crear',
        description: 'Crear pagos',
      },
      {
        moduleCode: 'payments',
        action: 'Eliminar',
        description: 'Eliminar pagos',
      },
      {
        moduleCode: 'payments',
        action: 'Leer',
        description: 'Ver pagos',
      },
      {
        moduleCode: 'payments',
        action: 'ViewMenu',
        description: 'Ver menú de Pagos',
      },
      {
        moduleCode: 'pos',
        action: 'delete',
        description: 'Eliminar operaciones de punto de venta',
      },
      {
        moduleCode: 'pos',
        action: 'read',
        description: 'Ver punto de venta',
      },
      {
        moduleCode: 'pos',
        action: 'ViewMenu',
        description: 'Ver Punto de Venta en el menú',
      },
      {
        moduleCode: 'pos-configuration',
        action: 'delete',
        description: 'Eliminar configuración de POS',
      },
      {
        moduleCode: 'pos-configuration',
        action: 'read',
        description: 'Ver configuración de POS',
      },
      {
        moduleCode: 'pos-configuration',
        action: 'ViewMenu',
        description: 'Ver Configuración de POS en el menú',
      },
      {
        moduleCode: 'pos-configuration',
        action: 'write',
        description: 'Crear y actualizar configuración de POS',
      },
      {
        moduleCode: 'pos-shifts',
        action: 'Create',
        description: 'Abrir turno diario de POS',
      },
      {
        moduleCode: 'pos-shifts',
        action: 'Read',
        description: 'Ver turnos de POS y ventas pendientes',
      },
      {
        moduleCode: 'pos-shifts',
        action: 'Update',
        description: 'Retiros parciales, cobrar ventas y cerrar turno',
      },
      {
        moduleCode: 'pos-shifts',
        action: 'ViewMenu',
        description: 'Ver Turnos de Caja en el menú',
      },
      {
        moduleCode: 'products',
        action: 'Create',
        description: 'Crear productos',
      },
      {
        moduleCode: 'products',
        action: 'Delete',
        description: 'Eliminar productos',
      },
      {
        moduleCode: 'products',
        action: 'Read',
        description: 'Ver productos',
      },
      {
        moduleCode: 'products',
        action: 'Update',
        description: 'Actualizar productos',
      },
      {
        moduleCode: 'products',
        action: 'ViewMenu',
        description: 'Ver menú de Productos',
      },
      {
        moduleCode: 'properties',
        action: 'create',
        description: 'Crear propiedades',
      },
      {
        moduleCode: 'properties',
        action: 'delete',
        description: 'Eliminar propiedades',
      },
      {
        moduleCode: 'properties',
        action: 'update',
        description: 'Actualizar propiedades',
      },
      {
        moduleCode: 'properties',
        action: 'view',
        description: 'Ver propiedades',
      },
      {
        moduleCode: 'properties',
        action: 'ViewMenu',
        description: 'Ver menú de Propiedades',
      },
      {
        moduleCode: 'purchase_orders',
        action: 'cancel',
        description: 'Cancelar órdenes de compra',
      },
      {
        moduleCode: 'purchase_orders',
        action: 'create',
        description: 'Crear órdenes de compra',
      },
      {
        moduleCode: 'purchase_orders',
        action: 'read',
        description: 'Ver órdenes de compra',
      },
      {
        moduleCode: 'purchase_orders',
        action: 'read_products',
        description: 'Ver productos disponibles de proveedores',
      },
      {
        moduleCode: 'purchase_orders',
        action: 'receive',
        description: 'Recibir y procesar órdenes de compra',
      },
      {
        moduleCode: 'purchase_orders',
        action: 'update',
        description: 'Editar órdenes de compra',
      },
      {
        moduleCode: 'purchase_orders',
        action: 'ViewMenu',
        description: 'Ver módulo de Órdenes de Compra en el menú',
      },
      {
        moduleCode: 'resend_configuration',
        action: 'Create',
        description: 'Crear configuraciones de Resend',
      },
      {
        moduleCode: 'resend_configuration',
        action: 'Delete',
        description: 'Eliminar configuraciones de Resend',
      },
      {
        moduleCode: 'resend_configuration',
        action: 'Read',
        description: 'Ver configuraciones de Resend',
      },
      {
        moduleCode: 'resend_configuration',
        action: 'Test',
        description: 'Probar conexión de configuraciones de Resend',
      },
      {
        moduleCode: 'resend_configuration',
        action: 'Update',
        description: 'Actualizar configuraciones de Resend',
      },
      {
        moduleCode: 'roles',
        action: 'read',
        description: 'Ver roles y permisos',
      },
      {
        moduleCode: 'roles',
        action: 'ViewMenu',
        description: 'Ver Roles y Permisos en el menú',
      },
      {
        moduleCode: 'sales_orders',
        action: 'approve',
        description: 'Aprobar órdenes de venta',
      },
      {
        moduleCode: 'sales_orders',
        action: 'delete',
        description: 'Eliminar órdenes de venta',
      },
      {
        moduleCode: 'sales_orders',
        action: 'read',
        description: 'Ver órdenes de venta',
      },
      {
        moduleCode: 'sales_orders',
        action: 'reject',
        description: 'Rechazar órdenes de venta',
      },
      {
        moduleCode: 'sales_orders',
        action: 'ViewMenu',
        description: 'Ver Órdenes de Venta en el menú',
      },
      {
        moduleCode: 'sales_orders',
        action: 'write',
        description: 'Crear y actualizar órdenes de venta',
      },
      {
        moduleCode: 'subcategories',
        action: 'Create',
        description: 'Crear subcategorías',
      },
      {
        moduleCode: 'subcategories',
        action: 'Delete',
        description: 'Eliminar subcategorías',
      },
      {
        moduleCode: 'subcategories',
        action: 'Read',
        description: 'Ver subcategorías',
      },
      {
        moduleCode: 'subcategories',
        action: 'Update',
        description: 'Editar subcategorías',
      },
      {
        moduleCode: 'subcategories',
        action: 'ViewMenu',
        description: 'Ver menú de Subcategorías',
      },
      {
        moduleCode: 'uom_catalog',
        action: 'Create',
        description: 'Crear unidades de medida',
      },
      {
        moduleCode: 'uom_catalog',
        action: 'Delete',
        description: 'Eliminar unidades de medida',
      },
      {
        moduleCode: 'uom_catalog',
        action: 'Read',
        description: 'Ver unidades de medida',
      },
      {
        moduleCode: 'uom_catalog',
        action: 'Update',
        description: 'Actualizar unidades de medida',
      },
      {
        moduleCode: 'users',
        action: 'read',
        description: 'Ver usuarios',
      },
      {
        moduleCode: 'users',
        action: 'update',
        description: 'Actualizar usuarios',
      },
      {
        moduleCode: 'users',
        action: 'ViewMenu',
        description: 'Ver Usuarios en el menú',
      },
      {
        moduleCode: 'users',
        action: 'write',
        description: 'Crear y actualizar usuarios',
      },
      {
        moduleCode: 'vendors',
        action: 'Create',
        description: 'Crear proveedores',
      },
      {
        moduleCode: 'vendors',
        action: 'Delete',
        description: 'Eliminar proveedores',
      },
      {
        moduleCode: 'vendors',
        action: 'Read',
        description: 'Ver proveedores',
      },
      {
        moduleCode: 'vendors',
        action: 'Update',
        description: 'Editar proveedores',
      },
      {
        moduleCode: 'vendors',
        action: 'ViewMenu',
        description: 'Ver menú de Proveedores',
      },
      {
        moduleCode: 'warehouses',
        action: 'Create',
        description: 'Crear almacenes',
      },
      {
        moduleCode: 'warehouses',
        action: 'Delete',
        description: 'Eliminar almacenes',
      },
      {
        moduleCode: 'warehouses',
        action: 'Read',
        description: 'Ver almacenes',
      },
      {
        moduleCode: 'warehouses',
        action: 'Update',
        description: 'Editar almacenes',
      },
      {
        moduleCode: 'warehouses',
        action: 'ViewMenu',
        description: 'Ver menú de Almacenes',
      },
      {
        moduleCode: 'zona_norte_custom_report',
        action: 'read',
        description: 'Ver reporte de ventas',
      },
      {
        moduleCode: 'zona_norte_custom_report',
        action: 'ViewMenu',
        description: 'Ver Reporte de Ventas en el menú',
      },
    ];

    for (const p of modulePermissions) {
      await queryRunner.query(
        `
          UPDATE rbac_permissions p
          INNER JOIN modules m ON m.id = p.module_id
          SET p.description = ?
          WHERE m.code = ? AND p.action = ?
        `,
        [p.description, p.moduleCode, p.action],
      );
    }

    // Permisos huérfanos (sin módulo): (entity_code, action[, old description]) -> description
    const orphanPermissions: Array<{
      entityCode: string;
      action: string;
      description: string;
      matchDescription?: string | null;
    }> = [
      {
        entityCode: 'User',
        action: 'Activate',
        description: 'Activar cuentas de usuario',
      },
      {
        entityCode: 'EmailThread',
        action: 'Actualizar',
        description: 'Actualizar hilos de correo',
      },
      {
        entityCode: 'EmailMessage',
        action: 'Actualizar',
        description: 'Actualizar mensajes de correo',
      },
      {
        entityCode: 'User',
        action: 'Actualizar',
        description: 'Editar usuarios',
        matchDescription: 'Edit users',
      },
      {
        entityCode: 'EmailThread',
        action: 'Archive',
        description: 'Archivar hilos de correo',
      },
      {
        entityCode: 'Permission',
        action: 'Assign',
        description: 'Asignar permisos a roles',
      },
      {
        entityCode: 'leadOLD',
        action: 'Assign',
        description: 'Asignar prospectos a usuarios',
      },
      {
        entityCode: 'Role',
        action: 'Assign',
        description: 'Asignar roles a usuarios',
      },
      {
        entityCode: 'Customer OLD',
        action: 'Bulk_Update',
        description: 'Actualizar varios clientes a la vez',
      },
      {
        entityCode: 'Tenant',
        action: 'Configure',
        description: 'Configurar ajustes del cliente',
      },
      {
        entityCode: 'leadOLD',
        action: 'Convert',
        description: 'Convertir prospectos en clientes',
      },
      {
        entityCode: 'EmailMessage',
        action: 'Crear',
        description: 'Enviar mensajes de correo',
      },
      {
        entityCode: 'User',
        action: 'Crear',
        description: 'Crear usuarios',
      },
      {
        entityCode: 'EmailThread',
        action: 'Crear',
        description: 'Crear hilos de correo',
      },
      {
        entityCode: 'Tenant',
        action: 'Create',
        description: 'Crear clientes del sistema',
      },
      {
        entityCode: 'User',
        action: 'Create',
        description: 'Crear usuarios',
      },
      {
        entityCode: 'Role',
        action: 'Create',
        description: 'Crear roles',
      },
      {
        entityCode: 'Report',
        action: 'Create',
        description: 'Crear reportes personalizados',
      },
      {
        entityCode: 'User',
        action: 'Deactivate',
        description: 'Desactivar cuentas de usuario',
      },
      {
        entityCode: 'Report',
        action: 'Delete',
        description: 'Eliminar reportes',
      },
      {
        entityCode: 'AuditLog',
        action: 'Delete',
        description: 'Eliminar registros antiguos de bitácora',
      },
      {
        entityCode: 'Role',
        action: 'Delete',
        description: 'Eliminar roles',
      },
      {
        entityCode: 'User',
        action: 'Delete',
        description: 'Eliminar usuarios',
      },
      {
        entityCode: 'Inventory',
        action: 'Delete',
        description: 'Eliminar elementos de inventario',
      },
      {
        entityCode: 'Tenant',
        action: 'Delete',
        description: 'Eliminar clientes del sistema',
      },
      {
        entityCode: 'Customer OLD',
        action: 'Download_Report',
        description: 'Descargar reportes de clientes',
      },
      {
        entityCode: 'leadOLD',
        action: 'Download_Report',
        description: 'Descargar reportes de prospectos',
      },
      {
        entityCode: 'User',
        action: 'edit',
        description: 'Editar usuarios',
      },
      {
        entityCode: 'User',
        action: 'Eliminar',
        description: 'Eliminar usuarios',
      },
      {
        entityCode: 'EmailThread',
        action: 'Eliminar',
        description: 'Eliminar hilos de correo',
      },
      {
        entityCode: 'EmailMessage',
        action: 'Eliminar',
        description: 'Eliminar mensajes de correo',
      },
      {
        entityCode: 'Report',
        action: 'Export',
        description: 'Exportar reportes',
      },
      {
        entityCode: 'leadOLD',
        action: 'Export',
        description: 'Exportar datos de prospectos',
      },
      {
        entityCode: 'AuditLog',
        action: 'Export',
        description: 'Exportar bitácora de auditoría',
      },
      {
        entityCode: 'Customer OLD',
        action: 'Export',
        description: 'Exportar datos de clientes',
      },
      {
        entityCode: 'Customer OLD',
        action: 'Import',
        description: 'Importar datos de clientes',
      },
      {
        entityCode: 'leadOLD',
        action: 'Import',
        description: 'Importar datos de prospectos',
      },
      {
        entityCode: 'EmailThread',
        action: 'Leer',
        description: 'Ver hilos de correo',
      },
      {
        entityCode: 'User',
        action: 'Leer',
        description: 'Ver usuarios',
      },
      {
        entityCode: 'EmailMessage',
        action: 'Leer',
        description: 'Ver mensajes de correo',
      },
      {
        entityCode: 'Role',
        action: 'Read',
        description: 'Ver información de roles',
      },
      {
        entityCode: 'Inventory',
        action: 'Read',
        description: 'Ver información de inventario',
      },
      {
        entityCode: 'Tenant',
        action: 'Read',
        description: 'Ver información del cliente',
      },
      {
        entityCode: 'User',
        action: 'read',
        description: 'Ver usuarios',
      },
      {
        entityCode: 'leadOLD',
        action: 'Read',
        description: 'Ver información de prospectos',
      },
      {
        entityCode: 'User',
        action: 'Read',
        description: 'Ver información de usuarios',
      },
      {
        entityCode: 'AuditLog',
        action: 'Read',
        description: 'Ver bitácora de auditoría',
      },
      {
        entityCode: 'Report',
        action: 'Read',
        description: 'Ver reportes',
      },
      {
        entityCode: 'Permission',
        action: 'Read',
        description: 'Ver información de permisos',
      },
      {
        entityCode: 'User',
        action: 'Reset_Password',
        description: 'Restablecer contraseñas de usuarios',
      },
      {
        entityCode: 'Role',
        action: 'Revoke',
        description: 'Revocar roles de usuarios',
      },
      {
        entityCode: 'Permission',
        action: 'Revoke',
        description: 'Revocar permisos de roles',
      },
      {
        entityCode: 'Report',
        action: 'Schedule',
        description: 'Programar reportes automáticos',
      },
      {
        entityCode: 'User',
        action: 'Update',
        description: 'Editar información de usuarios',
      },
      {
        entityCode: 'Role',
        action: 'Update',
        description: 'Editar información de roles',
      },
      {
        entityCode: 'Report',
        action: 'Update',
        description: 'Editar reportes',
      },
      {
        entityCode: 'Tenant',
        action: 'Update',
        description: 'Editar información del cliente',
      },
      {
        entityCode: 'Inventory',
        action: 'Write',
        description: 'Crear y editar elementos de inventario',
      },
      // Duplicados legacy con entity_registry.code = 'users'
      {
        entityCode: 'users',
        action: 'Actualizar',
        description: 'Editar usuarios',
      },
      {
        entityCode: 'users',
        action: 'Crear',
        description: 'Crear usuarios',
      },
      {
        entityCode: 'users',
        action: 'Eliminar',
        description: 'Eliminar usuarios',
      },
      {
        entityCode: 'users',
        action: 'read',
        description: 'Ver usuarios',
      },
    ];

    for (const p of orphanPermissions) {
      if (p.matchDescription !== undefined) {
        await queryRunner.query(
          `
            UPDATE rbac_permissions p
            INNER JOIN entity_registry er ON er.id = p.entity_registry_id
            SET p.description = ?
            WHERE p.module_id IS NULL
              AND er.code = ?
              AND p.action = ?
              AND p.description <=> ?
          `,
          [p.description, p.entityCode, p.action, p.matchDescription],
        );
      } else {
        await queryRunner.query(
          `
            UPDATE rbac_permissions p
            INNER JOIN entity_registry er ON er.id = p.entity_registry_id
            SET p.description = ?
            WHERE p.module_id IS NULL
              AND er.code = ?
              AND p.action = ?
          `,
          [p.description, p.entityCode, p.action],
        );
      }
    }

    // Rellenar descripciones NULL restantes con texto en español genérico
    await queryRunner.query(`
      UPDATE rbac_permissions p
      INNER JOIN entity_registry er ON er.id = p.entity_registry_id
      SET p.description = CONCAT(
        CASE
          WHEN LOWER(p.action) IN ('read', 'leer', 'view') THEN 'Ver '
          WHEN LOWER(p.action) IN ('create', 'crear', 'write') THEN 'Crear/editar '
          WHEN LOWER(p.action) IN ('update', 'actualizar', 'edit', 'editar') THEN 'Actualizar '
          WHEN LOWER(p.action) IN ('delete', 'eliminar') THEN 'Eliminar '
          WHEN p.action = 'ViewMenu' THEN 'Ver menú de '
          ELSE CONCAT(p.action, ' - ')
        END,
        er.name
      )
      WHERE p.description IS NULL OR TRIM(p.description) = ''
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Sin rollback de textos: los valores previos eran mixtos EN/ES.
  }
}
