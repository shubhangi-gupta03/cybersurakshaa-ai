// GET /api/stats - Returns latest stats + state risk data
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const handler = async () => {
  try {
    // Get state risk scores
    const { data: stateRisk } = await supabase
      .from('state_risk')
      .select('*')
      .order('complaints', { ascending: false });

    // Get latest scraped stats
    const { data: latestStat } = await supabase
      .from('scraped_stats')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(1);

    // Get alert counts by severity in last 24 hours
    const { data: alertCounts } = await supabase
      .from('alerts')
      .select('severity')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    const counts = { CRITICAL: 0, HIGH: 0, WARNING: 0, INFO: 0 };
    (alertCounts || []).forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });

    // Base stats (MHA official H1 2026) + any scraped updates
    const baseStats = {
      complaints_h1_2026: 1271000,
      losses_crore: 10178,
      frozen_crore: 2968,
      cfcfrms_saved_crore: 11158,
      total_ncrp: 5300000,
      recovery_pct: 29.17,
      banks_integrated: 263,
      digital_arrests_2024: 123672,
      fir_rate: 1.4
    };

    // Override with scraped data if newer and valid
    if (latestStat && latestStat[0]) {
      const s = latestStat[0];
      if (s.complaints_h1_2026) baseStats.complaints_h1_2026 = s.complaints_h1_2026;
      if (s.losses_crore) baseStats.losses_crore = s.losses_crore;
      if (s.frozen_crore) baseStats.frozen_crore = s.frozen_crore;
      if (s.cfcfrms_saved_crore) baseStats.cfcfrms_saved_crore = s.cfcfrms_saved_crore;
    }

    // Trend data (NCRP annual - MHA Parliament data)
    const trend = [
      { year: '2021', complaints: 452000 },
      { year: '2022', complaints: 1029000 },
      { year: '2023', complaints: 1596000 },
      { year: '2024', complaints: 2268000 },
      { year: '2025', complaints: 2815000 },
      { year: '2026 H1', complaints: baseStats.complaints_h1_2026 }
    ];

    // Crime type breakdown
    const crimeTypes = [
      { name: 'Investment Scam', pct: 38, color: '#ff3333' },
      { name: 'Financial Fraud', pct: 20, color: '#1a6ef5' },
      { name: 'Digital Arrest', pct: 14, color: '#ffab00' },
      { name: 'Fake Loan App', pct: 12, color: '#00c8f0' },
      { name: 'OTP/SIM Swap', pct: 10, color: '#7b5ef8' },
      { name: 'Other', pct: 6, color: '#00e676' }
    ];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify({
        stats: baseStats,
        stateRisk: stateRisk || [],
        trend,
        crimeTypes,
        alertCounts: counts,
        lastUpdated: new Date().toISOString()
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
