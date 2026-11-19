import {
  buildInvoiceWhatsappCaption,
  buildInvoiceWhatsappSvg,
  InvoiceWhatsappImageInput,
  renderInvoiceWhatsappImage,
} from './invoice-whatsapp-image.util';

const pending: InvoiceWhatsappImageInput = {
  paid: false,
  customerName: 'GRUPO MINISTOP DE MEXICO & <SA>',
  issuerName: 'Sinergy Sw Solutions',
  issuerRfc: 'SSS2410213X9',
  invoiceFolio: 'SINSWS-OSV-000022',
  orderFolio: 'OSV-000022',
  uuid: 'A9D48291-31C4-5982-A54D-FF77068521A3',
  totalLabel: '$34,800.00',
  stampedAt: '2 de noviembre de 2026, 2:16 p.m.',
};

describe('invoice-whatsapp-image.util', () => {
  it('arma el aviso de pago pendiente y escapa el nombre', () => {
    const svg = buildInvoiceWhatsappSvg(pending);
    expect(svg).toContain('Tu pago');
    expect(svg).toContain('está pendiente');
    expect(svg).toContain('Pendiente de pago');
    expect(svg).toContain('GRUPO MINISTOP DE MEXICO &amp; &lt;SA&gt;');
    expect(svg).toContain('A9D48291-31C4-5982-A54D-FF77068521A3');
  });

  it('cambia el texto cuando la orden ya está pagada', () => {
    const svg = buildInvoiceWhatsappSvg({ ...pending, paid: true });
    expect(svg).toContain('ya está pagada');
    expect(svg).toContain('Pagado');
    expect(svg).not.toContain('está pendiente');
  });

  it('genera un PNG válido', () => {
    const png = renderInvoiceWhatsappImage(pending);
    expect(png).not.toBeNull();
    expect(png!.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  it('arma el texto del aviso pendiente', () => {
    const caption = buildInvoiceWhatsappCaption(pending);
    expect(caption).toContain('está pendiente');
    expect(caption).toContain('SINSWS-OSV-000022');
    expect(caption).toContain('$34,800.00');
  });
});
