# Template Workflow Guide

## Overview

This guide explains how to work with event templates and change their days of the week (e.g., creating a Saturday Service from a Sunday Service template).

## How Templates Work

### Template Basics

- **Templates** are event blueprints with `is_template = true`
- They have a `begin_date` that determines:
  - What day of the week the button displays (e.g., "Generate Sundays")
  - The starting point if no instances exist yet
- Once instances exist, new generations use the **latest instance date + 7 days**

### Button Text Logic

The "Generate [Day]s" button text is determined by:

1. **For templates without instances**: Uses template's `begin_date`
2. **For templates with instances**: Uses the first instance's `event_date`

## Creating a Template for a Different Day

### Scenario: Create Saturday Service from Sunday Service

**Option 1: Duplicate and Modify**

1. Click "Duplicate" on your Sunday Service template
2. Click "Edit" on the new template
3. Change the `Begin Date` to a Saturday
4. Change the title to "Regular Saturday Service"
5. Save
6. The button will now show "Generate Saturdays"

**Option 2: Create New Template**

1. Click "+ New Event"
2. Check "This is a template" checkbox
3. Set title: "Regular Saturday Service"
4. Set `Begin Date` to any Saturday
5. Add volunteer lists (or duplicate from existing template)
6. Save

### Important Notes

#### Changing Existing Template Dates

- **Safe to change** if you haven't generated instances yet
- **If instances already exist**:
  - Changing template `begin_date` only affects the button text
  - New instances will continue from the **latest instance date + 7 days**
  - To switch days: Delete existing instances first, then change template date

#### Template Independence

- Sunday and Saturday templates are completely independent
- Each tracks its own instances
- Generate from each separately based on your needs

## Example Workflows

### Weekly Sunday and Saturday Services

1. **Create Sunday Template**
   - Title: "Regular Sunday Service"
   - Begin Date: Any Sunday (e.g., 2025-11-16)
   - Add volunteer lists

2. **Create Saturday Template**
   - Duplicate Sunday template OR create new
   - Title: "Regular Saturday Service"
   - Begin Date: Any Saturday (e.g., 2025-11-15)
   - Volunteer lists copied automatically if duplicated

3. **Generate Events**
   - Click "Generate Sundays" on Sunday template → generates N Sundays
   - Click "Generate Saturdays" on Saturday template → generates N Saturdays
   - Each maintains its own weekly sequence

## Troubleshooting

### Button Shows Wrong Day

**Problem**: Template date is Sunday but button says "Generate Saturdays"

**Causes**:

1. Date timezone parsing issue (now fixed)
2. Template `begin_date` is actually Saturday - verify with:
   ```bash
   node scripts/check-dates.mjs
   ```

**Solution**: Edit template and set `begin_date` to the correct day

### Generated Events Are Wrong Day

**Problem**: Clicking "Generate Saturdays" but events are created on Sundays

**Cause**: Existing instances are Sundays, system uses latest instance + 7 days

**Solution**:

1. Delete all existing instances
2. Verify template `begin_date` is correct
3. Generate new instances

### Can't Change Template Day

**Problem**: Want to switch from Sunday to Saturday but keeps generating Sundays

**Solution**:

1. Check if instances exist (expand template in sidebar)
2. If yes: Delete all instances first
3. Then change template `begin_date`
4. Generate new instances

## Technical Details

### Date Parsing

The system now correctly parses dates in local timezone to prevent day-shifting:

- Extracts YYYY-MM-DD from date strings
- Parses as local date: `new Date(year, month - 1, day)`
- Prevents timezone conversion errors

### Generation Logic

Located in `/apps/web/src/app/api/admin/generate-weekly/route.ts`:

```typescript
// Find latest existing instance
const latestEventResult = await query(
  'SELECT event_date FROM volunteer_events
   WHERE template_id = $1
   ORDER BY event_date DESC LIMIT 1'
);

// Start date logic
if (latestEventResult.rows.length > 0) {
  // Use latest instance + 7 days
  startDate = new Date(latestEventResult.rows[0].event_date);
  startDate.setDate(startDate.getDate() + 7);
} else {
  // Use template's begin_date
  startDate = new Date(template.begin_date);
}
```

## Best Practices

1. **Use descriptive template names** - Include day of week in title
2. **Set correct begin_date** - Matches your intended day
3. **Separate templates for different days** - Don't reuse same template
4. **Check before generating** - Verify button shows correct day
5. **Audit with check-dates script** - Run `node scripts/check-dates.mjs` to see all events and their days
