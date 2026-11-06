import { useEffect, useState, useSyncExternalStore } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import AdminDashboard from './admin/dashboard/AdminDashboard'
import { itemByPath } from './admin/dashboard/navigation'
import StudentPortal from './StudentPortal'
import TeacherPortal from './TeacherPortal'
import LandingPage from './LandingPage'
import LoadingScreen from './LoadingScreen'
import LoginParticleBackground from './LoginParticleBackground'
import { apiAssetUrl, apiGet, apiLogin, apiPost, isApiLoading, subscribeToApiLoading } from './api'
import './index.css'

function ApiLoadingIndicator() {
  const isLoading = useSyncExternalStore(subscribeToApiLoading, isApiLoading, () => false)
  if (!isLoading) return null
  return <div className="api-loading-indicator">
    <div className="api-loading-content" role="status" aria-label="Loading data">
      <div className="brand-loading-frame">
        <img className="brand-loading-image" src="/prime-loader.jpg" alt="" />
        <span className="brand-loading-orbit" aria-hidden="true" />
      </div>
      <div className="brand-loading-copy">
        <strong>The Prime</strong>
        <span>Loading your data</span>
      </div>
      <div className="brand-loading-track" aria-hidden="true"><span /></div>
    </div>
  </div>
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(true)
  const [instituteLogo, setInstituteLogo] = useState('/the-prime-logo.svg')

  useEffect(() => {
    apiGet('/institutes/public')
      .then(({ data }) => {
        if (data.institute?.logoUrl) setInstituteLogo(apiAssetUrl(data.institute.logoUrl))
      })
      .catch((requestError) => {
        console.error('Could not load institute logo for login:', requestError)
      })
      .finally(() => setLogoLoading(false))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await apiLogin(email, password)
      localStorage.setItem('prime_access_token', result.data.accessToken)
      localStorage.setItem('prime_user', JSON.stringify(result.data.user))
      localStorage.setItem('prime_permissions', JSON.stringify(result.data.permissions || []))
      onLogin()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

   if (loading || logoLoading) return <LoadingScreen />

   return <main className="login-screen"><section className="login-art"><LoginParticleBackground /><div className="login-brand"><img src={instituteLogo} alt="Institute logo" /></div><div className="login-art-copy"><p className="eyebrow">The Prime Institute of Science &amp; Technology</p><h1>Keep every fee,<br /><em>right on track.</em></h1><p>One calm workspace for your students, payments, and school team.</p></div><div className="login-art-note"><span>✦</span><p>Built for teams<br />who care about every detail.</p></div></section><section className="login-panel"><div className="login-form-wrap"><div className="mobile-login-brand"><img src={instituteLogo} alt="Institute logo" /></div><p className="eyebrow">Admin workspace</p><h2>Welcome back</h2><p className="login-subtitle">Sign in to continue to The Prime dashboard.</p><form onSubmit={handleSubmit}><label>Email address<input type="email" placeholder="you@theprime.edu" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<div className="password-input"><LockKeyhole size={16} /><input type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div></label><div className="login-options"><label className="remember-option"><input type="checkbox" defaultChecked /> <span>Remember me</span></label><button type="button" className="forgot-button">Forgot password?</button></div>{error && <p className="login-error" role="alert">{error}</p>}<button className="login-button" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'} {!loading && <ArrowRight size={17} />}</button></form><p className="login-footer">Need access? <button type="button">Contact your school administrator</button></p></div></section></main>
}

function AppRouter() {
  const [screen, setScreen] = useState('checking')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('prime_access_token')
    if (!token) {
      setScreen('landing')
      return
    }
    apiGet('/auth/me').then(({ data }) => {
      localStorage.setItem('prime_user', JSON.stringify(data.user))
      localStorage.setItem('prime_permissions', JSON.stringify(data.permissions || []))
      setScreen(data.user.role === 'STUDENT' ? 'student' : data.user.role === 'INSTRUCTOR' ? 'teacher' : 'admin')
    }).catch(() => {
      localStorage.removeItem('prime_access_token')
      localStorage.removeItem('prime_user')
      localStorage.removeItem('prime_permissions')
      setScreen('landing')
    })
  }, [])

  useEffect(() => {
    if (screen === 'checking') return
    const path = location.pathname
    if (screen === 'landing') {
      if (path !== '/' && path !== '/landing' && path !== '/login') navigate('/login', { replace: true })
      return
    }
    if (screen === 'admin') {
      if (path === '/') navigate('/dashboard', { replace: true })
      else if (path !== '/landing' && path !== '/login' && !itemByPath[path]) navigate('/dashboard', { replace: true })
      else if (path === '/login') navigate('/dashboard', { replace: true })
      return
    }
    const portalPath = screen === 'student' ? '/student' : '/teacher'
    if (path !== '/landing' && path !== portalPath) navigate(portalPath, { replace: true })
  }, [screen, location.pathname, navigate])

  const logout = async () => {
    try { await apiPost('/auth/logout', {}) } catch {}
    localStorage.removeItem('prime_access_token')
    localStorage.removeItem('prime_user')
    localStorage.removeItem('prime_permissions')
    setScreen('landing')
    navigate('/landing', { replace: true })
  }

  if (screen === 'checking') return <><LoadingScreen /><ApiLoadingIndicator /></>
  if (location.pathname === '/landing') return <><LandingPage onLogin={() => navigate('/login')} /><ApiLoadingIndicator /></>
  if (screen === 'landing') {
    if (location.pathname === '/login') return <><Login onLogin={() => {
      const user = JSON.parse(localStorage.getItem('prime_user') || '{}')
      const nextScreen = user.role === 'STUDENT' ? 'student' : user.role === 'INSTRUCTOR' ? 'teacher' : 'admin'
      setScreen(nextScreen)
      navigate(nextScreen === 'student' ? '/student' : nextScreen === 'teacher' ? '/teacher' : '/dashboard', { replace: true })
    }} /><ApiLoadingIndicator /></>
    return <><LandingPage onLogin={() => navigate('/login')} /><ApiLoadingIndicator /></>
  }

  const portal = screen === 'student' ? <StudentPortal onLogout={logout} /> : screen === 'teacher' ? <TeacherPortal onLogout={logout} /> : <AdminDashboard onLogout={logout} />
  return <>{portal}<ApiLoadingIndicator /></>
}

function App() {
  return <BrowserRouter><AppRouter /></BrowserRouter>
}

export default App
