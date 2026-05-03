export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brand } = req.body;
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
    { "name": "Tone of voice", "score": 13, "max":
