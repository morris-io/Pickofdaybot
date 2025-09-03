// pages/404.js

import Link from 'next/link'
import Layout from '../components/Layout'

export default function Custom404() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-16">
        <h1 className="text-6xl font-extrabold text-blue-700 mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-8">
          Oops! The page you’re looking for doesn’t exist.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition"
        >
          Go back home
        </Link>
      </div>
    </Layout>
  )
}
