// Quick test script for Textbelt SMS
// Usage: node scripts/test-textbelt.mjs +15551234567
// Requires TEXTBELT_API_KEY environment variable

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const phone = process.argv[2];
const apiKey = process.env.TEXTBELT_API_KEY;

if (!apiKey) {
  console.log('❌ TEXTBELT_API_KEY not found in apps/web/.env.local');
  process.exit(1);
}

if (!phone) {
  console.log('Usage: node scripts/test-textbelt.mjs +15551234567');
  console.log('Replace with your actual phone number');
  process.exit(1);
}

console.log(`Sending test SMS to ${phone}...`);

const response = await fetch('https://textbelt.com/text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    phone: phone,
    message: 'Test from Church Volunteers! SMS notifications are working.',
    key: apiKey,
  }),
});

const result = await response.json();

if (result.success) {
  console.log('✅ SMS sent successfully!');
  console.log('Quota remaining:', result.quotaRemaining);
} else {
  console.log('❌ SMS failed:', result.error);
}
