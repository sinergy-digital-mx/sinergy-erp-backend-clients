USE sinergy_erp_backend_clients;

-- Verificar que Jason Gomez LOT-1-01 tenga los campos correctos
SELECT 
    CAST(payment_number AS UNSIGNED) as num,
    payment_number,
    amount,
    amount_paid,
    amount_pending,
    due_date,
    payment_date,
    paid_date,
    status
FROM payments 
WHERE contract_id = (
    SELECT c.id 
    FROM contracts c 
    INNER JOIN properties p ON c.property_id = p.id 
    WHERE p.code = 'LOT-1-01' 
    AND c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
) 
ORDER BY CAST(payment_number AS UNSIGNED) ASC
LIMIT 10;