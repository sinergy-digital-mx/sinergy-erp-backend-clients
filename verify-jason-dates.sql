USE sinergy_erp_backend_clients;

-- Verificar fecha del contrato
SELECT 
    c.contract_date as fecha_contrato,
    p.code as lote
FROM contracts c 
INNER JOIN properties p ON c.property_id = p.id 
WHERE p.code = 'LOT-1-01' 
AND c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864';

-- Verificar primeros 3 pagos
SELECT 
    payment_number, 
    payment_date, 
    amount_paid, 
    status 
FROM payments 
WHERE contract_id = (
    SELECT c.id 
    FROM contracts c 
    INNER JOIN properties p ON c.property_id = p.id 
    WHERE p.code = 'LOT-1-01' 
    AND c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
) 
ORDER BY payment_number 
LIMIT 3;