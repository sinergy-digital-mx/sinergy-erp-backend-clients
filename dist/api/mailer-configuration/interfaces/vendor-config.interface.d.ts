export interface ResendConfig {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
    replyTo?: string;
    publicKey?: string;
}
export interface SendGridConfig {
    apiKey: string;
    senderEmail?: string;
}
export interface AwsSesConfig {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}
export interface SmtpConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    useTls?: boolean;
}
export type VendorConfig = ResendConfig | SendGridConfig | AwsSesConfig | SmtpConfig;
