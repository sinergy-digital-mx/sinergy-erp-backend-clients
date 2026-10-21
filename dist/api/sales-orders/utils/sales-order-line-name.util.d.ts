interface NamedLine {
    custom_description?: string | null;
    product?: {
        name?: string | null;
    } | null;
}
export declare function lineConceptName(line: NamedLine, fallback?: string): string;
export {};
