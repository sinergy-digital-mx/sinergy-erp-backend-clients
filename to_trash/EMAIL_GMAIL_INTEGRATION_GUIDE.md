# Email Thread System - Gmail Integration Guide

## Overview
The email thread system is designed to work seamlessly with Gmail API for sending and receiving emails. This guide explains how to integrate Gmail credentials and sync emails.

## Gmail Configuration Storage

### Using Third-Party Config Entity
Gmail credentials are stored in the `third_party_config` table with the following structure:

```typescript
{
  id: string;                    // UUID
  tenant_id: string;             // Multi-tenant isolation
  provider: 'gmail';             // Provider type
  encrypted_api_key: string;     // Encrypted Client ID
  encrypted_api_secret: string;  // Encrypted Client Secret
  metadata: {
    refresh_token: string;       // OAuth refresh token
    access_token: string;        // Current access token
    email_account: string;       // Gmail account email
    scopes: string[];            // OAuth scopes
    expires_at: Date;            // Token expiration
  };
  status: 'active' | 'inactive'; // Enable/disable
  test_mode: boolean;            // Test mode flag
  created_by: string;            // User who created config
  updated_by: string;            // Last user who updated
  created_at: Date;
  updated_at: Date;
}
```

### Create Gmail Configuration
```http
POST /api/tenant/third-party-configs
Authorization: Bearer {token}
Content-Type: application/json

{
  "provider": "gmail",
  "encrypted_api_key": "YOUR_CLIENT_ID",
  "encrypted_api_secret": "YOUR_CLIENT_SECRET",
  "metadata": {
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "access_token": "YOUR_ACCESS_TOKEN",
    "email_account": "sales@company.com",
    "scopes": [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify"
    ],
    "expires_at": "2026-02-10T15:00:00Z"
  },
  "status": "active",
  "test_mode": false
}
```

### Get Gmail Configuration
```http
GET /api/tenant/third-party-configs?provider=gmail
Authorization: Bearer {token}
```

## Email Sending via Gmail

### Service Implementation Example
```typescript
import { Injectable } from '@nestjs/common';
import { EmailMessageService } from './email-message.service';
import { ThirdPartyConfigService } from '../integrations/services/third-party-config.service';
import { google } from 'googleapis';

@Injectable()
export class GmailSendService {
  constructor(
    private emailMessageService: EmailMessageService,
    private configService: ThirdPartyConfigService,
  ) {}

  async sendViaGmail(
    tenantId: string,
    threadId: string,
    fromEmail: string,
    toEmail: string,
    subject: string,
    body: string,
    bodyHtml?: string,
  ): Promise<void> {
    // Get Gmail config
    const config = await this.configService.getByProvider(tenantId, 'gmail');
    if (!config || config.status !== 'active') {
      throw new Error('Gmail not configured for this tenant');
    }

    // Refresh token if needed
    const accessToken = await this.refreshTokenIfNeeded(config);

    // Create Gmail client
    const gmail = google.gmail({ version: 'v1', auth: this.createAuth(accessToken) });

    // Create email message
    const message = this.createEmailMessage(
      fromEmail,
      toEmail,
      subject,
      body,
      bodyHtml,
    );

    // Send via Gmail
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(message).toString('base64'),
      },
    });

    // Save to email thread
    await this.emailMessageService.sendMessage(
      tenantId,
      threadId,
      fromEmail,
      toEmail,
      subject,
      body,
      bodyHtml,
    );

    // Update message with Gmail ID
    // (Add method to EmailMessageService to update external_id)
    await this.updateMessageWithGmailId(threadId, response.data.id);
  }

  private async refreshTokenIfNeeded(config: any): Promise<string> {
    const now = new Date();
    if (config.metadata.expires_at < now) {
      // Refresh token logic here
      // Update config with new access token
    }
    return config.metadata.access_token;
  }

  private createAuth(accessToken: string): any {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
  }

  private createEmailMessage(
    from: string,
    to: string,
    subject: string,
    body: string,
    bodyHtml?: string,
  ): string {
    const headers = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
    ];

    if (bodyHtml) {
      headers[3] = 'Content-Type: text/html; charset="UTF-8"';
    }

    return headers.join('\r\n') + '\r\n\r\n' + (bodyHtml || body);
  }

  private async updateMessageWithGmailId(threadId: string, gmailId: string): Promise<void> {
    // Implementation to update message with external_id
  }
}
```

## Email Receiving via Gmail Webhooks

### Webhook Handler Example
```typescript
import { Controller, Post, Body, Headers } from '@nestjs/common';
import { EmailThreadService } from './email-thread.service';
import { EmailMessageService } from './email-message.service';
import { google } from 'googleapis';

@Controller('webhooks/gmail')
export class GmailWebhookController {
  constructor(
    private emailThreadService: EmailThreadService,
    private emailMessageService: EmailMessageService,
  ) {}

  @Post('receive')
  async handleGmailWebhook(
    @Body() payload: any,
    @Headers('x-goog-channel-token') token: string,
  ): Promise<void> {
    // Verify webhook token
    if (!this.verifyToken(token)) {
      throw new Error('Invalid webhook token');
    }

    // Get message ID from payload
    const messageId = payload.message.data;

    // Fetch full message from Gmail
    const message = await this.fetchGmailMessage(messageId);

    // Parse email
    const parsed = this.parseGmailMessage(message);

    // Find or create thread
    const thread = await this.findOrCreateThread(
      parsed.tenantId,
      parsed.fromEmail,
      parsed.toEmail,
      parsed.subject,
    );

    // Save message
    await this.emailMessageService.receiveMessage(
      parsed.tenantId,
      thread.id,
      message.id,
      parsed.fromEmail,
      parsed.toEmail,
      parsed.subject,
      parsed.body,
      parsed.bodyHtml,
      parsed.cc,
      parsed.bcc,
      parsed.inReplyTo,
    );
  }

  private verifyToken(token: string): boolean {
    // Implement token verification
    return true;
  }

  private async fetchGmailMessage(messageId: string): Promise<any> {
    // Implement Gmail API call to fetch message
    return {};
  }

  private parseGmailMessage(message: any): any {
    // Parse Gmail message format
    return {
      tenantId: 'tenant-id',
      fromEmail: 'sender@example.com',
      toEmail: 'recipient@example.com',
      subject: 'Subject',
      body: 'Plain text body',
      bodyHtml: '<p>HTML body</p>',
      cc: 'cc@example.com',
      bcc: 'bcc@example.com',
      inReplyTo: 'parent-message-id',
    };
  }

  private async findOrCreateThread(
    tenantId: string,
    fromEmail: string,
    toEmail: string,
    subject: string,
  ): Promise<any> {
    // Find existing thread or create new one
    return {};
  }
}
```

## Gmail OAuth Setup

### 1. Create OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop application)
5. Download credentials JSON

### 2. Get Refresh Token
```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL,
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
  ],
});

// User visits authUrl and grants permission
// Exchange code for tokens
const { tokens } = await oauth2Client.getToken(code);

// Save tokens to third_party_config
// tokens.refresh_token - Store this
// tokens.access_token - Store this
// tokens.expiry_date - Store as expires_at
```

### 3. Store in Third-Party Config
```http
POST /api/tenant/third-party-configs
Authorization: Bearer {token}
Content-Type: application/json

{
  "provider": "gmail",
  "encrypted_api_key": "YOUR_CLIENT_ID",
  "encrypted_api_secret": "YOUR_CLIENT_SECRET",
  "metadata": {
    "refresh_token": "1//YOUR_REFRESH_TOKEN",
    "access_token": "ya29.YOUR_ACCESS_TOKEN",
    "email_account": "sales@company.com",
    "scopes": [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify"
    ],
    "expires_at": "2026-02-10T15:00:00Z"
  },
  "status": "active",
  "test_mode": false
}
```

## Email Thread Workflow with Gmail

### Sending Email
```
1. User creates thread via API
   POST /api/tenant/email-threads
   
2. EmailThreadService creates thread and initial message
   - Thread status: 'draft'
   - Message status: 'pending'
   
3. GmailSendService sends via Gmail API
   - Gets Gmail config from third_party_config
   - Sends message
   - Receives Gmail message ID
   
4. Update message with Gmail ID
   - external_id = Gmail message ID
   - external_provider = 'gmail'
   - status = 'sent'
   
5. Update thread status
   - status = 'sent'
```

### Receiving Email
```
1. Gmail webhook notifies system
   POST /webhooks/gmail/receive
   
2. GmailWebhookController processes webhook
   - Fetches full message from Gmail
   - Parses email content
   
3. Find or create thread
   - Match by subject and participants
   - Create if new conversation
   
4. EmailMessageService receives message
   - direction = 'inbound'
   - status = 'received'
   - external_id = Gmail message ID
   - received_at = current timestamp
   
5. Update thread
   - status = 'replied'
   - is_read = false
   - last_message_at = current timestamp
   
6. Notify user
   - Send notification about new email
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Email Thread System                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  EmailThread ◄──────────────────────► EmailMessage          │
│      │                                      │                │
│      │                                      │                │
│      ▼                                      ▼                │
│  ┌─────────────┐                    ┌──────────────┐        │
│  │ Lead Entity │                    │ Gmail Config │        │
│  │ (assigned   │                    │ (encrypted   │        │
│  │  rep, etc)  │                    │  credentials)│        │
│  └─────────────┘                    └──────────────┘        │
│                                             │                │
│                                             ▼                │
│                                    ┌──────────────────┐     │
│                                    │ Gmail API        │     │
│                                    │ - Send           │     │
│                                    │ - Receive        │     │
│                                    │ - Sync           │     │
│                                    └──────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

1. **Encryption** - API keys and secrets are encrypted using AES-256-GCM
2. **Token Refresh** - Access tokens are automatically refreshed before expiry
3. **Tenant Isolation** - Each tenant has separate Gmail configuration
4. **Audit Trail** - All email operations are logged with user information
5. **Webhook Verification** - Incoming webhooks are verified with token
6. **Rate Limiting** - Implement rate limiting for Gmail API calls

## Testing

### Test Gmail Configuration
```http
POST /api/tenant/third-party-configs/{configId}/test
Authorization: Bearer {token}
```

### Mock Gmail Service for Testing
```typescript
// In test setup
jest.mock('googleapis', () => ({
  gmail: jest.fn(() => ({
    users: {
      messages: {
        send: jest.fn().mockResolvedValue({
          data: { id: 'mock-gmail-id' },
        }),
      },
    },
  })),
}));
```

## Troubleshooting

### Gmail API Errors
- **401 Unauthorized** - Token expired, refresh needed
- **403 Forbidden** - Insufficient scopes, re-authenticate
- **429 Too Many Requests** - Rate limit exceeded, implement backoff

### Message Not Syncing
- Check Gmail webhook is configured
- Verify webhook token is correct
- Check Gmail config is active
- Review error logs

### Duplicate Messages
- Ensure external_id is unique
- Check for message ID conflicts
- Verify webhook idempotency

## References

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Gmail API Scopes](https://developers.google.com/gmail/api/auth/scopes)
- [Gmail Push Notifications](https://developers.google.com/gmail/api/guides/push)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
