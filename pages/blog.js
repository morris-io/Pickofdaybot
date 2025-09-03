import Link from 'next/link';
import Layout from '../components/Layout';

export default function Blog() {
  const posts = [
    {
      id: 'how-we-built-our-algorithm',
      title: 'How We Built Our Sports Betting Algorithm',
      preview: 'A behind-the-scenes look at how we use data to find betting edges...',
      date: 'July 10, 2025',
    },
    {
      id: '3-mistakes-most-bettors-make',
      title: '3 Mistakes Most Sports Bettors Make',
      preview: 'Avoid these common errors that cost bettors money over time...',
      date: 'July 7, 2025',
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-10">The YourCapper Blog</h1>

        <div className="space-y-8">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 shadow rounded-lg hover:shadow-md transition">
              <p className="text-sm text-gray-500 mb-1">{post.date}</p>
              <h2 className="text-2xl font-semibold text-blue-800 mb-2">{post.title}</h2>
              <p className="text-gray-700 mb-4">{post.preview}</p>
              <Link
                href={`/blog-post?id=${post.id}`}
                className="text-blue-700 font-medium hover:underline"
              >
                Read More →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
