import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function CreatePick() {
  const [form, setForm] = useState({
    sport: '',
    teams: '',
    pick: '',
    odds: '',
    confidence: '',
    rationale: '',
    gameTime: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/picks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 px-6 py-12 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">Create New Pick</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 shadow rounded-lg">
          <input
            name="sport"
            placeholder="Sport (e.g. NBA)"
            value={form.sport}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="teams"
            placeholder="Teams (e.g. Lakers vs Warriors)"
            value={form.teams}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="pick"
            placeholder="Pick (e.g. Lakers -2.5)"
            value={form.pick}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="odds"
            placeholder="Odds (e.g. -110)"
            value={form.odds}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="confidence"
            placeholder="Confidence Level (e.g. High)"
            value={form.confidence}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="gameTime"
            placeholder="Game Time (e.g. 7:30 PM EST)"
            value={form.gameTime}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            name="rationale"
            placeholder="Rationale"
            value={form.rationale}
            onChange={handleChange}
            rows={4}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
          >
            {submitting ? 'Submitting...' : 'Create Pick'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
