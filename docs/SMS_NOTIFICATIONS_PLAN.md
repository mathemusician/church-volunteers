# SMS Notifications Implementation Plan

## Overview

Enable text message notifications when volunteers sign up for events, allowing coordinators to receive real-time alerts.

## Use Cases

### Primary Use Case

**Event Coordinator receives SMS when someone signs up**

- Coordinator for "Worship Team" gets notified when someone signs up for that list
- Notification includes: volunteer name, event name, list name, timestamp

### Secondary Use Cases

- Notify when list reaches minimum capacity
- Notify when list is full
- Notify when someone cancels (removes their name)
- Digest notifications (daily/weekly summary instead of real-time)

## Phase 1: Research & Architecture Design

### A. SMS Service Provider Options

#### 1. **Twilio** (Most Popular)

**Pros:**

- Industry standard, very reliable
- Excellent documentation and SDKs
- Pay-as-you-go pricing
- Supports both SMS and WhatsApp
- Two-way messaging support
- Delivery status tracking

**Cons:**

- More expensive than alternatives (~$0.0079/SMS in US)
- Requires phone number rental ($1-2/month)

**Cost Estimate:**

- Phone number: $1.15/month
- SMS: $0.0079 per message sent
- Example: 100 notifications/month = ~$2/month

**Links:**

- [Twilio SMS Quickstart](https://www.twilio.com/docs/sms/quickstart)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)

#### 2. **AWS SNS (Simple Notification Service)**

**Pros:**

- Very cheap ($0.00645/SMS in US)
- No phone number rental needed
- Integrates well if using AWS
- Can also do email, push notifications

**Cons:**

- SMS-only (one-way)
- No delivery tracking
- Requires AWS account setup
- More complex for SMS-specific use cases

**Cost Estimate:**

- No base fee
- SMS: $0.00645 per message
- Example: 100 notifications/month = $0.65/month

**Links:**

- [AWS SNS SMS](https://aws.amazon.com/sns/sms-pricing/)

#### 3. **Vonage (formerly Nexmo)**

**Pros:**

- Similar to Twilio
- Competitive pricing
- Good global coverage

**Cons:**

- Less popular than Twilio
- Smaller community/resources

**Cost Estimate:**

- Similar to Twilio

#### 4. **Telnyx**

**Pros:**

- Cheaper than Twilio ($0.004/SMS)
- Real-time delivery receipts
- Good for high volume

**Cons:**

- Less documentation
- Smaller ecosystem

**Cost Estimate:**

- Phone number: $1/month
- SMS: $0.004 per message
- Example: 100 notifications/month = ~$1.40/month

### B. Recommended Choice

**🎯 Start with Twilio**

Reasons:

1. Best documentation for learning
2. Most Stack Overflow answers
3. Free trial credits ($15-20) to test
4. Can switch later if cost becomes issue
5. Reliable delivery tracking

**When to switch:**

- If sending >1000 SMS/month, consider Telnyx or AWS SNS for cost savings
- If only need one-way messages, AWS SNS is cheapest

### C. Data Model Design

#### New Database Tables

**1. `notification_preferences` table**

```sql
CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMP,

  -- Notification settings
  enabled BOOLEAN DEFAULT true,
  notify_on_signup BOOLEAN DEFAULT true,
  notify_on_cancellation BOOLEAN DEFAULT false,
  notify_on_list_full BOOLEAN DEFAULT false,
  notify_on_minimum_reached BOOLEAN DEFAULT false,

  -- Digest settings (alternative to real-time)
  digest_enabled BOOLEAN DEFAULT false,
  digest_frequency VARCHAR(20), -- 'daily', 'weekly', null
  digest_time TIME, -- e.g., '08:00:00' for 8 AM

  -- Quiet hours (don't send during these times)
  quiet_hours_start TIME, -- e.g., '22:00:00' (10 PM)
  quiet_hours_end TIME,   -- e.g., '08:00:00' (8 AM)

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User can only have one phone number
CREATE UNIQUE INDEX idx_notification_prefs_user ON notification_preferences(user_id);
```

**2. `event_coordinators` table** (Links users to events they coordinate)

```sql
CREATE TABLE event_coordinators (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES volunteer_events(id) ON DELETE CASCADE,
  list_id INTEGER REFERENCES volunteer_lists(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Override notification preferences for specific events
  notify_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- A coordinator can be assigned to either an event or a specific list
  CONSTRAINT coordinator_assignment CHECK (
    (event_id IS NOT NULL AND list_id IS NULL) OR
    (event_id IS NULL AND list_id IS NOT NULL)
  )
);

-- Prevent duplicate assignments
CREATE UNIQUE INDEX idx_event_coordinator ON event_coordinators(event_id, user_id)
  WHERE event_id IS NOT NULL;
CREATE UNIQUE INDEX idx_list_coordinator ON event_coordinators(list_id, user_id)
  WHERE list_id IS NOT NULL;
```

**3. `sms_notifications` table** (Audit log)

```sql
CREATE TABLE sms_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  phone_number VARCHAR(20) NOT NULL,

  -- Message details
  message_type VARCHAR(50) NOT NULL, -- 'signup', 'cancellation', 'verification', etc.
  message_body TEXT NOT NULL,

  -- Related entities
  event_id INTEGER REFERENCES volunteer_events(id),
  list_id INTEGER REFERENCES volunteer_lists(id),
  signup_id INTEGER REFERENCES volunteer_signups(id),

  -- Delivery tracking
  status VARCHAR(20) NOT NULL, -- 'queued', 'sent', 'delivered', 'failed'
  provider_message_id VARCHAR(100), -- Twilio SID or similar
  error_message TEXT,

  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_notifications_user ON sms_notifications(user_id);
CREATE INDEX idx_sms_notifications_status ON sms_notifications(status);
CREATE INDEX idx_sms_notifications_created ON sms_notifications(created_at);
```

**4. Update `users` table**

```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'member';
-- Possible roles: 'admin', 'coordinator', 'member'
```

## Phase 2: Legal & Compliance

### A. TCPA Compliance (USA)

**Requirements:**

1. **Prior Express Written Consent** - Users must explicitly opt-in
2. **Clear Disclosure** - State who's sending, message frequency, data rates
3. **Easy Opt-Out** - Allow "STOP" to unsubscribe
4. **Quiet Hours** - Don't send before 8 AM or after 9 PM (recipient's timezone)

**Implementation:**

```typescript
// Opt-in consent form text
const CONSENT_TEXT = `
By providing your phone number, you agree to receive text 
notifications from [Church Name] about volunteer signups. 
Message frequency varies. Message and data rates may apply. 
Reply STOP to opt out at any time.
`;
```

### B. Data Privacy

**Requirements:**

1. Store phone numbers encrypted at rest
2. Add phone numbers to privacy policy
3. Allow users to delete their data (GDPR/CCPA)
4. Don't share phone numbers with third parties

### C. Verification Flow

**Phone Number Verification:**

1. User enters phone number
2. Send 6-digit verification code via SMS
3. User enters code to verify
4. Mark `phone_verified = true`
5. Only send notifications to verified numbers

## Phase 3: Notification Triggers

### A. Trigger: Volunteer Signs Up

**When:** Someone adds their name to a volunteer list

**Who Gets Notified:**

- Event coordinator (if assigned to event)
- List coordinator (if assigned to specific list)

**Message Template:**

```
📋 [Event Name]
✅ [Volunteer Name] signed up for [List Name]
👥 [Current Count]/[Max Slots] filled

View: [Short URL to event]
```

**Example:**

```
📋 Regular Sunday Service - Nov 16
✅ John Smith signed up for Worship Team
👥 3/5 filled

View: https://app.com/e/abc123
```

### B. Trigger: Volunteer Cancels

**When:** Someone removes their name from a list

**Message Template:**

```
📋 [Event Name]
❌ [Volunteer Name] cancelled from [List Name]
👥 [Current Count]/[Max Slots] filled
```

### C. Trigger: List Reaches Minimum

**When:** List reaches `min_players` threshold

**Message Template:**

```
🎯 [Event Name]
Minimum reached for [List Name]!
👥 [Current Count]/[Max Slots] filled
```

### D. Trigger: List Is Full

**When:** List reaches `max_slots`

**Message Template:**

```
✅ [Event Name]
[List Name] is now full!
👥 [Max Slots]/[Max Slots] filled
```

## Phase 4: Implementation Phases

### **Phase 4.1: Foundation** (Week 1-2)

**Goals:**

- Set up Twilio account and test
- Create database migrations
- Build basic admin UI for phone number entry

**Tasks:**

1. ✅ Create Twilio account, get trial credits
2. ✅ Add environment variables for Twilio credentials
3. ✅ Create database migrations for new tables
4. ✅ Create `/lib/sms.ts` utility with Twilio client
5. ✅ Build admin settings page for phone number
6. ✅ Implement phone verification flow

**Deliverable:** Admin can add and verify their phone number

---

### **Phase 4.2: First Notification** (Week 3)

**Goals:**

- Send SMS when someone signs up
- Basic notification log

**Tasks:**

1. ✅ Create API endpoint for coordinator assignment
2. ✅ Add coordinator assignment UI to event manager
3. ✅ Implement signup webhook/trigger
4. ✅ Send test SMS on signup
5. ✅ Create basic notification log page

**Deliverable:** Coordinators receive SMS when someone signs up

---

### **Phase 4.3: User Preferences** (Week 4)

**Goals:**

- Let users control notification types
- Implement quiet hours

**Tasks:**

1. ✅ Build user notification settings page
2. ✅ Add toggles for different notification types
3. ✅ Implement quiet hours logic
4. ✅ Add opt-out via "STOP" keyword

**Deliverable:** Users can customize their notification preferences

---

### **Phase 4.4: Enhanced Features** (Week 5+)

**Goals:**

- Digest notifications
- Better message templates
- Delivery tracking UI

**Tasks:**

1. ✅ Implement daily/weekly digest
2. ✅ Build message template editor
3. ✅ Create delivery status dashboard
4. ✅ Add retry logic for failed messages

**Deliverable:** Full-featured notification system

## Phase 5: Technical Architecture

### A. SMS Service Module

**File:** `/apps/web/src/lib/sms.ts`

```typescript
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export interface SendSMSOptions {
  to: string;
  message: string;
  userId?: number;
  eventId?: number;
  listId?: number;
  signupId?: number;
}

export async function sendSMS(options: SendSMSOptions) {
  // 1. Check quiet hours
  // 2. Send via Twilio
  // 3. Log to database
  // 4. Return success/failure
}

export async function sendVerificationCode(phoneNumber: string) {
  const code = generateCode();
  // Send code and store in cache/db
}
```

### B. Webhook/Trigger System

**Option 1: Database Triggers (PostgreSQL)**

```sql
CREATE OR REPLACE FUNCTION notify_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Next.js API endpoint
  PERFORM pg_notify('volunteer_signup',
    json_build_object(
      'signup_id', NEW.id,
      'list_id', NEW.list_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER volunteer_signup_trigger
AFTER INSERT ON volunteer_signups
FOR EACH ROW
EXECUTE FUNCTION notify_on_signup();
```

**Option 2: Application-Level (Simpler)**

```typescript
// In API route: /api/volunteer/signup
export async function POST(request: Request) {
  // ... create signup ...

  // Send notifications
  await notifyCoordinators({
    eventId: signup.event_id,
    listId: signup.list_id,
    volunteerName: signup.name,
    action: 'signup',
  });

  return NextResponse.json({ success: true });
}
```

**Recommendation:** Use Option 2 (application-level) for simplicity and better error handling.

### C. Background Jobs (Optional, for Digests)

**Use:** `node-cron` or Vercel Cron Jobs

```typescript
// /app/api/cron/send-digests/route.ts
export async function GET() {
  // Runs daily at 8 AM
  // Find users with digest enabled
  // Aggregate signups from last 24 hours
  // Send summary SMS
}
```

## Phase 6: Cost Estimates

### Scenario: Small Church (50 volunteers)

**Assumptions:**

- 2 events per week
- 3 lists per event
- 10 signups per week
- 1 coordinator per list (3 coordinators)

**Monthly SMS:**

- Signups: 10/week × 4 weeks × 3 coordinators = 120 SMS
- Cancellations (estimate 20%): 24 SMS
- **Total: ~150 SMS/month**

**Monthly Cost (Twilio):**

- Phone number: $1.15
- SMS: 150 × $0.0079 = $1.19
- **Total: ~$2.34/month**

### Scenario: Large Church (500 volunteers)

**Assumptions:**

- 10 events per week
- 5 lists per event
- 100 signups per week
- 10 coordinators total

**Monthly SMS:**

- Signups: 100/week × 4 weeks × 10 coordinators = 4000 SMS
- Cancellations: 800 SMS
- **Total: ~4800 SMS/month**

**Monthly Cost (Twilio):**

- Phone number: $1.15
- SMS: 4800 × $0.0079 = $37.92
- **Total: ~$39/month**

**Cost Savings:** Switch to Telnyx ($0.004/SMS) = ~$20/month

## Phase 7: Security Considerations

### A. Rate Limiting

- Prevent SMS bombing attacks
- Limit to 10 SMS per phone number per hour
- Limit to 100 SMS total per organization per hour

### B. Phone Number Validation

- Use libphonenumber to validate format
- Only allow US numbers initially (expand later)
- Sanitize input

### C. Secrets Management

- Store Twilio credentials in environment variables
- Never commit credentials to git
- Rotate credentials periodically

## Phase 8: Testing Strategy

### A. Unit Tests

- Test SMS formatting logic
- Test quiet hours calculation
- Test coordinator lookup

### B. Integration Tests

- Test Twilio API calls (use test credentials)
- Test database triggers
- Test verification flow

### C. Manual Testing Checklist

- [ ] Send test SMS to real phone
- [ ] Verify opt-out works
- [ ] Test quiet hours (mock time)
- [ ] Test phone verification
- [ ] Test notification preferences

## Next Steps

1. **Decision Point:** Approve Twilio as provider?
2. **Decision Point:** Which notifications to implement first?
3. **Create migrations:** Database schema
4. **Set up Twilio:** Account and test credentials
5. **Build Phase 4.1:** Foundation week

---

## Research Questions to Explore

### Phase 1 Research (Now)

- ✅ Which SMS provider to use?
- ✅ What data do we need to store?
- ✅ Basic cost estimates

### Phase 2 Research (Before Implementation)

- How to handle international phone numbers?
- Should we support multiple phone numbers per user?
- Do we need two-way SMS (replies)?
- Should we support other channels (email, push)?

### Phase 3 Research (During Implementation)

- What's the best URL shortener for SMS links?
- How to handle SMS delivery failures?
- Should we retry failed messages?
- How to handle carrier filtering (spam detection)?

---

**Last Updated:** November 9, 2025
