import {
  normalizeCustomerListSettings,
  shouldPrefilterCustomerList,
} from './customer-list-settings.util';

describe('customer-list-settings', () => {
  it('usa sellers cuando no hay configuración', () => {
    expect(normalizeCustomerListSettings(undefined)).toEqual({ prefilter: 'sellers' });
    expect(normalizeCustomerListSettings({ prefilter: 'nope' })).toEqual({ prefilter: 'sellers' });
  });

  it('conserva off, sellers y everyone', () => {
    expect(normalizeCustomerListSettings({ prefilter: 'off' }).prefilter).toBe('off');
    expect(normalizeCustomerListSettings({ prefilter: 'everyone' }).prefilter).toBe('everyone');
  });

  it('decide quién entra prefiltrado', () => {
    expect(shouldPrefilterCustomerList('off', false)).toBe(false);
    expect(shouldPrefilterCustomerList('off', true)).toBe(false);
    expect(shouldPrefilterCustomerList('sellers', false)).toBe(true);
    expect(shouldPrefilterCustomerList('sellers', true)).toBe(false);
    expect(shouldPrefilterCustomerList('everyone', true)).toBe(true);
    expect(shouldPrefilterCustomerList('everyone', false)).toBe(true);
  });
});
