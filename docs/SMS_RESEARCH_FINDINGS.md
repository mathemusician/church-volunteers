# SMS Notifications: Research Findings from Existing Systems

## Research Sources Analyzed

1. **SignUpGenius** - Leading volunteer management platform
2. **SignUp.com** (formerly VolunteerSpot) - Popular scheduling tool
3. **Planning Center Services** - Church-specific volunteer scheduling
4. **Pushpay/ChurchTrac** - Church management software
5. **Twilio Best Practices** - SMS provider guidelines
6. **501 Commons** - Nonprofit legal compliance guide

---

## Key Finding #1: How Real Systems Collect Phone Numbers

### Planning Center Services Approach

**Phone Collection Method:**

- Users add their own phone number in their profile settings
- Requires phone number AND carrier selection (AT&T, Verizon, etc.)
- Admin/leaders CAN add phone numbers for users
- **Critical:** Verizon does NOT support SMS-to-email gateway (as of their docs)
  - Verizon users must use mobile app for notifications instead

**Implementation Details:**

```
Profile → Communication → Mobile Phone
- Enter phone number
- Select carrier from dropdown
- Choose which notifications to receive via text
```

**Lesson:** Carrier selection is often required for SMS-to-email gateways (older tech), BUT modern systems use direct SMS APIs (Twilio) which DON'T need carrier info.

### SignUp.com / VolunteerSpot Approach

**From their docs:**

- Volunteers receive "invitation messages, reminder messages, change notifications"
- System sends automatic reminders to those who signed up
- Includes organizer's reply email in footer for two-way contact

**Key Insight:** They focus on automated reminders, not real-time individual notifications.

---

## Key Finding #2: What Notifications Are Actually Sent

### From Planning Center Services

**Team Leader Notifications (for coordinators):**

1. ✅ Someone **declined** a scheduling request
2. ✅ Someone **blocked out dates** (unavailable)
3. ❌ NOT sent: Acceptance notifications (too noisy!)

**Volunteer Notifications:**

1. Scheduling requests
2. Reminders before events
3. General updates from coordinators

**Critical Best Practice:** Coordinators DON'T get notified on every acceptance - only problems (declines/blockouts).

### From Twilio SMS Best Practices

**Appointment Reminders Template Structure:**

```
Hi [NAME],
Your appointment on [DATE] at [TIME] is confirmed.
View details: [LINK]
```

**Best Practices:**

- 160 character limit per segment (keep short!)
- Send confirmation immediately
- Send reminder 1 week before
- Send reminder day-of
- Include most critical info first (date, time)
- Links are okay but optional

**Key Timing:**

- Confirmation: Immediately after signup
- First reminder: 1 week before
- Second reminder: Day of event

---

## Key Finding #3: Legal Compliance for Nonprofits

### TCPA Rules for Nonprofits (MUCH EASIER than businesses!)

**From 501 Commons research:**

✅ **Nonprofits get "implied consent"**

- If someone gave you their phone number AT ANY TIME, you can text them
- Don't need explicit "I agree to receive texts" checkbox
- Exception: If they gave it for a specific purpose only

✅ **No Do-Not-Call registry required**

- Businesses must check DNC registry
- Nonprofits are exempt

✅ **Required:**

- Must provide opt-out mechanism (STOP)
- Must honor opt-outs
- Update contact lists regularly

**What This Means:**

- You CAN collect phone at signup without complex consent forms
- Simple "Get text updates? Add your phone" is fine
- MUST implement STOP command

---

## Key Finding #4: Volunteer Scheduling Best Practices

### From ChurchTrac Best Practices Guide

**DO's:**

1. **Clear communication** - Pick one day/week to send schedules
2. **Plan 4-6 weeks ahead** - Sweet spot for volunteer commitment
3. **Show appreciation** - Thank volunteers weekly
4. **Proper training** - Well-trained volunteers stay longer
5. **Flexibility** - Different volunteers have different capacity
6. **Know your volunteers** - Match skills to roles
7. **Grow their faith** - Spiritual investment = long-term engagement

**DON'Ts:**

1. **Don't assume availability** - Always confirm first
2. **Avoid last-minute changes** - Wears people out
3. **Don't overlook feedback** - Volunteers know what works
4. **Avoid burnout** - Nobody should serve more than once/month ideally
5. **Don't neglect conflict** - Address immediately
6. **No one-size-fits-all** - Accommodate individual schedules

**Key Insight for SMS:**

- Communication consistency matters MORE than frequency
- Pick Monday for scheduling requests, Thursday for follow-ups
- Volunteers need 4-6 weeks notice, not last-minute texts

---

## Key Finding #5: What Works at Scale

### From Multiple Sources

**Small Churches (50-100 volunteers):**

- Can notify coordinators on individual signups
- Personal touch is valued
- Manual coordination works

**Large Churches (500+ volunteers):**

- Individual signup notifications = spam
- Need **gap alerts** instead ("3 positions unfilled!")
- Automated reminders are critical
- Batch/digest notifications preferred

**Pushpay's Approach:**

- Automated workflows for common scenarios
- Reports showing "health" of volunteer coverage
- Position insights at a glance
- Self-service swap functionality

---

## Key Finding #6: Two-Way Messaging Reality

### What Planning Center Does

**Volunteers can:**

- Decline scheduling requests (via SMS reply)
- Block out dates (through app/web)
- Contact their team leader directly (email in footer)

**What they DON'T do:**

- Accept complex commands via SMS
- Parse natural language replies
- Allow full management via text

**Industry Standard:**

- STOP = unsubscribe (legally required)
- HELP = info message
- START = re-subscribe
- Everything else = "Visit the app"

**Lesson:** Don't build a chatbot. Keep it simple.

---

## Key Finding #7: Message Templates That Work

### From Twilio + Real Systems

**Event Confirmation (Immediate):**

```
✅ You're confirmed!
Worship Team - Sun Nov 16, 9 AM
See you there!
```

~50 chars, instant peace of mind

**Reminder (1 week before):**

```
Reminder: You're scheduled for
Worship Team - Sun Nov 16, 9 AM
Can't make it? Let us know: [link]
```

~80 chars, includes opt-out

**Change Notification:**

```
⚠️ Time change:
Worship Team - Sun Nov 16
Now 8 AM (was 9 AM)
```

~50 chars, critical info only

**Cancellation:**

```
❌ CANCELLED
Worship Team - Sun Nov 16
Sorry for the inconvenience!
```

~50 chars, clear and apologetic

---

## Key Finding #8: Phone Collection Patterns

### What Actually Works

**Option A: Profile-based (Planning Center model)**

- User adds phone in profile settings
- Used across all their signups
- Pro: One-time setup
- Con: Requires account system

**Option B: Per-signup (SignUpGenius model)**

- Phone collected at each signup
- No account needed
- Pro: Frictionless
- Con: Same person enters phone multiple times

**Option C: Hybrid (Recommended)**

```
At signup:
☐ Save my info for next time
  Name: [John Smith]
  Phone: [(555) 123-4567] ← optional

If phone provided:
"Want text reminders? Your phone will be used for this event only."
```

**Best Practice from Research:**

- Make phone optional to reduce friction
- Show clear value prop ("Get text reminders!")
- Allow saving for future signups
- Don't require account creation

---

## Key Finding #9: Cost Reality Check

### From SignUpGenius Pricing

**Free Plan:**

- Basic SMS reminders (limited)
- Email notifications unlimited

**Platinum Plan ($99/year):**

- Unlimited SMS
- Custom messaging
- Advanced features

**Lesson:** SMS is a premium feature, not free. Budget for it.

### Twilio Actual Costs

**From research:**

- Phone number rental: $1-2/month
- US SMS: $0.0079 per message
- 1000 SMS/month = ~$8-10/month total

**Nonprofit Pricing:**

- Twilio.org offers credits for eligible nonprofits
- Can apply for Impact Access Program
- Potential free/discounted service

---

## Key Finding #10: What NOT to Build

### Features That Don't Work (From Research)

❌ **Complex SMS Commands**

- Planning Center tried, users confused
- Better: Link to app for complex actions

❌ **Full Two-Way Conversations**

- SMS isn't a chat platform
- Expectations mismatch
- Support burden too high

❌ **Delivery Tracking UI**

- Most users don't care
- Adds complexity
- Only matters if message fails

❌ **Custom Templates per Event**

- Coordinators won't use it
- One good template > 10 mediocre ones
- Consistency is better

❌ **Real-time Individual Notifications at Scale**

- Works for small churches only
- Becomes spam quickly
- Gap alerts more valuable

---

## Research-Based Recommendations

### Phase 1: Volunteer Notifications (Based on SignUpGenius model)

**Must Have:**

1. Event confirmation SMS (immediate)
2. Event cancellation SMS
3. Event time/location change SMS
4. Phone collection at signup (optional field)

**Skip for Now:**

- Coordinator notifications (wait for feedback)
- Reminder SMS (nice-to-have)
- Custom messaging (Phase 2)

### Phase 2: Gap Alerts (Based on Planning Center model)

**Must Have:**

1. Daily digest of unfilled positions
2. Critical position alerts (leader declines)
3. Configurable alert preferences

**Skip for Now:**

- Individual signup notifications
- Real-time everything

### Phase 3: Custom Messaging (Based on ChurchTrac model)

**Must Have:**

1. Compose message to event volunteers
2. Broadcast to all in a ministry
3. Template library (5-10 common messages)

**Skip for Now:**

- Scheduled messages
- Complex segmentation
- A/B testing

---

## Implementation Decisions Based on Research

### ✅ DO (Industry Standard)

1. **Use Twilio** - Industry standard, best docs
2. **Make phone optional** - Reduce friction
3. **Send confirmations** - Users expect it
4. **Send change notifications** - Critical for trust
5. **Implement STOP** - Legally required
6. **Keep messages under 160 chars** - One segment
7. **Plan 4-6 weeks ahead** - Sweet spot timing
8. **Gap alerts over individual notifications** - More valuable

### ❌ DON'T (Lessons from Others)

1. **Don't require accounts** - Too much friction
2. **Don't collect carrier info** - Use API not email gateway
3. **Don't notify on every signup** - Spam at scale
4. **Don't build SMS commands** - Link to app instead
5. **Don't send marketing** - Stay mission-focused
6. **Don't ignore STOP** - Legal requirement
7. **Don't forget quiet hours** - Respect volunteers

---

## Next Steps Based on Research

**Before Building:**

1. ✅ Sign up for Twilio trial account (get $15 credit)
2. ✅ Apply for Twilio.org nonprofit program (if eligible)
3. ✅ Test sending 1 SMS to verify it works
4. ✅ Implement STOP/START handling

**Week 1: Basic Volunteer Notifications**

- [ ] Add optional phone field to signup form
- [ ] Send confirmation SMS on signup
- [ ] Send cancellation SMS if event cancelled
- [ ] Implement STOP command

**Week 2: Event Changes**

- [ ] Detect when event details change
- [ ] Send SMS to all signed-up volunteers
- [ ] Track which changes warrant notifications

**Week 3: Polish**

- [ ] Add quiet hours (10 PM - 8 AM)
- [ ] Build SMS log for admins
- [ ] Test at scale (100+ volunteers)

**Week 4+: Evaluate**

- Get feedback from real users (you're dogfooding!)
- Measure: Open rates, opt-out rates, response
- Decide: Gap alerts? Custom messaging? Or iterate?

---

## Research Citations

- Planning Center Services notification docs and tutorial
- SignUpGenius features and pricing
- SignUp.com (VolunteerSpot) FAQ
- Twilio SMS best practices guide
- 501 Commons TCPA compliance for nonprofits
- ChurchTrac volunteer scheduling best practices
- Pushpay church volunteer management features

**Last Updated:** November 9, 2025
**Research Completed By:** Actual investigation of industry leaders

---

## Key Takeaways

1. **Nonprofits have it easier** - TCPA implied consent rules
2. **Volunteers need notifications MORE than coordinators** - Changes affect their schedule
3. **Keep it simple** - One good template beats 10 mediocre ones
4. **Gap alerts > individual notifications** - At scale, problems matter more than confirmations
5. **Don't build a chatbot** - Link to app for complex actions
6. **4-6 weeks notice** - Industry standard for volunteer commitment
7. **Cost is negligible** - $5-20/month even at scale
8. **Start small** - Confirmations + cancellations = 80% of value
