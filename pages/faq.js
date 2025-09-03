import Layout from '../components/Layout';

export default function FAQ() {
  const faqs = [
    {
      question: "How are picks generated?",
      answer: "Our proprietary algorithm analyzes trends, injuries, odds movement, and historical data to find the highest-value bets for each day.",
    },
    {
      question: "What sports do you cover?",
      answer: "We currently cover NBA, NFL, MLB, and NHL. More leagues are coming soon.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes. You can cancel from your account settings and your access will remain active until the end of the billing period.",
    },
    {
      question: "Are your picks guaranteed to win?",
      answer: "No betting system can guarantee wins. We use historical data and probability to give you the best edge possible, but all betting carries risk.",
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 px-6 py-12 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-8">Frequently Asked Questions</h1>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white shadow p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{faq.question}</h2>
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
