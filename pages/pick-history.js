// pages/pick-history.js
import styled from 'styled-components'
import Layout from '../components/Layout'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import clientPromise from '../lib/mongodb'
import { useEffect, useState } from 'react'

const Wrap = styled.div`
  min-height: calc(100vh - 160px);
  padding: auto 1rem;
  background: #f9fafb;
`

const Header = styled.div`
  max-width: 980px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`

const Title = styled.h1`
  font-size: 1.75rem;
  color: #111827;
  margin: 0;
`

const Summary = styled.div`
  max-width: 980px;
  margin: 0.25rem auto 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: .5rem;

  @media (min-width: 720px) {
    grid-template-columns: auto auto auto;
    align-items: center;
  }
`

const SummaryPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: .75rem;
  padding: .5rem .75rem;
  color: #111827;
  font-weight: 600;
`

// --- UPDATED CONTROLS STYLES ---
const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between; /* This is the key */
  align-items: center;
  width: 100%;
`

const FilterGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const Controls = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`

const Select = styled.select`
  display: inline-flex;
  padding: 0.6rem 0.60rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.95rem;
`

const CheckboxLabel = styled.label`
  display: inline-flex;
  padding: 0.35rem 0rem;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.95rem;
  color: #374151;
`

const Button = styled.button`
  display: inline-flex;
  background: #111827;
  color: white;
  border: 0;
  border-radius: 0.5rem;
  padding: 0.7rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #0b0f1a; }
`

const Secondary = styled(Link)`
  display: inline-flex;
  background: #111827;
  color: white;
  border-radius: 0.5rem;
  padding: 0.5rem .9rem;
  text-decoration: none;
  font-weight: 500;
  &:hover { background: #0b0f1a; }
`

const List = styled.div`
  max-width: 980px;
  margin: 0 auto;
  display: grid;
  gap: 0.75rem;
`

const Card = styled.div`
  display: block;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem 1.1rem;
  color: inherit;
  text-decoration: none;
  transition: transform .15s, box-shadow .15s;
  &:box-shadow: 0 8px 16px rgba(0,0,0,.06); }
  cursor: pointer;
`

const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
`

const Algo = styled.span`
  font-size: .85rem;
  font-weight: 700;
  color: #4f46e5;
  text-transform: uppercase;
  letter-spacing: .02em;
`

const ResultBadge = styled.span`
  font-size: .75rem;
  font-weight: 700;
  padding: .25rem .5rem;
  border-radius: .5rem;
  letter-spacing: .02em;
  color: #0b1020;
  ${({ $variant }) => {
    if ($variant === 'win')   return 'background:#bbf7d0;border:1px solid #86efac;'
    if ($variant === 'loss')  return 'background:#fecaca;border:1px solid #fca5a5;'
    if ($variant === 'push')  return 'background:#fee2e2;border:1px solid #fecaca;'
    return 'background:#e5e7eb;border:1px solid #d1d5db; color:#374151;'
  }}
`

const Teams = styled.div`
  font-weight: 600;
  color: #111827;
`

const Muted = styled.div`
  font-size: .9rem;
  color: #6b7280;
`

const Italic = styled.div`
  font-size: .9rem;
  color: #4b5563;
  font-style: italic;
  margin-top: .25rem;
`

const Pager = styled.div`
  max-width: 980px;
  margin: 1rem auto 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6b7280;
`

/* ---------- Simulator styles ---------- */
const SimWrap = styled.div`
  margin-top: .5rem;
  border: 1px solid #e5e7eb;
  border-radius: .5rem;
  background: #fafafa;
  overflow: hidden; /* keep within card */
`

const SimHeader = styled.button`
  width: 100%;
  text-align: left;
  background: #f3f4f6;
  border: 0;
  padding: .5rem .75rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`

const SimBody = styled.div`
  padding: .6rem .75rem;
  border-top: 1px solid #e5e7eb;
  max-width: 100%;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 56px repeat(9, minmax(16px, 1fr)) 56px;
  gap: .25rem;
  align-items: center;
  overflow-x: auto; /* safe scroll if narrow screens */
`

const Cell = styled.div`
  font-size: .8rem;
  text-align: center;
  white-space: nowrap;
`

const TeamLabel = styled.div`
  font-size: .85rem;
  font-weight: 600;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
`

const RunBtn = styled.button`
  margin-top: .5rem;
  background: #4f46e5;
  color: #fff;
  border: 0;
  border-radius: .5rem;
  padding: .45rem .75rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #4338ca; }
`

const Note = styled.div`
  font-size: .75rem;
  color: #6b7280;
  margin-top: .25rem;
`

// --- Helpers ---
function fmtEST(isoOrDate) {
  if (!isoOrDate) return 'TBD'
  const d = new Date(isoOrDate)
  if (isNaN(d)) return 'TBD'
  return (
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: 'numeric',
      hour12: true,
    }).format(d) + ' EST'
  )
}

function useQuerySync(defaults) {
  const router = useRouter()
  const [state, setState] = useState(() => {
    const q = router.query || {}
    return {
      algo: (q.algo ?? defaults.algo),
      days: String(q.days ?? defaults.days),
      includeUpcoming: (q.includeUpcoming ?? defaults.includeUpcoming) === 'true',
      page: Number(q.page ?? defaults.page),
      pageSize: Number(q.pageSize ?? defaults.pageSize),
    }
  })
  useEffect(() => {
    const q = router.query || {}
    setState(s => ({
      ...s,
      algo: (q.algo ?? s.algo),
      days: String(q.days ?? s.days),
      includeUpcoming: (q.includeUpcoming ?? String(s.includeUpcoming)) === 'true',
      page: Number(q.page ?? s.page),
      pageSize: Number(q.pageSize ?? s.pageSize),
    }))
  }, [router.query])
  return [state, (next) => setState(next)]
}

function normResult(val) {
  if (!val) return 'pending'
  const v = String(val).toLowerCase()
  if (v === 'win' || v === 'won') return 'win'
  if (v === 'loss' || v === 'lost') return 'loss'
  if (v === 'push' || v === 'tie') return 'push'
  if (v === 'pending' || v === 'tbd' || v === 'null') return 'pending'
  return 'pending'
}

/* ---------- Simulator logic ---------- */
function winProbFromStars(stars) {
  switch (Number(stars)) {
    case 1: return 0.60
    case 2: return 0.70
    case 3: return 0.78
    case 4: return 0.85
    case 5: return 0.90
    default: return 0.50
  }
}

function parseTeamsPair(teams) {
  const [away, home] = (teams || '').split(' vs ').map(s => (s || '').trim())
  return { away: away || 'Away', home: home || 'Home' }
}

function parsePickTeam(pick) {
  if (!pick) return null
  return pick
    .replace(/\s*Game\s*\d+\s*/i, '')
    .replace(/\s*ML\s*/i, '')
    .trim()
}

function inferPickSide(teams, pickTeam) {
  const { away, home } = parseTeamsPair(teams)
  if (!pickTeam) return { pickIsAway: null, pickTeam, oppTeam: null }
  const low = s => (s || '').toLowerCase()
  const p = low(pickTeam)
  const isAway = p && (low(away).includes(p) || p.includes(low(away)))
  const isHome = p && (low(home).includes(p) || p.includes(low(home)))
  if (isAway) return { pickIsAway: true, pickTeam: away, oppTeam: home }
  if (isHome) return { pickIsAway: false, pickTeam: home, oppTeam: away }
  return { pickIsAway: null, pickTeam, oppTeam: (isAway || isHome) ? null : (away === pickTeam ? home : away) }
}

function randRuns(base = 0.25) {
  const r = Math.random()
  if (r < base) return 0
  if (r < base + 0.55) return 1
  if (r < base + 0.85) return 2
  return Math.random() < 0.85 ? 0 : 3
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms))
}

function Simulator({ teams, pick, starRating }) {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState([])
  const [tot, setTot] = useState({ away: 0, home: 0 })
  const [running, setRunning] = useState(false)
  const [finalText, setFinalText] = useState('')

  const pTeam = parsePickTeam(pick)
  const { away, home } = parseTeamsPair(teams)
  const { pickIsAway, pickTeam, oppTeam } = inferPickSide(teams, pTeam)
  const prob = winProbFromStars(starRating)

  async function run() {
    setRunning(true)
    setLog([])
    setTot({ away: 0, home: 0 })
    setFinalText('')

    const pickWins = Math.random() < prob
    const winnerSide = pickIsAway == null
      ? (pickWins ? 'away' : 'home')
      : (pickWins ? (pickIsAway ? 'away' : 'home') : (pickIsAway ? 'home' : 'away'))

    let a = 0, h = 0

    for (let i = 1; i <= 9; i++) {
      let ar = randRuns(0.35)
      let hr = randRuns(0.35)

      if (i === 9) {
        const wantPickSide = winnerSide
        const curPick = (wantPickSide === 'away') ? a : h
        const curOpp  = (wantPickSide === 'away') ? h : a
        if (curPick + (wantPickSide === 'away' ? ar : hr) <= curOpp + (wantPickSide === 'away' ? hr : ar)) {
          if (wantPickSide === 'away') ar += 1
          else hr += 1
        }
      }

      a += ar
      h += hr

      setLog(prev => [...prev, { inning: i, away: ar, home: hr }])
      setTot({ away: a, home: h })
      await sleep(350)
    }

    const final = `${away} ${a} — ${home} ${h}`
    setFinalText(final)
    setRunning(false)
  }

  return (
    <SimWrap onClick={(e) => { e.stopPropagation() }}>
      <SimHeader
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        aria-expanded={open}
      >
        <span>Simulator</span> <span>{open ? '▾' : '▸'}</span>
      </SimHeader>

      {open && (
        <SimBody onClick={(e) => e.stopPropagation()}>
          <Grid>
            <Cell></Cell>
            {[1,2,3,4,5,6,7,8,9].map(n => <Cell key={n}>{n}</Cell>)}
            <Cell><strong>T</strong></Cell>

            <TeamLabel title={away}>{away}</TeamLabel>
            {[1,2,3,4,5,6,7,8,9].map(n => {
              const row = log.find(r => r.inning === n)
              return <Cell key={`a-${n}`}>{row ? row.away : '—'}</Cell>
            })}
            <Cell><strong>{tot.away}</strong></Cell>

            <TeamLabel title={home}>{home}</TeamLabel>
            {[1,2,3,4,5,6,7,8,9].map(n => {
              const row = log.find(r => r.inning === n)
              return <Cell key={`h-${n}`}>{row ? row.home : '—'}</Cell>
            })}
            <Cell><strong>{tot.home}</strong></Cell>
          </Grid>

          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '.5rem' }}>
            <RunBtn
              type="button"
              disabled={running}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); run() }}
            >
              {running ? 'Simulating…' : 'Simulate'}
            </RunBtn>
            <Note>
              {pickTeam ? `Pick: ${pickTeam} • ` : ''}Win chance ≈ {Math.round(prob*100)}%
              {finalText ? ` • Final: ${finalText}` : ''}
            </Note>
          </div>
        </SimBody>
      )}
    </SimWrap>
  )
}

/* ---------- Page component ---------- */
export default function PickHistory({ session, rows, total, page, pageSize, algo, days, includeUpcoming, stats }) {
  const router = useRouter()
  const [controls, setControls] = useQuerySync({ algo, days, includeUpcoming, page, pageSize })

  function applyFilters(e) {
    e.preventDefault()
    const q = new URLSearchParams({
      algo: controls.algo,
      days: String(controls.days),
      includeUpcoming: String(controls.includeUpcoming),
      page: '1',
      pageSize: String(controls.pageSize),
    })
    router.push(`/pick-history?${q.toString()}`)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  const wins = stats?.wins ?? 0
  const losses = stats?.losses ?? 0
  const pushes = stats?.pushes ?? 0
  const finished = wins + losses + pushes
  const successRate = finished > 0 ? Math.round((wins / (wins + losses)) * 100) : 0

  return (
    <Layout>
      <Wrap>
        <Header>
          <Title>Pick History</Title>
          <Controls as="div"> {/* Use as="div" to avoid nested forms */}
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={controls.includeUpcoming}
                  onChange={e => setControls(s => ({ ...s, includeUpcoming: e.target.checked }))}
                />
                Include upcoming
              </CheckboxLabel>
          </Controls>
        </Header>

        <Header>
          <ControlsContainer>
              <FilterGroup as="form" onSubmit={applyFilters}>
                  <Select
                      value={controls.algo}
                      onChange={e => setControls(s => ({ ...s, algo: e.target.value }))}
                      aria-label="Algorithm"
                  >
                      <option value="all">All Algorithms</option>
                      <option value="whip">WHIP</option>
                      <option value="series">Series</option>
                  </Select>

                  <Select
                      value={controls.days}
                      onChange={e => setControls(s => ({ ...s, days: e.target.value }))}
                      aria-label="Lookback"
                  >
                      <option value="7">Last 7 days</option>
                      <option value="14">Last 14 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="60">Last 60 days</option>
                  </Select>
              </FilterGroup>
              <Button type="button" onClick={applyFilters}>Apply</Button>
          </ControlsContainer>
        </Header>

        {/* Success summary */}
        <Summary>
          <SummaryPill>
            Record:&nbsp;{wins}–{losses}{pushes ? `–${pushes}` : ''} {pushes ? '(pushes included)' : ''}
          </SummaryPill>
          <SummaryPill>
            Success Rate:&nbsp;{successRate}% {finished ? `(${wins} of ${wins + losses})` : ''}
          </SummaryPill>
        </Summary>

        <List>
          {rows.length === 0 ? (
            <Muted>No picks found for this range.</Muted>
          ) : rows.map(p => {
              const r = normResult(p.result)
              return (
                <Card key={p._id}>
                  <RowTop>
                    <Left>
                      <Algo>{(p.algorithm || 'algo').toUpperCase()}</Algo>
                      <ResultBadge $variant={r}>
                        {r === 'win' ? 'WIN' : r === 'loss' ? 'LOSS' : r === 'push' ? 'PUSH' : 'PENDING'}
                      </ResultBadge>
                    </Left>
                    <Muted>{fmtEST(p.gameTime)}</Muted>
                  </RowTop>

                  <Teams>{p.teams}</Teams>

                  <Muted>
                    {p.pick ? <>Pick: <strong>{p.pick}</strong></> : null}
                    {p.pick ? ' • ' : ''}
                    {p.starRating != null ? <>{p.starRating}/5 ⭐</> : null}
                    {p.starRating != null ? ' ' : ''}
                  </Muted>

                  {p.finalScore ? (
                    <Muted style={{ marginTop: '.25rem' }}>
                      Final: {p.finalScore}
                    </Muted>
                  ) : null}

                  {p.rationale ? <Italic>{p.rationale}</Italic> : null}

                  <Simulator teams={p.teams} pick={p.pick} starRating={p.starRating} />
                </Card>
              )
            })}
        </List>

        <Pager>
          <div>
            Page {page} of {totalPages} • {total} total
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <Link
              href={{
                pathname: '/pick-history',
                query: { algo, days, includeUpcoming, pageSize, page: String(page - 1) }
              }}
              style={{ pointerEvents: hasPrev ? 'auto' : 'none', opacity: hasPrev ? 1 : 0.5 }}
            >
              ‹ Prev
            </Link>
            <Link
              href={{
                pathname: '/pick-history',
                query: { algo, days, includeUpcoming, pageSize, page: String(page + 1) }
              }}
              style={{ pointerEvents: hasNext ? 'auto' : 'none', opacity: hasNext ? 1 : 0.5 }}
            >
              Next ›
            </Link>
          </div>
        </Pager>
      </Wrap>
    </Layout>
  )
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session) return { redirect: { destination: '/login', permanent: false } }

  const role = session.user?.role || 'user'
  const isAdmin = role === 'admin'
  const isSubscribed = isAdmin ? true : (session.user?.isSubscribed ?? false)

  const q = ctx.query || {}
  const algo = (q.algo || 'all').toString()
  const days = Math.max(1, parseInt(q.days || '30', 10))
  const includeUpcoming = (q.includeUpcoming || 'false') === 'true'
  const page = Math.max(1, parseInt(q.page || '1', 10))
  const pageSize = Math.min(50, Math.max(5, parseInt(q.pageSize || '10', 10)))

  const now = new Date()
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const client = await clientPromise
  const col = client.db().collection('picks')

  const matchBase = { createdAt: { $gte: since } }
  if (algo !== 'all') matchBase.algorithm = algo

  const pipeline = [
    { $match: matchBase },
    {
      $addFields: {
        gameTimeDate: {
          $cond: [
            { $eq: [{ $type: "$gameTime" }, "date"] },
            "$gameTime",
            {
              $cond: [
                { $eq: [{ $type: "$gameTime" }, "string"] },
                { $dateFromString: { dateString: "$gameTime", onError: null, onNull: null } },
                null
              ]
            }
          ]
        }
      }
    },
    ...(includeUpcoming ? [] : [{ $match: { gameTimeDate: { $lt: now } } }]),
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              sport: 1, teams: 1, pick: 1, rationale: 1,
              gameTime: "$gameTimeDate", algorithm: 1, starRating: 1, createdAt: 1,
              result: { $ifNull: ["$result", null] },
              finalScore: { $ifNull: ["$finalScore", null] },
              winnerTeam: { $ifNull: ["$winnerTeam", null] },
            }
          }
        ],
        total: [{ $count: "n" }],
        stats: [
          {
            $group: {
              _id: null,
              wins: {
                $sum: {
                  $cond: [
                    { $in: [{ $toLower: { $ifNull: ["$result", ""] } }, ["win", "won"]] },
                    1, 0
                  ]
                }
              },
              losses: {
                $sum: {
                  $cond: [
                    { $in: [{ $toLower: { $ifNull: ["$result", ""] } }, ["loss", "lost"]] },
                    1, 0
                  ]
                }
              },
              pushes: {
                $sum: {
                  $cond: [
                    { $in: [{ $toLower: { $ifNull: ["$result", ""] } }, ["push", "tie"]] },
                    1, 0
                  ]
                }
              },
              pending: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$result", null] },
                        { $in: [{ $toLower: { $ifNull: ["$result", ""] } }, ["pending", "tbd", ""]] }
                      ]
                    },
                    1, 0
                  ]
                }
              }
            }
          },
          { $project: { _id: 0, wins: 1, losses: 1, pushes: 1, pending: 1 } }
        ]
      }
    }
  ]

  const agg = await col.aggregate(pipeline).toArray()
  const rowsAgg = agg[0]?.rows ?? []
  const total = agg[0]?.total?.[0]?.n ?? 0
  const statsAgg = agg[0]?.stats?.[0] ?? { wins: 0, losses: 0, pushes: 0, pending: 0 }

  const rows = rowsAgg.map(d => ({
    _id: d._id.toString(),
    sport: d.sport ?? 'MLB',
    teams: d.teams ?? '',
    pick: d.pick ?? null,
    rationale: d.rationale ?? null,
    gameTime: d.gameTime ? new Date(d.gameTime).toISOString() : null,
    algorithm: d.algorithm ?? null,
    starRating: d.starRating ?? null,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    result: d.result ?? null,
    finalScore: d.finalScore ?? null,
    winnerTeam: d.winnerTeam ?? null,
  }))

  const safeSession = {
    ...session,
    user: { ...session.user, image: session.user?.image ?? null, role, isSubscribed }
  }

  return {
    props: {
      session: safeSession,
      rows,
      total,
      page,
      pageSize,
      algo,
      days,
      includeUpcoming,
      stats: {
        wins: Number(statsAgg.wins || 0),
        losses: Number(statsAgg.losses || 0),
        pushes: Number(statsAgg.pushes || 0),
        pending: Number(statsAgg.pending || 0),
      }
    }
  }
}