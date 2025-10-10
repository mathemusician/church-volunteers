# Multi-Tenant Organization System - Phased Implementation

## Overview

Transform the single-tenant volunteer system into a multi-organization platform where each church/group has its own workspace with invite-based admin management.

---

## Phase 1: Basic Organization Structure (30-45 min)

**Goal**: Add organization concept, auto-create org on first use, scope data to orgs

### 1.1 Database Setup

- [x] Create migration 007 (already done)
- [ ] Run migration on Neon database
- [ ] Create seed script for default organization

### 1.2 Organization Model

- [ ] Create `src/lib/models/organization.ts`
  - Functions: `createOrganization()`, `getOrganizationBySlug()`, `getUserOrganizations()`
- [ ] Create `src/lib/models/organizationMember.ts`
  - Functions: `addMember()`, `getMemberRole()`, `getOrgMembers()`

### 1.3 Session Enhancement

- [ ] Update auth to include organization context
- [ ] Add helper: `getCurrentOrganization()` from session
- [ ] Add helper: `getUserRole()` in current org

### 1.4 Auto-Create Organization

- [ ] Create `/api/onboarding/setup-org` endpoint
- [ ] On first login, check if user has org
- [ ] If not, show org creation modal
- [ ] Create org + add user as owner

### 1.5 Scope Existing Features

- [ ] Update ALL event queries to filter by `organization_id`
- [ ] Update event creation to include `organization_id`
- [ ] Update list queries (inherited from events)
- [ ] Test: Ensure data isolation works

**Deliverable**: Single-org per user, auto-created on first login, all data scoped

---

## Phase 2: Invite & Member Management (45-60 min)

**Goal**: Invite other admins via email, manage team members

### 2.1 Invite System API

- [ ] Create `/api/admin/invites/send` - Send invite email
- [ ] Create `/api/admin/invites/list` - List pending invites
- [ ] Create `/api/admin/invites/revoke` - Cancel invite
- [ ] Create `/api/invites/accept/[token]` - Accept invite link
- [ ] Create `/api/invites/decline/[token]` - Decline invite

### 2.2 Email Integration

- [ ] Choose email provider (Resend, SendGrid, AWS SES)
- [ ] Add email template for invites
- [ ] Environment variables for email config
- [ ] Test email sending

### 2.3 Invite Token System

- [ ] Generate secure invite tokens (JWT or UUID)
- [ ] Store token in `organization_members` table
- [ ] Set expiration (7 days)
- [ ] Handle token validation

### 2.4 Member Management UI

- [ ] Create `/admin/members` page
- [ ] Show current members list with roles
- [ ] Show pending invites
- [ ] Invite form (email + role selector)
- [ ] Remove member button (with confirmation)
- [ ] Change role dropdown

### 2.5 Accept Invite Flow

- [ ] Create `/invites/accept/[token]` page
- [ ] Show organization info
- [ ] Accept/Decline buttons
- [ ] On accept: Update status, set joined_at
- [ ] Redirect to org dashboard

### 2.6 Permissions Check

- [ ] Middleware: Check if user is member of org
- [ ] Role-based guards: Owner/Admin can invite
- [ ] Block non-members from accessing org data

**Deliverable**: Full invite system, member management, role-based access

---

## Phase 3: Multi-Org Support (45-60 min)

**Goal**: Users can belong to multiple organizations and switch between them

### 3.1 Organization Switcher

- [ ] Add org switcher dropdown in nav
- [ ] List all orgs user belongs to
- [ ] Switch org (update session/context)
- [ ] Show current org name in header

### 3.2 Session Improvements

- [ ] Store `current_organization_id` in session
- [ ] Allow switching without re-auth
- [ ] Remember last selected org per user

### 3.3 URL-Based Organization Context

- [ ] Optional: Use `/org/[slug]/admin/...` URLs
- [ ] Parse org from URL in middleware
- [ ] Auto-switch to correct org from URL

### 3.4 Join Multiple Orgs

- [ ] User can accept invites to multiple orgs
- [ ] User sees all their orgs
- [ ] Each org has independent data

**Deliverable**: Users can manage multiple churches/groups

---

## Phase 4: Organization Settings (30 min)

**Goal**: Per-organization customization

### 4.1 Organization Settings Page

- [ ] Create `/admin/settings` page
- [ ] Edit org name
- [ ] Edit org slug (check uniqueness)
- [ ] Edit description
- [ ] Danger zone: Delete organization (owner only)

### 4.2 Public Branding (Optional)

- [ ] Org logo upload
- [ ] Org color scheme
- [ ] Custom domain support (advanced)

**Deliverable**: Each org can customize their workspace

---

## Phase 5: Public Page Enhancement (15 min)

**Goal**: Public volunteer pages work seamlessly

### 5.1 Update Public Routes

- [ ] Public signup pages work without auth
- [ ] Fetch event by slug across all orgs (public)
- [ ] Or use `/org/[slug]/signup/[event]` format

### 5.2 Public Org Pages

- [ ] Optional: `/org/[slug]` - Public org page
- [ ] List upcoming events
- [ ] Org description

**Deliverable**: Public pages work for any organization

---

## Database Schema Summary

```sql
organizations
  - id, name, slug, description, created_at, updated_at

organization_members
  - id, organization_id, user_email, user_name, role
  - invited_by, invited_at, joined_at, status

volunteer_events (updated)
  - ... existing fields ...
  - organization_id (NEW)
```

---

## File Structure

```
New Files:
├── src/lib/models/
│   ├── organization.ts
│   └── organizationMember.ts
├── src/app/api/admin/
│   ├── invites/
│   │   ├── send/route.ts
│   │   ├── list/route.ts
│   │   └── revoke/route.ts
│   └── members/route.ts
├── src/app/invites/accept/[token]/page.tsx
├── src/app/admin/
│   ├── members/page.tsx
│   └── settings/page.tsx
├── src/components/
│   ├── OrgSwitcher.tsx
│   └── InviteMemberModal.tsx
└── src/server/db/migrations/
    └── 007_add_organizations.sql

Modified Files:
├── src/middleware.ts (add org context)
├── src/auth.ts (session with org)
├── src/app/api/admin/events/route.ts (add org filter)
├── src/app/api/admin/lists/route.ts (inherit org from event)
└── All admin pages (use org context)
```

---

## Testing Checklist

### Phase 1

- [ ] New user auto-creates organization
- [ ] All events scoped to organization
- [ ] Cannot see other org's events

### Phase 2

- [ ] Send invite email
- [ ] Accept invite joins org
- [ ] Invited user can manage events
- [ ] Remove member works

### Phase 3

- [ ] User in 2 orgs sees both
- [ ] Switching org shows correct events
- [ ] No data leakage between orgs

---

## Environment Variables Needed

```bash
# Email Provider (Phase 2)
EMAIL_PROVIDER=resend  # or sendgrid, ses
EMAIL_API_KEY=your-key-here
EMAIL_FROM=noreply@yourchurch.com

# App URL
NEXT_PUBLIC_APP_URL=https://yourapp.com

# Existing
AUTH_SECRET=...
AUTH_ZITADEL_ID=...
DATABASE_URL=...
```

---

## Migration Strategy for Existing Data

```sql
-- Run after migration 007
-- Create a default organization for existing data
INSERT INTO organizations (name, slug, description)
VALUES ('My Church', 'my-church', 'Default organization')
RETURNING id;

-- Assign all existing events to default org
UPDATE volunteer_events
SET organization_id = [org_id_from_above]
WHERE organization_id IS NULL;

-- Add current admin as owner
INSERT INTO organization_members
  (organization_id, user_email, role, status, joined_at)
VALUES
  ([org_id], 'your-email@example.com', 'owner', 'active', NOW());
```

---

## Estimated Timeline

| Phase     | Duration       | Complexity   |
| --------- | -------------- | ------------ |
| Phase 1   | 30-45 min      | Medium       |
| Phase 2   | 45-60 min      | High (email) |
| Phase 3   | 45-60 min      | Medium       |
| Phase 4   | 30 min         | Low          |
| Phase 5   | 15 min         | Low          |
| **Total** | **~3-4 hours** |              |

---

## Next Steps

1. **Review this roadmap** - Adjust phases based on priorities
2. **Choose Phase 1 or Phase 2 first** - Both are valuable starts
3. **Set up email provider** - Required for Phase 2 (Resend is easiest)
4. **Run migration** - When ready to begin
5. **Implement phase by phase** - Test thoroughly between phases

---

## Questions to Decide

1. **Email provider?** Resend (easiest), SendGrid, AWS SES, or custom SMTP?
2. **URL structure?** `/org/[slug]/...` or stay with `/admin/...`?
3. **Start with which phase?** Phase 1 (data scoping) or Phase 2 (invites)?
4. **Existing data?** What org name/slug for migration?

---

**Ready to start?** Let me know which phase to begin with! 🚀
