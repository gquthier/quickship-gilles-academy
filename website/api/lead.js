const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dftppubtswqvsugcyqjf.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id, prenom, email, telephone, utm_source, utm_campaign, utm_adset, utm_ad } = req.body;

  if (!session_id) return res.status(400).json({ error: 'session_id requis' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress;
  const user_agent = req.headers['user-agent'];

  const { data, error } = await supabase
    .from('meta_leads')
    .upsert({
      session_id,
      prenom: prenom || null,
      email: email || null,
      telephone: telephone || null,
      step_reached: 1,
      utm_source: utm_source || null,
      utm_campaign: utm_campaign || null,
      utm_adset: utm_adset || null,
      utm_ad: utm_ad || null,
      ip,
      user_agent,
    }, { onConflict: 'session_id', ignoreDuplicates: false })
    .select('id')
    .single();

  if (error) {
    console.error('POST /api/lead:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }

  res.json({ ok: true, id: data.id, session_id });
};
