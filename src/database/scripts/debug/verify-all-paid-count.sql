-- Verify script - Show ALL payments for 3 sample contracts with paid count

-- First, show the paid count per contract
SELECT 
  c.id as contract_id,
  c.contract_number,
  c.contract_date,
  c.payment_months,
  COUNT(p.id) as total_payments,
  SUM(CASE WHEN p.status = 'pagado' THEN 1 ELSE 0 END) as paid_count,
  SUM(CASE WHEN p.status = 'pendiente' THEN 1 ELSE 0 END) as pending_count
FROM contracts c
LEFT JOIN payments p ON c.id = p.contract_id
WHERE c.status = 'activo'
GROUP BY c.id, c.contract_number, c.contract_date, c.payment_months
ORDER BY c.contract_date
LIMIT 3;

-- Then show ALL payments for those 3 contracts with new dates
SELECT 
  c.id as contract_id,
  c.contract_number,
  c.contract_date,
  p.payment_number,
  p.payment_date as current_payment_date,
  DAY(p.payment_date) as current_day,
  p.status as current_status,
  -- NEW DATE: 5th of each month starting from contract_date month
  DATE(CONCAT(
    YEAR(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (p.payment_number - 1) MONTH)),
    '-',
    MONTH(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (p.payment_number - 1) MONTH)),
    '-05'
  )) as new_date
FROM contracts c
JOIN payments p ON c.id = p.contract_id
WHERE c.status = 'activo'
ORDER BY c.contract_date, c.id, p.payment_number;
