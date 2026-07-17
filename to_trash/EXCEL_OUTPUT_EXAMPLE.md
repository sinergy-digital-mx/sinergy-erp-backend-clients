# 📊 Ejemplo de Datos - Excel Exportado

## Qué Trae el Excel

El archivo Excel que se descarga tiene esta estructura:

### Header (Primera Fila - Con Estilos)
```
┌─────────────────┬──────────────────┬──────────┬─────────────┬──────────────┐
│ Número Contrato │ Cliente          │ Lote     │ Fecha Inicio│ Precio Total │
├─────────────────┼──────────────────┼──────────┼─────────────┼──────────────┤
│ (Azul oscuro)   │ (Azul oscuro)    │ (Azul)   │ (Azul)      │ (Azul)       │
│ (Texto blanco)  │ (Texto blanco)   │ (Blanco) │ (Blanco)    │ (Blanco)     │
└─────────────────┴──────────────────┴──────────┴─────────────┴──────────────┘
```

### Datos (Filas Siguientes)
```
┌─────────────────┬──────────────────┬──────────┬─────────────┬──────────────┐
│ CONT-1-3        │ Jacobo Noe       │ LOT-1-03 │ Mar 19, 2026│ $29,000.00   │
├─────────────────┼──────────────────┼──────────┼─────────────┼──────────────┤
│ CONT-2-12       │ Mario Alberto    │ LOT-2-12 │ Ene 1, 2026 │ $40,494.00   │
├─────────────────┼──────────────────┼──────────┼─────────────┼──────────────┤
│ CONT-3-17       │ Iyart Sagrario   │ LOT-3-17 │ Ene 1, 2026 │ $54,500.00   │
└─────────────────┴──────────────────┴──────────┴─────────────┴──────────────┘
```

---

## Todas las Columnas (14 Total)

```
1. Número Contrato      → CONT-1-3
2. Cliente              → Jacobo Noe Dominguez Maldonado
3. Lote                 → LOT-1-03
4. Fecha Inicio         → Mar 19, 2026
5. Precio Total         → $29,000.00
6. Enganche             → $29,000.00
7. Monto Financiado     → $0.00
8. Saldo Pendiente      → $0.00
9. Meses Pagados        → 1              ← NUEVO
10. Monto Pagado        → $29,000.00     ← NUEVO
11. Próximo Pago        → N/A
12. Monto Próximo Pago  → N/A
13. Estado              → Completado
14. Pagos Vencidos      → 0
```

---

## Ejemplo Real Completo

```
┌──────────────┬─────────────────────────┬──────────┬────────────┬──────────────┬──────────┬─────────────────┬────────────────┬──────────────┬──────────────┬──────────────┬────────────────┬────────────┬────────────────┐
│ Número       │ Cliente                 │ Lote     │ Fecha      │ Precio Total │ Enganche │ Monto Financiado│ Saldo Pendiente│ Meses Pagados│ Monto Pagado │ Próximo Pago │ Monto Próximo  │ Estado     │ Pagos Vencidos │
├──────────────┼─────────────────────────┼──────────┼────────────┼──────────────┼──────────┼─────────────────┼────────────────┼──────────────┼──────────────┼──────────────┼────────────────┼────────────┼────────────────┤
│ CONT-1-3     │ Jacobo Noe Dominguez    │ LOT-1-03 │ Mar 19,2026│ $29,000.00   │ $29,000  │ $0.00           │ $0.00          │ 1            │ $29,000.00   │ N/A          │ N/A            │ Completado │ 0              │
├──────────────┼─────────────────────────┼──────────┼────────────┼──────────────┼──────────┼─────────────────┼────────────────┼──────────────┼──────────────┼──────────────┼────────────────┼────────────┼────────────────┤
│ CONT-2-12    │ Mario Alberto Zuñiga    │ LOT-2-12 │ Ene 1,2026 │ $40,494.00   │ $12,150  │ $28,344.00      │ $27,635.34     │ 3            │ $708.66      │ Apr 5, 2026  │ $236.22        │ Activo     │ 1              │
├──────────────┼─────────────────────────┼──────────┼────────────┼──────────────┼──────────┼─────────────────┼────────────────┼──────────────┼──────────────┼──────────────┼────────────────┼────────────┼────────────────┤
│ CONT-3-17    │ Iyart Sagrario Silva    │ LOT-3-17 │ Ene 1,2026 │ $54,500.00   │ $19,000  │ $35,500.00      │ $34,625.02     │ 3            │ $875.00      │ Apr 5, 2026  │ $291.66        │ Activo     │ 1              │
├──────────────┼─────────────────────────┼──────────┼────────────┼──────────────┼──────────┼─────────────────┼────────────────┼──────────────┼──────────────┼──────────────┼────────────────┼────────────┼────────────────┤
│ CONT-2-17    │ Reyna Isabel Santos     │ LOT-2-17 │ Ene 1,2026 │ $58,110.00   │ $11,622  │ $46,488.00      │ $46,488.00     │ 0            │ $0.00        │ Ene 5, 2026  │ $387.40        │ Activo     │ 4              │
└──────────────┴─────────────────────────┴──────────┴────────────┴──────────────┴──────────┴─────────────────┴────────────────┴──────────────┴──────────────┴──────────────┴────────────────┴────────────┴────────────────┘
```

---

## 🎨 Estilos Actuales

### Header
- **Fondo:** Azul oscuro (#4B5A8A)
- **Texto:** Blanco, Negrita
- **Alineación:** Centrada

### Datos
- **Formato de Fechas:** Mar 19, 2026 (es-MX)
- **Formato de Montos:** $29,000.00 (USD)
- **Ancho de Columnas:** Automático

---

## 💡 Cómo Mejorar los Estilos

Si quieres más estilos, puedo agregar:

### Opción 1: Colores Alternados en Filas
```
Fila 1: Blanco
Fila 2: Gris claro (#F5F5F5)
Fila 3: Blanco
Fila 4: Gris claro
...
```

### Opción 2: Colores por Estado
```
Completado  → Verde (#90EE90)
Activo      → Azul (#ADD8E6)
Vencido     → Rojo (#FFB6C6)
```

### Opción 3: Resaltar Valores Importantes
```
Pagos Vencidos > 0  → Rojo
Saldo Pendiente > 0 → Naranja
Monto Pagado > 0    → Verde
```

### Opción 4: Bordes y Formato
```
- Bordes en todas las celdas
- Bordes más gruesos en header
- Alineación derecha para números
- Alineación izquierda para texto
```

---

## 📋 Datos Específicos por Contrato

### Contrato Completado
```
CONT-1-3 (Jacobo Noe)
├─ Precio Total: $29,000.00
├─ Enganche: $29,000.00
├─ Monto Financiado: $0.00
├─ Saldo Pendiente: $0.00
├─ Meses Pagados: 1
├─ Monto Pagado: $29,000.00
├─ Próximo Pago: N/A
├─ Estado: Completado
└─ Pagos Vencidos: 0
```

### Contrato Activo con Pagos
```
CONT-2-12 (Mario Alberto)
├─ Precio Total: $40,494.00
├─ Enganche: $12,150.00
├─ Monto Financiado: $28,344.00
├─ Saldo Pendiente: $27,635.34
├─ Meses Pagados: 3
├─ Monto Pagado: $708.66
├─ Próximo Pago: Apr 5, 2026
├─ Monto Próximo Pago: $236.22
├─ Estado: Activo
└─ Pagos Vencidos: 1
```

### Contrato Activo sin Pagos
```
CONT-2-17 (Reyna Isabel)
├─ Precio Total: $58,110.00
├─ Enganche: $11,622.00
├─ Monto Financiado: $46,488.00
├─ Saldo Pendiente: $46,488.00
├─ Meses Pagados: 0
├─ Monto Pagado: $0.00
├─ Próximo Pago: Ene 5, 2026
├─ Monto Próximo Pago: $387.40
├─ Estado: Activo
└─ Pagos Vencidos: 4
```

---

## 🔄 Cálculos Automáticos

El Excel calcula automáticamente:

```
Monto Financiado = Precio Total - Enganche
                 = $40,494.00 - $12,150.00
                 = $28,344.00

Meses Pagados = COUNT(pagos con status='pagado')
              = 3 pagos completados

Monto Pagado = SUM(pagos con status='pagado')
             = $236.22 + $236.22 + $236.22
             = $708.66

Pagos Vencidos = COUNT(pagos donde payment_date < HOY AND status IN pendiente/parcial)
               = 1 pago vencido
```

---

## 📥 Descarga

El archivo se descarga automáticamente con el nombre:
```
contratos-2026-04-09.xlsx
```

---

## ✅ Resumen

**Qué trae:**
- 14 columnas con información completa
- Datos de pagos realizados (meses y monto)
- Próximo pago y pagos vencidos
- Estilos profesionales en header

**Cómo se ve:**
- Header azul oscuro con texto blanco
- Datos en filas blancas
- Fechas en formato local
- Montos en USD

**Puedo mejorar:**
- Agregar colores alternados en filas
- Colorear por estado del contrato
- Resaltar valores importantes
- Agregar bordes y formato adicional

¿Quieres que agregue alguno de estos estilos?
