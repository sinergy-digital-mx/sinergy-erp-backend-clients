import {
  mapCollectionChannelByOrderId,
  resolveSalesOrderCollectionChannel,
} from './sales-order-collection-channel.util';

describe('resolveSalesOrderCollectionChannel', () => {
  it('labels POS cobranza from collection record', () => {
    expect(
      resolveSalesOrderCollectionChannel({ hasPosCollection: true }),
    ).toEqual({
      collection_channel: 'pos_cobranza',
      collection_channel_label: 'POS cobranza',
    });
  });

  it('labels POS cobranza from payment source', () => {
    expect(
      resolveSalesOrderCollectionChannel({
        paymentSources: ['pos_cobranza'],
      }),
    ).toEqual({
      collection_channel: 'pos_cobranza',
      collection_channel_label: 'POS cobranza',
    });
  });

  it('labels cobrada manual from payment source', () => {
    expect(
      resolveSalesOrderCollectionChannel({
        paymentSources: ['manual'],
      }),
    ).toEqual({
      collection_channel: 'manual',
      collection_channel_label: 'Cobrada manual',
    });
  });

  it('labels mixed when both channels exist', () => {
    expect(
      resolveSalesOrderCollectionChannel({
        hasPosCollection: true,
        paymentSources: ['manual', 'pos_cobranza'],
      }),
    ).toEqual({
      collection_channel: 'mixed',
      collection_channel_label: 'POS cobranza + Manual',
    });
  });

  it('infers POS cobranza only when there are no payments', () => {
    expect(
      resolveSalesOrderCollectionChannel({
        inferredPosCollection: true,
      }),
    ).toEqual({
      collection_channel: 'pos_cobranza',
      collection_channel_label: 'POS cobranza',
    });
  });

  it('does not infer POS when the order was paid from the OV detail', () => {
    expect(
      resolveSalesOrderCollectionChannel({
        inferredPosCollection: true,
        paymentSources: ['manual'],
      }),
    ).toEqual({
      collection_channel: 'manual',
      collection_channel_label: 'Cobrada manual',
    });
  });

  it('returns null when there is no cobro', () => {
    expect(resolveSalesOrderCollectionChannel({})).toEqual({
      collection_channel: null,
      collection_channel_label: null,
    });
  });
});

describe('mapCollectionChannelByOrderId', () => {
  it('maps each order using collections and payment sources', () => {
    const result = mapCollectionChannelByOrderId(
      [
        { id: 'a', sales_order_type: 'POS', collected_by_user_id: 'u1' },
        { id: 'b', sales_order_type: 'MANUAL', collected_by_user_id: 'u2' },
      ],
      [{ sales_order_id: 'a' }],
      [{ sales_order_id: 'b', source: 'manual' }],
    );

    expect(result.get('a')?.collection_channel).toBe('pos_cobranza');
    expect(result.get('b')?.collection_channel).toBe('manual');
  });
});
