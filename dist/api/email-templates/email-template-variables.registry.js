"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_TEMPLATE_VARIABLE_REGISTRY = exports.ALWAYS_AVAILABLE_EMAIL_TEMPLATE_VARIABLES = void 0;
exports.ALWAYS_AVAILABLE_EMAIL_TEMPLATE_VARIABLES = [
    {
        entity: 'tenant',
        label: 'Tenant',
        moduleCode: 'tenant',
        variables: [
            {
                key: 'tenant.name',
                label: 'Nombre del tenant',
                type: 'string',
                source: 'rbac_tenants.name',
            },
            {
                key: 'tenant.subdomain',
                label: 'Subdominio del tenant',
                type: 'string',
                source: 'rbac_tenants.subdomain',
            },
        ],
    },
];
exports.EMAIL_TEMPLATE_VARIABLE_REGISTRY = [
    {
        entity: 'customer',
        label: 'Cliente',
        moduleCode: 'customers',
        variables: [
            { key: 'customer.name', label: 'Nombre', type: 'string', source: 'customers.name' },
            { key: 'customer.lastname', label: 'Apellido', type: 'string', source: 'customers.lastname' },
            { key: 'customer.email', label: 'Email', type: 'string', source: 'customers.email' },
            { key: 'customer.phone', label: 'Telefono', type: 'string', source: 'customers.phone' },
            { key: 'customer.company_name', label: 'Empresa', type: 'string', source: 'customers.company_name' },
        ],
    },
    {
        entity: 'lead',
        label: 'Lead',
        moduleCode: 'leads',
        variables: [
            { key: 'lead.name', label: 'Nombre', type: 'string', source: 'leads.name' },
            { key: 'lead.lastname', label: 'Apellido', type: 'string', source: 'leads.lastname' },
            { key: 'lead.email', label: 'Email', type: 'string', source: 'leads.email' },
            { key: 'lead.phone', label: 'Telefono', type: 'string', source: 'leads.phone' },
            { key: 'lead.company_name', label: 'Empresa', type: 'string', source: 'leads.company_name' },
        ],
    },
    {
        entity: 'contract',
        label: 'Contrato',
        moduleCode: 'contracts',
        variables: [
            { key: 'contract.contract_number', label: 'Numero de contrato', type: 'string', source: 'contracts.contract_number' },
            { key: 'contract.contract_date', label: 'Fecha de contrato', type: 'date', source: 'contracts.contract_date' },
            { key: 'contract.total_price', label: 'Precio total', type: 'currency', source: 'contracts.total_price' },
            { key: 'contract.remaining_balance', label: 'Saldo restante', type: 'currency', source: 'contracts.remaining_balance' },
            { key: 'contract.monthly_payment', label: 'Pago mensual', type: 'currency', source: 'contracts.monthly_payment' },
            { key: 'contract.first_payment_date', label: 'Primera fecha de pago', type: 'date', source: 'contracts.first_payment_date' },
            { key: 'contract.status', label: 'Estatus', type: 'string', source: 'contracts.status' },
            { key: 'contract.currency', label: 'Moneda', type: 'string', source: 'contracts.currency' },
        ],
    },
    {
        entity: 'payment',
        label: 'Pago',
        moduleCode: 'contracts',
        variables: [
            { key: 'payment.payment_number', label: 'Numero de pago', type: 'string', source: 'contract_payments.payment_number' },
            { key: 'payment.amount', label: 'Monto esperado', type: 'currency', source: 'contract_payments.amount' },
            { key: 'payment.amount_paid', label: 'Monto pagado', type: 'currency', source: 'contract_payments.amount_paid' },
            { key: 'payment.amount_pending', label: 'Monto pendiente', type: 'currency', source: 'contract_payments.amount_pending' },
            { key: 'payment.due_date', label: 'Fecha limite', type: 'date', source: 'contract_payments.due_date' },
            { key: 'payment.status', label: 'Estatus', type: 'string', source: 'contract_payments.status' },
        ],
    },
    {
        entity: 'property',
        label: 'Propiedad',
        moduleCode: 'properties',
        variables: [
            { key: 'property.code', label: 'Codigo', type: 'string', source: 'properties.code' },
            { key: 'property.name', label: 'Nombre', type: 'string', source: 'properties.name' },
            { key: 'property.location', label: 'Ubicacion', type: 'string', source: 'properties.location' },
            { key: 'property.total_area', label: 'Area total', type: 'number', source: 'properties.total_area' },
            { key: 'property.total_price', label: 'Precio total', type: 'currency', source: 'properties.total_price' },
            { key: 'property.status', label: 'Estatus', type: 'string', source: 'properties.status' },
        ],
    },
    {
        entity: 'product',
        label: 'Producto',
        moduleCode: 'products',
        variables: [
            { key: 'product.sku', label: 'SKU', type: 'string', source: 'products.sku' },
            { key: 'product.external_sku', label: 'SKU externo', type: 'string', source: 'products.external_sku' },
            { key: 'product.name', label: 'Nombre', type: 'string', source: 'products.name' },
            { key: 'product.description', label: 'Descripcion', type: 'string', source: 'products.description' },
        ],
    },
    {
        entity: 'vendor',
        label: 'Proveedor',
        moduleCode: 'vendors',
        variables: [
            { key: 'vendor.name', label: 'Nombre', type: 'string', source: 'vendors.name' },
            { key: 'vendor.company_name', label: 'Empresa', type: 'string', source: 'vendors.company_name' },
            { key: 'vendor.rfc', label: 'RFC', type: 'string', source: 'vendors.rfc' },
            { key: 'vendor.city', label: 'Ciudad', type: 'string', source: 'vendors.city' },
            { key: 'vendor.state', label: 'Estado', type: 'string', source: 'vendors.state' },
        ],
    },
    {
        entity: 'warehouse',
        label: 'Almacen',
        moduleCode: 'warehouses',
        variables: [
            { key: 'warehouse.name', label: 'Nombre', type: 'string', source: 'warehouses.name' },
            { key: 'warehouse.code', label: 'Codigo', type: 'string', source: 'warehouses.code' },
            { key: 'warehouse.city', label: 'Ciudad', type: 'string', source: 'warehouses.city' },
            { key: 'warehouse.state', label: 'Estado', type: 'string', source: 'warehouses.state' },
        ],
    },
];
//# sourceMappingURL=email-template-variables.registry.js.map