// components/Layout.js
import styled from 'styled-components'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

const Nav = styled.nav`
  position: relative;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Brand = styled.a`
  color: #111;
  font-weight: 700;
  font-size: 1.125rem;
  text-decoration: none;
  cursor: pointer;
`

const RightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const PlainLink = styled(Link)`
  color: #555;
  text-decoration: none;
  font-weight: 500;
  &:hover { color: #111; }
`

const MenuButton = styled.button`
  background: #4f46e5;
  color: #fff;
  border: 0;
  border-radius: 0.5rem;
  padding: 0.5rem 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  &:hover { background: #4338ca; }
`

const Caret = styled.span`
  display: inline-block;
  transition: transform 0.15s ease;
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'rotate(0deg)')};
`

const MenuWrap = styled.div`
  position: relative;
`

const Dropdown = styled.div`
  position: absolute;
  right: 0;
  top: 110%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  width: 240px;
  padding: 0.5rem;
  z-index: 50;
`

const Item = styled(Link)`
  display: block;
  padding: 0.65rem 0.75rem;
  border-radius: 0.5rem;
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  &:hover { background: #f3f4f6; color: #111827; }
`

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
`

const Main = styled.main`
  max-width: 48rem;
  margin: 2rem auto;
  padding: 0 1rem;
`

const Footer = styled.footer`
  text-align: center;
  padding: 2rem 1rem;
  border-top: 1px solid #eee;
  color: #888;
  font-size: 0.9rem;
`

export default function Layout({ children }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const isAdmin = session?.user?.role === 'admin'
  const isAuthed = !!session?.user

  useEffect(() => {
    function onClickAway(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [])

  return (
    <>
      <Nav>
        <Link href="/" passHref legacyBehavior>
          <Brand>Analytics</Brand>
        </Link>

        <RightSide>
          {!isAuthed && (
            <>
              <PlainLink href="/login">Login</PlainLink>
              <PlainLink href="/register">Sign Up</PlainLink>
            </>
          )}

          {isAuthed && (
            <>
              <PlainLink href="/dashboard">Dashboard</PlainLink>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#555',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </>
          )}

          <MenuWrap ref={ref}>
            <MenuButton onClick={() => setOpen(v => !v)}>
              Menu <Caret open={open}>▾</Caret>
            </MenuButton>
            {open && (
              <Dropdown>
                {/* stacked menu links */}
                <Item href="/account">Account</Item>
                <Item href="/blog">Blog</Item>
                <Item href="/faq">FAQ</Item>
                <Item href="/terms-of-service">Terms of Service</Item>
                <Item href="/privacy-policy">Privacy Policy</Item>

                {isAdmin && (
                  <>
                    <Divider />
                    <Item href="/admin">Admin</Item>
                  </>
                )}
              </Dropdown>
            )}
          </MenuWrap>
        </RightSide>
      </Nav>

      <Main>{children}</Main>
      <Footer>&copy; {new Date().getFullYear()} Pick of Day Bot. All rights reserved.</Footer>
    </>
  )
}
