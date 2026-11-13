import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';

@ApiExcludeController()
@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly service: WhatsappWebhookService) {}

  @Post('waha')
  @HttpCode(200)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-hmac') hmac?: string,
    @Headers('x-webhook-hmac-algorithm') algorithm?: string,
  ): Promise<{ ok: boolean }> {
    const raw = req.rawBody ?? JSON.stringify(body);
    await this.service.handle(body, raw, hmac, algorithm);
    return { ok: true };
  }
}
