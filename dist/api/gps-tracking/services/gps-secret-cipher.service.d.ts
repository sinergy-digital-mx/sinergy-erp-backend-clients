export declare class GpsSecretCipherService {
    private readonly algorithm;
    encrypt(secret: string): {
        encryptedValue: string;
        iv: string;
    };
    decrypt(encryptedValue: string, iv: string): string;
    private key;
}
