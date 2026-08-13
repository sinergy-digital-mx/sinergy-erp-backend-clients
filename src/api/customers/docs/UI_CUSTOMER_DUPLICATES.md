# UI — Cliente similar al crear

Guía para Pollux: modal de aviso cuando al **crear** un cliente el correo, teléfono, nombre+apellido o RFC ya existen.

**No bloquea la creación.** Es un “oye, hay uno que parece familiar”. El usuario decide ver el existente o seguir creando.

Solo en **Crear Cliente**. No en editar.

---

## Cuándo consultar

Llamar **antes de `POST /customers`**, cuando haya al menos uno de:

| Campo UI | Body | Match |
|----------|------|-------|
| Email | `email` | Exacto, sin mayúsculas |
| Teléfono | `phone` (+ `phone_code` si lo tienen) | Número nacional |
| Nombre **y** Apellido | `name` + `lastname` | Los dos juntos (no solo nombre) |
| RFC (tab Información Fiscal) | `fiscal_rfc` | Sin espacios/guiones. Se ignoran RFC genéricos `XAXX010101000` y `XEXX010101000` |

Si esos campos van vacíos, no llamar (o el API responde `found: false`).

Opcional: también al salir del campo (blur) con debounce 400 ms. Si ya mostraron el modal para el mismo set de datos, no volver a abrirlo hasta que cambie algún valor.

---

## Endpoint

```
POST /api/tenant/customers/duplicates
Permiso: customers:Create
```

```json
{
  "name": "Juan",
  "lastname": "Pérez",
  "email": "juan@ejemplo.com",
  "phone": "6647945661",
  "phone_code": "+52",
  "fiscal_rfc": "PEGJ800101XXX"
}
```

Enviar solo lo que el usuario ya llenó. No hace falta esperar a que el form esté completo.

### Respuesta

```json
{
  "found": true,
  "matches": [
    {
      "id": 15043,
      "name": "Juan",
      "lastname": "Pérez",
      "email": "juan@ejemplo.com",
      "phone": "6647945661",
      "phone_code": "+52",
      "fiscal_rfc": "PEGJ800101XXX",
      "company_name": "Acme",
      "status": { "id": 1, "code": "ACTIVE", "name": "Activo" },
      "match_reasons": ["email", "name"]
    }
  ]
}
```

| `found` | UI |
|---------|-----|
| `false` o `matches` vacío | No abrir modal. Seguir con `POST /customers`. |
| `true` | Abrir modal. **No** crear todavía. |

Máximo 10 coincidencias.

---

## Modal

Encima del modal Crear Cliente (mismo estilo: bordes redondeados, botón primario morado).

```
┌─────────────────────────────────────────────────────┐
│ Cliente similar encontrado                    [ X ] │
├─────────────────────────────────────────────────────┤
│ Hay un cliente que parece familiar.                 │
│ Revisa si ya existe antes de crear uno nuevo.       │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Juan Pérez                                      │ │
│ │ Coincidió: Correo, Nombre y apellido            │ │
│ │ juan@ejemplo.com · +52 6647945661 · RFC …       │ │
│ │                                      [ Ver ]    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│     [ Continuar de todos modos ]                    │
└─────────────────────────────────────────────────────┘
```

### Copy

| Elemento | Texto |
|----------|-------|
| Título | Cliente similar encontrado |
| Cuerpo (1 match) | Hay un cliente que parece familiar. Revisa si ya existe antes de crear uno nuevo. |
| Cuerpo (varios) | Encontramos clientes con datos similares. Revisa si ya existe antes de crear uno nuevo. |
| Primario | Continuar de todos modos |
| Secundario por fila | Ver |

Cerrar con X = mismo que **Continuar de todos modos** (no cancela el alta; solo cierra el aviso).

### Fila de coincidencia

- Título: `{name} {lastname}` (si falta apellido, solo nombre). Empresa a la derecha o debajo si hay `company_name`.
- Chips / texto de `match_reasons`:

| reason | Label |
|--------|-------|
| `email` | Correo |
| `phone` | Teléfono |
| `name` | Nombre y apellido |
| `rfc` | RFC |

- Línea secundaria: email · teléfono (`phone_code` + `phone`) · RFC. Omitir vacíos.
- **Ver** → ir al detalle `/clientes/:id` (o la ruta que usen). Dejar el modal Crear abierto o cerrarlo; si navegan, cerrar ambos.

### Acciones

| Acción | Comportamiento |
|--------|----------------|
| Continuar de todos modos | Cerrar aviso → `POST /api/tenant/customers` con el form actual. |
| Ver | Abrir el cliente existente. No crear. |
| X | Igual que Continuar de todos modos. |

No mostrar toast de error. No impedir el alta.

---

## Flujo

```
Usuario llena form  →  clic Crear
        ↓
POST /customers/duplicates
        ↓
found === false  →  POST /customers
found === true   →  modal aviso
                     ├─ Ver → detalle del existente
                     └─ Continuar de todos modos → POST /customers
```

Flag en memoria `duplicateWarningAccepted` para no volver a consultar en el mismo intento después de “Continuar de todos modos”.

---

## Checklist Pollux

- [ ] `POST /tenant/customers/duplicates` antes de crear
- [ ] Modal solo si `found === true`
- [ ] Copy: “Hay un cliente que parece familiar”
- [ ] Mostrar por qué coincidió (`match_reasons`)
- [ ] **Ver** → detalle del existente
- [ ] **Continuar de todos modos** → crear igual
- [ ] No usar en editar
- [ ] No bloquear el alta
