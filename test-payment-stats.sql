USE sinergy_erp_backend_clients;

-- Verificar estadísticas de pagos para Jason Gomez LOT-1-01
SELECT 
    'Total Pagos' as tipo,
    COUNT(*) as cantidad
FROM payments 
WHERE contract_id = (
    SELECT c.id 
    FROM contracts c 
    INNER JOIN properties p ON c.property_id = p.id 
    WHERE p.code = 'LOT-1-01' 
    AND c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
)

UNION ALL

SELECT 
    CONCAT('Estado: ', status) as tipo,
    COUNT(*) as cantidad
FROM payments 
WHERE contract_id = (
    SELECT c.id 
    FROM contracts c 
    INNER JOIN properties p ON c.property_id = p.id 
    WHERE p.code = 'LOT-1-01' 
    AND c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
)
GROUP BY status

UNION ALL

SELECT 
    'Total Pagado' as tipo,
    SUM(amount_paid) as cantidad
FROM payments 
WHERE contract_id = (
    SELECT c.id 
    FROM contracts c 
    INNER JOIN properties p ON c.property_id = p.id 
    WHERE p.code = 'LOT-1-01' 
    AND c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
)

UNION ALL

SELECT 
    'Total Pendiente' as tipo,
    SUM(amount_pending) as cantidad
FROM payments 
WHERE contract_id = (
    SELECT c.id 
    FROM contracts c 
    INNER JOIN properties p ON c.property_id = p.id 
    WHERE p.code = 'LOT-1-01' 
    AND c.tenant_id = '54481b63-5516-458d-9bb3-d4e5cb028864'
)

ORDER BY tipo;