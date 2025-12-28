import twilio from 'twilio';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../apps/web/.env.local');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length) {
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  });
} catch (error) {
  console.error('Error loading .env.local:', error.message);
  process.exit(1);
}

// Validate required env vars
const required = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_MESSAGING_SERVICE_SID'
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  console.error('Make sure they are set in apps/web/.env.local');
  process.exit(1);
}

// Create Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Get phone number from command line or prompt
const testPhone = process.argv[2];

if (!testPhone) {
  console.error('❌ Please provide your phone number as an argument');
  console.error('Usage: node scripts/test-sms.mjs +15551234567');
  process.exit(1);
}

console.log('📱 Sending test SMS...');
console.log(`To: ${testPhone}`);

client.messages
  .create({
    body: 'Test from Church Volunteers! Reply STOP to unsubscribe.',
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    to: testPhone
  })
  .then(message => {
    console.log('✅ SMS sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('\nCheck your phone! You should receive the message shortly.');
    console.log('\nNext steps:');
    console.log('1. Reply STOP to test opt-out');
    console.log('2. Run this script again - it should fail with error 21610 (opted out)');
    console.log('3. Reply START to opt back in');
  })
  .catch(error => {
    console.error('❌ Failed to send SMS');
    console.error('Error:', error.message);
    console.error('\nCommon issues:');
    console.error('- Check your phone number format (must include +1)');
    console.error('- Verify your Twilio credentials in .env.local');
    console.error('- Make sure your Messaging Service has a phone number added');
    process.exit(1);
  });
