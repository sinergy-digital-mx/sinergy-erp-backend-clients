# International Phone Number System

## Overview

This system now supports international phone numbers using the **E.164 format**, which is the international standard for phone numbers. This replaces the previous assumption that all phone numbers were 10 digits (US format).

## E.164 Format

E.164 is the international standard for phone numbers defined by the ITU-T.

**Format:** `+[country code][national number]`

### Examples by Country

| Country | Format | Example |
|---------|--------|---------|
| 🇲🇽 Mexico | +52 + 10 digits | +52 6647945661 |
| 🇺🇸 USA | +1 + 10 digits | +1 2025551234 |
| 🇬🇧 UK | +44 + 9-10 digits | +44 2071838750 |
| 🇩🇪 Germany | +49 + 5-11 digits | +49 3012345678 |
| 🇦🇷 Argentina | +54 + 8-10 digits | +54 1123456789 |
| 🇨🇳 China | +86 + 11 digits | +86 13012345678 |
| 🇫🇷 France | +33 + 9 digits | +33 123456789 |
| 🇮🇹 Italy | +39 + 9-10 digits | +39 0123456789 |
| 🇪🇸 Spain | +34 + 9 digits | +34 912345678 |
| 🇧🇷 Brazil | +55 + 10-11 digits | +55 1123456789 |
| 🇯🇵 Japan | +81 + 9-10 digits | +81 312345678 |
| 🇮🇳 India | +91 + 10 digits | +91 9876543210 |

## Implementation Details

### Phone Validator Utility

Located at: `src/common/utils/phone.validator.ts`

The validator provides:

- **parsePhoneNumber()** - Parse and validate phone numbers
- **isValidE164()** - Check if a number is valid E.164
- **toE164()** - Convert to E.164 format
- **extractCountryCode()** - Get country code from number
- **extractNationalNumber()** - Get national number without country code
- **getCountryName()** - Get country name from country code
- **getSupportedCountryCodes()** - List all supported countries

### Phone Validator Decorator

Located at: `src/common/decorators/is-phone.decorator.ts`

Use `@IsPhone()` decorator on DTO fields to validate phone numbers:

```typescript
import { IsPhone } from '../../common/decorators/is-phone.decorator';

export class CreateLeadDto {
  @IsPhone()
  phone: string;
}
```

### Supported Input Formats

The validator accepts phone numbers in multiple formats:

```typescript
// All of these are valid and will be converted to E.164:
parsePhoneNumber('+52 6647945661');      // E.164 with space
parsePhoneNumber('+52-664-794-5661');    // With dashes
parsePhoneNumber('+52 (664) 794-5661');  // With parentheses
parsePhoneNumber('+526647945661');       // E.164 without spaces
parsePhoneNumber('6647945661', '+52');   // National number + default country code
```

### Database Storage

Phone numbers are stored in the database as:

1. **phone** - Full E.164 formatted number (e.g., `+52 6647945661`)
2. **phone_code** - Country code (e.g., `+52`)
3. **phone_country** - Country name (e.g., `Mexico`)

### API Usage

#### Creating a Lead with Phone Number

```bash
POST /leads
{
  "name": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "phone": "+52 6647945661",
  "phone_country": "Mexico",
  "phone_code": "+52",
  "phone_country": "Mexico",
  "status_id": 1,
  "tenant_id": 1
}
```

#### Creating a Customer with Phone Number

```bash
POST /customers
{
  "name": "Jane",
  "lastname": "Smith",
  "email": "jane@example.com",
  "phone": "+1 2025551234",
  "phone_code": "+1",
  "country": "USA",
  "status_id": 1
}
```

#### Updating with Phone Number

```bash
PATCH /leads/123
{
  "phone": "+44 2071838750",
  "phone_code": "+44",
  "phone_country": "United Kingdom"
}
```

## Validation Rules

### Phone Number Validation

- Must be in E.164 format or convertible to it
- Must have a valid country code
- National number must contain only digits
- National number length must match the country's requirements

### Error Messages

If validation fails, you'll receive:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number must be in E.164 format (e.g., +52 6647945661)"
    }
  ]
}
```

## Supported Countries

The system supports 50+ countries including:

- North America: USA, Canada, Mexico
- Europe: UK, Germany, France, Italy, Spain, Netherlands, Belgium, Austria, Switzerland, Sweden, Norway, Denmark, Finland, Poland, Czech Republic, Hungary, Romania, Greece, Turkey
- Asia: China, Japan, South Korea, Singapore, Malaysia, Thailand, Indonesia, Philippines, India
- South America: Brazil, Chile, Colombia, Peru, Venezuela, Argentina
- Africa: South Africa, Egypt, Nigeria, Morocco, Tunisia
- Oceania: Australia, New Zealand

## Migration Guide

### For Existing Data

If you have existing phone numbers in the old format (e.g., just digits), you can migrate them using the phone validator:

```typescript
import { parsePhoneNumber } from './common/utils/phone.validator';

// Old format: '2025551234'
// New format:
const result = parsePhoneNumber('2025551234', '+1'); // Specify default country
if (result.isValid) {
  console.log(result.e164); // '+12025551234'
}
```

### For Import Scripts

The import script (`src/database/scripts/import-leads-excel.ts`) now accepts a `defaultCountryCode` parameter:

```typescript
await importer.importFromExcel(filePath, tenantId, '+52'); // Mexico
await importer.importFromExcel(filePath, tenantId, '+1');  // USA
```

## Best Practices

1. **Always store in E.164 format** - Ensures consistency across the system
2. **Accept multiple input formats** - Users may provide numbers with spaces, dashes, etc.
3. **Validate on input** - Use the `@IsPhone()` decorator on all phone fields
4. **Display with formatting** - Show numbers in a user-friendly format when displaying
5. **Include country code** - Always require the country code in API requests

## Troubleshooting

### "Unknown country code"

The country code provided is not in the supported list. Check the country code is correct (e.g., `+52` for Mexico, not `52`).

### "Invalid number of digits"

The national number has too many or too few digits for the country. For example, Mexico requires 10 digits, but you provided 9.

### "National number contains non-digit characters"

After removing formatting characters, the number still contains letters or special characters. Ensure the number contains only digits after the country code.

## References

- [E.164 Standard](https://en.wikipedia.org/wiki/E.164)
- [ITU-T E.164 Recommendation](https://www.itu.int/rec/T-REC-E.164/en)
- [Country Calling Codes](https://en.wikipedia.org/wiki/List_of_country_calling_codes)
