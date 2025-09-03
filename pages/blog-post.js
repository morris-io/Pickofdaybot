import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function BlogPost() {
  const router = useRouter();
  const { id } = router.query;

  const posts = {
    'how-we-built-our-algorithm': {
      title: 'How We Built Our Sports Betting Algorithm',
      date: 'July 10, 2025',
      content: `We combined years of betting data, team analytics, injury reports, and line movement data into a single machine-learning model. The result is a system that identifies mispriced lines and value opportunities with a historical edge.`,
    },
    '3-mistakes-most-bettors-make': {
      title: '3 Mistakes Most Sports Bettors Make',
      date: 'July 7, 2025',
      content: `1. Chasing losses. 2. Betting emotionally. 3. Ignoring closing line value. Learn how to avoid these to boost your long-term results.`,
    },
  };

  const post = posts[id] || null;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 px-6 py-12 max-w-3xl mx-auto">
        {post ? (
          <>
            <p className="text-sm text-gray-500 mb-2">{post.date}</p>
            <h1 className="text-4xl font-bold text-blue-700 mb-6">{post.title}</h1>
            <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
          </>
        ) : (
          <p className="text-gray-600">Loading article...</p>
        )}
      </div>
    </Layout>
  );
}
