# UI — IVA, IEPS y transferencias por razón social

## 2026-11-02

IEPS se valida en todos los documentos de la razón social. Si `ieps_enabled` está apagado, no se muestra ni se calcula.

- Producto: columna y campo de IEPS en precios y costos de proveedor. El catálogo es de la organización: se muestra solo si alguna razón social activa lo tiene prendido. Si se abre el producto desde una orden de esa razón, se usa la opción de esa razón.
- Alta y edición de precio o costo: el porcentaje se guarda en 0 cuando ninguna razón activa usa IEPS.
- Orden de compra y orden de venta: creación, líneas, detalle, edición y la página de detalle de compra.
- Cotización: igual que la orden de venta.
- PDF de compra, venta y cotización: no imprimen la fila IEPS.
- Excel de compra y venta: no llevan columnas IEPS.
- Factura (XML de la orden, autofactura y suscripciones): no incluye el impuesto 003.

## 2026-10-16

El interruptor se llama **Permitir transferencias a otra razón social**. El campo sigue siendo `multi_fiscal_transfers_enabled`. Apagado: esa razón social solo transfiere a sus propios almacenes. La validación corre al armar el destino y otra vez al crear la transferencia.

Fecha: 2026-10-09.

Cada razón social decide si calcula IVA, si calcula IEPS y si puede transferir inventario a otra razón social.

## Dónde

Configuración Fiscal → Razones Sociales → modal Crear / Editar → tab **Impuestos y transferencias**.

| Control | Campo | Efecto |
|---------|-------|--------|
| IVA habilitado | `iva_enabled` | Muestra y calcula IVA en orden de compra, orden de venta y cotización. Apagado: el porcentaje se guarda en 0. |
| IEPS habilitado | `ieps_enabled` | Igual para IEPS. También oculta IEPS en el producto cuando ninguna razón activa lo usa, y en PDF, Excel y factura. |
| Permitir transferencias a otra razón social | `multi_fiscal_transfers_enabled` | Apagado: desde esta razón solo se puede transferir a almacenes de la misma razón. |

Alta nueva: IVA y IEPS vienen marcados. Transferencias multi razón social vienen desmarcadas.

Editar: se cargan los valores guardados. El botón Guardar está en los tabs Configuración, Impuestos y transferencias, y Cotizaciones.

## API

Mismo create/update de razón social:

```
POST /api/tenant/fiscal-configurations
PATCH /api/tenant/fiscal-configurations/:id
```

```ts
{
  iva_enabled: true,
  ieps_enabled: false,
  multi_fiscal_transfers_enabled: false
}
```

Booleanos. El GET de la razón y el árbol de ubicaciones (compras e inventario) ya los incluyen.

Si el dato no viene en una respuesta vieja, la pantalla asume IVA e IEPS encendidos para no ocultarlos por un despliegue a medias.

## Madería

La migración `1792500000000` deja, solo en esa organización:

- `ieps_enabled = 0`
- `multi_fiscal_transfers_enabled = 0`
- `iva_enabled` sigue en 1

El resto de organizaciones conserva los tres en 1, que es el comportamiento que ya tenían.

## Órdenes y cotizaciones

Con el flag apagado:

- No se muestra la columna ni el campo de ese impuesto al crear, agregar o editar líneas.
- El guardado fuerza el porcentaje a 0 aunque el catálogo del producto traiga otro valor.
- El detalle y el PDF omiten la fila de ese impuesto.
- Aplica a orden de compra, orden de venta y cotización de esa razón social.
