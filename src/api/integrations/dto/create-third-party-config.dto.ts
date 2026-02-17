export class CreateThirdPartyConfigDto {
  provider: string; // 'stripe', 'twilio', 'sendgrid', etc.
  name: string;
  api_key: string;
  api_secret?: string;
  webhook_secret?: string;
  metadata?: Record<string, any>;
  is_enabled?: boolean;
  is_test_mode?: boolean;
}
