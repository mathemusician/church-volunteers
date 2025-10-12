export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Acceptance of Terms</h2>
            <p>
              By accessing and using Volunteers (&quot;the Service&quot;), you accept and agree to
              be bound by the terms and conditions of this agreement. If you do not agree to these
              terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Description of Service</h2>
            <p>
              Volunteers provides a platform for organizations to manage volunteer events,
              schedules, and signups. The Service allows users to create events, manage volunteer
              lists, and coordinate volunteer participation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">User Accounts</h2>
            <p className="mb-2">When creating an account, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
              <li>Not share your account with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe on the rights of others</li>
              <li>Upload malicious code or viruses</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use the Service to spam or harass others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Content Ownership</h2>
            <p>
              You retain ownership of any content you create or upload to the Service. By using the
              Service, you grant us a license to use, store, and display your content as necessary
              to provide the Service to you and your organization members.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Organization Responsibilities
            </h2>
            <p className="mb-2">Organization administrators are responsible for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Managing member access and permissions</li>
              <li>Ensuring compliance with applicable laws and regulations</li>
              <li>The accuracy of event information and volunteer data</li>
              <li>Respecting volunteer privacy and consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Service Availability</h2>
            <p>
              We strive to provide reliable service but do not guarantee uninterrupted access. We
              may temporarily suspend the Service for maintenance, updates, or other reasons without
              prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. We are not
              liable for any damages arising from your use of the Service, including but not limited
              to data loss, service interruptions, or any other issues.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account at any time for violations
              of these terms. You may also terminate your account at any time through the account
              settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to Terms</h2>
            <p>
              We may modify these terms at any time. Continued use of the Service after changes
              constitutes acceptance of the modified terms. We will notify users of significant
              changes via email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws,
              without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:{' '}
              <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-700">
                support@example.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <a href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
