// pages/login.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import { getCsrfToken, signIn } from 'next-auth/react'
import Layout from '../components/Layout'
import styled from 'styled-components'
import { Formik, Form, Field, ErrorMessage } from 'formik'

const PageWrapper = styled.div`
  display: block; /* Change from flex to block */
  min-height: calc(100vh - 160px);
  padding-top: 4rem; /* Add padding to push down from the top */
  background: #f9fafb;
`

const Card = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 2.5rem;
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  margin-bottom: 1.5rem;
`

const InputField = styled(Field)`
  width: 100%;
  padding: 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  margin-top: 0.25rem;
  transition: border-color 0.2s;
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }
`

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
`

const SubmitButton = styled.button`
  width: 100%;
  background: #4f46e5;
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 1rem;
  &:hover {
    background: #4338ca;
  }
`

const Error = styled(ErrorMessage)`
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
`

const LinkWrapper = styled.div`
  text-align: center;
  margin-top: 1rem;
`

const PageLink = styled.a`
  font-size: 0.9rem;
  color: #4f46e5;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`

export default function Login({ csrfToken }) {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSignIn = async (values) => {
    const res = await signIn('credentials', {
      redirect: false,
      username: values.username,
      password: values.password,
      callbackUrl: '/dashboard',
    })
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      router.push(res.url)
    }
  }

  return (
    <Layout>
      <PageWrapper>
        <Card>
          <Title>Log In</Title>
          <Formik
            initialValues={{ username: '', password: '' }}
            validate={(values) => {
              const errors = {}
              if (!values.username) {
                errors.username = 'Required'
              }
              if (!values.password) {
                errors.password = 'Required'
              }
              return errors
            }}
            onSubmit={(values) => handleSignIn(values)}
          >
            <Form>
              <div>
                <Label htmlFor="username">Email</Label>
                <InputField type="email" name="username" id="username" />
                <Error name="username" component="div" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <InputField type="password" name="password" id="password" />
                <Error name="password" component="div" />
              </div>
              <SubmitButton type="submit">Log In</SubmitButton>
            </Form>
          </Formik>
          {errorMsg && <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{errorMsg}</div>}
          <LinkWrapper>
            <PageLink onClick={() => router.push('/register')}>
              Don't have an account? Sign up
            </PageLink>
          </LinkWrapper>
        </Card>
      </PageWrapper>
    </Layout>
  )
}

export async function getServerSideProps(context) {
  const csrfToken = await getCsrfToken(context)
  return {
    props: { csrfToken },
  }
}