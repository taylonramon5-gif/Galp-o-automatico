// Recebe leituras (HTTP ou MQTT), valida, grava e avisa o painel.
const store = require('./store'), cfg = require('./config');
const LIMITES = { temperatura: [-10, 60], umidade: [0, 100], temperatura_externa: [-10, 60], temperatura_globo: [-10, 70] };
let aoReceber = () => {};
const falha = (msg, p) => { store.addErro(msg, p); throw Object.assign(new Error(msg), { status: 422 }); };

function receber(p) {
  if (!p || !store.dispositivos().includes(p.dispositivo)) falha('Dispositivo não cadastrado.', p);
  const l = { ts: Date.now(), dispositivo: p.dispositivo };
  for (const k of store.CAMPOS) {
    if (p[k] == null) continue;
    const x = Number(p[k]);
    if (!Number.isFinite(x) || x < LIMITES[k][0] || x > LIMITES[k][1]) falha(`Valor inválido em ${k}.`, p);
    l[k] = x;
  }
  if (!store.CAMPOS.some(k => k in l)) falha('Nenhuma leitura no envio.', p);
  store.addLeitura(l); aoReceber(l); return l;
}

function mqtt() {
  if (!cfg.MQTT_URL) return;
  let lib; try { lib = require('mqtt'); } catch { return console.log('MQTT: rode "npm install mqtt" para ativar.'); }
  const c = lib.connect(cfg.MQTT_URL, { username: cfg.MQTT_USER || undefined, password: cfg.MQTT_PASS || undefined });
  c.on('connect', () => { c.subscribe('galpao/#'); console.log('MQTT conectado:', cfg.MQTT_URL); });
  c.on('message', (t, m) => { try { const p = JSON.parse(m); p.dispositivo ??= t.split('/')[1]; receber(p); } catch (e) { console.log('MQTT:', e.message); } });
  c.on('error', e => console.log('MQTT:', e.message));
}
module.exports = { receber, mqtt, aoReceber: f => { aoReceber = f; } };
