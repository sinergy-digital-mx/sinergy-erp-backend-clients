# Guía Completa del Módulo de Productos

## Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Modelos de Datos](#modelos-de-datos)
3. [Endpoints de API](#endpoints-de-api)
4. [Permisos RBAC](#permisos-rbac)
5. [Integración con Listas de Precios](#integración-con-listas-de-precios)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Troubleshooting](#troubleshooting)

---

## Descripción General

El módulo de productos gestiona el catálogo completo de productos del sistema, incluyendo:
- Productos con SKU único por tenant
- Categorías y subcategorías
- Unidades de medida (UoM) y conversiones
- Precios por proveedor
- Fotos de productos con almacenamiento en S3
- Múltiples listas de precios (Menudeo, Mayoreo, VIP, etc.)

---

## Modelos de Datos

### Product
```typescript
{
  id: string;                    // UUID
  tenant_id: string;             // UUID
  category_id: string | null;    // UUID
  subcategory_id: string | null; // UUID
  sku: string;                   // Único por tenant
  name: string;
  description: string | null;
  base_uom_id: string | null;    // UUID del catálogo de UoM
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  category: Category | null;
  subcategory: Subcategory | null;
  base_uom: UoMCatalog | null;
  uoms: UoM[];                   // UoMs asignadas al producto
  uom_relationships: UoMRelationship[];
  vendor_prices: VendorProductPrice[];
  photos: ProductPhoto[];
  prices: ProductPrice[];        // Precios por lista de precios
}
```

### Category
```typescript
{
  id: string;           // UUID
  tenant_id: string;    // UUID
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}
```

### Subcategory
```typescript
{
  id: string;           // UUID
  tenant_id: string;    // UUID
  category_id: string;  // UUID
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}
```

### UoM (Unit of Measure)
```typescript
{
  id: string;              // UUID
  product_id: string;      // UUID
  uom_catalog_id: string;  // UUID - referencia al catálogo
  created_at: Date;
  
  // Relaciones
  product: Product;
  uom_catalog: UoMCatalog;
}
```

### UoMRelationship (Conversiones)
```typescript
{
  id: string;              // UUID
  product_id: string;      // UUID
  source_uom_id: string;   // UUID
  target_uom_id: string;   // UUID
  conversion_factor: number; // Ej: 1 caja = 12 piezas
  created_at: Date;
}
```

### VendorProductPrice
```typescript
{
  id: string;         // UUID
  vendor_id: string;  // UUID
  product_id: string; // UUID
  uom_id: string;     // UUID
  price: number;      // Decimal(10,2)
  created_at: Date;
  updated_at: Date;
}
```

### ProductPhoto
```typescript
{
  id: string;         // UUID
  product_id: string; // UUID
  s3_key: string;     // Ruta en S3
  s3_bucket: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### ProductPrice (Listas de Precios)
```typescript
{
  id: string;           // UUID
  price_list_id: string; // UUID
  product_id: string;    // UUID
  uom_id: string;        // UUID
  price: number;         // Decimal(10,2)
  created_at: Date;
  updated_at: Date;
}
```

---

## Endpoints de API

### Productos

#### Crear Producto
```http
POST /api/tenant/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "sku": "PROD-001",
  "name": "Producto Ejemplo",
  "description": "Descripción del producto",
  "category_id": "uuid-categoria",
  "subcategory_id": "uuid-subcategoria",
  "base_uom_id": "uuid-uom-catalog"
}
```

**Respuesta:**
```json
{
  "id": "uuid-producto",
  "tenant_id": "uuid-tenant",
  "sku": "PROD-001",
  "name": "Producto Ejemplo",
  "description": "Descripción del producto",
  "category_id": "uuid-categoria",
  "subcategory_id": "uuid-subcategoria",
  "base_uom_id": "uuid-uom-catalog",
  "created_at": "2026-03-09T00:00:00.000Z",
  "updated_at": "2026-03-09T00:00:00.000Z"
}
```

#### Listar Productos
```http
GET /api/tenant/products
Authorization: Bearer {token}
```

**Respuesta:**
```json
[
  {
    "id": "uuid-producto",
    "sku": "PROD-001",
    "name": "Producto Ejemplo",
    "description": "Descripción",
    "category": {
      "id": "uuid-categoria",
      "name": "Categoría A"
    },
    "subcategory": {
      "id": "uuid-subcategoria",
      "name": "Subcategoría 1"
    },
    "base_uom": {
      "id": "uuid-uom",
      "name": "Pieza",
      "abbreviation": "pz"
    }
  }
]
```

#### Obtener Producto por ID
```http
GET /api/tenant/products/{id}
Authorization: Bearer {token}
```

#### Obtener Producto por SKU
```http
GET /api/tenant/products/sku/{sku}
Authorization: Bearer {token}
```

#### Listar Productos por Categoría
```http
GET /api/tenant/products/category/{categoryId}
Authorization: Bearer {token}
```

#### Listar Productos por Subcategoría
```http
GET /api/tenant/products/subcategory/{subcategoryId}
Authorization: Bearer {token}
```

#### Actualizar Producto
```http
PATCH /api/tenant/products/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nuevo Nombre",
  "description": "Nueva descripción",
  "category_id": "uuid-nueva-categoria"
}
```

#### Eliminar Producto
```http
DELETE /api/tenant/products/{id}
Authorization: Bearer {token}
```

---

### Categorías

#### Crear Categoría
```http
POST /api/tenant/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Electrónica",
  "description": "Productos electrónicos",
  "status": "active"
}
```

#### Listar Categorías (con paginación)
```http
GET /api/tenant/categories?page=1&limit=20&search=electro&status=active
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid-categoria",
      "name": "Electrónica",
      "description": "Productos electrónicos",
      "status": "active",
      "created_at": "2026-03-09T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### Obtener Categoría por ID
```http
GET /api/tenant/categories/{id}
Authorization: Bearer {token}
```

#### Actualizar Categoría
```http
PUT /api/tenant/categories/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Electrónica y Tecnología",
  "status": "active"
}
```

#### Eliminar Categoría
```http
DELETE /api/tenant/categories/{id}
Authorization: Bearer {token}
```

---

### Subcategorías

#### Crear Subcategoría
```http
POST /api/tenant/subcategories
Authorization: Bearer {token}
Content-Type: application/json

{
  "category_id": "uuid-categoria",
  "name": "Smartphones",
  "description": "Teléfonos inteligentes",
  "status": "active"
}
```

#### Listar Subcategorías (con filtros)
```http
GET /api/tenant/subcategories?page=1&limit=20&category_id=uuid-categoria&status=active
Authorization: Bearer {token}
```

#### Obtener Subcategoría por ID
```http
GET /api/tenant/subcategories/{id}
Authorization: Bearer {token}
```

#### Actualizar Subcategoría
```http
PUT /api/tenant/subcategories/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Smartphones y Tablets"
}
```

#### Eliminar Subcategoría
```http
DELETE /api/tenant/subcategories/{id}
Authorization: Bearer {token}
```

---

### Unidades de Medida (UoM)

#### Listar Catálogo de UoM
```http
GET /api/tenant/products/{productId}/uoms/catalog
Authorization: Bearer {token}
```

**Respuesta:**
```json
[
  {
    "id": "uuid-uom-catalog",
    "name": "Pieza",
    "abbreviation": "pz",
    "type": "unit"
  },
  {
    "id": "uuid-uom-catalog-2",
    "name": "Caja",
    "abbreviation": "cja",
    "type": "package"
  }
]
```

#### Asignar UoM a Producto
```http
POST /api/tenant/products/{productId}/uoms
Authorization: Bearer {token}
Content-Type: application/json

{
  "uom_catalog_id": "uuid-uom-catalog"
}
```

#### Listar UoMs de un Producto
```http
GET /api/tenant/products/{productId}/uoms
Authorization: Bearer {token}
```

#### Eliminar UoM de Producto
```http
DELETE /api/tenant/products/{productId}/uoms/{uomId}
Authorization: Bearer {token}
```

---

### Relaciones de Conversión UoM

#### Crear Relación de Conversión
```http
POST /api/tenant/products/{productId}/uoms/relationships
Authorization: Bearer {token}
Content-Type: application/json

{
  "source_uom_id": "uuid-caja",
  "target_uom_id": "uuid-pieza",
  "conversion_factor": 12
}
```

**Nota:** Esto significa que 1 caja = 12 piezas

#### Listar Relaciones de Conversión
```http
GET /api/tenant/products/{productId}/uoms/relationships
Authorization: Bearer {token}
```

#### Eliminar Relación de Conversión
```http
DELETE /api/tenant/products/{productId}/uoms/relationships/{relationshipId}
Authorization: Bearer {token}
```

#### Convertir Cantidad entre UoMs
```http
POST /api/tenant/products/{productId}/uoms/convert
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 5,
  "from_uom_id": "uuid-caja",
  "to_uom_id": "uuid-pieza"
}
```

**Respuesta:**
```json
{
  "converted_quantity": 60
}
```

---

### Precios por Proveedor

#### Crear Precio de Proveedor
```http
POST /api/tenant/vendor-product-prices
Authorization: Bearer {token}
Content-Type: application/json

{
  "vendor_id": "uuid-proveedor",
  "product_id": "uuid-producto",
  "uom_id": "uuid-uom",
  "price": 150.00
}
```

#### Obtener Precios por Producto
```http
GET /api/tenant/vendor-product-prices/products/{productId}
Authorization: Bearer {token}
```

#### Obtener Precios por Proveedor
```http
GET /api/tenant/vendor-product-prices/vendors/{vendorId}
Authorization: Bearer {token}
```

#### Obtener Precio Específico
```http
GET /api/tenant/vendor-product-prices/vendor/{vendorId}/product/{productId}/uom/{uomId}
Authorization: Bearer {token}
```

#### Actualizar Precio
```http
PATCH /api/tenant/vendor-product-prices/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "price": 175.00
}
```

#### Eliminar Precio
```http
DELETE /api/tenant/vendor-product-prices/{id}
Authorization: Bearer {token}
```

---

### Fotos de Productos

#### Subir Foto
```http
POST /api/products/{productId}/photos
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [archivo de imagen]
alt_text: "Descripción de la imagen"
```

#### Listar Fotos de un Producto
```http
GET /api/products/{productId}/photos
Authorization: Bearer {token}
```

#### Obtener Foto Principal
```http
GET /api/products/{productId}/photos/primary
Authorization: Bearer {token}
```

#### Obtener URL Firmada (para visualizar)
```http
GET /api/products/{productId}/photos/{photoId}/signed-url
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "signed_url": "https://s3.amazonaws.com/bucket/path?signature=..."
}
```

#### Actualizar Foto
```http
PATCH /api/products/{productId}/photos/{photoId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "alt_text": "Nueva descripción",
  "is_primary": true
}
```

#### Reordenar Fotos
```http
POST /api/products/{productId}/photos/reorder
Authorization: Bearer {token}
Content-Type: application/json

{
  "photo_ids": ["uuid-foto-1", "uuid-foto-2", "uuid-foto-3"]
}
```

#### Eliminar Foto
```http
DELETE /api/products/{productId}/photos/{photoId}
Authorization: Bearer {token}
```

---

### Listas de Precios

#### Crear Lista de Precios
```http
POST /api/tenant/price-lists
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Menudeo",
  "description": "Precios para venta al menudeo",
  "is_default": true,
  "valid_from": "2026-01-01",
  "valid_to": null
}
```

#### Listar Listas de Precios
```http
GET /api/tenant/price-lists?is_active=true
Authorization: Bearer {token}
```

#### Obtener Lista de Precios por Defecto
```http
GET /api/tenant/price-lists/default
Authorization: Bearer {token}
```

#### Agregar Precio a Lista
```http
POST /api/tenant/price-lists/product-prices
Authorization: Bearer {token}
Content-Type: application/json

{
  "price_list_id": "uuid-lista",
  "product_id": "uuid-producto",
  "uom_id": "uuid-uom",
  "price": 250.00
}
```

#### Obtener Precios de un Producto
```http
GET /api/tenant/price-lists/products/{productId}/prices
Authorization: Bearer {token}
```

**Respuesta:**
```json
[
  {
    "id": "uuid-precio",
    "price_list_id": "uuid-lista-menudeo",
    "product_id": "uuid-producto",
    "uom_id": "uuid-pieza",
    "price": 250.00,
    "price_list": {
      "id": "uuid-lista-menudeo",
      "name": "Menudeo",
      "is_default": true
    }
  },
  {
    "id": "uuid-precio-2",
    "price_list_id": "uuid-lista-mayoreo",
    "product_id": "uuid-producto",
    "uom_id": "uuid-pieza",
    "price": 200.00,
    "price_list": {
      "id": "uuid-lista-mayoreo",
      "name": "Mayoreo",
      "is_default": false
    }
  }
]
```

#### Obtener Precio Específico
```http
GET /api/tenant/price-lists/{priceListId}/products/{productId}/price
Authorization: Bearer {token}
```

#### Actualizar Precio
```http
PUT /api/tenant/price-lists/product-prices/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "price": 275.00
}
```

#### Eliminar Precio
```http
DELETE /api/tenant/price-lists/product-prices/{id}
Authorization: Bearer {token}
```

---

## Permisos RBAC

### Productos
- `Product:Create` - Crear productos
- `Product:Read` - Ver productos
- `Product:Update` - Actualizar productos
- `Product:Delete` - Eliminar productos

### Categorías
- `categories:Create` - Crear categorías
- `categories:Read` - Ver categorías
- `categories:Update` - Actualizar categorías
- `categories:Delete` - Eliminar categorías

### Subcategorías
- `Subcategory:Create` - Crear subcategorías
- `Subcategory:Read` - Ver subcategorías
- `Subcategory:Update` - Actualizar subcategorías
- `Subcategory:Delete` - Eliminar subcategorías

### Listas de Precios
- `PriceList:Create` - Crear listas de precios y precios
- `PriceList:Read` - Ver listas de precios y precios
- `PriceList:Update` - Actualizar listas de precios y precios
- `PriceList:Delete` - Eliminar listas de precios y precios

---

## Integración con Listas de Precios

### Flujo de Trabajo

1. **Crear Lista de Precios**
   ```typescript
   const priceList = await createPriceList({
     name: "Menudeo",
     is_default: true
   });
   ```

2. **Agregar Precios a Productos**
   ```typescript
   await addProductPrice({
     price_list_id: priceList.id,
     product_id: product.id,
     uom_id: uom.id,
     price: 250.00
   });
   ```

3. **Obtener Precio en POS o Sales Orders**
   ```typescript
   // Obtener precio de lista por defecto
   const defaultPriceList = await getDefaultPriceList();
   const price = await getProductPrice(
     defaultPriceList.id,
     product.id
   );
   ```

### Uso en POS

En el módulo POS, puedes seleccionar la lista de precios al crear una orden:

```typescript
const order = {
  price_list_id: "uuid-lista-menudeo", // Opcional
  lines: [
    {
      product_id: "uuid-producto",
      quantity: 2,
      // El precio se obtiene automáticamente de la lista
    }
  ]
};
```

Si no se especifica `price_list_id`, se usa la lista por defecto.

---

## Ejemplos de Uso

### Ejemplo Angular: Servicio de Productos

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: { id: string; name: string };
  subcategory?: { id: string; name: string };
  base_uom?: { id: string; name: string; abbreviation: string };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = '/api/tenant/products';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  getProductBySku(sku: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/sku/${sku}`);
  }

  getProductsByCategory(categoryId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: string, updates: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, updates);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### Ejemplo Angular: Componente de Lista de Productos

```typescript
import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from './product.service';

@Component({
  selector: 'app-product-list',
  template: `
    <div class="product-list">
      <h2>Productos</h2>
      
      <div class="filters">
        <select [(ngModel)]="selectedCategory" (change)="filterByCategory()">
          <option value="">Todas las categorías</option>
          <option *ngFor="let cat of categories" [value]="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Subcategoría</th>
            <th>UoM Base</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let product of products">
            <td>{{ product.sku }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.category?.name || '-' }}</td>
            <td>{{ product.subcategory?.name || '-' }}</td>
            <td>{{ product.base_uom?.abbreviation || '-' }}</td>
            <td>
              <button (click)="editProduct(product)">Editar</button>
              <button (click)="deleteProduct(product.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: any[] = [];
  selectedCategory: string = '';

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe(
      products => this.products = products
    );
  }

  filterByCategory() {
    if (this.selectedCategory) {
      this.productService.getProductsByCategory(this.selectedCategory)
        .subscribe(products => this.products = products);
    } else {
      this.loadProducts();
    }
  }

  editProduct(product: Product) {
    // Navegar a formulario de edición
  }

  deleteProduct(id: string) {
    if (confirm('¿Eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe(() => {
        this.loadProducts();
      });
    }
  }
}
```

### Ejemplo: Obtener Precio de Producto con Lista

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PriceService {
  constructor(private http: HttpClient) {}

  getProductPrices(productId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `/api/tenant/price-lists/products/${productId}/prices`
    );
  }

  getDefaultPrice(productId: string): Observable<number> {
    return forkJoin({
      defaultList: this.http.get<any>('/api/tenant/price-lists/default'),
      prices: this.getProductPrices(productId)
    }).pipe(
      map(({ defaultList, prices }) => {
        const defaultPrice = prices.find(
          p => p.price_list_id === defaultList.id
        );
        return defaultPrice?.price || 0;
      })
    );
  }
}
```

---

## Integración con Inventario

### Consultar Movimientos de Inventario por Producto

Para ver el historial de movimientos de inventario de un producto específico:

**Endpoint:** `GET /api/tenant/inventory/reports/by-product/:productId`

**Ejemplo:**
```typescript
// En tu servicio de productos
getProductInventoryMovements(productId: string): Observable<any> {
  return this.http.get(`/api/tenant/inventory/reports/by-product/${productId}`);
}
```

**Response:**
```json
{
  "product": {
    "id": "product-uuid",
    "name": "Producto A",
    "sku": "PROD-001"
  },
  "movements": [
    {
      "id": "movement-uuid",
      "warehouse_name": "Almacén Principal",
      "movement_type": "purchase_receipt",
      "quantity": 100,
      "unit_cost": 10.50,
      "total_cost": 1050.00,
      "movement_date": "2026-03-08T10:00:00.000Z",
      "reference_type": "purchase_order",
      "reference_id": "po-uuid"
    }
  ],
  "summary": {
    "total_movements": 50,
    "total_quantity_in": 500,
    "total_quantity_out": 200,
    "net_quantity": 300
  }
}
```

### Consultar Stock Actual por Producto

Para ver el stock disponible de un producto en todos los almacenes:

**Endpoint:** `GET /api/tenant/inventory/items?product_id={productId}`

**Ejemplo:**
```typescript
getProductStock(productId: string): Observable<any> {
  return this.http.get(`/api/tenant/inventory/items?product_id=${productId}`);
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "inventory-item-uuid",
      "warehouse": {
        "id": "warehouse-uuid",
        "name": "Almacén Principal"
      },
      "quantity_on_hand": 100,
      "quantity_reserved": 20,
      "quantity_available": 80,
      "unit_cost": 10.50,
      "total_value": 1050.00
    }
  ]
}
```

Para más información sobre el módulo de inventario, consulta `INVENTORY_COMPLETE_GUIDE.md`.

---

## Troubleshooting

### Error: "A product with this SKU already exists"
- El SKU debe ser único por tenant
- Verifica que no exista otro producto con el mismo SKU
- Los SKUs son case-sensitive

### Error: "Unit of Measure with ID {id} not found"
- El `base_uom_id` debe existir en el catálogo de UoM
- Primero obtén la lista de UoMs disponibles con `GET /api/tenant/products/{productId}/uoms/catalog`

### Error: "Category not found"
- Verifica que el `category_id` exista y pertenezca al tenant
- Puedes dejar `category_id` como `null` si no quieres asignar categoría

### Fotos no se visualizan
- Usa el endpoint `/signed-url` para obtener una URL temporal firmada
- Las URLs firmadas expiran después de cierto tiempo (configurado en S3)
- Verifica que el bucket S3 esté configurado correctamente

### Conversiones UoM no funcionan
- Asegúrate de haber creado las relaciones de conversión con `POST /uoms/relationships`
- Las conversiones son unidireccionales: si necesitas convertir en ambas direcciones, crea dos relaciones
- El `conversion_factor` debe ser mayor que 0

### Precios no aparecen en POS
- Verifica que el producto tenga precios asignados en la lista de precios activa
- Asegúrate de que la lista de precios esté marcada como activa (`is_active: true`)
- Si no se especifica lista de precios, se usa la lista por defecto (`is_default: true`)

---

## Notas Importantes

1. **SKU Único**: El SKU debe ser único por tenant. No puede haber dos productos con el mismo SKU en el mismo tenant.

2. **Tenant Isolation**: Todos los endpoints automáticamente filtran por `tenant_id` del usuario autenticado.

3. **Soft Delete**: Las categorías y subcategorías usan `status: 'inactive'` en lugar de eliminación física.

4. **UoM Base**: El `base_uom_id` es opcional pero recomendado para facilitar conversiones.

5. **Fotos en S3**: Las fotos se almacenan en S3. Usa URLs firmadas para visualizarlas en el frontend.

6. **Listas de Precios**: Un producto puede tener múltiples precios (uno por cada lista de precios y UoM).

7. **Precios por Proveedor vs Listas de Precios**:
   - `VendorProductPrice`: Precio de compra al proveedor
   - `ProductPrice`: Precio de venta al cliente (por lista de precios)

8. **Conversiones UoM**: Las conversiones son específicas por producto. Un producto puede tener diferentes factores de conversión que otro.
