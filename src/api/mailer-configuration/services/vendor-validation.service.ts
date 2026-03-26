import { Injectable } from '@nestjs/common';
import type { ValidationResult } from '../interfaces/validation-result.interface';

/**
 * VendorValidationService
 * Service for validating Resend configuration
 */
@Injectable()
export class VendorValidationService {
  /**
   * Validate Resend API key
   */
  validateResendApiKey(apiKey: string): ValidationResult {
    const errors: string[] = [];

    if (!apiKey) {
      errors.push('API key is required');
    } else if (typeof apiKey !== 'string' || apiKey.length < 10) {
      errors.push('API key must be a string with at least 10 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
