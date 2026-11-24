import {
  buildBranchStockReport,
  selectVisibleBranchIds,
  BranchReportBranchInput,
} from './branch-stock-report.util';

const branches: BranchReportBranchInput[] = [
  { id: 'centro', name: 'Centro', city: 'Tijuana', razon_social: 'Maderería' },
  { id: 'ensenada', name: 'Ensenada', city: 'Ensenada', razon_social: 'Maderería' },
  { id: 'rosarito', name: 'Rosarito', city: 'Rosarito', razon_social: 'Maderería' },
];

describe('selectVisibleBranchIds', () => {
  const ids = ['centro', 'ensenada', 'rosarito'];

  it('shows every branch when nothing is saved', () => {
    expect(selectVisibleBranchIds(ids, null)).toEqual(ids);
    expect(selectVisibleBranchIds(ids, [])).toEqual(ids);
  });

  it('keeps only the saved branches that are still active', () => {
    expect(selectVisibleBranchIds(ids, ['ensenada', 'centro', 'gone'])).toEqual([
      'centro',
      'ensenada',
    ]);
  });

  it('falls back to all branches when the saved list no longer matches', () => {
    expect(selectVisibleBranchIds(ids, ['gone'])).toEqual(ids);
  });
});

describe('buildBranchStockReport', () => {
  it('lists selected branches at zero when the product has no stock', () => {
    const report = buildBranchStockReport(branches, []);

    expect(report.lines).toHaveLength(3);
    expect(report.lines.map((line) => line.name)).toEqual(['Centro', 'Ensenada', 'Rosarito']);
    expect(report.lines.every((line) => line.quantity === '0.000')).toBe(true);
    expect(report.lines.every((line) => line.total_cost === '0.00')).toBe(true);
    expect(report.total_quantity).toBe('0.000');
    expect(report.total_cost).toBe('0.00');
    expect(report.mixed_uom).toBe(false);
    expect(report.cost_complete).toBe(true);
  });

  it('weights the average cost by quantity and keeps a branch at zero', () => {
    const report = buildBranchStockReport(branches, [
      { billing_branch_id: 'ensenada', quantity: 10, uom_name: 'Pieza', unit_cost: 2 },
      { billing_branch_id: 'ensenada', quantity: 30, uom_name: 'Pieza', unit_cost: 4 },
      { billing_branch_id: 'centro', quantity: 5, uom_name: 'Pieza', unit_cost: 10 },
    ]);

    const ensenada = report.lines.find((line) => line.billing_branch_id === 'ensenada');
    const centro = report.lines.find((line) => line.billing_branch_id === 'centro');
    const rosarito = report.lines.find((line) => line.billing_branch_id === 'rosarito');

    expect(ensenada).toMatchObject({
      quantity: '40.000',
      average_unit_cost: '3.50',
      total_cost: '140.00',
      uom_name: 'Pieza',
      cost_complete: true,
    });
    expect(centro).toMatchObject({ quantity: '5.000', total_cost: '50.00' });
    expect(rosarito?.quantity).toBe('0.000');
    expect(report.uom_name).toBe('Pieza');
    expect(report.total_quantity).toBe('45.000');
    expect(report.total_cost).toBe('190.00');
    expect(report.average_unit_cost).toBe('4.2222');
    expect(report.cost_complete).toBe(true);
  });

  it('does not invent a total when part of the stock has no cost', () => {
    const report = buildBranchStockReport(
      [branches[0]],
      [
        { billing_branch_id: 'centro', quantity: 10, uom_name: 'Pieza', unit_cost: 2 },
        { billing_branch_id: 'centro', quantity: 10, uom_name: 'Pieza', unit_cost: null },
      ],
    );

    expect(report.lines[0]).toMatchObject({
      quantity: '20.000',
      average_unit_cost: '2.00',
      total_cost: '20.00',
      cost_complete: false,
    });
    expect(report.total_cost).toBeNull();
    expect(report.cost_complete).toBe(false);
  });

  it('does not add quantities of different units', () => {
    const report = buildBranchStockReport(
      [branches[0]],
      [
        { billing_branch_id: 'centro', quantity: 8, uom_name: 'Pieza', unit_cost: 3 },
        { billing_branch_id: 'centro', quantity: 12, uom_name: 'Caja', unit_cost: 20 },
      ],
    );

    expect(report.mixed_uom).toBe(true);
    expect(report.total_quantity).toBeNull();
    expect(report.total_cost).toBeNull();
    expect(report.lines.map((line) => `${line.uom_name}:${line.quantity}`)).toEqual([
      'Caja:12.000',
      'Pieza:8.000',
    ]);
  });

  it('ignores stock of a branch that is not in the visible list', () => {
    const report = buildBranchStockReport([branches[2]], [
      { billing_branch_id: 'ensenada', quantity: 99, uom_name: 'Pieza', unit_cost: 1 },
    ]);

    expect(report.lines).toHaveLength(1);
    expect(report.lines[0].quantity).toBe('0.000');
    expect(report.total_quantity).toBe('0.000');
  });
});
