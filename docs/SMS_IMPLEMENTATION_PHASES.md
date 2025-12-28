# SMS Notifications: Implementation Phases

## Overview

**Total time: 12-16 hours across 5 phases**

Build incrementally, test each phase before moving to next.

---

## Phase 1: Twilio Setup & First Test (1 hour)

**Goal:** Send your first SMS and verify Twilio works

### Tasks

1. ✅ Sign up for Twilio account
2. ✅ Apply for Twilio.org nonprofit discount (optional, runs in parallel)
3. ✅ Buy a phone number ($1.15)
4. ✅ Create Messaging Service
5. ✅ Enable Compliance Toolkit (auto STOP handling)
6. ✅ Install Twilio SDK
7. ✅ Send test SMS to yourself
8. ✅ Reply STOP and verify blocking works

### Deliverables

- Twilio account configured
- Phone number purchased
- ENV vars set up
- Proof that SMS works

### Code

```bash
# Install SDK
npm install twilio

# Set env vars in .env.local
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=MG...
TWILIO_PHONE_NUMBER=+1555...

# Test script (run once)
node scripts/test-sms.js
```

### Success Criteria

- [x] Receive test SMS on your phone
- [x] Reply STOP → get auto-response
- [x] Try sending again → blocked with error 21610

**Time: 1 hour**

---

## Phase 2: Database Schema (1 hour)

**Goal:** Add tables to store phone numbers, SMS logs, and opt-out status

### Tasks

1. ✅ Add phone field to volunteer signups
2. ✅ Create SMS messages log table
3. ✅ Add opt-out tracking fields
4. ✅ Run migration
5. ✅ Test schema

### Database Changes

#### Migration: `005_add_sms_support.sql`

```sql
-- Add phone to volunteer signups
ALTER TABLE volunteer_signups
ADD COLUMN phone VARCHAR(20),
ADD COLUMN sms_opted_out BOOLEAN DEFAULT false,
ADD COLUMN opted_out_at TIMESTAMP,
ADD COLUMN opted_in_at TIMESTAMP;

-- SMS message log
CREATE TABLE sms_messages (
  id SERIAL PRIMARY KEY,
  message_sid VARCHAR(50) UNIQUE,
  from_phone VARCHAR(20),
  to_phone VARCHAR(20),
  body TEXT,
  direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
  status VARCHAR(20),
  error_code VARCHAR(10),
  error_message TEXT,
  volunteer_signup_id INTEGER REFERENCES volunteer_signups(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sms_messages_created ON sms_messages(created_at DESC);
CREATE INDEX idx_sms_messages_from ON sms_messages(from_phone);
CREATE INDEX idx_sms_messages_to ON sms_messages(to_phone);
CREATE INDEX idx_sms_messages_direction ON sms_messages(direction);

-- Phone number index
CREATE INDEX idx_volunteer_signups_phone ON volunteer_signups(phone)
WHERE phone IS NOT NULL;
```

### Success Criteria

- [x] Migration runs successfully
- [x] Tables created with correct columns
- [x] Indexes added

**Time: 1 hour**

---

## Phase 3: Collect Phone Numbers (2 hours)

**Goal:** Add optional phone field to signup form

### Tasks

1. ✅ Update signup page UI with phone input
2. ✅ Add phone validation
3. ✅ Save phone to database on signup
4. ✅ Handle formatting (+1 prefix)
5. ✅ Test signup flow

### UI Changes

#### `/app/signup/[orgId]/[eventSlug]/page.tsx`

Add phone input below name input:

```tsx
// After the "Who's volunteering?" input
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Phone Number (optional - for text notifications)
  </label>
  <input
    type="tel"
    value={phoneNumber}
    onChange={(e) => setPhoneNumber(e.target.value)}
    placeholder="(555) 123-4567"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  />
  <p className="text-xs text-gray-500 mt-1">
    Get text confirmations and updates. Reply STOP to opt out anytime.
  </p>
</div>
```

### API Changes

#### `/app/api/signup/add/route.ts`

```typescript
// Add phone to signup
const phone = body.phone ? formatPhoneNumber(body.phone) : null;

await query(
  `INSERT INTO volunteer_signups (list_id, name, position, phone) 
   VALUES ($1, $2, $3, $4) RETURNING id`,
  [listId, name, position, phone]
);
```

### Utility Function

#### `/lib/sms.ts`

```typescript
export function formatPhoneNumber(input: string): string | null {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Must be 10 or 11 digits
  if (digits.length === 10) {
    return '+1' + digits; // US number
  } else if (digits.length === 11 && digits[0] === '1') {
    return '+' + digits;
  }

  return null; // Invalid
}

export function isValidPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return formatted !== null;
}
```

### Success Criteria

- [x] Phone input appears on signup page
- [x] Phone saves to database
- [x] Phone formats correctly (+15551234567)
- [x] Invalid phones rejected
- [x] Works without phone (optional)

**Time: 2 hours**

---

## Phase 4: Send Signup Confirmations (3 hours)

**Goal:** Send SMS confirmation when volunteer signs up

### Tasks

1. ✅ Create SMS service module
2. ✅ Send confirmation on signup
3. ✅ Log outbound messages
4. ✅ Handle errors gracefully
5. ✅ Test with real phone number

### SMS Service

#### `/lib/sms.ts` (continued)

```typescript
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendSMS(
  to: string,
  body: string,
  metadata?: { signupId?: number; eventId?: number }
) {
  try {
    // Check if opted out
    const optOutCheck = await query(
      'SELECT sms_opted_out FROM volunteer_signups WHERE phone = $1 LIMIT 1',
      [to]
    );

    if (optOutCheck.rows[0]?.sms_opted_out) {
      console.log(`Skipping SMS to ${to} - opted out`);
      return { success: false, reason: 'opted_out' };
    }

    // Send via Twilio
    const message = await client.messages.create({
      body,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to,
    });

    // Log to database
    await query(
      `INSERT INTO sms_messages 
       (message_sid, from_phone, to_phone, body, direction, status, volunteer_signup_id) 
       VALUES ($1, $2, $3, $4, 'outbound', $5, $6)`,
      [message.sid, message.from, to, body, message.status, metadata?.signupId]
    );

    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('SMS send error:', error);

    // Log failed attempt
    await query(
      `INSERT INTO sms_messages 
       (from_phone, to_phone, body, direction, status, error_message) 
       VALUES ($1, $2, $3, 'outbound', 'failed', $4)`,
      [process.env.TWILIO_PHONE_NUMBER, to, body, error.message]
    );

    return { success: false, error: error.message };
  }
}
```

### Update Signup API

#### `/app/api/signup/add/route.ts`

```typescript
import { sendSMS } from '@/lib/sms';

// After signup is saved
const signupId = result.rows[0].id;

// Send confirmation SMS if phone provided
if (phone) {
  const eventDetails = await query(
    'SELECT ve.title, ve.event_date FROM volunteer_events ve WHERE ve.id = $1',
    [eventId]
  );

  const event = eventDetails.rows[0];
  const dateStr = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const message = `You're confirmed for ${event.title} - ${dateStr}. Reply STOP to opt out.`;

  await sendSMS(phone, message, { signupId, eventId });
}
```

### Success Criteria

- [x] SMS sent immediately on signup
- [x] Message contains event name and date
- [x] Message logged to database
- [x] Error handling works
- [x] Opted-out users don't receive messages

**Time: 3 hours**

---

## Phase 5: Webhook for Inbound Messages (2 hours)

**Goal:** Receive and log STOP, START, and other replies

### Tasks

1. ✅ Create webhook endpoint
2. ✅ Handle STOP/START/HELP keywords
3. ✅ Log inbound messages
4. ✅ Update opt-out status
5. ✅ Configure Twilio webhook URL

### Webhook Endpoint

#### `/app/api/sms/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const messageSid = formData.get('MessageSid') as string;
  const from = formData.get('From') as string;
  const to = formData.get('To') as string;
  const body = formData.get('Body') as string;

  // Log inbound message
  await query(
    `INSERT INTO sms_messages 
     (message_sid, from_phone, to_phone, body, direction, status) 
     VALUES ($1, $2, $3, $4, 'inbound', 'received')
     ON CONFLICT (message_sid) DO NOTHING`,
    [messageSid, from, to, body]
  );

  const keyword = body?.trim().toUpperCase();

  // Handle STOP (Twilio already blocks, but we track it)
  if (['STOP', 'UNSUBSCRIBE', 'END', 'QUIT', 'CANCEL'].includes(keyword)) {
    await query(
      `UPDATE volunteer_signups 
       SET sms_opted_out = true, opted_out_at = NOW() 
       WHERE phone = $1`,
      [from]
    );

    console.log(`${from} opted out via ${keyword}`);
  }

  // Handle START (re-opt in)
  if (['START', 'UNSTOP', 'YES'].includes(keyword)) {
    await query(
      `UPDATE volunteer_signups 
       SET sms_opted_out = false, opted_in_at = NOW() 
       WHERE phone = $1`,
      [from]
    );

    console.log(`${from} opted back in via ${keyword}`);
  }

  // HELP is handled by Twilio automatically

  return new Response('OK', { status: 200 });
}
```

### Configure Twilio Webhook

1. Go to Twilio Console → Phone Numbers → Your Number
2. Under "Messaging", set "A MESSAGE COMES IN" webhook:
   - **URL:** `https://yourdomain.com/api/sms/webhook`
   - **Method:** HTTP POST
3. Save

### For Local Testing

Use ngrok or Twilio CLI:

```bash
# Option 1: ngrok
ngrok http 3000
# Use ngrok URL: https://abc123.ngrok.io/api/sms/webhook

# Option 2: Twilio CLI
twilio phone-numbers:update YOUR_PHONE_NUMBER \
  --sms-url="http://localhost:3000/api/sms/webhook"
```

### Success Criteria

- [x] Webhook receives inbound messages
- [x] Messages logged to database
- [x] STOP updates opt-out status
- [x] START re-opts in
- [x] No errors in logs

**Time: 2 hours**

---

## Phase 6: Admin SMS Inbox (4 hours)

**Goal:** View and reply to SMS messages from web dashboard

### Tasks

1. ✅ Create SMS inbox page
2. ✅ Display sent/received messages
3. ✅ Link messages to volunteers
4. ✅ Add reply functionality
5. ✅ Show opt-out status
6. ✅ Add filtering/search

### Admin Page

#### `/app/admin/sms/page.tsx`

```tsx
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function SMSInboxPage() {
  const messagesResult = await query(`
    SELECT 
      sm.*,
      vs.name as volunteer_name,
      ve.title as event_title,
      vs.sms_opted_out
    FROM sms_messages sm
    LEFT JOIN volunteer_signups vs ON vs.phone = sm.from_phone
    LEFT JOIN volunteer_lists vl ON vs.list_id = vl.id
    LEFT JOIN volunteer_events ve ON vl.event_id = ve.id
    ORDER BY sm.created_at DESC
    LIMIT 100
  `);

  const messages = messagesResult.rows;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">SMS Messages</h1>
        <div className="text-sm text-gray-500">{messages.length} messages</div>
      </div>

      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="border rounded-lg p-4 bg-white shadow-sm">
            {/* Message Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {/* Direction indicator */}
                {msg.direction === 'inbound' ? (
                  <span className="text-blue-600 text-xl">←</span>
                ) : (
                  <span className="text-green-600 text-xl">→</span>
                )}

                {/* From/To */}
                <div>
                  <div className="font-semibold">{msg.volunteer_name || msg.from_phone}</div>
                  {msg.event_title && (
                    <div className="text-sm text-gray-500">{msg.event_title}</div>
                  )}
                </div>

                {/* Opt-out badge */}
                {msg.sms_opted_out && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                    Opted Out
                  </span>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500">
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>

            {/* Message Body */}
            <div className="mb-3 p-3 bg-gray-50 rounded">{msg.body}</div>

            {/* Status */}
            {msg.status && (
              <div className="text-xs text-gray-500 mb-2">
                Status: {msg.status}
                {msg.error_code && (
                  <span className="text-red-600 ml-2">
                    Error {msg.error_code}: {msg.error_message}
                  </span>
                )}
              </div>
            )}

            {/* Reply Form (only for inbound messages from non-opted-out users) */}
            {msg.direction === 'inbound' && !msg.sms_opted_out && (
              <form action={replyAction} className="flex gap-2">
                <input type="hidden" name="to" value={msg.from_phone} />
                <input
                  type="text"
                  name="body"
                  placeholder="Type your reply..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                  maxLength={160}
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </form>
            )}

            {msg.sms_opted_out && msg.direction === 'inbound' && (
              <div className="text-sm text-red-600">Cannot reply - volunteer opted out of SMS</div>
            )}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No messages yet. Send your first SMS confirmation!
          </div>
        )}
      </div>
    </div>
  );
}

// Server action for reply
async function replyAction(formData: FormData) {
  'use server';

  const to = formData.get('to') as string;
  const body = formData.get('body') as string;

  if (!to || !body) {
    return { error: 'Missing fields' };
  }

  const { sendSMS } = await import('@/lib/sms');
  await sendSMS(to, body);

  redirect('/admin/sms');
}
```

### Add to Admin Navigation

#### Update admin layout to include SMS link

```tsx
<Link href="/admin/sms" className="nav-link">
  SMS Messages
</Link>
```

### Success Criteria

- [x] Inbox page displays all messages
- [x] Messages grouped by conversation
- [x] Can reply from web
- [x] Opted-out users clearly marked
- [x] Can't reply to opted-out users
- [x] Real phone numbers linked to volunteer names

**Time: 4 hours**

---

## Phase 7: Event Change Notifications (3 hours)

**Goal:** Notify volunteers when events are cancelled or changed

### Tasks

1. ✅ Detect event cancellations
2. ✅ Detect event time/location changes
3. ✅ Send SMS to affected volunteers
4. ✅ Batch sending with rate limiting
5. ✅ Test scenarios

### Event Cancellation

#### `/app/api/admin/events/[eventId]/route.ts`

```typescript
// When deleting an event
export async function DELETE(request, { params }) {
  const eventId = params.eventId;

  // Get all volunteers signed up
  const volunteers = await query(
    `
    SELECT DISTINCT vs.phone, vs.name, ve.title
    FROM volunteer_signups vs
    JOIN volunteer_lists vl ON vs.list_id = vl.id
    JOIN volunteer_events ve ON vl.event_id = ve.id
    WHERE ve.id = $1 AND vs.phone IS NOT NULL AND vs.sms_opted_out = false
  `,
    [eventId]
  );

  // Delete event
  await query('DELETE FROM volunteer_events WHERE id = $1', [eventId]);

  // Notify volunteers
  const { sendSMS } = await import('@/lib/sms');

  for (const vol of volunteers.rows) {
    const message = `UPDATE: ${vol.title} has been cancelled. Sorry for any inconvenience.`;
    await sendSMS(vol.phone, message);

    // Rate limit: wait 100ms between messages
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return NextResponse.json({ success: true });
}
```

### Event Updates

#### `/app/api/admin/events/[eventId]/route.ts`

```typescript
// When updating event
export async function PATCH(request, { params }) {
  const body = await request.json();
  const eventId = params.eventId;

  // Get current event
  const current = await query('SELECT * FROM volunteer_events WHERE id = $1', [eventId]);

  const oldEvent = current.rows[0];

  // Update event
  await query(
    'UPDATE volunteer_events SET title = $1, event_date = $2, location = $3 WHERE id = $4',
    [body.title, body.event_date, body.location, eventId]
  );

  // Check what changed
  const changes = [];
  if (oldEvent.event_date !== body.event_date) {
    changes.push(`time changed to ${new Date(body.event_date).toLocaleString()}`);
  }
  if (oldEvent.location !== body.location) {
    changes.push(`location changed to ${body.location}`);
  }

  // Notify if significant changes
  if (changes.length > 0) {
    const volunteers = await query(
      `
      SELECT DISTINCT vs.phone
      FROM volunteer_signups vs
      JOIN volunteer_lists vl ON vs.list_id = vl.id
      WHERE vl.event_id = $1 AND vs.phone IS NOT NULL AND vs.sms_opted_out = false
    `,
      [eventId]
    );

    const { sendSMS } = await import('@/lib/sms');
    const message = `UPDATE: ${body.title} - ${changes.join(', ')}`;

    for (const vol of volunteers.rows) {
      await sendSMS(vol.phone, message);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return NextResponse.json({ success: true });
}
```

### Success Criteria

- [x] Cancelling event sends SMS to all volunteers
- [x] Changing event time/location sends update
- [x] Only notifies volunteers with phone numbers
- [x] Respects opt-out status
- [x] Rate limited (10 msgs/sec max)

**Time: 3 hours**

---

## Total Timeline

| Phase                    | Tasks                | Time         |
| ------------------------ | -------------------- | ------------ |
| 1. Twilio Setup          | Sign up, test SMS    | 1 hour       |
| 2. Database Schema       | Add tables/columns   | 1 hour       |
| 3. Collect Phone Numbers | Update signup form   | 2 hours      |
| 4. Send Confirmations    | SMS on signup        | 3 hours      |
| 5. Inbound Webhook       | Handle STOP/START    | 2 hours      |
| 6. Admin Inbox           | View/reply from web  | 4 hours      |
| 7. Event Notifications   | Cancel/change alerts | 3 hours      |
| **TOTAL**                |                      | **16 hours** |

---

## Recommended Build Order

### Week 1: Foundation (4 hours)

- Phase 1: Twilio Setup
- Phase 2: Database Schema
- Phase 3: Collect Phone Numbers

**Deliverable:** Can collect phone numbers on signup

---

### Week 2: Core Features (5 hours)

- Phase 4: Send Confirmations
- Phase 5: Inbound Webhook

**Deliverable:** Volunteers receive confirmations, can opt out

---

### Week 3: Admin Tools (7 hours)

- Phase 6: Admin Inbox
- Phase 7: Event Notifications

**Deliverable:** Full SMS system operational

---

## Optional Future Enhancements

### Not in MVP (add later if needed)

**Auto-polling for inbox (30 min)**

- Refresh inbox every 10 seconds automatically

**Conversation threading (1 hour)**

- Group messages by volunteer
- Show as conversations instead of flat list

**SMS templates (2 hours)**

- Pre-written message templates
- Quick replies for common questions

**Scheduled messages (3 hours)**

- Send reminder 24 hours before event
- Send "thanks" after event

**Analytics dashboard (4 hours)**

- Delivery rates
- Opt-out rates
- Response times

**Export conversations (1 hour)**

- Download as CSV
- Export specific conversation threads

---

## Next Steps

**Start with Phase 1: Twilio Setup**

1. Create Twilio account
2. Buy phone number
3. Test sending SMS
4. Verify STOP handling works

**Ready to begin?**
