"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stampStatusLabel = stampStatusLabel;
exports.buildSubscriptionSummaryEmail = buildSubscriptionSummaryEmail;
const STAMP_LABELS = {
    pending_stamp: 'Pendiente de timbrar',
    stamped: 'Timbrada',
    stamp_error: 'Error al timbrar',
    cancel_pending: 'Cancelación en proceso',
    cancelled: 'Cancelada',
    cancel_error: 'Error al cancelar',
};
function stampStatusLabel(status) {
    if (!status)
        return null;
    return STAMP_LABELS[status] ?? status;
}
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
function paymentBadge(paid) {
    if (paid == null) {
        return '<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:600;">Sin orden</span>';
    }
    if (paid) {
        return '<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:600;">Pagado</span>';
    }
    return '<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#fffbeb;color:#b45309;font-size:12px;font-weight:600;">Pendiente</span>';
}
function factLine(label, value) {
    return `<tr>
    <td style="padding:7px 10px 7px 0;width:92px;font-size:12px;color:#64748b;vertical-align:top;">${label}</td>
    <td style="padding:7px 0;font-size:13px;color:#0f172a;font-weight:600;vertical-align:top;">${value}</td>
  </tr>`;
}
function metaRow(label, value) {
    return `<tr>
    <td class="meta-label" style="padding:10px 0;width:108px;color:#64748b;font-size:13px;vertical-align:top;">${label}</td>
    <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
  </tr>`;
}
function buildSubscriptionSummaryEmail(input) {
    const invoiced = input.months.filter((month) => month.invoiceFolio || month.invoiceUuid).length;
    const paid = input.months.filter((month) => month.paid).length;
    const months = input.months
        .map((month) => {
        const folio = month.invoiceFolio ? escapeHtml(month.invoiceFolio) : 'Sin factura';
        const order = month.orderFolio ? escapeHtml(month.orderFolio) : '—';
        const factRows = month.invoiceUuid
            ? [
                factLine('Folio', folio),
                factLine('UUID', `<span style="font-family:Consolas,Menlo,monospace;font-size:12px;word-break:break-all;">${escapeHtml(month.invoiceUuid)}</span>`),
                factLine('Timbrado', escapeHtml(month.stampStatus || '—')),
                factLine('SAT', escapeHtml(month.satStatus || '—')),
                factLine('Fecha', escapeHtml(month.stampedAt || '—')),
                factLine('Total CFDI', month.invoiceTotal == null ? '—' : money(month.invoiceTotal)),
            ].join('')
            : `<tr><td colspan="2" style="padding:8px 0;font-size:13px;color:#64748b;">Sin factura timbrada</td></tr>`;
        return `<tr>
        <td style="padding:0 0 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
            <tr>
              <td style="padding:14px 16px 10px;border-bottom:1px solid #eef2f7;border-left:4px solid #4f46e5;border-radius:12px 0 0 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(month.label)}</td>
                    <td align="right" style="font-size:16px;font-weight:700;color:#0f172a;white-space:nowrap;padding-left:12px;">${money(month.amount)}</td>
                  </tr>
                </table>
                <div style="margin-top:8px;">${paymentBadge(month.paid)} <span style="margin-left:8px;font-size:13px;color:#475569;">Orden ${order}</span></div>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 16px 12px;background:#f8fafc;border-radius:0 0 12px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${factRows}</table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
        .join('');
    const attachment = input.zipFileName
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td style="padding:14px 16px;border-radius:12px;background:#eef2ff;">
            <div style="font-size:13px;font-weight:700;color:#312e81;">PDF de las facturas</div>
            <div style="margin-top:4px;font-size:13px;line-height:1.45;color:#4338ca;">
              ${input.pdfCount} archivo${input.pdfCount === 1 ? '' : 's'} en el adjunto ${escapeHtml(input.zipFileName)}.
            </div>
          </td>
        </tr>
      </table>`
        : `<p style="margin:0 0 20px;font-size:13px;color:#64748b;">Ninguna factura de este periodo tiene PDF para adjuntar.</p>`;
    const issuer = input.issuerRfc
        ? `${escapeHtml(input.issuerName)}<br><span style="font-weight:500;color:#64748b;">${escapeHtml(input.issuerRfc)}</span>`
        : escapeHtml(input.issuerName);
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(input.title)}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .shell { width: 100% !important; }
      .pad { padding: 20px 16px !important; }
      .meta-label { display: block !important; width: 100% !important; padding-bottom: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="shell" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="height:4px;background:#4f46e5;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="pad" style="padding:28px 28px 8px;">
              <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6366f1;font-weight:700;">Resumen de servicio</div>
              <h1 style="margin:8px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.25;font-weight:700;color:#0f172a;">${escapeHtml(input.title)}</h1>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;">${escapeHtml(input.customerName)}</div>
            </td>
          </tr>
          <tr>
            <td class="pad" style="padding:8px 28px 4px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eef2f7;border-bottom:1px solid #eef2f7;">
                ${metaRow('Vigencia', `${escapeHtml(input.startLabel)} — ${escapeHtml(input.endLabel)}`)}
                ${metaRow('Mensualidad', `${money(input.monthlyAmount)} + ${input.ivaPercentage}% IVA`)}
                ${metaRow('Emisor', issuer)}
                ${metaRow('Periodos', `${input.months.length} meses · ${invoiced} con factura · ${paid} pagados`)}
              </table>
            </td>
          </tr>
          <tr>
            <td class="pad" style="padding:20px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
              ${attachment}
              <div style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0f172a;">Meses</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${months}</table>
            </td>
          </tr>
          <tr>
            <td class="pad" style="padding:8px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45;color:#94a3b8;">
              Este correo resume el servicio contratado. Los PDF timbrados van en el archivo adjunto.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    return {
        subject: `Resumen de servicio: ${input.title}`,
        html,
    };
}
//# sourceMappingURL=service-subscription-summary-email.util.js.map