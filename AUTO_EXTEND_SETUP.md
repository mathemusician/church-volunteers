# Auto-Extend Events Setup

The auto-extend feature automatically creates next week's event 7 days after the original event date.

## How It Works

1. **Mark an event** with "Auto-extend weekly" checkbox
2. **7 days later**, the cron job runs and creates next week's event
3. **New event is created** with:
   - Same lists (empty signups)
   - Date set to +7 days
   - Auto-extend still enabled (continues indefinitely)

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

1. **Add to `vercel.json`**:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-extend-events",
      "schedule": "0 0 * * *"
    }
  ]
}
```

2. **Set environment variable** in Vercel:

```bash
CRON_SECRET=your-random-secret-key-here
```

3. **Deploy** - Vercel will automatically run the cron daily at midnight UTC

### Option 2: GitHub Actions

1. **Create `.github/workflows/auto-extend.yml`**:

```yaml
name: Auto-Extend Events

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  auto-extend:
    runs-on: ubuntu-latest
    steps:
      - name: Call auto-extend endpoint
        run: |
          curl -X GET https://your-domain.com/api/cron/auto-extend-events \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

2. **Add secret** in GitHub repo settings:
   - Name: `CRON_SECRET`
   - Value: Your random secret key

### Option 3: External Cron Service (e.g., cron-job.org, EasyCron)

1. **Set up cron job** to call:

```
GET https://your-domain.com/api/cron/auto-extend-events
Header: Authorization: Bearer YOUR_CRON_SECRET
```

2. **Schedule**: Daily (or every 6 hours for more frequent checks)

### Option 4: Manual Testing (Development)

Call the endpoint manually:

```bash
curl -X GET http://localhost:3000/api/cron/auto-extend-events \
  -H "Authorization: Bearer your-secret-here"
```

## Environment Variables

Add to your `.env.local`:

```bash
# Optional: Protect cron endpoint with a secret
CRON_SECRET=your-random-secret-key-here
```

If not set, the endpoint is publicly accessible (consider this for production).

## Example Workflow

1. **Sunday, Jan 5, 2025**:
   - Create event: "Sunday Service - Jan 5"
   - Enable "Auto-extend weekly"
   - Add lists: Greeters, Ushers, A/V

2. **Sunday, Jan 12, 2025** (7 days later):
   - Cron runs at midnight
   - New event created: "Sunday Service - Jan 12"
   - Same lists copied (empty signups)
   - Auto-extend still enabled

3. **Sunday, Jan 19, 2025** (7 more days):
   - Process repeats automatically
   - Continues indefinitely until you disable auto-extend

## Disabling Auto-Extend

To stop auto-generation:

1. Edit the event
2. Uncheck "Auto-extend weekly"
3. Save

The event stops generating new weeks, but existing future events remain.

## Monitoring

Check cron execution:

- Response includes count of extended events
- Logs show which events were auto-extended
- Events appear in admin panel automatically

## Security Notes

- Use `CRON_SECRET` in production to prevent unauthorized triggers
- Consider rate limiting the endpoint
- Monitor for duplicate event creation
