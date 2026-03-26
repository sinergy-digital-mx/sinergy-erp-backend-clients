-- Verify script - Show current vs NEW payment dates for 3 sample contracts

SELECT 
  c.id as contract_id,
  c.contract_number,
  c.contract_date,
  c.payment_months,
  c.monthly_payment,
  p.payment_number,
  p.payment_date as current_payment_date,
  DAY(p.payment_date) as current_day,
  p.status as current_status,
  -- NEW DATE CALCULATION: 5th of each month starting from contract_date month
  DATE(CONCAT(
    YEAR(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (p.payment_number - 1) MONTH)),
    '-',
    MONTH(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (p.payment_number - 1) MONTH)),
    '-05'
  )) as new_payment_date,
  CASE 
    WHEN p.payment_date = DATE(CONCAT(
      YEAR(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (p.payment_number - 1) MONTH)),
      '-',
      MONTH(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (p.payment_number - 1) MONTH)),
      '-05'
    )) THEN 'CORRECT'
    ELSE 'NEEDS FIX'
  END as needs_fix,
  CASE 
    WHEN p.status = 'pagado' THEN 'KEEP PAID'
    ELSE 'KEEP PENDING'
  END as new_status
FROM contracts c
JOIN payments p ON c.id = p.contract_id
WHERE c.status = 'activo'
  AND p.payment_number <= 20
ORDER BY c.contract_date, c.id, p.payment_number
LIMIT 100;
