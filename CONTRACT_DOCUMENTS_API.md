# CONTRACT DOCUMENTS API - GUÍA PARA UI

## ESTRUCTURA
- **Documentos en AWS S3**: `sin-customer-documents/{tenant_id}/contracts/{contract_id}/{uuid}-{filename}`
- **Signed URLs**: URLs temporales (1 hora) para descargar documentos de forma segura
- **Estados**: pending, approved, rejected

---

## ENDPOINTS

### 1. SUBIR DOCUMENTO DE CONTRATO
```
POST /api/tenant/contracts/:contractId/documents
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (File) - Archivo a subir (PDF del contrato firmado)
- `notes` (string, opcional) - Notas adicionales

**Restricciones:**
- Tamaño máximo: 10MB
- Tipos permitidos: jpg, jpeg, png, pdf, doc, docx

**Ejemplo (JavaScript/FormData):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('notes', 'Contrato firmado por ambas partes');

fetch('/api/tenant/contracts/uuid-del-contrato/documents', {
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
  "contract_id": "uuid",
  "file_name": "Contrato_LOT-1-02.pdf",
  "s3_key": "tenant-id/contracts/contract-id/uuid.pdf",
  "mime_type": "application/pdf",
  "file_size": 345678,
  "notes": "Contrato firmado por ambas partes",
  "status": "pending",
  "uploaded_by": "user-id",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. LISTAR DOCUMENTOS DE UN CONTRATO
```
GET /api/tenant/contracts/:contractId/documents
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "contract_id": "uuid",
    "file_name": "Contrato_LOT-1-02.pdf",
    "mime_type": "application/pdf",
    "file_size": 345678,
    "status": "approved",
    "notes": "Contrato firmado por ambas partes",
    "created_at": "2024-01-15T10:30:00.000Z",
    "download_url": "https://sin-customer-documents.s3.amazonaws.com/...?X-Amz-Signature=..."
  }
]
```

**IMPORTANTE:** `download_url` es temporal (válida 1 hora). Genera nueva URL cada vez que consultes.

---

### 3. VER UN DOCUMENTO ESPECÍFICO
```
GET /api/tenant/contracts/:contractId/documents/:documentId
```

**Respuesta:** Igual que item individual del listado, con `download_url` actualizada.

---

### 4. ELIMINAR DOCUMENTO
```
DELETE /api/tenant/contracts/:contractId/documents/:documentId
```

**Respuesta:**
```json
{
  "success": true
}
```

**NOTA:** Elimina el archivo de S3 y el registro de la base de datos.

---

### 5. ACTUALIZAR ESTADO DEL DOCUMENTO
```
PATCH /api/tenant/contracts/:contractId/documents/:documentId/status
```

**Body:**
```json
{
  "status": "approved",
  "notes": "Contrato verificado y aprobado"
}
```

**Estados válidos:**
- `pending` - Pendiente de revisión
- `approved` - Aprobado
- `rejected` - Rechazado

---

## IMPLEMENTACIÓN EN UI - CONTRACT DETAIL

### Sección de Documentos

**1. Mostrar lista de documentos:**
```typescript
// En contract-detail.component.ts
documents: any[] = [];

loadDocuments() {
  this.http.get(`/api/tenant/contracts/${this.contractId}/documents`)
    .subscribe(docs => {
      this.documents = docs;
    });
}
```

**2. Subir documento:**
```html
<!-- En contract-detail.component.html -->
<div class="documents-section">
  <h3>Documentos del Contrato</h3>
  
  <div class="upload-form">
    <input type="file" (change)="onFileSelected($event)" #fileInput accept=".pdf,.jpg,.jpeg,.png">
    <textarea [(ngModel)]="notes" placeholder="Notas (opcional)"></textarea>
    <button (click)="uploadDocument()">Subir Contrato</button>
  </div>
  
  <div class="documents-list">
    <div *ngFor="let doc of documents" class="document-item">
      <span class="doc-icon">📄</span>
      <div class="doc-info">
        <strong>{{doc.file_name}}</strong>
        <span class="doc-date">{{doc.created_at | date}}</span>
        <span [class]="'status-' + doc.status">{{doc.status}}</span>
        <p *ngIf="doc.notes" class="doc-notes">{{doc.notes}}</p>
      </div>
      <div class="doc-actions">
        <a [href]="doc.download_url" target="_blank">Descargar</a>
        <button (click)="deleteDocument(doc.id)">Eliminar</button>
        <button *ngIf="doc.status === 'pending'" (click)="approveDocument(doc.id)">Aprobar</button>
      </div>
    </div>
  </div>
</div>
```

**3. Métodos TypeScript:**
```typescript
selectedFile: File | null = null;
notes: string = '';

onFileSelected(event: any) {
  this.selectedFile = event.target.files[0];
}

uploadDocument() {
  if (!this.selectedFile) {
    alert('Selecciona un archivo');
    return;
  }

  const formData = new FormData();
  formData.append('file', this.selectedFile);
  if (this.notes) {
    formData.append('notes', this.notes);
  }

  this.http.post(`/api/tenant/contracts/${this.contractId}/documents`, formData)
    .subscribe(() => {
      this.loadDocuments();
      this.selectedFile = null;
      this.notes = '';
      alert('Documento subido correctamente');
    });
}

deleteDocument(documentId: string) {
  if (confirm('¿Eliminar documento?')) {
    this.http.delete(`/api/tenant/contracts/${this.contractId}/documents/${documentId}`)
      .subscribe(() => {
        this.loadDocuments();
      });
  }
}

approveDocument(documentId: string) {
  this.http.patch(`/api/tenant/contracts/${this.contractId}/documents/${documentId}/status`, {
    status: 'approved',
    notes: 'Contrato aprobado'
  }).subscribe(() => {
    this.loadDocuments();
  });
}
```

---

## PERMISOS REQUERIDOS
- **Contract:Read** - Ver documentos
- **Contract:Update** - Subir, eliminar, actualizar estado de documentos

---

## CASOS DE USO

### 1. Subir Contrato Firmado
Cuando se crea un contrato nuevo, el usuario puede subir el PDF del contrato firmado por ambas partes.

### 2. Múltiples Versiones
Si hay modificaciones al contrato, se pueden subir nuevas versiones. Cada documento queda registrado con su fecha.

### 3. Aprobación de Contratos
Los administradores pueden revisar y aprobar/rechazar los documentos subidos.

### 4. Historial de Documentos
Todos los documentos quedan registrados con fecha, usuario que subió, y estado.

---

## NOTAS IMPORTANTES
1. **Signed URLs expiran en 1 hora** - Regenera URL cada vez que consultes
2. **Archivos en S3 son privados** - Solo accesibles vía signed URLs
3. **Estructura S3**: `{tenant_id}/contracts/{contract_id}/{uuid}.ext`
4. **Tamaño máximo**: 10MB por archivo
5. **Tipos permitidos**: jpg, jpeg, png, pdf, doc, docx
6. **Recomendación**: Usar PDF para contratos oficiales

---

## INTEGRACIÓN CON LISTA DE CONTRATOS

Puedes agregar un indicador en la lista de contratos para mostrar si tiene documentos:

```typescript
// En contracts-list.component.ts
async loadContracts() {
  const contracts = await this.http.get('/api/tenant/contracts').toPromise();
  
  // Para cada contrato, verificar si tiene documentos
  for (const contract of contracts) {
    const docs = await this.http.get(`/api/tenant/contracts/${contract.id}/documents`).toPromise();
    contract.hasDocuments = docs.length > 0;
    contract.documentCount = docs.length;
  }
  
  this.contracts = contracts;
}
```

```html
<!-- En la lista de contratos -->
<td>
  <span *ngIf="contract.hasDocuments" class="badge badge-success">
    📄 {{contract.documentCount}} doc(s)
  </span>
  <span *ngIf="!contract.hasDocuments" class="badge badge-warning">
    Sin documentos
  </span>
</td>
```

---

## EJEMPLO COMPLETO DE FLUJO

1. **Usuario crea contrato** → Status: activo
2. **Usuario sube PDF del contrato firmado** → Document status: pending
3. **Admin revisa documento** → Descarga y verifica
4. **Admin aprueba documento** → Document status: approved
5. **Contrato queda completamente documentado** → Listo para pagos

---

## ESTILOS CSS SUGERIDOS

```css
.documents-section {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.upload-form {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.document-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 10px;
}

.doc-icon {
  font-size: 24px;
  margin-right: 15px;
}

.doc-info {
  flex: 1;
}

.doc-actions {
  display: flex;
  gap: 10px;
}

.status-pending {
  color: orange;
  font-weight: bold;
}

.status-approved {
  color: green;
  font-weight: bold;
}

.status-rejected {
  color: red;
  font-weight: bold;
}
```
