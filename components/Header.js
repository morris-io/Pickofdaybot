// components/Header.js
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-700">PoD Bot</Link>
        <nav className="space-x-6">
          <Link href="/login" className="text-gray-600 hover:text-blue-700 font-medium">Login</Link>
          <Link href="/register" className="text-gray-600 hover:text-blue-700 font-medium">Sign Up</Link>
        </nav>
      </div>
    </header>
  );
}
