import {
  buildIdCcp,
  escapeXml,
  kg,
  plateCode,
} from './carta-porte.util';

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

function domicilio(address: CartaPorteAddress): string {
    return `<cartaporte31:Domicilio Calle="${escapeXml(address.street.slice(0, 100))}" Estado="${escapeXml(address.stateCode)}" Pais="MEX" CodigoPostal="${escapeXml(address.postalCode)}"/>`;
}
function ubicacion(
  tipo: 'Origen' | 'Destino',
  index: number,
  location: CartaPorteLocation,
  fechaHora: string,
): string {
    const prefix = tipo === 'Origen' ? 'OR' : 'DE';
    const id = `${prefix}${String(index).padStart(6, '0')}`;
    const distancia = tipo === 'Destino'
        ? ` DistanciaRecorrida="${(location.distanceKm ?? 0).toFixed(2)}"`
        : '';
    return `<cartaporte31:Ubicacion TipoUbicacion="${tipo}" IDUbicacion="${id}" RFCRemitenteDestinatario="${escapeXml(location.rfc)}" NombreRemitenteDestinatario="${escapeXml(location.nombre.slice(0, 254))}" FechaHoraSalidaLlegada="${fechaHora}"${distancia}>${domicilio(location.address)}</cartaporte31:Ubicacion>`;
}
function roundShares(total: number, shares: number[]): string[] {
    const rounded = shares.map((value) => Math.round(value * 100) / 100);
    const target = Math.round(total * 100) / 100;
    if (rounded.length) {
        const drift = Math.round((target - rounded.reduce((acc, value) => acc + value, 0)) * 100) / 100;
        rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + drift) * 100) / 100;
    }
    return rounded.map((value) => value.toFixed(2));
}
function sumLabels(labels: string[]): string {
    const total = labels.reduce((acc, value) => acc + Number(value), 0);
    return total.toFixed(2);
}
function hora(shippingDate: string, hour: number): string {
    const day = shippingDate.slice(0, 10);
    const hh = String(Math.min(Math.max(hour, 0), 23)).padStart(2, '0');
    return `${day}T${hh}:00:00`;
}
export function buildCartaPorteXml(input: CartaPorteXmlInput): BuiltCartaPorteXml {
    const idCcp = input.idCcp ?? buildIdCcp();
    const pesoTotal = input.goods.reduce((sum, line) => sum + line.weightKg, 0);
    const distanceLabels = roundShares(input.totalDistanceKm, input.destinations.map((location) => location.distanceKm ?? 0));
    const destinations = input.destinations
        .map((location, index) => ubicacion('Destino', index + 1, { ...location, distanceKm: Number(distanceLabels[index]) }, hora(input.shippingDate, 9 + index)))
        .join('');
    const goods = input.goods
        .map((line) => `<cartaporte31:Mercancia BienesTransp="${escapeXml(line.satClave)}" Descripcion="${escapeXml(line.description.slice(0, 1000))}" Cantidad="${line.quantity.toFixed(3)}" ClaveUnidad="H87" PesoEnKg="${kg(line.weightKg)}"/>`)
        .join('');
    const remolque = input.vehicle.remolqueSubtipo && input.vehicle.remolquePlaca
        ? `<cartaporte31:Remolques><cartaporte31:Remolque SubTipoRem="${escapeXml(input.vehicle.remolqueSubtipo)}" Placa="${escapeXml(plateCode(input.vehicle.remolquePlaca))}"/></cartaporte31:Remolques>`
        : '';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:cartaporte31="http://www.sat.gob.mx/CartaPorte31" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/CartaPorte31 http://www.sat.gob.mx/sitio_internet/cfd/CartaPorte/CartaPorte31.xsd" Version="4.0" Folio="${escapeXml(input.folio)}" Fecha="${escapeXml(input.fecha)}" SubTotal="0.00" Moneda="XXX" Total="0.00" TipoDeComprobante="T" Exportacion="01" LugarExpedicion="${escapeXml(input.emisor.postalCode)}">
  <cfdi:Emisor Rfc="${escapeXml(input.emisor.rfc)}" Nombre="${escapeXml(input.emisor.nombre)}" RegimenFiscal="${escapeXml(input.emisor.regimen)}"/>
  <cfdi:Receptor Rfc="${escapeXml(input.emisor.rfc)}" Nombre="${escapeXml(input.emisor.nombre)}" DomicilioFiscalReceptor="${escapeXml(input.emisor.postalCode)}" RegimenFiscalReceptor="${escapeXml(input.emisor.regimen)}" UsoCFDI="S01"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="78101800" Cantidad="1" ClaveUnidad="E48" Unidad="Servicio" Descripcion="Traslado de mercancías" ValorUnitario="0" Importe="0" ObjetoImp="01"/>
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <cartaporte31:CartaPorte Version="3.1" IdCCP="${idCcp}" TranspInternac="No" TotalDistRec="${sumLabels(distanceLabels)}">
      <cartaporte31:Ubicaciones>
        ${ubicacion('Origen', 1, input.origin, hora(input.shippingDate, 8))}
        ${destinations}
      </cartaporte31:Ubicaciones>
      <cartaporte31:Mercancias PesoBrutoTotal="${kg(pesoTotal)}" UnidadPeso="KGM" NumTotalMercancias="${input.goods.length}">
        ${goods}
        <cartaporte31:Autotransporte PermSCT="${escapeXml(input.vehicle.permSct)}" NumPermisoSCT="${escapeXml(input.vehicle.numPermisoSct)}">
          <cartaporte31:IdentificacionVehicular ConfigVehicular="${escapeXml(input.vehicle.configVehicular)}" PesoBrutoVehicular="${input.vehicle.pesoBrutoVehicularTon.toFixed(3)}" PlacaVM="${escapeXml(plateCode(input.vehicle.placa))}" AnioModelo="${escapeXml(input.vehicle.anio)}"/>
          <cartaporte31:Seguros AseguraRespCivil="${escapeXml(input.vehicle.aseguraRespCivil)}" PolizaRespCivil="${escapeXml(input.vehicle.polizaRespCivil)}"/>
          ${remolque}
        </cartaporte31:Autotransporte>
      </cartaporte31:Mercancias>
      <cartaporte31:FiguraTransporte>
        <cartaporte31:TiposFigura TipoFigura="01" RFCFigura="${escapeXml(input.operator.rfc)}" NumLicencia="${escapeXml(input.operator.licencia)}" NombreFigura="${escapeXml(input.operator.nombre)}"/>
      </cartaporte31:FiguraTransporte>
    </cartaporte31:CartaPorte>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
    return { xml, idCcp };
}
