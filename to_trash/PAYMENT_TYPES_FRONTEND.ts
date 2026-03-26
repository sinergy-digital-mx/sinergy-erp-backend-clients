// Types para el frontend - Pagos Parciales y Documentos

export type PaymentStatus = 'pendiente' | 'pagado' | 'parcial' | 'vencido' | 'cancelado';

export type PaymentDocumentType = 
  | 'comprobante_transferencia' 
  | 'foto_deposito' 
  | 'recibo' 
  | 'factura' 
  | 'otro';

export interface Payment {
  id: string;
  tenant_id: string;
  contract_id: string;
  payment_number: number;
  
  // Montos
  amount: number; // Monto total esperado
  amount_paid: number; // Monto realmente pagado
  amount_pending: number; // Diferencia pendiente
  
  // Fechas
  due_date: string; // Fecha de vencimiento
  paid_date: string | null; // Fecha del último pago
  first_partial_payment_date: string | null; // Fecha del primer pago parcial
  
  // Estado y método
  status: PaymentStatus;
  payment_method: string | null; // efectivo, transferencia, tarjeta, cheque
  reference_number: string | null;
  
  // Adicionales
  notes: string | null;
  metadata: Record<string, any> | null;
  
  created_at: string;
  updated_at: string;
}

export interface PaymentDocument {
  id: string;
  tenant_id: string;
  payment_id: string;
  document_type: PaymentDocumentType;
  file_name: string;
  s3_key: string;
  mime_type: string;
  file_size: number;
  notes: string | null;
  uploaded_by: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface RecordPartialPaymentDto {
  amount: number;
  payment_date: string; // ISO date string
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

export interface UploadPaymentDocumentDto {
  document_type: PaymentDocumentType;
  notes?: string;
}

export interface PaymentStats {
  total_payments: number;
  paid_count: number;
  partial_count: number;
  pending_count: number;
  overdue_count: number;
  cancelled_count: number;
  total_paid: number;
  total_pending: number;
  next_payment: Payment | null;
}

// Helpers para el frontend

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    parcial: 'Pago Parcial',
    vencido: 'Vencido',
    cancelado: 'Cancelado',
  };
  return labels[status];
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  const colors: Record<PaymentStatus, string> = {
    pendiente: 'warning',
    pagado: 'success',
    parcial: 'info',
    vencido: 'error',
    cancelado: 'default',
  };
  return colors[status];
};

export const getDocumentTypeLabel = (type: PaymentDocumentType): string => {
  const labels: Record<PaymentDocumentType, string> = {
    comprobante_transferencia: 'Comprobante de Transferencia',
    foto_deposito: 'Foto de Depósito',
    recibo: 'Recibo',
    factura: 'Factura',
    otro: 'Otro',
  };
  return labels[type];
};

export const calculatePaymentProgress = (payment: Payment): number => {
  if (payment.amount === 0) return 0;
  return (payment.amount_paid / payment.amount) * 100;
};

export const isPaymentOverdue = (payment: Payment): boolean => {
  if (payment.status === 'pagado' || payment.status === 'cancelado') {
    return false;
  }
  const dueDate = new Date(payment.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Ejemplo de uso en componente React

/*
import { Payment, RecordPartialPaymentDto } from './types';

const PaymentCard = ({ payment }: { payment: Payment }) => {
  const progress = calculatePaymentProgress(payment);
  const statusLabel = getPaymentStatusLabel(payment.status);
  const statusColor = getPaymentStatusColor(payment.status);
  
  return (
    <div className="payment-card">
      <h3>Pago #{payment.payment_number}</h3>
      
      <div className="amounts">
        <div>Monto Total: {formatCurrency(payment.amount)}</div>
        <div>Pagado: {formatCurrency(payment.amount_paid)}</div>
        <div>Pendiente: {formatCurrency(payment.amount_pending)}</div>
      </div>
      
      <div className="progress-bar">
        <div style={{ width: `${progress}%` }} />
      </div>
      
      <div className={`status ${statusColor}`}>
        {statusLabel}
      </div>
      
      {payment.status === 'parcial' && (
        <div className="partial-info">
          Primer pago: {payment.first_partial_payment_date}
        </div>
      )}
    </div>
  );
};

const RecordPartialPaymentForm = ({ paymentId, onSuccess }: Props) => {
  const [formData, setFormData] = useState<RecordPartialPaymentDto>({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transferencia',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch(
      `/tenant/contracts/${contractId}/payments/${paymentId}/partial-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }
    );
    
    if (response.ok) {
      const updatedPayment = await response.json();
      onSuccess(updatedPayment);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
        placeholder="Monto"
      />
      <input
        type="date"
        value={formData.payment_date}
        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
      />
      <select
        value={formData.payment_method}
        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
      >
        <option value="efectivo">Efectivo</option>
        <option value="transferencia">Transferencia</option>
        <option value="tarjeta">Tarjeta</option>
        <option value="cheque">Cheque</option>
      </select>
      <button type="submit">Registrar Pago</button>
    </form>
  );
};

const UploadDocumentForm = ({ paymentId, onSuccess }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<PaymentDocumentType>('comprobante_transferencia');
  const [notes, setNotes] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (notes) formData.append('notes', notes);
    
    const response = await fetch(
      `/tenant/contracts/${contractId}/payments/${paymentId}/documents`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (response.ok) {
      const document = await response.json();
      onSuccess(document);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <select
        value={documentType}
        onChange={(e) => setDocumentType(e.target.value as PaymentDocumentType)}
      >
        <option value="comprobante_transferencia">Comprobante de Transferencia</option>
        <option value="foto_deposito">Foto de Depósito</option>
        <option value="recibo">Recibo</option>
        <option value="factura">Factura</option>
        <option value="otro">Otro</option>
      </select>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas (opcional)"
      />
      <button type="submit">Subir Documento</button>
    </form>
  );
};
*/
