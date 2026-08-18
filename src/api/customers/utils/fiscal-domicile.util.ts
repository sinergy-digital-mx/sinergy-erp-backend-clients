type FiscalDomicileParts = {
  street?: string | null;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  colonia?: string | null;
};

/** Concatena el domicilio SAT para el campo legado `fiscal_address`. */
export function composeFiscalAddress(parts: FiscalDomicileParts): string | null {
  const chunks: string[] = [];
  const street = parts.street?.trim();
  if (street) {
    chunks.push(street);
  }
  const exterior = parts.exteriorNumber?.trim();
  if (exterior) {
    chunks.push(exterior);
  }
  const interior = parts.interiorNumber?.trim();
  if (interior) {
    chunks.push(`Int. ${interior}`);
  }
  const colonia = parts.colonia?.trim();
  if (colonia) {
    chunks.push(`Col. ${colonia}`);
  }
  if (chunks.length === 0) {
    return null;
  }
  return chunks.join(' ').slice(0, 255);
}

export function hasSatStreetParts(dto: {
  fiscal_street?: string;
  fiscal_exterior_number?: string;
  fiscal_interior_number?: string;
  fiscal_colonia?: string;
}): boolean {
  return (
    dto.fiscal_street !== undefined ||
    dto.fiscal_exterior_number !== undefined ||
    dto.fiscal_interior_number !== undefined ||
    dto.fiscal_colonia !== undefined
  );
}
