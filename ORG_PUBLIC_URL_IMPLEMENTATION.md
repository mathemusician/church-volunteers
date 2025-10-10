# Organization Public URLs - Implementation Plan

## Goal

Change public volunteer signup URLs from:

- ❌ Old: `/signup/sunday-service-jan-5`
- ✅ New: `/signup/{org-public-id}/sunday-service-jan-5`

Where `org-public-id` is a random 12-character hash like `abc123def456`

## Benefits

1. ✅ **Security**: Can't reverse engineer organization IDs
2. ✅ **Multi-tenant**: Each org has unique URLs
3. ✅ **SEO-friendly**: Shorter than full org name
4. ✅ **Future-proof**: Ready for multi-org support

---

## Completed Steps

### 1. Database Migration ✅

**File**: `008_add_org_public_id.sql`

- Added `public_id VARCHAR(12) UNIQUE` to `organizations`
- Auto-generates 12-char hex IDs for existing orgs
- Indexed for fast lookups

### 2. Organization Model ✅

**File**: `lib/models/organization.ts`

- Added `public_id` to `Organization` interface
- Created `generatePublicId()` function
- Updated `createOrganization()` to generate public_id
- Added `getOrganizationByPublicId()` lookup function

---

## Remaining Steps

### 3. Run Migration

```bash
psql "postgresql://..." -f src/server/db/migrations/008_add_org_public_id.sql
```

### 4. Update orgContext Helper

**File**: `lib/orgContext.ts`

- Add `organizationPublicId` to `OrgContext` interface
- Return public_id in `getCurrentOrgContext()`

### 5. Update EventDetails Component

**File**: `components/EventDetails.tsx`

- Pass `orgPublicId` as prop
- Show URL as: `{origin}/signup/{orgPublicId}/{event.slug}`

### 6. Update Main Page

**File**: `page.tsx`

- Get `orgPublicId` from `orgContext`
- Pass to `<EventDetails orgPublicId={...} />`

### 7. Create New Public Signup Route

**New File**: `app/signup/[orgId]/[slug]/page.tsx`

- Lookup org by `orgId` (public_id)
- Lookup event by `slug` and `organization_id`
- Show signup form

### 8. Keep Old Route for Backwards Compatibility

**File**: `app/signup/[slug]/page.tsx`

- Add deprecation notice
- Redirect to new URL format
- Or keep working for single-org deployments

---

## Example URL Flow

### Admin Creates Event

1. Event created: `"Sunday Service - Jan 5"`
2. Slug: `"sunday-service-jan-5"`
3. Org public_id: `"a1b2c3d4e5f6"`

### Public URL Generated

```
https://yourchurch.com/signup/a1b2c3d4e5f6/sunday-service-jan-5
```

### URL Parsing

1. Extract `orgId` = `"a1b2c3d4e5f6"`
2. Lookup organization by `public_id`
3. Extract `slug` = `"sunday-service-jan-5"`
4. Lookup event by `slug` + `organization_id`
5. Show signup page

---

## Security Considerations

### Why This Works

- ✅ Public IDs are random (can't enumerate)
- ✅ No sequential IDs exposed
- ✅ Short enough to share easily
- ✅ Unique across all orgs

### What's Protected

- Organization internal ID (never exposed)
- Organization structure/count
- Event IDs

### What's Still Public

- Organization name (in admin UI, not URL)
- Event slugs (intentionally public)
- Signup data (intentionally public)

---

## Testing Plan

1. **New Org Creation**
   - Create org → Check `public_id` generated
   - Verify uniqueness

2. **URL Generation**
   - Select event → Check URL format
   - Copy URL → Verify it's new format

3. **Public Access**
   - Open URL in incognito → Loads correct event
   - Try wrong `orgId` → 404 error
   - Try wrong `slug` → 404 error

4. **Backwards Compatibility**
   - Old URLs redirect or show deprecation notice

---

## Migration Notes

### For Existing Deployments

1. Run migration 008
2. Existing orgs get random public_ids
3. Old URLs still work (backwards compat)
4. New events use new URL format
5. Gradually migrate users to new URLs

### Breaking Changes

- None if keeping old route active
- Admin UI shows new URLs immediately

---

## Next Steps

**Ready to proceed?** I can:

1. Continue implementing steps 4-8
2. Run the migration for you
3. Test the full flow

Let me know and I'll complete the implementation!
