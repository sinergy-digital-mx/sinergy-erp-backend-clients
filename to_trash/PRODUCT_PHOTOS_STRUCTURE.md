# Product Photos System - Estructura

## Overview
Sistema de gestión de fotos de productos con almacenamiento en S3, similar a la estructura de documentos de clientes pero optimizado para imágenes de catálogo.

## Estructura S3
```
s3://sin-customer-documents/
├── {tenant_id}/
│   └── products/
│       └── {product_id}/
│           ├── {uuid}-photo1.png
│           ├── {uuid}-photo2.jpg
│           └── {uuid}-photo3.webp
```

## Entidades

### ProductPhoto Entity
- **Tabla**: `product_photos`
- **Campos principales**:
  - `id` (UUID): Identificador único
  - `tenant_id` (FK): Tenant propietario
  - `product_id` (FK): Producto asociado
  - `file_name`: Nombre original del archivo
  - `s3_key`: Ruta en S3
  - `mime_type`: Tipo MIME (image/png, image/jpeg, etc.)
  - `file_size`: Tamaño en bytes
  - `display_order`: Orden de visualización en catálogo
  - `is_primary`: Foto principal del producto
  - `alt_text`: Texto alternativo para accesibilidad
  - `uploaded_by`: Usuario que subió la foto
  - `created_at`, `updated_at`: Timestamps

### Relaciones
- **Product → ProductPhoto**: One-to-Many (cascade delete)
- **Tenant → ProductPhoto**: Many-to-One (cascade delete)

## Validaciones

### Tipos de archivo permitidos
- `image/png`
- `image/jpeg`
- `image/jpg`
- `image/webp`

### Límites
- Tamaño máximo: 5MB
- Extensiones: .png, .jpg, .jpeg, .webp

## Endpoints REST

### Upload Photo
```
POST /products/:productId/photos
Content-Type: multipart/form-data

Body:
- file: (binary)
- alt_text: (optional string)

Response: ProductPhoto
```

### List Photos
```
GET /products/:productId/photos

Response: ProductPhoto[]
```

### Get Primary Photo
```
GET /products/:productId/photos/primary

Response: ProductPhoto | null
```

### Get Photo Details
```
GET /products/:productId/photos/:photoId

Response: ProductPhoto
```

### Get Signed URL
```
GET /products/:photoId/photos/:photoId/signed-url

Response: { signed_url: string }
```

### Update Photo
```
PATCH /products/:productId/photos/:photoId

Body:
{
  "alt_text": "string (optional)",
  "display_order": number (optional),
  "is_primary": boolean (optional)
}

Response: ProductPhoto
```

### Reorder Photos
```
POST /products/:productId/photos/reorder

Body:
{
  "photo_ids": ["id1", "id2", "id3"]
}

Response: ProductPhoto[]
```

### Delete Photo
```
DELETE /products/:productId/photos/:photoId

Response: 204 No Content
```

## Características

### Foto Principal
- Solo una foto puede ser `is_primary: true` por producto
- Al establecer una foto como principal, automáticamente se desmarca la anterior
- Útil para mostrar en listados de catálogo

### Orden de Visualización
- Campo `display_order` controla el orden en el catálogo
- Se puede reordenar con el endpoint `/reorder`
- Las fotos se ordenan por `display_order` ASC, luego por `created_at` DESC

### URLs Firmadas
- Las URLs de S3 son privadas
- Se generan URLs firmadas con expiración de 1 hora (configurable)
- Endpoint `/signed-url` devuelve URL temporal para descargar

### Accesibilidad
- Campo `alt_text` para descripción de imagen
- Importante para SEO y accesibilidad

## Flujo de Uso

### 1. Subir Foto
```typescript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('alt_text', 'Foto del producto XYZ');

const response = await fetch(
  `/products/${productId}/photos`,
  { method: 'POST', body: formData }
);
const photo = await response.json();
```

### 2. Obtener Fotos del Producto
```typescript
const photos = await fetch(`/products/${productId}/photos`).then(r => r.json());
```

### 3. Establecer Foto Principal
```typescript
await fetch(`/products/${productId}/photos/${photoId}`, {
  method: 'PATCH',
  body: JSON.stringify({ is_primary: true })
});
```

### 4. Obtener URL para Mostrar
```typescript
const { signed_url } = await fetch(
  `/products/${photoId}/photos/${photoId}/signed-url`
).then(r => r.json());

// Usar signed_url en <img src={signed_url} />
```

### 5. Reordenar Fotos
```typescript
await fetch(`/products/${productId}/photos/reorder`, {
  method: 'POST',
  body: JSON.stringify({
    photo_ids: ['id1', 'id2', 'id3']
  })
});
```

## Archivos Creados

```
src/
├── entities/products/
│   └── product-photo.entity.ts
├── api/products/
│   ├── repositories/
│   │   └── product-photo.repository.ts
│   ├── services/
│   │   └── product-photo.service.ts
│   ├── controllers/
│   │   └── product-photo.controller.ts
│   └── dto/
│       ├── upload-product-photo.dto.ts
│       ├── update-product-photo.dto.ts
│       └── reorder-product-photos.dto.ts
└── database/migrations/
    └── 1772812687000-create-product-photos-table.ts
```

## Notas Importantes

1. **S3 Bucket**: Usa el mismo bucket que documentos de clientes (`sin-customer-documents`)
2. **Estructura de carpetas**: `{tenant_id}/products/{product_id}/photos/`
3. **Cascade Delete**: Al eliminar un producto, se eliminan todas sus fotos (BD y S3)
4. **Permisos S3**: Asegúrate que el usuario IAM tenga permisos para:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
5. **Validación**: Se valida tipo MIME y tamaño en el servicio
6. **Tenant Isolation**: Todas las fotos están aisladas por tenant

## Integración con ProductsModule

El `ProductPhotoService` y `ProductPhotoController` ya están integrados en `ProductsModule`:
- Se registra la entidad `ProductPhoto` en TypeORM
- Se inyecta `S3Service` para operaciones de almacenamiento
- Se exporta el servicio para uso en otros módulos
