# Properties with Measurement Units - UI Integration Guide

## Overview
Properties now support measurement units (m², hectares, acres, etc.). Each property stores:
- `code`: Property identifier (e.g., "LOT-001")
- `block`: Optional block/section identifier
- `total_area`: Numeric area value
- `measurement_unit_id`: UUID reference to measurement unit
- `measurement_unit`: Full measurement unit object (name, symbol, system)

## Available Measurement Units

Get all measurement units:
```
GET /api/tenant/properties/measurement-units/all
```

Response:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "m2",
    "name": "Metro cuadrado",
    "symbol": "m²",
    "system": "metric",
    "description": "Unidad de área métrica"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "ha",
    "name": "Hectárea",
    "symbol": "ha",
    "system": "metric",
    "description": "Unidad de área métrica (10,000 m²)"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "code": "km2",
    "name": "Kilómetro cuadrado",
    "symbol": "km²",
    "system": "metric",
    "description": "Unidad de área métrica (1,000,000 m²)"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "code": "ft2",
    "name": "Pie cuadrado",
    "symbol": "ft²",
    "system": "imperial",
    "description": "Unidad de área imperial"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "code": "yd2",
    "name": "Yarda cuadrada",
    "symbol": "yd²",
    "system": "imperial",
    "description": "Unidad de área imperial"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "code": "acres",
    "name": "Acres",
    "symbol": "ac",
    "system": "imperial",
    "description": "Unidad de área imperial"
  }
]
```

## Create Property

```
POST /api/tenant/properties
```

Request body:
```json
{
  "code": "LOT-001",
  "block": "A",
  "name": "Lote Premium",
  "description": "Lote en zona residencial",
  "location": "Calle Principal 123",
  "group_id": "group-uuid",
  "total_area": 500,
  "measurement_unit_id": "550e8400-e29b-41d4-a716-446655440001",
  "total_price": 250000,
  "currency": "MXN",
  "status": "disponible"
}
```

Response includes full measurement_unit object:
```json
{
  "id": "property-uuid",
  "code": "LOT-001",
  "block": "A",
  "name": "Lote Premium",
  "total_area": 500,
  "measurement_unit_id": "550e8400-e29b-41d4-a716-446655440001",
  "measurement_unit": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "m2",
    "name": "Metro cuadrado",
    "symbol": "m²",
    "system": "metric"
  },
  "total_price": 250000,
  "currency": "MXN",
  "status": "disponible",
  "created_at": "2026-02-19T10:30:00Z"
}
```

## Get Properties

```
GET /api/tenant/properties
GET /api/tenant/properties?groupId=group-uuid
```

Returns array of properties with measurement_unit relation loaded.

## Get Single Property

```
GET /api/tenant/properties/:id
```

Returns property with full measurement_unit object.

## Update Property

```
PUT /api/tenant/properties/:id
```

Can update any field including measurement_unit_id:
```json
{
  "total_area": 600,
  "measurement_unit_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

## UI Implementation Notes

1. Load measurement units on component mount for dropdown/select
2. Display area as: `{total_area} {measurement_unit.symbol}` (e.g., "500 m²")
3. When creating/editing, require both total_area and measurement_unit_id
4. Group measurement units by system (metric/imperial) for better UX
5. Default to m² (metric system) for new properties
