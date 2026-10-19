const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const cfg = require('./config'), auth = require('./auth'), store = require('./store'), ing = require('./ingestor');
const { avaliar } = require('./itgu');
const PUB = path.join(cfg.raiz, 'painel'), clientes = new Set();
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const CAB = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': cfg.CORS, 'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-device-token', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (res, codigo, obj) => { res.writeHead(codigo, CAB); res.end(JSON.stringify(obj)); };
const corpo = req => new Promise((ok, no) => {
  let b = '';
  req.on('data', d => { b += d; if (b.length > 1e5) { no(Object.assign(new Error('Envio grande demais.'), { status: 413 })); req.destroy(); } });
  req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch { no(Object.assign(new Error('JSON inválido.'), { status: 400 })); } });
});

async function rotas(req, res, url) {
  const p = url.pathname, m = req.method;
  if (p === '/api/saude') return json(res, 200, { status: 'ok', leituras: store.leituras.length, hora: new Date().toISOString() });
  if (p === '/api/auth/login' && m === 'POST') {
    if (!auth.limite(req.socket.remoteAddress)) return json(res, 429, { erro: 'Muitas tentativas. Aguarde 1 minuto.' });
    const { usuario, senha } = await corpo(req);
    const u = store.ler('usuarios.json', []).find(x => x.usuario === usuario);
    if (!u || !auth.confere(String(senha), u.hash)) return json(res, 401, { erro: 'Usuário ou senha incorretos.' });
    return json(res, 200, { token: auth.emitir(u), usuario: u.usuario, expira_min: cfg.JWT_EXPIRA_MIN });
  }
  if (p === '/api/leituras' && m === 'POST') { // envio do ESP
    if (req.headers['x-device-token'] !== cfg.DEVICE_TOKEN) return json(res, 401, { erro: 'Token do dispositivo inválido.' });
    return json(res, 201, ing.receber(await corpo(req)));
  }
  const bearer = (req.headers.authorization || '').slice(7);
  if (!auth.verificar(bearer || url.searchParams.get('token') || '')) return json(res, 401, { erro: 'Faça login para continuar.' });
  if (p === '/api/leituras/ultima') return json(res, 200, avaliar(store.ultima()));
  if (p === '/api/leituras') {
    const h = Math.min(+url.searchParams.get('horas') || 24, 168), lim = Date.now() - h * 3600000;
    const lista = store.leituras.filter(l => l.ts >= lim), passo = Math.ceil(lista.length / 400) || 1;
    return json(res, 200, lista.filter((_, i) => i % passo === 0));
  }
  if (p === '/api/dispositivos') return json(res, 200, store.dispositivos());
  if (p === '/api/eventos') { // tempo real (Server-Sent Events)
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 3000\n\n'); clientes.add(res); req.on('close', () => clientes.delete(res)); return;
  }
  json(res, 404, { erro: 'Rota não encontrada.' });
}

function estatico(res, url) {
  const rel = decodeURIComponent(url.pathname), f = path.join(PUB, rel.endsWith('/') ? rel + 'index.html' : rel);
  if (path.relative(PUB, f).startsWith('..')) { res.writeHead(403); return res.end('Acesso negado.'); }
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Página não encontrada.'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(b);
  });
}

ing.aoReceber(l => {
  const msg = `data: ${JSON.stringify({ leitura: l, avaliacao: avaliar(store.ultima()) })}\n\n`;
  clientes.forEach(c => c.write(msg));
});
setInterval(() => clientes.forEach(c => c.write(': ping\n\n')), 25000).unref();

if (!store.ler('usuarios.json', []).length) {
  store.gravar('usuarios.json', [{ usuario: cfg.ADMIN_USER, papel: 'admin', hash: auth.hash(cfg.ADMIN_PASS) }]);
  console.log(`Primeiro acesso → usuário: ${cfg.ADMIN_USER} | senha: ${cfg.ADMIN_PASS} (troque no .env e apague data/usuarios.json)`);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') { res.writeHead(204, CAB); return res.end(); }
    if (url.pathname.startsWith('/api/')) return await rotas(req, res, url);
    estatico(res, url);
  } catch (e) {
    json(res, e.status || 500, { erro: e.status ? e.message : 'Erro interno.' });
    if (!e.status) console.error(e);
  }
}).on('error', e => {
  console.log(e.code === 'EADDRINUSE' ? `A porta ${cfg.PORTA} já está em uso. Mude PORTA no arquivo .env.` : e.message);
  process.exit(1);
}).listen(cfg.PORTA, cfg.HOST, () => {
  console.log(`\nGalpão Inteligente no ar\n  Neste PC: http://localhost:${cfg.PORTA}`);
  for (const i of Object.values(os.networkInterfaces()).flat())
    if (i && [4, 'IPv4'].includes(i.family) && !i.internal) console.log(`  Na rede:  http://${i.address}:${cfg.PORTA}  (ESP: POST em /api/leituras)`);
  ing.mqtt();
});
