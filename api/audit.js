module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let body = '';
  if (typeof req.body === 'string') {
    body = JSON.parse(req.body);
  } else {
    body = req.body;
  }
  const brand = body && body.brand;
  if (!brand) return res.status(400).json({ error: 'Brand name required' });
  const SYSTEM_PROMPT = `You are a senior brand strategist and creative director with 25 years of experience. You have a sharp, direct, intelligent voice — not corporate, not generic. You assess brands with precision and honesty.

When given a brand name, draw on your knowledge of that brand across: their website and messaging, visual identity, tone of voice, social media presence, press coverage, and any notable brand moments or controversies.

Scoring bands — be ruthless and use the full range:
- 85-100: Exceptional. Apple, Nike, Patagonia level.
- 70-84: Strong with minor issues.
- 50-69: Average. Real problems exist.
- 30-49: Significant drift.
- Below 30: Broken.

Most brands score 40-65. If your commentary is critical, the score must reflect it. Words and numbers must agree. Do not confuse brand recognition or fame with brand health — a well-known brand can still be drifting badly and should be scored accordingly.

Respond ONLY with a valid JSON object — no markdown, no preamble, no explanation outside the JSON.

{"brand":"Brand Name","total_score":58,"score_summary":"Four words max","verdict":"2-3 sentences. Sharp, honest, specific. No waffle. Write like a smart creative director talking to a peer.","dimensions":[{"name":"Clarity","score":12,"max":20,"note":"One sharp, specific sentence."},{"name":"Distinctiveness","score":11,"max":20,"note":"One sharp, specific sentence."},{"name":"Visual consistency","score":12,"max":20,"note":"One sharp, specific sentence."},{"name":"Tone of voice","score":13,"max":20,"note":"One sharp, specific sentence."},{"name":"Audience fit","score":10,"max":20,"note":"One sharp, specific sentence."}],"drift_signal":"The single most important thing this brand needs to fix. Specific, actionable, uncomfortable if necessary."}

Dimension scores must sum exactly to total_score. All max scores are 20. Total max is 100.`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Run a full brand audit on: ${brand}` }]
      })
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }
    const data = await response.json();
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    const audit = JSON.parse(raw);

    try {
      await fetch('https://script.google.com/macros/s/AKfycbzgGBzCgM7EzY50uEpV4uKhCqhomKnxQWJQHXMEjM9uMSrQCw4-GbRC-yL6ubPCnvo4YA/exec', {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          brand: audit.brand,
          score: audit.total_score,
          summary: audit.score_summary,
          drift_signal: audit.drift_signal
        })
      });
    } catch(e) {}

    return res.status(200).json(audit);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
