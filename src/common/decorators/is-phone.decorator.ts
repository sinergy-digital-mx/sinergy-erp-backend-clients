import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { parsePhoneNumber } from '../utils/phone.validator';

@ValidatorConstraint({ name: 'isPhone', async: false })
export class IsPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    const result = parsePhoneNumber(value);
    return result.isValid;
  }

  defaultMessage(): string {
    return 'Phone number must be in E.164 format (e.g., +52 6647945661)';
  }
}

/**
 * Decorator to validate phone numbers in E.164 format
 * Supports international phone numbers with country codes
 * 
 * @example
 * export class CreateLeadDto {
 *   @IsPhone()
 *   phone: string;
 * }
 */
export function IsPhone(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneConstraint,
    });
  };
}
