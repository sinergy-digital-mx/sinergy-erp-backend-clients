# Guía de Integración Frontend - Botón de Descarga de Contratos

## 📍 Ubicación del Botón

Basándome en tu screenshot, el botón debe ir en la esquina superior derecha, junto al botón "Crear Contrato".

## 🎯 Implementación Paso a Paso

### Paso 1: Crear el Componente del Botón

Crea un nuevo archivo: `src/components/ContractsExportButton.tsx`

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

      // Build query parameters from filters
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

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Create blob and trigger download
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
      console.error('Error downloading contracts:', error);
      alert('Error al descargar los contratos. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      title="Descargar contratos filtrados en Excel"
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

### Paso 2: Integrar en tu Componente de Contratos

En tu componente principal de contratos (donde está el listado):

```typescript
import { ContractsExportButton } from './ContractsExportButton';

export const ContractsPage = () => {
  const [filters, setFilters] = useState({
    customerId: undefined,
    propertyId: undefined,
    status: undefined,
    hasOverdue: false,
    search: '',
  });

  const token = localStorage.getItem('authToken'); // Ajusta según tu forma de guardar el token

  return (
    <div className="p-6">
      {/* Header con título y botones */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        
        <div className="flex gap-3">
          {/* Botón de descarga */}
          <ContractsExportButton
            filters={filters}
            token={token}
          />
          
          {/* Botón de crear contrato (existente) */}
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Crear Contrato
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-4">
        {/* Tus filtros aquí */}
      </div>

      {/* Tabla de contratos */}
      <div className="bg-white rounded-lg shadow">
        {/* Tu tabla aquí */}
      </div>
    </div>
  );
};
```

### Paso 3: Actualizar los Filtros

Cuando el usuario cambie los filtros, actualiza el estado:

```typescript
const handleStatusChange = (status: string) => {
  setFilters(prev => ({
    ...prev,
    status: status === 'todos' ? undefined : status
  }));
};

const handleOverdueChange = (hasOverdue: boolean) => {
  setFilters(prev => ({
    ...prev,
    hasOverdue
  }));
};

const handleSearch = (search: string) => {
  setFilters(prev => ({
    ...prev,
    search
  }));
};
```

## 🎨 Estilos Alternativos

### Opción 1: Botón con Icono Descarga (Recomendado)
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  <Download className="w-4 h-4" />
  Descargar Excel
</button>
```

### Opción 2: Botón Compacto (Solo Icono)
```tsx
<button 
  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  title="Descargar en Excel"
>
  <Download className="w-5 h-5" />
</button>
```

### Opción 3: Botón con Dropdown
```tsx
<div className="relative group">
  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
    <Download className="w-4 h-4" />
    Descargar
  </button>
  <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
    <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
      📊 Excel
    </button>
    <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
      📄 PDF
    </button>
  </div>
</div>
```

## 🔄 Sincronización con Filtros

El botón debe estar sincronizado con los filtros actuales. Aquí hay un ejemplo completo:

```typescript
export const ContractsPage = () => {
  const [filters, setFilters] = useState({
    customerId: undefined,
    propertyId: undefined,
    status: undefined,
    hasOverdue: false,
    search: '',
    page: 1,
    limit: 20,
  });

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('authToken');

  // Cargar contratos cuando cambien los filtros
  useEffect(() => {
    fetchContracts();
  }, [filters]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.customerId) params.append('customerId', filters.customerId.toString());
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.status) params.append('status', filters.status);
      if (filters.hasOverdue) params.append('hasOverdue', 'true');
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/tenant/contracts?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setContracts(data.data);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Filtros y tabla */}
    </div>
  );
};
```

## 📱 Responsive Design

Para que el botón sea responsive en móviles:

```tsx
<button className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg text-sm md:text-base">
  <Download className="w-4 h-4" />
  <span className="hidden md:inline">Descargar Excel</span>
  <span className="md:hidden">Descargar</span>
</button>
```

## 🧪 Pruebas

1. **Sin filtros**: Descargar todos los contratos
2. **Con estado**: Descargar solo activos/completados
3. **Con búsqueda**: Descargar resultados de búsqueda
4. **Con múltiples filtros**: Combinar varios filtros
5. **Verificar datos**: Comparar con el listado paginado

## 🐛 Troubleshooting

### El botón no descarga nada
- Verifica que el token sea válido
- Revisa la consola del navegador para errores
- Asegúrate de que la URL de la API sea correcta

### El archivo Excel está vacío
- Verifica que haya contratos que coincidan con los filtros
- Revisa que los filtros se estén pasando correctamente

### Error de CORS
- Asegúrate de que el backend tenga CORS habilitado
- Verifica que la URL de la API sea correcta

## 📚 Variables de Entorno

Asegúrate de tener en tu `.env`:

```
REACT_APP_API_URL=http://localhost:3001
```

O ajusta según tu configuración.
