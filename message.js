
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const { profile = {}, messageType = 'morning' } = req.body || {};
    const name = profile.firstName || 'Friend';
    const role = profile.role || 'healthcare professional';
    const shift = profile.shift || 'variable';
    const tone = profile.tone || 'gentle';
    const challenge1 = profile.challenge1 || '';
    const challenge2 = profile.challenge2 || '';

    const system = `You are a warm, concise resilience coach for healthcare & shift workers. Keep outputs under 90 words. Avoid clichés and medical claims. Sound like a trusted colleague.`;
    const typePrompt = messageType === 'morning'
      ? `Give a morning boost with one tiny action for the first part of the shift.`
      : messageType === 'midshift'
      ? `Give a mid-shift reset that can be done in under 60 seconds at a workstation.`
      : `Help them mentally clock out after the shift with one simple recovery action at home.`;

    const user = `Name: ${name}
Role: ${role}
Shift pattern: ${shift}
Preferred tone: ${tone}
Top challenges: ${challenge1}; ${challenge2}
Write the message in UK English, specific to ${role} and ${shift} shifts. Avoid generic motivational quotes. Do not exceed 90 words.
${typePrompt}`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.8,
        max_tokens: 160
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      return res.status(502).json({ error: 'Upstream error', detail: t });
    }
    const data = await resp.json();
    const message = data.choices?.[0]?.message?.content || 'Take one deep breath and have a sip of water. Small resets add up.';
    return res.status(200).json({ message });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
