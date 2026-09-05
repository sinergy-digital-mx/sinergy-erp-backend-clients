"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_INVOICE_EMAIL_HTML = exports.DEFAULT_INVOICE_EMAIL_SUBJECT = exports.INVOICE_EMAIL_TEMPLATE_VARIABLES = void 0;
exports.renderInvoiceEmailTemplate = renderInvoiceEmailTemplate;
exports.wrapExtraMessage = wrapExtraMessage;
exports.isLegacyFactoryInvoiceEmailHtml = isLegacyFactoryInvoiceEmailHtml;
exports.INVOICE_EMAIL_TEMPLATE_VARIABLES = [
    { key: 'customer_name', label: 'Nombre del cliente' },
    { key: 'customer_company', label: 'Empresa del cliente' },
    { key: 'issuer_name', label: 'Razón social emisora' },
    { key: 'order_folio', label: 'Folio de la orden' },
    { key: 'invoice_folio', label: 'Serie y folio de la factura' },
    { key: 'uuid', label: 'UUID / folio fiscal' },
    { key: 'total', label: 'Total' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'stamped_at', label: 'Fecha de timbrado' },
    { key: 'extra_message', label: 'Nota personalizada del envío' },
];
exports.DEFAULT_INVOICE_EMAIL_SUBJECT = 'Factura {{invoice_folio}} · {{issuer_name}}';
exports.DEFAULT_INVOICE_EMAIL_HTML = `<!DOCTYPE html>
<html lang="es" style="color-scheme:light only;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>Factura electrónica</title>
  <style>
    :root, html, body { color-scheme: light only; }
    .email-title, .email-title * {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
    .email-kicker, .email-kicker * {
      color: #c7d2fe !important;
      -webkit-text-fill-color: #c7d2fe !important;
    }
    .email-subtitle, .email-subtitle * {
      color: #cbd5e1 !important;
      -webkit-text-fill-color: #cbd5e1 !important;
    }
  </style>
</head>
<body bgcolor="#eef2f7" style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Calibri,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#eef2f7" style="background:#eef2f7;padding:28px 12px;">
    <tr>
      <td align="center" bgcolor="#eef2f7">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width:640px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,0.10);">
          <tr>
            <td class="email-header" bgcolor="#1e293b" style="background:#1e293b;background-color:#1e293b;padding:28px 32px 24px;">
              <p class="email-kicker" style="margin:0 0 6px;color:#c7d2fe;-webkit-text-fill-color:#c7d2fe;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">Factura electrónica CFDI 4.0</p>
              <h1 class="email-title" style="margin:0;color:#ffffff;-webkit-text-fill-color:#ffffff;font-size:26px;line-height:1.2;font-weight:700;">{{issuer_name}}</h1>
              <p class="email-subtitle" style="margin:8px 0 0;color:#cbd5e1;-webkit-text-fill-color:#cbd5e1;font-size:14px;">Comprobante fiscal de la orden {{order_folio}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;background:#ffffff;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#0f172a;">Hola <strong>{{customer_name}}</strong>,</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155;">
                Adjuntamos la factura de <strong>{{customer_company}}</strong> en PDF y XML, lista para tu contabilidad y para el SAT.
              </p>
              {{extra_message}}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f8fafc" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:700;">Resumen de la factura</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Folio</td>
                        <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#0f172a;">{{invoice_folio}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Orden</td>
                        <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#0f172a;">{{order_folio}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Fecha de timbrado</td>
                        <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#0f172a;">{{stamped_at}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Subtotal</td>
                        <td align="right" style="padding:6px 0;font-size:13px;color:#0f172a;">{{subtotal}}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#0f172a;">Total</td>
                        <td align="right" style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:20px;font-weight:800;color:#4338ca;">{{total}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 8px;font-size:12px;color:#64748b;line-height:1.6;word-break:break-all;">
                <strong>Folio fiscal (UUID):</strong> {{uuid}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;background:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#eef2ff" style="background:#eef2ff;border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#312e81;">
                    Este correo incluye el <strong>PDF</strong> de representación impresa y el <strong>XML</strong> del CFDI. Conserva ambos para tu expediente fiscal.
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0;font-size:14px;color:#334155;">Quedamos atentos a cualquier duda.</p>
              <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:#0f172a;">{{issuer_name}}</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f8fafc" style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;line-height:1.6;color:#94a3b8;">
                Documento generado electrónicamente. Puedes verificar el CFDI en el portal del SAT con el UUID.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
function renderInvoiceEmailTemplate(template, values) {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        return values[key] ?? '';
    });
}
function wrapExtraMessage(message) {
    const text = message?.trim();
    if (!text)
        return '';
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br/>');
    return `<p class="email-note" style="margin:0 0 18px;padding:12px 14px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:8px;font-size:14px;line-height:1.6;color:#92400e;">${escaped}</p>`;
}
function isLegacyFactoryInvoiceEmailHtml(html) {
    if (!html)
        return true;
    if (!html.includes('Factura electrónica CFDI 4.0'))
        return false;
    return !html.includes('content="light only"');
}
//# sourceMappingURL=invoice-email-template.default.js.map