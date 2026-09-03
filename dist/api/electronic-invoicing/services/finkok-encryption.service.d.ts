export declare class FinkokEncryptionService {
    private readonly algorithm;
    private readonly encryptionKey;
    constructor();
    encrypt(plaintext: string): {
        encryptedValue: string;
        iv: string;
    };
    decrypt(encryptedValue: string, iv: string): string;
}
