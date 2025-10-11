# Automatic Event Generation from Templates

## Overview

The system automatically generates weekly events from active templates using a cron job.

## How It Works

1. **Daily Cron Job**: Runs every day at 2:00 AM UTC
2. **Template Scanning**: Finds all active templates (`is_template = true`, `is_active = true`)
3. **Event Generation**: Creates events for the next 4 weeks based on each template's day of week
4. **Duplicate Prevention**: Checks if events already exist before creating new ones
5. **List Copying**: Automatically copies all volunteer lists from the template to new events

## Setup

### On Vercel (Recommended)

1. The cron job is configured in `vercel.json`:

   ```json
   {
     "crons": [
       {
         "path": "/api/cron/auto-extend-events",
         "schedule": "0 2 * * *"
       }
     ]
   }
   ```

2. **(Optional but Recommended)** Add a secret token for security:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add: `CRON_SECRET` = `your-random-secret-token`
   - The cron endpoint will check for this token in the Authorization header

3. Deploy to Vercel - the cron job will start automatically

### Manual Testing

You can manually trigger the cron job to test it:

```bash
# Without auth (if CRON_SECRET not set)
curl https://your-domain.vercel.app/api/cron/auto-extend-events

# With auth token
curl -H "Authorization: Bearer your-secret-token" \
  https://your-domain.vercel.app/api/cron/auto-extend-events
```

### Alternative: GitHub Actions

If not using Vercel, you can set up a GitHub Action:

```yaml
# .github/workflows/cron-generate-events.yml
name: Generate Weekly Events
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  generate-events:
    runs-on: ubuntu-latest
    steps:
      - name: Call cron endpoint
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.vercel.app/api/cron/auto-extend-events
```

## Template Configuration

For templates to work correctly:

1. **Create a Template**: Set `is_template = true` when creating an event
2. **Set Begin Date**: The `begin_date` determines which day of the week events will be created (e.g., Sunday, Monday, etc.)
3. **Keep Active**: Ensure `is_active = true` for automatic generation
4. **Add Lists**: Any volunteer lists added to the template will be copied to generated events

## What Gets Generated

For each active template, the system:

- ✅ Creates events for the next 4 weeks
- ✅ Uses the template's day of week from `begin_date`
- ✅ Generates unique slugs and titles with dates
- ✅ Copies all volunteer lists from the template
- ✅ Links new events to their template via `template_id`
- ✅ Prevents duplicates by checking existing events

## Monitoring

Check the cron job logs in your Vercel dashboard:

1. Go to your project
2. Click "Deployments"
3. Click on a deployment
4. View "Functions" tab
5. Look for `/api/cron/auto-extend-events` logs

The endpoint returns a JSON response with details about generated events:

```json
{
  "message": "Generated 3 event(s) from templates",
  "generated": [
    {
      "template": "Sunday Service",
      "new": "Sunday Service - Oct 20",
      "date": "2025-10-20"
    }
  ],
  "timestamp": "2025-10-11T02:00:00.000Z"
}
```
