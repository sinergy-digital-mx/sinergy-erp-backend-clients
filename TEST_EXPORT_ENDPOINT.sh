#!/bin/bash

# Script para probar el endpoint de exportación de contratos a Excel
# Uso: ./TEST_EXPORT_ENDPOINT.sh <TOKEN> [FILTROS]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
API_URL="http://localhost:3001"
TOKEN="${1:-}"
OUTPUT_DIR="./downloads"

# Validar token
if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: Token JWT requerido${NC}"
    echo "Uso: $0 <TOKEN> [FILTROS]"
    echo ""
    echo "Ejemplos:"
    echo "  $0 eyJhbGc..."
    echo "  $0 eyJhbGc... status=activo"
    echo "  $0 eyJhbGc... hasOverdue=true"
    echo "  $0 eyJhbGc... status=activo&hasOverdue=true"
    exit 1
fi

# Crear directorio de descargas
mkdir -p "$OUTPUT_DIR"

# Función para descargar
download_contracts() {
    local filters="$1"
    local filename="$2"
    local description="$3"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Descargando: $description${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    local url="$API_URL/api/tenant/contracts/export/excel"
    if [ -n "$filters" ]; then
        url="$url?$filters"
    fi
    
    echo -e "${BLUE}URL:${NC} $url"
    echo ""
    
    # Realizar descarga
    curl -s -H "Authorization: Bearer $TOKEN" \
         -H "Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" \
         -o "$OUTPUT_DIR/$filename" \
         -w "\n${GREEN}Status: %{http_code}${NC}\n" \
         "$url"
    
    # Verificar si el archivo se descargó
    if [ -f "$OUTPUT_DIR/$filename" ]; then
        local size=$(du -h "$OUTPUT_DIR/$filename" | cut -f1)
        echo -e "${GREEN}✓ Archivo descargado: $OUTPUT_DIR/$filename ($size)${NC}"
    else
        echo -e "${RED}✗ Error al descargar el archivo${NC}"
    fi
    
    echo ""
}

# Pruebas
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     PRUEBAS DE EXPORTACIÓN DE CONTRATOS A EXCEL                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Test 1: Todos los contratos
download_contracts "" "contratos-todos.xlsx" "Todos los contratos"

# Test 2: Solo activos
download_contracts "status=activo" "contratos-activos.xlsx" "Contratos activos"

# Test 3: Solo completados
download_contracts "status=completado" "contratos-completados.xlsx" "Contratos completados"

# Test 4: Con pagos vencidos
download_contracts "hasOverdue=true" "contratos-vencidos.xlsx" "Contratos con pagos vencidos"

# Test 5: Activos con pagos vencidos
download_contracts "status=activo&hasOverdue=true" "contratos-activos-vencidos.xlsx" "Contratos activos con pagos vencidos"

# Test 6: Con búsqueda (ejemplo con cliente)
download_contracts "search=Jacobo" "contratos-jacobo.xlsx" "Contratos con búsqueda 'Jacobo'"

# Test 7: Con cliente específico (ID 85)
download_contracts "customerId=85" "contratos-cliente-85.xlsx" "Contratos del cliente 85"

# Test 8: Múltiples filtros
download_contracts "status=activo&hasOverdue=true&search=Mario" "contratos-filtrados.xlsx" "Contratos con múltiples filtros"

# Resumen
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    RESUMEN DE DESCARGAS                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}Archivos descargados en: $OUTPUT_DIR${NC}"
echo ""
ls -lh "$OUTPUT_DIR"/*.xlsx 2>/dev/null || echo "No se encontraron archivos"
echo ""

# Instrucciones
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Abre los archivos Excel descargados"
echo "2. Verifica que los datos sean correctos"
echo "3. Compara con el listado paginado en la UI"
echo "4. Verifica que los estilos se hayan aplicado correctamente"
echo ""

echo -e "${GREEN}✓ Pruebas completadas${NC}"
