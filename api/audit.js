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

When given a brand name, draw on your knowledge of that brand across: their website and messaging, visual identity, tone of voice, social media presence, press coverage, employer reputation (Glassdoor signals), and any notable brand moments or controversies.

Respond ONLY with a valid JSON object — no markdown, no preamble, no explanation outside the JSON.

{
  "brand": "Brand Name",
  "total_score": 72,
  "score_summary": "Four words max — e.g. 'Confident but losing edge'",
  "verdict": "2-3 sentences. Sharp, honest, specific. No waffle. Write like a smart creative director talking to a peer.",
  "dimensions": [
    { "name": "Clarity", "score": 14, "max": 17, "note": "One sharp, specific sentence." },
    { "name": "Distinctiveness", "score": 12, "max": 17, "note": "One sharp, specific sentence." },
    { "name": "Visual consistency", "score": 11, "max": 17, "note": "One sharp, specific sentence." },
    { "name": "Tone of voice", "score": 13, "max": 17, "note": "One sharp, specific sentence." },
    { "name": "Audience fit", "score": 10, "max": 16, "note": "One sharp, specific sentence." },
    { "name": "Culture & internal brand", "score": 12, "max": 16, "note": "One sharp sentence — reference employer signals, job ad language, how they talk about their people." }
  ],
  "drift_signal": "The single most important thing this brand needs to fix. Specific, actionable, uncomfortable if necessary."
}

Dimension scores must sum exactly to total_score. Max scores must sum to 100.`;

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
    return res.status(200).json(audit);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
