#!/bin/bash

# Script para iniciar el servidor HTTP y abrir la interfaz de administración
# Uso: ./start-admin-ui.sh

echo "🚀 Iniciando Tenant Modules Admin UI..."
echo ""

# Verificar que el backend esté corriendo
echo "📡 Verificando backend..."
if curl -s -f http://localhost:3001/api/admin/tenant-modules/tenants > /dev/null 2>&1; then
    echo "✅ Backend está corriendo en puerto 3001"
else
    echo "❌ Backend NO está corriendo en puerto 3001"
    echo ""
    echo "Por favor, inicia el backend primero:"
    echo "  npm run start:dev"
    echo ""
    exit 1
fi

echo ""
echo "🌐 Iniciando servidor HTTP en puerto 8000..."
echo ""
echo "📋 Opciones disponibles:"
echo "  1. Python 3 (recomendado)"
echo "  2. Python 2"
echo "  3. Node.js (http-server)"
echo "  4. PHP"
echo ""

read -p "Selecciona una opción (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🐍 Iniciando con Python 3..."
        echo ""
        echo "Abre tu navegador en: http://localhost:8000/tenant-modules-admin.html"
        echo ""
        echo "Presiona Ctrl+C para detener el servidor"
        echo ""
        python3 -m http.server 8000
        ;;
    2)
        echo ""
        echo "🐍 Iniciando con Python 2..."
        echo ""
        echo "Abre tu navegador en: http://localhost:8000/tenant-modules-admin.html"
        echo ""
        echo "Presiona Ctrl+C para detener el servidor"
        echo ""
        python -m SimpleHTTPServer 8000
        ;;
    3)
        echo ""
        echo "📦 Verificando http-server..."
        if ! command -v http-server &> /dev/null; then
            echo "❌ http-server no está instalado"
            echo ""
            echo "Instalando http-server..."
            npm install -g http-server
        fi
        echo ""
        echo "🚀 Iniciando con Node.js http-server..."
        echo ""
        echo "Abre tu navegador en: http://localhost:8000/tenant-modules-admin.html"
        echo ""
        echo "Presiona Ctrl+C para detener el servidor"
        echo ""
        http-server -p 8000
        ;;
    4)
        echo ""
        echo "🐘 Iniciando con PHP..."
        echo ""
        echo "Abre tu navegador en: http://localhost:8000/tenant-modules-admin.html"
        echo ""
        echo "Presiona Ctrl+C para detener el servidor"
        echo ""
        php -S localhost:8000
        ;;
    *)
        echo ""
        echo "❌ Opción inválida"
        echo ""
        echo "Intenta manualmente:"
        echo "  python3 -m http.server 8000"
        echo ""
        echo "Luego abre: http://localhost:8000/tenant-modules-admin.html"
        exit 1
        ;;
esac
