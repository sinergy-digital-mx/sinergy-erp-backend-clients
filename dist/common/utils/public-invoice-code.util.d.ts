export declare function buildPublicInvoiceCode(fiscalPrefix: string | null | undefined, branchPrefix: string | null | undefined, orderFolio: string, fallbackFiscalName?: string | null, fallbackBranchName?: string | null): string;
export declare function extractInvoiceSequence(folio: string): string;
export declare function fallbackDocumentPrefix(configured: string | null | undefined, sourceName: string | null | undefined, length: number): string;
export declare function slugPrefix(value: string | null | undefined, length: number): string;
export declare function normalizePublicInvoiceCode(value: string | null | undefined): string;
export declare function resolveSelfInvoicePortalOrigin(configured?: string | undefined): string;
export declare function buildSelfInvoicePortalUrl(publicInvoiceCode: string, email?: string | null, configuredBase?: string | undefined): string;
export declare function withCollisionSuffix(code: string, uniquePart: string): string;
