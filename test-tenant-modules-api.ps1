# Script para probar los endpoints de administración de módulos de tenants
# Uso: .\test-tenant-modules-api.ps1

$API_BASE = "http://localhost:3001/api/admin/tenant-modules"

Write-Host "🧪 Testing Tenant Modules Admin API" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Listar todos los tenants
Write-Host "1. Listando todos los tenants..." -ForegroundColor Blue
Write-Host "GET $API_BASE/tenants" -ForegroundColor Gray
$tenants = Invoke-RestMethod -Uri "$API_BASE/tenants" -Method Get
$tenants.tenants | Format-Table -Property id, name, subdomain, isActive
Write-Host ""

# 2. Listar todos los módulos
Write-Host "2. Listando todos los módulos disponibles..." -ForegroundColor Blue
Write-Host "GET $API_BASE/modules" -ForegroundColor Gray
$modules = Invoke-RestMethod -Uri "$API_BASE/modules" -Method Get
$modules.modules | Select-Object id, name, code | Format-Table
Write-Host ""

# Pedir al usuario que ingrese un tenant ID
Write-Host "Por favor, copia un tenant ID de la lista anterior:" -ForegroundColor Yellow
$TENANT_ID = Read-Host "Tenant ID"

if ([string]::IsNullOrWhiteSpace($TENANT_ID)) {
    Write-Host "❌ No se proporcionó un tenant ID. Saliendo..." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Usando Tenant ID: $TENANT_ID" -ForegroundColor Green
Write-Host ""

# 3. Listar módulos del tenant
Write-Host "3. Listando módulos del tenant..." -ForegroundColor Blue
Write-Host "GET $API_BASE/tenants/$TENANT_ID/modules" -ForegroundColor Gray
$tenantModules = Invoke-RestMethod -Uri "$API_BASE/tenants/$TENANT_ID/modules" -Method Get

Write-Host "Tenant: $($tenantModules.tenant.name) ($($tenantModules.tenant.subdomain))" -ForegroundColor Cyan
Write-Host ""
$tenantModules.modules | Select-Object name, code, isEnabled | Format-Table
Write-Host ""

# Obtener un module ID de ejemplo
$MODULE_ID = $tenantModules.modules[0].id

if ([string]::IsNullOrWhiteSpace($MODULE_ID)) {
    Write-Host "❌ No se encontraron módulos. Saliendo..." -ForegroundColor Red
    exit 1
}

Write-Host "Usando Module ID de ejemplo: $MODULE_ID" -ForegroundColor Green
Write-Host ""

# 4. Habilitar un módulo
Write-Host "4. Habilitando módulo..." -ForegroundColor Blue
Write-Host "POST $API_BASE/tenants/$TENANT_ID/modules/$MODULE_ID/enable" -ForegroundColor Gray
$enableResult = Invoke-RestMethod -Uri "$API_BASE/tenants/$TENANT_ID/modules/$MODULE_ID/enable" -Method Post
Write-Host $enableResult.message -ForegroundColor Green
Write-Host ""

# 5. Verificar que se habilitó
Write-Host "5. Verificando estado del módulo..." -ForegroundColor Blue
$tenantModules = Invoke-RestMethod -Uri "$API_BASE/tenants/$TENANT_ID/modules" -Method Get
$module = $tenantModules.modules | Where-Object { $_.id -eq $MODULE_ID }
Write-Host "Módulo: $($module.name) - Habilitado: $($module.isEnabled)" -ForegroundColor Cyan
Write-Host ""

# 6. Deshabilitar el módulo
Write-Host "6. Deshabilitando módulo..." -ForegroundColor Blue
Write-Host "POST $API_BASE/tenants/$TENANT_ID/modules/$MODULE_ID/disable" -ForegroundColor Gray
$disableResult = Invoke-RestMethod -Uri "$API_BASE/tenants/$TENANT_ID/modules/$MODULE_ID/disable" -Method Post
Write-Host $disableResult.message -ForegroundColor Yellow
Write-Host ""

# 7. Verificar que se deshabilitó
Write-Host "7. Verificando estado del módulo..." -ForegroundColor Blue
$tenantModules = Invoke-RestMethod -Uri "$API_BASE/tenants/$TENANT_ID/modules" -Method Get
$module = $tenantModules.modules | Where-Object { $_.id -eq $MODULE_ID }
Write-Host "Módulo: $($module.name) - Habilitado: $($module.isEnabled)" -ForegroundColor Cyan
Write-Host ""

# Preguntar si quiere habilitar todos
Write-Host "¿Deseas habilitar TODOS los módulos para este tenant? (y/n)" -ForegroundColor Yellow
$ENABLE_ALL = Read-Host "Respuesta"

if ($ENABLE_ALL -eq "y" -or $ENABLE_ALL -eq "Y") {
    Write-Host ""
    Write-Host "8. Habilitando todos los módulos..." -ForegroundColor Blue
    Write-Host "POST $API_BASE/tenants/$TENANT_ID/modules/enable-all" -ForegroundColor Gray
    $enableAllResult = Invoke-RestMethod -Uri "$API_BASE/tenants/$TENANT_ID/modules/enable-all" -Method Post
    Write-Host $enableAllResult.message -ForegroundColor Green
    Write-Host ""
    
    Write-Host "9. Verificando módulos habilitados..." -ForegroundColor Blue
    $tenantModules = Invoke-RestMethod -Uri "$API_BASE/tenants/$TENANT_ID/modules" -Method Get
    $enabled = ($tenantModules.modules | Where-Object { $_.isEnabled }).Count
    $disabled = ($tenantModules.modules | Where-Object { -not $_.isEnabled }).Count
    
    Write-Host "Tenant: $($tenantModules.tenant.name)" -ForegroundColor Cyan
    Write-Host "Total módulos: $($tenantModules.modules.Count)" -ForegroundColor Cyan
    Write-Host "Habilitados: $enabled" -ForegroundColor Green
    Write-Host "Deshabilitados: $disabled" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "✅ Pruebas completadas!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Abre tenant-modules-admin.html en tu navegador para una interfaz visual" -ForegroundColor Cyan
