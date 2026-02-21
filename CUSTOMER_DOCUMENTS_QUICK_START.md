# CUSTOMER DOCUMENTS - QUICK START FOR UI

## 🚀 READY TO USE

The customer documents system is fully implemented and tested. Here's everything you need to integrate it.

---

## 📋 BASIC WORKFLOW

1. **Get document types** → User selects type
2. **Upload file** → File goes to S3
3. **List documents** → Show with download links
4. **Download** → Use signed URL (auto-generated)
5. **Delete** → Remove from S3 and database

---

## 🔌 ESSENTIAL ENDPOINTS

### Get Document Types (for dropdown)
```http
GET /api/tenant/document-types
```
**Response:** Array of types (INE, Licencia, Pasaporte, etc.)

### Upload Document
```http
POST /api/tenant/customers/:customerId/documents
Content-Type: multipart/form-data

FormData:
- file: File
- document_type_id: string
- expiration_date: string (optional, YYYY-MM-DD)
- notes: string (optional)
```

### List Customer Documents
```http
GET /api/tenant/customers/:customerId/documents
```
**Response:** Array with `download_url` (valid 1 hour)

### Delete Document
```http
DELETE /api/tenant/customers/:customerId/documents/:documentId
```

---

## 💻 MINIMAL CODE EXAMPLE

```typescript
// Component
export class CustomerDetailComponent {
  documents: any[] = [];
  documentTypes: any[] = [];
  selectedFile: File | null = null;
  selectedTypeId: string = '';

  ngOnInit() {
    this.loadDocumentTypes();
    this.loadDocuments();
  }

  loadDocumentTypes() {
    this.http.get('/api/tenant/document-types')
      .subscribe(types => this.documentTypes = types);
  }

  loadDocuments() {
    this.http.get(`/api/tenant/customers/${this.customerId}/documents`)
      .subscribe(docs => this.documents = docs);
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadDocument() {
    if (!this.selectedFile || !this.selectedTypeId) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('document_type_id', this.selectedTypeId);

    this.http.post(`/api/tenant/customers/${this.customerId}/documents`, formData)
      .subscribe(() => {
        this.loadDocuments();
        this.selectedFile = null;
      });
  }

  deleteDocument(docId: string) {
    if (!confirm('¿Eliminar documento?')) return;
    
    this.http.delete(`/api/tenant/customers/${this.customerId}/documents/${docId}`)
      .subscribe(() => this.loadDocuments());
  }
}
```

```html
<!-- Template -->
<div class="documents-section">
  <h3>Documentos</h3>

  <!-- Upload Form -->
  <div class="upload-form">
    <select [(ngModel)]="selectedTypeId">
      <option value="">Seleccionar tipo...</option>
      <option *ngFor="let type of documentTypes" [value]="type.id">
        {{type.name}}
      </option>
    </select>
    
    <input type="file" (change)="onFileSelected($event)">
    <button (click)="uploadDocument()" [disabled]="!selectedFile || !selectedTypeId">
      Subir
    </button>
  </div>

  <!-- Documents List -->
  <div class="documents-list">
    <div *ngFor="let doc of documents" class="document-item">
      <span>{{doc.document_type.name}}</span>
      <span>{{doc.file_name}}</span>
      <span class="status-{{doc.status}}">{{doc.status}}</span>
      <a [href]="doc.download_url" target="_blank">Descargar</a>
      <button (click)="deleteDocument(doc.id)">Eliminar</button>
    </div>
  </div>
</div>
```

---

## ⚙️ FILE RESTRICTIONS

- **Max size:** 10MB
- **Allowed types:** jpg, jpeg, png, pdf, doc, docx
- Backend validates automatically

---

## 🔐 PERMISSIONS

- **Customer:Read** - View documents
- **Customer:Update** - Upload/delete documents

---

## 📦 DOCUMENT TYPES (Predefined)

1. INE/IFE
2. Licencia de Conducir
3. Pasaporte
4. Comprobante de Domicilio
5. Comprobante de Ingresos
6. RFC
7. Estado de Cuenta Bancario
8. Contrato
9. Otro

Tenants can create custom types via `POST /api/tenant/document-types`

---

## 🔗 DOWNLOAD URLS

- Generated automatically when listing documents
- Valid for 1 hour
- No auth headers needed (signed URL)
- Regenerate by fetching documents again

---

## 📊 DOCUMENT STATUS

- `pending` - Pendiente de revisión
- `approved` - Aprobado
- `rejected` - Rechazado

Update status: `PATCH /api/tenant/customers/:customerId/documents/:docId/status`

---

## 🎨 UI SUGGESTIONS

### Status Badges
```css
.status-pending { color: orange; }
.status-approved { color: green; }
.status-rejected { color: red; }
```

### Document Icons
- PDF: 📄
- Images: 🖼️
- Word: 📝

### Actions
- Download: ⬇️ or "Descargar"
- Delete: 🗑️ or "Eliminar"
- Approve: ✅ or "Aprobar"
- Reject: ❌ or "Rechazar"

---

## 🐛 ERROR HANDLING

```typescript
uploadDocument() {
  // ... formData setup ...

  this.http.post(url, formData).subscribe({
    next: () => {
      this.loadDocuments();
      this.showSuccess('Documento subido correctamente');
    },
    error: (err) => {
      if (err.status === 413) {
        this.showError('Archivo muy grande (máx 10MB)');
      } else if (err.status === 415) {
        this.showError('Tipo de archivo no permitido');
      } else {
        this.showError('Error al subir documento');
      }
    }
  });
}
```

---

## 📚 FULL DOCUMENTATION

See **CUSTOMER_DOCUMENTS_API.md** for:
- Complete endpoint documentation
- Request/response examples
- Advanced features
- Status management
- Custom document types

---

## ✅ BACKEND STATUS

- ✅ Database tables created
- ✅ AWS S3 configured and tested
- ✅ All endpoints working
- ✅ Build successful
- ✅ Ready for integration

---

## 🆘 SUPPORT

If you need help:
1. Check `CUSTOMER_DOCUMENTS_API.md` for detailed docs
2. Check `CUSTOMER_DOCUMENTS_IMPLEMENTATION_COMPLETE.md` for technical details
3. Test endpoints with Postman/Insomnia
4. Verify permissions are assigned to your role
