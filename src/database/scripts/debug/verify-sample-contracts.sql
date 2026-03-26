-- Verify script - Show 3 sample contracts with first 20 payments

-- Get 3 sample contracts with their details and first 20 payments
SELECT 
  c.id as contract_id,
  c.contract_number,
  c.contract_date,
  c.payment_months,
  c.monthly_payment,
  c.total_price,
  c.down_payment,
  c.remaining_balance,
  c.status,
  p.payment_number,
  p.payment_date,
  DAY(p.payment_date) as day_of_month,
  p.status as payment_status,
  p.amount_paid,
  p.amount_pending,
  p.paid_date,
  CASE 
    WHEN DAY(p.payment_date) = 5 THEN 'OK'
    ELSE 'WRONG - should be 05'
  END as date_check
FROM contracts c
LEFT JOIN payments p ON c.id = p.contract_id
WHERE c.status = 'activo'
  AND (p.payment_number IS NULL OR p.payment_number <= 20)
ORDER BY c.contract_date, c.id, p.payment_number
LIMIT 100;
