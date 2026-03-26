# Email Thread Integration with Leads

## What's Been Set Up

### 1. New Lead Fields (Migration)
Added to track email thread activity:
- `last_email_thread_status` - Latest thread status (draft, sent, replied, closed, archived)
- `last_email_thread_id` - Reference to latest thread
- `email_thread_count` - Total threads for lead

### 2. New Lead Query Filters
Filter leads by email thread status:
- `last_email_thread_status` - Filter by specific status (replied, sent, etc.)
- `no_email_threads` - Find leads with no email threads
- `has_unread_threads` - Find leads with unread threads

### 3. Two Threads Created for Lead 7286
Run this to create sample threads:
```bash
npm run ts-node src/database/scripts/create-lead-7286-threads.ts
```

Creates:
- **Thread 1**: "Initial Contact" (status: sent, no reply)
- **Thread 2**: "Follow-up" (status: replied, customer responded)

Lead 7286 will be marked as:
- `email_contacted: true`
- `customer_answered: true`
- `last_email_thread_status: replied`
- `email_thread_count: 2`

## Filter Examples

### Get leads that have been contacted but not replied
```
GET /api/tenant/leads?contacted_no_reply=true
```

### Get leads with replied threads
```
GET /api/tenant/leads?last_email_thread_status=replied
```

### Get leads with no email threads
```
GET /api/tenant/leads?no_email_threads=true
```

### Get leads with unread threads
```
GET /api/tenant/leads?has_unread_threads=true
```

### Combine filters
```
GET /api/tenant/leads?email_contacted=true&customer_answered=false
```

## How It Works

1. When you create an email thread via `/api/tenant/email-threads`, the lead's `email_contacted` flag is set to true
2. When a customer replies, the thread status changes to "replied" and lead's `customer_answered` is set to true
3. The lead's `last_email_thread_status` always reflects the most recent thread status
4. Use these fields to segment and filter leads in your UI

## Run Migration
```bash
npm run typeorm migration:run
```

Then run the script to create sample threads for lead 7286.
