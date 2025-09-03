// pages/api/ai/ask-pick.js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// --- lightweight helpers ---
function americanToImpliedProb(american) {
  if (american == null) return null;
  const n = typeof american === 'string' ? parseInt(american.replace(/[^\d-+]/g, ''), 10) : american;
  if (!Number.isFinite(n) || n === 0) return null;
  return n > 0 ? (100 / (n + 100)) : (Math.abs(n) / (Math.abs(n) + 100));
}
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function pct(n) { return `${Math.round(n * 100)}%`; }

const HAVE_LLM = !!process.env.LLM_PROVIDER_API_URL && !!process.env.LLM_API_KEY;

function confidenceToProbRange(conf) {
  const c = (conf || '').toLowerCase();
  if (c.includes('whip') || c.includes('high')) return [0.72, 0.82];
  if (c.includes('med') || c.includes('moderate')) return [0.56, 0.66];
  if (c.includes('low')) return [0.48, 0.54];
  return [0.52, 0.60];
}

function pickSideFromText(teamsText, pickText) {
  if (!pickText) return null;
  const side = pickText.split(/\s+/)[0];
  return side?.length > 1 ? side : null;
}

// --- Fallback generator with variety (used when no LLM or LLM error) ---
function variedFallback({ side, implied, lo, hi, message }) {
  // tiny jitter so repeated calls don’t look identical
  const jitter = (Math.random() * 0.02) - 0.01; // ±1%
  const proj = clamp01((lo + hi) / 2 + jitter);

  const openers = [
    `${side} projects around ${pct(proj)}.`,
    `Projection lands near ${pct(proj)} for ${side}.`,
    `Modeled range centers around ${pct(proj)} on ${side}.`,
    `Baseline projection for ${side} is ~${pct(proj)}.`,
  ];
  const edges = implied == null
    ? [
        `That’s within our expected band given current market conditions.`,
        `This sits comfortably in today’s range for the matchup.`,
        `It’s a reasonable edge given the matchup context.`,
      ]
    : [
        `That’s ${Math.round((proj - implied) * 100)}% ${proj >= implied ? 'above' : 'below'} implied (~${pct(implied)}).`,
        `Relative to implied (~${pct(implied)}), the edge is ${Math.round((proj - implied) * 100)}%.`,
        `Versus implied (~${pct(implied)}), differential is ${Math.round((proj - implied) * 100)}%.`,
      ];

  const riskNotes = [
    `Keep stakes sensible; variance still applies.`,
    `As always, size bets responsibly.`,
    `Recommendation: moderate staking discipline.`,
    `Edge noted, but avoid overexposure.`,
  ];

  // crude intent parsing to vary the shape based on the question
  const q = (message || '').toLowerCase();
  let intentTail = '';
  if (q.includes('risk') || q.includes('confiden')) {
    intentTail = ` Risk read: ${proj > 0.65 ? 'elevated confidence' : proj > 0.57 ? 'solid but not bulletproof' : 'cautious'}; news can shift price late.`;
  } else if (q.includes('odds') || q.includes('implied') || q.includes('value') || q.includes('price')) {
    intentTail = implied == null
      ? ` Price context not available yet; once odds post, reassess the differential.`
      : ` Given the current price context, this qualifies as ${proj - implied > 0.04 ? 'clear value' : proj - implied > 0.015 ? 'marginal value' : 'thin value'}.`;
  } else if (q.includes('parlay')) {
    intentTail = ` Parlay impact: projection helps floor, but correlations and juice can erode EV — single‑leg sizing is safer.`;
  } else if (q.includes('why') || q.includes('because') || q.includes('explain')) {
    intentTail = ` Drivers: aggregated signals and situational context; proprietary details intentionally withheld.`;
  } else {
    intentTail = ` Projection is range‑based; methodology is proprietary.`;
  }

  const opener = openers[Math.floor(Math.random() * openers.length)];
  const edge = edges[Math.floor(Math.random() * edges.length)];
  const risk = riskNotes[Math.floor(Math.random() * riskNotes.length)];

  return `${opener} ${edge} ${risk}${intentTail}`;
}

async function callLLM(prompt) {
  const res = await fetch(process.env.LLM_PROVIDER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
`You are a concise sports betting assistant.
RULES:
- Do NOT reveal algorithms, features, weights, equations, or data sources.
- Speak in 2–4 sentences max, vary wording naturally.
- Focus on projected win range vs implied odds, risk tone, and practical guidance.
- No step-by-step reasoning or internals.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,        // adds healthy variation
      top_p: 0.9,
      presence_penalty: 0.4,   // nudges variety
      frequency_penalty: 0.3
    })
  });
  if (!res.ok) throw new Error(`LLM error: ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const { pickId, message } = req.body || {};
    if (!pickId) return res.status(400).json({ error: 'pickId is required' });

    // (Optional) enforce subscription here too if you store it on the session/user
    // e.g., check a session cookie/JWT; left out for brevity since your page already gates UI.

    const db = (await clientPromise).db();
    const pick = await db.collection('picks').findOne({ _id: new ObjectId(pickId) });
    if (!pick) return res.status(404).json({ error: 'Pick not found' });

    const implied = americanToImpliedProb(pick.odds);
    const [lo, hi] = confidenceToProbRange(pick.confidence);
    const side = pickSideFromText(pick.teams, pick.pick) || pick.pick || 'This side';

    const facts = [
      `Sport: ${pick.sport}`,
      `Matchup: ${pick.teams}`,
      `Our side: ${side}`,
      `Listed odds: ${pick.odds ?? 'TBD'}`,
      `Implied probability: ${implied != null ? pct(implied) : 'n/a'}`,
      `Projected probability (range): ~${pct(lo)}–${pct(hi)}`,
      `Confidence label: ${pick.confidence ?? '—'}`,
      `Rationale (high-level): ${pick.rationale ?? '—'}`,
      message ? `User asked: ${message}` : null
    ].filter(Boolean).join('\n');

    let reply;

    if (HAVE_LLM) {
      const prompt =
`Using the facts below, answer the user's question about this pick.
- Emphasize projected win range vs implied odds (if odds exist).
- Include a brief risk tone and one practical note. Vary your language each time.
- Do not reveal any methodology or sources.

FACTS:
${facts}`;
      try {
        reply = await callLLM(prompt);
      } catch (e) {
        // fall back to varied template if LLM call fails
        reply = variedFallback({ side, implied, lo, hi, message });
      }
    } else {
      reply = variedFallback({ side, implied, lo, hi, message });
    }

    await db.collection('pick_qna').insertOne({
      pickId: pick._id,
      askedAt: new Date(),
      message: message ?? null,
      reply,
    });

    // prevent caches from serving same body
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, reply });
  } catch (err) {
    console.error('ask-pick error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
