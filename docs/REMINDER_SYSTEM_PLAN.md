# Volunteer Reminder System - Comprehensive Plan

## Executive Summary

This document outlines the design and implementation plan for a customizable volunteer reminder system, including admin UI for viewing signups and managing reminder delivery.

---

## Part 1: Research Findings

### 1.1 Optimal Reminder Timing (from Acuity Scheduling research)

| Timing               | Purpose                                       | Channel              |
| -------------------- | --------------------------------------------- | -------------------- |
| **At signup**        | Confirmation, set expectations                | Email (if available) |
| **2-3 days before**  | Allow cancellation/rescheduling within policy | SMS or Email         |
| **1-8 hours before** | Final actionable reminder                     | SMS (98% open rate)  |

**Key Insight**: Multiple reminders at different intervals reduce no-shows more effectively than a single reminder.

### 1.2 SMS vs Email Effectiveness

| Channel   | Open Rate | Best For                                 |
| --------- | --------- | ---------------------------------------- |
| **SMS**   | 98%       | Same-day, time-sensitive, short messages |
| **Email** | ~20%      | Detailed info, links, prep instructions  |

**Recommendation for Church Volunteers**: SMS is primary (volunteers are often on-the-go), with optional email for detailed event info.

### 1.3 Reminder Message Best Practices

Essential elements:

- Volunteer name (personalization)
- Event date and time
- Role/service type
- Location (if applicable)
- Contact info for questions

**Template Example**:

```
Hi {name}, reminder: You're signed up for {role} at {event} on {date} at {time}. Questions? Reply to this text.
```

### 1.4 Status Indicators (from NN/g research)

Use **contextual, conditional, passive indicators**:

| Status       | Icon        | Color | Meaning                              |
| ------------ | ----------- | ----- | ------------------------------------ |
| ✅ Sent      | Checkmark   | Green | Reminder delivered successfully      |
| ⏳ Scheduled | Clock       | Amber | Reminder queued for future delivery  |
| ❌ Failed    | X           | Red   | Delivery failed (actionable - retry) |
| 📵 No Phone  | Phone slash | Gray  | No phone number on file              |

### 1.5 Preference Customization Levels (from SuprSend research)

Three levels of control:

1. **Organization-level defaults** (admin sets for all events)
2. **Event-level overrides** (per-event customization)
3. **Individual opt-out** (volunteers can unsubscribe)

---

## Part 2: Feature Requirements

### 2.1 Admin UI - Volunteer List Display

**Current State**: Shows only "1/1 slots" badge
**Required State**: Expandable cards showing:

```
┌─────────────────────────────────────────────────────────────────────┐
│ ≡ Scripture Reader for Call To Worship    [1/1 slots] [▼ Expand]   │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 👤 John Smith                                               │  │
│   │    📱 555-123-4567                                          │  │
│   │    ✅ Reminder sent Jan 24, 6:00 PM                         │  │
│   └─────────────────────────────────────────────────────────────┘  │
│   [📤 Send Reminders Now]                                          │
└─────────────────────────────────────────────────────────────────────┘
```

**Data to display per volunteer**:

- Name
- Phone number (masked for privacy: 555-\*\*\*-4567)
- Reminder status with timestamp
- Sign-up timestamp

### 2.2 Reminder Scheduling Settings

**Organization-Level Settings** (Settings page):

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📬 Reminder Settings                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Default Reminder Schedule:                                          │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ ☑ 2 days before event    at  6:00 PM  ▼                        ││
│ │ ☑ 2 hours before event                                          ││
│ │ ☐ 1 week before event    at  [time]   ▼                        ││
│ │ [+ Add reminder]                                                 ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ Message Template:                                                   │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Hi {name}, reminder: You're signed up for {role} at {event}    ││
│ │ on {date} at {time}. Questions? Reply to this text.            ││
│ └─────────────────────────────────────────────────────────────────┘│
│ Available variables: {name}, {role}, {event}, {date}, {time}       │
│                                                                     │
│ [Save Settings]                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Event-Level Override** (per-event settings):

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚙️ Event Reminder Settings                                          │
├─────────────────────────────────────────────────────────────────────┤
│ ○ Use organization defaults                                         │
│ ● Custom for this event                                             │
│                                                                     │
│ [Same UI as above for custom schedule]                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Manual Reminder Actions

**Per-Role Actions**:

- "Send Reminders Now" - sends to all volunteers in that role
- "Send to Pending Only" - sends only to those who haven't received yet

**Per-Volunteer Actions** (on hover/click):

- "Resend Reminder" - for failed deliveries
- "View History" - modal showing all sent reminders

### 2.4 Reminder History & Logs

**Per-Event Summary**:

```
Reminders: 8 sent, 2 pending, 1 failed
```

**Detailed Log** (expandable or modal):
| Volunteer | Phone | Status | Sent At | Message |
|-----------|-------|--------|---------|---------|
| John Smith | 555-**_-4567 | ✅ Delivered | Jan 24, 6:00 PM | "Hi John..." |
| Jane Doe | 555-_**-6543 | ❌ Failed | Jan 24, 6:00 PM | Error: Invalid number |

---

## Part 3: Database Schema Changes

### 3.1 New Table: `reminder_settings`

```sql
CREATE TABLE reminder_settings (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  event_id INTEGER REFERENCES volunteer_events(id), -- NULL for org defaults

  -- Reminder schedule (JSONB for flexibility)
  schedule JSONB NOT NULL DEFAULT '[
    {"type": "days_before", "value": 2, "time": "18:00"},
    {"type": "hours_before", "value": 2}
  ]',

  -- Message template
  message_template TEXT NOT NULL DEFAULT 'Hi {name}, reminder: You''re signed up for {role} at {event} on {date} at {time}.',

  -- Settings
  enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, event_id)
);
```

### 3.2 New Table: `reminder_logs`

```sql
CREATE TABLE reminder_logs (
  id SERIAL PRIMARY KEY,
  signup_id INTEGER REFERENCES volunteer_signups(id) ON DELETE CASCADE,

  -- Delivery info
  phone VARCHAR(20),
  message TEXT,

  -- Status
  status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'failed', 'pending'
  error_message TEXT,

  -- Timing
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,

  -- Metadata
  trigger_type VARCHAR(20), -- 'scheduled', 'manual', 'cron'

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reminder_logs_signup ON reminder_logs(signup_id);
CREATE INDEX idx_reminder_logs_status ON reminder_logs(status);
CREATE INDEX idx_reminder_logs_scheduled ON reminder_logs(scheduled_for) WHERE status = 'pending';
```

### 3.3 Modify `volunteer_signups` Table

```sql
ALTER TABLE volunteer_signups
ADD COLUMN last_reminder_sent_at TIMESTAMP,
ADD COLUMN reminder_count INTEGER DEFAULT 0;
```

---

## Part 4: API Endpoints

### 4.1 Reminder Settings

```
GET    /api/admin/reminder-settings?organizationId=X
POST   /api/admin/reminder-settings
PATCH  /api/admin/reminder-settings/:id
```

### 4.2 Manual Reminder Sending

```
POST   /api/admin/reminders/send
Body: {
  listId?: number,      // Send to all in a role
  signupId?: number,    // Send to specific volunteer
  eventId?: number      // Send to all in an event
}
```

### 4.3 Reminder Logs

```
GET    /api/admin/reminders/logs?eventId=X&listId=Y
```

### 4.4 Volunteer List with Reminder Status

```
GET    /api/admin/lists/:listId/signups
Response: {
  signups: [
    {
      id: 1,
      name: "John Smith",
      phone: "555-123-4567",
      signed_up_at: "2026-01-20T10:00:00Z",
      reminder_status: "sent",
      last_reminder_sent_at: "2026-01-24T18:00:00Z"
    }
  ]
}
```

---

## Part 5: Implementation Phases

### Phase 1: Admin UI - Volunteer List Display (Priority: HIGH)

**Estimated effort**: 4-6 hours

1. Create API endpoint to fetch signups with reminder status
2. Update admin UI to show expandable role cards
3. Display volunteer names, phones, and basic status

### Phase 2: Database Schema & Reminder Logging (Priority: HIGH)

**Estimated effort**: 2-3 hours

1. Create migration for `reminder_logs` table
2. Modify existing cron job to log reminders
3. Add `last_reminder_sent_at` to signups table

### Phase 3: Reminder Settings UI (Priority: MEDIUM)

**Estimated effort**: 6-8 hours

1. Create `reminder_settings` table
2. Build settings UI component
3. Create API endpoints for CRUD operations
4. Integrate with existing cron job

### Phase 4: Manual Reminder Sending (Priority: MEDIUM)

**Estimated effort**: 3-4 hours

1. Create "Send Reminders" API endpoint
2. Add buttons to admin UI
3. Show confirmation and results

### Phase 5: Reminder History & Logs (Priority: LOW)

**Estimated effort**: 4-5 hours

1. Build logs viewer component
2. Add filtering and search
3. Export functionality (optional)

---

## Part 6: UI Mockups

### 6.1 Role Card - Collapsed State

```
┌─────────────────────────────────────────────────────────────────────┐
│ ≡ Scripture Reader for Call To Worship                              │
│                                                                     │
│   [1/1 slots]  [✅ 1 reminded]  [QR] [Lock] [Delete]    [▼]        │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Role Card - Expanded State

```
┌─────────────────────────────────────────────────────────────────────┐
│ ≡ Scripture Reader for Call To Worship                              │
│                                                                     │
│   [1/1 slots]  [✅ 1 reminded]  [QR] [Lock] [Delete]    [▲]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   👤 John Smith                                                     │
│      📱 555-123-4567                                                │
│      ✅ Reminder sent Jan 24, 6:00 PM                               │
│      [Resend]                                                       │
│   ─────────────────────────────────────────────────────────────     │
│   👤 Jane Doe                                                       │
│      📵 No phone number                                             │
│      ⚠️ Cannot send reminder                                        │
│                                                                     │
│   [📤 Send All Reminders]  [⚙️ Reminder Settings]                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Reminder Settings Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚙️ Reminder Settings                                         [X]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ When to send reminders:                                             │
│                                                                     │
│   ☑ 2 days before    at  6:00 PM  ▼    [🗑️]                        │
│   ☑ 2 hours before                      [🗑️]                        │
│   [+ Add another reminder]                                          │
│                                                                     │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                     │
│ Message template:                                                   │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Hi {name}, reminder: You're signed up for {role} at {event}    ││
│ │ on {date} at {time}. Questions? Reply to this text.            ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ Variables: {name} {role} {event} {date} {time}                      │
│                                                                     │
│ Preview:                                                            │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ Hi John, reminder: You're signed up for Scripture Reader at    ││
│ │ Regular Sunday Service on Sun, Jan 25 at 9:00 AM. Questions?   ││
│ │ Reply to this text.                                            ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│                                    [Cancel]  [Save Settings]        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 7: Critical Analysis of Your Ideas

| Your Idea                      | Assessment       | Recommendation                      |
| ------------------------------ | ---------------- | ----------------------------------- |
| Show signups with names/phones | ✅ Essential     | Implement in Phase 1                |
| See if reminders sent          | ✅ Essential     | Use status indicators (✅⏳❌📵)    |
| See WHEN reminders sent        | ✅ Good          | Show timestamp, secondary styling   |
| Custom reminder timing         | ✅ Important     | Flexible schedule builder (Phase 3) |
| Custom message templates       | ✅ Nice-to-have  | Add variable substitution           |
| Multiple reminder intervals    | ✅ Best practice | Support 1-3 reminders per event     |

### Potential Concerns

1. **SMS Costs**: Each reminder costs money. Consider:
   - Daily/weekly limits per organization
   - Confirmation before bulk sends
   - Cost display in UI

2. **Opt-out Compliance**: Volunteers should be able to opt out of reminders
   - Add unsubscribe link/reply option
   - Track opt-outs in database

3. **Timezone Handling**: Events and reminders should respect local timezone
   - Store times in UTC, display in local time
   - Allow timezone setting per organization

---

## Part 8: Recommended Implementation Order

1. **Week 1**: Phase 1 (Volunteer List Display) + Phase 2 (Database Schema)
2. **Week 2**: Phase 3 (Reminder Settings UI)
3. **Week 3**: Phase 4 (Manual Sending) + Phase 5 (Logs)

---

---

## Part 9: SMS Reply Handling - Deep Research Findings

### 9.1 The Problem: "Reply to this text" - Where Does It Go?

When a volunteer texts back to a reminder, the message needs to go somewhere. This requires:

1. **A dedicated phone number** that can receive SMS (not just send)
2. **A webhook endpoint** to receive inbound messages
3. **A system to store and display** the conversation

### 9.2 How Textbelt Handles Replies

**Good news**: Textbelt supports two-way SMS for U.S. numbers!

**How it works**:

1. When sending an SMS, include a `replyWebhookUrl` parameter
2. If the recipient replies, Textbelt sends an HTTP POST to your webhook
3. The webhook payload contains:
   - `textId`: Original message ID
   - `fromNumber`: Volunteer's phone number
   - `text`: Their reply message

**Example webhook payload**:

```json
{
  "textId": "abc123",
  "fromNumber": "+15551234567",
  "text": "Yes, I'll be there!"
}
```

**Limitations**:

- ⚠️ **U.S. numbers only** - International replies not supported
- ⚠️ **Paid API key required** - Free key cannot receive replies
- ⚠️ **Reply window** - Replies must come within a certain timeframe

### 9.3 Vercel Webhook Requirements

**Can Vercel Hobby (Free) handle webhooks?** ✅ **YES!**

Webhooks are just HTTP POST requests to your API routes. Vercel Hobby supports:

- ✅ Unlimited API routes
- ✅ Serverless functions (10 second timeout on Hobby, 60s on Pro)
- ✅ No special configuration needed

**What you DON'T need Vercel Pro for**:

- Receiving webhooks
- Processing inbound SMS
- Storing data in database

**What you MIGHT need Vercel Pro for**:

- Cron jobs (for scheduled reminders) - **Already addressed in existing setup**
- Longer function timeouts (if processing takes >10s)

### 9.4 Implementation Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Volunteer     │     │    Textbelt     │     │  Vercel/Next.js │
│   Phone         │     │    Service      │     │  Application    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. Send Reminder     │                       │
         │<──────────────────────┼───────────────────────│
         │                       │                       │
         │  2. Volunteer Replies │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │                       │  3. Webhook POST      │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │                       │  4. Store in DB
         │                       │                       │  5. Notify Admin
         │                       │                       │
```

### 9.5 New API Endpoint Required

**`POST /api/webhooks/sms-reply`**

```typescript
// apps/web/src/app/api/webhooks/sms-reply/route.ts

export async function POST(request: Request) {
  const payload = await request.json();

  // Verify webhook signature (security)
  const signature = request.headers.get('X-textbelt-signature');
  const timestamp = request.headers.get('X-textbelt-timestamp');
  // ... verify signature with HMAC-SHA256

  // Store the reply
  await query(
    `
    INSERT INTO sms_replies (text_id, from_number, message, received_at)
    VALUES ($1, $2, $3, NOW())
  `,
    [payload.textId, payload.fromNumber, payload.text]
  );

  // Optionally: Send notification to admin
  // Optionally: Auto-reply with confirmation

  return Response.json({ success: true });
}
```

### 9.6 New Database Table: `sms_replies`

```sql
CREATE TABLE sms_replies (
  id SERIAL PRIMARY KEY,

  -- Link to original reminder
  reminder_log_id INTEGER REFERENCES reminder_logs(id),
  text_id VARCHAR(100), -- Textbelt's message ID

  -- Reply details
  from_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  read_by INTEGER REFERENCES users(id),

  -- Timestamps
  received_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sms_replies_unread ON sms_replies(is_read) WHERE is_read = false;
```

### 9.7 Admin UI for Viewing Replies

**Option A: Inline in Volunteer List**

```
👤 John Smith
   📱 555-123-4567
   ✅ Reminder sent Jan 24, 6:00 PM
   💬 Reply: "Yes, I'll be there!" (Jan 24, 6:15 PM)
```

**Option B: Dedicated Inbox View**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📬 SMS Inbox                                    [Mark All Read]     │
├─────────────────────────────────────────────────────────────────────┤
│ 🔵 John Smith (555-123-4567)           Jan 24, 6:15 PM             │
│    "Yes, I'll be there!"                                            │
│    Re: Scripture Reader reminder for Jan 25                         │
├─────────────────────────────────────────────────────────────────────┤
│ ⚪ Jane Doe (555-987-6543)              Jan 24, 5:30 PM             │
│    "Can someone cover for me? I'm sick"                             │
│    Re: Greeter reminder for Jan 25                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.8 Best Practices for Two-Way SMS (from research)

| Practice                          | Implementation                                     |
| --------------------------------- | -------------------------------------------------- |
| **Don't ignore replies**          | Show unread count badge in admin nav               |
| **Maintain conversation history** | Store all messages in `sms_replies` table          |
| **Manage opt-out**                | Detect "STOP" keyword, mark volunteer as opted-out |
| **Respond promptly**              | Show notification to admin, consider auto-reply    |
| **Personalize**                   | Include volunteer name in any auto-replies         |

### 9.9 Auto-Reply Options

**Simple acknowledgment** (recommended):

```
Thanks for your reply! A coordinator will follow up if needed.
```

**Keyword-based auto-replies**:
| Keyword | Auto-Reply |
|---------|------------|
| YES, CONFIRM | "Great, see you there!" |
| NO, CANCEL | "Thanks for letting us know. We'll find a replacement." |
| STOP | "You've been unsubscribed from reminders." |
| HELP | "Reply YES to confirm, NO to cancel, or STOP to unsubscribe." |

### 9.10 Cost Considerations

**Textbelt Pricing** (as of research):

- Sending SMS: ~$0.05 per message
- Receiving replies: Included with paid key
- No monthly fee, pay-per-use

**Vercel Hobby** (Free):

- ✅ Webhooks: Free
- ✅ API routes: Free
- ✅ Database queries: Depends on your DB provider (Neon free tier is generous)

### 9.11 Security Considerations

1. **Verify webhook signatures** - Prevent spoofed requests
2. **Rate limit the endpoint** - Prevent abuse
3. **Sanitize message content** - Prevent XSS when displaying
4. **Don't expose phone numbers** - Mask in UI (555-\*\*\*-4567)

### 9.12 Implementation Phases (Updated)

| Phase | Description                                        | Effort  |
| ----- | -------------------------------------------------- | ------- |
| **1** | Admin UI - Volunteer list with names/phones/status | 4-6 hrs |
| **2** | Database schema for reminder logs                  | 2-3 hrs |
| **3** | Customizable reminder settings UI                  | 6-8 hrs |
| **4** | Manual "Send Reminders" button                     | 3-4 hrs |
| **5** | Reminder history/logs viewer                       | 4-5 hrs |
| **6** | **SMS Reply webhook + storage**                    | 3-4 hrs |
| **7** | **Admin inbox for viewing replies**                | 4-5 hrs |
| **8** | **Auto-reply system (optional)**                   | 2-3 hrs |

---

## Part 10: Decision Matrix - Do We Need This?

### 10.1 "Reply to this text" - Is It Worth It?

| Approach                        | Pros                    | Cons                                   |
| ------------------------------- | ----------------------- | -------------------------------------- |
| **No reply support**            | Simple, no extra code   | Dead-end for volunteers with questions |
| **Reply goes to admin's phone** | Easy, no webhook needed | Admin's personal number exposed        |
| **Webhook + Inbox**             | Professional, trackable | More code, ~$0.05/reply cost           |
| **Just provide contact info**   | Simple                  | Volunteers may not call/email          |

**Recommendation**: Start with **Option 4** (provide contact info), add **Option 3** (webhook inbox) later if needed.

### 10.2 Simplified Message Template

Instead of "Reply to this text", use:

```
Hi {name}, reminder: You're signed up for {role} at {event} on {date} at {time}.
Questions? Contact [Coordinator Name] at [phone/email].
```

This avoids the complexity of two-way SMS while still providing a clear path for questions.

---

## Appendix: Research Sources

1. Acuity Scheduling - "The Ultimate Guide to Appointment Reminders"
2. NN/g - "Indicators, Validations, and Notifications"
3. SetProduct - "Notification UI Design Guide"
4. SuprSend - "The Ultimate Guide to Perfecting Notification Preferences"
5. Justinmind - "Dashboard Design Best Practices"
6. Justinmind - "List UI Design Principles"
7. Textbelt Documentation - "Receiving SMS Replies"
8. Twilio - "Messaging Webhooks"
9. Text-Em-All - "Two-Way SMS: How to Effectively Manage Your Replies"
10. Vercel - "Limits Documentation"
11. Hookdeck - "How to Receive Webhooks in Vercel Serverless Functions"
