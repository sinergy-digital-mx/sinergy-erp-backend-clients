import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';

interface ContractsExportButtonProps {
  customerId?: number;
  propertyId?: string;
  status?: string;
  hasOverdue?: boolean;
  search?: string;
  token: string;
}

export const ContractsExportButton: React.FC<ContractsExportButtonProps> = ({
  customerId,
  propertyId,
  status,
  hasOverdue,
  search,
  token,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', customerId.toString());
      if (propertyId) params.append('propertyId', propertyId);
      if (status) params.append('status', status);
      if (hasOverdue !== undefined) params.append('hasOverdue', hasOverdue.toString());
      if (search) params.append('search', search);

      const url = `/api/tenant/contracts/export/excel?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Create blob and download
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

// Ejemplo de uso en un componente padre:
/*
import { ContractsExportButton } from './ContractsExportButton';

export const ContractsPage = () => {
  const [filters, setFilters] = useState({
    status: 'activo',
    hasOverdue: false,
    search: '',
  });

  const token = localStorage.getItem('token');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <ContractsExportButton
          status={filters.status}
          hasOverdue={filters.hasOverdue}
          search={filters.search}
          token={token}
        />
      </div>
      
      {/* Rest of your component */}
    </div>
  );
};
*/
