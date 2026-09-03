import type { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
export declare function isFinkokAuthenticationFailed(message?: string | null): boolean;
export declare function translateFinkokRegistrationError(message: string | undefined | null, environment?: FinkokEnvironment): string;
