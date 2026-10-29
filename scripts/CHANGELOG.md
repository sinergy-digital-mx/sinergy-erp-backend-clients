# Changelog de solicitudes

Generado desde `scripts/changelog.json`. No editar a mano.

Cada solicitud terminada entra en **Pendientes**. `npm run deploy:both` y `npm run deploy` del backend escriben en el commit solo esas entradas y las pasan a **Enviados**.

## Pendientes

No hay solicitudes pendientes de deploy.

## Enviados

### Versión 0.0.81 · 2026-10-29

- aplicación y servidor · Importar lotes: se quita la columna ubicacion; el grupo de cada fila es la ubicación
- aplicación y servidor · Portal de empleado: horario laboral semanal (lun-dom) que el empleado y RH pueden guardar

### Versión 0.0.80 · 2026-10-28

- aplicación y servidor · En el reporte de ventas a costo promedio, el folio de una cotización abre la cotización igual que el folio de una orden abre la orden.
- aplicación y servidor · Importar lotes: omite filas duplicadas o inválidas, importa el resto y deja lista copiable de las que no entraron

### Versión 0.0.79 · 2026-10-28

- aplicación y servidor · Junto a Editar, chofer y camión muestran palomita o aviso de carta porte en el cursor, y se creó un envío de prueba con la orden OSV-000315 de Rodolfo Sinergy.

### Versión 0.0.78 · 2026-10-28

- aplicación y servidor · En el alta y en un viaje existente, chofer y camión indican si la carta porte está completa y se pueden editar al elegirlos; se crearon 5 choferes y 5 camiones de prueba.

### Versión 0.0.77 · 2026-10-28

- aplicación y servidor · En la carta porte del envío se puede timbrar en demo para ver el PDF de prueba, y esa timbrada se puede reemplazar después por producción.

### Versión 0.0.76 · 2026-10-27

- aplicación y servidor · Las solicitudes del día quedan en un changelog. El deploy escribe en el commit solo las pendientes y después las marca como enviadas.
