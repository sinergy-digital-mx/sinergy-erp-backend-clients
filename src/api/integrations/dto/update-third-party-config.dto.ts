export class UpdateThirdPartyConfigDto {
  name?: string;
  api_key?: string;
  api_secret?: string | null;
  webhook_secret?: string | null;
  metadata?: Record<string, any>;
  is_enabled?: boolean;
  is_test_mode?: boolean;
}
