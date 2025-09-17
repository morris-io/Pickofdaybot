// pages/login.js
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import styled from 'styled-components'
import Layout from '../components/Layout'

const PageWrapper = styled.div`
  min-height: calc(100vh - 280px);
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
`

const Title = styled.h1`
  font-size: 1.75rem;
  color:rgb(57, 57, 57);
  text-align: center;
  margin-bottom: 1.5rem;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }
`

const Button = styled.button`
  padding: 0.75rem;
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

const HelperText = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 1rem;
`

const LinkText = styled.span`
  color: #4f46e5;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })
    if (res.error) {
      setError('Invalid email or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <Layout>
      <PageWrapper>
        <Card>
          <Title>Log In</Title>
          <Form onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Button type="submit">Log In</Button>
          </Form>
          {error && (
            <HelperText style={{ color: '#dc2626' }}>{error}</HelperText>
          )}
          <HelperText>
            Don’t have an account?{' '}
            <LinkText onClick={() => router.push('/register')}>
              Sign up
            </LinkText>
          </HelperText>
        </Card>
      </PageWrapper>
    </Layout>
  )
}
