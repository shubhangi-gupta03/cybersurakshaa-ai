import { useState, useEffect } from 'react'

export default function Blockchain({ toast }) {
  const [events, setEvents] = useState([])
  const [wallet, setWallet] = useState(null)

  useEffect(() => {
    fetch('/api/evidence?limit=20').then(r=>r.json()).then(d=>{
      if(d.evidence) setEvents(d.evidence)
    }).catch(()=>{})
  }, [])

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast('MetaMask not installed — demo mode active', 'inf')
      setWallet('0xDemo...Mode')
      return
    }
    try {
      const accounts = await window.ethereum.request({method:'eth_requestAccounts'})
      setWallet(accounts[0])
      toast(`✅ Wallet connected: ${accounts[0].slice(0,8)}...`, 'ok')
    } catch(e) { toast('Wallet connection failed', 'er') }
  }

  return (
    <div style={{padding:14,height:'100%',overflowY:'auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:13,flexWrap:'wrap',gap:7}}>
        <h2 style={{fontSize:15,fontWeight:700}}>⛓️ Blockchain Intelligence Ledger · Polygon Amoy</h2>
        <button onClick={connect} style={{padding:'6px 14px',background:'linear-gradient(135deg,#7b5ef8,#a87fff)',border:'none',borderRadius:7,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          {wallet ? `✅ ${wallet.slice(0,10)}...` : '🦊 Connect MetaMask'}
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:9,marginBottom:13}}>
        {[{l:'Total Events',v:events.length,c:'#a87fff'},{l:'Evidence Hashes',v:events.length,c:'#00c8f0'},{l:'Fund Block Logs',v:0,c:'#00e676'},{l:'Intel Shares',v:0,c:'#ffab00'}].map(x=>(
          <div key={x.l} style={{background:'#0d1828',border:'1px solid #7b5ef8',borderRadius:9,padding:13,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,#7b5ef8,#a87fff)'}}/>
            <div style={{fontSize:20,fontWeight:800,color:x.c}}>{x.v}</div>
            <div style={{fontSize:10,color:'#7a9cc0',marginTop:4,textTransform:'uppercase',letterSpacing:.8}}>{x.l}</div>
          </div>
        ))}
      </div>

      <div style={{background:'#0d1828',border:'2px solid #7b5ef8',borderRadius:12,padding:18,marginBottom:13}}>
        <div style={{fontSize:13,fontWeight:700,color:'#a87fff',marginBottom:12}}>⛓️ Wallet & Network Status</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
          {[
            {l:'Network',v: wallet ? 'Polygon Amoy (80002)' : 'Not connected',c:'#a87fff'},
            {l:'Wallet',v: wallet || '0x0000...0000',c:'#a87fff'},
            {l:'Smart Contract',v:'0x742d...f44e (Amoy)',c:'#a87fff'},
            {l:'Status',v: wallet ? '✅ Connected' : '⚠️ Connect wallet',c: wallet?'#00e676':'#ffab00'}
          ].map(x=>(
            <div key={x.l} style={{background:'#131f30',borderRadius:8,padding:'10px 12px'}}>
              <div style={{fontSize:10,color:'#7a9cc0',textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>{x.l}</div>
              <div style={{fontSize:12,fontWeight:600,color:x.c,wordBreak:'break-all'}}>{x.v}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:11,padding:10,background:'#131f30',borderRadius:7,fontSize:11,color:'#7a9cc0',lineHeight:1.6}}>
          💡 <b style={{color:'#a87fff'}}>Setup:</b> Install MetaMask → Add Polygon Amoy (Chain ID: 80002) →
          Get free MATIC from <a href="https://faucet.polygon.technology" target="_blank" rel="noreferrer" style={{color:'#a87fff'}}>faucet.polygon.technology</a> → Connect above.
          Evidence hashes stored in Supabase DB and optionally committed to Polygon blockchain.
        </div>
      </div>

      <div style={{background:'#0d1828',border:'1px solid #7b5ef8',borderRadius:9,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 2.5fr 1.8fr 1.5fr',gap:8,padding:'9px 13px',background:'#131f30',borderBottom:'1px solid #7b5ef8',fontSize:10,fontWeight:700,color:'#a87fff',textTransform:'uppercase',letterSpacing:.5}}>
          <div>Event</div><div>Category</div><div>SHA-256 Hash</div><div>TX Hash</div><div>Timestamp</div>
        </div>
        {events.length === 0 ? (
          <div style={{textAlign:'center',padding:28,color:'#3a5270',fontSize:12}}>No blockchain events yet. Upload evidence to create immutable records.</div>
        ) : events.map((ev,i) => (
          <div key={ev.id||i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 2.5fr 1.8fr 1.5fr',gap:8,padding:'9px 13px',borderBottom:'1px solid #1a2840',fontSize:11}}>
            <div><span style={{display:'inline-block',padding:'2px 6px',borderRadius:4,fontSize:9,fontWeight:700,background:'rgba(123,94,248,.15)',color:'#a87fff'}}>EVIDENCE</span><div style={{fontSize:10,color:'#3a5270',marginTop:2}}>{ev.file_name?.slice(0,30)}</div></div>
            <div style={{color:'#7a9cc0',fontSize:10}}>EVIDENCE</div>
            <div style={{fontFamily:'monospace',fontSize:10,color:'#a87fff'}}>{ev.sha256_hash?.slice(0,14)}...</div>
            <div style={{fontFamily:'monospace',fontSize:10,color:'#7a9cc0'}}>{ev.polygon_tx_hash ? ev.polygon_tx_hash.slice(0,14)+'...' : 'Stored in DB'}</div>
            <div style={{fontSize:10,color:'#3a5270'}}>{new Date(ev.created_at).toLocaleTimeString('en-IN')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
