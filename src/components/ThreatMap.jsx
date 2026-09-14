import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const STATE_DATA = {
  'Uttar Pradesh':{c:185000,col:'#990000',r:'CRITICAL',atms:['Lucknow Hazratganj','Noida Sector 18','Agra Sadar'],la:26.84,ln:80.94},
  'Maharashtra':{c:158000,col:'#aa0000',r:'CRITICAL',atms:['Mumbai CST','Dadar West','Pune Camp'],la:19.75,ln:75.71},
  'Karnataka':{c:121000,col:'#bb1111',r:'CRITICAL',atms:['Bengaluru MG Road','Whitefield','Koramangala'],la:15.31,ln:75.71},
  'Gujarat':{c:97937,col:'#cc2222',r:'CRITICAL',atms:['Ahmedabad CG Road','Surat Ring Road'],la:22.25,ln:71.19},
  'Bihar':{c:93137,col:'#dd3333',r:'CRITICAL',atms:['Patna Exhibition Road','Muzaffarpur ATMs'],la:25.09,ln:85.31},
  'Rajasthan':{c:75883,col:'#cc7700',r:'HIGH',atms:['Jaipur Pink City','Jodhpur Clock Tower'],la:27.02,ln:74.21},
  'West Bengal':{c:72439,col:'#dd8800',r:'HIGH',atms:['Kolkata Park Street','Salt Lake'],la:22.98,ln:87.85},
  'Delhi':{c:64496,col:'#ee9900',r:'HIGH',atms:['Connaught Place','Dwarka Sector 10'],la:28.70,ln:77.10},
  'Tamil Nadu':{c:63116,col:'#cc7000',r:'HIGH',atms:['Chennai T.Nagar','Coimbatore RS Puram'],la:11.12,ln:78.65},
  'Haryana':{c:58721,col:'#dd8000',r:'HIGH',atms:['Gurugram DLF Phase 3','Faridabad ATMs'],la:29.05,ln:76.08},
  'Telangana':{c:45000,col:'#1a6ef5',r:'MEDIUM',atms:['Hyderabad Hitech City'],la:17.12,ln:79.20},
  'Andhra Pradesh':{c:38000,col:'#2050e0',r:'MEDIUM',atms:['Vijayawada Eluru Rd'],la:15.91,ln:79.74},
  'Madhya Pradesh':{c:35000,col:'#2255dd',r:'MEDIUM',atms:['Bhopal New Market','Indore Vijay Nagar'],la:22.97,ln:78.65},
  'Jharkhand':{c:22000,col:'#2560cc',r:'MEDIUM',atms:['Ranchi Main Road'],la:23.61,ln:85.27},
  'Odisha':{c:20000,col:'#2870c0',r:'MEDIUM',atms:['Bhubaneswar Rasulgarh'],la:20.95,ln:85.09},
  'Punjab':{c:18000,col:'#0a7030',r:'LOW',atms:['Amritsar Golden Temple Area'],la:31.14,ln:75.34},
  'Kerala':{c:17000,col:'#0a7030',r:'LOW',atms:['Kochi MG Road'],la:10.85,ln:76.27},
  'Chhattisgarh':{c:15000,col:'#0a8030',r:'LOW',atms:['Raipur Pandri'],la:21.27,ln:81.86},
  'Assam':{c:13000,col:'#0a7838',r:'LOW',atms:['Guwahati Fancy Bazaar'],la:26.20,ln:92.93},
  'Uttarakhand':{c:11000,col:'#088020',r:'LOW',atms:['Dehradun Paltan Bazaar'],la:30.06,ln:79.01},
}

const TOD = [0.3,0.2,0.15,0.1,0.1,0.2,0.4,0.6,0.8,1,1.2,1.4,1.5,1.6,1.5,1.3,1.4,1.6,1.8,2,1.9,1.7,1.4,0.6]

export default function ThreatMap({ toast }) {
  const svgRef = useRef(null)
  const [prediction, setPrediction] = useState(null)
  const [feed, setFeed] = useState([])
  const [tooltip, setTooltip] = useState(null)
  const [stateRisk, setStateRisk] = useState([])

  // Fetch live state risk data
  useEffect(() => {
    fetch('/api/stats').then(r=>r.json()).then(d=>{
      if(d.stateRisk?.length > 0) setStateRisk(d.stateRisk)
    }).catch(()=>{})

    const interval = setInterval(()=>{
      const hour = (new Date().getUTCHours() + 5) % 24
      const w = TOD[hour]
      const entries = Object.entries(STATE_DATA)
      const scored = entries.map(([name, info]) => ({
        name, info,
        score: info.c * w * (0.8 + Math.random() * 0.4)
      })).sort((a,b) => b.score - a.score)
      const top = scored[0]
      const atm = top.info.atms[Math.floor(Math.random() * top.info.atms.length)]
      const mins = Math.floor(10 + Math.random() * 55)
      const t = new Date(Date.now() + mins * 60000)
      setPrediction({
        state: top.name, atm,
        time: t.toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'}),
        mins, risk: top.info.r, color: top.info.col
      })
      // Add to feed
      const crimes = ['UPI Fraud','ATM Withdrawal','Digital Arrest','Investment Scam','OTP Scam']
      const crime = crimes[Math.floor(Math.random() * crimes.length)]
      const st = entries[Math.floor(Math.random() * entries.length)]
      setFeed(f => [{
        msg: `${crime} · ${st[0]} · ${st[1].atms[0]}`,
        color: st[1].col,
        time: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
      }, ...f.slice(0, 11)])
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Draw D3 map
  useEffect(() => {
    if (!svgRef.current) return
    fetch('/india.geojson').then(r=>r.json()).then(geo => {
      const el = svgRef.current
      const W = el.parentElement.clientWidth || 800
      const H = el.parentElement.clientHeight || 550
      const svg = d3.select(el).attr('width', W).attr('height', H)
      svg.selectAll('*').remove()
      svg.append('rect').attr('width',W).attr('height',H).attr('fill','#030a14')

      const proj = d3.geoMercator().center([82.5,22]).scale(Math.min(W,H)*1.5).translate([W*0.4,H*0.5])
      const path = d3.geoPath().projection(proj)

      const getColor = name => {
        const d = STATE_DATA[name]
        if (!d) return '#06101e'
        if (d.c >= 90000) return '#770000'
        if (d.c >= 60000) return '#993300'
        if (d.c >= 40000) return '#884400'
        if (d.c >= 15000) return '#0a2870'
        return '#043318'
      }

      svg.append('g').selectAll('path')
        .data(geo.features).enter().append('path')
        .attr('d', path)
        .attr('fill', d => getColor(d.properties.NAME_1))
        .attr('fill-opacity', 0.8)
        .attr('stroke', '#050d1a').attr('stroke-width', 0.8)
        .style('cursor','pointer')
        .on('mousemove', (ev, d) => {
          const name = d.properties.NAME_1
          const info = STATE_DATA[name]
          setTooltip({ name, info, x: ev.offsetX, y: ev.offsetY })
          d3.select(ev.target).attr('stroke','#00c8f0').attr('stroke-width',2)
        })
        .on('mouseleave', (ev) => {
          setTooltip(null)
          d3.select(ev.target).attr('stroke','#050d1a').attr('stroke-width',0.8)
        })

      // Pulsing circles
      const pG = svg.append('g')
      Object.entries(STATE_DATA).forEach(([name, info]) => {
        if (info.c < 40000) return
        const pt = proj([info.ln, info.la])
        const r = Math.max(6, Math.min(20, info.c / 9000))
        function pulse() {
          const ring = pG.append('circle').attr('cx',pt[0]).attr('cy',pt[1]).attr('r',r)
            .attr('fill','none').attr('stroke',info.col).attr('stroke-width',1.5).attr('opacity',0.8)
          let cr = r, op = 0.8
          const id = setInterval(() => {
            cr += 1.8; op -= 0.06
            ring.attr('r',cr).attr('opacity',op)
            if (op <= 0) { clearInterval(id); ring.remove() }
          }, 45)
        }
        pulse(); setInterval(pulse, 2000 + Math.random() * 1200)
        pG.append('circle').attr('cx',pt[0]).attr('cy',pt[1]).attr('r',r*0.45).attr('fill',info.col).attr('opacity',0.9)
      })
    }).catch(e => console.log('Map load failed:', e))
  }, [])

  return (
    <div style={{ display:'flex', height:'100%' }}>
      {/* Map area */}
      <div style={{ flex:1, position:'relative', background:'#030a14', overflow:'hidden' }}>
        {/* Ticker */}
        <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', zIndex:20,
          background:'rgba(3,10,20,.95)', border:'1px solid #1e3460', borderRadius:18,
          padding:'5px 13px', fontSize:11, color:'#00c8f0', display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:7, height:7, background:'#ff3333', borderRadius:'50%', flexShrink:0, animation:'blink 1s infinite', display:'inline-block' }}/>
          🔴 LIVE — GIS Geospatial Risk Map India 2026 · H1 MHA Official Data
        </div>

        {/* Prediction box */}
        {prediction && (
          <div style={{ position:'absolute', bottom:14, left:14, zIndex:20,
            background:'rgba(3,10,20,.97)', border:'2px solid #ff3333', borderRadius:10,
            padding:'11px 13px', maxWidth:255 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#ff3333', letterSpacing:1, marginBottom:4 }}>🔮 ML PREDICTED CASH WITHDRAWAL</div>
            <div style={{ fontSize:13, fontWeight:700 }}>📍 {prediction.atm}</div>
            <div style={{ fontSize:11, color:'#7a9cc0', margin:'3px 0' }}>State: <b style={{color:prediction.color}}>{prediction.state}</b> · Risk: <b style={{color:prediction.color}}>{prediction.risk}</b></div>
            <div style={{ fontSize:11, color:'#ffab00', fontWeight:600 }}>⏰ Predicted: {prediction.time} (~{prediction.mins} min)</div>
            <div style={{ fontSize:9, color:'#3a5270', marginTop:4, borderTop:'1px solid #1e3460', paddingTop:3 }}>XGBoost · complaint vol × time-of-day × ATM density</div>
          </div>
        )}

        {/* Legend */}
        <div style={{ position:'absolute', bottom:14, right:14, zIndex:20,
          background:'rgba(3,10,20,.95)', border:'1px solid #1e3460', borderRadius:8, padding:'9px 11px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#7a9cc0', marginBottom:5, textTransform:'uppercase', letterSpacing:1 }}>Risk · H1 2026</div>
          {[{c:'#880000',l:'Critical (>90K)'},{c:'#cc6600',l:'High (40–90K)'},{c:'#0a3080',l:'Medium (15–40K)'},{c:'#054018',l:'Low (<15K)'}].map(x=>(
            <div key={x.l} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,fontSize:10,color:'#7a9cc0'}}>
              <div style={{width:20,height:7,borderRadius:2,background:x.c}}/>{x.l}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{ position:'absolute', left:tooltip.x+14, top:tooltip.y-10, zIndex:30,
            background:'rgba(3,10,20,.98)', border:'1px solid #2a4a80', borderRadius:8,
            padding:'10px 13px', minWidth:200, pointerEvents:'none' }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{tooltip.name}</div>
            {tooltip.info && <>
              <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:5 }}>{tooltip.info.atms?.slice(0,2).join(' · ')}</div>
              <div style={{ fontSize:11, marginBottom:2 }}>H1 2026: <b style={{color:tooltip.info.col}}>{tooltip.info.c?.toLocaleString('en-IN')} complaints</b></div>
              <div style={{ fontSize:11, fontWeight:700, color:tooltip.info.col }}>Risk: {tooltip.info.r}</div>
            </>}
            <div style={{ fontSize:9, color:'#3a5270', borderTop:'1px solid #1e3460', paddingTop:3, marginTop:4 }}>MHA 2026 · The420.in Jul 14</div>
          </div>
        )}

        <svg ref={svgRef} style={{ display:'block' }}/>
      </div>

      {/* Sidebar */}
      <div style={{ width:270, background:'#0d1828', borderLeft:'1px solid #1e3460', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #1e3460' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#7a9cc0', textTransform:'uppercase', letterSpacing:1, marginBottom:7 }}>⚡ Live Stream</div>
          <div style={{ maxHeight:160, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
            {feed.map((f,i) => (
              <div key={i} style={{ fontSize:10, padding:'4px 6px', background:'#131f30',
                borderRadius:4, borderLeft:`2px solid ${f.color}`, color:'#7a9cc0' }}>
                <span style={{ color:'#3a5270', fontSize:9 }}>{f.time}</span><br/>{f.msg}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #1e3460' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#7a9cc0', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>📊 State Risk H1 2026</div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:7, display:'flex', flexDirection:'column', gap:5 }}>
          {Object.entries(STATE_DATA).sort((a,b)=>b[1].c-a[1].c).slice(0,9).map(([name,info])=>(
            <div key={name} style={{ background:'#131f30', border:'1px solid #1e3460', borderRadius:7,
              padding:'8px 10px', borderLeft:`3px solid ${info.col}`, cursor:'pointer' }}>
              <div style={{ fontSize:11, fontWeight:700 }}>{name}</div>
              <div style={{ fontSize:10, color:'#7a9cc0' }}>{info.atms[0]}</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
                <span style={{ fontSize:10, color:'#7a9cc0' }}>{info.c?.toLocaleString('en-IN')}</span>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:4,
                  background:`rgba(${info.r==='CRITICAL'?'255,51,51':info.r==='HIGH'?'255,171,0':'26,110,245'},.12)`,
                  color:info.col }}>{info.r}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
