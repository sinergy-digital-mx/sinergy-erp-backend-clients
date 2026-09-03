type FiscalDomicileParts = {
    street?: string | null;
    exteriorNumber?: string | null;
    interiorNumber?: string | null;
    colonia?: string | null;
};
export declare function composeFiscalAddress(parts: FiscalDomicileParts): string | null;
export declare function hasSatStreetParts(dto: {
    fiscal_street?: string;
    fiscal_exterior_number?: string;
    fiscal_interior_number?: string;
    fiscal_colonia?: string;
}): boolean;
export {};
