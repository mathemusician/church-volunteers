# SMS Notifications: UX Research & Essential Information

## Starting from First Principles

**Core Question:** What do people ABSOLUTELY NEED TO KNOW?

Let me think through the actual human experience...

## The Current User Experience

### When Someone Signs Up (Volunteer's POV)

1. Opens signup page: `/signup/mosaic/regular-sunday-service-nov-16`
2. Enters their name: "John Smith"
3. Clicks "Join as John" on "Worship Team"
4. Sees checkmark animation ✅
5. Their name appears in the list
6. **That's it. They're done.**

### What Happens Next? (Coordinator's POV)

**Current state:** Nothing. Silence. 🦗

The coordinator doesn't know John signed up unless they:

- Manually refresh the admin page
- Check their email later (if we add email notifications)
- Show up on Sunday and see John

## The Essential Information Flow

### WHO needs to know WHAT?

#### 🎯 Coordinator (The Person Responsible)

**MUST KNOW:**

1. ✅ **Someone signed up** - Real-time is valuable here
2. ✅ **Who signed up** - "John Smith" (full name, exactly as entered)
3. ✅ **For which role** - "Worship Team" (the specific list)
4. ✅ **For which event** - "Sunday Service - Nov 16" (date is critical!)

**NICE TO KNOW:**

- How many slots are filled now (3/5)
- When they signed up (timestamp)
- Link to view/manage

**DON'T NEED:**

- Full roster of everyone
- Event description
- Detailed stats

#### ❌ Other Volunteers

**Don't need notifications.** They can see the list when they sign up.

## The "Why" Behind Notifications

### Real-World Scenarios

**Scenario 1: Last-Minute Coverage**

> Saturday 9 PM: Maria (coordinator) needs 2 more people for Sunday worship team.
> She texts friends: "Hey, can you help tomorrow?"
>
> **With notifications:**
>
> - Friend signs up at 10 PM
> - Maria gets SMS: "✅ Tom Johnson signed up for Worship Team"
> - Maria knows she's covered, can sleep peacefully
>
> **Without notifications:**
>
> - Maria doesn't know Tom signed up
> - She keeps worrying, might double-text people
> - Might not check until Sunday morning

**Value:** Peace of mind, avoid duplicate coordination

**Scenario 2: Cancellations**

> Wednesday: Someone removes their name
>
> **With notifications:**
>
> - Coordinator knows immediately
> - Can reach out to find replacement
>
> **Without:**
>
> - Discovers on Sunday when person doesn't show up
> - Emergency scramble

**Value:** Proactive problem solving

**Scenario 3: Hitting Minimums**

> Need 4 players for pickleball
>
> **With notifications:**
>
> - "🎯 Minimum reached! Pickleball is happening!"
> - Everyone feels confident to show up
>
> **Without:**
>
> - Uncertainty, people might not come

**Value:** Confidence and commitment

## Notification Design: What to Send

### Signup Notification (Priority 1)

**What the coordinator NEEDS:**

```
✅ John Smith
   Worship Team
   Sun Nov 16

   3/5 filled
```

**NOT THIS (too verbose):**

```
Good evening! A volunteer has signed up for your event.
Name: John Smith
Event: Regular Sunday Service - Nov 16
List: Worship Team
Current Count: 3 out of 5 slots filled
You can view the full list at: https://church-volunteers.vercel.app/admin/volunteer-manager
```

**Design Principles:**

1. ✅ **Scannable** - Read in 2 seconds
2. ✅ **Emoji for context** - ✅ = someone joined, ❌ = someone left
3. ✅ **Critical info first** - Name, then role, then event
4. ✅ **Date clarity** - "Sun Nov 16" not "Regular Sunday Service"
5. ❌ **No URLs** - They don't need to click anything right now

### Wait, About URLs...

**User's question: "We don't need to url shorten right?"**

Let me think... Do coordinators need links in SMS?

**Argument FOR links:**

- Can quickly view full roster
- Can manage/lock lists
- Can see contact info

**Argument AGAINST links:**

- SMS is just notification, not action
- If they want to manage, they'll open the app
- Most people check on their phone where they already have the app
- Long URLs look spammy, might trigger carrier filters
- Adds complexity

**VERDICT:** Start without links. Just notifications.

**Reasoning:**

- SMS = "Hey, something happened"
- Not "Go do this thing now"
- If urgent action needed, they know where to go
- Can add links later if users request it

### Cancellation Notification (Priority 2)

```
❌ John Smith
   Worship Team
   Sun Nov 16

   2/5 filled
```

Same format, different emoji.

### List Full (Priority 3 - Maybe?)

```
✅ Worship Team FULL
   Sun Nov 16
   5/5 filled
```

**Question:** Do coordinators need this?

- PRO: Confirmation everything's covered
- CON: They see the count with each signup
- **Verdict:** Skip this. Redundant.

### Minimum Reached (Priority 3)

```
🎯 Pickleball is ON!
   Sat Nov 15
   4 players signed up
```

**This one IS valuable** because it changes behavior:

- Pickleball requires 4 people
- If only 3, people might not show up
- Once hit 4, everyone knows it's happening

## Notification Timing

### When to Send?

**Real-time (Immediate):** YES

- Signups happen sporadically
- Coordinators want to know ASAP
- No value in batching

**Quiet Hours:** YES, CRITICAL

- Don't wake people up at 11 PM
- Default: 10 PM - 8 AM (configurable)
- Queue messages during quiet hours, send at 8 AM

**What about digest/batch?**

- "You had 5 signups today"
- **Skip for MVP** - defeats the purpose
- Real-time is the whole point
- Can add later if people get overwhelmed

## Who Gets Notified?

### Coordinator Assignment

**Option 1: Event-Level Coordinators**

```
Event: "Sunday Service - Nov 16"
Coordinators: [Maria, Pastor John]
```

→ Both get notified for ANY list signup

**Option 2: List-Level Coordinators**

```
List: "Worship Team"
Coordinator: [Maria]

List: "Greeter Team"
Coordinator: [Sarah]
```

→ Only Maria notified for Worship, only Sarah for Greeter

**BEST APPROACH:** List-level coordinators

- More granular control
- Less notification spam
- People usually own specific ministries

**Fallback:** If no list coordinator, notify event coordinator

## Technical Simplification

### MVP Database Model

**Just add to existing `users` table:**

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN notify_signups BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN quiet_hours_start TIME DEFAULT '22:00';
ALTER TABLE users ADD COLUMN quiet_hours_end TIME DEFAULT '08:00';
```

**New simple table:**

```sql
CREATE TABLE list_coordinators (
  id SERIAL PRIMARY KEY,
  list_id INTEGER REFERENCES volunteer_lists(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notify_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(list_id, user_id)
);
```

**Audit log (optional for MVP):**

```sql
CREATE TABLE sms_log (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20),
  message TEXT,
  status VARCHAR(20), -- 'sent', 'failed'
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

That's it. Much simpler than my original plan.

### Trigger Logic

**When signup added:**

1. Look up list coordinators
2. For each coordinator:
   - Check if notifications enabled
   - Check if not in quiet hours
   - Send SMS
3. Log it

```typescript
// /api/signup/add/route.ts
export async function POST(request: NextRequest) {
  // ... existing signup logic ...

  const result = await query(/* insert signup */);

  // NEW: Notify coordinators
  await notifyCoordinators({
    listId: listId,
    volunteerName: name,
    action: 'signup',
  });

  return NextResponse.json(result.rows[0]);
}
```

## Cost Reality Check

### Actual Usage Patterns

**Small church scenario:**

- 2 Sunday services per month
- 4 lists per service (Worship, Greeters, Kids, Setup)
- 1 coordinator per list
- 3 signups per list average

**Monthly volume:**

- 2 services × 4 lists × 3 signups × 1 coordinator = 24 SMS
- Add 20% for cancellations = ~30 SMS

**Cost:** $0.24/month (Twilio) or $0.12/month (Telnyx)

### Scale to Large Church

**Large church:**

- 4 services per week = 16/month
- 6 lists per service
- 2 coordinators per list (redundancy)
- 5 signups per list

**Monthly volume:**

- 16 services × 6 lists × 5 signups × 2 coordinators = 960 SMS
- Add cancellations = ~1200 SMS

**Cost:** $9.48/month (Twilio) or $4.80/month (Telnyx)

**Insight:** Cost is negligible even at scale.

## The Two-Way Question

**User asked:** "Two way messaging is interesting, but has to be built very carefully."

Let me think about this...

**What would two-way enable?**

**Scenario 1: Reply to opt-out**

```
Coordinator receives: "✅ John Smith signed up..."
Coordinator replies: "STOP"
→ Unsubscribe from notifications
```

✅ **This is required for TCPA compliance anyway**

**Scenario 2: Commands**

```
Coordinator receives: "✅ John Smith signed up..."
Coordinator replies: "LOCK"
→ Lock the worship team list
```

❌ **This is dangerous:**

- Mistyped commands
- No confirmation
- Hard to implement reliably
- Better to do in the app

**Scenario 3: Questions**

```
Coordinator receives: "✅ John Smith signed up..."
Coordinator replies: "Who else is signed up?"
→ Bot responds with roster
```

❌ **Nice-to-have, not essential:**

- Adds complexity
- They can check the app
- SMS isn't great for list display

**MVP VERDICT:** Two-way for opt-out only (STOP, START, HELP)

**Standard responses:**

- Reply "STOP" → "You've been unsubscribed from notifications."
- Reply "START" → "Welcome back! You'll receive signup notifications."
- Reply "HELP" → "Reply STOP to unsubscribe, START to resubscribe."
- Any other reply → Ignore or "Text commands not supported. Visit the app to manage."

## What We Don't Need (Yet)

### Features to Skip for MVP

1. ❌ **Email notifications** - SMS is more immediate, email is noise
2. ❌ **Push notifications** - Requires mobile app
3. ❌ **Digest notifications** - Defeats purpose of real-time
4. ❌ **Custom message templates** - One template works for everyone
5. ❌ **Multiple phone numbers** - One per user is enough
6. ❌ **International SMS** - US-only for MVP
7. ❌ **URL shortening** - No URLs needed
8. ❌ **Read receipts** - Don't need to know if they read it
9. ❌ **Rich media (MMS)** - Plain text is perfect
10. ❌ **Scheduled messages** - Only send on events
11. ❌ **A/B testing templates** - Premature optimization

## Revised Implementation Plan

### Phase 1: MVP (2-3 weeks)

**Week 1: Foundation**

- [ ] Set up Twilio account
- [ ] Add phone fields to users table
- [ ] Create list_coordinators table
- [ ] Build phone verification flow
- [ ] Test sending SMS

**Week 2: Core Feature**

- [ ] Add coordinator assignment UI
- [ ] Implement signup notification trigger
- [ ] Add quiet hours logic
- [ ] Handle STOP/START replies

**Week 3: Polish**

- [ ] Settings page for phone/preferences
- [ ] SMS log page for admins
- [ ] Error handling and retries
- [ ] Deploy to staging

**Features:**
✅ Real-time SMS on signup
✅ Real-time SMS on cancellation  
✅ List-level coordinators
✅ Phone verification
✅ Quiet hours (10 PM - 8 AM)
✅ Opt-out via STOP

**Explicitly NOT in MVP:**
❌ Digest notifications
❌ Email notifications
❌ URL links in SMS
❌ Custom templates
❌ Two-way commands (beyond STOP/START)
❌ Minimum reached notifications
❌ List full notifications

### Phase 2: Enhanced (Future)

- Minimum reached notifications
- Per-event notification preferences
- SMS delivery dashboard
- Custom quiet hours per user

## Message Format Final

### Signup Notification

```
✅ [Name]
   [List Title]
   [Event Title]
   [Count/Max] filled
```

**Example:**

```
✅ John Smith
   Worship Team
   Sun Nov 16
   3/5 filled
```

**Character count:** ~50 chars (1 SMS segment)

### Cancellation Notification

```
❌ [Name]
   [List Title]
   [Event Title]
   [Count/Max] filled
```

### System Messages (Twilio auto-handles these)

```
Reply STOP to unsubscribe
Reply HELP for help
```

## Key Decisions Summary

1. ✅ **SMS only** (no email, no push)
2. ✅ **Real-time only** (no digest)
3. ✅ **No URLs** (just notification)
4. ✅ **List-level coordinators** (not event-level)
5. ✅ **Quiet hours default** (10 PM - 8 AM)
6. ✅ **STOP/START only** (no commands)
7. ✅ **US phone numbers only** (for MVP)
8. ✅ **Twilio** (best for learning, can switch later)
9. ✅ **Simple database schema** (minimal new tables)
10. ✅ **~$2-10/month** cost (totally reasonable)

## Next: Build or Research More?

**Ready to build:** Yes, the UX is clear.

**Open questions for implementation:**

1. Should phone verification be required or optional?
2. What happens if Twilio fails? Queue and retry?
3. Should admins be able to send test SMS?
4. Rate limiting strategy?

**Recommendation:** Start building Phase 1. These questions will answer themselves during implementation.

---

**Last Updated:** November 9, 2025
