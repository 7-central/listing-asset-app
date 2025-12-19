export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="bg-white shadow rounded-lg p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-700">
              This application ("Listing Asset App") is an internal tool operated by Lakeway Workshop / Tier8.
              This privacy policy explains how we handle data when you use this application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Data Collection</h2>
            <p className="text-gray-700 mb-2">
              This application is for internal business use only. We collect and process:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Product information from our WooCommerce store</li>
              <li>Generated listing content and social media posts</li>
              <li>Facebook Page access tokens for posting to our business page</li>
              <li>Airtable records for data storage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Data</h2>
            <p className="text-gray-700 mb-2">
              Data is used exclusively for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Generating product listing content using AI</li>
              <li>Creating social media posts for our Facebook Business Page</li>
              <li>Calculating pricing and shipping costs</li>
              <li>Storing generated content in our Airtable database</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
            <p className="text-gray-700">
              This is an internal tool for Lakeway Workshop / Tier8 employees only. We do not share,
              sell, or distribute any data to third parties. Data is only transmitted to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mt-2">
              <li>Anthropic (Claude AI) for content generation</li>
              <li>Airtable for data storage</li>
              <li>WooCommerce API for product information</li>
              <li>Facebook Graph API for posting to our business page</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
            <p className="text-gray-700">
              All API keys and access tokens are stored securely as environment variables.
              Data transmission occurs over HTTPS encrypted connections. Access to this application
              is restricted to authorized Lakeway Workshop / Tier8 personnel only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p className="text-gray-700">
              Generated content is stored in Airtable for business record-keeping purposes.
              We retain this data as long as it is needed for our business operations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Facebook Integration</h2>
            <p className="text-gray-700">
              This application posts content to our Lakeway Workshop Facebook Business Page.
              We only post to our own page and do not access or post to any user's personal Facebook profile.
              The app uses Facebook Graph API v24.0 with appropriate Page permissions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. User Rights</h2>
            <p className="text-gray-700">
              As this is an internal business tool, all users are Lakeway Workshop / Tier8 employees.
              If you have questions about data stored in this system, please contact your supervisor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time. Any changes will be reflected on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Information</h2>
            <p className="text-gray-700">
              For questions about this privacy policy or how we handle data, please contact:<br />
              <strong>Lakeway Workshop / Tier8</strong><br />
              Email: info@lakewayworkshop.co.uk
            </p>
          </section>

          <footer className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last Updated: December 19, 2025
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
