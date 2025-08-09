// server/cloudflare/worker.js
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST' }), {
        status: 405,
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      const { profile = {}, messageType = 'morning' } = await request.json();

      const name = profile.firstName || 'Friend';
      const role = profile.role || 'healthcare professional';
      const shift = profile.shift || 'variable';
      const tone = profile.tone || 'gentle';
      const challenge1 = profile.challenge1 || '';
      const challenge2 = profile.challenge2 || '';

      const systemPrompt =
        'You are a warm, concise resilience coach for healthcare & shift workers. ' +
        'Keep outputs under 90 words. Avoid clichés and medical claims. Sound like a trusted colleague. ' +
        'Write in UK English.';

      const typePrompt =
        messageType === 'morning'
          ? 'Give a morning boost with one tiny action for the first part of the shift.'
          : messageType === 'midshift'
          ? 'Give a mid-shift reset that can be done in under 60 seconds at a workstation.'
          : 'Help them mentally clock out after the shift with one simple recovery action at home.';

      const userPrompt = `Name: ${name}
Role: ${role}
Shift pattern: ${shift}
Preferred tone: ${tone}
Top challenges: ${challenge1}; ${challenge2}
Avoid generic motivational quotes. Do not exceed 90 words.
${typePrompt}`;

      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'OPENAI_API_KEY missing' }), {
          status: 500,
          headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 160
        })
      });

      if (!resp.ok) {
        const txt = await resp.text();
        return new Response(JSON.stringify({ error: 'Upstream error', detail: txt }), {
          status: 502,
          headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const data = await resp.json();
      const message =
        data?.choices?.[0]?.message?.content?.trim() ||
        'Take one deep breath and a sip of water. Small resets add up.';

      return new Response(JSON.stringify({ message }), {
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
