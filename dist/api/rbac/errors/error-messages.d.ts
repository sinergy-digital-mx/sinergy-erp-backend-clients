import { RBACErrorCode } from './rbac-error.types';
export declare const ERROR_MESSAGES: Record<RBACErrorCode, {
    technical: string;
    userFriendly: string;
    suggestions: string[];
}>;
export declare function getErrorMessage(code: RBACErrorCode): {
    technical: string;
    userFriendly: string;
    suggestions: string[];
};
export declare function getUserFriendlyMessage(code: RBACErrorCode): string;
export declare function getTechnicalMessage(code: RBACErrorCode): string;
export declare function getErrorSuggestions(code: RBACErrorCode): string[];
