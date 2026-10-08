export declare const PAYMENT_RECEIPT_TEMPLATE_NAME = "Recibo de pago";
export declare const PAYMENT_RECEIPT_VARIABLES: readonly [{
    readonly key: "organization_name";
    readonly label: "Razón social";
}, {
    readonly key: "organization_rfc";
    readonly label: "RFC";
}, {
    readonly key: "customer_name";
    readonly label: "Cliente";
}, {
    readonly key: "contract_number";
    readonly label: "Contrato";
}, {
    readonly key: "property_code";
    readonly label: "Lote";
}, {
    readonly key: "payment_number";
    readonly label: "Número de pago";
}, {
    readonly key: "amount_paid";
    readonly label: "Monto pagado";
}, {
    readonly key: "amount";
    readonly label: "Monto del pago";
}, {
    readonly key: "amount_pending";
    readonly label: "Saldo del pago";
}, {
    readonly key: "payment_date";
    readonly label: "Fecha de pago";
}, {
    readonly key: "due_date";
    readonly label: "Fecha límite";
}, {
    readonly key: "payment_method";
    readonly label: "Forma de pago";
}, {
    readonly key: "status";
    readonly label: "Estado";
}, {
    readonly key: "extra_message";
    readonly label: "Nota del envío";
}];
export declare const DEFAULT_PAYMENT_RECEIPT_SUBJECT = "Recibo {{payment_number}} \u00B7 {{organization_name}}";
export declare const DEFAULT_PAYMENT_RECEIPT_HTML = "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>Recibo de pago</title>\n</head>\n<body style=\"margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Calibri,Arial,sans-serif;color:#0f172a;\">\n  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#eef2f7;padding:28px 12px;\">\n    <tr>\n      <td align=\"center\">\n        <table role=\"presentation\" width=\"640\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;\">\n          <tr>\n            <td style=\"background:#1e293b;padding:28px 32px;\">\n              <p style=\"margin:0 0 6px;color:#c7d2fe;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;\">Recibo de pago</p>\n              <h1 style=\"margin:0;color:#ffffff;font-size:24px;line-height:1.2;\">{{organization_name}}</h1>\n              <p style=\"margin:8px 0 0;color:#cbd5e1;font-size:13px;\">RFC {{organization_rfc}}</p>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"padding:28px 32px 8px;\">\n              <p style=\"margin:0 0 14px;font-size:16px;line-height:1.6;\">Hola <strong>{{customer_name}}</strong>,</p>\n              <p style=\"margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155;\">\n                Este es el recibo del pago <strong>{{payment_number}}</strong> del contrato <strong>{{contract_number}}</strong>, lote <strong>{{property_code}}</strong>.\n              </p>\n              {{extra_message}}\n              <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;\">\n                <tr>\n                  <td style=\"padding:18px 20px;\">\n                    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n                      <tr>\n                        <td style=\"padding:6px 0;font-size:13px;color:#64748b;\">Fecha de pago</td>\n                        <td align=\"right\" style=\"padding:6px 0;font-size:13px;font-weight:700;\">{{payment_date}}</td>\n                      </tr>\n                      <tr>\n                        <td style=\"padding:6px 0;font-size:13px;color:#64748b;\">Fecha l\u00EDmite</td>\n                        <td align=\"right\" style=\"padding:6px 0;font-size:13px;font-weight:700;\">{{due_date}}</td>\n                      </tr>\n                      <tr>\n                        <td style=\"padding:6px 0;font-size:13px;color:#64748b;\">Forma de pago</td>\n                        <td align=\"right\" style=\"padding:6px 0;font-size:13px;font-weight:700;\">{{payment_method}}</td>\n                      </tr>\n                      <tr>\n                        <td style=\"padding:6px 0;font-size:13px;color:#64748b;\">Estado</td>\n                        <td align=\"right\" style=\"padding:6px 0;font-size:13px;font-weight:700;\">{{status}}</td>\n                      </tr>\n                      <tr>\n                        <td style=\"padding:6px 0;font-size:13px;color:#64748b;\">Monto del pago</td>\n                        <td align=\"right\" style=\"padding:6px 0;font-size:13px;\">{{amount}}</td>\n                      </tr>\n                      <tr>\n                        <td style=\"padding:6px 0;font-size:13px;color:#64748b;\">Saldo del pago</td>\n                        <td align=\"right\" style=\"padding:6px 0;font-size:13px;\">{{amount_pending}}</td>\n                      </tr>\n                      <tr>\n                        <td style=\"padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:14px;font-weight:700;\">Pagado</td>\n                        <td align=\"right\" style=\"padding:10px 0 0;border-top:1px solid #e2e8f0;font-size:20px;font-weight:800;color:#4338ca;\">{{amount_paid}}</td>\n                      </tr>\n                    </table>\n                  </td>\n                </tr>\n              </table>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"padding:8px 32px 28px;\">\n              <p style=\"margin:0;font-size:12px;line-height:1.6;color:#64748b;\">El PDF del recibo va adjunto. Conserva este correo como comprobante.</p>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>";
export declare function renderPaymentReceiptTemplate(template: string, values: Record<string, string>): string;
