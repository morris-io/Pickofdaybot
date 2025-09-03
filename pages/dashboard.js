// pages/dashboard.js
import { useRouter }        from 'next/router'
import { getServerSession } from 'next-auth'
import { authOptions }      from './api/auth/[...nextauth]'
import clientPromise        from '../lib/mongodb'
import Layout               from '../components/Layout'
import styled               from 'styled-components'
import Link                 from 'next/link'
import { useState }         from 'react'

// --- Styled components ---
const PageWrapper = styled.div`
  min-height: calc(100vh - 160px);
  padding: 2rem 1rem;
  background: #f9fafb;
`

const Hero = styled.section`
  max-width: 700px;
  margin: 0 auto 2rem;
  text-align: center;
`

const HeroTitle = styled.h1`
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 0.75rem;
`

const HeroText = styled.p`
  font-size: 1.05rem;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
`

const Buttons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
`

const Button = styled.button`
  background: #4f46e5;
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.65rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #4338ca; }
`

/** Anchor styled as a button, wrapped with <Link> */
const LinkButton = styled.a`
  display: inline-block;
  background: #111827;
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.65rem 1.25rem;
  border-radius: 0.5rem;
  text-decoration: none;
  &:hover { background: #0b0f1a; }
`

const PicksGrid = styled.div`
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

// Match the Pick History card styling (non-clickable)
const Card = styled.div`
  display: block;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover { transform: translateY(-1px); box-shadow: 0 8px 16px rgba(0,0,0,.06); }
  cursor: pointer;
`

const Sport = styled.h2`
  font-size: 1.1rem;
  color: #4f46e5;
  margin-bottom: 0.35rem;
`

const Teams = styled.p`
  font-size: 1rem;
  color: #374151;
  margin-bottom: 0.5rem;
`

const Info = styled.p`
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.35rem;
`

/* ---------- Simulator styles (copied from pick-history) ---------- */
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

// --- Helper: start of "today" in EST ---
function startOfTodayEST() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const y = parts.find(p => p.type === 'year')?.value
  const m = parts.find(p => p.type === 'month')?.value
  const d = parts.find(p => p.type === 'day')?.value
  const estString = `${y}-${m}-${d}T00:00:00`
  return new Date(new Date(estString).toLocaleString('en-US', { timeZone: 'America/New_York' }))
}

// --- Helper to format ISO → EST ---
function fmtEST(dateVal) {
  if (!dateVal) return 'TBD'
  const d = new Date(dateVal)
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

/* ---------- Simulator logic (copied from pick-history) ---------- */
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
  // Expect "Away Team vs Home Team"
  const [away, home] = (teams || '').split(' vs ').map(s => (s || '').trim())
  return { away: away || 'Away', home: home || 'Home' }
}

function parsePickTeam(pick) {
  if (!pick) return null
  // strip trailing variants: "ML", "Game 3 ML"
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
  // fallback: assume pickTeam is as-is, opponent unknown
  return { pickIsAway: null, pickTeam, oppTeam: (isAway || isHome) ? null : (away === pickTeam ? home : away) }
}

function randRuns(base = 0.25) {
  // small, baseball-like distribution 0–2 most of the time; occasional 3
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
  const [log, setLog] = useState([]) // [{inning, away, home}]
  const [tot, setTot] = useState({ away: 0, home: 0 })
  const [running, setRunning] = useState(false)
  const [finalText, setFinalText] = useState('')

  const pTeam = parsePickTeam(pick)
  const { away, home } = parseTeamsPair(teams)
  const { pickIsAway, pickTeam } = inferPickSide(teams, pTeam)
  const prob = winProbFromStars(starRating)

  async function run() {
    setRunning(true)
    setLog([])
    setTot({ away: 0, home: 0 })
    setFinalText('')

    // Decide winner from probability
    const pickWins = Math.random() < prob
    const winnerSide = pickIsAway == null
      ? (pickWins ? 'away' : 'home')
      : (pickWins ? (pickIsAway ? 'away' : 'home') : (pickIsAway ? 'home' : 'away'))

    let a = 0, h = 0

    for (let i = 1; i <= 9; i++) {
      // generate provisional runs
      let ar = randRuns(0.35)
      let hr = randRuns(0.35)

      // on the 9th, nudge to desired outcome if close
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
      await sleep(350) // animate inning-by-inning
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
export default function Dashboard({ session = {}, isSubscribed = false, picks = [] }) {
  const router = useRouter()
  const name   = session.user?.name ?? 'Guest'

  // 🔁 NEW: go straight to Stripe Checkout (removes the intermediate /subscribe page)
  const handleStartTrial = async () => {
    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create checkout session')
      const { url } = await res.json()
      if (!url) throw new Error('Checkout URL missing')
      router.push(url)
    } catch (err) {
      console.error(err)
      // Fallback: if something goes wrong, you can route to a billing help page or toast
      alert('Unable to start checkout right now. Please try again in a moment.')
    }
  }

  if (!isSubscribed) {
    return (
      <Layout>
        <PageWrapper>
          <Hero>
            <HeroTitle>Unlock your Edge</HeroTitle>
            <HeroText>
              Designed to find large statistical disparities and their odds value through
              simulations of relevant outcomes in real time. Our algorithms have maintained a
              success rate of 72.2% this month.
            </HeroText>
            <Buttons>
              <Button onClick={handleStartTrial}>
                Start Your 7-Day Free Trial
              </Button>
              <Link href="/pick-history" passHref legacyBehavior>
                <LinkButton>View Pick History</LinkButton>
              </Link>
            </Buttons>
          </Hero>
        </PageWrapper>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageWrapper>
        <Hero>
          <HeroTitle>Todays Forecast</HeroTitle>
          <HeroText>Here are your picks for today.</HeroText>
        </Hero>

        {picks.length === 0 ? (
          <>
            <Hero>
              <HeroText>No upcoming picks for today yet. Check back soon.</HeroText>
            </Hero>
            {/* Always show Pick History for subscribed users */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link href="/pick-history" passHref legacyBehavior>
                <LinkButton>Pick History</LinkButton>
              </Link>
            </div>
          </>
        ) : (
          <>
            <PicksGrid>
              {picks.map(p => (
                // Non-clickable card (no link to pick-detail)
                <Card key={p._id}>
                  <Sport>{p.sport}{p.algorithm ? ` • ${p.algorithm.toUpperCase()}` : ''}</Sport>
                  <Teams>{p.teams}</Teams>
                  {p.pick && <Info>Pick: <strong>{p.pick}</strong></Info>}
                  {p.confidence && <Info>Confidence: {p.confidence}</Info>}
                  {p.starRating != null && <Info>Rating: {p.starRating}/5 ⭐</Info>}
                  <Info>Time: {fmtEST(p.gameTime)}</Info>
                  

                  {/* Simulator ONLY for subscribed/admin users & when picks exist — we're already in that state */}
                  <Simulator teams={p.teams} pick={p.pick} starRating={p.starRating} />
                  {p.rationale && (
                    <Info style={{ fontStyle: 'italic', marginTop: '0.35rem' }}>
                      {p.rationale}
                    </Info>
                  )}
                </Card>
              ))}
            </PicksGrid>

            {/* Also keep a Pick History button below the grid */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link href="/pick-history" passHref legacyBehavior>
                <LinkButton>Pick History</LinkButton>
              </Link>
            </div>
          </>
        )}
      </PageWrapper>
    </Layout>
  )
}

export async function getServerSideProps(context) {
  const rawSession = await getServerSession(context.req, context.res, authOptions)
  if (!rawSession) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const role         = rawSession.user?.role || 'user'
  const isAdmin      = role === 'admin'
  const isSubscribed = isAdmin ? true : (rawSession.user?.isSubscribed ?? false)

  let picks = []
  if (isSubscribed) {
    const client = await clientPromise
    const start  = startOfTodayEST()
    const now    = new Date()

    const rows = await client
      .db()
      .collection('picks')
      .aggregate([
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
        {
          $match: {
            createdAt:   { $gte: start },
            gameTimeDate:{ $gte: now }
          }
        },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$algorithm", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } },
        {
          $project: {
            sport: 1, teams: 1, pick: 1, confidence: 1,
            rationale: 1, gameTime: "$gameTimeDate", algorithm: 1, starRating: 1
          }
        }
      ])
      .toArray()

    picks = rows.map(p => ({
      _id:        p._id.toString(),
      sport:      p.sport ?? 'MLB',
      teams:      p.teams ?? '',
      pick:       p.pick  ?? null,
      confidence: p.confidence ?? null,
      rationale:  p.rationale  ?? null,
      gameTime:   p.gameTime ? new Date(p.gameTime).toISOString() : null, // Convert Date to string
      algorithm:  p.algorithm  ?? null,
      starRating: p.starRating ?? null,
    }))
  }

  const session = {
    user: {
      name:         rawSession.user?.name  ?? null,
      email:        rawSession.user?.email ?? null,
      image:        rawSession.user?.image ?? null,
      role,
      isSubscribed,
    }
  }

  return { props: { session, isSubscribed, picks } }
}
