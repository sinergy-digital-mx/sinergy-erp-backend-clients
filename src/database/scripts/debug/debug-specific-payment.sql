USE sinergy_erp_backend_clients;

-- Verificar datos específicos del pago problemático
SELECT 
    'Payment Data' as section,
    p.id,
    p.payment_number,
    p.amount,
    p.amount_paid,
    p.amount_pending,
    p.status,
    p.payment_date,
    p.due_date,
    p.paid_date
FROM payments p
WHERE p.id = 'a7ee4f3c-b747-4742-a166-5f1017dc3b67';

-- Verificar datos del contrato relacionado
SELECT 
    'Contract Data' as section,
    c.id,
    c.remaining_balance,
    c.contract_date,
    c.payment_due_day,
    p.code as property_code
FROM contracts c
INNER JOIN properties p ON c.property_id = p.id
WHERE c.id = (
    SELECT contract_id 
    FROM payments 
    WHERE id = 'a7ee4f3c-b747-4742-a166-5f1017dc3b67'
);

-- Verificar tipos de datos y posibles problemas
SELECT 
    'Data Types Check' as section,
    TYPEOF(amount) as amount_type,
    TYPEOF(amount_paid) as amount_paid_type,
    TYPEOF(amount_pending) as amount_pending_type,
    amount,
    amount_paid,
    amount_pending
FROM payments 
WHERE id = 'a7ee4f3c-b747-4742-a166-5f1017dc3b67';