// GET /api/alerts - Returns recent alerts feed
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event) => {
  const params = event.queryStringParameters || {};
  const limit = parseInt(params.limit) || 20;
  const severity = params.severity;
  const since = params.since; // ISO timestamp for polling

  try {
    let query = supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity && severity !== 'all') query = query.eq('severity', severity.toUpperCase());
    if (since) query = query.gt('created_at', since);

    const { data, error } = await query;
    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify({ alerts: data || [], timestamp: new Date().toISOString() })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
