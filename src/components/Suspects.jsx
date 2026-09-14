export default function Suspects({ toast }) {
  const suspects = [
    {id:'CS-2026-0847',name:'Gang Alpha-7 · Command Node',loc:'Cambodia / Phnom Penh',status:'✅ Arrested · BNS 318',statusC:'#00e676',victims:'180+',amount:'₹42L recovered',tags:['Investment Scam','Cross-border','Crypto'],level:'CRITICAL'},
    {id:'CS-2026-1234',name:'Mule Network · Bihar Hub',loc:'Patna · Bihar (active)',status:'🔴 Active · CDR requested',statusC:'#ff3333',victims:'847 mule accounts',amount:'₹8.4L frozen',tags:['ATM Fraud','Mule accounts'],level:'CRITICAL'},
    {id:'CS-2026-0991',name:'Digital Arrest Ring · Delhi',loc:'Delhi NCR (VoIP)',status:'🟡 Under surveillance',statusC:'#ffab00',victims:'9/hr today',amount:'14 VoIP blacklisted',tags:['Digital Arrest','VoIP spoofing'],level:'HIGH'},
    {id:'CS-2026-1102',name:'Fake Loan App Dev · KA',loc:'Bengaluru + Cambodia server',status:'🟡 Takedown initiated',statusC:'#ffab00',victims:'47 victims',amount:'₹2.1L',tags:['Fake App','Cambodia'],level:'HIGH'}
  ]
  return (
    <div style={{padding:14,height:'100%',overflowY:'auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:13,flexWrap:'wrap',gap:7}}>
        <h2 style={{fontSize:15,fontWeight:700}}>🕵️ Suspect Tracking · Gang Network Intelligence</h2>
        <button onClick={()=>toast('Suspect database synced · 847 active profiles','ok')}
          style={{padding:'5px 12px',background:'rgba(123,94,248,.15)',border:'1px solid #7b5ef8',borderRadius:7,color:'#a87fff',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>⛓️ Sync to Blockchain</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:11,marginBottom:13}}>
        {suspects.map(s=>(
          <div key={s.id} style={{background:'#0d1828',border:'1px solid #1e3460',borderRadius:9,padding:14,borderTop:`2px solid ${s.level==='CRITICAL'?'#ff3333':'#ffab00'}`}}>
            <div style={{fontSize:9,color:'#3a5270',letterSpacing:.5,marginBottom:4}}>{s.id} · {s.level}</div>
            <div style={{fontSize:13,fontWeight:700,marginBottom:9}}>{s.name}</div>
            {[['Location',s.loc],['Status',s.status],['Victims/Accounts',s.victims],['Amount',s.amount]].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#7a9cc0',marginBottom:3}}>
                <span>{k}:</span><span style={{color:k==='Status'?s.statusC:'#dde6f4',fontWeight:600}}>{v}</span>
              </div>
            ))}
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:9,marginBottom:9}}>
              {s.tags.map(t=>(<span key={t} style={{fontSize:9,padding:'3px 7px',borderRadius:4,background:'#131f30',color:'#7a9cc0',border:'1px solid #1e3460'}}>{t}</span>))}
            </div>
            <button onClick={()=>toast(`⛓️ Suspect ${s.id} logged to blockchain`,'ch')}
              style={{width:'100%',padding:'6px 0',background:'rgba(123,94,248,.12)',border:'1px solid #7b5ef8',borderRadius:6,color:'#a87fff',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>⛓️ Log to Blockchain</button>
          </div>
        ))}
      </div>
      <div style={{background:'#0d1828',border:'1px solid #1e3460',borderRadius:9,padding:13}}>
        <div style={{fontSize:11,fontWeight:700,marginBottom:9}}>Cross-Jurisdiction Coordination · Blockchain-Verified</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:9}}>
          {[['UP ↔ MH','✅ Synced ⛓️','#00e676','847 mule accounts on-chain'],
            ['KA ↔ GJ','✅ Synced ⛓️','#00e676','CDR + ATM data on-chain'],
            ['BR ↔ WB','🔄 Pending','#ffab00','Bank data requested'],
            ['India ↔ Interpol','⛓️ On-chain','#a87fff','Purple notice · Polygon TX']
          ].map(([k,v,c,s])=>(
            <div key={k} style={{background:'#131f30',borderRadius:7,padding:11,borderLeft:`3px solid ${c}`}}>
              <div style={{fontSize:10,color:'#7a9cc0'}}>{k}</div>
              <div style={{fontSize:12,fontWeight:700,color:c,marginTop:3}}>{v}</div>
              <div style={{fontSize:10,color:'#3a5270',marginTop:2}}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
