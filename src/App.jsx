import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Dashboard from './components/Dashboard.jsx'
import ThreatMap from './components/ThreatMap.jsx'
import MLEngine from './components/MLEngine.jsx'
import AIChat from './components/AIChat.jsx'
import AlertsPage from './components/AlertsPage.jsx'
import Evidence from './components/Evidence.jsx'
import Blockchain from './components/Blockchain.jsx'
import Suspects from './components/Suspects.jsx'
import Helplines from './components/Helplines.jsx'
import CaseManagement from './components/CaseManagement.jsx'

// Supabase client (public anon key - safe to expose)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

// Users and role access
const USERS = {
  lea:  { p:'lea123',  r:'lea',     lbl:'LEA Officer',  av:'🔎', color:'#00c8f0' },
  i4c:  { p:'i4c123',  r:'i4c',     lbl:'I4C Analyst',  av:'🏛️', color:'#a87fff' },
  bank: { p:'bank123', r:'bank',    lbl:'Bank / FI',     av:'🏦', color:'#00e676' },
  user: { p:'user123', r:'citizen', lbl:'Citizen',       av:'👤', color:'#ffab00' }
}

const ROLE_ACCESS = {
  lea:     ['db','map','ml','chat','alerts','suspect','evidence','chain','hl','cases'],
  i4c:     ['db','map','ml','chat','alerts','suspect','evidence','chain','hl','cases'],
  bank:    ['db','map','chat','alerts','chain','hl'],
  citizen: ['chat','hl']
}

const TABS = [
  { id:'db',       label:'📊 Dashboard',    roles:['lea','i4c','bank'] },
  { id:'map',      label:'🗺️ Threat Map',   roles:['lea','i4c','bank'] },
  { id:'ml',       label:'🤖 ML Engine',    roles:['lea','i4c'] },
  { id:'chat',     label:'💬 AI Assistant', roles:['lea','i4c','bank','citizen'] },
  { id:'alerts',   label:'🔔 Alerts',       roles:['lea','i4c','bank'] },
  { id:'suspect',  label:'🕵️ Suspects',     roles:['lea','i4c'] },
  { id:'evidence', label:'🗂️ Evidence',     roles:['lea','i4c'] },
  { id:'cases', label:'📁 Cases', roles:['lea','i4c'] },
  { id:'chain',    label:'⛓️ Blockchain',   roles:['lea','i4c','bank'] },
  { id:'hl',       label:'🆘 Helplines',    roles:['lea','i4c','bank','citizen'] }
]

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('chat')
  const [toasts, setToasts] = useState([])
  const [alertPopups, setAlertPopups] = useState([])
  const [liveAlertCount, setLiveAlertCount] = useState(0)
  const pollRef = useRef(null)
  const lastAlertRef = useRef(new Date().toISOString())

  // Toast system
  const toast = useCallback((msg, type = 'inf') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500)
  }, [])

  // Alert popup system
  const showAlertPopup = useCallback((alert) => {
    const id = Date.now()
    setAlertPopups(a => [...a.slice(-2), { ...alert, popupId: id }])
    setTimeout(() => setAlertPopups(a => a.filter(x => x.popupId !== id)), 8000)
    setLiveAlertCount(c => c + 1)
  }, [])

  // Poll for new alerts every 30 seconds
  useEffect(() => {
    if (!loggedIn) return

    const pollAlerts = async () => {
      try {
        const res = await fetch(`/api/alerts?since=${encodeURIComponent(lastAlertRef.current)}&limit=5`)
        if (!res.ok) return
        const data = await res.json()
        if (data.alerts && data.alerts.length > 0) {
          data.alerts.forEach(alert => showAlertPopup(alert))
          lastAlertRef.current = data.alerts[0].created_at
        }
      } catch (e) { /* silent */ }
    }

    // Also try Supabase realtime if configured
    let channel = null
    if (import.meta.env.VITE_SUPABASE_URL) {
      channel = supabase
        .channel('alerts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' },
          (payload) => { showAlertPopup(payload.new) })
        .subscribe()
    }

    pollRef.current = setInterval(pollAlerts, 30000)
    return () => {
      clearInterval(pollRef.current)
      if (channel) supabase.removeChannel(channel)
    }
  }, [loggedIn, showAlertPopup])

  // Login
  const doLogin = (username, password, selectedRole) => {
    const u = USERS[username.toLowerCase()]
    if (!u || u.p !== password) return 'Invalid credentials'
    setUser({ ...u, username })
    const defaultPage = { lea:'db', i4c:'db', bank:'db', citizen:'chat' }
    setPage(defaultPage[u.r] || 'chat')
    setLoggedIn(true)
    toast(`✅ Welcome, ${u.lbl}! Secure access granted.`, 'ok')
    return null
  }

  const logout = () => {
    setLoggedIn(false)
    setUser(null)
    setPage('chat')
    setLiveAlertCount(0)
  }

  const visibleTabs = TABS.filter(t => user && t.roles.includes(user.r))

  if (!loggedIn) return <LoginPage onLogin={doLogin} />

  const pageProps = { user, toast, supabase }

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* HEADER */}
      <header style={{ background:'#0d1828', borderBottom:'1px solid #1e3460', height:52,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 14px', flexShrink:0, position:'relative', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#1a6ef5,#00c8f0)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🛡️</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, lineHeight:1.1 }}>CyberSuraksha AI</div>
            <div style={{ fontSize:9, color:'#7a9cc0', letterSpacing:1, textTransform:'uppercase' }}>I4C · MHA · Blockchain · PS 26184</div>
          </div>
        </div>

        {/* NAV TABS */}
        <nav style={{ display:'flex', gap:1, flexWrap:'nowrap', overflow:'auto' }}>
          {visibleTabs.map(t => (
            <button key={t.id} onClick={() => { setPage(t.id); if (t.id==='alerts') setLiveAlertCount(0) }}
              style={{ padding:'5px 9px', borderRadius:6, border:'none',
                background: page===t.id ? '#1a6ef5' : 'transparent',
                color: page===t.id ? '#fff' : '#7a9cc0',
                fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                whiteSpace:'nowrap', position:'relative', transition:'all .15s' }}>
              {t.label}
              {t.id==='alerts' && liveAlertCount > 0 && (
                <span style={{ position:'absolute', top:2, right:2, width:14, height:14,
                  background:'#ff3333', borderRadius:'50%', fontSize:8, color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                  {liveAlertCount > 9 ? '9+' : liveAlertCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* RIGHT SIDE */}
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4,
            background:'rgba(255,51,51,.12)', border:'1px solid rgba(255,51,51,.28)',
            borderRadius:18, padding:'3px 8px', fontSize:10, fontWeight:700, color:'#ff3333' }}>
            <span style={{ width:6, height:6, background:'#ff3333', borderRadius:'50%',
              animation:'blink 1.4s infinite', display:'inline-block' }}/>
            LIVE
          </div>
          <div onClick={logout} style={{ display:'flex', alignItems:'center', gap:5,
            background:'#131f30', border:'1px solid #1e3460', borderRadius:18,
            padding:'3px 9px 3px 5px', fontSize:11, color:'#7a9cc0', cursor:'pointer' }}>
            <div style={{ width:22, height:22, borderRadius:'50%',
              background: user?.color || '#1a6ef5',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>
              {user?.av}
            </div>
            <span>{user?.lbl}</span>
            <span style={{ color:'#3a5270' }}>⏻</span>
          </div>
        </div>
      </header>

      {/* ROLE BANNER */}
      <div style={{ background:'#0d1828', borderBottom:'1px solid #1e3460',
        padding:'5px 14px', display:'flex', alignItems:'center', gap:8,
        fontSize:11, color:'#7a9cc0', flexShrink:0,
        borderLeft:`3px solid ${user?.color || '#1a6ef5'}` }}>
        <span style={{ fontSize:14 }}>{user?.av}</span>
        <span style={{ color: user?.color, fontWeight:700 }}>{user?.lbl} Mode</span>
        <span style={{ color:'#3a5270' }}>|</span>
        <span>{
          { lea:'Suspect tracking · Evidence management · Cross-jurisdiction intel · CFCFRMS alerts',
            i4c:'Full national intelligence · Gang network · ML predictions · All modules unlocked',
            bank:'CFCFRMS fund block · RBI compliance · Fraud alerts · Customer liability tools',
            citizen:'Complaint guidance · Helpline numbers · Immediate fraud response steps'
          }[user?.r]
        }</span>
        <span style={{ marginLeft:'auto', color:'#3a5270', fontSize:10 }}>
          Data refreshes every 5 min · Supabase Realtime active
        </span>
      </div>

      {/* MAIN PAGE */}
      <main style={{ flex:1, overflow:'hidden', position:'relative' }}>
        {page==='db'      && <Dashboard {...pageProps} />}
        {page==='map'     && <ThreatMap {...pageProps} />}
        {page==='ml'      && <MLEngine {...pageProps} />}
        {page==='chat'    && <AIChat {...pageProps} />}
        {page==='alerts'  && <AlertsPage {...pageProps} />}
        {page==='suspect' && <Suspects {...pageProps} />}
        {page==='evidence'&& <Evidence {...pageProps} />}
        {page==='cases' && <CaseManagement {...pageProps} />}
        {page==='chain'   && <Blockchain {...pageProps} />}
        {page==='hl'      && <Helplines {...pageProps} />}
      </main>

      {/* LIVE ALERT POPUPS */}
      {alertPopups.map(alert => (
        <div key={alert.popupId} className={`alert-popup ${alert.severity}`}
          onClick={() => setAlertPopups(a => a.filter(x => x.popupId !== alert.popupId))}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:10, fontWeight:700, color:
              alert.severity==='CRITICAL'?'#ff3333':alert.severity==='HIGH'?'#ffab00':'#1a6ef5',
              textTransform:'uppercase', letterSpacing:1 }}>
              🔴 LIVE ALERT — {alert.severity}
            </span>
            <span style={{ fontSize:10, color:'#3a5270', cursor:'pointer' }}>✕</span>
          </div>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:3, lineHeight:1.4 }}>
            {alert.title?.slice(0,100)}
          </div>
          {alert.state && <div style={{ fontSize:11, color:'#7a9cc0' }}>📍 {alert.state} {alert.crime_type ? `· ${alert.crime_type}` : ''}</div>}
          <div style={{ fontSize:10, color:'#3a5270', marginTop:4 }}>{alert.source} · {new Date(alert.created_at).toLocaleTimeString('en-IN')}</div>
        </div>
      ))}

      {/* TOASTS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  )
}

// ── LOGIN PAGE ──
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('lea')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const roles = [
    { id:'lea', label:'🔎 LEA Officer' },
    { id:'i4c', label:'🏛️ I4C Analyst' },
    { id:'bank', label:'🏦 Bank / FI' },
    { id:'citizen', label:'👤 Citizen' }
  ]

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 400))
    const err = onLogin(username, password, role)
    if (err) setError(err)
    setLoading(false)
  }

  const creds = [
    { role:'LEA Officer', u:'lea', p:'lea123' },
    { role:'I4C Analyst', u:'i4c', p:'i4c123' },
    { role:'Bank/FI', u:'bank', p:'bank123' },
    { role:'Citizen', u:'user', p:'user123' }
  ]

  return (
    <div style={{ position:'fixed', inset:0, background:'linear-gradient(135deg,#040c18,#07101f,#0a1628)',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* Grid background */}
      <div style={{ position:'absolute', inset:0, backgroundImage:
        'linear-gradient(rgba(26,110,245,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(26,110,245,.04) 1px,transparent 1px)',
        backgroundSize:'50px 50px', pointerEvents:'none' }}/>

      <div style={{ position:'relative', background:'#0d1828', border:'1px solid #1e3460',
        borderRadius:16, padding:'36px 40px', width:440, maxWidth:'95vw',
        boxShadow:'0 20px 60px rgba(0,0,0,.6)' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <div style={{ width:44, height:44, borderRadius:12,
            background:'linear-gradient(135deg,#1a6ef5,#00c8f0)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🛡️</div>
          <div>
            <div style={{ fontSize:18, fontWeight:700 }}>CyberSuraksha AI</div>
            <div style={{ fontSize:9, color:'#7a9cc0', letterSpacing:1, textTransform:'uppercase' }}>I4C · Ministry of Home Affairs</div>
          </div>
        </div>

        <div style={{ display:'inline-flex', alignItems:'center', gap:5,
          background:'rgba(138,100,255,.12)', border:'1px solid rgba(138,100,255,.3)',
          borderRadius:18, padding:'3px 10px', fontSize:10, color:'#a87fff', margin:'12px 0 18px' }}>
          ⛓️ Blockchain-Powered Intelligence Platform · PS 26184
        </div>

        {/* Username */}
        <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>Username</div>
        <input value={username} onChange={e=>setUsername(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleLogin()}
          placeholder="Enter username"
          style={{ width:'100%', background:'#131f30', border:'1px solid #1e3460', borderRadius:8,
            padding:'10px 13px', color:'#dde6f4', fontSize:13, outline:'none',
            marginBottom:12, fontFamily:'inherit' }}/>

        {/* Password */}
        <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>Password</div>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleLogin()}
          placeholder="Enter password"
          style={{ width:'100%', background:'#131f30', border:'1px solid #1e3460', borderRadius:8,
            padding:'10px 13px', color:'#dde6f4', fontSize:13, outline:'none',
            marginBottom:12, fontFamily:'inherit' }}/>

        {/* Role selector */}
        <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:7, textTransform:'uppercase', letterSpacing:.5 }}>Select Role</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:16 }}>
          {roles.map(r => (
            <button key={r.id} onClick={()=>setRole(r.id)}
              style={{ padding:'9px 8px', border:`1.5px solid ${role===r.id?'#1a6ef5':'#1e3460'}`,
                borderRadius:8, background: role===r.id?'rgba(26,110,245,.15)':'#131f30',
                color: role===r.id?'#00c8f0':'#7a9cc0', fontSize:12, fontWeight:600,
                cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Login button */}
        <button onClick={handleLogin} disabled={loading}
          style={{ width:'100%', padding:12,
            background:'linear-gradient(135deg,#1a6ef5,#00c8f0)', border:'none',
            borderRadius:8, color:'#fff', fontSize:14, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit', opacity: loading ? .7 : 1 }}>
          {loading ? '⏳ Authenticating...' : '🔐 Secure Login'}
        </button>

        {error && <div style={{ color:'#ff4444', fontSize:11, textAlign:'center', marginTop:7 }}>{error}</div>}

        {/* Credentials hint */}
        <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #1e3460',
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
          {creds.map(c => (
            <div key={c.u} style={{ background:'#131f30', borderRadius:6, padding:'7px 9px',
              cursor:'pointer' }} onClick={()=>{ setUsername(c.u); setPassword(c.p) }}>
              <div style={{ fontSize:9, color:'#7a9cc0', textTransform:'uppercase', letterSpacing:.5 }}>{c.role}</div>
              <div style={{ fontSize:12, fontWeight:700, color:'#00c8f0', marginTop:1 }}>{c.u} / {c.p}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
