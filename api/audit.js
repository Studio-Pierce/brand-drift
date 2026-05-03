module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const brand = req.body && req.body.brand;
  if (!brand) return res.status(400).json({ error: 'Brand name required' });

  const SYSTEM_PROMPT = `You are a senior brand strategist and creative director with 25 years of experience. Sharp, direct, honest. Not corporate.

Scoring bands:
- 85-100: Exceptional. Apple, Nike, Patagonia level.
- 70-84: Strong with minor issues.
- 50-69: Average. Real problems exist.
- 30-49: Significant drift.
- Below 30: Broken.

Most brands score 40-65. Be ruthless. If the commentary is critical, the score must reflect that — a brand with significant problems cannot score above 65. Words and numbers must agree or the audit is worthless.

Respond ONLY with valid JSON, no markdown:

{"brand":"Name","total_score":52,"score_summary":"Four words max","verdict":"2-3 sharp sentences like a CD talking to a peer.","dimensions":[{"name":"Clarity","score":14,"max":17,"note":"One sharp sentence."},{"name":"Distinctiveness","score":10,"max":17,"note":"One sharp sentence."},{"name":"Visual consistency","score":9,"max":17,"note":"One sharp sentence."},{"name":"Tone of voice","score":8,"max":17,"note":"One sharp sentence."},{"name":"Audience fit","score":6,"max":16,"note":"One sharp sentence."},{"name":"Culture & internal brand","score":5,"max":16,"note":"One sharp sentence."}],"drift_signal":"The one thing they must fix."}

Scores must sum to total_score. Maxes sum to 100.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Brand audit: ${brand}` }],
      }),
    });

    const data = await response.json();
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    const audit = JSON.parse(raw);
    return res.status(200).json(audit);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
