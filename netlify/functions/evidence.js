// POST /api/evidence - Store evidence hash to Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const body = JSON.parse(event.body);
    const { caseId, fileName, fileSize, fileType, sha256Hash, polygonTxHash, loggedBy, role, metadata } = body;

    if (!sha256Hash || !fileName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'sha256Hash and fileName required' }) };
    }

    const { data, error } = await supabase.from('evidence_chain').insert({
      case_id: caseId || `CASE-${Date.now()}`,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      sha256_hash: sha256Hash,
      polygon_tx_hash: polygonTxHash || null,
      logged_by: loggedBy || 'Unknown',
      role: role || 'lea',
      metadata: metadata || {}
    }).select().single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, evidence: data })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
