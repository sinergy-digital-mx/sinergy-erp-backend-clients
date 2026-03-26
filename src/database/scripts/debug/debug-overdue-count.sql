-- Debug overdue count for CONT-3-06

-- Show all payments for the contract
SELECT 
  payment_number,
  payment_date,
  status,
  is_overdue,
  CURDATE() as today,
  CASE WHEN payment_date < CURDATE() THEN 'OVERDUE' ELSE 'NOT OVERDUE' END as calculated_overdue
FROM payments
WHERE contract_id = (SELECT id FROM contracts WHERE contract_number = 'CONT-3-06')
ORDER BY payment_number;

-- Count overdue (using is_overdue flag)
SELECT 
  'Using is_overdue flag' as method,
  COUNT(*) as overdue_count
FROM payments
WHERE contract_id = (SELECT id FROM contracts WHERE contract_number = 'CONT-3-06')
  AND is_overdue = 1
  AND status IN ('pendiente', 'parcial');

-- Count overdue (using payment_date < today)
SELECT 
  'Using payment_date < CURDATE()' as method,
  COUNT(*) as overdue_count
FROM payments
WHERE contract_id = (SELECT id FROM contracts WHERE contract_number = 'CONT-3-06')
  AND payment_date < CURDATE()
  AND status IN ('pendiente', 'parcial');

-- Count all vencido status
SELECT 
  'Using status = vencido' as method,
  COUNT(*) as overdue_count
FROM payments
WHERE contract_id = (SELECT id FROM contracts WHERE contract_number = 'CONT-3-06')
  AND status = 'vencido';
