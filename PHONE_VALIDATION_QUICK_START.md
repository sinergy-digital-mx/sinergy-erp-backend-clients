# Phone Validation Quick Start

## What Changed?

Phone numbers are no longer assumed to be 10 digits. The system now supports international phone numbers using the **E.164 format** (e.g., `+52 6647945661`).

## Key Points

✅ **Always include country code** - `+52 6647945661` (Mexico), `+1 2025551234` (USA)  
✅ **E.164 format** - `+[country code][national number]`  
✅ **Flexible input** - Accepts spaces, dashes, parentheses: `+52 (664) 794-5661`  
✅ **50+ countries supported** - Mexico, USA, UK, Germany, China, Brazil, India, and more  

## API Examples

### Create Lead (Mexico)
```bash
curl -X POST http://localhost:3000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan",
    "lastname": "Pérez",
    "email": "juan@example.com",
    "phone": "+52 6647945661",
    "phone_country": "Mexico",
    "phone_code": "+52",
    "status_id": 1,
    "tenant_id": 1
  }'
```

### Create Lead (USA)
```bash
curl -X POST http://localhost:3000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "phone": "+1 2025551234",
    "phone_country": "USA/Canada",
    "phone_code": "+1",
    "status_id": 1,
    "tenant_id": 1
  }'
```

### Create Customer (UK)
```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane",
    "lastname": "Smith",
    "email": "jane@example.com",
    "phone": "+44 2071838750",
    "phone_code": "+44",
    "country": "United Kingdom",
    "status_id": 1
  }'
```

## Supported Countries

| Country | Code | Example |
|---------|------|---------|
| Mexico | +52 | +52 6647945661 |
| USA/Canada | +1 | +1 2025551234 |
| UK | +44 | +44 2071838750 |
| Germany | +49 | +49 3012345678 |
| France | +33 | +33 123456789 |
| Spain | +34 | +34 912345678 |
| Italy | +39 | +39 0123456789 |
| Brazil | +55 | +55 1123456789 |
| Argentina | +54 | +54 1123456789 |
| China | +86 | +86 13012345678 |
| Japan | +81 | +81 312345678 |
| India | +91 | +91 9876543210 |
| Australia | +61 | +61 212345678 |
| And 40+ more... | | |

## Validation Rules

- ✅ Must have country code (e.g., `+52`)
- ✅ National number must be correct length for the country
- ✅ Only digits allowed after country code
- ❌ No country code = error
- ❌ Wrong digit count = error
- ❌ Invalid country code = error

## Error Examples

### Missing Country Code
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{
    "field": "phone",
    "message": "Phone number must be in E.164 format (e.g., +52 6647945661)"
  }]
}
```

### Wrong Digit Count
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{
    "field": "phone",
    "message": "Invalid number of digits for Mexico. Expected 10 digits, got 9"
  }]
}
```

## In Code

### Using the Validator
```typescript
import { parsePhoneNumber, toE164 } from './common/utils/phone.validator';

// Parse and validate
const result = parsePhoneNumber('+52 6647945661');
if (result.isValid) {
  console.log(result.e164); // '+526647945661'
  console.log(result.countryName); // 'Mexico'
}

// Convert to E.164
const e164 = toE164('+52 (664) 794-5661'); // '+526647945661'
```

### In DTOs
```typescript
import { IsPhone } from './common/decorators/is-phone.decorator';

export class CreateLeadDto {
  @IsPhone()
  phone: string;
}
```

## Import Script

```typescript
// Import with default country code
await importer.importFromExcel(filePath, tenantId, '+52'); // Mexico
await importer.importFromExcel(filePath, tenantId, '+1');  // USA
```

## Migration

If you have existing data with old format (just digits), use:

```typescript
import { parsePhoneNumber } from './common/utils/phone.validator';

// Old: '2025551234'
// New:
const result = parsePhoneNumber('2025551234', '+1');
console.log(result.e164); // '+12025551234'
```

## Need Help?

See `PHONE_NUMBER_SYSTEM.md` for complete documentation.
