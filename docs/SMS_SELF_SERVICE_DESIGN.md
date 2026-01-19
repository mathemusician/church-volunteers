# SMS Self-Service Design Document

## Overview

This document outlines a comprehensive SMS interaction system for volunteer management that handles all possible user scenarios, including volunteers signed up for multiple roles/events, self-service cancellation/rescheduling, and TCPA compliance.

## Key Design Principles

1. **Phone Number = Identity**: One phone number may have multiple signups across different events/roles
2. **Self-Service First**: Minimize coordinator workload by enabling volunteers to manage themselves
3. **Magic Link Pattern**: Send unique URLs that authenticate the user without login
4. **TCPA Compliance**: Always include opt-out instructions, respect quiet hours (8am-9pm local)
5. **Graceful Degradation**: Handle edge cases (no signups found, expired links, etc.)

---

## SMS Keyword System

### Required Keywords (TCPA/CTIA Compliance)

| Keyword                                                   | Response                                                                                                             | Action                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `STOP`, `STOPALL`, `UNSUBSCRIBE`, `CANCEL`, `END`, `QUIT` | "You've been unsubscribed from volunteer reminders. Reply START to resubscribe."                                     | Set `sms_opted_out = true` for all signups with this phone  |
| `START`                                                   | "You've been resubscribed to volunteer reminders. Reply HELP for help. Reply STOP to unsubscribe."                   | Set `sms_opted_out = false` for all signups with this phone |
| `HELP`                                                    | "Volunteer SMS Help: Reply STOP to unsubscribe. For questions, text {coordinator_phone} or visit {self_service_url}" | No database change                                          |

### Custom Keywords

| Keyword               | Response                                                                                 | Action                                       |
| --------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| `STATUS`              | "Your upcoming signups: [list]. Manage at: {self_service_url}"                           | None                                         |
| `YES`, `CONFIRM`, `Y` | "Thanks for confirming! See you there."                                                  | Mark signup as confirmed (if context exists) |
| `NO`, `CANT`, `N`     | "Got it. Manage your signup at: {self_service_url}"                                      | Send self-service link                       |
| Any other text        | "Thanks for your message. For help, reply HELP or manage signups at: {self_service_url}" | Store reply, notify coordinator if flagged   |

---

## Self-Service Portal Design

### Magic Link URL Structure

```
https://app.example.com/volunteer/manage/{token}
```

- **Token**: Unique, time-limited (7 days), tied to phone number
- **One token per phone number** (not per signup) - shows ALL signups for that phone

### Self-Service Portal Features

#### 1. Dashboard View (Landing Page)

Shows all upcoming signups for this phone number:

```
┌─────────────────────────────────────────────────────┐
│  Hi! Here are your upcoming volunteer commitments:  │
├─────────────────────────────────────────────────────┤
│  📅 Sunday Service - Jan 25, 2026                   │
│     └─ Scripture Reader for Call To Worship         │
│        [✓ Confirm] [✗ Cancel] [📝 Change]          │
│                                                     │
│  📅 Sunday Service - Feb 1, 2026                    │
│     └─ Greeter                                      │
│        [✓ Confirm] [✗ Cancel] [📝 Change]          │
│     └─ Scripture Reader                             │
│        [✓ Confirm] [✗ Cancel] [📝 Change]          │
├─────────────────────────────────────────────────────┤
│  Need help? Contact: John Smith (555-123-4567)      │
│  [Update my phone number] [Unsubscribe from SMS]    │
└─────────────────────────────────────────────────────┘
```

#### 2. Confirm Action

- One-click confirmation
- Updates `confirmed_at` timestamp on signup
- Shows success message

#### 3. Cancel Action

- Asks for optional reason (dropdown + free text)
- Removes signup from list
- Notifies coordinator
- Offers to find replacement (optional future feature)

#### 4. Change/Reschedule Action

- Shows other available slots for same role type
- Or shows other roles available for same event
- Allows swap without coordinator intervention

#### 5. Contact Coordinator

- Shows coordinator name and phone
- Option to send a message (stored in system, notifies coordinator)

---

## Database Schema Updates

### New Table: `volunteer_tokens`

```sql
CREATE TABLE volunteer_tokens (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP,

  INDEX idx_token (token),
  INDEX idx_phone (phone)
);
```

### Updates to `volunteer_signups`

```sql
ALTER TABLE volunteer_signups ADD COLUMN confirmed_at TIMESTAMP;
ALTER TABLE volunteer_signups ADD COLUMN cancelled_at TIMESTAMP;
ALTER TABLE volunteer_signups ADD COLUMN cancel_reason TEXT;
```

### Updates to `reminder_settings`

```sql
ALTER TABLE reminder_settings ADD COLUMN coordinator_name VARCHAR(100);
ALTER TABLE reminder_settings ADD COLUMN coordinator_phone VARCHAR(20);
```

---

## Message Templates

### Reminder Message (Default)

```
Hi {name}, reminder: You're signed up for {role} at {event} on {date}.

Can't make it? {self_service_url}
Questions? Text {coordinator_name} at {coordinator_phone}

Reply STOP to unsubscribe.
```

### Confirmation Response

```
Thanks for confirming, {name}! See you at {event} on {date}.

Need to change plans? {self_service_url}
```

### Status Response (for STATUS keyword)

```
Hi! Your upcoming signups:

• {date}: {role} at {event}
• {date}: {role} at {event}

Manage all: {self_service_url}
Reply STOP to unsubscribe.
```

### Help Response

```
Volunteer SMS Help:
• Reply YES to confirm
• Reply STOP to unsubscribe
• Visit {self_service_url} to manage signups

Questions? Text {coordinator_name} at {coordinator_phone}
```

---

## Multi-Signup Handling

### Scenario: Same phone, multiple signups for same event

**Problem**: "John" and "Jane" both used phone 555-1234 for the same event.

**Solution**:

1. Self-service portal shows ALL signups for that phone
2. Each signup card shows the name used
3. User can manage each independently

### Scenario: Same phone, multiple events

**Problem**: User signed up for Jan 25 and Feb 1 events.

**Solution**:

1. Reminder messages are sent per-event (not aggregated)
2. Self-service portal shows all upcoming events grouped by date
3. STATUS keyword returns all upcoming signups

### Scenario: Reply to reminder - which signup?

**Problem**: User replies "YES" but has 3 signups.

**Solution**:

1. Track `last_reminder_sms_message_id` on signup
2. When reply comes in, match to most recent reminder sent to that phone
3. If ambiguous, confirm all pending signups for that phone OR send self-service link

---

## Coordinator Experience

### Admin Dashboard Updates

1. **Replies Inbox**: Show all SMS replies grouped by phone number
2. **Confirmation Status**: Show confirmed/unconfirmed/cancelled counts per event
3. **Alerts**: Notify when someone cancels or sends a message needing attention

### Coordinator Contact Settings

Located in: Event Settings or Organization Settings

```
┌─────────────────────────────────────────────────────┐
│  Coordinator Contact (shown in SMS messages)        │
├─────────────────────────────────────────────────────┤
│  Name:  [John Smith________________]                │
│  Phone: [555-123-4567______________]                │
│                                                     │
│  ℹ️ This info is included in reminder messages     │
│     so volunteers know who to contact.              │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Keywords & Coordinator Contact ✅

- [x] STOP/START handling
- [x] Store replies in database
- [x] Coordinator contact fields in settings (name, phone)
- [x] HELP keyword returns coordinator info + self-service link
- [x] Update reminder message template

### Phase 2: Self-Service Portal (Magic Links) ✅

- [x] `volunteer_tokens` table for magic links
- [x] Token generation on reminder send
- [x] `/volunteer/manage/[token]` page
- [x] View all signups for phone number
- [x] Cancel signup with optional reason
- [x] Contact coordinator display

### Phase 3: Enhanced Keywords ✅

- [x] STATUS keyword (list all signups in SMS)
- [x] Smart reply detection and routing

### Phase 4: Coordinator Tools ✅

- [x] Replies inbox in admin UI
- [x] Cancellation alerts/notifications to coordinator

### Phase 5: Optional Confirmation ✅

- [x] YES/CONFIRM keyword handling (confirms all upcoming signups)
- [x] Confirmation tracking in admin (confirmed count in stats)
- [x] Confirmation status display (badge in self-service portal)
- [x] Web-based confirmation via self-service portal

---

## API Endpoints

### New Endpoints Needed

| Method | Path                                               | Description             |
| ------ | -------------------------------------------------- | ----------------------- |
| GET    | `/api/volunteer/manage/[token]`                    | Get signups for token   |
| POST   | `/api/volunteer/manage/[token]/confirm/[signupId]` | Confirm a signup        |
| POST   | `/api/volunteer/manage/[token]/cancel/[signupId]`  | Cancel a signup         |
| GET    | `/api/admin/sms-replies`                           | Get all replies (admin) |
| POST   | `/api/admin/sms-replies/[id]/read`                 | Mark reply as read      |

### Updated Endpoints

| Method | Path                        | Change                               |
| ------ | --------------------------- | ------------------------------------ |
| POST   | `/api/admin/reminders/send` | Include self-service URL in message  |
| POST   | `/api/webhooks/sms-reply`   | Handle all keywords, generate tokens |

---

## Security Considerations

1. **Token Expiration**: 7 days, regenerate on each SMS sent
2. **Rate Limiting**: Max 10 requests per token per minute
3. **No PII in URL**: Token is opaque, doesn't contain phone/name
4. **Audit Log**: Track all self-service actions
5. **HTTPS Only**: All self-service URLs must be HTTPS

---

## Cost Considerations

- **Textbelt**: $0.05 per SMS (outbound), replies are free via webhook
- **Estimated cost per volunteer**: ~$0.10-0.15 (reminder + possible auto-reply)
- **Self-service portal**: No SMS cost (web-based)

---

## Open Questions

1. Should we support multiple languages?
2. Should cancelled signups notify other volunteers on waitlist?
3. Should we integrate with calendar apps (Google Calendar, Apple Calendar)?
4. Should we support voice calls for critical notifications?

---

## References

- TCPA Compliance: https://www.alive5.com/understanding-tcpa-compliance-for-sms-texting
- Messaging UX Patterns: https://www.myshyft.com/blog/messaging-interaction-patterns/
- Textbelt API: https://textbelt.com/
