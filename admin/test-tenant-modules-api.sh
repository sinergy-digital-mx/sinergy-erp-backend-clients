#!/bin/bash

# Script para probar los endpoints de administración de módulos de tenants
# Uso: ./test-tenant-modules-api.sh

API_BASE="http://localhost:3001/api/admin/tenant-modules"

echo "🧪 Testing Tenant Modules Admin API"
echo "===================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Listar todos los tenants
echo -e "${BLUE}1. Listando todos los tenants...${NC}"
echo "GET $API_BASE/tenants"
curl -s "$API_BASE/tenants" | jq '.'
echo ""
echo ""

# 2. Listar todos los módulos
echo -e "${BLUE}2. Listando todos los módulos disponibles...${NC}"
echo "GET $API_BASE/modules"
curl -s "$API_BASE/modules" | jq '.modules[] | {id, name, code}'
echo ""
echo ""

# Pedir al usuario que ingrese un tenant ID
echo -e "${YELLOW}Por favor, copia un tenant ID de la lista anterior:${NC}"
read -p "Tenant ID: " TENANT_ID

if [ -z "$TENANT_ID" ]; then
    echo "❌ No se proporcionó un tenant ID. Saliendo..."
    exit 1
fi

echo ""
echo -e "${GREEN}Usando Tenant ID: $TENANT_ID${NC}"
echo ""

# 3. Listar módulos del tenant
echo -e "${BLUE}3. Listando módulos del tenant...${NC}"
echo "GET $API_BASE/tenants/$TENANT_ID/modules"
curl -s "$API_BASE/tenants/$TENANT_ID/modules" | jq '.'
echo ""
echo ""

# Guardar la respuesta para obtener un module ID
MODULES_RESPONSE=$(curl -s "$API_BASE/tenants/$TENANT_ID/modules")
MODULE_ID=$(echo "$MODULES_RESPONSE" | jq -r '.modules[0].id')

if [ -z "$MODULE_ID" ] || [ "$MODULE_ID" = "null" ]; then
    echo "❌ No se encontraron módulos. Saliendo..."
    exit 1
fi

echo -e "${GREEN}Usando Module ID de ejemplo: $MODULE_ID${NC}"
echo ""

# 4. Habilitar un módulo
echo -e "${BLUE}4. Habilitando módulo...${NC}"
echo "POST $API_BASE/tenants/$TENANT_ID/modules/$MODULE_ID/enable"
curl -s -X POST "$API_BASE/tenants/$TENANT_ID/modules/$MODULE_ID/enable" | jq '.'
echo ""
echo ""

# 5. Verificar que se habilitó
echo -e "${BLUE}5. Verificando estado del módulo...${NC}"
curl -s "$API_BASE/tenants/$TENANT_ID/modules" | jq ".modules[] | select(.id == \"$MODULE_ID\") | {name, code, isEnabled}"
echo ""
echo ""

# 6. Deshabilitar el módulo
echo -e "${BLUE}6. Deshabilitando módulo...${NC}"
echo "POST $API_BASE/tenants/$TENANT_ID/modules/$MODULE_ID/disable"
curl -s -X POST "$API_BASE/tenants/$TENANT_ID/modules/$MODULE_ID/disable" | jq '.'
echo ""
echo ""

# 7. Verificar que se deshabilitó
echo -e "${BLUE}7. Verificando estado del módulo...${NC}"
curl -s "$API_BASE/tenants/$TENANT_ID/modules" | jq ".modules[] | select(.id == \"$MODULE_ID\") | {name, code, isEnabled}"
echo ""
echo ""

# Preguntar si quiere habilitar todos
echo -e "${YELLOW}¿Deseas habilitar TODOS los módulos para este tenant? (y/n)${NC}"
read -p "Respuesta: " ENABLE_ALL

if [ "$ENABLE_ALL" = "y" ] || [ "$ENABLE_ALL" = "Y" ]; then
    echo ""
    echo -e "${BLUE}8. Habilitando todos los módulos...${NC}"
    echo "POST $API_BASE/tenants/$TENANT_ID/modules/enable-all"
    curl -s -X POST "$API_BASE/tenants/$TENANT_ID/modules/enable-all" | jq '.'
    echo ""
    echo ""
    
    echo -e "${BLUE}9. Verificando módulos habilitados...${NC}"
    curl -s "$API_BASE/tenants/$TENANT_ID/modules" | jq '{
        tenant: .tenant.name,
        total: (.modules | length),
        enabled: (.modules | map(select(.isEnabled)) | length),
        disabled: (.modules | map(select(.isEnabled | not)) | length)
    }'
    echo ""
fi

echo ""
echo -e "${GREEN}✅ Pruebas completadas!${NC}"
echo ""
echo "💡 Tip: Abre tenant-modules-admin.html en tu navegador para una interfaz visual"
