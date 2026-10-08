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
const cell = 'padding:10px 12px;border-bottom:1px solid #eef2f7;vertical-align:top;';
function buildSubscriptionSummaryEmail(input) {
    const invoiced = input.months.filter((month) => month.invoiceFolio || month.invoiceUuid).length;
    const paid = input.months.filter((month) => month.paid).length;
    const total = input.months.reduce((sum, month) => sum + month.amount, 0);
    const rows = input.months
        .map((month) => {
        const folio = month.invoiceFolio ? escapeHtml(month.invoiceFolio) : 'Sin factura';
        const uuid = month.invoiceUuid
            ? `<span style="font-family:Consolas,monospace;font-size:11px;color:#334155;">${escapeHtml(month.invoiceUuid)}</span>`
            : '—';
        const payment = month.paid == null
            ? '<span style="color:#94a3b8;">Sin orden</span>'
            : month.paid
                ? '<span style="color:#047857;font-weight:600;">Pagado</span>'
                : '<span style="color:#b45309;font-weight:600;">Pendiente</span>';
        return `<tr>
        <td style="${cell}">${escapeHtml(month.label)}</td>
        <td style="${cell}">${escapeHtml(month.orderFolio || '—')}</td>
        <td style="${cell}">${folio}</td>
        <td style="${cell}">${uuid}</td>
        <td style="${cell}">${payment}</td>
        <td style="${cell}text-align:right;white-space:nowrap;">${money(month.amount)}</td>
      </tr>`;
    })
        .join('');
    const attachment = input.zipFileName
        ? `<p style="margin:16px 0 0;padding:12px 14px;background:#eef2ff;border-radius:10px;color:#312e81;">
        Adjunto <strong>${escapeHtml(input.zipFileName)}</strong> con ${input.pdfCount} PDF${input.pdfCount === 1 ? '' : 's'} de las facturas timbradas.
      </p>`
        : `<p style="margin:16px 0 0;color:#64748b;">Ninguna factura de este periodo tiene PDF para adjuntar.</p>`;
    const html = `<div style="font-family:Inter,Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.5;max-width:760px;">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#6366f1;font-weight:700;">Resumen de servicio</p>
    <h1 style="font-size:22px;margin:0 0 6px;font-weight:650;">${escapeHtml(input.title)}</h1>
    <p style="margin:0 0 16px;color:#475569;">${escapeHtml(input.customerName)}</p>
    <table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin:0 -8px 16px;">
      <tr>
        <td style="background:#f8fafc;border-radius:10px;padding:12px 14px;width:33%;">
          <div style="font-size:11px;color:#64748b;">Vigencia</div>
          <div style="font-weight:600;">${escapeHtml(input.startLabel)} — ${escapeHtml(input.endLabel)}</div>
        </td>
        <td style="background:#f8fafc;border-radius:10px;padding:12px 14px;width:33%;">
          <div style="font-size:11px;color:#64748b;">Mensualidad</div>
          <div style="font-weight:600;">${money(input.monthlyAmount)} + ${input.ivaPercentage}% IVA</div>
        </td>
        <td style="background:#f8fafc;border-radius:10px;padding:12px 14px;width:34%;">
          <div style="font-size:11px;color:#64748b;">Emisor</div>
          <div style="font-weight:600;">${escapeHtml(input.issuerName)}</div>
          <div style="font-size:12px;color:#64748b;">${input.issuerRfc ? escapeHtml(input.issuerRfc) : ''}</div>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 12px;color:#334155;">${input.months.length} meses · ${invoiced} con factura · ${paid} pagados · ${money(total)} acumulado</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#0f172a;color:#fff;text-align:left;">
          <th style="padding:10px 12px;font-weight:600;">Mes</th>
          <th style="padding:10px 12px;font-weight:600;">Orden</th>
          <th style="padding:10px 12px;font-weight:600;">Factura</th>
          <th style="padding:10px 12px;font-weight:600;">UUID</th>
          <th style="padding:10px 12px;font-weight:600;">Pago</th>
          <th style="padding:10px 12px;font-weight:600;text-align:right;">Importe</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${attachment}
  </div>`;
    return {
        subject: `Resumen de servicio: ${input.title}`,
        html,
    };
}
//# sourceMappingURL=service-subscription-summary-email.util.js.map