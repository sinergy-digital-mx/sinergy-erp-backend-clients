import { CartaPorteService } from './carta-porte.service';
export declare class CartaPortePdfService {
    private readonly cartaPorte;
    private readonly fonts;
    constructor(cartaPorte: CartaPorteService);
    generate(id: string, tenantId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    private render;
}
