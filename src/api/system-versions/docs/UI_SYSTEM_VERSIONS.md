# UI — Versiones

Historial de actualizaciones del sistema, separado por organización. La tarjeta solo aparece en Configuración → Sistema si el tenant tiene el módulo `system-versions` habilitado y el rol trae `system-versions:ViewMenu` o `system-versions:Read`.

## Lectura

```
GET /api/tenant/system-versions?page=1&limit=20&search=
GET /api/tenant/system-versions/latest
```

Cada fila incluye `version`, `channel` (`frontend`, `backend` o `full`), `title`, `changes` (`{ scope, message }`) y `released_at`. `changes.scope` es `frontend` (aplicación) o `backend` (servidor).

**2026-10-26.** `changes` solo trae módulos habilitados para esa organización. Contratos, inmuebles, CRM u otro módulo apagado no aparecen en el historial ni en el aviso de actualización. El aviso ya no lista el archivo público `app-version.json`; pide `GET /tenant/system-versions/latest`.

**2026-11-02.** El listado ya no lee `system_versions`. El catálogo queda en memoria (`releases.generated.ts`, máximo 200) y cada petición lo filtra con los módulos activos de esa organización. La primera lectura de módulos se reutiliza un minuto; `latest` y el historial comparten esa caché. `limit` acepta hasta 200. La pantalla pide una sola página (50, hoy cubre todo el historial), la guarda en la sesión de esa organización y pagina y busca en el cliente.

**2026-11-02.** El aviso «Hay una actualización» lista las notas que el deploy escribió en `app-version.json`. No llama a `GET /tenant/system-versions/latest`. «Ver todas las versiones» abre `/settings/versions`, donde el historial sí queda filtrado por los módulos de la organización.

Si el módulo está apagado para el tenant, responde 403.

## Publicación

`npm run deploy` y `npm run deploy:both` agregan la versión al catálogo. No insertan una fila por organización: al abrir Versiones, el backend filtra ese catálogo con los módulos activos de quien consulta.

- `npm run deploy` en el backend publica los cambios del backend.
- `npm run deploy` en el frontend publica los cambios del frontend.
- `npm run deploy:both` publica una sola versión con los dos. Esa es la que muestra el aviso "Hay una actualización".

Cada deploy toma los commits nuevos y, si el commit solo dice "Deploying version", los módulos cuyos archivos cambiaron desde la versión anterior.

**2026-10-27.** Las solicitudes del día se anotan en `scripts/changelog.json` (lectura en `scripts/CHANGELOG.md`): pendientes hasta el deploy, enviadas después. `npm run deploy:both` y `npm run deploy` del backend escriben en el mensaje del commit solo las pendientes y, al commitear, las pasan a enviadas. El aviso de actualización sigue armándose con los commits y los módulos tocados.

El aviso de actualización lista las notas de `app-version.json`. Si el rol puede ver versiones, el botón «Ver todas las versiones» abre `/settings/versions`.

**2026-10-27.** En Firefox el aviso se reabría solo: la animación de entrada se reiniciaba y, al pulsar «Más tarde», el foco de la ventana lo volvía a mostrar. «Más tarde» queda guardado para esa compilación durante la sesión. «Actualizar ahora» recarga sin reutilizar la página en caché.

La migración `1794100000000` sigue creando el módulo y los permisos. La pantalla no depende de las filas de `system_versions`.
