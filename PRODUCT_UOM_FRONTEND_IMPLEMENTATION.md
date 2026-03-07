# Product UoM Frontend - Implementación Completa

## Lo que ya tienes

```
3️⃣  Relaciones de Conversión
├─ Dropdown: De (origen)
├─ Dropdown: A (destino)
├─ Input: Factor
├─ Botón: Crear
└─ Mensaje: "No hay relaciones de conversión"
```

## Lo que necesitas hacer

### 1. Llenar los Dropdowns

Los dropdowns deben mostrar **solo las UoMs asignadas** al producto.

```typescript
// Obtener UoMs asignadas
GET /api/tenant/products/{productId}/uoms

// Respuesta:
[
  {
    "id": "uom-1",
    "product_id": "prod-123",
    "uom_catalog_id": "pieza-id",
    "catalog": {
      "id": "pieza-id",
      "name": "Pieza",
      "description": "Individual unit"
    }
  },
  {
    "id": "uom-2",
    "product_id": "prod-123",
    "uom_catalog_id": "display-id",
    "catalog": {
      "id": "display-id",
      "name": "Display",
      "description": "Display package"
    }
  },
  {
    "id": "uom-3",
    "product_id": "prod-123",
    "uom_catalog_id": "caja-id",
    "catalog": {
      "id": "caja-id",
      "name": "Caja",
      "description": "Complete box"
    }
  }
]

// Llenar dropdowns:
De (origen): [Pieza, Display, Caja]
A (destino): [Pieza, Display, Caja]
```

### 2. Crear Relación

Cuando el usuario hace clic en "Crear":

```typescript
// Validaciones
if (!sourceUomId) {
  mostrar error: "Selecciona una UoM de origen"
  return
}

if (!targetUomId) {
  mostrar error: "Selecciona una UoM de destino"
  return
}

if (sourceUomId === targetUomId) {
  mostrar error: "No puedes relacionar una UoM consigo misma"
  return
}

if (!factor || factor <= 0) {
  mostrar error: "El factor debe ser mayor a 0"
  return
}

// Crear relación
POST /api/tenant/products/{productId}/uom-relationships
{
  "source_uom_id": sourceUomId,
  "target_uom_id": targetUomId,
  "conversion_factor": factor
}

// Si es exitoso:
- Limpiar formulario
- Recargar relaciones
- Mostrar mensaje de éxito
```

### 3. Mostrar Relaciones

Después de crear, obtener todas las relaciones:

```typescript
GET /api/tenant/products/{productId}/uom-relationships

// Respuesta:
[
  {
    "id": "rel-1",
    "product_id": "prod-123",
    "source_uom_id": "uom-3",
    "target_uom_id": "uom-2",
    "conversion_factor": 10,
    "created_at": "2026-03-07T00:00:00Z"
  },
  {
    "id": "rel-2",
    "product_id": "prod-123",
    "source_uom_id": "uom-2",
    "target_uom_id": "uom-1",
    "conversion_factor": 12,
    "created_at": "2026-03-07T00:00:00Z"
  },
  {
    "id": "rel-3",
    "product_id": "prod-123",
    "source_uom_id": "uom-3",
    "target_uom_id": "uom-1",
    "conversion_factor": 120,
    "created_at": "2026-03-07T00:00:00Z",
    "calculated": true
  }
]

// Mostrar en tabla:
┌─────────────────────────────────────────────────────┐
│ De      │ A       │ Factor │ Tipo      │ Acciones   │
├─────────────────────────────────────────────────────┤
│ Caja    │ Display │ 10     │ Explícita │ [Eliminar] │
│ Display │ Pieza   │ 12     │ Explícita │ [Eliminar] │
│ Caja    │ Pieza   │ 120    │ Calculada │ -          │
└─────────────────────────────────────────────────────┘
```

## Código TypeScript Necesario

### Component State

```typescript
interface UoMAsignada {
  id: string;
  product_id: string;
  uom_catalog_id: string;
  catalog: {
    id: string;
    name: string;
    description: string;
  };
}

interface Relacion {
  id: string;
  product_id: string;
  source_uom_id: string;
  target_uom_id: string;
  conversion_factor: number;
  calculated?: boolean;
}

interface ComponentState {
  uomsAsignadas: UoMAsignada[];
  relaciones: Relacion[];
  formData: {
    sourceUomId: string;
    targetUomId: string;
    factor: number;
  };
  loading: boolean;
  error: string | null;
  success: string | null;
}
```

### Métodos Necesarios

```typescript
// 1. Cargar UoMs asignadas
async loadUoMs() {
  try {
    this.loading = true;
    const response = await fetch(
      `/api/tenant/products/${this.productId}/uoms`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    this.uomsAsignadas = await response.json();
  } catch (error) {
    this.error = 'Error al cargar UoMs';
  } finally {
    this.loading = false;
  }
}

// 2. Cargar relaciones
async loadRelaciones() {
  try {
    this.loading = true;
    const response = await fetch(
      `/api/tenant/products/${this.productId}/uom-relationships`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    this.relaciones = await response.json();
  } catch (error) {
    this.error = 'Error al cargar relaciones';
  } finally {
    this.loading = false;
  }
}

// 3. Crear relación
async crearRelacion() {
  // Validaciones
  if (!this.formData.sourceUomId) {
    this.error = 'Selecciona una UoM de origen';
    return;
  }

  if (!this.formData.targetUomId) {
    this.error = 'Selecciona una UoM de destino';
    return;
  }

  if (this.formData.sourceUomId === this.formData.targetUomId) {
    this.error = 'No puedes relacionar una UoM consigo misma';
    return;
  }

  if (!this.formData.factor || this.formData.factor <= 0) {
    this.error = 'El factor debe ser mayor a 0';
    return;
  }

  try {
    this.loading = true;
    const response = await fetch(
      `/api/tenant/products/${this.productId}/uom-relationships`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_uom_id: this.formData.sourceUomId,
          target_uom_id: this.formData.targetUomId,
          conversion_factor: this.formData.factor
        })
      }
    );

    if (response.ok) {
      this.success = 'Relación creada exitosamente';
      this.formData = { sourceUomId: '', targetUomId: '', factor: 0 };
      await this.loadRelaciones();
    } else {
      const error = await response.json();
      this.error = error.message || 'Error al crear relación';
    }
  } catch (error) {
    this.error = 'Error al crear relación';
  } finally {
    this.loading = false;
  }
}

// 4. Eliminar relación
async eliminarRelacion(relationId: string) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta relación?')) {
    return;
  }

  try {
    this.loading = true;
    const response = await fetch(
      `/api/tenant/products/${this.productId}/uom-relationships/${relationId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    if (response.ok) {
      this.success = 'Relación eliminada exitosamente';
      await this.loadRelaciones();
    } else {
      this.error = 'Error al eliminar relación';
    }
  } catch (error) {
    this.error = 'Error al eliminar relación';
  } finally {
    this.loading = false;
  }
}

// 5. Obtener nombre de UoM
getNombreUoM(uomId: string): string {
  const uom = this.uomsAsignadas.find(u => u.id === uomId);
  return uom?.catalog?.name || 'Desconocida';
}

// 6. Verificar si es calculada
esCalculada(relacion: Relacion): boolean {
  return relacion.calculated === true;
}
```

## Flujo de Inicialización

```typescript
ngOnInit() {
  this.loadUoMs();      // Cargar UoMs asignadas
  this.loadRelaciones(); // Cargar relaciones existentes
}
```

## Template HTML

```html
<!-- Sección 3: Relaciones de Conversión -->
<div class="relaciones-section">
  <h3>3️⃣ Relaciones de Conversión</h3>

  <!-- Formulario para crear relación -->
  <div class="crear-relacion">
    <h4>Crear Nueva Relación</h4>

    <!-- Dropdown: De (origen) -->
    <select [(ngModel)]="formData.sourceUomId" placeholder="De (origen)...">
      <option value="">Seleccionar...</option>
      <option *ngFor="let uom of uomsAsignadas" [value]="uom.id">
        {{ uom.catalog.name }}
      </option>
    </select>

    <!-- Dropdown: A (destino) -->
    <select [(ngModel)]="formData.targetUomId" placeholder="A (destino)...">
      <option value="">Seleccionar...</option>
      <option *ngFor="let uom of uomsAsignadas" [value]="uom.id">
        {{ uom.catalog.name }}
      </option>
    </select>

    <!-- Input: Factor -->
    <input
      type="number"
      [(ngModel)]="formData.factor"
      placeholder="Factor"
      min="0.01"
      step="0.01"
    />

    <!-- Botón: Crear -->
    <button (click)="crearRelacion()" [disabled]="loading">
      {{ loading ? 'Creando...' : 'Crear' }}
    </button>
  </div>

  <!-- Mensajes de error/éxito -->
  <div *ngIf="error" class="error-message">{{ error }}</div>
  <div *ngIf="success" class="success-message">{{ success }}</div>

  <!-- Tabla de relaciones -->
  <div class="relaciones-tabla">
    <h4>Relaciones Existentes</h4>

    <table *ngIf="relaciones.length > 0">
      <thead>
        <tr>
          <th>De</th>
          <th>A</th>
          <th>Factor</th>
          <th>Tipo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let rel of relaciones">
          <td>{{ getNombreUoM(rel.source_uom_id) }}</td>
          <td>{{ getNombreUoM(rel.target_uom_id) }}</td>
          <td>{{ rel.conversion_factor }}</td>
          <td>
            <span *ngIf="esCalculada(rel)" class="badge calculada">
              Calculada
            </span>
            <span *ngIf="!esCalculada(rel)" class="badge explicita">
              Explícita
            </span>
          </td>
          <td>
            <button
              *ngIf="!esCalculada(rel)"
              (click)="eliminarRelacion(rel.id)"
              class="btn-eliminar"
            >
              Eliminar
            </button>
            <span *ngIf="esCalculada(rel)">-</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div *ngIf="relaciones.length === 0" class="no-relaciones">
      No hay relaciones de conversión
    </div>
  </div>
</div>
```

## Estilos CSS

```css
.relaciones-section {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.crear-relacion {
  background: white;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.crear-relacion select,
.crear-relacion input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.crear-relacion button {
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.crear-relacion button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  padding: 10px;
  background: #f8d7da;
  border-radius: 4px;
  margin-bottom: 10px;
}

.success-message {
  color: #155724;
  padding: 10px;
  background: #d4edda;
  border-radius: 4px;
  margin-bottom: 10px;
}

.relaciones-tabla table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.relaciones-tabla th,
.relaciones-tabla td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.relaciones-tabla th {
  background: #f9f9f9;
  font-weight: bold;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge.calculada {
  background: #e7f3ff;
  color: #0066cc;
}

.badge.explicita {
  background: #fff3cd;
  color: #856404;
}

.btn-eliminar {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-eliminar:hover {
  background: #c82333;
}

.no-relaciones {
  text-align: center;
  color: #999;
  padding: 20px;
}
```

## Resumen de Endpoints Necesarios

```
1. GET /api/tenant/products/{productId}/uoms
   → Obtener UoMs asignadas

2. GET /api/tenant/products/{productId}/uom-relationships
   → Obtener relaciones

3. POST /api/tenant/products/{productId}/uom-relationships
   → Crear relación

4. DELETE /api/tenant/products/{productId}/uom-relationships/{relationshipId}
   → Eliminar relación
```

## Flujo Completo

```
1. Cargar página
   ↓
2. loadUoMs() → Llenar dropdowns
   ↓
3. loadRelaciones() → Mostrar tabla
   ↓
4. Usuario selecciona De, A, Factor
   ↓
5. Usuario hace clic "Crear"
   ↓
6. crearRelacion() → POST
   ↓
7. loadRelaciones() → Actualizar tabla
   ↓
8. Mostrar mensaje de éxito
```

## Validaciones en Frontend

```typescript
// Antes de enviar al servidor
if (!sourceUomId) throw 'Selecciona origen'
if (!targetUomId) throw 'Selecciona destino'
if (sourceUomId === targetUomId) throw 'No puedes relacionar consigo misma'
if (!factor || factor <= 0) throw 'Factor debe ser > 0'

// El servidor también valida
```

---

**Ahora tienes todo lo necesario para implementar la sección de relaciones.**
