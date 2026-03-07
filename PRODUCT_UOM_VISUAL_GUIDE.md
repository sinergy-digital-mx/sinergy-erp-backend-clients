# Product UoM System - Visual Implementation Guide

## UI Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCT CREATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Step 1: Create Product
┌──────────────────────────────────────────┐
│ Product Form                             │
├──────────────────────────────────────────┤
│ SKU: [LAPTOP-001]                        │
│ Name: [Laptop Dell XPS 13]               │
│ Description: [High-performance laptop]   │
│ Category: [Electronics]                  │
│ Subcategory: [Computers]                 │
│                                          │
│ [Create Product]                         │
└──────────────────────────────────────────┘
                    ↓
Step 2: Assign UoMs
┌──────────────────────────────────────────┐
│ Available UoMs from Catalog              │
├──────────────────────────────────────────┤
│ ☐ Pieza (Individual unit)                │
│ ☐ Display (Display package)              │
│ ☐ Caja (Complete box)                    │
│ ☐ Pallet (Complete pallet)               │
│ ☐ Bulto (Product bundle)                 │
│ ☐ Docena (Twelve units)                  │
│ ☐ Metro (Linear meter)                   │
│ ☐ Kilogramo (Kilogram weight)            │
│                                          │
│ [Assign Selected]                        │
└──────────────────────────────────────────┘
                    ↓
Step 3: View Assigned UoMs
┌──────────────────────────────────────────┐
│ Assigned Units of Measure                │
├──────────────────────────────────────────┤
│ ✓ Pieza (Individual unit)      [Remove]  │
│ ✓ Display (Display package)    [Remove]  │
│ ✓ Caja (Complete box)          [Remove]  │
└──────────────────────────────────────────┘
                    ↓
Step 4: Create Conversions
┌──────────────────────────────────────────┐
│ Create Conversion Rule                   │
├──────────────────────────────────────────┤
│ Source UoM: [Caja ▼]                     │
│ Target UoM: [Display ▼]                  │
│ Factor: [5]                              │
│                                          │
│ [Create Relationship]                    │
└──────────────────────────────────────────┘
                    ↓
Step 5: View Conversions
┌──────────────────────────────────────────┐
│ Conversion Rules                         │
├──────────────────────────────────────────┤
│ Caja → Display (5)           [Delete]    │
│ Display → Pieza (10)         [Delete]    │
│ Caja → Pieza (50) [calculated]           │
└──────────────────────────────────────────┘
                    ↓
Step 6: Test Conversions
┌──────────────────────────────────────────┐
│ Quantity Converter                       │
├──────────────────────────────────────────┤
│ Quantity: [2]                            │
│ From: [Caja ▼]                           │
│ To: [Pieza ▼]                            │
│                                          │
│ [Convert]                                │
│                                          │
│ Result: 2 Cajas = 100 Piezas ✓           │
└──────────────────────────────────────────┘
                    ↓
Step 7: Set Vendor Prices
┌──────────────────────────────────────────┐
│ Vendor Prices                            │
├──────────────────────────────────────────┤
│ Vendor: [Vendor A ▼]                     │
│ UoM: [Pieza ▼]                           │
│ Price: [999.99]                          │
│                                          │
│ [Add Price]                              │
│                                          │
│ Prices:                                  │
│ Vendor A - Pieza: $999.99    [Delete]    │
│ Vendor A - Caja: $9,999.90   [Delete]    │
└──────────────────────────────────────────┘
```

## Component Breakdown

### 1. Product Form Component
```
┌─────────────────────────────────────────┐
│ Product Form                            │
├─────────────────────────────────────────┤
│ Input: SKU                              │
│ Input: Name                             │
│ TextArea: Description                   │
│ Select: Category                        │
│ Select: Subcategory                     │
│ Button: Create                          │
└─────────────────────────────────────────┘
```

### 2. Catalog UoM List Component
```
┌─────────────────────────────────────────┐
│ Catalog UoMs                            │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Name      │ Description             │ │
│ ├─────────────────────────────────────┤ │
│ │ Pieza     │ Individual unit         │ │
│ │ Display   │ Display package         │ │
│ │ Caja      │ Complete box            │ │
│ │ Pallet    │ Complete pallet         │ │
│ │ Bulto     │ Product bundle          │ │
│ │ Docena    │ Twelve units            │ │
│ │ Metro     │ Linear meter            │ │
│ │ Kilogramo │ Kilogram weight         │ │
│ └─────────────────────────────────────┘ │
│ [Assign Selected]                       │
└─────────────────────────────────────────┘
```

### 3. Assigned UoMs Component
```
┌─────────────────────────────────────────┐
│ Assigned UoMs                           │
├─────────────────────────────────────────┤
│ ✓ Pieza (Individual unit)      [Remove] │
│ ✓ Display (Display package)    [Remove] │
│ ✓ Caja (Complete box)          [Remove] │
└─────────────────────────────────────────┘
```

### 4. Conversion Form Component
```
┌─────────────────────────────────────────┐
│ Create Conversion                       │
├─────────────────────────────────────────┤
│ Source UoM: [Caja ▼]                    │
│ Target UoM: [Display ▼]                 │
│ Factor: [5]                             │
│ [Create]                                │
└─────────────────────────────────────────┘
```

### 5. Conversions Table Component
```
┌─────────────────────────────────────────┐
│ Conversions                             │
├─────────────────────────────────────────┤
│ ┌───────────────────────────────────┐   │
│ │ Source  │ Target  │ Factor │ Act  │   │
│ ├───────────────────────────────────┤   │
│ │ Caja    │ Display │ 5      │ Del  │   │
│ │ Display │ Pieza   │ 10     │ Del  │   │
│ │ Caja    │ Pieza   │ 50*    │ -    │   │
│ └───────────────────────────────────┘   │
│ * Calculated automatically              │
└─────────────────────────────────────────┘
```

### 6. Quantity Converter Component
```
┌─────────────────────────────────────────┐
│ Quantity Converter                      │
├─────────────────────────────────────────┤
│ Quantity: [2]                           │
│ From: [Caja ▼]                          │
│ To: [Pieza ▼]                           │
│ [Convert]                               │
│                                         │
│ Result: 2 Cajas = 100 Piezas ✓          │
└─────────────────────────────────────────┘
```

### 7. Vendor Prices Component
```
┌─────────────────────────────────────────┐
│ Vendor Prices                           │
├─────────────────────────────────────────┤
│ Vendor: [Vendor A ▼]                    │
│ UoM: [Pieza ▼]                          │
│ Price: [999.99]                         │
│ [Add Price]                             │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ Vendor   │ UoM     │ Price │ Act  │   │
│ ├───────────────────────────────────┤   │
│ │ Vendor A │ Pieza   │ 999.99│ Del  │   │
│ │ Vendor A │ Caja    │ 9999.9│ Del  │   │
│ │ Vendor B │ Display │ 4999.9│ Del  │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Complete Product View

```
┌─────────────────────────────────────────────────────────────┐
│ Product: Laptop Dell XPS 13                                 │
├─────────────────────────────────────────────────────────────┤
│ SKU: LAPTOP-001                                             │
│ Category: Electronics > Computers                           │
│ Description: High-performance laptop                        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Units of Measure                                        │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ✓ Pieza (Individual unit)                               │ │
│ │ ✓ Display (Display package)                             │ │
│ │ ✓ Caja (Complete box)                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Conversions                                             │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 1 Caja = 5 Displays                                     │ │
│ │ 1 Display = 10 Piezas                                   │ │
│ │ 1 Caja = 50 Piezas (calculated)                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Vendor Prices                                           │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Vendor A - Pieza: $999.99                               │ │
│ │ Vendor A - Caja: $9,999.90                              │ │
│ │ Vendor B - Display: $4,999.95                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Created: 2026-03-07 | Updated: 2026-03-07                  │
└─────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Application State                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ product: {                                               │
│   id: "prod-123",                                        │
│   sku: "LAPTOP-001",                                     │
│   name: "Laptop Dell XPS 13",                            │
│   uoms: [                                                │
│     { id: "uom-1", catalog: { name: "Pieza" } },        │
│     { id: "uom-2", catalog: { name: "Display" } },      │
│     { id: "uom-3", catalog: { name: "Caja" } }          │
│   ],                                                     │
│   relationships: [                                       │
│     { source: "uom-3", target: "uom-2", factor: 5 },    │
│     { source: "uom-2", target: "uom-1", factor: 10 }    │
│   ],                                                     │
│   prices: [                                              │
│     { vendor: "v1", uom: "uom-1", price: 999.99 },      │
│     { vendor: "v1", uom: "uom-3", price: 9999.90 }      │
│   ]                                                      │
│ }                                                        │
│                                                          │
│ catalog: [                                               │
│   { id: "cat-1", name: "Pieza", ... },                  │
│   { id: "cat-2", name: "Display", ... },                │
│   { id: "cat-3", name: "Caja", ... },                   │
│   ...                                                    │
│ ]                                                        │
│                                                          │
│ loading: false                                           │
│ error: null                                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Error States

### Duplicate UoM Assignment
```
┌─────────────────────────────────────────┐
│ ⚠️ Error                                │
├─────────────────────────────────────────┤
│ This UoM is already assigned to this    │
│ product. Please select a different UoM. │
│                                         │
│ [OK]                                    │
└─────────────────────────────────────────┘
```

### Invalid Conversion Factor
```
┌─────────────────────────────────────────┐
│ ⚠️ Error                                │
├─────────────────────────────────────────┤
│ Conversion factor must be greater than  │
│ zero. Please enter a valid number.      │
│                                         │
│ [OK]                                    │
└─────────────────────────────────────────┘
```

### No Conversion Path
```
┌─────────────────────────────────────────┐
│ ⚠️ Error                                │
├─────────────────────────────────────────┤
│ No conversion path found between        │
│ Caja and Kilogramo.                     │
│                                         │
│ Create a conversion relationship first. │
│                                         │
│ [OK]                                    │
└─────────────────────────────────────────┘
```

## Loading States

```
┌─────────────────────────────────────────┐
│ Loading Catalog UoMs...                 │
├─────────────────────────────────────────┤
│                                         │
│ ⟳ Loading...                            │
│                                         │
└─────────────────────────────────────────┘
```

## Success States

```
┌─────────────────────────────────────────┐
│ ✓ Success                               │
├─────────────────────────────────────────┤
│ UoM assigned successfully!              │
│                                         │
│ [OK]                                    │
└─────────────────────────────────────────┘
```

## Responsive Design

### Mobile View
```
┌──────────────────┐
│ Product Form     │
├──────────────────┤
│ SKU              │
│ [LAPTOP-001]     │
│                  │
│ Name             │
│ [Laptop...]      │
│                  │
│ [Create]         │
└──────────────────┘
        ↓
┌──────────────────┐
│ Catalog UoMs     │
├──────────────────┤
│ ☐ Pieza          │
│ ☐ Display        │
│ ☐ Caja           │
│ ☐ Pallet         │
│ ☐ Bulto          │
│ ☐ Docena         │
│ ☐ Metro          │
│ ☐ Kilogramo      │
│                  │
│ [Assign]         │
└──────────────────┘
```

### Tablet View
```
┌────────────────────────────────────────┐
│ Product Form | Catalog UoMs            │
├────────────────────────────────────────┤
│ SKU: [LAPTOP-001] | ☐ Pieza            │
│ Name: [Laptop...] | ☐ Display          │
│ Desc: [High...]   | ☐ Caja             │
│ [Create]          | [Assign]           │
└────────────────────────────────────────┘
```

### Desktop View
```
┌──────────────────────────────────────────────────────────┐
│ Product Form | Catalog UoMs | Assigned UoMs | Conversions│
├──────────────────────────────────────────────────────────┤
│ SKU: [...]   | ☐ Pieza      | ✓ Pieza       | Caja→Disp │
│ Name: [...]  | ☐ Display    | ✓ Display     | Disp→Piez │
│ [Create]     | [Assign]     | [Remove]      | [Delete]  │
└──────────────────────────────────────────────────────────┘
```

## Color Scheme Recommendations

```
Primary Actions:     #007BFF (Blue)
Success:             #28A745 (Green)
Warning:             #FFC107 (Yellow)
Error:               #DC3545 (Red)
Disabled:            #6C757D (Gray)
Background:          #F8F9FA (Light Gray)
Text:                #212529 (Dark Gray)
Border:              #DEE2E6 (Light Border)
```

## Animation Recommendations

- Fade in/out: 200ms
- Slide in/out: 300ms
- Loading spinner: Continuous rotation
- Success toast: Show 3 seconds then fade out
- Error toast: Show 5 seconds then fade out
