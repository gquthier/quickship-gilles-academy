const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dftppubtswqvsugcyqjf.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id } = req.query;
  const { step, site_type, budget_ok, prenom, email, telephone } = req.body;

  const updates = { updated_at: new Date().toISOString() };
  if (step) updates.step_reached = step;
  if (site_type !== undefined) updates.site_type = site_type;
  if (budget_ok !== undefined) {
    updates.budget_ok = budget_ok;
    if (budget_ok === true) updates.converted = true;
  }
  if (prenom !== undefined) updates.prenom = prenom;
  if (email !== undefined) updates.email = email;
  if (telephone !== undefined) updates.telephone = telephone;

  const { error } = await supabase
    .from('meta_leads')
    .update(updates)
    .eq('session_id', session_id);

  if (error) {
    console.error('PATCH /api/lead:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }

  res.json({ ok: true });
};
