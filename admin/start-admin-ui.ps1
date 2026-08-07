# Script para iniciar el servidor HTTP y abrir la interfaz de administración
# Uso: .\start-admin-ui.ps1

Write-Host "🚀 Iniciando Tenant Modules Admin UI..." -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend esté corriendo
Write-Host "📡 Verificando backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/admin/tenant-modules/tenants" -Method Get -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend está corriendo en puerto 3001" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend NO está corriendo en puerto 3001" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, inicia el backend primero:" -ForegroundColor Yellow
    Write-Host "  npm run start:dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "🌐 Iniciando servidor HTTP en puerto 8000..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Opciones disponibles:" -ForegroundColor Cyan
Write-Host "  1. Python 3 (recomendado)" -ForegroundColor White
Write-Host "  2. Python 2" -ForegroundColor White
Write-Host "  3. Node.js (http-server)" -ForegroundColor White
Write-Host "  4. PHP" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Selecciona una opción (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🐍 Iniciando con Python 3..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Abre tu navegador en: http://localhost:8000/tenant-modules-admin.html" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
        Write-Host ""
        python -m http.server 8000
    }
    "2" {
        Write-Host ""
        Write-Host "🐍 Iniciando con Python 2..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Abre tu navegador en: http://localhost:8000/tenant-modules-admin.html" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
        Write-Host ""
        python -m SimpleHTTPServer 8000
    }
    "3" {
        Write-Host ""
        Write-Host "📦 Verificando http-server..." -ForegroundColor Yellow
        $httpServer = Get-Command http-server -ErrorAction SilentlyContinue
        if (-not $httpServer) {
            Write-Host "❌ http-server no está instalado" -ForegroundColor Red
            Write-Host ""
            Write-Host "Instalando http-server..." -ForegroundColor Yellow
            npm install -g http-server
        }
        Write-Host ""
        Write-Host "🚀 Iniciando con Node.js http-server..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Abre tu navegador en: http://localhost:8000/tenant-modules-admin.html" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
        Write-Host ""
        http-server -p 8000
    }
    "4" {
        Write-Host ""
        Write-Host "🐘 Iniciando con PHP..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Abre tu navegador en: http://localhost:8000/tenant-modules-admin.html" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
        Write-Host ""
        php -S localhost:8000
    }
    default {
        Write-Host ""
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        Write-Host ""
        Write-Host "Intenta manualmente:" -ForegroundColor Yellow
        Write-Host "  python -m http.server 8000" -ForegroundColor White
        Write-Host ""
        Write-Host "Luego abre: http://localhost:8000/tenant-modules-admin.html" -ForegroundColor Cyan
        exit 1
    }
}
