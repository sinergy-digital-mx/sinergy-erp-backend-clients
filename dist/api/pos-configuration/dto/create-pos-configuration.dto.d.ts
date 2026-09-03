export declare class CreatePosConfigurationDto {
    code: string;
    type: 'VENTAS' | 'COBRANZA';
    sucursal: string;
    modelo?: string;
    status?: number;
}
