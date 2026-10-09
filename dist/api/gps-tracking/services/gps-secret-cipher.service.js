"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GpsSecretCipherService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let GpsSecretCipherService = class GpsSecretCipherService {
    algorithm = 'aes-256-gcm';
    encrypt(secret) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key(), iv);
        const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return {
            encryptedValue: `${authTag.toString('hex')}:${encrypted.toString('hex')}`,
            iv: iv.toString('hex'),
        };
    }
    decrypt(encryptedValue, iv) {
        const parts = encryptedValue.split(':');
        if (parts.length !== 2) {
            throw new common_1.InternalServerErrorException('No se pudo leer la contraseña de rastreo GPS.');
        }
        const decipher = crypto.createDecipheriv(this.algorithm, this.key(), Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(parts[0], 'hex'));
        const plain = Buffer.concat([
            decipher.update(Buffer.from(parts[1], 'hex')),
            decipher.final(),
        ]);
        return plain.toString('utf8');
    }
    key() {
        const keyString = process.env.ENCRYPTION_KEY;
        if (!keyString) {
            throw new common_1.InternalServerErrorException('No se pudo guardar la contraseña de rastreo GPS.');
        }
        const key = Buffer.from(keyString, 'hex');
        if (key.length !== 32) {
            throw new common_1.InternalServerErrorException('No se pudo guardar la contraseña de rastreo GPS.');
        }
        return key;
    }
};
exports.GpsSecretCipherService = GpsSecretCipherService;
exports.GpsSecretCipherService = GpsSecretCipherService = __decorate([
    (0, common_1.Injectable)()
], GpsSecretCipherService);
//# sourceMappingURL=gps-secret-cipher.service.js.map