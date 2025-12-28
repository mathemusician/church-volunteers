# SMS Notifications: Complete Rethink from User Perspective

## I Was Thinking About This Backwards

### What I Was Thinking

"Coordinator needs to know when someone signs up" ✅

### What You Just Said (The Real Problem!)

1. **"Wouldn't it be more important if someone HASN'T signed up?"**
   - Gap detection > individual signups
2. **"Hundreds of people who sign up for things"**
   - At scale, individual notifications become spam
3. **"From the user perspective, they would need to know if what they signed up for has changed"**
   - VOLUNTEERS need notifications, not just coordinators!
4. **"Should we make it easy for admins to text individual people messages?"**
   - Direct messaging capability is key

## Let Me Start Over: Who Needs What?

### 🎯 The VOLUNTEERS (The People Signing Up)

#### Critical Scenarios for Volunteers

**Scenario 1: Event Changed**

```
Your volunteer assignment has changed:

Worship Team - Sun Nov 16
New time: 8:00 AM (was 9:00 AM)

View details: [link]
```

**Why this matters:**

- They already committed
- Their schedule might not work anymore
- Need to know ASAP to plan

**Scenario 2: Event Cancelled**

```
❌ CANCELLED

Worship Team - Sun Nov 16 has been cancelled.

Sorry for the inconvenience!
```

**Why this matters:**

- Don't want them showing up
- Wasted time/gas
- Trust erosion if not notified

**Scenario 3: Position Description Changed**

```
Update to your signup:

Worship Team - Sun Nov 16
Description updated: Now need to arrive 30 min early for sound check

View details: [link]
```

**Why this matters:**

- Expectations changed
- Might need different preparation

**Scenario 4: You're Removed From List**

```
Your signup has been changed:

You've been removed from Worship Team - Sun Nov 16

If this is an error, please contact the coordinator.
```

**Why this matters:**

- Coordinator might have moved them
- Or accidentally deleted them
- Confusion prevention

**Scenario 5: Confirmation (Maybe?)**

```
✅ Confirmed!

You're signed up for:
Worship Team - Sun Nov 16 at 9:00 AM

See you there!
```

**Why this matters:**

- Peace of mind
- They have a record
- Can save the message

### 🎯 The COORDINATORS (The People Organizing)

#### Critical Scenarios for Coordinators

**Scenario 1: Gap Alert (THIS IS THE BIG ONE)**

```
⚠️ GAPS in Sunday Service - Nov 16

Unfilled positions:
• Worship Team: 2/5 (need 3 more)
• Greeters: 0/4 (need 4!)
• Setup: 1/3 (need 2 more)

Event is in 3 days.
```

**Why this matters:**

- Proactive > reactive
- Time to recruit
- Avoid last-minute scrambling

**Scenario 2: Reminder Before Event**

```
Reminder: Sunday Service - Nov 16

Tomorrow at 9:00 AM

Current status:
✅ Worship Team: Full (5/5)
⚠️ Greeters: 3/4 (need 1 more)
✅ Setup: Full (3/3)
```

**Why this matters:**

- Last chance to fill gaps
- Confirmation everything's set
- Peace of mind (or call to action)

**Scenario 3: Someone Important Cancelled**

```
❌ Sarah Johnson cancelled

Worship Lead - Sun Nov 16

This is a key position.
Find replacement ASAP.
```

**Why this matters:**

- Some positions are more critical
- Coordinator needs to act fast
- Different from regular cancellation

**Scenario 4: Minimum Reached**

```
🎯 Pickleball is ON!

Sat Nov 15 - 4 players confirmed

Minimum met, game is happening!
```

**Why this matters:**

- For optional events that need minimum
- Everyone waiting to know if it's happening

### 🎯 The ADMINS (Sending Custom Messages)

**Scenario 1: Broadcast to Everyone Signed Up**

```
Admin composes:
"Weather alert: Service moved indoors to Fellowship Hall"

Sends to: All 47 people signed up for outdoor setup
```

**Scenario 2: Message Specific Volunteers**

```
Admin composes:
"Can you arrive 15 minutes early? Need help with AV setup"

Sends to: Just the Worship Team (5 people)
```

**Scenario 3: Last-Minute Recruitment**

```
Admin composes:
"URGENT: Need 2 more greeters for tomorrow's service. Can anyone help?"

Sends to: Everyone who's volunteered as greeters before
```

**This is huge!** Custom messaging is actually the most flexible tool.

## The Scale Problem

### Small Church (What I Was Thinking)

- 50 volunteers total
- 2 events per week
- 5-10 signups per event
- **Individual signup notifications = Fine**

### Large Church (What You're Describing)

- 500+ volunteers
- 10+ events per week
- 50-100 signups per event
- **Individual signup notifications = SPAM**

### At Scale, Different Strategy Needed

**For Coordinators:**

- ❌ Individual signup notifications (too many)
- ✅ Gap alerts (what's missing)
- ✅ Daily summary (batch updates)
- ✅ Important events only (cancellations, key people)

**For Volunteers:**

- ✅ Confirmation when they sign up
- ✅ Changes to THEIR signups
- ✅ Custom messages from admin

## Notification Priorities: Complete Reorder

### Priority 1: Volunteer-Centric (Changes Affecting Them)

1. ✅ **Event you signed up for was cancelled**
2. ✅ **Event details changed** (time, location, description)
3. ✅ **You were removed from list** (coordinator action)
4. ✅ **Custom message from admin** to you specifically
5. 🤔 **Confirmation when you sign up** (optional?)

### Priority 2: Coordinator Gap Detection

1. ✅ **Gap alert: X days before event, Y positions unfilled**
2. ✅ **Cancellation of key position holder** (if position marked critical)
3. ✅ **Daily digest: Here's what's unfilled** (batch, not real-time)
4. 🤔 **Minimum not met** alert (for optional events)

### Priority 3: Admin Tools

1. ✅ **Compose and send custom message** to specific volunteers
2. ✅ **Broadcast to all volunteers** on an event
3. ✅ **Message volunteers who match criteria** (e.g., all greeters)
4. ✅ **Template messages** for common scenarios

### Priority 4: Coordinator Individual Notifications (Maybe Not?)

1. ❓ **Someone signed up** (might be spam at scale)
2. ❓ **Someone cancelled** (might be spam at scale)
3. ❓ **List is full** (probably obvious from gap alerts)

## Research Questions to Answer

### Question 1: Volunteer Phone Number Collection

**How do we get volunteer phone numbers?**

**Option A: Required at signup**

```
Name: John Smith
Phone: (555) 123-4567 ← Required field
Email: optional
```

**Option B: Optional at signup, with incentive**

```
Name: John Smith
Phone: (optional) ← "Get text confirmations and updates"
```

**Option C: Separate opt-in page**

```
After signup: "Want text updates? Add your phone number"
```

**Option D: Admin collects separately**

```
Admin imports phone numbers from church database
```

**RESEARCH NEEDED:**

- What's the conversion rate for optional vs required?
- Privacy concerns?
- Do volunteers WANT text notifications?
- Should phone be tied to a user account or just stored per signup?

### Question 2: Gap Detection Logic

**When is a gap a problem?**

**Option A: Time-based**

```
IF event is in < 7 days
AND positions unfilled > 20%
THEN alert coordinator
```

**Option B: Role-based**

```
IF critical role unfilled
THEN alert immediately
```

**Option C: Threshold-based**

```
IF total signups < minimum required
THEN alert coordinator
```

**Option D: Custom per event**

```
Coordinator sets: "Alert me if < 4 people signed up, 3 days before"
```

**RESEARCH NEEDED:**

- What's actually useful for coordinators?
- Too many alerts = ignored
- Not enough = problems arise
- Should this be configurable?

### Question 3: Custom Messaging Interface

**How do admins compose messages?**

**Option A: Simple text box**

```
┌────────────────────────────────┐
│ Compose message:               │
│                                │
│ Weather alert: Moved indoors   │
│                                │
└────────────────────────────────┘

Send to: ▼ All volunteers on this event
```

**Option B: Template library**

```
Select template: ▼
- Weather/Location Change
- Time Change
- Cancellation
- Urgent Request
- Custom...

[Template auto-fills, admin edits]
```

**Option C: Rich composer**

```
Subject: Weather Alert
Message: Weather alert: Moved indoors
Recipients: ☑ Worship Team ☐ Greeters
Schedule: ○ Send now ● Schedule for...
```

**RESEARCH NEEDED:**

- What messages do admins actually send?
- Is templating overkill?
- Should messages be scheduled?
- Preview before sending?
- Track who received/read?

### Question 4: Volunteer Account System

**Current system:** No accounts, just localStorage name

**Problem:**

- No way to tie phone number to volunteer
- No way to manage preferences
- No way to track notification history

**Options:**

**Option A: Add simple accounts**

```
- Volunteers create account (email/password)
- Add phone number to profile
- Manage notification preferences
- Can see their signup history
```

**Option B: Phone-as-identity**

```
- Enter phone at signup
- Receive SMS with verification code
- Phone becomes their identifier
- No password needed (SMS-based auth)
```

**Option C: Hybrid**

```
- Optional account creation
- Can sign up without account (current flow)
- If account exists, tie signups to it
- Get notifications only if logged in/verified
```

**RESEARCH NEEDED:**

- Is requiring accounts too much friction?
- How do other volunteer systems handle this?
- What about people without smartphones?
- Family signups (one phone, multiple people)?

### Question 5: Event Change Notifications

**What changes warrant notification?**

**High Priority (Always notify):**

- Event cancelled
- Event date/time changed
- Event location changed

**Medium Priority (Configurable?):**

- Event description changed
- Role description changed
- Max slots changed (more spaces available)

**Low Priority (Probably don't notify):**

- Event title changed
- Coordinator changed
- Minor description edits

**RESEARCH NEEDED:**

- How often do events actually change?
- Are volunteers annoyed by too many "update" messages?
- Should there be a "View changes" link instead of full details?

### Question 6: Confirmation Messages

**Should volunteers get confirmation when they sign up?**

**Arguments FOR:**

- Peace of mind
- They have a record
- Clear communication
- Professional

**Arguments AGAINST:**

- They just saw confirmation on screen
- Adds SMS cost
- Might be redundant
- Could become spam at scale

**Middle Ground Options:**

- Opt-in only: "Get text confirmation?"
- Batch: Daily summary of what you signed up for
- Email instead: Less intrusive, free
- Only for events >7 days away (time to forget)

**RESEARCH NEEDED:**

- What do volunteers expect?
- Do other systems send confirmations?
- SMS vs email for confirmations?

### Question 7: Delivery and Reliability

**What happens if SMS fails?**

**Scenarios:**

- Invalid phone number
- Carrier blocked message
- Twilio service down
- Rate limit exceeded
- Volunteer replied STOP

**Fallback Options:**

- Retry X times
- Fall back to email
- Show error in admin dashboard
- Log and move on

**RESEARCH NEEDED:**

- What's the typical failure rate?
- Do we need real-time delivery tracking?
- Should admins see who received messages?
- What about international numbers (even if we don't support)?

### Question 8: Privacy and Consent

**Legal Requirements:**

- TCPA requires explicit opt-in
- Must provide opt-out (STOP)
- Must identify sender
- Quiet hours enforcement

**Practical Questions:**

- Do we need separate consent for different message types?
  - "Get notifications about MY signups" ✓
  - "Get messages from coordinators" ✓
  - "Get recruitment messages" ✓
- Can volunteers see who has their phone number?
- Can they export/delete their data?
- What's shown in privacy policy?

**RESEARCH NEEDED:**

- What's the minimum viable consent?
- Best practices from other volunteer systems?
- How granular should preferences be?

## Revised Feature Matrix

### Phase 1: Volunteer-First MVP

**Week 1: Phone Collection & Verification**

- [ ] Add optional phone field to signup form
- [ ] SMS verification flow (send code, verify)
- [ ] Store verified phone with volunteer_signups record
- [ ] Privacy policy update

**Week 2: Critical Volunteer Notifications**

- [ ] Event cancelled → SMS to all signed up
- [ ] Event time/location changed → SMS to all signed up
- [ ] You were removed → SMS to individual
- [ ] Test all notification flows

**Week 3: Admin Custom Messaging**

- [ ] UI: Compose message to volunteers on event
- [ ] UI: Select specific volunteers or lists
- [ ] Preview before send
- [ ] Send and log messages

**Deliverable:** Volunteers get notified about changes, admins can message them

---

### Phase 2: Coordinator Gap Alerts

**Week 4: Gap Detection**

- [ ] Define gap logic (configurable per event?)
- [ ] Daily digest: "These events need volunteers"
- [ ] Critical role alerts
- [ ] Minimum threshold alerts

**Week 5: Coordinator Tools**

- [ ] Coordinator assignment UI
- [ ] Gap alert preferences
- [ ] View notification history
- [ ] Test at scale

**Deliverable:** Coordinators know what needs coverage

---

### Phase 3: Polish & Scale

**Week 6+: Enhancements**

- [ ] Confirmation messages (optional)
- [ ] Message templates library
- [ ] Scheduled messages
- [ ] Delivery tracking dashboard
- [ ] Analytics (open rates, opt-out rates)

---

## Cost Recalculation

### Scenario: Large Church (Revised)

**Volunteers:** 500 active
**Events per month:** 40
**Avg signups per event:** 20

**Notification Volume:**

- Event changes: 5 events change/month × 20 people = 100 SMS
- Cancellations: 2 events cancelled/month × 20 people = 40 SMS
- Admin custom messages: 10 messages/month × 50 people avg = 500 SMS
- Gap alerts to coordinators: 30 alerts/month × 1 coordinator = 30 SMS
- Confirmations (if enabled): 40 events × 20 signups = 800 SMS

**Total:** ~1,470 SMS/month

**Cost:**

- Twilio: $11.60/month
- Telnyx: $5.88/month

**Still totally reasonable.**

## Key Insights from Rethinking

1. **Volunteers need notifications MORE than coordinators**
   - They committed time
   - Changes affect their schedule
   - Communication builds trust

2. **Gap detection > individual signup tracking**
   - Proactive problem solving
   - Coordinators care about coverage, not individuals
   - Batch > real-time at scale

3. **Custom messaging is a superpower**
   - Most flexible tool
   - Handles edge cases
   - Personal touch

4. **Phone collection is the hard part**
   - Need to make it easy/valuable
   - Verification is critical
   - Privacy matters

5. **Scale changes everything**
   - What works for 50 people ≠ 500 people
   - Need different notification strategies
   - Configurability becomes important

## Next Research Priorities

### Immediate (Before Building Anything)

1. **How do we collect phone numbers?** (Required? Optional? When?)
2. **Do volunteers WANT text notifications?** (Survey your users!)
3. **What messages do admins actually need to send?** (Interview coordinators)
4. **How often do events change?** (Check your data)

### Before Phase 2

5. What makes a "gap" worth alerting about?
6. How often should gap alerts be sent?
7. What's the right balance of notifications?

### Before Phase 3

8. Do confirmations add value or spam?
9. What message templates are most useful?
10. How to measure success (open rates? response rates?)

## Proposed Next Steps

**Option A: User Research First**

- Survey volunteers: "Would you want text notifications? For what?"
- Interview coordinators: "What keeps you up at night about events?"
- Analyze current data: How often do events change? Cancel?

**Option B: Simplest Possible Test**

- Build just event cancellation notifications
- Manually collect 20 phone numbers
- See if volunteers find it valuable
- Learn and iterate

**Option C: Admin Messaging First**

- Build custom messaging tool
- Coordinators manually enter phone numbers
- Most flexible, test different use cases
- Learn what messages are actually sent

**What sounds most valuable to explore first?**

---

**Last Updated:** November 9, 2025
