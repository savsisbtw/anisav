import { useState, FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import LoginModal from './LoginModal'
import { useAuth } from '../lib/AuthContext'
import { imageUrl } from '../lib/api'

const NAV = [
  { to: '/', label: 'Главная', end: true },
  { to: '/catalog', label: 'Каталог' },
  { to: '/schedule', label: 'Расписание' },
  { to: '/genres', label: 'Жанры' },
  { to: '/wishlist', label: 'Понравилось' },
]

const ACCOUNT_NAV = [
  { to: '/lists', label: 'Мои списки' },
  { to: '/history', label: 'История' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-btn on' : 'nav-btn'
}

export default function Sidebar() {
  const [query, setQuery] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/catalog?search=${encodeURIComponent(q)}`)
  }

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand">
        <Logo />
        <span>AniSav</span>
      </Link>

      <form onSubmit={onSubmit} className="sidebar-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск"
          className="input"
        />
      </form>

      <nav className="nav-items">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
            {n.label}
          </NavLink>
        ))}
        {user && (
          <>
            <div className="nav-sep" />
            {ACCOUNT_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={navClass}>
                {n.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-foot">
        {user ? (
          <>
            <div className="sidebar-user">
              {user.avatar?.preview ? (
                <img
                  src={imageUrl(user.avatar.optimized?.preview || user.avatar.preview)}
                  alt=""
                  className="avatar"
                />
              ) : (
                <span className="avatar">{user.nickname[0]?.toUpperCase()}</span>
              )}
              <span>{user.nickname}</span>
            </div>
            <button onClick={() => logout()} className="nav-btn danger">
              Выйти
            </button>
          </>
        ) : (
          <button onClick={() => setShowLogin(true)} className="btn btn-primary">
            Войти
          </button>
        )}
        <button
          onClick={() => window.anisav.openExternal('https://im.savsis.xyz')}
          className="nav-btn made-by"
        >
          made by savsis
        </button>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </aside>
  )
}
