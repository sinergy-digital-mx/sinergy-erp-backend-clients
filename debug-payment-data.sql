USE sinergy_erp_backend_clients;

-- Verificar datos del pago específico que está causando problemas
SELECT 
    p.id,
    p.payment_number,
    p.amount,
    p.amount_paid,
    p.amount_pending,
    p.status,
    c.remaining_balance,
    c.id as contract_id
FROM payments p
INNER JOIN contracts c ON p.contract_id = c.id
WHERE p.id = 'a7ee4f3c-b747-4742-a166-5f1017dc3b67'
AND c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864';

-- Verificar si hay valores NULL o problemáticos
SELECT 
    'Payments with NULL amount' as issue,
    COUNT(*) as count
FROM payments p
INNER JOIN contracts c ON p.contract_id = c.id
WHERE c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
AND p.amount IS NULL

UNION ALL

SELECT 
    'Payments with NULL amount_paid' as issue,
    COUNT(*) as count
FROM payments p
INNER JOIN contracts c ON p.contract_id = c.id
WHERE c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
AND p.amount_paid IS NULL

UNION ALL

SELECT 
    'Contracts with NULL remaining_balance' as issue,
    COUNT(*) as count
FROM contracts c
WHERE c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
AND c.remaining_balance IS NULL;