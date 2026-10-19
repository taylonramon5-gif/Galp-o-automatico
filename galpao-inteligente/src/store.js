// Persistência simples em arquivos (sem banco): leituras em JSONL, o resto em JSON.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cfg = require('./config');
fs.mkdirSync(cfg.DATA, { recursive: true });
const arq = n => path.join(cfg.DATA, n);
const ler = (n, padrao) => { try { return JSON.parse(fs.readFileSync(arq(n), 'utf8')); } catch { return padrao; } };
const gravar = (n, v) => fs.writeFileSync(arq(n), JSON.stringify(v, null, 2));
let segredo = cfg.JWT_SECRET;
if (!segredo) {
  try { segredo = fs.readFileSync(arq('segredo.txt'), 'utf8'); }
  catch { segredo = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(arq('segredo.txt'), segredo); }
}
const MAX = 20000, CAMPOS = ['temperatura', 'umidade', 'temperatura_externa', 'temperatura_globo'];
let leituras = [];
try {
  leituras = fs.readFileSync(arq('leituras.jsonl'), 'utf8').split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).slice(-MAX);
} catch {}
module.exports = {
  segredo, ler, gravar, leituras, CAMPOS,
  dispositivos: () => ler('dispositivos.json', ['esp01', 'esp02']),
  addLeitura(l) {
    leituras.push(l); if (leituras.length > MAX) leituras.shift();
    fs.appendFile(arq('leituras.jsonl'), JSON.stringify(l) + '\n', () => {});
  },
  addErro(erro, payload) { fs.appendFile(arq('erros_ingestao.jsonl'), JSON.stringify({ ts: Date.now(), erro, payload }) + '\n', () => {}); },
  // Último valor de cada campo, considerando só os últimos 5 minutos
  ultima() {
    const lim = Date.now() - 300000, r = { ts: 0 }, u = leituras[leituras.length - 1];
    if (u && u.ts >= lim) r.ts = u.ts;
    for (let i = leituras.length - 1; i >= 0 && leituras[i].ts >= lim; i--)
      for (const k of CAMPOS) if (r[k] == null && leituras[i][k] != null) r[k] = leituras[i][k];
    return r;
  }
};
