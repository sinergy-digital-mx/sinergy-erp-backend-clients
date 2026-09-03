export declare class MailerConfigurationEncryptionService {
    private readonly algorithm;
    private readonly encryptionKey;
    constructor();
    encryptSecret(secret: string): {
        encryptedValue: string;
        iv: string;
    };
    encryptResendApiKey(apiKey: string): {
        encryptedKey: string;
        iv: string;
    };
    decryptSecret(encryptedValue: string, iv: string): string;
    decryptResendApiKey(encryptedKey: string, iv: string): string;
    static generateKey(): string;
}
