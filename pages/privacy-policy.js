import Layout from '../components/Layout';

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 px-6 py-12 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">Privacy Policy</h1>

        <p className="text-gray-700 mb-4">
          Your privacy is important to us. This Privacy Policy outlines how YourCapper collects, uses, and protects your personal data.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Data We Collect</h2>
        <p className="text-gray-700 mb-4">
          We collect your name, email address, and payment information when you sign up. We also log usage data such as pages visited and IP address.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">2. How We Use Your Data</h2>
        <p className="text-gray-700 mb-4">
          Your data is used to provide our services, improve our platform, and communicate updates. We do not sell your data to third parties.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Cookies</h2>
        <p className="text-gray-700 mb-4">
          We use cookies to analyze traffic and remember user preferences. You can disable cookies in your browser settings.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">4. Your Rights</h2>
        <p className="text-gray-700 mb-4">
          You can request access to, or deletion of, your data at any time. Contact us at support@yourcapper.com for requests.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">5. Data Security</h2>
        <p className="text-gray-700 mb-4">
          We use encryption and secure storage practices to protect your data. However, no method is 100% secure.
        </p>

        <p className="text-sm text-gray-500 mt-8">Last updated: July 21, 2025</p>
      </div>
    </Layout>
  );
}
