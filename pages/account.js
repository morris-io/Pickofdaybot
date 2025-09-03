// pages/account.js
import styled from 'styled-components'
import Layout from '../components/Layout'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import clientPromise from '../lib/mongodb'
import { ObjectId } from 'mongodb'
import Link from 'next/link'

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
const Row = styled.p`
  color: #374151;
  margin: 0.25rem 0;
`
const ActionLink = styled.a`
  display: inline-block;
  margin-top: 1.25rem;
  background: #4f46e5;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  &:hover { background: #4338ca; }
`

export default function Account({ session, userView }) {
  return (
    <Layout>
      <Wrap>
        <Card>
          <Title>Account</Title>
          <Row><strong>Name:</strong> {userView.name}</Row>
          <Row><strong>Email:</strong> {userView.email}</Row>
          <Row><strong>Plan:</strong> {userView.plan}</Row>
          <Row><strong>Status:</strong> {userView.status}</Row>

          {userView.effectiveSubscribed ? (
            <Link href="/unsubscribe" passHref legacyBehavior>
              <ActionLink>Unsubscribe</ActionLink>
            </Link>
          ) : (
            <Link href="/subscribe" passHref legacyBehavior>
              <ActionLink>Subscribe Now</ActionLink>
            </Link>
          )}
        </Card>
      </Wrap>
    </Layout>
  )
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const client = await clientPromise
  const users  = client.db().collection('users')

  // Look up the DB user by id if present, otherwise by email (your NextAuth config
  // does not include id on the session by default).
  let dbUser = null
  if (session.user?.id) {
    try {
      dbUser = await users.findOne({ _id: new ObjectId(session.user.id) })
    } catch (_) { /* ignore invalid ObjectId */ }
  }
  if (!dbUser && session.user?.email) {
    dbUser = await users.findOne({ email: session.user.email })
  }

  // Normalize fields
  const role = dbUser?.role || session.user?.role || 'user'
  const isAdmin = role === 'admin'
  const isSubscribed = isAdmin ? true : Boolean(dbUser?.isSubscribed)

  // Build a view model for the page
  const userView = {
    name:   dbUser?.name  ?? session.user?.name  ?? '—',
    email:  dbUser?.email ?? session.user?.email ?? '—',
    plan:   isAdmin ? 'Admin' : (isSubscribed ? 'Pro Monthly' : 'Free'),
    status: (isSubscribed || isAdmin) ? 'Active' : 'Inactive',
    effectiveSubscribed: (isSubscribed || isAdmin),
  }

  // Keep session.image always defined
  session.user.image = session.user.image ?? null
  // Optionally reflect latest role/subscription in session for other pages
  session.user.role = role
  session.user.isSubscribed = isSubscribed

  return { props: { session, userView } }
}
