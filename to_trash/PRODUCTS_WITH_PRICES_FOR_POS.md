# Productos con Precios para POS

## Cambios Implementados

Se ha actualizado el endpoint de productos para incluir los precios de las listas de precios.

### Archivos Modificados
- `src/api/products/repositories/product.repository.ts`

### Relaciones Agregadas
Ahora todos los endpoints de productos incluyen:
- `prices`: Array de precios del producto
- `prices.price_list`: Información de la lista de precios asociada

---

## Endpoints Actualizados

### 1. Listar Todos los Productos
```http
GET /api/tenant/products
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "product-uuid",
    "sku": "PROD-001",
    "name": "Producto A",
    "description": "Descripción",
    "category": { ... },
    "subcategory": { ... },
    "base_uom": { ... },
    "uoms": [ ... ],
    "prices": [
      {
        "id": "price-uuid-1",
        "price": 250.00,
        "uom_id": "uom-uuid",
        "discount_percentage": 0,
        "price_list": {
          "id": "list-uuid-1",
          "name": "Menudeo",
          "is_default": true,
          "is_active": true
        }
      },
      {
        "id": "price-uuid-2",
        "price": 200.00,
        "uom_id": "uom-uuid",
        "discount_percentage": 0,
        "price_list": {
          "id": "list-uuid-2",
          "name": "Mayoreo",
          "is_default": false,
          "is_active": true
        }
      }
    ]
  }
]
```

### 2. Obtener Producto por ID
```http
GET /api/tenant/products/{id}
Authorization: Bearer {token}
```

Incluye la misma estructura con precios.

### 3. Listar por Categoría
```http
GET /api/tenant/products/category/{categoryId}
Authorization: Bearer {token}
```

Incluye precios en cada producto.

### 4. Listar por Subcategoría
```http
GET /api/tenant/products/subcategory/{subcategoryId}
Authorization: Bearer {token}
```

Incluye precios en cada producto.

---

## Uso en POS

### Opción 1: Usar Precio de Lista por Defecto

```typescript
// En tu servicio de POS
export class POSService {
  
  getProductPrice(product: Product): number {
    // Buscar el precio de la lista por defecto
    const defaultPrice = product.prices?.find(
      p => p.price_list?.is_default === true
    );
    
    if (defaultPrice) {
      // Aplicar descuento si existe
      const discount = defaultPrice.discount_percentage || 0;
      return defaultPrice.price * (1 - discount / 100);
    }
    
    // Si no hay precio por defecto, usar el primero disponible
    if (product.prices && product.prices.length > 0) {
      const firstPrice = product.prices[0];
      const discount = firstPrice.discount_percentage || 0;
      return firstPrice.price * (1 - discount / 100);
    }
    
    return 0; // Sin precio
  }
}
```

### Opción 2: Seleccionar Lista de Precios en POS

```typescript
export class POSComponent {
  selectedPriceList: string = ''; // ID de la lista seleccionada
  products: Product[] = [];
  
  ngOnInit() {
    // Cargar productos
    this.loadProducts();
    
    // Cargar lista de precios por defecto
    this.loadDefaultPriceList();
  }
  
  loadDefaultPriceList() {
    this.priceListService.getDefaultPriceList().subscribe(list => {
      this.selectedPriceList = list.id;
    });
  }
  
  getProductPrice(product: Product): number {
    if (!this.selectedPriceList) {
      return this.getDefaultPrice(product);
    }
    
    // Buscar precio en la lista seleccionada
    const price = product.prices?.find(
      p => p.price_list?.id === this.selectedPriceList
    );
    
    if (price) {
      const discount = price.discount_percentage || 0;
      return price.price * (1 - discount / 100);
    }
    
    // Fallback a precio por defecto
    return this.getDefaultPrice(product);
  }
  
  getDefaultPrice(product: Product): number {
    const defaultPrice = product.prices?.find(
      p => p.price_list?.is_default === true
    );
    
    if (defaultPrice) {
      const discount = defaultPrice.discount_percentage || 0;
      return defaultPrice.price * (1 - discount / 100);
    }
    
    return 0;
  }
  
  addToOrder(product: Product) {
    const price = this.getProductPrice(product);
    
    this.orderLines.push({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: price,
      subtotal: price
    });
  }
}
```

### Opción 3: Mostrar Múltiples Precios

```html
<!-- En tu template de POS -->
<div class="product-card" *ngFor="let product of products">
  <h3>{{ product.name }}</h3>
  <p>SKU: {{ product.sku }}</p>
  
  <!-- Mostrar todos los precios disponibles -->
  <div class="prices">
    <div *ngFor="let price of product.prices" 
         [class.default]="price.price_list?.is_default">
      <span class="price-list-name">{{ price.price_list?.name }}:</span>
      <span class="price">${{ price.price | number:'1.2-2' }}</span>
      <span *ngIf="price.discount_percentage > 0" class="discount">
        (-{{ price.discount_percentage }}%)
      </span>
    </div>
  </div>
  
  <button (click)="addToOrder(product)">Agregar</button>
</div>
```

---

## Estructura de Datos

### Product con Prices

```typescript
interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: Category;
  subcategory?: Subcategory;
  base_uom?: UoMCatalog;
  uoms?: UoM[];
  prices?: ProductPrice[];
  // ... otros campos
}

interface ProductPrice {
  id: string;
  price: number;
  uom_id: string;
  discount_percentage: number;
  valid_from?: string;
  valid_to?: string;
  is_active: boolean;
  price_list?: PriceList;
}

interface PriceList {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  valid_from?: string;
  valid_to?: string;
}
```

---

## Validaciones Recomendadas

### 1. Verificar que el Producto Tenga Precio

```typescript
hasPrice(product: Product): boolean {
  return product.prices && product.prices.length > 0;
}

canAddToOrder(product: Product): boolean {
  if (!this.hasPrice(product)) {
    this.showError('Este producto no tiene precio asignado');
    return false;
  }
  return true;
}
```

### 2. Verificar Fechas de Validez

```typescript
isPriceValid(price: ProductPrice): boolean {
  const now = new Date();
  
  if (price.valid_from) {
    const validFrom = new Date(price.valid_from);
    if (validFrom > now) {
      return false; // Precio aún no válido
    }
  }
  
  if (price.valid_to) {
    const validTo = new Date(price.valid_to);
    if (validTo < now) {
      return false; // Precio expirado
    }
  }
  
  return price.is_active;
}

getValidPrice(product: Product, priceListId: string): number {
  const price = product.prices?.find(
    p => p.price_list?.id === priceListId && this.isPriceValid(p)
  );
  
  if (price) {
    const discount = price.discount_percentage || 0;
    return price.price * (1 - discount / 100);
  }
  
  return 0;
}
```

### 3. Filtrar Productos sin Precio

```typescript
// En el componente
get productsWithPrice(): Product[] {
  return this.products.filter(p => this.hasPrice(p));
}

// En el template
<div *ngFor="let product of productsWithPrice">
  <!-- ... -->
</div>
```

---

## Ejemplo Completo: Servicio de POS

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class POSProductService {
  constructor(
    private http: HttpClient,
    private priceListService: PriceListService
  ) {}

  /**
   * Obtener productos con precios para POS
   */
  getProductsForPOS(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/tenant/products').pipe(
      map(products => {
        // Filtrar solo productos con precio
        return products.filter(p => p.prices && p.prices.length > 0);
      })
    );
  }

  /**
   * Obtener precio de producto según lista seleccionada
   */
  getProductPrice(product: Product, priceListId?: string): number {
    if (!product.prices || product.prices.length === 0) {
      return 0;
    }

    let targetPrice: ProductPrice | undefined;

    if (priceListId) {
      // Buscar precio en la lista especificada
      targetPrice = product.prices.find(
        p => p.price_list?.id === priceListId && 
             p.is_active && 
             this.isPriceValid(p)
      );
    }

    // Fallback a precio por defecto
    if (!targetPrice) {
      targetPrice = product.prices.find(
        p => p.price_list?.is_default === true && 
             p.is_active && 
             this.isPriceValid(p)
      );
    }

    // Fallback al primer precio activo
    if (!targetPrice) {
      targetPrice = product.prices.find(
        p => p.is_active && this.isPriceValid(p)
      );
    }

    if (!targetPrice) {
      return 0;
    }

    // Aplicar descuento
    const discount = targetPrice.discount_percentage || 0;
    return targetPrice.price * (1 - discount / 100);
  }

  /**
   * Verificar si un precio está dentro de su período de validez
   */
  private isPriceValid(price: ProductPrice): boolean {
    const now = new Date();

    if (price.valid_from) {
      const validFrom = new Date(price.valid_from);
      if (validFrom > now) return false;
    }

    if (price.valid_to) {
      const validTo = new Date(price.valid_to);
      if (validTo < now) return false;
    }

    return true;
  }

  /**
   * Obtener información de precios para mostrar en UI
   */
  getProductPriceInfo(product: Product): {
    hasPrice: boolean;
    defaultPrice: number;
    allPrices: Array<{ listName: string; price: number; isDefault: boolean }>;
  } {
    const hasPrice = product.prices && product.prices.length > 0;
    
    if (!hasPrice) {
      return {
        hasPrice: false,
        defaultPrice: 0,
        allPrices: []
      };
    }

    const defaultPrice = this.getProductPrice(product);
    
    const allPrices = product.prices
      .filter(p => p.is_active && this.isPriceValid(p))
      .map(p => ({
        listName: p.price_list?.name || 'Sin nombre',
        price: p.price * (1 - (p.discount_percentage || 0) / 100),
        isDefault: p.price_list?.is_default || false
      }));

    return {
      hasPrice: true,
      defaultPrice,
      allPrices
    };
  }
}
```

---

## Troubleshooting

### Problema: Los productos no tienen precios

**Causa:** No se han asignado precios a los productos en ninguna lista de precios.

**Solución:**
1. Crear una lista de precios (si no existe)
2. Asignar precios a los productos:
   ```http
   POST /api/tenant/price-lists/product-prices
   {
     "price_list_id": "uuid-lista",
     "product_id": "uuid-producto",
     "uom_id": "uuid-uom",
     "price": 250.00
   }
   ```

### Problema: El array prices está vacío

**Causa:** El servidor no está devolviendo la relación.

**Solución:**
1. Verificar que reiniciaste el servidor después de los cambios
2. Verificar que la relación `prices` existe en la entidad Product
3. Verificar los logs del servidor para errores

### Problema: Aparecen precios de listas inactivas

**Causa:** No se está filtrando por `is_active`.

**Solución:**
```typescript
const activePrices = product.prices?.filter(p => p.is_active);
```

---

## Resumen

✅ **Cambios aplicados:**
- Agregada relación `prices` y `prices.price_list` en todos los endpoints de productos

✅ **Endpoints actualizados:**
- `GET /api/tenant/products`
- `GET /api/tenant/products/:id`
- `GET /api/tenant/products/category/:categoryId`
- `GET /api/tenant/products/subcategory/:subcategoryId`

✅ **Próximos pasos:**
1. Reiniciar el servidor NestJS
2. Verificar que los productos devuelven el array `prices`
3. Implementar la lógica de selección de precio en el POS
4. Asignar precios a los productos que no los tengan

