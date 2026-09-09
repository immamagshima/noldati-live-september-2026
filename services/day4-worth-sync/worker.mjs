const ids = ['morning', 'money', 'care', 'space', 'life'];
const ttl = 7 * 24 * 60 * 60 * 1000;
const allowedOrigins = new Set(['https://immamagshima.github.io', 'http://127.0.0.1:8794']);
const token = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...(allowedOrigins.has(origin) ? {'Access-Control-Allow-Origin': origin} : {}),
    };
    const respond = (body, status = 200) => new Response(JSON.stringify(body), {status, headers});
    if (origin && !allowedOrigins.has(origin)) return respond({error:'origin_not_allowed'}, 403);
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers});
    const url = new URL(request.url);
    if (url.pathname !== '/api/worth-field') return respond({error:'not_found'}, 404);
    if (!['GET', 'POST', 'DELETE'].includes(request.method)) return respond({error:'method_not_allowed'}, 405);
    try {
      let session = url.searchParams.get('session');
      if (request.method !== 'GET') {
        if (!request.headers.get('Content-Type')?.startsWith('application/json')) return respond({error:'json_required'}, 415);
        const text = await request.text();
        if (text.length > 1024) return respond({error:'too_large'}, 413);
        let payload;
        try { payload = JSON.parse(text); } catch { return respond({error:'invalid_json'}, 400); }
        session = payload?.session;
        if (!token(session) || !token(payload?.voter)) return respond({error:'invalid_token'}, 400);
        if (request.method === 'POST') {
          if (!ids.includes(payload.choice)) return respond({error:'invalid_choice'}, 400);
          await env.DB.batch([
            env.DB.prepare('DELETE FROM votes WHERE updated_at < ?').bind(Date.now() - ttl),
            env.DB.prepare('INSERT INTO votes(session,voter,choice,updated_at) VALUES(?,?,?,?) ON CONFLICT(session,voter) DO UPDATE SET choice=excluded.choice, updated_at=excluded.updated_at')
              .bind(session, payload.voter, payload.choice, Date.now()),
          ]);
        } else {
          await env.DB.prepare('DELETE FROM votes WHERE session=? AND voter=?').bind(session, payload.voter).run();
        }
      }
      if (!token(session)) return respond({error:'invalid_session'}, 400);
      const result = await env.DB.prepare('SELECT choice FROM votes WHERE session=? AND updated_at>=? ORDER BY updated_at').bind(session, Date.now() - ttl).all();
      const choices = result.results.map(row => row.choice);
      const counts = Object.fromEntries(ids.map(id => [id, 0]));
      for (const choice of choices) counts[choice]++;
      return respond({counts, choices, total:choices.length, updatedAt:Date.now()});
    } catch {
      return respond({error:'service_unavailable'}, 503);
    }
  },
};
