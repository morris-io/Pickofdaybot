import Layout from '../components/Layout';

export default function TermsOfService() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 px-6 py-12 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">Terms of Service</h1>

        <p className="text-gray-700 mb-4">
          These Terms of Service govern your use of the YourCapper platform. By accessing or using our website and services, you agree to these terms.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Use of the Service</h2>
        <p className="text-gray-700 mb-4">
          You may not use the service for any unlawful purpose. You must be at least 18 years old to use our platform. Picks and content are for informational purposes only.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">2. Subscriptions</h2>
        <p className="text-gray-700 mb-4">
          Your subscription will automatically renew unless you cancel before the next billing cycle. You can cancel at any time via your account settings.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Disclaimers</h2>
        <p className="text-gray-700 mb-4">
          We do not guarantee any specific betting results. All content is for educational and entertainment purposes only.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">4. Changes to Terms</h2>
        <p className="text-gray-700 mb-4">
          We reserve the right to update these terms at any time. Updates will be posted to this page and your continued use indicates acceptance.
        </p>

        <p className="text-sm text-gray-500 mt-8">Last updated: July 21, 2025</p>
      </div>
    </Layout>
  );
}
