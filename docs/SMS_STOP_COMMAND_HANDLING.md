# Handling STOP Command: When Volunteers Are Still Scheduled

## The Question

**What happens if someone signed up to volunteer for future dates and texts STOP?**

This is a critical edge case that requires careful handling.

---

## Key Research Findings

### 1. Transactional vs. Promotional Messages

From TCPA compliance research:

**Volunteer reminders = TRANSACTIONAL messages**

- Appointment/commitment reminders
- Event updates/cancellations
- "Necessary information" for their commitment

**NOT promotional/marketing messages**

- Not selling anything
- Not advertising
- Not recruiting

**BUT:** Even transactional messages still require consent (though easier than promotional).

### 2. The 2024 FCC Clarification Rule

**You CAN send ONE clarification message within 5 minutes of STOP**

From the FCC Order (Feb 2024):

> "Senders can include a request for clarification in this one-time confirmation text, provided the sender ceases all further robocalls and robotexts absent an affirmative response from the consumer."

**Rules:**

- ✅ ONE message only
- ✅ Within 5 minutes of receiving STOP
- ✅ Can ask to clarify what they want to stop
- ❌ Cannot contain ANY marketing content
- ❌ If they don't respond, treat as FULL opt-out

### 3. Important Distinction

**SMS opt-out ≠ Canceling volunteer commitment**

- They opted out of TEXT MESSAGES
- They didn't say "I'm not volunteering anymore"
- Their signup still exists
- The coordinator still expects them

---

## Three Options for Handling This

### Option A: Clarification Message (FCC-Compliant)

**When volunteer texts STOP, immediately respond:**

```
Got it! Opt-out confirmed.

You're still scheduled to volunteer:
• Worship Team - Sun Nov 16, 9 AM

Reply:
1 = Cancel volunteering
2 = Keep commitment, no texts
3 = Keep both

No reply = You're opted out of texts but still scheduled.
```

**Outcomes:**

- **Reply 1:** Remove from schedule + opt-out
- **Reply 2:** Keep scheduled + opt-out (coordinator must reach out another way)
- **Reply 3:** Keep scheduled + opt back in
- **No reply:** Opt-out confirmed, still scheduled

**Pros:**

- Clarifies their intent
- Gives them control
- Prevents confusion
- Legal under 2024 FCC rule

**Cons:**

- Adds complexity
- Requires parsing responses
- Some won't reply (default ambiguity)

---

### Option B: Simple Opt-Out + Email Notification

**When volunteer texts STOP, immediately respond:**

```
You've unsubscribed from text notifications.

You're still scheduled to volunteer for future events. To cancel, visit: [link]
```

**Then:** Send EMAIL to volunteer

```
Subject: Text Notifications Disabled

Hi [NAME],

You've opted out of text notifications, but you're still scheduled to volunteer:

• Worship Team - Sun Nov 16, 9 AM
• Greeter Team - Sun Nov 23, 9 AM

To cancel or manage your signups, visit: [link]

Questions? Reply to this email.
```

**Pros:**

- Simple, clear
- Uses email as backup
- No parsing complex responses
- Volunteer can manage via web

**Cons:**

- They might not check email
- Coordinator still expects them
- Potential no-show

---

### Option C: Opt-Out + Coordinator Alert

**When volunteer texts STOP, immediately respond:**

```
Confirmed: No more texts from us.

You're still scheduled to volunteer. If you need to cancel, contact your coordinator.
```

**Then:** Alert the coordinator(s)

```
[Email or Dashboard Notification]

⚠️ John Smith opted out of SMS

They're still scheduled for:
• Worship Team - Sun Nov 16, 9 AM

Action needed:
Reach out via email/call to confirm they're still available.
```

**Pros:**

- Puts responsibility on coordinator
- Coordinator can proactively follow up
- No ambiguity
- Simple for volunteer

**Cons:**

- More work for coordinator
- Defeats automation purpose
- Might feel like "punishment" for opting out

---

## Recommended Approach: Hybrid

### Step 1: Immediate STOP Response (Required)

```
You've unsubscribed. No more texts.

Still scheduled to volunteer:
Worship Team - Sun Nov 16, 9 AM

To cancel: [short link]
```

**Why:**

- Legal compliance
- Clear acknowledgment
- Provides next steps
- One-way communication (no parsing)

### Step 2: Log the Opt-Out

```sql
UPDATE volunteer_signups
SET sms_opted_out = true,
    opted_out_at = NOW()
WHERE phone = '+15551234567';
```

### Step 3: Email Follow-Up (24 hours later)

```
Subject: Your Volunteer Schedule

Hi John,

You recently disabled text notifications.

Your upcoming volunteer commitments:
• Worship Team - Sun Nov 16, 9 AM
• Greeter Team - Sun Nov 23, 9 AM

Need to cancel? [Manage Signups Link]

Want texts back? [Re-enable SMS Link]
```

**Why 24 hours?**

- Gives them time to cancel via web
- Not immediate spam after STOP
- One final reminder via email

### Step 4: Coordinator Dashboard Alert

Show on volunteer list:

```
John Smith (opted out of SMS) ← Yellow warning badge
Last contact: Email sent Nov 10
```

**Why:**

- Coordinator awareness
- Can reach out if critical
- No automatic action required

---

## Edge Cases to Handle

### Edge Case 1: They Text STOP After Canceling

**Scenario:** They already removed themselves from schedule, THEN text STOP

**Response:**

```
You've unsubscribed.

(You're not currently scheduled for any events.)
```

**Simple!**

---

### Edge Case 2: Multiple People Using Same Phone

**Scenario:** Family shares one phone, but different people volunteer

**Problem:** STOP opts out the whole phone number

**Solutions:**

**Option A: Accept it**

- One phone = one opt-out
- Industry standard
- Can't distinguish users

**Option B: Ask for clarification (FCC-allowed)**

```
Got it! Which person is opting out?

1 = John Smith
2 = Jane Smith
3 = Both

Reply with number.
```

**Option C: Require individual phones**

- Each volunteer must provide their own phone
- Not realistic for families

**Recommended:** Option A (accept it), document in FAQ

---

### Edge Case 3: They Text STOP Right Before Event

**Scenario:** Event is tomorrow, they text STOP today

**Still send critical messages?** NO - you can't.

**But they're still scheduled!**

**Solution:**

- Coordinator must call/email
- Dashboard shows "opted out" badge
- This is why coordinator alerts matter

**Document in policies:**

> "If you opt out of texts, please notify your coordinator directly if you need to cancel."

---

### Edge Case 4: They Want to Opt Back In

**If they text START:**

```
Welcome back!

You'll receive texts for:
• Event confirmations
• Cancellations
• Time/location changes

Reply STOP anytime to unsubscribe.
```

**Update database:**

```sql
UPDATE volunteer_signups
SET sms_opted_out = false,
    opted_in_at = NOW()
WHERE phone = '+15551234567';
```

---

## Implementation Details

### Database Schema Update

```sql
ALTER TABLE volunteer_signups
ADD COLUMN sms_opted_out BOOLEAN DEFAULT false,
ADD COLUMN opted_out_at TIMESTAMP,
ADD COLUMN opted_in_at TIMESTAMP;

-- Or if phone is in users table:
ALTER TABLE users
ADD COLUMN sms_opted_out BOOLEAN DEFAULT false,
ADD COLUMN opted_out_at TIMESTAMP,
ADD COLUMN opted_in_at TIMESTAMP;
```

### Twilio Webhook Handler

```typescript
// /api/sms/webhook (Twilio calls this on SMS reply)
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const from = formData.get('From'); // Phone number
  const body = formData.get('Body')?.toString().trim().toUpperCase();

  if (body === 'STOP' || body === 'UNSUBSCRIBE' || body === 'CANCEL') {
    // 1. Mark as opted out
    await query(
      'UPDATE volunteer_signups SET sms_opted_out = true, opted_out_at = NOW() WHERE phone = $1',
      [from]
    );

    // 2. Get their upcoming signups
    const signups = await query(
      `SELECT vs.*, ve.title, ve.event_date 
       FROM volunteer_signups vs
       JOIN volunteer_lists vl ON vs.list_id = vl.id
       JOIN volunteer_events ve ON vl.event_id = ve.id
       WHERE vs.phone = $1 
       AND ve.event_date >= NOW()
       ORDER BY ve.event_date ASC`,
      [from]
    );

    // 3. Build response
    let response = "You've unsubscribed. No more texts.\n\n";

    if (signups.rows.length > 0) {
      response += 'Still scheduled to volunteer:\n';
      signups.rows.forEach((s) => {
        const date = new Date(s.event_date).toLocaleDateString();
        response += `• ${s.title} - ${date}\n`;
      });
      response += `\nTo cancel: ${process.env.APP_URL}/manage`;
    } else {
      response += "(You're not currently scheduled for any events.)";
    }

    // 4. Send confirmation via Twilio
    await twilioClient.messages.create({
      body: response,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: from,
    });

    // 5. Log it
    await query('INSERT INTO sms_log (phone, message, direction, status) VALUES ($1, $2, $3, $4)', [
      from,
      body,
      'inbound',
      'processed',
    ]);

    // 6. Schedule email follow-up (24 hours later)
    await scheduleEmailFollowup(from, signups.rows);

    return new Response('OK', { status: 200 });
  }

  if (body === 'START' || body === 'UNSTOP') {
    // Re-opt in
    await query(
      'UPDATE volunteer_signups SET sms_opted_out = false, opted_in_at = NOW() WHERE phone = $1',
      [from]
    );

    await twilioClient.messages.create({
      body: "Welcome back! You'll receive texts for event updates. Reply STOP anytime.",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: from,
    });

    return new Response('OK', { status: 200 });
  }

  if (body === 'HELP') {
    await twilioClient.messages.create({
      body:
        'Reply STOP to unsubscribe. Reply START to resubscribe. Questions? Visit ' +
        process.env.APP_URL,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: from,
    });

    return new Response('OK', { status: 200 });
  }

  // Unknown command - ignore
  return new Response('OK', { status: 200 });
}
```

### Before Sending Any SMS

```typescript
async function sendSMS(phone: string, message: string) {
  // Check if opted out
  const result = await query(
    'SELECT sms_opted_out FROM volunteer_signups WHERE phone = $1 LIMIT 1',
    [phone]
  );

  if (result.rows[0]?.sms_opted_out) {
    console.log(`Skipping SMS to ${phone} - opted out`);
    return { success: false, reason: 'opted_out' };
  }

  // Send SMS
  const twilioResult = await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  return { success: true, sid: twilioResult.sid };
}
```

---

## FAQ / Policy Wording

**For volunteers:**

> **What if I text STOP but still want to volunteer?**
>
> Texting STOP only stops text notifications. You'll remain scheduled for your volunteer commitments. To cancel volunteering, visit [link] or contact your coordinator.

> **Can I get texts again after opting out?**
>
> Yes! Text START to the same number to re-enable notifications.

> **I opted out by mistake, what do I do?**
>
> Text START to resubscribe, or manage your preferences at [link].

**For coordinators:**

> **A volunteer opted out of texts but is still scheduled. Now what?**
>
> They've only disabled SMS notifications. Their volunteer commitment still stands. You can:
>
> - Contact them via email
> - Call them directly
> - Wait to see if they show up
>
> If it's a critical position, we recommend reaching out via email/call to confirm.

---

## Final Recommendation

**For MVP (Week 1):**

1. ✅ Implement STOP/START/HELP handlers
2. ✅ Send confirmation message with upcoming schedule
3. ✅ Mark opt-out in database
4. ✅ Skip SMS for opted-out users
5. ✅ Show "opted out" badge in coordinator dashboard

**For Phase 2:**

6. Email follow-up (24 hours after opt-out)
7. Coordinator alerts
8. Re-engagement campaigns

**Don't build:**

- ❌ Complex clarification flows (confusing)
- ❌ Separate opt-outs per event (too granular)
- ❌ Trying to "save" the opt-out with offers

**Keep it simple:** STOP = no texts, but still scheduled. Clear communication.

---

**Key Takeaway:** SMS preferences are separate from volunteer commitments. Opt-out is about communication channel, not about canceling.

**Last Updated:** November 9, 2025
