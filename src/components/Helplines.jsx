export default function Helplines({ toast }) {
  const h = [
    {n:'1930',title:'National Cyber Crime',sub:'24×7 · Free · All India',desc:'Call immediately. 12.71L complaints H1 2026. First hour is critical. CFCFRMS fund block initiated on your call.',link:'https://cybercrime.gov.in',ic:'🆘'},
    {n:'14440',title:'RBI Banking Fraud',sub:'Reserve Bank of India',desc:'Report UPI/card fraud. Zero liability if reported in 3 days. ₹2,968Cr frozen H1 2026.',link:'https://bankingombudsman.rbi.org.in',ic:'🏦'},
    {n:'181',title:'Women Cyber Crime',sub:'Ministry of WCD',desc:'Sextortion, morphed images, stalking. Confidential. 4,63,114 women filed in 2025.',link:'https://cybercrime.gov.in',ic:'👩'},
    {n:'1800-11-4949',title:'CERT-In',sub:'Toll-free',desc:'Ransomware, data breaches. 29.44L incidents 2025.',link:'https://cert-in.org.in',ic:'🔒'},
    {n:'1909',title:'TRAI / Sanchar Saathi',sub:'Block spam calls',desc:'Block fake calls impersonating govt officials. Report digital arrest callers immediately.',link:'https://sancharsaathi.gov.in',ic:'📞'},
    {n:'100',title:'Police Emergency',sub:'All India',desc:'File FIR under BNS 2023. Only 1.4% of complaints became FIRs in 2025 — this needs to improve.',link:'https://cybercrime.gov.in',ic:'🚔'}
  ]
  const states = [
    ['Maharashtra','022-26583756'],['Delhi','011-25820000'],['Karnataka','080-22943050'],
    ['Tamil Nadu','044-28512750'],['Uttar Pradesh','0522-2205544'],['West Bengal','033-22143004'],
    ['Gujarat','079-25620974'],['Rajasthan','0141-2744000'],['Haryana','0172-2749909'],
    ['Kerala','0471-2722768'],['Telangana','040-27852999'],['Bihar','0612-2217995']
  ]
  return (
    <div style={{padding:14,height:'100%',overflowY:'auto'}}>
      <h2 style={{fontSize:15,fontWeight:700,marginBottom:12}}>🆘 Official Helplines · Resources</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:11,marginBottom:13}}>
        {h.map(x=>(
          <div key={x.n} style={{background:'#0d1828',border:'1px solid #1e3460',borderRadius:9,padding:14}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:9}}>
              <div style={{width:36,height:36,borderRadius:8,background:'linear-gradient(135deg,#1a6ef5,#00c8f0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>{x.ic}</div>
              <div><div style={{fontSize:13,fontWeight:700}}>{x.title}</div><div style={{fontSize:10,color:'#7a9cc0'}}>{x.sub}</div></div>
            </div>
            <div onClick={()=>toast(`📞 Dialing ${x.n}...`,'inf')} style={{fontSize:24,fontWeight:800,color:'#ff3333',margin:'4px 0',cursor:'pointer'}}>{x.n}</div>
            <div style={{fontSize:11,color:'#7a9cc0',lineHeight:1.6,marginBottom:7}}>{x.desc}</div>
            <a href={x.link} target="_blank" rel="noreferrer" style={{fontSize:11,fontWeight:600,color:'#00c8f0',textDecoration:'none'}}>🌐 Visit website →</a>
          </div>
        ))}
      </div>
      <h3 style={{fontSize:12,fontWeight:700,marginBottom:9}}>📍 State Cybercrime Cells</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:6}}>
        {states.map(([s,n])=>(
          <div key={s} style={{background:'#131f30',border:'1px solid #1e3460',borderRadius:7,padding:'7px 9px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#7a9cc0',textTransform:'uppercase'}}>{s}</div>
            <div style={{fontSize:12,fontWeight:700,color:'#00c8f0',marginTop:2}}>{n}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
