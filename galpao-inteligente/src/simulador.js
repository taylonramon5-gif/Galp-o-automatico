// Faz o papel de um ESP: envia leituras de teste ao servidor (npm run simular).
const cfg = require('./config'), url = process.argv[2] || `http://localhost:${cfg.PORTA}`;
let t = 30;
async function enviar() {
  t = Math.min(38, Math.max(24, t + (Math.random() - .45) * .8));
  const corpo = { dispositivo: 'esp01', temperatura: +t.toFixed(1), umidade: Math.round(55 + Math.random() * 20), temperatura_externa: +(t - 3 + Math.random()).toFixed(1) };
  try {
    const r = await fetch(url + '/api/leituras', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-device-token': cfg.DEVICE_TOKEN }, body: JSON.stringify(corpo) });
    console.log(r.status, JSON.stringify(corpo));
  } catch (e) { console.log('Servidor fora do ar:', e.message); }
}
console.log('Simulando esp01 →', url); enviar(); setInterval(enviar, 3000);
