# Colores del menú

Fecha: 2026-11-23

## Logo del menú (2026-11-23)

El PNG de la razón social marcada como logo del sistema va en la barra, sin el cuadro blanco. En el menú abierto mide 136×92 px fijos y queda arriba, completo: la lista se desplaza debajo y no lo recorta. En el riel cerrado, 40 px. En la barra del celular, 32 px de alto. En el navegador se guarda a lo más a 272 px de ancho, para que abrir y cerrar el menú no vuelva a escalar la imagen en cada cuadro.

Si el archivo trae fondo blanco pegado al borde, al guardarlo en el navegador se vuelve transparente y se recorta al dibujo. El blanco encerrado dentro del logo se queda.

La pestaña **Logo y color** de la razón social guarda el logo del sistema, la máscara de color y los tres colores del degradado del menú.

## Máscara del logo (2026-11-23)

Junto al logo hay **Agregar máscara de color**. Al activarla se elige un hexadecimal, por defecto `#ffffff`.

La máscara solo pinta el logo del menú. El archivo guardado sigue igual y se sigue usando en documentos.

El dibujo que no es blanco pasa a ese color. El blanco, también el que queda dentro del sello, se vuelve transparente para que se asiente sobre el menú oscuro. Si el archivo es casi todo blanco, la máscara no se aplica y el logo se muestra como está.

## API de la máscara

`PUT /tenant/fiscal-configurations/:id`

```json
{ "logo_mask_color": "#ffffff" }
```

`null` quita la máscara.

`GET /tenant/fiscal-configurations/system-logo` incluye `mask_color` (`#rrggbb` o `null`). La `cache_key` del archivo cambia cuando cambia la máscara, para que el navegador vuelva a armar la imagen.

`GET /tenant/fiscal-configurations/:id/logo-file` devuelve el archivo original, para la vista previa de esta pantalla.

## Degradado

El menú de escritorio no cambia de forma. Sigue siendo vertical, con tres paradas:

| Parada | Campo | Uso |
|--------|--------|-----|
| Arriba `0%` | `brand_color_start` | Inicio del degradado. En celular es el color plano de la barra, del fondo de la pantalla y de la barra del sistema. |
| Centro `50%` | `brand_color_mid` | Mitad del degradado. |
| Abajo `100%` | `brand_color_end` | Final del degradado. |

Vacío en base = colores de Pólux: `#1e1b4b`, `#312e81`, `#4c1d95`.

El texto del menú sigue en blanco. Los tres colores tienen que ser oscuros.

Solo pinta el menú la razón social que tiene **Utilizar como logo del sistema**. En el listado esa fila lleva la marca **Template**, sin otro texto. Las demás pueden guardar sus colores; se aplican si después se marca esa opción. Si ninguna está marcada, el menú queda en Pólux.

## Barras de POS (2026-11-23)

En la misma pestaña, debajo del degradado, hay dos casillas: **POS Ventas** y **POS Caja**. Cada una guarda un color para la barra de arriba de esa pantalla. Pueden repetir el del menú o ser otro, para distinguir la pantalla.

Si la casilla está apagada, esa barra sigue en `#0f172a`. Solo se aplican cuando la razón social es la plantilla del menú. En el listado, la fila muestra **Ventas** o **Caja** con el color guardado.

`pos_sales_bar_color` y `pos_cash_bar_color` viajan en el mismo `PUT`. `null` apaga esa barra. `GET /tenant/fiscal-configurations/system-logo` los trae en `brand.pos_sales` y `brand.pos_cash`. La `cache_key` de `brand` cambia si cambia alguno.

## API

`PUT /tenant/fiscal-configurations/:id`

```json
{
  "brand_color_start": "#1e1b4b",
  "brand_color_mid": "#312e81",
  "brand_color_end": "#4c1d95"
}
```

`null` en los tres restaura Pólux. Cada valor, si viene, es `#` + 6 hexadecimales.

`GET /tenant/fiscal-configurations/system-logo` (el mismo que ya revisa el logo) ahora incluye:

```json
{
  "enabled": true,
  "cache_key": "…",
  "mask_color": "#ffffff",
  "brand": {
    "cache_key": "…",
    "start": "#1e1b4b",
    "mid": "#312e81",
    "end": "#4c1d95",
    "pos_sales": "#1b4332",
    "pos_cash": null
  }
}
```

`brand` siempre trae los colores efectivos de la razón social que es logo del sistema, o los de Pólux si no hay ninguna.

## Caché

La base es la fuente. El navegador guarda los tres colores por organización en `localStorage` (`sinergy.system_brand`) y los pinta antes de la primera pantalla, para no leerlos en cada ruta.

Al entrar al menú se hace una sola consulta (la del logo). Si `brand.cache_key` cambió, se actualizan. Si la persona regresa a la pestaña después de 2 minutos, se vuelve a consultar por si alguien los cambió. Guardar en esta pantalla los aplica de inmediato en este navegador.
