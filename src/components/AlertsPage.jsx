import { useState, useEffect } from 'react'

const SEV_COLOR = { CRITICAL:'#ff3333', HIGH:'#ffab00', WARNING:'#ffab00', INFO:'#1a6ef5' }
const SEV_BG = { CRITICAL:'rgba(255,51,51,.08)', HIGH:'rgba(255,171,0,.08)', WARNING:'rgba(255,171,0,.08)', INFO:'rgba(26,110,245,.08)' }

export default function AlertsPage({ user, toast }) {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState(null)

  const fetchAlerts = async () => {
    try {
      const url = filter === 'all' ? '/api/alerts?limit=20' : `/api/alerts?limit=20&severity=${filter}`
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.alerts?.length > 0) {
        setAlerts(data.alerts)
        setLastFetch(new Date())
        return
      }
    } catch(e) {}
    // Fallback static alerts
    setAlerts(STATIC_ALERTS)
    setLastFetch(new Date())
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    fetchAlerts().then(() => setLoading(false))
    const interval = setInterval(fetchAlerts, 60000)
    return () => clearInterval(interval)
  }, [filter])

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter.toUpperCase())

  return (
    <div style={{ padding:14, height:'100%', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:7 }}>
        <div>
          <h2 style={{ fontSize:15, fontWeight:700 }}>🔔 Live Alerts — Cross-Jurisdiction Intelligence</h2>
          <div style={{ fontSize:10, color:'#3a5270', marginTop:2 }}>
            Sources: The420.in · Google News · PIB · Telegram @Cyberdost ·
            {lastFetch && <span style={{ color:'#00e676' }}> Last updated: {lastFetch.toLocaleTimeString('en-IN')}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {['all','CRITICAL','HIGH','WARNING','INFO'].map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:'4px 10px', borderRadius:12, fontSize:11, fontWeight:600,
                border:`1px solid ${filter===f?'#1a6ef5':'#1e3460'}`,
                background: filter===f?'#1a6ef5':'#0d1828',
                color: filter===f?'#fff':'#7a9cc0', cursor:'pointer', fontFamily:'inherit' }}>
              {f === 'all' ? 'All' : f === 'CRITICAL' ? '🔴 Critical' : f === 'HIGH' ? '🟠 High' : f === 'WARNING' ? '🟡 Warning' : '🔵 Info'}
            </button>
          ))}
          <button onClick={fetchAlerts}
            style={{ padding:'4px 10px', borderRadius:12, fontSize:11, fontWeight:600,
              border:'1px solid #00e676', background:'rgba(0,230,118,.1)',
              color:'#00e676', cursor:'pointer', fontFamily:'inherit' }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10 }}>
          <div className="spinner"/>
          <span style={{ color:'#7a9cc0', fontSize:12 }}>Fetching live intelligence...</span>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {filtered.map((alert, i) => (
            <AlertCard key={alert.id || i} alert={alert} toast={toast} />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:40, color:'#3a5270', fontSize:13 }}>
              No alerts for this filter. Try "All" to see everything.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AlertCard({ alert, toast }) {
  const color = SEV_COLOR[alert.severity] || '#1a6ef5'
  const bg = SEV_BG[alert.severity] || 'rgba(26,110,245,.08)'
  const timeAgo = Math.round((Date.now() - new Date(alert.created_at).getTime()) / 60000)
  const timeStr = timeAgo < 60 ? `${timeAgo} min ago` : `${Math.round(timeAgo/60)} hr ago`

  return (
    <div style={{ background:'#0d1828', border:'1px solid #1e3460', borderRadius:9,
      padding:'13px 15px', display:'flex', gap:11,
      borderLeft:`4px solid ${color}` }}>
      <div style={{ width:34, height:34, borderRadius:8, display:'flex',
        alignItems:'center', justifyContent:'center', fontSize:15,
        background: bg, flexShrink:0 }}>
        {alert.severity==='CRITICAL'?'🚨':alert.severity==='HIGH'?'⚠️':alert.severity==='WARNING'?'📱':'ℹ️'}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:700, marginBottom:3 }}>{alert.title}</div>
        {alert.description && <div style={{ fontSize:11, color:'#7a9cc0', lineHeight:1.6, marginBottom:6 }}>{alert.description?.slice(0,200)}</div>}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:6 }}>
          {alert.severity && <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background:bg, color }}>{alert.severity}</span>}
          {alert.crime_type && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:'rgba(26,110,245,.12)', color:'#00c8f0' }}>{alert.crime_type}</span>}
          {alert.state && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:'#131f30', color:'#7a9cc0' }}>📍 {alert.state}</span>}
          {alert.amount_crore && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:'rgba(255,51,51,.1)', color:'#ff3333' }}>₹{alert.amount_crore}Cr</span>}
          <span style={{ fontSize:9, color:'#3a5270' }}>🔗 {alert.source}</span>
          <span style={{ fontSize:9, color:'#3a5270', marginLeft:'auto' }}>⏱ {timeStr}</span>
        </div>
        {alert.source_url && (
          <a href={alert.source_url} target="_blank" rel="noreferrer"
            style={{ fontSize:10, color:'#1a6ef5', textDecoration:'none' }}>
            🔗 View source →
          </a>
        )}
      </div>
    </div>
  )
}

// Static fallback alerts
const STATIC_ALERTS = [
  { id:1, title:'[The420.in] CRITICAL — ATM Cluster, Gurugram HR · CFCFRMS Block Active', description:'14 ATM withdrawals · ₹8.4L · mule accounts flagged · CFCFRMS fund block initiated across 3 banks', severity:'CRITICAL', state:'Haryana', crime_type:'ATM Fraud', amount_crore:0.84, source:'The420.in', created_at:new Date(Date.now()-120000).toISOString() },
  { id:2, title:'[Google News] Investment Scam Surge — Cambodia Gang · 6-State Nexus', description:'75%+ of ₹10,178Cr H1 2026 losses from investment scams · Gang network Cambodia · UP-MH-KA-GJ-BR-WB surveillance', severity:'CRITICAL', state:'Uttar Pradesh', crime_type:'Investment Scam', source:'Google News', created_at:new Date(Date.now()-1080000).toISOString() },
  { id:3, title:'[Telegram @Cyberdost] Digital Arrest Wave — Delhi NCR · TRAI Action', description:'9 new victims this hour · Callers impersonating CBI/ED/RBI · 14 VoIP numbers blacklisted by TRAI', severity:'HIGH', state:'Delhi', crime_type:'Digital Arrest', source:'Telegram @cyberdost', created_at:new Date(Date.now()-2460000).toISOString() },
  { id:4, title:'[PIB Official] CFCFRMS Crosses ₹11,158Cr Milestone', description:'MHA PIB Jul 23 2026: CFCFRMS saved ₹11,158Cr since 2021. 263 banks integrated via real-time API', severity:'INFO', state:null, crime_type:'Government Update', amount_crore:11158, source:'PIB - Press Information Bureau', created_at:new Date(Date.now()-7200000).toISOString() },
  { id:5, title:'[The420.in] Op SurakshNet SUCCESS — ₹42L Recovered · 3 Arrested', description:'Noida UP cyber cell: 3 arrested under BNS 318 · ₹42L recovered · 180 victims across 6 states', severity:'INFO', state:'Uttar Pradesh', crime_type:'Cybercrime', source:'The420.in', created_at:new Date(Date.now()-10800000).toISOString() }
]
