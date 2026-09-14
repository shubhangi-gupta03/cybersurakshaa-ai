// ═══════════════════════════════════════════════════════════
// CyberSuraksha AI - Data Scraper
// Netlify Scheduled Function - runs every 5 minutes
// Sources: Google News RSS, The420.in, PIB RSS, Telegram
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── HELPER: Fetch with timeout ──
async function fetchWithTimeout(url, timeout = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'CyberSuraksha-Bot/2.0 (SIH2026 PS26184)' }
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ── HELPER: Parse RSS XML ──
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                   item.match(/<title>(.*?)<\/title>/) || [])[1] || '';
    const desc = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                  item.match(/<description>(.*?)<\/description>/) || [])[1] || '';
    const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || '';
    const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
    items.push({ title: stripHtml(title), description: stripHtml(desc), link, pubDate });
  }
  return items;
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

// ── HELPER: Extract numbers from text ──
function extractNumbers(text) {
  const result = {};
  // Complaints in lakh
  const complaintMatch = text.match(/(\d+\.?\d*)\s*lakh\s*(cyber)?crime?\s*complaints?/i) ||
                          text.match(/complaints?\s*(?:of|:)?\s*(\d+\.?\d*)\s*lakh/i);
  if (complaintMatch) result.complaints_lakh = parseFloat(complaintMatch[1]);

  // Loss in crore
  const lossMatch = text.match(/(?:loss|lost|cheated)\s*(?:of)?\s*(?:Rs\.?|₹)?\s*(\d+\.?\d*)\s*(?:crore|cr)/i) ||
                    text.match(/(?:Rs\.?|₹)\s*(\d+\.?\d*)\s*(?:crore|cr)\s*(?:loss|fraud)/i);
  if (lossMatch) result.losses_crore = parseFloat(lossMatch[1]);

  // Frozen/recovered amount
  const frozenMatch = text.match(/(?:frozen|blocked|recovered)\s*(?:Rs\.?|₹)?\s*(\d+\.?\d*)\s*(?:crore|cr|lakh)/i);
  if (frozenMatch) result.frozen_amount = parseFloat(frozenMatch[1]);

  return result;
}

// ── HELPER: Detect state from text ──
const STATES = {
  'uttar pradesh': 'Uttar Pradesh', 'up': 'Uttar Pradesh', 'lucknow': 'Uttar Pradesh', 'noida': 'Uttar Pradesh',
  'maharashtra': 'Maharashtra', 'mumbai': 'Maharashtra', 'pune': 'Maharashtra',
  'karnataka': 'Karnataka', 'bengaluru': 'Karnataka', 'bangalore': 'Karnataka',
  'gujarat': 'Gujarat', 'ahmedabad': 'Gujarat', 'surat': 'Gujarat',
  'bihar': 'Bihar', 'patna': 'Bihar',
  'delhi': 'Delhi', 'new delhi': 'Delhi',
  'rajasthan': 'Rajasthan', 'jaipur': 'Rajasthan',
  'west bengal': 'West Bengal', 'kolkata': 'West Bengal',
  'telangana': 'Telangana', 'hyderabad': 'Telangana',
  'tamil nadu': 'Tamil Nadu', 'chennai': 'Tamil Nadu',
  'haryana': 'Haryana', 'gurugram': 'Haryana', 'gurgaon': 'Haryana',
  'andhra pradesh': 'Andhra Pradesh', 'madhya pradesh': 'Madhya Pradesh',
  'kerala': 'Kerala', 'punjab': 'Punjab', 'assam': 'Assam',
  'jharkhand': 'Jharkhand', 'odisha': 'Odisha', 'uttarakhand': 'Uttarakhand'
};

function detectState(text) {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(STATES)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

// ── HELPER: Detect crime type ──
function detectCrimeType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('investment') || lower.includes('trading') || lower.includes('crypto')) return 'Investment Scam';
  if (lower.includes('digital arrest') || lower.includes('fake cbi') || lower.includes('fake ed')) return 'Digital Arrest';
  if (lower.includes('upi') || lower.includes('payment fraud') || lower.includes('bank fraud')) return 'UPI/Payment Fraud';
  if (lower.includes('otp') || lower.includes('sim swap')) return 'OTP/SIM Swap';
  if (lower.includes('loan app') || lower.includes('fake app')) return 'Fake Loan App';
  if (lower.includes('sextortion') || lower.includes('blackmail')) return 'Sextortion';
  if (lower.includes('atm') || lower.includes('cash withdrawal')) return 'ATM Fraud';
  return 'Cybercrime';
}

// ── HELPER: Detect severity ──
function detectSeverity(text, numbers) {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('crore') || (numbers.losses_crore && numbers.losses_crore > 10)) return 'CRITICAL';
  if (lower.includes('arrested') || lower.includes('gang') || lower.includes('lakh')) return 'HIGH';
  if (lower.includes('warning') || lower.includes('alert') || lower.includes('fraud')) return 'WARNING';
  return 'INFO';
}

// ── SOURCE 1: Google News RSS ──
async function scrapeGoogleNews() {
  const queries = [
    'cybercrime+india+2026',
    'UPI+fraud+india',
    'digital+arrest+india',
    'cyber+fraud+arrested+india',
    'I4C+MHA+cybercrime'
  ];

  const alerts = [];

  for (const query of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
      const res = await fetchWithTimeout(url, 6000);
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRSS(xml);

      for (const item of items.slice(0, 3)) {
        const combined = item.title + ' ' + item.description;
        const numbers = extractNumbers(combined);
        const state = detectState(combined);
        const crimeType = detectCrimeType(combined);
        const severity = detectSeverity(combined, numbers);

        // Only store if published in last 6 hours
        const pubTime = item.pubDate ? new Date(item.pubDate) : new Date();
        const hoursAgo = (Date.now() - pubTime.getTime()) / 3600000;
        if (hoursAgo > 6) continue;

        alerts.push({
          title: item.title.slice(0, 500),
          description: item.description.slice(0, 1000),
          severity,
          state,
          crime_type: crimeType,
          amount_crore: numbers.losses_crore || null,
          source: 'Google News',
          source_url: item.link,
          raw_text: combined.slice(0, 2000),
          created_at: pubTime.toISOString()
        });
      }
    } catch (e) {
      console.log(`Google News query ${query} failed:`, e.message);
    }
  }

  return alerts;
}

// ── SOURCE 2: PIB RSS ──
async function scrapePIB() {
  const alerts = [];
  try {
    const url = 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3';
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return alerts;
    const xml = await res.text();
    const items = parseRSS(xml);

    for (const item of items.slice(0, 5)) {
      const combined = item.title + ' ' + item.description;
      if (!combined.toLowerCase().match(/cyber|ncrp|cfcfrms|i4c|fraud|digital arrest/)) continue;

      const numbers = extractNumbers(combined);
      const state = detectState(combined);

      // Check if this is newer than what we have
      const pubTime = item.pubDate ? new Date(item.pubDate) : new Date();

      alerts.push({
        title: '[PIB Official] ' + item.title.slice(0, 450),
        description: item.description.slice(0, 1000),
        severity: 'INFO',
        state,
        crime_type: 'Government Update',
        amount_crore: numbers.losses_crore || numbers.frozen_amount || null,
        source: 'PIB - Press Information Bureau',
        source_url: item.link,
        raw_text: combined.slice(0, 2000),
        created_at: pubTime.toISOString()
      });
    }
  } catch (e) {
    console.log('PIB scrape failed:', e.message);
  }
  return alerts;
}

// ── SOURCE 3: The420.in RSS ──
async function scrapeThe420() {
  const alerts = [];
  try {
    const url = 'https://the420.in/feed/';
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return alerts;
    const xml = await res.text();
    const items = parseRSS(xml);

    for (const item of items.slice(0, 5)) {
      const combined = item.title + ' ' + item.description;
      const numbers = extractNumbers(combined);
      const state = detectState(combined);
      const crimeType = detectCrimeType(combined);

      const pubTime = item.pubDate ? new Date(item.pubDate) : new Date();
      const hoursAgo = (Date.now() - pubTime.getTime()) / 3600000;
      if (hoursAgo > 24) continue;

      alerts.push({
        title: '[The420.in] ' + item.title.slice(0, 470),
        description: item.description.slice(0, 1000),
        severity: detectSeverity(combined, numbers),
        state,
        crime_type: crimeType,
        amount_crore: numbers.losses_crore || null,
        source: 'The420.in',
        source_url: item.link,
        raw_text: combined.slice(0, 2000),
        created_at: pubTime.toISOString()
      });
    }
  } catch (e) {
    console.log('The420.in scrape failed:', e.message);
  }
  return alerts;
}

// ── SOURCE 4: Telegram Public Channels via t.me/s/ ──
async function scrapeTelegram() {
  const channels = ['cyberdost', 'the420in', 'cyberpeacefoundation'];
  const alerts = [];

  for (const channel of channels) {
    try {
      // Telegram web preview - public channels accessible without API
      const url = `https://t.me/s/${channel}`;
      const res = await fetchWithTimeout(url, 6000);
      if (!res.ok) continue;
      const html = await res.text();

      // Extract messages from Telegram web
      const msgRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
      const dateRegex = /<time[^>]*datetime="([^"]+)"/g;

      const messages = [];
      let m;
      while ((m = msgRegex.exec(html)) !== null) {
        messages.push(stripHtml(m[1]).trim());
      }

      const dates = [];
      let d;
      while ((d = dateRegex.exec(html)) !== null) {
        dates.push(d[1]);
      }

      // Process last 5 messages
      for (let i = 0; i < Math.min(messages.length, 5); i++) {
        const text = messages[i];
        if (!text || text.length < 20) continue;
        if (!text.toLowerCase().match(/fraud|cyber|arrest|crore|lakh|scam|victim/)) continue;

        const msgDate = dates[i] ? new Date(dates[i]) : new Date();
        const hoursAgo = (Date.now() - msgDate.getTime()) / 3600000;
        if (hoursAgo > 12) continue;

        const numbers = extractNumbers(text);
        const state = detectState(text);
        const crimeType = detectCrimeType(text);

        alerts.push({
          title: `[Telegram @${channel}] ` + text.slice(0, 200),
          description: text.slice(0, 1000),
          severity: detectSeverity(text, numbers),
          state,
          crime_type: crimeType,
          amount_crore: numbers.losses_crore || null,
          source: `Telegram @${channel}`,
          source_url: `https://t.me/${channel}`,
          raw_text: text.slice(0, 2000),
          created_at: msgDate.toISOString()
        });
      }
    } catch (e) {
      console.log(`Telegram ${channel} failed:`, e.message);
    }
  }
  return alerts;
}

// ── DEDUPLICATION: Check if alert already exists ──
async function isDuplicate(title) {
  const { data } = await supabase
    .from('alerts')
    .select('id')
    .ilike('title', `%${title.slice(20, 60)}%`)
    .gte('created_at', new Date(Date.now() - 86400000).toISOString())
    .limit(1);
  return data && data.length > 0;
}

// ── UPDATE STATE RISK SCORES ──
async function updateStateRisk(alerts) {
  const stateAlertCount = {};
  for (const alert of alerts) {
    if (alert.state) {
      stateAlertCount[alert.state] = (stateAlertCount[alert.state] || 0) + 1;
    }
  }
  for (const [state, count] of Object.entries(stateAlertCount)) {
    if (count > 0) {
      await supabase.from('state_risk')
        .update({ updated_at: new Date().toISOString() })
        .eq('state', state);
    }
  }
}

// ── MAIN HANDLER ──
export const handler = async (event) => {
  console.log('CyberSuraksha scraper started:', new Date().toISOString());

  try {
    // Run all scrapers in parallel
    const [googleAlerts, pibAlerts, the420Alerts, telegramAlerts] = await Promise.allSettled([
      scrapeGoogleNews(),
      scrapePIB(),
      scrapeThe420(),
      scrapeTelegram()
    ]);

    // Combine all alerts
    const allAlerts = [
      ...(googleAlerts.status === 'fulfilled' ? googleAlerts.value : []),
      ...(pibAlerts.status === 'fulfilled' ? pibAlerts.value : []),
      ...(the420Alerts.status === 'fulfilled' ? the420Alerts.value : []),
      ...(telegramAlerts.status === 'fulfilled' ? telegramAlerts.value : [])
    ];

    console.log(`Found ${allAlerts.length} potential alerts`);

    // Insert non-duplicate alerts
    let inserted = 0;
    for (const alert of allAlerts) {
      const dup = await isDuplicate(alert.title);
      if (!dup) {
        const { error } = await supabase.from('alerts').insert(alert);
        if (!error) inserted++;
      }
    }

    // Update state risk scores
    await updateStateRisk(allAlerts);

    console.log(`Inserted ${inserted} new alerts`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        found: allAlerts.length,
        inserted,
        timestamp: new Date().toISOString()
      })
    };
  } catch (e) {
    console.error('Scraper error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
