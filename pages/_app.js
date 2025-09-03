// pages/_app.js
import { createGlobalStyle } from 'styled-components'
import { SessionProvider } from 'next-auth/react'

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui; background: #f9fafb; }
  a { color: #4f46e5; text-decoration: none; }
`

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <GlobalStyle />
      <Component {...pageProps} />
    </SessionProvider>
  )
}
