USE sinergy_erp_backend_clients;

-- Verificar que Jason Gomez LOT-1-01 tenga los valores correctos
SELECT 
    CAST(payment_number AS UNSIGNED) as num,
    amount as monto_mensual_fijo,
    amount_paid as pagado_realmente,
    amount_pending as pendiente,
    status,
    due_date as vencimiento,
    paid_date as fecha_pago
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

-- Verificar estadísticas generales
SELECT 
    status,
    COUNT(*) as cantidad,
    SUM(amount) as total_esperado,
    SUM(amount_paid) as total_pagado,
    SUM(amount_pending) as total_pendiente
FROM payments p
INNER JOIN contracts c ON p.contract_id = c.id
WHERE c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
GROUP BY status;