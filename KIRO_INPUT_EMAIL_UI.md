# Input para Kiro - Email Thread UI en Angular

Copia y pega esto en tu proyecto de Angular con Kiro:

---

## 📋 Prompt para Kiro

```
Necesito crear un sistema completo de visualización y gestión de email threads en Angular.

REQUISITOS:

1. **Vista de Threads Globales**
   - Componente que liste todos los threads del tenant
   - Filtros por estado (draft, sent, replied, closed, archived)
   - Búsqueda por asunto
   - Paginación
   - Validación de permisos (EmailThread:Read)

2. **Threads en Lead Detail**
   - Componente que muestre threads relacionados a un lead
   - Threads expandibles/colapsables
   - Al expandir, mostrar todos los correos del thread
   - Botón para crear nuevo correo
   - Validación de permisos

3. **Visualización de Correos**
   - Mostrar correos en orden cronológico
   - Mostrar remitente, destinatario, fecha
   - Mostrar cuerpo (HTML o texto plano)
   - Marcar como leído
   - Mostrar estado (enviado/recibido)

4. **Responder Correos**
   - Formulario para responder
   - Campos: De, Para, CC, BCC, Asunto, Cuerpo
   - Enviar a través de Gmail
   - Validación de permisos (EmailMessage:Create)
   - Loading state mientras se envía

5. **Permisos**
   - Validar EmailThread:Read para ver threads
   - Validar EmailThread:Create para crear threads
   - Validar EmailMessage:Create para enviar mensajes
   - Validar EmailMessage:Read para ver mensajes
   - Mostrar "Sin permiso" si no tiene acceso

ESTRUCTURA:

Componentes:
- EmailThreadsListComponent (lista global de threads)
- EmailThreadDetailComponent (detalles de un thread)
- EmailMessageItemComponent (un correo individual)
- EmailReplyFormComponent (formulario para responder)
- LeadEmailThreadsComponent (threads en lead detail)

Servicios:
- EmailThreadService (llamadas a API)
- EmailPermissionService (validación de permisos)

Modelos:
- EmailThread
- EmailMessage

ENDPOINTS A USAR:

GET /api/tenant/email-threads - Listar threads
GET /api/tenant/email-threads?entityType=lead&entityId=ID - Threads de un lead
GET /api/tenant/email-threads/:threadId - Detalles de thread
GET /api/tenant/email-threads/:threadId/messages - Mensajes de thread
POST /api/tenant/email-threads - Crear thread
POST /api/tenant/email-threads/:threadId/messages - Enviar mensaje
POST /api/tenant/email-threads/:threadId/messages/send-via-gmail - Enviar por Gmail
PUT /api/tenant/email-threads/:threadId/status - Actualizar estado
PUT /api/tenant/email-threads/:threadId/mark-read - Marcar como leído
GET /api/tenant/email-threads/gmail/status - Verificar si Gmail está configurado

VALIDACIONES:

- Validar permisos antes de mostrar cada acción
- Mostrar loading mientras se cargan datos
- Mostrar errores si falla la API
- Validar que el formulario sea válido antes de enviar
- Mostrar confirmación después de enviar

ESTILOS:

- Responsive (móvil y desktop)
- Threads expandibles con animación
- Estados visuales (leído/no leído)
- Colores para diferentes estados (draft, sent, replied, etc)
- Formulario limpio y fácil de usar

INTEGRACIÓN:

- Integrar LeadEmailThreadsComponent en lead-detail.component
- Agregar ruta para vista global de threads
- Agregar en menú de navegación

REFERENCIA:

Ver archivo ANGULAR_EMAIL_UI_SPEC.md para:
- Estructura completa de componentes
- Templates HTML
- Servicios
- Modelos
- Estilos SCSS
- Checklist de implementación
```

---

## 🎯 Alternativa: Prompt Corto

Si prefieres un prompt más conciso:

```
Crea un sistema de email threads en Angular con:

1. Componente para listar todos los threads (con filtros y búsqueda)
2. Componente para mostrar threads en lead detail (expandibles)
3. Componente para ver correos individuales
4. Componente para responder correos (con envío por Gmail)
5. Validación de permisos en cada acción
6. Servicios para llamadas a API
7. Modelos TypeScript

Endpoints disponibles:
- GET /api/tenant/email-threads
- GET /api/tenant/email-threads/:threadId
- GET /api/tenant/email-threads/:threadId/messages
- POST /api/tenant/email-threads/:threadId/messages/send-via-gmail
- PUT /api/tenant/email-threads/:threadId/status

Permisos a validar:
- EmailThread:Read
- EmailThread:Create
- EmailMessage:Create
- EmailMessage:Read

Ver ANGULAR_EMAIL_UI_SPEC.md para especificación completa.
```

---

## 📁 Estructura de Carpetas a Crear

```
src/app/
├── features/
│   ├── email/
│   │   ├── components/
│   │   │   ├── email-threads-list/
│   │   │   ├── email-thread-detail/
│   │   │   ├── email-message-item/
│   │   │   ├── email-reply-form/
│   │   │   └── lead-email-threads/
│   │   ├── services/
│   │   │   ├── email-thread.service.ts
│   │   │   └── email-permission.service.ts
│   │   ├── models/
│   │   │   ├── email-thread.model.ts
│   │   │   └── email-message.model.ts
│   │   └── email.module.ts
│   └── leads/
│       └── components/
│           └── lead-detail/
│               └── lead-detail.component.html (agregar <app-lead-email-threads>)
```

---

## 🔗 Referencia de Documentación

- **ANGULAR_EMAIL_UI_SPEC.md** - Especificación completa con:
  - Estructura de componentes
  - Templates HTML
  - Servicios
  - Modelos
  - Estilos SCSS
  - Checklist de implementación

- **EMAIL_SYSTEM_QUICK_START.md** - Referencia de API

- **GMAIL_CONFIGURATION_SUMMARY.md** - Configuración de Gmail

---

## ✅ Pasos para Usar

1. Copia el prompt (corto o largo) según prefieras
2. Abre tu proyecto de Angular en Kiro
3. Pega el prompt en el chat
4. Kiro creará los componentes, servicios y modelos
5. Integra LeadEmailThreadsComponent en lead-detail
6. Prueba con datos reales

---

## 💡 Tips

- Los componentes validan permisos automáticamente
- Los threads se cargan bajo demanda (cuando se expanden)
- Los correos se muestran en orden cronológico
- Se soporta responder a través de Gmail
- Responsive design para móvil y desktop

---

## 🚀 Resultado Final

Tendrás:
- ✅ Vista global de threads con filtros
- ✅ Threads integrados en lead detail
- ✅ Visualización de correos individuales
- ✅ Capacidad de responder correos
- ✅ Validación de permisos en tiempo real
- ✅ Integración con Gmail
- ✅ Responsive design
- ✅ Manejo de errores y loading states
