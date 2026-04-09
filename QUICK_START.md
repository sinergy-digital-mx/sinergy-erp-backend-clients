# 🚀 Quick Start - Exportación de Contratos a Excel

## ⚡ 5 Minutos para Empezar

### Paso 1: Verificar que el Backend Está Listo

```bash
# Compilar
npm run build

# Debería mostrar: ✅ Compilación exitosa
```

### Paso 2: Probar el Endpoint

**Opción A: Con curl**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/tenant/contracts/export/excel"
```

**Opción B: Con Postman**
1. Crear nueva request GET
2. URL: `http://localhost:3001/api/tenant/contracts/export/excel`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Send

**Opción C: Con el script de pruebas**
```bash
chmod +x TEST_EXPORT_ENDPOINT.sh
./TEST_EXPORT_ENDPOINT.sh "your_jwt_token"
```

### Paso 3: Crear el Componente React

Copia este código en `src/components/ContractsExportButton.tsx`:

```typescript
import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';

interface ContractsExportButtonProps {
  filters: {
    customerId?: number;
    propertyId?: string;
    status?: string;
    hasOverdue?: boolean;
    search?: string;
  };
  token: string;
}

export const ContractsExportButton: React.FC<ContractsExportButtonProps> = ({
  filters,
  token,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (filters.customerId) params.append('customerId', filters.customerId.toString());
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.status) params.append('status', filters.status);
      if (filters.hasOverdue) params.append('hasOverdue', 'true');
      if (filters.search) params.append('search', filters.search);

      const url = `${process.env.REACT_APP_API_URL}/api/tenant/contracts/export/excel?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `contratos-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al descargar los contratos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          Descargando...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Descargar Excel
        </>
      )}
    </button>
  );
};
```

### Paso 4: Integrar en tu Página de Contratos

```typescript
import { ContractsExportButton } from './ContractsExportButton';

export const ContractsPage = () => {
  const [filters, setFilters] = useState({
    status: undefined,
    hasOverdue: false,
  });

  const token = localStorage.getItem('authToken');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <div className="flex gap-3">
          <ContractsExportButton filters={filters} token={token} />
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">
            Crear Contrato
          </button>
        </div>
      </div>

      {/* Rest of your component */}
    </div>
  );
};
```

### Paso 5: Probar

1. Abre tu aplicación
2. Ve a la página de contratos
3. Haz clic en "Descargar Excel"
4. Verifica que el archivo se descargue
5. Abre en Excel y verifica los datos

---

## 📊 Qué Incluye el Excel

✅ Número de Contrato
✅ Cliente
✅ Lote
✅ Fecha de Inicio
✅ Precio Total
✅ Enganche
✅ Monto Financiado
✅ Saldo Pendiente
✅ **Meses Pagados** ← Nuevo
✅ **Monto Pagado** ← Nuevo
✅ Próximo Pago
✅ Monto Próximo Pago
✅ Estado
✅ Pagos Vencidos

---

## 🔗 Filtros Soportados

El botón respeta todos los filtros actuales:

```typescript
// Ejemplo: Descargar solo contratos activos con pagos vencidos
<ContractsExportButton 
  filters={{
    status: 'activo',
    hasOverdue: true
  }}
  token={token}
/>
```

---

## 🎨 Personalización

### Cambiar Color del Botón
```typescript
className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg"
```

### Cambiar Texto
```typescript
<Download className="w-4 h-4" />
Mi Botón Personalizado
```

### Solo Icono
```typescript
<button className="p-2 bg-blue-600 text-white rounded-lg">
  <Download className="w-5 h-5" />
</button>
```

---

## 🧪 Pruebas Rápidas

### Test 1: Todos los contratos
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/tenant/contracts/export/excel" \
  -o contratos.xlsx
```

### Test 2: Solo activos
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/tenant/contracts/export/excel?status=activo" \
  -o contratos-activos.xlsx
```

### Test 3: Con pagos vencidos
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/tenant/contracts/export/excel?hasOverdue=true" \
  -o contratos-vencidos.xlsx
```

---

## ❌ Problemas Comunes

### "Error 401"
→ Verifica que el token sea válido

### "El archivo está vacío"
→ Verifica que haya contratos que coincidan con los filtros

### "No se descarga nada"
→ Revisa la consola del navegador (F12)

### "CORS error"
→ Asegúrate de que el backend tenga CORS habilitado

---

## 📚 Documentación Completa

Para más detalles, revisa:
- `CONTRACTS_EXPORT_GUIDE.md` - Guía del endpoint
- `FRONTEND_INTEGRATION_GUIDE.md` - Guía de integración
- `EXPORT_FEATURE_README.md` - Descripción general

---

## ✅ Checklist

- [ ] Backend compilado sin errores
- [ ] Endpoint probado con curl
- [ ] Componente React creado
- [ ] Integrado en página de contratos
- [ ] Botón visible en UI
- [ ] Descarga funciona
- [ ] Datos son correctos
- [ ] Estilos se ven bien

---

## 🎉 ¡Listo!

Ya tienes la exportación de contratos a Excel funcionando. 

**Tiempo total:** ~5-10 minutos

**Próximos pasos:**
1. Probar con diferentes filtros
2. Verificar que los datos sean correctos
3. Ajustar estilos si es necesario
4. Deploy a producción

---

**¿Necesitas ayuda?** Revisa los archivos de documentación en la raíz del proyecto.
