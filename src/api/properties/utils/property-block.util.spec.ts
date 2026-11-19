import { listPropertyBlocks } from './property-block.util';

describe('listPropertyBlocks', () => {
  it('quita vacíos y ordena 2 antes de 10', () => {
    expect(listPropertyBlocks(['10', ' 2 ', '', null, '2', 'A'])).toEqual(['2', '10', 'A']);
  });
});
