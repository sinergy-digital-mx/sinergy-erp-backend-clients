# Lo Que Falta en la UI - Explicación Visual

## Lo que ves AHORA (Incompleto)

```
┌────────────────────────────────────────────────────────┐
│ Editar Producto - Asignar Unidades                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Unidades Asignadas:                                    │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ✓ Box (10 units)                      [Eliminar] │   │
│ │ ✓ Caja                                [Eliminar] │   │
│ │ ✓ Display                             [Eliminar] │   │
│ │ ✓ Pallet (100 units)                  [Eliminar] │   │
│ │ ✓ Pieza                               [Eliminar] │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ ❌ FALTA: ¿Cómo se relacionan estas unidades?         │
│ ❌ FALTA: ¿Cuántas Piezas hay en una Caja?            │
│ ❌ FALTA: ¿Cuántas Displays hay en una Caja?          │
│                                                        │
│ [Cancelar]                              [Guardar]     │
└────────────────────────────────────────────────────────┘
```

## Lo que DEBERÍA verse (Completo)

```
┌────────────────────────────────────────────────────────┐
│ Editar Producto - Asignar Unidades                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 1️⃣  ASIGNAR NUEVAS UNIDADES                           │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Seleccionar: [Seleccionar ▼]                     │   │
│ │ [Asignar]                                        │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ 2️⃣  UNIDADES ASIGNADAS                                │
│ ┌──────────────────────────────────────────────────┐   │
│ │ ✓ Box (10 units)                      [Eliminar] │   │
│ │ ✓ Caja                                [Eliminar] │   │
│ │ ✓ Display                             [Eliminar] │   │
│ │ ✓ Pallet (100 units)                  [Eliminar] │   │
│ │ ✓ Pieza                               [Eliminar] │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ 3️⃣  RELACIONES DE CONVERSIÓN ← ESTO FALTA             │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Crear Nueva Relación:                            │   │
│ │ De: [Caja ▼]                                     │   │
│ │ A: [Display ▼]                                   │   │
│ │ Factor: [10]                                     │   │
│ │ [Crear Relación]                                 │   │
│ │                                                  │   │
│ │ Relaciones Existentes:                           │   │
│ │ ┌──────────────────────────────────────────────┐ │   │
│ │ │ De      │ A       │ Factor │ Tipo      │ Acc │ │   │
│ │ ├──────────────────────────────────────────────┤ │   │
│ │ │ Caja    │ Display │ 10     │ Explícita │ Del │ │   │
│ │ │ Display │ Pieza   │ 12     │ Explícita │ Del │ │   │
│ │ │ Caja    │ Pieza   │ 120    │ Calculada │ -   │ │   │
│ │ └──────────────────────────────────────────────┘ │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ [Cancelar]                              [Guardar]     │
└────────────────────────────────────────────────────────┘
```

## La Diferencia

### ❌ ANTES (Lo que ves ahora)
```
Solo muestra:
- Lista de UoMs asignadas
- Botón para eliminar cada una

Problemas:
- No sabes cómo se relacionan
- No sabes los factores de conversión
- No puedes crear relaciones
- No sabes si 1 Caja = 10 Displays o 5 Displays
```

### ✅ DESPUÉS (Lo que debería verse)
```
Muestra:
- Sección 1: Asignar nuevas UoMs
- Sección 2: UoMs asignadas
- Sección 3: Relaciones de conversión (NUEVA)
  - Formulario para crear relación
  - Tabla con todas las relaciones
  - Muestra relaciones calculadas

Beneficios:
- Sabes exactamente cómo se relacionan
- Ves los factores de conversión
- Puedes crear nuevas relaciones
- Ves relaciones calculadas automáticamente
```

## Ejemplo Práctico

### Escenario: Producto A (Laptop)

#### AHORA (Incompleto)
```
Ves:
✓ Pieza
✓ Display
✓ Caja

Preguntas sin respuesta:
- ¿Cuántas Piezas hay en una Caja?
- ¿Cuántas Displays hay en una Caja?
- ¿Cómo se relacionan?
```

#### DESPUÉS (Completo)
```
Ves:
✓ Pieza
✓ Display
✓ Caja

Y también ves:
Caja → Display (10)
Display → Pieza (12)
Caja → Pieza (120) [calculada]

Respuestas claras:
- 1 Caja = 10 Displays
- 1 Display = 12 Piezas
- 1 Caja = 120 Piezas
```

## Cómo Agregar la Sección Faltante

### Paso 1: Agregar Formulario
```
De: [Dropdown con UoMs asignadas]
A: [Dropdown con UoMs asignadas]
Factor: [Input numérico]
[Crear Relación]
```

### Paso 2: Agregar Tabla
```
Tabla con columnas:
- De (nombre de UoM)
- A (nombre de UoM)
- Factor (número)
- Tipo (Explícita o Calculada)
- Acciones (Eliminar solo si es Explícita)
```

### Paso 3: Conectar Endpoints
```
GET /api/tenant/products/{id}/uom-relationships
→ Llenar tabla

POST /api/tenant/products/{id}/uom-relationships
→ Crear nueva relación

DELETE /api/tenant/products/{id}/uom-relationships/{id}
→ Eliminar relación
```

## Validaciones Necesarias

### Al Crear Relación
```
✓ Ambas UoMs deben estar asignadas
✓ No puede ser la misma UoM
✓ Factor debe ser > 0
✓ No puede existir ya esa relación
```

### Al Eliminar Relación
```
✓ Solo permitir eliminar explícitas
✓ No permitir eliminar calculadas
```

## Flujo de Datos

```
Usuario selecciona:
De: Caja
A: Display
Factor: 10
[Crear Relación]
↓
POST /api/tenant/products/{id}/uom-relationships
{
  "source_uom_id": "caja-uom-id",
  "target_uom_id": "display-uom-id",
  "conversion_factor": 10
}
↓
GET /api/tenant/products/{id}/uom-relationships
↓
Tabla se actualiza:
Caja → Display (10) [Explícita]
```

## Resumen

| Aspecto | Ahora | Debería |
|---------|-------|---------|
| Muestra UoMs | ✅ | ✅ |
| Muestra relaciones | ❌ | ✅ |
| Muestra factores | ❌ | ✅ |
| Permite crear relaciones | ❌ | ✅ |
| Muestra calculadas | ❌ | ✅ |
| Permite eliminar relaciones | ❌ | ✅ |

## Documentos de Referencia

- `PRODUCT_UOM_RELATIONSHIPS_EXPLAINED.md` - Explicación completa
- `PRODUCT_UOM_UI_MOCKUP_CORRECTED.md` - Mockup visual
- `PRODUCT_UOM_UI_CORRECT_IMPLEMENTATION.md` - Guía de implementación

---

**Conclusión**: La UI actual está **50% completa**. Falta la sección de relaciones de conversión que es **fundamental** para que el sistema funcione correctamente.
