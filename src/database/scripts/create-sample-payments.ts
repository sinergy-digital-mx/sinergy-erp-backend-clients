import { AppDataSource } from '../data-source';
import { Payment } from '../../entities/payments/payment.entity';
import { Contract } from '../../entities/contracts/contract.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';

async function createSamplePayments() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Get default tenant
    const tenant = await AppDataSource.manager.findOne(RBACTenant, {
      where: { name: 'Divino' },
    });

    if (!tenant) {
      console.log('Default tenant not found');
      return;
    }

    // Get contracts
    const contracts = await AppDataSource.manager.find(Contract, {
      where: { tenant_id: tenant.id },
      take: 3,
    });

    if (contracts.length === 0) {
      console.log('No contracts found');
      return;
    }

    // Create sample payments
    const payments: Payment[] = [];

    // Payment 1 for Contract 1
    const payment1 = AppDataSource.manager.create(Payment, {
      tenant_id: tenant.id,
      contract_id: contracts[0].id,
      payment_number: 'PAY-2025-001',
      payment_date: new Date('2025-01-15'),
      amount_paid: 5000,
      payment_method: 'transferencia',
      status: 'pagado',
      notes: 'First payment received',
    });
    payments.push(payment1);

    // Payment 2 for Contract 1
    const payment2 = AppDataSource.manager.create(Payment, {
      tenant_id: tenant.id,
      contract_id: contracts[0].id,
      payment_number: 'PAY-2025-002',
      payment_date: new Date('2025-02-15'),
      amount_paid: 5000,
      payment_method: 'transferencia',
      status: 'pagado',
      notes: 'Second payment received',
    });
    payments.push(payment2);

    // Payment 3 for Contract 2
    const payment3 = AppDataSource.manager.create(Payment, {
      tenant_id: tenant.id,
      contract_id: contracts[1].id,
      payment_number: 'PAY-2025-003',
      payment_date: new Date('2025-01-20'),
      amount_paid: 3000,
      payment_method: 'efectivo',
      status: 'pagado',
      notes: 'Cash payment',
    });
    payments.push(payment3);

    // Payment 4 for Contract 2 (pending)
    const payment4 = AppDataSource.manager.create(Payment, {
      tenant_id: tenant.id,
      contract_id: contracts[1].id,
      payment_number: 'PAY-2025-004',
      payment_date: new Date('2025-03-15'),
      amount_paid: 3000,
      payment_method: 'tarjeta',
      status: 'pendiente',
      notes: 'Pending payment',
    });
    payments.push(payment4);

    // Payment 5 for Contract 3 (overdue)
    if (contracts.length > 2) {
      const payment5 = AppDataSource.manager.create(Payment, {
        tenant_id: tenant.id,
        contract_id: contracts[2].id,
        payment_number: 'PAY-2025-005',
        payment_date: new Date('2025-01-10'),
        amount_paid: 2500,
        payment_method: 'transferencia',
        status: 'atrasado',
        notes: 'Overdue payment',
      });
      payments.push(payment5);
    }

    // Save all payments
    await AppDataSource.manager.save(Payment, payments);
    console.log(`Created ${payments.length} sample payments`);

    console.log('Sample payments created successfully');
  } catch (error) {
    console.error('Error creating sample payments:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

createSamplePayments();
