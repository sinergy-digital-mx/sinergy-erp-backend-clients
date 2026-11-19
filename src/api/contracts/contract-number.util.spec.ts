import { buildContractNumberFromPropertyCode } from './contract-number.util';

describe('buildContractNumberFromPropertyCode', () => {
  it('cambia LOT- por CONT- y conserva el resto del código', () => {
    expect(buildContractNumberFromPropertyCode('LOT-THE PLAZA 33')).toBe('CONT-THE PLAZA 33');
    expect(buildContractNumberFromPropertyCode('LOT-3-19')).toBe('CONT-3-19');
  });
});
