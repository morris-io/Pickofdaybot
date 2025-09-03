import Layout from '../components/Layout';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';

export default function Admin() {
  const stats = {
    users: 532,
    activeSubscribers: 294,
    picksPostedToday: 3,
    totalRevenue: "$9,840",
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-700 mb-8">Admin Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded shadow">
              <p className="text-sm text-gray-500">Total Users</p>
              <h2 className="text-2xl font-bold text-blue-700">{stats.users}</h2>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <p className="text-sm text-gray-500">Active Subscribers</p>
              <h2 className="text-2xl font-bold text-green-600">{stats.activeSubscribers}</h2>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <p className="text-sm text-gray-500">Today's Picks</p>
              <h2 className="text-2xl font-bold text-purple-600">{stats.picksPostedToday}</h2>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <h2 className="text-2xl font-bold text-yellow-500">{stats.totalRevenue}</h2>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/admin/create-pick">
                <button className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition w-full">
                  Create New Pick
                </button>
              </Link>
              <button className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition w-full">
                View All Users
              </button>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition w-full">
                See Billing Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  if (session.user.role !== 'admin') {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }

  return { props: {} };
}
