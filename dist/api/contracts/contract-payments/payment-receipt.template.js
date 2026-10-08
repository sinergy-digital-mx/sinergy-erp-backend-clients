"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PAYMENT_RECEIPT_HTML = exports.DEFAULT_PAYMENT_RECEIPT_SUBJECT = exports.PAYMENT_RECEIPT_VARIABLES = exports.PAYMENT_RECEIPT_TEMPLATE_NAME = void 0;
exports.renderPaymentReceiptTemplate = renderPaymentReceiptTemplate;
exports.PAYMENT_RECEIPT_TEMPLATE_NAME = 'Recibo de pago';
exports.PAYMENT_RECEIPT_VARIABLES = [
    { key: 'organization_name', label: 'Razón social' },
    { key: 'organization_rfc', label: 'RFC' },
    { key: 'customer_name', label: 'Cliente' },
    { key: 'contract_number', label: 'Contrato' },
    { key: 'property_code', label: 'Lote' },
    { key: 'payment_number', label: 'Número de pago' },
    { key: 'amount_paid', label: 'Monto pagado' },
    { key: 'amount', label: 'Monto del pago' },
    { key: 'amount_pending', label: 'Saldo del pago' },
    { key: 'payment_date', label: 'Fecha de pago' },
    { key: 'due_date', label: 'Fecha límite' },
    { key: 'payment_method', label: 'Forma de pago' },
    { key: 'status', label: 'Estado' },
    { key: 'extra_message', label: 'Nota del envío' },
];
exports.DEFAULT_PAYMENT_RECEIPT_SUBJECT = 'Recibo {{payment_number}} · {{organization_name}}';
exports.DEFAULT_PAYMENT_RECEIPT_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recibo de pago</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Calibri,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f7;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="background:#1e293b;padding:28px 32px;">
              <p style="margin:0 0 6px;color:#c7d2fe;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;">Recibo de pago</p>
              <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;">{{organization_name}}</h1>
              <p style="margin:8px 0 0;color:#cbd5e1;font-size:13px;">RFC {{organization_rfc}}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hola <strong>{{customer_name}}</strong>,</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155;">
                Este es el recibo del pago <strong>{{payment_number}}</strong> del contrato <strong>{{contract_number}}</strong>, lote <strong>{{property_code}}</strong>.
              </p>
              {{extra_message}}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Fecha de pago</td>
                        <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;">{{payment_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Fecha límite</td>
                        <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;">{{due_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Forma de pago</td>
                        <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;">{{payment_method}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Estado</td>
                        <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;">{{status}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Monto del pago</td>
                        <td align="right" style="padding:6px 0;font-size:13px;">{{amount}}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Saldo del pago</td>
                        <td align="right" style="padding:6px 0;font-size:13px;">{{amount_pending}}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;">Pagado</td>
                        <td align="right" style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:20px;font-weight:800;color:#4338ca;">{{amount_paid}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">El PDF del recibo va adjunto. Conserva este correo como comprobante.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
function renderPaymentReceiptTemplate(template, values) {
    return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => {
        if (key === 'extra_message') {
            return values.extra_message ?? '';
        }
        return escapeHtml(values[key] ?? '');
    });
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
//# sourceMappingURL=payment-receipt.template.js.map