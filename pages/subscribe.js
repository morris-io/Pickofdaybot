// pages/subscribe.js
import { useSession } from 'next-auth/react'
import { useRouter }  from 'next/router'
import styled         from 'styled-components'
import Layout         from '../components/Layout'

const PageWrapper = styled.div`
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  padding: 2rem;
`

const Card = styled.div`
  background: #ffffff;
  padding: 2.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 400px;
  text-align: center;
`

const Title = styled.h1`
  font-size: 2rem;
  color: #4f46e5;
  margin-bottom: 1rem;
`

const Subtitle = styled.p`
  font-size: 1rem;
  color: #4b5563;
  margin-bottom: 1.5rem;
`

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #4338ca;
  }
`

export default function Subscribe() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSubscribe = async () => {
    const res = await fetch('/api/create-checkout-session', { method: 'POST' })
    const { url } = await res.json()
    router.push(url)
  }

  const handleLogin = () => {
    router.push('/login')
  }

  // If not logged in
  if (!session) {
    return (
      <Layout>
        <PageWrapper>
          <Card>
            <Title>Please Log In</Title>
            <Subtitle>You must be signed in to subscribe.</Subtitle>
            <Button onClick={handleLogin}>Log In</Button>
          </Card>
        </PageWrapper>
      </Layout>
    )
  }

  // If logged in, show subscription call-to-action
  return (
    <Layout>
      <PageWrapper>
        <Card>
          <Title>Subscribe for $30/month</Title>
          <Subtitle>Start your 7-day free trial today.</Subtitle>
          <Button onClick={handleSubscribe}>
            Start Your Free Trial
          </Button>
        </Card>
      </PageWrapper>
    </Layout>
  )
}
