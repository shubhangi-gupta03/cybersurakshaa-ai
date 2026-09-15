import { useState, useEffect } from 'react'

const OFFICERS = [
  { id:'O001', name:'Insp. Rajesh Kumar', state:'Uttar Pradesh', rank:'Inspector', active:true },
  { id:'O002', name:'SI Priya Sharma', state:'Maharashtra', rank:'Sub Inspector', active:true },
  { id:'O003', name:'Insp. Suresh Nair', state:'Karnataka', rank:'Inspector', active:true },
  { id:'O004', name:'DSP Amit Patel', state:'Gujarat', rank:'DSP', active:true },
  { id:'O005', name:'SI Meena Devi', state:'Bihar', rank:'Sub Inspector', active:false },
]

const STATUS_COLORS = {
  'Open':'#ffab00', 'Under Investigation':'#1a6ef5',
  'FIR Filed':'#a87fff', 'Arrested':'#00e676', 'Closed':'#3a5270'
}

const CRIME_TYPES = ['Investment Scam','Digital Arrest','UPI Fraud','ATM Fraud','OTP Scam','Fake Loan App','Other']

const INITIAL_CASES = [
  { id:'CS-2026-0847', title:'Gang Alpha-7 Cambodia Network', state:'Uttar Pradesh', district:'Lucknow',
    crime:'Investment Scam', amount:4200000, status:'Arrested', fir:'FIR/2026/UP/0847',
    assigned:'O001', priority:'CRITICAL', victims:180,
    timeline:[
      {date:'2026-07-14',action:'Complaint received via NCRP'},
      {date:'2026-07-15',action:'Assigned to Insp. Kumar'},
      {date:'2026-07-18',action:'CFCFRMS fund block initiated - Rs 42L'},
      {date:'2026-08-01',action:'FIR filed under BNS 316/318'},
      {date:'2026-08-15',action:'3 suspects arrested'},
    ]},
  { id:'CS-2026-1234', title:'Bihar ATM Mule Network', state:'Bihar', district:'Patna',
    crime:'ATM Fraud', amount:840000, status:'Under Investigation', fir:'FIR/2026/BR/1234',
    assigned:'O005', priority:'CRITICAL', victims:47,
    timeline:[
      {date:'2026-08-10',action:'14 ATM withdrawals detected'},
      {date:'2026-08-11',action:'CFCFRMS block - Rs 8.4L frozen'},
      {date:'2026-08-12',action:'CDR requested from telecom'},
    ]},
  { id:'CS-2026-0991', title:'Delhi Digital Arrest Ring', state:'Delhi', district:'New Delhi',
    crime:'Digital Arrest', amount:0, status:'Under Investigation', fir:'',
    assigned:'O002', priority:'HIGH', victims:9,
    timeline:[
      {date:'2026-08-20',action:'9 complaints in single hour'},
      {date:'2026-08-20',action:'14 VoIP numbers blacklisted by TRAI'},
    ]},
  { id:'CS-2026-1102', title:'Bengaluru Fake Loan App', state:'Karnataka', district:'Bengaluru Urban',
    crime:'Fake Loan App', amount:210000, status:'Open', fir:'',
    assigned:null, priority:'HIGH', victims:47,
    timeline:[
      {date:'2026-08-22',action:'3 fake apps reported'},
      {date:'2026-08-23',action:'MeitY takedown requested'},
    ]},
]

export default function CaseManagement({ user, toast }) {
  const [cases, setCases] = useState(INITIAL_CASES)
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [newCase, setNewCase] = useState({
    title:'', state:'Uttar Pradesh', district:'', crime:'Investment Scam',
    amount:'', priority:'HIGH', victims:'', description:''
  })

  const filtered = cases.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !c.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const assignOfficer = (caseId, officerId) => {
    setCases(cs => cs.map(c => c.id === caseId ? {
      ...c, assigned: officerId,
      status: c.status === 'Open' ? 'Under Investigation' : c.status,
      timeline: [...c.timeline, { date: new Date().toISOString().split('T')[0],
        action: `Assigned to ${OFFICERS.find(o=>o.id===officerId)?.name}` }]
    } : c))
    toast(`✅ Officer assigned to ${caseId}`, 'ok')
  }

  const updateStatus = (caseId, status) => {
    setCases(cs => cs.map(c => c.id === caseId ? {
      ...c, status,
      timeline: [...c.timeline, { date: new Date().toISOString().split('T')[0],
        action: `Status updated to: ${status}` }]
    } : c))
    toast(`Status updated: ${status}`, 'ok')
  }

  const fileFIR = (caseId) => {
    const firNum = `FIR/2026/${caseId.split('-')[2]}/${Math.floor(Math.random()*9000+1000)}`
    setCases(cs => cs.map(c => c.id === caseId ? {
      ...c, fir: firNum, status: 'FIR Filed',
      timeline: [...c.timeline, { date: new Date().toISOString().split('T')[0],
        action: `FIR filed: ${firNum} under BNS 316/318 + IT Act 66C` }]
    } : c))
    toast(`✅ FIR filed: ${firNum}`, 'ok')
  }

  const createCase = () => {
    const id = `CS-2026-${Math.floor(Math.random()*9000+1000)}`
    const c = {
      ...newCase, id,
      amount: parseInt(newCase.amount) || 0,
      victims: parseInt(newCase.victims) || 0,
      status: 'Open', fir:'', assigned:null,
      timeline:[{ date: new Date().toISOString().split('T')[0], action:'Case created via CyberSuraksha AI' }]
    }
    setCases(cs => [c, ...cs])
    setShowNew(false)
    setNewCase({title:'',state:'Uttar Pradesh',district:'',crime:'Investment Scam',amount:'',priority:'HIGH',victims:'',description:''})
    toast(`✅ Case ${id} created`, 'ok')
  }

  const stats = {
    total: cases.length,
    open: cases.filter(c=>c.status==='Open').length,
    active: cases.filter(c=>c.status==='Under Investigation').length,
    arrested: cases.filter(c=>c.status==='Arrested').length,
    totalAmount: cases.reduce((s,c)=>s+c.amount,0)
  }

  return (
    <div style={{ padding:14, height:'100%', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:7 }}>
        <div>
          <h2 style={{ fontSize:15, fontWeight:700 }}>📁 Case Management — FIR Tracking</h2>
          <div style={{ fontSize:10, color:'#3a5270', marginTop:2 }}>
            Assign investigators · Track status · File FIRs · Cross-jurisdiction coordination
          </div>
        </div>
        <button onClick={()=>setShowNew(true)}
          style={{ padding:'6px 14px', background:'#1a6ef5', border:'none', borderRadius:7,
            color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          + New Case
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:9, marginBottom:13 }}>
        {[
          {l:'Total Cases',v:stats.total,c:'#dde6f4'},
          {l:'Open',v:stats.open,c:'#ffab00'},
          {l:'Under Investigation',v:stats.active,c:'#1a6ef5'},
          {l:'Arrested',v:stats.arrested,c:'#00e676'},
          {l:'Total Amount',v:`₹${(stats.totalAmount/100000).toFixed(1)}L`,c:'#ff3333'}
        ].map(x=>(
          <div key={x.l} style={{ background:'#0d1828', border:'1px solid #1e3460', borderRadius:9, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>{x.l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:x.c }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ display:'flex', gap:7, marginBottom:11, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search case ID or title..."
          style={{ flex:1, minWidth:180, background:'#131f30', border:'1px solid #1e3460', borderRadius:7,
            padding:'6px 10px', color:'#dde6f4', fontSize:11, fontFamily:'inherit', outline:'none' }}/>
        {['all','Open','Under Investigation','FIR Filed','Arrested','Closed'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:'5px 10px', borderRadius:12, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              border:`1px solid ${filter===f?'#1a6ef5':'#1e3460'}`,
              background:filter===f?'#1a6ef5':'#0d1828',
              color:filter===f?'#fff':'#7a9cc0' }}>
            {f==='all'?'All':f}
          </button>
        ))}
      </div>

      {/* Case list + detail */}
      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap:11 }}>
        {/* Case list */}
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {filtered.map(c => (
            <div key={c.id} onClick={()=>setSelected(c.id===selected?null:c.id)}
              style={{ background:'#0d1828', border:`1px solid ${selected===c.id?'#1a6ef5':'#1e3460'}`,
                borderRadius:9, padding:'11px 13px', cursor:'pointer',
                borderLeft:`4px solid ${STATUS_COLORS[c.status]||'#1e3460'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                <div>
                  <div style={{ fontSize:9, color:'#3a5270', fontFamily:'monospace' }}>{c.id}</div>
                  <div style={{ fontSize:12, fontWeight:700, marginTop:2 }}>{c.title}</div>
                </div>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:4, flexShrink:0,
                  background:`rgba(${c.priority==='CRITICAL'?'255,51,51':'255,107,0'},.12)`,
                  color:c.priority==='CRITICAL'?'#ff3333':'#ff6b00' }}>{c.priority}</span>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:10, color:'#7a9cc0' }}>📍 {c.district}, {c.state}</span>
                <span style={{ fontSize:10, color:'#7a9cc0' }}>· {c.crime}</span>
                {c.amount > 0 && <span style={{ fontSize:10, color:'#ff3333' }}>· ₹{(c.amount/100000).toFixed(1)}L</span>}
                <span style={{ marginLeft:'auto', fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:4,
                  background:`rgba(0,0,0,.2)`, color:STATUS_COLORS[c.status]||'#7a9cc0' }}>
                  {c.status}
                </span>
              </div>
              {c.assigned && (
                <div style={{ fontSize:10, color:'#3a5270', marginTop:4 }}>
                  👤 {OFFICERS.find(o=>o.id===c.assigned)?.name}
                  {c.fir && <span style={{ marginLeft:8, color:'#a87fff' }}>📋 {c.fir}</span>}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:30, color:'#3a5270', fontSize:12 }}>
              No cases match this filter.
            </div>
          )}
        </div>

        {/* Case detail */}
        {selected && (() => {
          const c = cases.find(x=>x.id===selected)
          if (!c) return null
          return (
            <div style={{ background:'#0d1828', border:'1px solid #1e3460', borderRadius:9, padding:13 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:11 }}>
                <div>
                  <div style={{ fontSize:9, color:'#3a5270', fontFamily:'monospace' }}>{c.id}</div>
                  <div style={{ fontSize:13, fontWeight:700, marginTop:2 }}>{c.title}</div>
                </div>
                <button onClick={()=>setSelected(null)}
                  style={{ background:'none', border:'none', color:'#3a5270', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>

              {/* Details grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:11 }}>
                {[
                  {l:'State',v:c.state},{l:'District',v:c.district},
                  {l:'Crime Type',v:c.crime},{l:'Victims',v:c.victims},
                  {l:'Amount Lost',v:c.amount>0?`₹${(c.amount/100000).toFixed(1)}L`:'—'},
                  {l:'FIR Number',v:c.fir||'Not filed yet'},
                ].map(x=>(
                  <div key={x.l} style={{ background:'#131f30', borderRadius:6, padding:'7px 9px' }}>
                    <div style={{ fontSize:9, color:'#7a9cc0', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>{x.l}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:'#dde6f4' }}>{x.v}</div>
                  </div>
                ))}
              </div>

              {/* Assign officer */}
              <div style={{ marginBottom:9 }}>
                <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>
                  Assign Investigating Officer
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {OFFICERS.map(o=>(
                    <button key={o.id} onClick={()=>assignOfficer(c.id, o.id)}
                      style={{ padding:'5px 9px', borderRadius:6, fontSize:10, fontWeight:600,
                        cursor:'pointer', fontFamily:'inherit',
                        border:`1px solid ${c.assigned===o.id?'#00e676':'#1e3460'}`,
                        background:c.assigned===o.id?'rgba(0,230,118,.1)':'#131f30',
                        color:c.assigned===o.id?'#00e676':o.active?'#7a9cc0':'#3a5270',
                        opacity:o.active?1:0.6 }}>
                      {c.assigned===o.id?'✅ ':''}{o.name.split(' ').slice(0,2).join(' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Update status */}
              <div style={{ marginBottom:9 }}>
                <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>
                  Update Status
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {Object.keys(STATUS_COLORS).map(s=>(
                    <button key={s} onClick={()=>updateStatus(c.id,s)}
                      style={{ padding:'5px 9px', borderRadius:6, fontSize:10, fontWeight:600,
                        cursor:'pointer', fontFamily:'inherit',
                        border:`1px solid ${c.status===s?STATUS_COLORS[s]:'#1e3460'}`,
                        background:c.status===s?`rgba(0,0,0,.2)`:'#131f30',
                        color:c.status===s?STATUS_COLORS[s]:'#7a9cc0' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ display:'flex', gap:7, marginBottom:11, flexWrap:'wrap' }}>
                {!c.fir && (
                  <button onClick={()=>fileFIR(c.id)}
                    style={{ padding:'6px 12px', background:'#a87fff', border:'none', borderRadius:7,
                      color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    📋 File FIR
                  </button>
                )}
                <button onClick={()=>toast('📱 Alert sent to state cyber cell','ok')}
                  style={{ padding:'6px 12px', background:'#1a6ef5', border:'none', borderRadius:7,
                    color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  📱 Alert State Cell
                </button>
                <button onClick={()=>toast('⛓️ Case logged to blockchain','ch')}
                  style={{ padding:'6px 12px', background:'rgba(123,94,248,.2)', border:'1px solid #7b5ef8',
                    borderRadius:7, color:'#a87fff', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  ⛓️ Log Chain
                </button>
              </div>

              {/* Timeline */}
              <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:7, textTransform:'uppercase', letterSpacing:.5 }}>
                Case Timeline
              </div>
              <div style={{ background:'#131f30', borderRadius:7, padding:'9px 11px', maxHeight:180, overflowY:'auto' }}>
                {[...c.timeline].reverse().map((t,i)=>(
                  <div key={i} style={{ display:'flex', gap:9, padding:'5px 0',
                    borderBottom: i<c.timeline.length-1 ? '1px solid #1e3460' : 'none' }}>
                    <div style={{ fontSize:9, color:'#3a5270', whiteSpace:'nowrap', paddingTop:1 }}>{t.date}</div>
                    <div style={{ fontSize:11, color:'#dde6f4' }}>{t.action}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* New case modal */}
      {showNew && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:500,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#0d1828', border:'1px solid #1e3460', borderRadius:12,
            padding:24, width:460, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>+ Register New Case</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {[
                {l:'Case Title',k:'title',ph:'e.g. Investment Scam - Lucknow'},
                {l:'District',k:'district',ph:'e.g. Lucknow'},
                {l:'Victims Count',k:'victims',ph:'Number of victims'},
                {l:'Amount Lost (₹)',k:'amount',ph:'Amount in rupees'},
              ].map(f=>(
                <div key={f.k}>
                  <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>{f.l}</div>
                  <input value={newCase[f.k]} onChange={e=>setNewCase(n=>({...n,[f.k]:e.target.value}))}
                    placeholder={f.ph}
                    style={{ width:'100%', background:'#131f30', border:'1px solid #1e3460', borderRadius:7,
                      padding:'8px 10px', color:'#dde6f4', fontSize:12, fontFamily:'inherit', outline:'none' }}/>
                </div>
              ))}
              {[
                {l:'State',k:'state',opts:['Uttar Pradesh','Maharashtra','Karnataka','Gujarat','Bihar','Delhi','Rajasthan','West Bengal','Tamil Nadu','Haryana','Telangana','Andhra Pradesh','Madhya Pradesh','Punjab','Kerala','Jharkhand','Odisha','Assam','Chhattisgarh','Uttarakhand']},
                {l:'Crime Type',k:'crime',opts:CRIME_TYPES},
                {l:'Priority',k:'priority',opts:['CRITICAL','HIGH','MEDIUM','LOW']},
              ].map(f=>(
                <div key={f.k}>
                  <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>{f.l}</div>
                  <select value={newCase[f.k]} onChange={e=>setNewCase(n=>({...n,[f.k]:e.target.value}))}
                    style={{ width:'100%', background:'#131f30', border:'1px solid #1e3460', borderRadius:7,
                      padding:'8px 10px', color:'#dde6f4', fontSize:12, fontFamily:'inherit', outline:'none' }}>
                    {(f.opts.length ? f.opts : ['Uttar Pradesh','Maharashtra','Karnataka','Gujarat','Bihar','Delhi']).map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:7, marginTop:14 }}>
              <button onClick={()=>setShowNew(false)}
                style={{ padding:'10px 16px', background:'#131f30', border:'1px solid #1e3460',
                  borderRadius:7, color:'#7a9cc0', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              <button onClick={createCase}
                style={{ flex:1, padding:10, background:'#1a6ef5', border:'none', borderRadius:7,
                  color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                ✅ Create Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
