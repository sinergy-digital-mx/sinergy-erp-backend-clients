import { PosUserType, canCoverPosCaja } from './pos-user-type.enum';

describe('canCoverPosCaja', () => {
  it('acepta caja, ventas, ambos y vendedor de piso', () => {
    expect(canCoverPosCaja({ is_pos_user: true, pos_user_type: PosUserType.COBRANZA })).toBe(true);
    expect(canCoverPosCaja({ is_pos_user: 1, pos_user_type: PosUserType.VENTAS })).toBe(true);
    expect(canCoverPosCaja({ is_pos_user: true, pos_user_type: PosUserType.AMBOS })).toBe(true);
    expect(canCoverPosCaja({ is_pos_user: false, pos_user_type: null })).toBe(true);
  });

  it('rechaza una terminal POS sin tipo', () => {
    expect(canCoverPosCaja({ is_pos_user: true, pos_user_type: null })).toBe(false);
  });
});
