# SMS MVP: Ready by Tomorrow (5-6 hours)

## Goal

**Get SMS confirmations working by tomorrow.**

Volunteers can:

- ✅ Enter phone number when signing up
- ✅ Receive instant confirmation SMS
- ✅ Reply STOP to opt out (auto-handled by Twilio)

**What we're SKIPPING for now:**

- ❌ Admin web inbox (use Twilio Console instead)
- ❌ Reply from web (admins can text from phones)
- ❌ Event change notifications (add next week)

---

## Timeline: 5-6 Hours Total

### Phase 1: Twilio Setup (1 hour) - DO THIS FIRST

### Phase 2: Database (30 min)

### Phase 3: Phone Input (1 hour)

### Phase 4: Send SMS (2 hours)

### Phase 5: Webhook (1 hour)

---

## Phase 1: Twilio Setup (1 hour)

**Do this RIGHT NOW:**

### Step 1: Sign Up (10 min)

1. Go to https://www.twilio.com/try-twilio
2. Sign up with email
3. Verify phone number
4. Skip the tutorial

### Step 2: Get Credentials (5 min)

From Twilio Console:

1. Copy **Account SID** (starts with AC...)
2. Copy **Auth Token** (click to reveal)
3. Save these - you'll need them

### Step 3: Buy Phone Number (10 min)

1. Console → Phone Numbers → Buy a Number
2. Search for US number with SMS capability
3. Buy it ($1.15 - uses trial credit)
4. Copy the phone number (format: +15551234567)

### Step 4: Create Messaging Service (15 min)

**IMPORTANT:** Don't skip this! This enables auto STOP handling.

1. Console → Messaging → Services → Create new
2. Friendly name: "Volunteer Notifications"
3. Click Create
4. Copy the **Messaging Service SID** (starts with MG...)
5. Go to "Sender Pool" tab
6. Click "Add Senders"
7. Select your phone number
8. Save

### Step 5: Enable Compliance Toolkit (5 min)

1. Console → Messaging → Settings → General
2. Toggle "Compliance Toolkit" to Enabled
3. Read and accept terms
4. Configure Quiet Hours:
   - Start: 10:00 PM
   - End: 8:00 AM
   - Timezone: America/Chicago (or your timezone)
5. Save

### Step 6: Set Environment Variables (5 min)

Add to your `.env.local`:

```bash
TWILIO_ACCOUNT_SID=AC...  # From Step 2
TWILIO_AUTH_TOKEN=...      # From Step 2
TWILIO_MESSAGING_SERVICE_SID=MG...  # From Step 4
TWILIO_PHONE_NUMBER=+15551234567    # From Step 3
```

### Step 7: Install SDK (2 min)

```bash
npm install twilio
```

### Step 8: Test It Works (10 min)

Create test script:

```bash
# /scripts/test-sms.mjs
import twilio from 'twilio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../apps/web/.env.local');
const envContent = readFileSync(envPath, 'utf-8');

envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    process.env[key] = values.join('=');
  }
});

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log('Sending test SMS...');

client.messages.create({
  body: 'Test from Church Volunteers! Reply STOP to unsubscribe.',
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  to: process.env.TEST_PHONE_NUMBER || '+1YOUR_PHONE_HERE'
})
.then(msg => console.log('✅ Sent! SID:', msg.sid))
.catch(err => console.error('❌ Error:', err.message));
```

Run it:

```bash
node scripts/test-sms.mjs
```

**SUCCESS CRITERIA:**

- [x] You receive SMS on your phone
- [x] Reply STOP → get auto-reply from Twilio
- [x] Run test script again → should fail with error 21610 (opted out)
- [x] Text START → get confirmation
- [x] Run test script again → should work

**Total: 1 hour**

---

## Phase 2: Database Schema (30 min)

### Create Migration

```bash
# /apps/web/src/server/db/migrations/005_add_sms_support.sql
```

```sql
-- Add phone to volunteer signups
ALTER TABLE volunteer_signups
ADD COLUMN phone VARCHAR(20),
ADD COLUMN sms_opted_out BOOLEAN DEFAULT false,
ADD COLUMN opted_out_at TIMESTAMP;

-- SMS message log (minimal for now)
CREATE TABLE sms_messages (
  id SERIAL PRIMARY KEY,
  message_sid VARCHAR(50) UNIQUE,
  from_phone VARCHAR(20),
  to_phone VARCHAR(20),
  body TEXT,
  direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sms_messages_created ON sms_messages(created_at DESC);
CREATE INDEX idx_volunteer_signups_phone ON volunteer_signups(phone)
WHERE phone IS NOT NULL;
```

### Run Migration

```bash
# Connect to database and run migration
psql $DATABASE_URL -f apps/web/src/server/db/migrations/005_add_sms_support.sql

# Or if you have a migration runner, use that
```

**SUCCESS CRITERIA:**

- [x] Tables updated without errors
- [x] Can query new columns

**Total: 30 min**

---

## Phase 3: Phone Input on Signup Form (1 hour)

### Update Signup Page

Edit `/apps/web/src/app/signup/[orgId]/[eventSlug]/page.tsx`

**Add state variable:**

```tsx
const [phoneNumber, setPhoneNumber] = useState('');
```

**Add phone input (after name input):**

```tsx
{
  /* After the "Who's volunteering?" input, before the lists */
}
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Phone Number (optional - for SMS confirmations)
  </label>
  <input
    type="tel"
    value={phoneNumber}
    onChange={(e) => setPhoneNumber(e.target.value)}
    placeholder="555-123-4567"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
  <p className="text-xs text-gray-500 mt-1">
    Get text confirmations. Reply STOP anytime to opt out.
  </p>
</div>;
```

**Update handleJoin function:**

Find where it calls `/api/signup/add` and add phone:

```tsx
const handleJoin = async (listId: number) => {
  // ... existing code ...

  const response = await fetch('/api/signup/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listId,
      name: volunteerName,
      phone: phoneNumber || null, // Add this line
    }),
  });

  // ... rest of existing code ...
};
```

**SUCCESS CRITERIA:**

- [x] Phone input appears on signup page
- [x] Can submit with or without phone
- [x] Phone value sent to API

**Total: 1 hour**

---

## Phase 4: Send Confirmation SMS (2 hours)

### Create SMS Utility

Create `/apps/web/src/lib/sms.ts`:

```typescript
import twilio from 'twilio';
import { query } from '@/server/db';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

export function formatPhoneNumber(input: string): string | null {
  if (!input) return null;

  // Remove all non-digits
  const digits = input.replace(/\D/g, '');

  // Must be 10 or 11 digits
  if (digits.length === 10) {
    return '+1' + digits; // US number
  } else if (digits.length === 11 && digits[0] === '1') {
    return '+' + digits;
  }

  return null; // Invalid
}

export async function sendSMS(to: string, body: string) {
  try {
    // Check if opted out
    const result = await query(
      'SELECT sms_opted_out FROM volunteer_signups WHERE phone = $1 LIMIT 1',
      [to]
    );

    if (result.rows[0]?.sms_opted_out) {
      console.log(`Skipping SMS to ${to} - opted out`);
      return { success: false, reason: 'opted_out' };
    }

    // Send SMS
    const message = await client.messages.create({
      body,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
      to,
    });

    // Log it
    await query(
      `INSERT INTO sms_messages 
       (message_sid, from_phone, to_phone, body, direction, status) 
       VALUES ($1, $2, $3, $4, 'outbound', $5)`,
      [message.sid, message.from, to, body, message.status]
    );

    console.log(`✅ SMS sent to ${to}: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error(`❌ SMS error to ${to}:`, error.message);

    // Log failure
    await query(
      `INSERT INTO sms_messages 
       (from_phone, to_phone, body, direction, status) 
       VALUES ($1, $2, $3, 'outbound', 'failed')`,
      [process.env.TWILIO_PHONE_NUMBER, to, body]
    );

    return { success: false, error: error.message };
  }
}
```

### Update Signup API

Edit `/apps/web/src/app/api/signup/add/route.ts`:

```typescript
import { formatPhoneNumber, sendSMS } from '@/lib/sms';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { listId, name, phone } = body;

  // ... existing validation ...

  // Format phone
  const formattedPhone = phone ? formatPhoneNumber(phone) : null;

  // Get next position
  const positionResult = await query(/* ... existing code ... */);
  const position = positionResult.rows[0].next_position;

  // Insert signup WITH PHONE
  const result = await query(
    `INSERT INTO volunteer_signups (list_id, name, position, phone) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id`,
    [listId, name, position, formattedPhone]
  );

  const signupId = result.rows[0].id;

  // Send SMS confirmation if phone provided
  if (formattedPhone) {
    // Get event details for message
    const eventResult = await query(
      `SELECT ve.title, ve.event_date, vl.title as list_title
       FROM volunteer_lists vl
       JOIN volunteer_events ve ON vl.event_id = ve.id
       WHERE vl.id = $1`,
      [listId]
    );

    const event = eventResult.rows[0];

    if (event) {
      const dateStr = new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      const message = `You're confirmed for ${event.title} - ${event.list_title} on ${dateStr}. Reply STOP to opt out.`;

      // Send SMS (async, don't wait)
      sendSMS(formattedPhone, message).catch((err) => {
        console.error('SMS send failed:', err);
      });
    }
  }

  return NextResponse.json({ success: true, id: signupId });
}
```

**SUCCESS CRITERIA:**

- [x] Sign up with phone → receive SMS immediately
- [x] SMS contains event name and date
- [x] Sign up without phone → still works
- [x] Invalid phone → saved as null (no error)
- [x] Message logged to database

**Total: 2 hours**

---

## Phase 5: Webhook for STOP Handling (1 hour)

### Create Webhook Endpoint

Create `/apps/web/src/app/api/sms/webhook/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { query } from '@/server/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const messageSid = formData.get('MessageSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    console.log(`📱 Inbound SMS from ${from}: ${body}`);

    // Log inbound message
    await query(
      `INSERT INTO sms_messages 
       (message_sid, from_phone, to_phone, body, direction, status) 
       VALUES ($1, $2, $3, $4, 'inbound', 'received')
       ON CONFLICT (message_sid) DO NOTHING`,
      [messageSid, from, to, body]
    );

    const keyword = body?.trim().toUpperCase();

    // Handle STOP
    if (['STOP', 'UNSUBSCRIBE', 'END', 'QUIT', 'CANCEL'].includes(keyword)) {
      await query(
        `UPDATE volunteer_signups 
         SET sms_opted_out = true, opted_out_at = NOW() 
         WHERE phone = $1`,
        [from]
      );

      console.log(`🛑 ${from} opted out`);
    }

    // Handle START
    if (['START', 'UNSTOP', 'YES'].includes(keyword)) {
      await query(
        `UPDATE volunteer_signups 
         SET sms_opted_out = false 
         WHERE phone = $1`,
        [from]
      );

      console.log(`✅ ${from} opted back in`);
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}
```

### Configure Twilio to Use Webhook

**Option 1: For production (ngrok or deployed):**

1. Deploy your app or use ngrok:

   ```bash
   ngrok http 3000
   # Copy the https URL (e.g., https://abc123.ngrok.io)
   ```

2. Twilio Console → Phone Numbers → Your Number
3. Under "Messaging":
   - A MESSAGE COMES IN: **Webhook**
   - URL: `https://yourdomain.com/api/sms/webhook` (or ngrok URL)
   - HTTP POST
4. Save

**Option 2: For local dev only:**

You can skip this for now. Twilio will still handle STOP automatically, you just won't log it to your database.

**SUCCESS CRITERIA:**

- [x] Webhook receives messages
- [x] STOP updates database
- [x] Logs show incoming messages

**Total: 1 hour**

---

## Testing Checklist (30 min)

### Test 1: Basic SMS Flow

1. ✅ Go to signup page
2. ✅ Enter your phone number
3. ✅ Sign up for event
4. ✅ Receive SMS confirmation within 10 seconds
5. ✅ Check database: phone number saved

### Test 2: STOP Handling

1. ✅ Reply STOP to the SMS
2. ✅ Get Twilio auto-response
3. ✅ Check database: `sms_opted_out = true`
4. ✅ Sign up again with same phone
5. ✅ Should NOT receive SMS

### Test 3: START Re-opt-in

1. ✅ Reply START
2. ✅ Get Twilio auto-response
3. ✅ Check database: `sms_opted_out = false`
4. ✅ Sign up again
5. ✅ Should receive SMS

### Test 4: Optional Phone

1. ✅ Sign up WITHOUT phone number
2. ✅ Should work normally (no SMS sent)

### Test 5: Invalid Phone

1. ✅ Enter invalid phone (e.g., "123")
2. ✅ Should save as NULL, not error
3. ✅ No SMS sent

---

## What You Can Use Tomorrow

**Volunteers can:**

- ✅ Sign up and optionally provide phone
- ✅ Receive instant SMS confirmation
- ✅ Reply STOP to opt out (auto-handled by Twilio)
- ✅ Reply START to opt back in

**Admins can:**

- ✅ See all SMS in Twilio Console (Console → Monitor → Logs → Messaging)
- ✅ See opt-out status in database
- ⚠️ Reply manually from their phones (no web inbox yet)

**What's NOT included (add next week):**

- ❌ Admin web inbox
- ❌ Reply from browser
- ❌ Event change notifications
- ❌ Analytics

---

## Total Time: 5.5 Hours

| Phase           | Time          |
| --------------- | ------------- |
| 1. Twilio Setup | 1 hour        |
| 2. Database     | 30 min        |
| 3. Phone Input  | 1 hour        |
| 4. Send SMS     | 2 hours       |
| 5. Webhook      | 1 hour        |
| Testing         | 30 min        |
| **TOTAL**       | **5.5 hours** |

---

## Start NOW: Phase 1 Twilio Setup

**First task:** Create Twilio account and test SMS (1 hour)

Ready to go? Let me know when you've created the account and I'll help with the code!
