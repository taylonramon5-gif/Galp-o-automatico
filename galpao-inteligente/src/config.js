const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
try {
  for (const l of fs.readFileSync(path.join(raiz, '.env'), 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}
const e = process.env;
module.exports = {
  raiz, DATA: path.join(raiz, 'data'),
  PORTA: +e.PORTA || 3000, HOST: e.HOST || '0.0.0.0',
  JWT_SECRET: e.JWT_SECRET || '', JWT_EXPIRA_MIN: +e.JWT_EXPIRA_MIN || 480,
  DEVICE_TOKEN: e.DEVICE_TOKEN || 'galpao-esp',
  ADMIN_USER: e.ADMIN_USER || 'admin', ADMIN_PASS: e.ADMIN_PASS || 'galpao123',
  CORS: e.CORS_ORIGINS || '*',
  MQTT_URL: e.MQTT_URL || '', MQTT_USER: e.MQTT_USER || '', MQTT_PASS: e.MQTT_PASS || ''
};
