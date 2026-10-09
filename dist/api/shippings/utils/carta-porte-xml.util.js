"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCartaPorteXml = buildCartaPorteXml;
const carta_porte_util_1 = require("./carta-porte.util");
function domicilio(address) {
    return `<cartaporte31:Domicilio Calle="${(0, carta_porte_util_1.escapeXml)(address.street.slice(0, 100))}" Estado="${(0, carta_porte_util_1.escapeXml)(address.stateCode)}" Pais="MEX" CodigoPostal="${(0, carta_porte_util_1.escapeXml)(address.postalCode)}"/>`;
}
function ubicacion(tipo, index, location, fechaHora) {
    const prefix = tipo === 'Origen' ? 'OR' : 'DE';
    const id = `${prefix}${String(index).padStart(6, '0')}`;
    const distancia = tipo === 'Destino'
        ? ` DistanciaRecorrida="${(location.distanceKm ?? 0).toFixed(2)}"`
        : '';
    return `<cartaporte31:Ubicacion TipoUbicacion="${tipo}" IDUbicacion="${id}" RFCRemitenteDestinatario="${(0, carta_porte_util_1.escapeXml)(location.rfc)}" NombreRemitenteDestinatario="${(0, carta_porte_util_1.escapeXml)(location.nombre.slice(0, 254))}" FechaHoraSalidaLlegada="${fechaHora}"${distancia}>${domicilio(location.address)}</cartaporte31:Ubicacion>`;
}
function roundShares(total, shares) {
    const rounded = shares.map((value) => Math.round(value * 100) / 100);
    const target = Math.round(total * 100) / 100;
    if (rounded.length) {
        const drift = Math.round((target - rounded.reduce((acc, value) => acc + value, 0)) * 100) / 100;
        rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + drift) * 100) / 100;
    }
    return rounded.map((value) => value.toFixed(2));
}
function sumLabels(labels) {
    const total = labels.reduce((acc, value) => acc + Number(value), 0);
    return total.toFixed(2);
}
function hora(shippingDate, hour) {
    const day = shippingDate.slice(0, 10);
    const hh = String(Math.min(Math.max(hour, 0), 23)).padStart(2, '0');
    return `${day}T${hh}:00:00`;
}
function buildCartaPorteXml(input) {
    const idCcp = input.idCcp ?? (0, carta_porte_util_1.buildIdCcp)();
    const pesoTotal = input.goods.reduce((sum, line) => sum + line.weightKg, 0);
    const distanceLabels = roundShares(input.totalDistanceKm, input.destinations.map((location) => location.distanceKm ?? 0));
    const destinations = input.destinations
        .map((location, index) => ubicacion('Destino', index + 1, { ...location, distanceKm: Number(distanceLabels[index]) }, hora(input.shippingDate, 9 + index)))
        .join('');
    const goods = input.goods
        .map((line) => `<cartaporte31:Mercancia BienesTransp="${(0, carta_porte_util_1.escapeXml)(line.satClave)}" Descripcion="${(0, carta_porte_util_1.escapeXml)(line.description.slice(0, 1000))}" Cantidad="${line.quantity.toFixed(3)}" ClaveUnidad="H87" PesoEnKg="${(0, carta_porte_util_1.kg)(line.weightKg)}"/>`)
        .join('');
    const remolque = input.vehicle.remolqueSubtipo && input.vehicle.remolquePlaca
        ? `<cartaporte31:Remolques><cartaporte31:Remolque SubTipoRem="${(0, carta_porte_util_1.escapeXml)(input.vehicle.remolqueSubtipo)}" Placa="${(0, carta_porte_util_1.escapeXml)((0, carta_porte_util_1.plateCode)(input.vehicle.remolquePlaca))}"/></cartaporte31:Remolques>`
        : '';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:cartaporte31="http://www.sat.gob.mx/CartaPorte31" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/CartaPorte31 http://www.sat.gob.mx/sitio_internet/cfd/CartaPorte/CartaPorte31.xsd" Version="4.0" Folio="${(0, carta_porte_util_1.escapeXml)(input.folio)}" Fecha="${(0, carta_porte_util_1.escapeXml)(input.fecha)}" SubTotal="0.00" Moneda="XXX" Total="0.00" TipoDeComprobante="T" Exportacion="01" LugarExpedicion="${(0, carta_porte_util_1.escapeXml)(input.emisor.postalCode)}">
  <cfdi:Emisor Rfc="${(0, carta_porte_util_1.escapeXml)(input.emisor.rfc)}" Nombre="${(0, carta_porte_util_1.escapeXml)(input.emisor.nombre)}" RegimenFiscal="${(0, carta_porte_util_1.escapeXml)(input.emisor.regimen)}"/>
  <cfdi:Receptor Rfc="${(0, carta_porte_util_1.escapeXml)(input.emisor.rfc)}" Nombre="${(0, carta_porte_util_1.escapeXml)(input.emisor.nombre)}" DomicilioFiscalReceptor="${(0, carta_porte_util_1.escapeXml)(input.emisor.postalCode)}" RegimenFiscalReceptor="${(0, carta_porte_util_1.escapeXml)(input.emisor.regimen)}" UsoCFDI="S01"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="78101800" Cantidad="1" ClaveUnidad="E48" Unidad="Servicio" Descripcion="Traslado de mercancías" ValorUnitario="0" Importe="0" ObjetoImp="01"/>
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <cartaporte31:CartaPorte Version="3.1" IdCCP="${idCcp}" TranspInternac="No" TotalDistRec="${sumLabels(distanceLabels)}">
      <cartaporte31:Ubicaciones>
        ${ubicacion('Origen', 1, input.origin, hora(input.shippingDate, 8))}
        ${destinations}
      </cartaporte31:Ubicaciones>
      <cartaporte31:Mercancias PesoBrutoTotal="${(0, carta_porte_util_1.kg)(pesoTotal)}" UnidadPeso="KGM" NumTotalMercancias="${input.goods.length}">
        ${goods}
        <cartaporte31:Autotransporte PermSCT="${(0, carta_porte_util_1.escapeXml)(input.vehicle.permSct)}" NumPermisoSCT="${(0, carta_porte_util_1.escapeXml)(input.vehicle.numPermisoSct)}">
          <cartaporte31:IdentificacionVehicular ConfigVehicular="${(0, carta_porte_util_1.escapeXml)(input.vehicle.configVehicular)}" PesoBrutoVehicular="${input.vehicle.pesoBrutoVehicularTon.toFixed(3)}" PlacaVM="${(0, carta_porte_util_1.escapeXml)((0, carta_porte_util_1.plateCode)(input.vehicle.placa))}" AnioModelo="${(0, carta_porte_util_1.escapeXml)(input.vehicle.anio)}"/>
          <cartaporte31:Seguros AseguraRespCivil="${(0, carta_porte_util_1.escapeXml)(input.vehicle.aseguraRespCivil)}" PolizaRespCivil="${(0, carta_porte_util_1.escapeXml)(input.vehicle.polizaRespCivil)}"/>
          ${remolque}
        </cartaporte31:Autotransporte>
      </cartaporte31:Mercancias>
      <cartaporte31:FiguraTransporte>
        <cartaporte31:TiposFigura TipoFigura="01" RFCFigura="${(0, carta_porte_util_1.escapeXml)(input.operator.rfc)}" NumLicencia="${(0, carta_porte_util_1.escapeXml)(input.operator.licencia)}" NombreFigura="${(0, carta_porte_util_1.escapeXml)(input.operator.nombre)}"/>
      </cartaporte31:FiguraTransporte>
    </cartaporte31:CartaPorte>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
    return { xml, idCcp };
}
//# sourceMappingURL=carta-porte-xml.util.js.map