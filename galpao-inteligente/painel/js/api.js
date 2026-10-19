// Comunicação com o servidor: login, leituras e tempo real.
const Api = (() => {
  let token = localStorage.getItem('token') || '';
  const sair = () => { localStorage.removeItem('token'); location.reload(); };
  async function req(url, op = {}) {
    const r = await fetch(url, { method: op.method || 'GET', headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) }, body: op.body && JSON.stringify(op.body) });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 && token) { sair(); throw new Error('Sessão expirada.'); }
    if (!r.ok) throw new Error(d.erro || 'Erro ' + r.status);
    return d;
  }
  return {
    logado: () => !!token, sair,
    async login(usuario, senha) { const d = await req('/api/auth/login', { method: 'POST', body: { usuario, senha } }); token = d.token; localStorage.setItem('token', token); },
    ultima: () => req('/api/leituras/ultima'),
    leituras: h => req('/api/leituras?horas=' + h),
    eventos: fn => { const es = new EventSource('/api/eventos?token=' + encodeURIComponent(token)); es.onmessage = e => fn(JSON.parse(e.data)); return es; }
  };
})();
