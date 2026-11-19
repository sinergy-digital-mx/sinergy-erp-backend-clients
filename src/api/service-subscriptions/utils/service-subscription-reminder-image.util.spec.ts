import * as fs from 'fs';
import {
  buildPaymentReminderCaption,
  buildPaymentReminderSvg,
  PaymentReminderImageInput,
  renderPaymentReminderImage,
} from './service-subscription-reminder-image.util';

const base: PaymentReminderImageInput = {
  title: 'Mantenimiento de plataforma ERP',
  customerName: 'ROBERTO RODRÍGUEZ & HIJOS <SA>',
  issuerName: 'Vexia SA de CV',
  issuerRfc: 'VEX010101AAA',
  monthlyAmount: 10000,
  ivaPercentage: 16,
  totalDue: 11600,
  month: {
    label: 'noviembre 2026',
    amount: 10000,
    orderFolio: 'OSV-000016',
    invoiceFolio: 'A-123',
    invoiceUuid: 'BDCB8FF1-96CC-44E5-8532-B6D3F4265497',
    invoiceTotal: 11600,
    stampStatus: 'Timbrada',
    satStatus: 'Vigente',
    stampedAt: '20 ene 2026, 3:40 p.m.',
    paid: false,
  },
};

describe('service-subscription-reminder-image.util', () => {
  it('escapa el texto del cliente en el SVG', () => {
    const svg = buildPaymentReminderSvg(base);
    expect(svg).toContain('ROBERTO RODRÍGUEZ &amp; HIJOS &lt;SA&gt;');
    expect(svg).toContain('Pendiente de pago');
    expect(svg).toContain('BDCB8FF1-96CC-44E5-8532-B6D3F4265497');
  });

  it('muestra «Sin factura timbrada» cuando el mes no tiene CFDI', () => {
    const svg = buildPaymentReminderSvg({
      ...base,
      month: { ...base.month, invoiceUuid: null, invoiceFolio: null, invoiceTotal: null },
    });
    expect(svg).toContain('Sin factura timbrada');
  });

  it('genera un PNG válido', () => {
    const png = renderPaymentReminderImage(base);
    expect(png).not.toBeNull();
    expect(png!.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    if (process.env.REMINDER_PNG_OUT) fs.writeFileSync(process.env.REMINDER_PNG_OUT, png!);
  });

  it('arma el texto del recordatorio con importe y folios', () => {
    const caption = buildPaymentReminderCaption(base);
    expect(caption).toContain('noviembre 2026');
    expect(caption).toContain('OSV-000016');
    expect(caption).toContain('A-123');
    expect(caption).toMatch(/11,600\.00/);
  });
});
