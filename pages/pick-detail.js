// pages/pick-detail.js
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import clientPromise from '../lib/mongodb'
import styled from 'styled-components'
import { ObjectId } from 'mongodb'

// --- Styled components ---
const Wrap = styled.div`
  min-height: calc(100vh - 160px);
  padding: 2rem 1rem;
  background: #f9fafb;
`
const Card = styled.div`
  max-width: 720px;
  margin: 0 auto;
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  padding: 1.5rem;
`
const Title = styled.h1`
  font-size: 1.75rem;
  color: #111827;
  margin-bottom: 1rem;
`
const Info = styled.p`
  font-size: 1rem;
  color: #374151;
  margin-bottom: 0.5rem;
`

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

export default function PickDetail({ pick }) {
  const router = useRouter()

  if (!pick) {
    return (
      <Layout>
        <Wrap>
          <Card>
            <Title>Pick Not Found</Title>
            <Info>The requested pick could not be found.</Info>
          </Card>
        </Wrap>
      </Layout>
    )
  }

  return (
    <Layout>
      <Wrap>
        <Card>
          <Title>{pick.sport} {pick.algorithm ? `• ${pick.algorithm.toUpperCase()}` : ''}</Title>
          <Info><strong>Teams:</strong> {pick.teams}</Info>
          {pick.pick && <Info><strong>Pick:</strong> {pick.pick}</Info>}
          {pick.confidence && <Info><strong>Confidence:</strong> {pick.confidence}</Info>}
          {pick.starRating != null && <Info><strong>Rating:</strong> {pick.starRating}/5 ⭐</Info>}
          <Info><strong>Odds:</strong> {pick.odds ?? 'TBD'}</Info>
          <Info><strong>Time:</strong> {fmtEST(pick.gameTime)}</Info>
          {pick.rationale && <Info><strong>Rationale:</strong> {pick.rationale}</Info>}
          {pick.result && <Info><strong>Result:</strong> {pick.result.toUpperCase()}</Info>}
        </Card>
      </Wrap>
    </Layout>
  )
}

export async function getServerSideProps(context) {
  const id = context.query.id ?? null

  if (!id) {
    return { props: { pick: null } }
  }

  try {
    const client = await clientPromise
    const pick = await client
      .db()
      .collection('picks')
      .findOne({ _id: new ObjectId(id) })

    if (!pick) {
      return { props: { pick: null } }
    }

    return {
      props: {
        pick: {
          _id:        pick._id.toString(),
          sport:      pick.sport ?? 'MLB',
          teams:      pick.teams ?? '',
          pick:       pick.pick  ?? null,
          confidence: pick.confidence ?? null,
          rationale:  pick.rationale  ?? null,
          gameTime:   pick.gameTime ? new Date(pick.gameTime).toISOString() : null,
          algorithm:  pick.algorithm  ?? null,
          starRating: pick.starRating ?? null,
          odds:       pick.odds ?? null,
          result:     pick.result ?? null,
        }
      }
    }
  } catch (err) {
    console.error('Pick detail fetch error:', err)
    return { props: { pick: null } }
  }
}
