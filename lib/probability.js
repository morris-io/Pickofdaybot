// lib/probability.js
export function americanToImpliedProb(american) {
    if (american == null) return null;
    const n = typeof american === 'string' ? parseInt(american.replace(/[^\d-+]/g, ''), 10) : american;
    if (!Number.isFinite(n) || n === 0) return null;
    return n > 0 ? (100 / (n + 100)) : (Math.abs(n) / (Math.abs(n) + 100));
  }
  
  export function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }
  
  export function formatPct(p) {
    if (p == null) return '—';
    return `${Math.round(p * 100)}%`;
  }
  