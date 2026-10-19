// Login com JWT (HS256) e senhas com scrypt, usando só o módulo crypto do Node.
const crypto = require('crypto'), cfg = require('./config'), store = require('./store');
const b64 = s => Buffer.from(s).toString('base64url');
const assinar = d => crypto.createHmac('sha256', store.segredo).update(d).digest('base64url');
const hash = (senha, sal = crypto.randomBytes(16).toString('hex')) => sal + ':' + crypto.scryptSync(senha, sal, 32).toString('hex');
const confere = (senha, h) => { const n = hash(senha, h.split(':')[0]); return n.length === h.length && crypto.timingSafeEqual(Buffer.from(n), Buffer.from(h)); };
const emitir = u => {
  const cab = b64('{"alg":"HS256","typ":"JWT"}');
  const corpo = b64(JSON.stringify({ sub: u.usuario, papel: u.papel, exp: Date.now() + cfg.JWT_EXPIRA_MIN * 60000 }));
  return `${cab}.${corpo}.${assinar(cab + '.' + corpo)}`;
};
const verificar = t => {
  try {
    const [cab, corpo, ass] = t.split('.');
    if (!crypto.timingSafeEqual(Buffer.from(assinar(cab + '.' + corpo)), Buffer.from(ass))) return null;
    const d = JSON.parse(Buffer.from(corpo, 'base64url'));
    return d.exp > Date.now() ? d : null;
  } catch { return null; }
};
const tentativas = new Map(); // limite de 5 logins por minuto por IP
const limite = ip => { const agora = Date.now(), l = (tentativas.get(ip) || []).filter(t => agora - t < 60000); l.push(agora); tentativas.set(ip, l); return l.length <= 5; };
module.exports = { hash, confere, emitir, verificar, limite };
