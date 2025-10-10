# Volunteer Signup System

A public volunteer signup board where anyone can add/remove their name from volunteer lists.

## Features

- ✅ **Public Access** - No login required to view or sign up
- ✅ **URL-Based Events** - Each event has its own URL (e.g., `/signup/sunday-jan-2025`)
- ✅ **Anonymous Signups** - Anyone can add their name to unlocked lists
- ✅ **Self-Service** - Anyone can remove their own signup
- ✅ **Admin Control** - Only admins can create/edit/delete lists
- ✅ **List Locking** - Admins can lock lists to prevent public changes
- ✅ **Slot Limits** - Set maximum signups per list
- ✅ **Mobile Responsive** - Works great on all devices

## Database Schema

The system uses 4 tables:

1. **volunteer_events** - Events (e.g., "Sunday Service - January 2025")
2. **volunteer_lists** - Lists within events (e.g., "Greeters", "Ushers")
3. **volunteer_signups** - Individual signups
4. **volunteer_profiles** - Private contact info (future feature)

## Setup

### 1. Run Database Migration

```bash
psql $DATABASE_URL -f apps/web/src/server/db/migrations/002_volunteer_signups.sql
```

### 2. Create an Event (Admin Only)

```bash
POST /api/admin/events
{
  "slug": "sunday-jan-2025",
  "title": "Sunday Service - January 2025",
  "description": "Volunteer opportunities for January",
  "is_active": true
}
```

### 3. Create Lists (Admin Only)

```bash
POST /api/admin/lists
{
  "eventId": 1,
  "title": "Greeters",
  "description": "Welcome people at the entrance",
  "max_slots": 4,
  "is_locked": false
}
```

### 4. Share Public URL

Share the public URL with volunteers:

```
https://your-domain.com/signup/sunday-jan-2025
```

## API Endpoints

### Public Endpoints (No Auth Required)

#### GET /api/signup/[slug]

Get event and all its lists with signups.

**Response:**

```json
{
  "event": {
    "id": 1,
    "slug": "sunday-jan-2025",
    "title": "Sunday Service - January 2025",
    "description": "..."
  },
  "lists": [
    {
      "id": 1,
      "title": "Greeters",
      "max_slots": 4,
      "is_locked": false,
      "signup_count": 2,
      "is_full": false,
      "signups": [
        { "id": 1, "name": "John Doe", "position": 0 },
        { "id": 2, "name": "Jane Smith", "position": 1 }
      ]
    }
  ]
}
```

#### POST /api/signup/add

Add a person to a list.

**Body:**

```json
{
  "listId": 1,
  "name": "John Doe"
}
```

**Errors:**

- 403: List is locked
- 400: List is full

#### DELETE /api/signup/remove

Remove a signup.

**Body:**

```json
{
  "signupId": 1
}
```

**Errors:**

- 403: List is locked
- 404: Signup not found

### Admin Endpoints (Auth Required)

#### GET /api/admin/events

Get all events.

#### POST /api/admin/events

Create a new event.

**Body:**

```json
{
  "slug": "easter-2025",
  "title": "Easter Service 2025",
  "description": "Easter volunteer opportunities",
  "is_active": true
}
```

#### POST /api/admin/lists

Create a new list.

**Body:**

```json
{
  "eventId": 1,
  "title": "Parking Team",
  "description": "Direct parking",
  "max_slots": 6,
  "is_locked": false
}
```

#### PATCH /api/admin/lists

Update a list.

**Body:**

```json
{
  "id": 1,
  "title": "Updated Title",
  "max_slots": 8,
  "is_locked": true
}
```

#### DELETE /api/admin/lists

Delete a list (and all its signups).

**Body:**

```json
{
  "id": 1
}
```

## Usage Examples

### Example 1: Sunday Service Volunteers

Create an event for each month:

- `/signup/sunday-jan-2025`
- `/signup/sunday-feb-2025`

Lists for each event:

- Greeters (max 4 slots)
- Ushers (max 6 slots)
- A/V Team (max 2 slots, locked)
- Kids Ministry (max 8 slots)

### Example 2: Special Events

Create events for special occasions:

- `/signup/easter-2025`
- `/signup/christmas-2024`
- `/signup/vbs-summer-2025`

### Example 3: Multiple Services

Create separate events per service:

- `/signup/sunday-8am`
- `/signup/sunday-10am`
- `/signup/sunday-6pm`

## Admin Interface

Access the admin interface at:

```
https://your-domain.com/admin/volunteer-manager
```

Features:

- Create and manage events
- Create volunteer lists
- Set slot limits
- Lock/unlock lists
- View all signups

## Future Enhancements

- [ ] Email notifications for new signups
- [ ] Volunteer profiles with availability/skills
- [ ] Export signups to CSV
- [ ] Recurring events
- [ ] SMS reminders
- [ ] Volunteer history tracking
- [ ] Auto-fill from previous signups

## Security

- ✅ Public pages don't require authentication
- ✅ Admin routes protected by Auth.js v5
- ✅ List locking prevents unauthorized edits
- ✅ SQL injection prevention via parameterized queries
- ✅ CSRF protection via NextAuth
- ✅ Input validation on all endpoints
