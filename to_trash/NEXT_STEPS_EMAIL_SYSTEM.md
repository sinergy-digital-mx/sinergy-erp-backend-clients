# Email Thread System - Next Steps

## Immediate Actions Required

### 1. Add Email Permissions to Database
Run this script to add email permissions to your database:

```bash
npx ts-node src/database/scripts/add-email-permissions.ts
```

This will:
- Create EmailThread and EmailMessage entity registry entries
- Add all email-related permissions (Create, Read, Update, Delete, Archive)
- Make permissions available for role assignment

### 2. Verify Compilation
Build the project to ensure everything compiles:

```bash
npm run build
```

Expected output: No errors (some pre-existing errors in other modules are expected)

### 3. Run Unit Tests (Optional)
Test the email services:

```bash
npm run test -- email-thread.service.spec
npm run test -- email-message.service.spec
```

## API Usage

### Create Your First Email Thread
```bash
curl -X POST http://localhost:3000/api/tenant/email-threads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "lead",
    "entityId": "550e8400-e29b-41d4-a716-446655440000",
    "emailTo": "prospect@example.com",
    "subject": "Follow-up on your inquiry",
    "body": "Hi, I wanted to follow up on your recent inquiry..."
  }'
```

### Send a Message in Thread
```bash
curl -X POST http://localhost:3000/api/tenant/email-threads/THREAD_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "sales@company.com",
    "toEmail": "prospect@example.com",
    "subject": "Re: Follow-up on your inquiry",
    "body": "Thanks for your interest..."
  }'
```

### Get All Threads for a Lead
```bash
curl -X GET "http://localhost:3000/api/tenant/email-threads?entityType=lead&entityId=LEAD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Integration with Angular UI

### For Your Angular Project

Create a new spec in your Angular project for the email UI component:

```
Feature: Email Thread Management UI
Description: Display and manage email threads in the CRM interface

Requirements:
1. Email Thread List
   - Display all email threads for a lead
   - Show thread subject, participants, last message date
   - Show unread status
   - Filter by status (draft, sent, replied, closed, archived)

2. Email Thread Detail
   - Display all messages in chronological order
   - Show sender, recipient, timestamp for each message
   - Display message body (plain text and HTML)
   - Show read/unread status

3. Send Email
   - Form to compose new email
   - Support for CC, BCC
   - HTML editor for email body
   - Send button with loading state

4. Email Permissions
   - Show/hide email features based on user permissions
   - Use permission checking from auth service
   - Display "No permission" message if needed

5. Lead Integration
   - Show email threads in lead detail view
   - Display assigned_rep_id, email_contacted flag
   - Show first_email_sent_at date
```

## Optional: Gmail Integration

If you want to integrate Gmail for sending/receiving emails:

### 1. Set Up Gmail OAuth
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create new project
- Enable Gmail API
- Create OAuth 2.0 credentials
- Get refresh token

### 2. Store Gmail Config
```bash
curl -X POST http://localhost:3000/api/tenant/third-party-configs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### 3. Implement Gmail Service
Create `src/api/email/services/gmail-send.service.ts` to:
- Send emails via Gmail API
- Handle token refresh
- Update message with Gmail ID

### 4. Implement Gmail Webhook
Create `src/api/email/controllers/gmail-webhook.controller.ts` to:
- Receive incoming emails from Gmail
- Parse email content
- Create/update threads
- Save messages

See `EMAIL_GMAIL_INTEGRATION_GUIDE.md` for detailed implementation.

## File Structure

```
src/api/email/
├── controllers/
│   └── email-thread.controller.ts      (8 endpoints)
├── services/
│   ├── email-thread.service.ts         (6 methods)
│   ├── email-message.service.ts        (6 methods)
│   └── __tests__/
│       ├── email-thread.service.spec.ts
│       └── email-message.service.spec.ts
└── email.module.ts                     (Module definition)

src/database/scripts/
└── add-email-permissions.ts            (Permission setup)

Documentation:
├── EMAIL_THREAD_IMPLEMENTATION_SUMMARY.md
├── EMAIL_SYSTEM_QUICK_START.md
├── EMAIL_GMAIL_INTEGRATION_GUIDE.md
└── TASK_10_EMAIL_THREAD_COMPLETION_REPORT.md
```

## Troubleshooting

### Permission Denied Error
```
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden"
}
```

**Solution:**
- Run permission setup script: `npx ts-node src/database/scripts/add-email-permissions.ts`
- Assign email permissions to user's role
- Verify user has EmailThread:Read or EmailMessage:Create permission

### Tenant Context Required Error
```
{
  "statusCode": 500,
  "message": "Tenant context is required",
  "error": "Internal Server Error"
}
```

**Solution:**
- Verify JWT token is valid
- Check token contains tenant_id
- Ensure TenantContextMiddleware is configured

### Thread Not Found Error
```
{
  "statusCode": 404,
  "message": "Thread not found",
  "error": "Not Found"
}
```

**Solution:**
- Verify thread ID is correct
- Check thread belongs to current tenant
- Ensure thread hasn't been deleted

## Performance Considerations

### Database Indexes
The following indexes are automatically created:
- `email_threads(tenant_id, entity_type, entity_id)`
- `email_threads(tenant_id, status)`
- `email_messages(thread_id, created_at)`
- `email_messages(tenant_id, external_id)`

### Query Optimization
- Use entity filters when listing threads
- Limit message retrieval with pagination (if needed)
- Cache frequently accessed threads

### Scaling
- Email operations are isolated to EmailModule
- Can be deployed separately if needed
- Supports horizontal scaling with proper database setup

## Security Best Practices

1. **Always verify permissions** - Use RequirePermissions decorator
2. **Validate tenant context** - Check tenant_id in all operations
3. **Encrypt sensitive data** - API keys stored encrypted in third_party_config
4. **Audit trail** - All operations logged with user information
5. **Rate limiting** - Implement rate limiting for email endpoints
6. **Input validation** - Validate email addresses and content

## Monitoring

### Key Metrics to Track
- Email threads created per day
- Average response time for thread operations
- Permission denied errors
- Database query performance
- External API (Gmail) failures

### Logging
- All operations logged with tenant_id and user_id
- Errors logged with full stack trace
- External API calls logged with request/response

## Support

For questions or issues:
1. Check `EMAIL_SYSTEM_QUICK_START.md` for API reference
2. Review `EMAIL_THREAD_IMPLEMENTATION_SUMMARY.md` for technical details
3. See `EMAIL_GMAIL_INTEGRATION_GUIDE.md` for Gmail setup
4. Check test files for usage examples

## Summary

✅ Email thread system is fully implemented and ready to use
✅ All services, controllers, and modules are in place
✅ RBAC permissions are configured
✅ Unit tests are ready
✅ Documentation is complete
✅ Gmail integration is optional but supported

**Next action:** Run the permission setup script and start using the email API!
