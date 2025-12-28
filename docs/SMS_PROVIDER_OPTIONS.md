# SMS Provider Options: What Actually Handles the Nonsense

## TL;DR - The Winner

**For your MVP: Twilio with Messaging Services**

**Why:**

- ✅ Handles STOP/START/HELP automatically (no code needed!)
- ✅ Compliance Toolkit = auto quiet hours + opt-out blocking
- ✅ Nonprofit discount: $100 free credit + discounted rates
- ✅ Best documentation and tutorials
- ✅ Can switch to cheaper provider later if needed

**Cost:** ~$5-10/month after free credits

---

## Option 1: Twilio (RECOMMENDED for MVP)

### What Twilio Handles Automatically

**1. STOP/START/HELP Keywords**

- Automatically intercepts these keywords
- Sends standard replies
- Blocks opted-out numbers from receiving messages
- Recognizes: STOP, UNSUBSCRIBE, END, QUIT, STOPALL, REVOKE, OPTOUT, CANCEL
- **You write ZERO code for this!**

**2. Compliance Toolkit (Beta - FREE)**

- **Quiet Hours Enforcement** - Automatically delays messages sent during quiet hours
- **Opt-out Database** - Checks if number opted out before sending
- **Reassigned Number Check** - Verifies number wasn't reassigned to someone else
- **You just enable it in Console, it runs automatically**

**3. Consent Management API**

- Lets you bulk update opt-in/opt-out status
- Syncs with their opt-out database
- Can override keyword-based opt-outs if needed

### How It Works

**Setup (5 minutes):**

1. Create Twilio account
2. Create a "Messaging Service" (not just a phone number)
3. Enable Compliance Toolkit in Console
4. Add phone number to Messaging Service
5. Done! STOP handling is automatic

**Your code:**

```typescript
// Send SMS
await twilioClient.messages.create({
  body: "You're confirmed for Worship Team - Sun Nov 16",
  messagingServiceSid: 'MG...', // Use Messaging Service, not phone number
  to: '+15551234567',
});

// That's it! Twilio handles STOP automatically
```

**When someone texts STOP:**

- Twilio intercepts it
- Sends auto-reply: "You have successfully been unsubscribed. Reply START to resubscribe."
- Adds number to opt-out database
- Future messages to that number = blocked with error code 21610
- **You don't need a webhook or any code!**

**If you WANT to know about opt-outs (optional):**

```typescript
// Add webhook in Twilio Console for inbound messages
// /api/sms/webhook
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body = formData.get('Body')?.toString();

  if (body === 'STOP') {
    // Log it to your database if you want
    // But Twilio already handled the blocking
  }
}
```

### Pricing

**Base Costs (without nonprofit discount):**

- Phone number: $1.15/month
- SMS outbound (US): $0.0079 per message
- SMS inbound (STOP replies): $0.0079 per message

**Example: 1000 messages/month**

- Phone: $1.15
- Outbound: $7.90
- Inbound (100 STOP replies): $0.79
- **Total: $9.84/month**

**With Twilio.org Nonprofit Discount:**

- $100 free credit = ~12,000 messages
- 10-20% ongoing discount
- **Effectively free for 6-12 months**

### Pros

✅ Auto-handles STOP/START/HELP (zero code)  
✅ Compliance Toolkit auto-enforces quiet hours  
✅ Nonprofit discounts available  
✅ Best documentation  
✅ Huge community support  
✅ Easy to test

### Cons

❌ Slightly more expensive than competitors  
❌ Some complaints about A2P 10DLC registration process  
❌ Support can be slow (but free tier still good)

---

## Option 2: Telnyx (Best for Cost Savings Later)

### What Telnyx Offers

**Auto-handling:**

- STOP/START keywords automatically blocked
- Basic compliance features
- Similar to Twilio but less mature

**Pricing (49% cheaper than Twilio!):**

- Phone number: $1.00/month
- SMS outbound (US): $0.004 per message (vs Twilio $0.0079)
- **Example: 1000 messages/month = $5.00 total**

### Pros

✅ 50% cheaper than Twilio  
✅ Own their network infrastructure  
✅ Free 24/7 support  
✅ Good for high volume

### Cons

❌ Less documentation  
❌ Smaller community  
❌ No nonprofit discount program  
❌ More setup complexity

### Verdict

**Use for Phase 2+** when you've validated and need to save $$

---

## Option 3: AWS SNS (NOT Recommended)

### What AWS Offers

**Features:**

- Basic SMS sending
- No automatic STOP handling
- No compliance features
- You build everything yourself

**Pricing:**

- No phone number (uses AWS pool)
- SMS: $0.00645 per message
- Slightly cheaper but missing features

### Pros

✅ Slightly cheaper raw SMS cost  
✅ Good if already using AWS

### Cons

❌ NO automatic STOP handling  
❌ NO compliance toolkit  
❌ YOU handle all opt-out logic  
❌ Limited features  
❌ Bad for two-way messaging

### Verdict

**Don't use** - The "savings" cost you dev time

---

## Option 4: Specialized Services (EZTexting, SimpleTexting)

### What They Offer

**Features:**

- Web UI for sending campaigns
- Auto STOP handling
- Templates
- Contact management

**Pricing:**

- $20-50/month for plans
- Not API-first (built for marketing teams)

### Pros

✅ Easy for non-technical users  
✅ Good for mass campaigns  
✅ Built-in compliance

### Cons

❌ Not designed for transactional messages  
❌ More expensive for low volume  
❌ Less flexible API  
❌ Overkill for your use case

### Verdict

**Don't use** - Built for marketing, not volunteer notifications

---

## Comparison Table

| Feature                     | Twilio                       | Telnyx      | AWS SNS   | Specialized |
| --------------------------- | ---------------------------- | ----------- | --------- | ----------- |
| **Auto STOP handling**      | ✅ Built-in                  | ✅ Built-in | ❌ Manual | ✅ Built-in |
| **Quiet hours**             | ✅ Auto (Compliance Toolkit) | ⚠️ Manual   | ❌ Manual | ✅ Built-in |
| **Opt-out database**        | ✅ Managed                   | ⚠️ Basic    | ❌ DIY    | ✅ Managed  |
| **Reassigned number check** | ✅ Auto                      | ❌ No       | ❌ No     | ❌ No       |
| **Nonprofit discount**      | ✅ Yes ($100 credit)         | ❌ No       | ❌ No     | ⚠️ Some     |
| **Cost (1000 msgs)**        | $9.84 ($5 w/ discount)       | $5.00       | $6.45     | $20-50      |
| **Documentation**           | ⭐⭐⭐⭐⭐                   | ⭐⭐⭐      | ⭐⭐      | ⭐⭐⭐      |
| **API Quality**             | ⭐⭐⭐⭐⭐                   | ⭐⭐⭐⭐    | ⭐⭐⭐    | ⭐⭐⭐      |
| **Setup Time**              | 5 min                        | 15 min      | 30 min    | 10 min      |
| **Support**                 | ⭐⭐⭐                       | ⭐⭐⭐⭐⭐  | ⭐⭐      | ⭐⭐⭐⭐    |

---

## What You Actually Need to Do

### With Twilio (RECOMMENDED)

**Step 1: Sign up for Twilio.org nonprofit program**

- Go to: https://www.twilio.org/en-us/support-and-resources/impact-access-program
- Apply with church 501(c)(3) info
- Get $100 credit + ongoing discounts

**Step 2: Create Messaging Service (not just phone number!)**

```bash
# In Twilio Console:
1. Console → Messaging → Services → Create new
2. Give it a name: "Church Volunteer Notifications"
3. Add a phone number to it
4. Enable "Advanced Opt-Out" (handles STOP automatically)
```

**Step 3: Enable Compliance Toolkit**

```bash
# In Twilio Console:
1. Messaging → Settings → General
2. Enable "Compliance Toolkit"
3. Configure quiet hours: 10 PM - 8 AM
4. Done!
```

**Step 4: Install SDK**

```bash
npm install twilio
```

**Step 5: Send your first message**

```typescript
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

await client.messages.create({
  body: 'Test message - Reply STOP to unsubscribe',
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  to: '+15551234567',
});
```

**That's it!** STOP, quiet hours, opt-out blocking = all automatic.

---

## MVP Implementation Plan

### Phase 1: Basic Setup (1-2 hours)

**Tasks:**

1. ✅ Sign up for Twilio account
2. ✅ Apply for Twilio.org nonprofit discount
3. ✅ Create Messaging Service
4. ✅ Enable Compliance Toolkit
5. ✅ Buy one phone number ($1.15)
6. ✅ Test sending SMS to yourself
7. ✅ Reply STOP and confirm it blocks future messages

**Cost:** $0 (using free trial credit)

### Phase 2: Send Confirmations (2-3 hours)

**Tasks:**

1. ✅ Add optional phone field to signup form
2. ✅ When volunteer signs up, send confirmation SMS
3. ✅ Handle API errors gracefully
4. ✅ Log sent messages

**Code Required:**

- Signup form: +1 input field
- API route: ~50 lines to send SMS
- Error handling: ~20 lines

**Twilio handles automatically:**

- STOP blocking
- Quiet hours
- Opt-out database
- Standard replies

### Phase 3: Event Changes (2-3 hours)

**Tasks:**

1. ✅ Detect when event is cancelled
2. ✅ Send SMS to all signed-up volunteers
3. ✅ Detect when event time/location changes
4. ✅ Send update SMS

**Code Required:**

- Event change detection: ~30 lines
- Batch SMS sending: ~40 lines

### Phase 4: Dashboard (2-3 hours)

**Tasks:**

1. ✅ Show SMS log in admin
2. ✅ Show opt-out status on volunteer list
3. ✅ Manual "send test SMS" button

**Code Required:**

- SMS log display: ~50 lines
- Status badges: ~20 lines

**Total MVP: 8-12 hours of dev work**

---

## What Twilio Handles vs What You Build

### Twilio Handles (FREE - No Code!)

✅ **STOP keyword recognition**  
✅ **Auto-reply to STOP** ("You have been unsubscribed")  
✅ **START keyword recognition**  
✅ **Auto-reply to START** ("You have been resubscribed")  
✅ **HELP keyword recognition**  
✅ **Blocking messages to opted-out numbers**  
✅ **Opt-out database storage**  
✅ **Quiet hours enforcement** (via Compliance Toolkit)  
✅ **Reassigned number checking** (via Compliance Toolkit)

### You Build (Simple API Calls)

🔨 **Collecting phone numbers at signup**  
🔨 **Deciding WHEN to send messages**  
🔨 **Composing message text**  
🔨 **Calling Twilio API to send**  
🔨 **Logging messages to your database**  
🔨 **Showing opt-out status in UI**

**See the difference?** Twilio handles ALL the compliance nonsense. You just decide when to send and what to say.

---

## Alternative: If Twilio.org Rejects You

**Fallback: Twilio regular account with trial credit**

- $15.50 free trial credit
- Enough for ~1,500 messages
- Test for 3-6 months
- Pay $10/month after trial

**Fallback 2: Telnyx**

- No nonprofit program
- But 50% cheaper
- $5/month for 1000 messages
- Same STOP handling

**Recommendation:** Start with Twilio trial, apply for nonprofit while testing. If rejected, evaluate Telnyx based on actual usage.

---

## Switching Providers Later

**It's easy!** Just change:

```typescript
// Before (Twilio)
import twilio from 'twilio';
const client = twilio(SID, TOKEN);

// After (Telnyx)
import { Telnyx } from 'telnyx';
const client = new Telnyx(API_KEY);
```

**All the logic stays the same:**

- When to send
- What to send
- Logging
- UI

**Only the API client changes.**

---

## Final Recommendation

**Week 1: Use Twilio**

1. Sign up today
2. Apply for nonprofit discount
3. Create Messaging Service
4. Enable Compliance Toolkit
5. Send test messages

**Why:**

- Fastest to get working
- Handles all compliance automatically
- Free for first 6-12 months with credits
- Best docs = less bugs
- Can switch later if needed

**Don't overthink it.** Get something working, then optimize.

**Total setup time: 30 minutes**  
**Total cost: $0 for first 6 months**  
**Compliance handling: Automatic**

---

## Quick Start Commands

```bash
# 1. Install
npm install twilio

# 2. Set env vars
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=MG...

# 3. Send first message
node -e "
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
client.messages.create({
  body: 'Test from church volunteers app!',
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  to: '+1YOUR_PHONE'
}).then(msg => console.log('Sent:', msg.sid));
"

# 4. Test STOP
# (Reply STOP from your phone)

# 5. Try sending again
# (Should fail with error 21610 - opted out)
```

**Done! You now have automatic STOP handling.**

---

**Last Updated:** November 9, 2025  
**Recommendation:** Twilio + Messaging Services + Compliance Toolkit
