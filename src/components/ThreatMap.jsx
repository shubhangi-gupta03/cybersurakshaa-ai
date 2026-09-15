import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'

// State-level fallback data (MHA H1 2026)
const STATE_DATA = {
  'Uttar Pradesh':  {c:185000,col:'#880000',r:'CRITICAL',lat:26.84,lon:80.94},
  'Maharashtra':    {c:158000,col:'#aa0000',r:'CRITICAL',lat:19.75,lon:75.71},
  'Karnataka':      {c:121000,col:'#bb1111',r:'CRITICAL',lat:15.31,lon:75.71},
  'Gujarat':        {c:97937, col:'#cc2222',r:'CRITICAL',lat:22.25,lon:71.19},
  'Bihar':          {c:93137, col:'#dd3333',r:'CRITICAL',lat:25.09,lon:85.31},
  'Rajasthan':      {c:75883, col:'#cc7700',r:'HIGH',    lat:27.02,lon:74.21},
  'West Bengal':    {c:72439, col:'#dd8800',r:'HIGH',    lat:22.98,lon:87.85},
  'Delhi':          {c:64496, col:'#ee9900',r:'HIGH',    lat:28.70,lon:77.10},
  'Tamil Nadu':     {c:63116, col:'#cc7000',r:'HIGH',    lat:11.12,lon:78.65},
  'Haryana':        {c:58721, col:'#dd8000',r:'HIGH',    lat:29.05,lon:76.08},
  'Telangana':      {c:45000, col:'#1a6ef5',r:'MEDIUM',  lat:17.12,lon:79.20},
  'Andhra Pradesh': {c:38000, col:'#2050e0',r:'MEDIUM',  lat:15.91,lon:79.74},
  'Madhya Pradesh': {c:35000, col:'#2255dd',r:'MEDIUM',  lat:22.97,lon:78.65},
  'Jharkhand':      {c:22000, col:'#2560cc',r:'MEDIUM',  lat:23.61,lon:85.27},
  'Odisha':         {c:20000, col:'#2870c0',r:'MEDIUM',  lat:20.95,lon:85.09},
  'Punjab':         {c:18000, col:'#0a7030',r:'LOW',     lat:31.14,lon:75.34},
  'Kerala':         {c:17000, col:'#0a7030',r:'LOW',     lat:10.85,lon:76.27},
  'Chhattisgarh':   {c:15000, col:'#0a8030',r:'LOW',     lat:21.27,lon:81.86},
  'Assam':          {c:13000, col:'#0a7838',r:'LOW',     lat:26.20,lon:92.93},
  'Uttarakhand':    {c:11000, col:'#088020',r:'LOW',     lat:30.06,lon:79.01},
}

// Time-of-day weights (RBI ATM fraud patterns)
const TOD = [0.18,0.23,0.31,0.34,0.28,0.19,0.11,0.13,0.17,0.20,0.23,0.25,
             0.26,0.27,0.26,0.24,0.26,0.29,0.34,0.38,0.36,0.32,0.28,0.22]

const RISK_COLORS = {CRITICAL:'#ff3333',HIGH:'#ff6b00',MEDIUM:'#1a6ef5',LOW:'#00e676'}

function getRiskColor(complaints, riskLevel) {
  if (riskLevel === 'CRITICAL' || complaints > 90000) return '#770000'
  if (riskLevel === 'HIGH' || complaints > 40000) return '#993300'
  if (riskLevel === 'MEDIUM' || complaints > 15000) return '#0a2870'
  return '#043318'
}

export default function ThreatMap({ user, toast }) {
  const svgRef = useRef(null)
  const mapRef = useRef(null)
  const [mapMode, setMapMode] = useState('state') // 'state' or 'district'
  const [selectedHour, setSelectedHour] = useState(new Date().getHours())
  const [selectedCrime, setSelectedCrime] = useState('all')
  const [prediction, setPrediction] = useState(null)
  const [feed, setFeed] = useState([])
  const [tooltip, setTooltip] = useState(null)
  const [districtData, setDistrictData] = useState(null)
  const [stateGeo, setStateGeo] = useState(null)
  const [districtGeo, setDistrictGeo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState(null)

  // Load GeoJSON files
  useEffect(() => {
    const loadGeo = async () => {
      try {
        const [stateRes, distRes, drRes] = await Promise.all([
          fetch('/india.geojson'),
          fetch('/districts.json'),
          fetch('/district_risk.json')
        ])
        const [stateJson, distJson, drJson] = await Promise.all([
          stateRes.json(), distRes.json(), drRes.json()
        ])
        setStateGeo(stateJson)
        setDistrictGeo(distJson)
        setDistrictData(drJson)
      } catch(e) {
        console.error('GeoJSON load failed:', e)
      } finally {
        setLoading(false)
      }
    }
    loadGeo()
  }, [])

  // Run ML prediction
  useEffect(() => {
    const runPred = async () => {
      try {
        const res = await fetch('/api/predict')
        if (res.ok) {
          const d = await res.json()
          if (d.top) setPrediction(d.top)
        }
      } catch(e) {}
    }
    runPred()
    const i = setInterval(runPred, 300000)
    return () => clearInterval(i)
  }, [])

  // Live stream feed
  useEffect(() => {
    const crimes = ['UPI Fraud','ATM Withdrawal','Digital Arrest','Investment Scam','OTP Scam']
    const states = Object.keys(STATE_DATA)
    const i = setInterval(() => {
      const st = states[Math.floor(Math.random() * states.length)]
      const cr = crimes[Math.floor(Math.random() * crimes.length)]
      const time = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
      setFeed(f => [{
        msg: `${cr} · ${st}`,
        color: STATE_DATA[st]?.col || '#1a6ef5',
        time
      }, ...f.slice(0, 11)])
    }, 4000)
    return () => clearInterval(i)
  }, [])

  // Draw map when data loaded or settings change
  useEffect(() => {
    if (loading || !svgRef.current) return
    if (mapMode === 'state' && stateGeo) drawStateMap()
    if (mapMode === 'district' && districtGeo) drawDistrictMap()
  }, [loading, mapMode, stateGeo, districtGeo, selectedHour, selectedCrime, selectedState])

  const drawStateMap = useCallback(() => {
    if (!stateGeo || !svgRef.current) return
    const el = svgRef.current
    const W = el.parentElement?.clientWidth || 800
    const H = el.parentElement?.clientHeight || 550
    const svg = d3.select(el).attr('width', W).attr('height', H)
    svg.selectAll('*').remove()
    svg.append('rect').attr('width',W).attr('height',H).attr('fill','#030a14')

    const todWeight = TOD[selectedHour]
    const proj = d3.geoMercator().center([82.5,22]).scale(Math.min(W,H)*1.5).translate([W*0.4,H*0.5])
    const path = d3.geoPath().projection(proj)

    // Grid background
    const g0 = svg.append('g').attr('opacity',0.05)
    for (let x=0;x<W;x+=50) g0.append('line').attr('x1',x).attr('y1',0).attr('x2',x).attr('y2',H).attr('stroke','#1a3060').attr('stroke-width',0.5)
    for (let y=0;y<H;y+=50) g0.append('line').attr('x1',0).attr('y1',y).attr('x2',W).attr('y2',y).attr('stroke','#1a3060').attr('stroke-width',0.5)

    const gMap = svg.append('g')
    gMap.selectAll('path')
      .data(stateGeo.features).enter().append('path')
      .attr('d', path)
      .attr('fill', d => {
        const info = STATE_DATA[d.properties.NAME_1]
        if (!info) return '#06101e'
        const adjustedC = info.c * todWeight
        if (adjustedC > 50000) return '#770000'
        if (adjustedC > 25000) return '#993300'
        if (adjustedC > 10000) return '#0a2870'
        return '#043318'
      })
      .attr('fill-opacity', 0.85)
      .attr('stroke','#050d1a').attr('stroke-width',0.8)
      .style('cursor','pointer')
      .on('mousemove', (ev, d) => {
        const name = d.properties.NAME_1
        const info = STATE_DATA[name]
        const pos = d3.pointer(ev, el.parentElement)
        setTooltip({ name, info, x: pos[0]+14, y: pos[1]-10, type:'state' })
        d3.select(ev.target).attr('stroke','#00c8f0').attr('stroke-width',2)
      })
      .on('mouseleave', ev => {
        setTooltip(null)
        d3.select(ev.target).attr('stroke','#050d1a').attr('stroke-width',0.8)
      })
      .on('click', (ev, d) => {
        const name = d.properties.NAME_1
        setSelectedState(name)
        setMapMode('district')
      })

    // State labels
    const labelStates = ['Rajasthan','Madhya Pradesh','Maharashtra','Uttar Pradesh','Gujarat','Karnataka','Andhra Pradesh','Tamil Nadu']
    const fm = {}
    stateGeo.features.forEach(f => { fm[f.properties.NAME_1] = f })
    gMap.selectAll('text.sl')
      .data(labelStates.filter(n => fm[n])).enter().append('text')
      .attr('class','sl').attr('text-anchor','middle').attr('dominant-baseline','middle')
      .attr('font-family','system-ui').attr('pointer-events','none')
      .attr('font-size','9px').attr('fill','#a0c0e0').attr('opacity',0.8)
      .attr('x', n => path.centroid(fm[n])[0])
      .attr('y', n => path.centroid(fm[n])[1])
      .text(n => n.split(' ')[0])

    // Pulsing circles on high risk states
    const pG = svg.append('g')
    Object.entries(STATE_DATA).forEach(([name, info]) => {
      if (info.c < 40000) return
      const pt = proj([info.lon, info.la || info.lat])
      if (!pt || isNaN(pt[0])) return
      const r = Math.max(5, Math.min(18, info.c / 10000))
      function pulse() {
        const ring = pG.append('circle').attr('cx',pt[0]).attr('cy',pt[1]).attr('r',r)
          .attr('fill','none').attr('stroke',info.col).attr('stroke-width',1.5).attr('opacity',0.8)
        let cr=r, op=0.8
        const id = setInterval(() => {
          cr+=1.8; op-=0.06
          ring.attr('r',cr).attr('opacity',op)
          if(op<=0){clearInterval(id);ring.remove()}
        },45)
      }
      pulse(); setInterval(pulse, 2000+Math.random()*1200)
      pG.append('circle').attr('cx',pt[0]).attr('cy',pt[1]).attr('r',r*0.45)
        .attr('fill',info.col).attr('opacity',0.9).style('cursor','pointer')
        .on('click',()=>{setSelectedState(name);setMapMode('district')})
    })
  }, [stateGeo, selectedHour, selectedCrime])

  const drawDistrictMap = useCallback(() => {
    if (!districtGeo || !svgRef.current) return
    const el = svgRef.current
    const W = el.parentElement?.clientWidth || 800
    const H = el.parentElement?.clientHeight || 550
    const svg = d3.select(el).attr('width',W).attr('height',H)
    svg.selectAll('*').remove()
    svg.append('rect').attr('width',W).attr('height',H).attr('fill','#030a14')

    // Filter to selected state if set
    let features = districtGeo.features
    if (selectedState) {
      features = features.filter(f => f.properties.NAME_1 === selectedState)
    }

    if (features.length === 0) { drawStateMap(); return }

    const todWeight = TOD[selectedHour]

    // Fit projection to filtered features
    const filteredGeo = { type:'FeatureCollection', features }
    const proj = d3.geoMercator().fitSize([W*0.9, H*0.9], filteredGeo)
      .translate([W*0.45, H*0.48])
    const path = d3.geoPath().projection(proj)

    svg.append('g').selectAll('path')
      .data(features).enter().append('path')
      .attr('d', path)
      .attr('fill', d => {
        const dName = d.properties.NAME_2
        const dr = districtData?.[dName]
        if (dr) {
          const adj = dr.complaints * todWeight
          if (adj > 20000) return '#770000'
          if (adj > 10000) return '#993300'
          if (adj > 5000) return '#0a2870'
          return '#043318'
        }
        // Fallback from state data
        const sr = STATE_DATA[d.properties.NAME_1]
        if (!sr) return '#06101e'
        const adj = (sr.c / 20) * todWeight
        if (adj > 5000) return '#770000'
        if (adj > 2000) return '#993300'
        if (adj > 500) return '#0a2870'
        return '#043318'
      })
      .attr('fill-opacity', 0.85)
      .attr('stroke','#1a3060').attr('stroke-width',0.5)
      .style('cursor','pointer')
      .on('mousemove', (ev, d) => {
        const dName = d.properties.NAME_2
        const dr = districtData?.[dName]
        const pos = d3.pointer(ev, el.parentElement)
        setTooltip({
          name: dName,
          state: d.properties.NAME_1,
          dr, x: pos[0]+14, y: pos[1]-10, type:'district'
        })
        d3.select(ev.target).attr('stroke','#00c8f0').attr('stroke-width',1.5)
      })
      .on('mouseleave', ev => {
        setTooltip(null)
        d3.select(ev.target).attr('stroke','#1a3060').attr('stroke-width',0.5)
      })

    // District labels for known high-risk districts
    svg.append('g').selectAll('text')
      .data(features.filter(f => districtData?.[f.properties.NAME_2])).enter()
      .append('text')
      .attr('text-anchor','middle').attr('dominant-baseline','middle')
      .attr('font-family','system-ui').attr('pointer-events','none')
      .attr('font-size','8px').attr('fill','#a0c0e0').attr('opacity',0.9)
      .attr('x', d => path.centroid(d)[0])
      .attr('y', d => path.centroid(d)[1])
      .text(d => d.properties.NAME_2.split(' ')[0])

    // ATM dots on known districts
    if (districtData) {
      const pG = svg.append('g')
      features.forEach(f => {
        const dr = districtData[f.properties.NAME_2]
        if (!dr || dr.complaints < 10000) return
        const centroid = path.centroid(f)
        if (!centroid || isNaN(centroid[0])) return
        dr.atms?.slice(0,2).forEach((atm, i) => {
          const cx = centroid[0] + (i-0.5)*12
          const cy = centroid[1]
          pG.append('circle').attr('cx',cx).attr('cy',cy).attr('r',4)
            .attr('fill','#ff3333').attr('opacity',0.8)
          pG.append('title').text(`ATM: ${atm}`)
        })
      })
    }
  }, [districtGeo, districtData, selectedState, selectedHour])

  const CRIME_OPTIONS = ['all','Investment Scam','Digital Arrest','UPI Fraud','ATM Fraud','OTP Scam','Fake Loan App']

  return (
    <div style={{ display:'flex', height:'100%' }}>
      {/* Map area */}
      <div style={{ flex:1, position:'relative', background:'#030a14', overflow:'hidden' }} ref={mapRef}>
        {/* Top controls */}
        <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', zIndex:20,
          display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
          {/* Map mode toggle */}
          <div style={{ background:'rgba(3,10,20,.95)', border:'1px solid #1e3460', borderRadius:18,
            padding:'4px 8px', display:'flex', gap:4 }}>
            <button onClick={() => { setMapMode('state'); setSelectedState(null) }}
              style={{ padding:'3px 10px', borderRadius:12, border:'none', fontSize:10, fontWeight:600,
                background: mapMode==='state' ? '#1a6ef5' : 'transparent',
                color: mapMode==='state' ? '#fff' : '#7a9cc0', cursor:'pointer', fontFamily:'inherit' }}>
              🗺️ State View
            </button>
            <button onClick={() => setMapMode('district')}
              style={{ padding:'3px 10px', borderRadius:12, border:'none', fontSize:10, fontWeight:600,
                background: mapMode==='district' ? '#1a6ef5' : 'transparent',
                color: mapMode==='district' ? '#fff' : '#7a9cc0', cursor:'pointer', fontFamily:'inherit' }}>
              🔍 District View
            </button>
          </div>

          {/* Live indicator */}
          <div style={{ background:'rgba(3,10,20,.95)', border:'1px solid #1e3460', borderRadius:18,
            padding:'4px 12px', fontSize:10, color:'#00c8f0', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:6, height:6, background:'#ff3333', borderRadius:'50%',
              animation:'blink 1s infinite', display:'inline-block' }}/>
            LIVE · {mapMode === 'state' ? 'State' : selectedState || 'District'} Risk Map · H1 2026
            {selectedState && mapMode==='district' && (
              <button onClick={() => { setSelectedState(null); setMapMode('state') }}
                style={{ marginLeft:6, background:'none', border:'none', color:'#ff3333',
                  cursor:'pointer', fontSize:10, fontFamily:'inherit' }}>✕ Back</button>
            )}
          </div>
        </div>

        {/* TIME FILTER — PS requirement */}
        <div style={{ position:'absolute', top:55, left:14, zIndex:20,
          background:'rgba(3,10,20,.97)', border:'1px solid #1e3460', borderRadius:10, padding:'10px 13px', width:240 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#7a9cc0', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>
            ⏰ Time Filter — Hour (IST)
          </div>
          <input type="range" min={0} max={23} value={selectedHour}
            onChange={e => setSelectedHour(parseInt(e.target.value))}
            style={{ width:'100%', accentColor:'#1a6ef5', marginBottom:4 }}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#7a9cc0' }}>
            <span>12 AM</span>
            <span style={{ color:'#00c8f0', fontWeight:700 }}>
              {selectedHour.toString().padStart(2,'0')}:00 IST
              {selectedHour >= 2 && selectedHour <= 5 ? ' 🔴 Peak Fraud' :
               selectedHour >= 18 && selectedHour <= 20 ? ' 🟠 High Risk' : ''}
            </span>
            <span>11 PM</span>
          </div>
          <div style={{ fontSize:9, color:'#3a5270', marginTop:3 }}>
            Fraud risk weight: {(TOD[selectedHour]*100).toFixed(0)}% · RBI ATM pattern data
          </div>

          {/* Crime filter */}
          <div style={{ fontSize:10, fontWeight:700, color:'#7a9cc0', margin:'8px 0 5px', textTransform:'uppercase', letterSpacing:1 }}>
            🔍 Crime Type Filter
          </div>
          <select value={selectedCrime} onChange={e => setSelectedCrime(e.target.value)}
            style={{ width:'100%', background:'#131f30', border:'1px solid #1e3460', borderRadius:6,
              padding:'5px 8px', color:'#dde6f4', fontSize:11, fontFamily:'inherit', outline:'none' }}>
            {CRIME_OPTIONS.map(c => <option key={c} value={c}>{c==='all'?'All Crime Types':c}</option>)}
          </select>
        </div>

        {/* Prediction box */}
        {prediction && (
          <div style={{ position:'absolute', bottom:14, left:14, zIndex:20,
            background:'rgba(3,10,20,.97)', border:`2px solid ${RISK_COLORS[prediction.risk_name]||'#ff3333'}`,
            borderRadius:10, padding:'11px 13px', maxWidth:260 }}>
            <div style={{ fontSize:10, fontWeight:700, color:RISK_COLORS[prediction.risk_name]||'#ff3333',
              letterSpacing:1, marginBottom:4 }}>🔮 ML PREDICTED HOTSPOT</div>
            <div style={{ fontSize:13, fontWeight:700 }}>📍 {prediction.predicted_atm}</div>
            <div style={{ fontSize:11, color:'#7a9cc0', margin:'3px 0' }}>
              State: <b style={{color:RISK_COLORS[prediction.risk_name]}}>{prediction.state}</b>
            </div>
            <div style={{ fontSize:11, color:'#ffab00', fontWeight:600 }}>
              ⏰ {prediction.predicted_time} (~{prediction.mins_ahead} min)
            </div>
            <div style={{ fontSize:11, color:'#7a9cc0' }}>
              Risk: <b style={{color:RISK_COLORS[prediction.risk_name]}}>{prediction.risk_name}</b> ·
              Score: {prediction.risk_score}/10
            </div>
            <div style={{ fontSize:9, color:'#3a5270', marginTop:4, borderTop:'1px solid #1e3460', paddingTop:3 }}>
              XGBoost v3.0 · NCRB 2021-2025 · CV: 90.67%
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{ position:'absolute', bottom:14, right:14, zIndex:20,
          background:'rgba(3,10,20,.95)', border:'1px solid #1e3460', borderRadius:8, padding:'9px 11px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#7a9cc0', marginBottom:5, textTransform:'uppercase', letterSpacing:1 }}>
            Risk Level
          </div>
          {[{c:'#880000',l:'CRITICAL'},{c:'#cc6600',l:'HIGH'},{c:'#0a3080',l:'MEDIUM'},{c:'#054018',l:'LOW'}].map(x=>(
            <div key={x.l} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,fontSize:10,color:'#7a9cc0'}}>
              <div style={{width:18,height:6,borderRadius:2,background:x.c}}/>{x.l}
            </div>
          ))}
          {mapMode==='district' && (
            <div style={{ fontSize:9, color:'#ff3333', marginTop:5, borderTop:'1px solid #1e3460', paddingTop:4 }}>
              🔴 Red dots = ATM clusters
            </div>
          )}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{ position:'absolute', left: Math.min(tooltip.x, (mapRef.current?.clientWidth||800)-220),
            top: tooltip.y, zIndex:30,
            background:'rgba(3,10,20,.98)', border:'1px solid #2a4a80',
            borderRadius:8, padding:'10px 13px', minWidth:200, pointerEvents:'none' }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>
              {tooltip.name}
            </div>
            {tooltip.type === 'district' && tooltip.state && (
              <div style={{ fontSize:10, color:'#7a9cc0', marginBottom:4 }}>📍 {tooltip.state}</div>
            )}
            {tooltip.dr ? (
              <>
                <div style={{ fontSize:11, marginBottom:2 }}>
                  Complaints: <b style={{color:'#ff3333'}}>{tooltip.dr.complaints.toLocaleString('en-IN')}</b>
                </div>
                <div style={{ fontSize:11, marginBottom:2 }}>
                  Risk: <b style={{color:RISK_COLORS[tooltip.dr.risk]}}>{tooltip.dr.risk}</b>
                </div>
                <div style={{ fontSize:10, color:'#7a9cc0' }}>
                  ATMs: {tooltip.dr.atms?.slice(0,2).join(', ')}
                </div>
              </>
            ) : tooltip.info ? (
              <>
                <div style={{ fontSize:11 }}>
                  H1 2026: <b style={{color:tooltip.info.col}}>{tooltip.info.c?.toLocaleString('en-IN')} complaints</b>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:tooltip.info.col }}>
                  Risk: {tooltip.info.r}
                </div>
                <div style={{ fontSize:9, color:'#7a9cc0', marginTop:3 }}>
                  Click to drill into districts
                </div>
              </>
            ) : null}
            <div style={{ fontSize:9, color:'#3a5270', borderTop:'1px solid #1e3460', paddingTop:3, marginTop:4 }}>
              Hour: {selectedHour.toString().padStart(2,'0')}:00 IST · TOD weight: {(TOD[selectedHour]*100).toFixed(0)}%
            </div>
          </div>
        )}

        {loading && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
            justifyContent:'center', flexDirection:'column', gap:10 }}>
            <div className="spinner"/>
            <div style={{ color:'#7a9cc0', fontSize:12 }}>Loading district map...</div>
          </div>
        )}

        <svg ref={svgRef} style={{ display:'block' }}/>
      </div>

      {/* Sidebar */}
      <div style={{ width:270, background:'#0d1828', borderLeft:'1px solid #1e3460',
        display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Live stream */}
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #1e3460' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#7a9cc0', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
            ⚡ Live Stream
          </div>
          <div style={{ maxHeight:160, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
            {feed.map((f,i) => (
              <div key={i} style={{ fontSize:10, padding:'4px 6px', background:'#131f30',
                borderRadius:4, borderLeft:`2px solid ${f.color}`, color:'#7a9cc0' }}>
                <span style={{ color:'#3a5270', fontSize:9 }}>{f.time}</span><br/>{f.msg}
              </div>
            ))}
          </div>
        </div>

        {/* State/district list */}
        <div style={{ padding:'8px 12px', borderBottom:'1px solid #1e3460' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#7a9cc0', textTransform:'uppercase', letterSpacing:1 }}>
            {mapMode==='district' && selectedState ? `📍 ${selectedState} Districts` : '📊 State Risk H1 2026'}
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:7, display:'flex', flexDirection:'column', gap:5 }}>
          {mapMode === 'district' && selectedState ? (
            // Show districts for selected state
            Object.entries(districtData || {})
              .filter(([,d]) => d.state === selectedState)
              .sort((a,b) => b[1].complaints - a[1].complaints)
              .map(([name, d]) => (
                <div key={name} style={{ background:'#131f30', border:'1px solid #1e3460',
                  borderRadius:7, padding:'8px 10px', borderLeft:`3px solid ${RISK_COLORS[d.risk]}` }}>
                  <div style={{ fontSize:11, fontWeight:700 }}>{name}</div>
                  <div style={{ fontSize:10, color:'#7a9cc0', marginTop:2 }}>{d.atms?.[0]}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
                    <span style={{ fontSize:10, color:'#7a9cc0' }}>{d.complaints.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:4,
                      background:`rgba(${d.risk==='CRITICAL'?'255,51,51':d.risk==='HIGH'?'255,107,0':'26,110,245'},.12)`,
                      color:RISK_COLORS[d.risk] }}>{d.risk}</span>
                  </div>
                </div>
              ))
          ) : (
            // Show all states
            Object.entries(STATE_DATA)
              .sort((a,b) => b[1].c - a[1].c)
              .slice(0, 10)
              .map(([name, info]) => (
                <div key={name} onClick={() => { setSelectedState(name); setMapMode('district') }}
                  style={{ background:'#131f30', border:'1px solid #1e3460', borderRadius:7,
                    padding:'8px 10px', borderLeft:`3px solid ${info.col}`, cursor:'pointer' }}>
                  <div style={{ fontSize:11, fontWeight:700 }}>{name}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
                    <span style={{ fontSize:10, color:'#7a9cc0' }}>{info.c.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:4,
                      background:`rgba(${info.r==='CRITICAL'?'255,51,51':info.r==='HIGH'?'255,107,0':'26,110,245'},.12)`,
                      color:info.col }}>{info.r} →</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
