export declare class EncryptionService {
    private readonly algorithm;
    private readonly encryptionKey;
    constructor();
    encrypt(plaintext: string): string;
    decrypt(encryptedData: string): string;
    static generateKey(): string;
}
