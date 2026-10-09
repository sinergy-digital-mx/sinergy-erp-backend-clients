export interface CartaPorteParty {
    rfc: string;
    nombre: string;
    regimen: string;
    postalCode: string;
}
export interface CartaPorteAddress {
    street: string;
    stateCode: string;
    postalCode: string;
}
export interface CartaPorteLocation {
    rfc: string;
    nombre: string;
    address: CartaPorteAddress;
    distanceKm?: number;
}
export interface CartaPorteGoodsLine {
    satClave: string;
    description: string;
    quantity: number;
    weightKg: number;
}
export interface CartaPorteVehicle {
    permSct: string;
    numPermisoSct: string;
    configVehicular: string;
    pesoBrutoVehicularTon: number;
    placa: string;
    anio: string;
    aseguraRespCivil: string;
    polizaRespCivil: string;
    remolqueSubtipo?: string | null;
    remolquePlaca?: string | null;
}
export interface CartaPorteOperator {
    rfc: string;
    licencia: string;
    nombre: string;
}
export interface CartaPorteXmlInput {
    folio: string;
    fecha: string;
    shippingDate: string;
    totalDistanceKm: number;
    emisor: CartaPorteParty;
    origin: CartaPorteLocation;
    destinations: CartaPorteLocation[];
    goods: CartaPorteGoodsLine[];
    vehicle: CartaPorteVehicle;
    operator: CartaPorteOperator;
    idCcp?: string;
}
export interface BuiltCartaPorteXml {
    xml: string;
    idCcp: string;
}
export declare function buildCartaPorteXml(input: CartaPorteXmlInput): BuiltCartaPorteXml;
