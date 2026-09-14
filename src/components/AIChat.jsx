import { useState, useRef, useEffect } from 'react'

const ROLE_CHIPS = {
  citizen: ['💸 I lost money in UPI fraud','📞 I got a digital arrest call','📱 My OTP was stolen','💰 Investment scam help','🆘 How to file complaint','📞 Helpline numbers'],
  lea:     ['🗺️ ATM hotspot analysis','⚖️ BNS 2023 legal sections','📋 Evidence checklist','📊 H1 2026 state data','🌐 Cross-jurisdiction steps','🔍 Gang network intel'],
  bank:    ['🏦 CFCFRMS fund freeze steps','📋 STR filing FIU-IND','⚖️ Customer liability RBI','🤝 LEA data request','💳 UPI fraud response','📊 Fraud statistics 2026'],
  i4c:     ['📊 National trend H1 2026','🌐 Cambodia gang network','🔮 ML hotspot predictions','📡 Cross-state correlation','⛓️ Blockchain evidence audit','📋 Intelligence report']
}

const LOCAL_REPLIES = {
  citizen: {
    upi: { title:'UPI / PAYMENT FRAUD — IMMEDIATE STEPS', color:'#ff3333', lines:['<b>1. Call 1930 NOW</b> — 24x7 National Cyber Crime Helpline (FREE)','<b>2. Call your bank</b> — say "unauthorized transaction, freeze account"','<b>3. Give your UTR / Transaction ID</b> — bank can reverse within 24 hours','<b>4. Screenshot</b> all payment messages and transaction history','<b>5. File at</b> cybercrime.gov.in','H1 2026: ₹10,178Cr lost — first hour is critical'] },
    arrest: { title:'DIGITAL ARREST — 100% SCAM', color:'#ff3333', lines:['<b>Police / CBI / ED / RBI NEVER arrest via video call. EVER.</b>','<b>HANG UP immediately</b> — do not listen to them','Do NOT pay any amount — not even ₹1','Do NOT share Aadhaar, PAN, OTP, or bank details','<b>Call 1930</b> immediately and report','1,23,672 digital arrest cases in 2024 — you are not alone'] },
    otp: { title:'OTP / SIM SWAP FRAUD', color:'#ff3333', lines:['<b>Call telecom NOW</b> — Jio: 198 | Airtel: 198 | Vi: 199','Ask them to block your SIM immediately','Call your bank — freeze all accounts on that number','<b>Call 1930</b> and report','File at cybercrime.gov.in'] },
    invest: { title:'INVESTMENT SCAM — STOP PAYMENTS', color:'#ff3333', lines:['<b>STOP all payments immediately</b>','Investment scams = 75% of ₹10,178Cr losses H1 2026','No legitimate investment guarantees high returns','Screenshot all chats and receipts','<b>Call 1930</b> immediately'] },
    helpline: { title:'OFFICIAL HELPLINES', color:'#1a6ef5', lines:['📞 <b>1930</b> — National Cyber Crime (24x7, FREE)','📞 <b>14440</b> — RBI Banking Fraud','📞 <b>181</b> — Women Cyber Crime','📞 <b>1800-11-4949</b> — CERT-In','📞 <b>100</b> — Police Emergency','🌐 cybercrime.gov.in — File complaint online'] },
    default: { title:'HOW CAN I HELP YOU?', color:'#1a6ef5', lines:['Tell me what happened — I will guide you step by step','💸 UPI / Payment fraud','📞 Digital arrest (fake CBI/ED/RBI call)','📱 OTP scam or SIM swap','💰 Investment / trading scam','<b>Emergency: Call 1930 immediately (24x7, FREE)</b>'] }
  },
  lea: {
    default: { title:'LEA INTELLIGENCE — H1 2026', color:'#00c8f0', lines:['Complaints: <b>12.71L</b> | Losses: <b>₹10,178Cr</b> | Frozen: ₹2,968Cr','UP(1.85L) | MH(1.58L ₹1,637Cr) | KA(1.21L) | Bihar(93,137 new hotspot)','Gang origin: 50%+ Cambodia/Myanmar/Laos','ATM pattern: 2–6 AM IST within 2km of railway stations','Legal: BNS 316/318/336 + IT Act 66/66C/66D','Ask: ATM hotspots | evidence checklist | legal sections | gang network'] }
  },
  bank: {
    default: { title:'BANK FRAUD PROTOCOL — RBI', color:'#00e676', lines:['Freeze via CFCFRMS within <b>4 hours</b>','Preserve transaction logs <b>90 days</b>','File STR to FIU-IND within 7 days','Customer liability: Zero if reported in 3 days','CFCFRMS: ₹11,158Cr saved since 2021 | 263 banks'] }
  },
  i4c: {
    default: { title:'I4C INTELLIGENCE — H1 2026', color:'#a87fff', lines:['Complaints: <b>12.71L</b> | Losses: <b>₹10,178Cr</b> | Frozen: ₹2,968Cr (29.17%)','CFCFRMS: <b>₹11,158Cr saved</b> | 263 banks | 53L+ NCRP since 2019','Investment scams = <b>75% of losses</b> | Digital arrests: 1,23,672','Gang origin: 50%+ Cambodia | ML: 87.4% accuracy | FIR rate: 1.4%','Ask: gang network | cross-jurisdiction | CFCFRMS | state breakdown'] }
  }
}

function getLocalReply(q, role) {
  const ql = q.toLowerCase()
  const r = LOCAL_REPLIES[role] || LOCAL_REPLIES.citizen
  let key = 'default'
  if (/upi|payment|transfer|paytm|phonepe|gpay|bank fraud|money/.test(ql)) key = 'upi'
  else if (/arrest|cbi|ed|rbi|video call|fake officer/.test(ql)) key = 'arrest'
  else if (/otp|sim|swap|hack/.test(ql)) key = 'otp'
  else if (/invest|trading|crypto|profit|telegram|scheme/.test(ql)) key = 'invest'
  else if (/helpline|number|contact|1930/.test(ql)) key = 'helpline'
  const reply = r[key] || r.default
  if (!reply) return LOCAL_REPLIES.i4c.default
  return reply
}

function formatReply(reply) {
  const { title, color, lines } = reply
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;background:rgba(0,0,0,.15);color:${color};margin-bottom:8px;">${title}</span><br/><br/>${lines.map(l => `• ${l}`).join('<br/>')}`
}

function fmtMD(t) {
  if (!t) return ''
  return t.replace(/\*\*(.*?)\*\*/g,'<b>$1</b>').replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/\n\n/g,'<br/><br/>').replace(/\n/g,'<br/>')
}

export default function AIChat({ user, toast }) {
  const [role, setRole] = useState(user?.r || 'citizen')
  const [messages, setMessages] = useState([{
    id:0, from:'bot',
    html:`<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;background:rgba(26,110,245,.15);color:#00c8f0;margin-bottom:8px;">WELCOME</span><br/><br/>
    Namaste! I am <b>CyberSuraksha AI</b> — I4C Blockchain Intelligence Platform.<br/><br/>
    <b>2026 Status:</b> 12.71L complaints · ₹10,178Cr lost · ₹11,158Cr saved by CFCFRMS<br/><br/>
    Select your role above and ask anything. I'll respond with real 2026 MHA data.<br/><br/>
    <b>🆘 Emergency: Call 1930 (24x7, FREE)</b>`
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hist, setHist] = useState([])
  const boxRef = useRef(null)
  const chips = ROLE_CHIPS[role] || ROLE_CHIPS.citizen

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [messages])

  const send = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setLoading(true)

    const userMsg = { id: Date.now(), from:'user', text: q }
    setMessages(m => [...m, userMsg])
    const newHist = [...hist, { role:'user', content:q }]
    setHist(newHist)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ messages: newHist, role })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.reply) {
          const botMsg = { id: Date.now()+1, from:'bot', html: fmtMD(data.reply) }
          setMessages(m => [...m, botMsg])
          setHist(h => [...h, { role:'assistant', content:data.reply }])
          setLoading(false)
          return
        }
      }
      throw new Error('API failed')
    } catch(e) {
      // Offline smart fallback
      const reply = getLocalReply(q, role)
      const botMsg = { id: Date.now()+1, from:'bot', html: formatReply(reply) }
      setMessages(m => [...m, botMsg])
      setHist(h => [...h, { role:'assistant', content:reply.lines.join('\n') }])
      if (e.message !== 'API failed') toast('Using offline mode — Groq unavailable', 'warn')
    }
    setLoading(false)
  }

  const switchRole = (r) => {
    setRole(r)
    setHist([])
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ width:'100%', maxWidth:800, display:'flex', flexDirection:'column', height:'100%', padding:'12px 12px 0' }}>
        {/* Role bar */}
        <div style={{ display:'flex', gap:5, marginBottom:9, background:'#0d1828',
          border:'1px solid #1e3460', borderRadius:9, padding:5 }}>
          {[{id:'citizen',l:'👤 Citizen'},{id:'lea',l:'🔎 LEA Officer'},{id:'bank',l:'🏦 Bank/FI'},{id:'i4c',l:'🏛️ I4C Analyst'}].map(r => (
            <button key={r.id} onClick={()=>switchRole(r.id)}
              style={{ flex:1, padding:'7px 5px', border:`1px solid ${role===r.id?'#1a6ef5':'transparent'}`,
                borderRadius:6, background:role===r.id?'#1a6ef5':'transparent',
                color:role===r.id?'#fff':'#7a9cc0', fontSize:11, fontWeight:600,
                cursor:'pointer', fontFamily:'inherit' }}>
              {r.l}
            </button>
          ))}
        </div>

        {/* Chips */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:9 }}>
          {chips.map(c => (
            <span key={c} onClick={()=>send(c)} style={{ padding:'5px 10px', border:'1px solid #1e3460',
              borderRadius:13, fontSize:11, background:'#0d1828', color:'#7a9cc0', cursor:'pointer' }}>
              {c}
            </span>
          ))}
        </div>

        {/* Messages */}
        <div ref={boxRef} style={{ flex:1, background:'#0d1828', border:'1px solid #1e3460',
          borderRadius:9, padding:13, overflowY:'auto', display:'flex', flexDirection:'column',
          gap:10, marginBottom:9, minHeight:0 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display:'flex', gap:7, flexDirection:msg.from==='user'?'row-reverse':'row',
              animation:'fadeUp .3s ease' }}>
              <div style={{ width:29, height:29, borderRadius:'50%', display:'flex',
                alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0,
                background: msg.from==='bot' ? 'linear-gradient(135deg,#1a6ef5,#00c8f0)' : '#131f30',
                border: msg.from==='user' ? '1px solid #1e3460' : 'none',
                color: msg.from==='user' ? '#7a9cc0' : '#fff' }}>
                {msg.from==='bot' ? '🛡️' : 'YOU'}
              </div>
              <div style={{ maxWidth:'80%', padding:'10px 13px', borderRadius:11, fontSize:13, lineHeight:1.7,
                background: msg.from==='user' ? '#1a6ef5' : '#131f30',
                border: msg.from==='user' ? 'none' : '1px solid #1e3460',
                color: '#dde6f4',
                borderTopLeftRadius: msg.from==='bot' ? 3 : 11,
                borderTopRightRadius: msg.from==='user' ? 3 : 11 }}
                dangerouslySetInnerHTML={{ __html: msg.html || msg.text || '' }}/>
            </div>
          ))}
          {loading && (
            <div style={{ display:'flex', gap:7 }}>
              <div style={{ width:29, height:29, borderRadius:'50%', background:'linear-gradient(135deg,#1a6ef5,#00c8f0)', display:'flex', alignItems:'center', justifyContent:'center' }}>🛡️</div>
              <div style={{ padding:'10px 13px', background:'#131f30', borderRadius:11, borderTopLeftRadius:3, border:'1px solid #1e3460' }}>
                <div className="tdots"><div className="td"/><div className="td"/><div className="td"/></div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ background:'#0d1828', border:'1px solid #1e3460', borderRadius:9,
          padding:'8px 10px', display:'flex', gap:7, alignItems:'flex-end', marginBottom:7 }}>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
            placeholder="Describe your problem... e.g. I lost ₹50,000 in a UPI scam"
            rows={1} style={{ flex:1, background:'transparent', border:'none', outline:'none',
              color:'#dde6f4', fontSize:13, resize:'none', fontFamily:'inherit',
              minHeight:20, maxHeight:100 }}/>
          <button onClick={()=>send()} disabled={loading||!input.trim()}
            style={{ width:34, height:34, borderRadius:7, background:'#1a6ef5', border:'none',
              cursor:'pointer', color:'#fff', fontSize:15, flexShrink:0,
              opacity: loading||!input.trim() ? .5 : 1 }}>➤</button>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'center', gap:12, padding:'4px 0 9px',
          fontSize:10, color:'#3a5270', flexWrap:'wrap' }}>
          <span>🆘 <strong style={{color:'#ff3333'}}>1930</strong></span>
          <span>🌐 cybercrime.gov.in</span>
          <span>🤖 Groq LLaMA 3.3-70B (server-side)</span>
          <span>⛓️ Polygon Blockchain</span>
          <span>⚖️ BNS 2023 aware</span>
        </div>
      </div>
    </div>
  )
}
