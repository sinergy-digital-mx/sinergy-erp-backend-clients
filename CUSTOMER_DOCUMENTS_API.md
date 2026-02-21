# CUSTOMER DOCUMENTS API - GUÍA PARA UI

## ESTRUCTURA
- **Documentos en AWS S3**: `sin-customer-documents/{tenant_id}/{customer_id}/{document_type}/{uuid}-{filename}`
- **Signed URLs**: URLs temporales (1 hora) para descargar documentos de forma segura
- **Tipos de documento**: Globales (sistema) + Custom por tenant
- **Estados**: pending, approved, rejected

---

## ENDPOINTS

### 1. OBTENER TIPOS DE DOCUMENTO DISPONIBLES
```
GET /api/tenant/document-types
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "code": "id_card",
    "name": "INE/IFE",
    "description": "Identificación oficial mexicana",
    "is_active": true,
    "is_required": false
  },
  {
    "id": "uuid",
    "code": "drivers_license",
    "name": "Licencia de Conducir",
    "description": "Licencia de conducir vigente",
    "is_active": true,
    "is_required": false
  }
]
```

**Tipos predefinidos:**
- `id_card` - INE/IFE
- `drivers_license` - Licencia de Conducir
- `passport` - Pasaporte
- `proof_of_address` - Comprobante de Domicilio
- `proof_of_income` - Comprobante de Ingresos
- `tax_id` - RFC
- `bank_statement` - Estado de Cuenta Bancario
- `contract` - Contrato
- `other` - Otro

---

### 2. SUBIR DOCUMENTO
```
POST /api/tenant/customers/:customerId/documents
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (File) - Archivo a subir
- `document_type_id` (string) - ID del tipo de documento
- `expiration_date` (string, opcional) - Fecha de expiración (YYYY-MM-DD)
- `notes` (string, opcional) - Notas adicionales

**Restricciones:**
- Tamaño máximo: 10MB
- Tipos permitidos: jpg, jpeg, png, pdf, doc, docx

**Ejemplo (JavaScript/FormData):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('document_type_id', 'uuid-del-tipo');
formData.append('expiration_date', '2025-12-31');
formData.append('notes', 'INE vigente');

fetch('/api/tenant/customers/67/documents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

**Respuesta:**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "customer_id": 67,
  "document_type_id": "uuid",
  "file_name": "INE_Jason_Gomez.pdf",
  "s3_key": "tenant-id/67/id_card/uuid.pdf",
  "mime_type": "application/pdf",
  "file_size": 245678,
  "expiration_date": "2025-12-31",
  "notes": "INE vigente",
  "status": "pending",
  "uploaded_by": "user-id",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. LISTAR DOCUMENTOS DE UN CLIENTE
```
GET /api/tenant/customers/:customerId/documents
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "customer_id": 67,
    "document_type": {
      "id": "uuid",
      "code": "id_card",
      "name": "INE/IFE"
    },
    "file_name": "INE_Jason_Gomez.pdf",
    "mime_type": "application/pdf",
    "file_size": 245678,
    "expiration_date": "2025-12-31",
    "status": "approved",
    "notes": "INE vigente",
    "created_at": "2024-01-15T10:30:00.000Z",
    "download_url": "https://sin-customer-documents.s3.amazonaws.com/...?X-Amz-Signature=..."
  }
]
```

**IMPORTANTE:** `download_url` es temporal (válida 1 hora). Genera nueva URL cada vez que consultes.

---

### 4. VER UN DOCUMENTO ESPECÍFICO
```
GET /api/tenant/customers/:customerId/documents/:documentId
```

**Respuesta:** Igual que item individual del listado, con `download_url` actualizada.

---

### 5. ELIMINAR DOCUMENTO
```
DELETE /api/tenant/customers/:customerId/documents/:documentId
```

**Respuesta:**
```json
{
  "success": true
}
```

**NOTA:** Elimina el archivo de S3 y el registro de la base de datos.

---

### 6. ACTUALIZAR ESTADO DEL DOCUMENTO
```
PATCH /api/tenant/customers/:customerId/documents/:documentId/status
```

**Body:**
```json
{
  "status": "approved",
  "notes": "Documento verificado correctamente"
}
```

**Estados válidos:**
- `pending` - Pendiente de revisión
- `approved` - Aprobado
- `rejected` - Rechazado

---

### 7. CREAR TIPO DE DOCUMENTO CUSTOM (ADMIN)
```
POST /api/tenant/document-types
```

**Body:**
```json
{
  "code": "escritura_publica",
  "name": "Escritura Pública",
  "description": "Escritura pública de la propiedad",
  "is_required": true
}
```

---

## IMPLEMENTACIÓN EN UI - CUSTOMER DETAIL

### Sección de Documentos

**1. Mostrar lista de documentos:**
```typescript
// En customer-detail.component.ts
documents: any[] = [];

loadDocuments() {
  this.http.get(`/api/tenant/customers/${this.customerId}/documents`)
    .subscribe(docs => {
      this.documents = docs;
    });
}
```

**2. Subir documento:**
```html
<!-- En customer-detail.component.html -->
<div class="documents-section">
  <h3>Documentos</h3>
  
  <div class="upload-form">
    <select [(ngModel)]="selectedDocType">
      <option *ngFor="let type of documentTypes" [value]="type.id">
        {{type.name}}
      </option>
    </select>
    
    <input type="file" (change)="onFileSelected($event)" #fileInput>
    <input type="date" [(ngModel)]="expirationDate" placeholder="Fecha de expiración">
    <textarea [(ngModel)]="notes" placeholder="Notas"></textarea>
    
    <button (click)="uploadDocument()">Subir Documento</button>
  </div>
  
  <div class="documents-list">
    <div *ngFor="let doc of documents" class="document-item">
      <span class="doc-icon">📄</span>
      <div class="doc-info">
        <strong>{{doc.document_type.name}}</strong>
        <span>{{doc.file_name}}</span>
        <span class="doc-date">{{doc.created_at | date}}</span>
        <span [class]="'status-' + doc.status">{{doc.status}}</span>
      </div>
      <div class="doc-actions">
        <a [href]="doc.download_url" target="_blank">Descargar</a>
        <button (click)="deleteDocument(doc.id)">Eliminar</button>
      </div>
    </div>
  </div>
</div>
```

**3. Métodos TypeScript:**
```typescript
selectedFile: File | null = null;
selectedDocType: string = '';
expirationDate: string = '';
notes: string = '';

onFileSelected(event: any) {
  this.selectedFile = event.target.files[0];
}

uploadDocument() {
  if (!this.selectedFile || !this.selectedDocType) {
    alert('Selecciona un archivo y tipo de documento');
    return;
  }

  const formData = new FormData();
  formData.append('file', this.selectedFile);
  formData.append('document_type_id', this.selectedDocType);
  if (this.expirationDate) {
    formData.append('expiration_date', this.expirationDate);
  }
  if (this.notes) {
    formData.append('notes', this.notes);
  }

  this.http.post(`/api/tenant/customers/${this.customerId}/documents`, formData)
    .subscribe(() => {
      this.loadDocuments();
      this.selectedFile = null;
      this.notes = '';
      alert('Documento subido correctamente');
    });
}

deleteDocument(documentId: string) {
  if (confirm('¿Eliminar documento?')) {
    this.http.delete(`/api/tenant/customers/${this.customerId}/documents/${documentId}`)
      .subscribe(() => {
        this.loadDocuments();
      });
  }
}
```

---

## PERMISOS REQUERIDOS
- **Read**: Ver documentos
- **Update**: Subir, eliminar, actualizar estado de documentos

---

## NOTAS IMPORTANTES
1. **Signed URLs expiran en 1 hora** - Regenera URL cada vez que consultes
2. **Archivos en S3 son privados** - Solo accesibles vía signed URLs
3. **Estructura S3**: `{tenant_id}/{customer_id}/{document_type}/{uuid}.ext`
4. **Tamaño máximo**: 10MB por archivo
5. **Tipos permitidos**: jpg, jpeg, png, pdf, doc, docx
