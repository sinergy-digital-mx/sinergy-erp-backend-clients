-- Verify script - Show how payments would look after regeneration, ordered by new date

SELECT 
  c.contract_number,
  c.contract_date,
  p.payment_number,
  p.payment_date as current_payment_date,
  p.status as current_status,
  -- NEW DATE: 5th of each month starting from contract_date month
  DATE(CONCAT(
    YEAR(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (p.payment_number - 1) MONTH)),
    '-',
    MONTH(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (p.payment_number - 1) MONTH)),
    '-05'
  )) as new_date,
  -- After regeneration: first 26 will be "pagado", rest "pendiente"
  CASE 
    WHEN p.payment_number <= (
      SELECT COUNT(*) FROM payments p2 
      WHERE p2.contract_id = c.id AND p2.status = 'pagado'
    ) THEN 'pagado'
    ELSE 'pendiente'
  END as new_status
FROM contracts c
JOIN payments p ON c.id = p.contract_id
WHERE c.status = 'activo'
ORDER BY c.contract_number, new_date;
