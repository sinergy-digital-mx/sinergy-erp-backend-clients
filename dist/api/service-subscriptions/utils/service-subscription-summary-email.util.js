"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSubscriptionSummaryEmail = buildSubscriptionSummaryEmail;
function money(value) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function buildSubscriptionSummaryEmail(input) {
    const invoiced = input.months.filter((month) => month.invoiceLabel).length;
    const paid = input.months.filter((month) => month.paid).length;
    const rows = input.months
        .map((month) => {
        const invoice = month.invoiceLabel ? escapeHtml(month.invoiceLabel) : 'Sin factura';
        const payment = month.paid == null ? 'Sin orden' : month.paid ? 'Pagado' : 'Pendiente de pago';
        return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(month.label)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(month.orderFolio || '—')}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${invoice}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${payment}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(month.amount)}</td>
      </tr>`;
    })
        .join('');
    const html = `<div style="font-family:Inter,Arial,sans-serif;color:#111827;font-size:14px;line-height:1.45;">
    <h1 style="font-size:18px;margin:0 0 8px;">Resumen de servicio</h1>
    <p style="margin:0 0 4px;"><strong>${escapeHtml(input.title)}</strong></p>
    <p style="margin:0 0 4px;">Cliente: ${escapeHtml(input.customerName)}</p>
    <p style="margin:0 0 4px;">Razón social emisora: ${escapeHtml(input.issuerName)}${input.issuerRfc ? ` (${escapeHtml(input.issuerRfc)})` : ''}</p>
    <p style="margin:0 0 4px;">Vigencia: ${escapeHtml(input.startLabel)} — ${escapeHtml(input.endLabel)}</p>
    <p style="margin:0 0 16px;">Mensualidad: ${money(input.monthlyAmount)} + ${input.ivaPercentage}% IVA</p>
    <p style="margin:0 0 12px;">${input.months.length} meses · ${invoiced} con factura · ${paid} pagados</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f8fafc;text-align:left;">
          <th style="padding:8px 10px;">Mes</th>
          <th style="padding:8px 10px;">Orden</th>
          <th style="padding:8px 10px;">Factura</th>
          <th style="padding:8px 10px;">Pago</th>
          <th style="padding:8px 10px;text-align:right;">Importe</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
    return {
        subject: `Resumen de servicio: ${input.title}`,
        html,
    };
}
//# sourceMappingURL=service-subscription-summary-email.util.js.map