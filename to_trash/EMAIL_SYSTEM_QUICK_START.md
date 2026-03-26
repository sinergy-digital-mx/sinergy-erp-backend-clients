# Email Thread System - Quick Start Guide

## Setup

### 1. Add Email Permissions to Database
Run the permission setup script to add email permissions:
```bash
npx ts-node src/database/scripts/add-email-permissions.ts
```

This creates:
- EmailThread entity registry entry
- EmailMessage entity registry entry
- All email-related permissions (Create, Read, Update, Delete, Archive)

### 2. Assign Permissions to Roles
Email permissions are automatically included in the Sales Representative role. For other roles, assign:
- `EmailThread:Create` - To allow creating threads
- `EmailThread:Read` - To allow viewing threads
- `EmailThread:Update` - To allow updating thread status and marking as read
- `EmailMessage:Create` - To allow sending messages
- `EmailMessage:Read` - To allow viewing messages
- `EmailMessage:Update` - To allow marking messages as read

## API Endpoints

### Create Email Thread
```http
POST /api/tenant/email-threads
Authorization: Bearer {token}
Content-Type: application/json

{
  "entityType": "lead",
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "emailTo": "prospect@example.com",
  "subject": "Follow-up on your inquiry",
  "body": "Hi, I wanted to follow up on your recent inquiry..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "thread": {
      "id": "thread-uuid",
      "tenant_id": "tenant-uuid",
      "entity_type": "lead",
      "entity_id": "lead-uuid",
      "subject": "Follow-up on your inquiry",
      "email_from": "noreply@example.com",
      "email_to": "prospect@example.com",
      "status": "draft",
      "is_read": false,
      "message_count": 1,
      "created_at": "2026-02-10T10:00:00Z"
    },
    "message": {
      "id": "msg-uuid",
      "thread_id": "thread-uuid",
      "from_email": "noreply@example.com",
      "to_email": "prospect@example.com",
      "subject": "Follow-up on your inquiry",
      "body": "Hi, I wanted to follow up...",
      "direction": "outbound",
      "status": "pending",
      "created_at": "2026-02-10T10:00:00Z"
    }
  }
}
```

### Get Threads for Entity
```http
GET /api/tenant/email-threads?entityType=lead&entityId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

### Get All Threads with Filters
```http
GET /api/tenant/email-threads?status=replied&archived=false
Authorization: Bearer {token}
```

**Query Parameters:**
- `entityType` - Filter by entity type (lead, customer, etc.)
- `entityId` - Filter by entity ID
- `status` - Filter by status (draft, sent, replied, closed, archived)
- `archived` - Filter by archived status (true/false)

### Get Thread Details
```http
GET /api/tenant/email-threads/{threadId}
Authorization: Bearer {token}
```

**Response includes:**
- Thread metadata
- All messages in chronological order
- Message read status

### Send Message in Thread
```http
POST /api/tenant/email-threads/{threadId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "fromEmail": "sales@company.com",
  "toEmail": "prospect@example.com",
  "subject": "Re: Follow-up on your inquiry",
  "body": "Thanks for your interest. Here's what I found...",
  "bodyHtml": "<p>Thanks for your interest. Here's what I found...</p>",
  "cc": "manager@company.com",
  "bcc": "archive@company.com"
}
```

### Get Messages in Thread
```http
GET /api/tenant/email-threads/{threadId}/messages
Authorization: Bearer {token}
```

### Update Thread Status
```http
PUT /api/tenant/email-threads/{threadId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "archived"
}
```

**Valid statuses:**
- `draft` - Thread not yet sent
- `sent` - Thread sent, awaiting reply
- `replied` - Prospect replied
- `closed` - Thread closed
- `archived` - Thread archived (soft delete)

### Mark Thread as Read
```http
PUT /api/tenant/email-threads/{threadId}/mark-read
Authorization: Bearer {token}
```

### Mark Message as Read
```http
PUT /api/tenant/email-threads/{threadId}/messages/{messageId}/mark-read
Authorization: Bearer {token}
```

### Mark All Messages in Thread as Read
```http
PUT /api/tenant/email-threads/{threadId}/messages/mark-all-read
Authorization: Bearer {token}
```

## Data Model

### EmailThread
```typescript
{
  id: string;                    // UUID
  tenant_id: string;             // Multi-tenant isolation
  entity_type: string;           // 'lead', 'customer', etc.
  entity_id: string;             // UUID of linked entity
  subject: string;               // Email subject
  email_from: string;            // Sender email
  email_to: string;              // Recipient email
  status: string;                // draft|sent|replied|closed|archived
  last_message_at: Date;         // Last message timestamp
  message_count: number;         // Total messages in thread
  is_read: boolean;              // Thread read status
  created_by: string;            // User who created thread
  created_at: Date;              // Creation timestamp
  updated_at: Date;              // Last update timestamp
  messages: EmailMessage[];       // Related messages
}
```

### EmailMessage
```typescript
{
  id: string;                    // UUID
  tenant_id: string;             // Multi-tenant isolation
  thread_id: string;             // Parent thread UUID
  message_id: string;            // Unique email ID
  in_reply_to: string;           // Parent message ID (for threading)
  from_email: string;            // Sender email
  to_email: string;              // Recipient email
  cc: string;                    // CC recipients
  bcc: string;                   // BCC recipients
  subject: string;               // Email subject
  body: string;                  // Plain text body
  body_html: string;             // HTML body
  direction: string;             // inbound|outbound
  status: string;                // pending|sent|delivered|failed|received
  external_provider: string;     // gmail|outlook|etc
  external_id: string;           // Provider's message ID
  created_at: Date;              // Creation timestamp
  received_at: Date;             // When received (inbound only)
  read_at: Date;                 // When marked as read
}
```

## Lead Integration

When a thread is created for a lead, the lead is automatically updated:
```typescript
{
  assigned_rep_id: userId,           // Sales rep who created thread
  email_contacted: true,             // Lead was contacted via email
  first_email_sent_at: Date          // When first email was sent
}
```

## Permission Requirements

| Endpoint | Method | Permission Required |
|----------|--------|-------------------|
| Create Thread | POST | EmailThread:Create |
| List Threads | GET | EmailThread:Read |
| Get Thread Details | GET | EmailThread:Read |
| Update Thread Status | PUT | EmailThread:Update |
| Mark Thread Read | PUT | EmailThread:Update |
| Send Message | POST | EmailMessage:Create |
| Get Messages | GET | EmailMessage:Read |
| Mark Message Read | PUT | EmailMessage:Update |
| Mark All Read | PUT | EmailMessage:Update |

## Error Handling

### Thread Not Found
```json
{
  "statusCode": 404,
  "message": "Thread not found",
  "error": "Not Found"
}
```

### Duplicate Message
```json
{
  "statusCode": 400,
  "message": "Message already exists",
  "error": "Bad Request"
}
```

### Missing Tenant Context
```json
{
  "statusCode": 500,
  "message": "Tenant context is required",
  "error": "Internal Server Error"
}
```

### Permission Denied
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden"
}
```

## Best Practices

1. **Always check permissions** - Verify user has required permissions before making API calls
2. **Use entity filters** - When listing threads, filter by entity type and ID for better performance
3. **Archive instead of delete** - Use status='archived' for soft delete, maintains audit trail
4. **Mark as read** - Keep track of read status for user experience
5. **Handle external IDs** - When receiving emails from providers, always include external_id to prevent duplicates
6. **Tenant isolation** - All operations automatically enforce tenant boundaries

## Testing

Run unit tests:
```bash
npm run test -- email-thread.service.spec
npm run test -- email-message.service.spec
```

Run all tests:
```bash
npm run test
```

## Troubleshooting

### Tenant context is required error
- Ensure JWT token is valid and contains tenant_id
- Check that TenantContextMiddleware is properly configured
- Verify user is authenticated

### Permission denied error
- Check user's roles and permissions
- Verify role has required email permissions assigned
- Run add-email-permissions script if permissions missing

### Thread not found error
- Verify thread ID is correct
- Ensure thread belongs to current tenant
- Check thread hasn't been deleted

### Duplicate message error
- Message with same external_id already exists
- Use different external_id for new messages
- Check for message ID conflicts
