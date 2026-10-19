// Preenche as telas com as leituras reais.
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const COR = { danger: ['#ffe2df', '#c52b2b', '#922020'], safe: ['#e0f5e7', '#126b3c', '#126b3c'], caution: ['#fff1bd', '#d89a00', '#714600'], sem: ['#eef2ef', '#6b7f74', '#31594c'] };
  const ICO = { danger: '<path d="M12 3 22 21H2L12 3Z" stroke-linejoin="round"/><path d="M12 9v5m0 3h.01" stroke-linecap="round"/>', caution: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01" stroke-linecap="round"/>', safe: '<path d="m5 12 5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/>' };
  ICO.sem = ICO.caution;
  const ITENS = [['temperatura', 'Temperatura dentro do galpão', '°C'], ['umidade', 'Umidade do ar', '%'], ['externa', 'Temperatura de fora', '°C'], ['calor', 'Calor para as aves', '']];
  const TIT = { danger: ['ALERTA: VERIFICAR O GALPÃO'], caution: ['ATENÇÃO: ACOMPANHE O GALPÃO'], safe: ['TUDO BEM NO GALPÃO', 'As leituras estão na faixa indicada.'], sem: ['SEM SINAL DO GALPÃO', 'Nenhuma leitura nos últimos 5 minutos. Confira o sensor e a rede.'] };
  const SEM = { valor: null, nivel: 'sem', rotulo: 'Sem sinal', acao: 'CONFIRA O SENSOR.', nota: 'Não chegou uma leitura.' };
  const fmt = (v, u = '') => ((v == null ? '--' : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })) + (u === '%' ? '' : ' ') + u).trim();
  const hhmm = ts => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  function render(av) {
    $$('#page-home .metric').forEach((c, i) => {
      const [k, , u] = ITENS[i], a = av[k], temItgu = k === 'calor' && a.valor != null;
      c.className = 'metric ' + ({ danger: 'danger', safe: 'safe', caution: 'caution' }[a.nivel] || '');
      c.querySelector('.value').textContent = temItgu ? a.rotulo.toUpperCase() : fmt(a.valor, u);
      c.querySelector('.pill').textContent = a.rotulo;
      c.querySelector('.action-text').textContent = a.acao;
      c.querySelector('.metric-note').textContent = (temItgu ? `ITGU ${fmt(a.valor)}. ` : '') + a.nota;
    });
    const nivel = !av.ts ? 'sem' : ['danger', 'caution'].find(n => ITENS.some(([k]) => av[k].nivel === n)) || 'safe';
    const pior = ITENS.find(([k]) => av[k].nivel === nivel), t = TIT[nivel], s = $('.summary');
    s.className = 'summary' + (nivel === 'safe' ? ' good' : nivel === 'danger' ? '' : ' caution');
    s.querySelector('svg').innerHTML = ICO[nivel];
    s.querySelector('strong').textContent = t[0];
    s.querySelector('p').textContent = t[1] || av[pior[0]].acao + ' ' + av[pior[0]].nota;
    $('#status').textContent = av.ts ? 'Ao vivo · última leitura em ' + new Date(av.ts).toLocaleString('pt-BR') : 'Nenhuma leitura recente. Confira se o sensor está ligado e conectado à rede.';

    const tx = $$('.barn-illustration text'), bx = $$('.barn-illustration rect[rx="15"]');
    [['temperatura', '°C', 1, 0], ['umidade', '%', 3, 1]].forEach(([k, u, ti, bi]) => {
      const a = av[k], [bg, ln, tc] = COR[a.nivel];
      tx[ti].textContent = fmt(a.valor, u);
      tx[ti - 1].setAttribute('fill', tc); tx[ti].setAttribute('fill', tc);
      bx[bi].setAttribute('fill', bg); bx[bi].setAttribute('stroke', ln);
    });

    const linhas = ITENS.filter(([k]) => av[k].nivel !== 'safe').map(([k, nome]) => { const a = av[k]; return [a.nivel === 'danger' ? '' : 'warning', a.nivel, `${a.rotulo.toUpperCase()} — ${nome}`, `${a.acao} ${a.nota}`]; });
    if (!linhas.length) linhas.push(['ok', 'safe', 'TUDO CERTO', 'Nenhum alerta no momento.']);
    $('#lista-alertas').innerHTML = linhas.map(([c, n, h, p]) => `<article class="alert-row ${c}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">${ICO[n]}</svg><div><h3>${h}</h3><p>${p}</p></div></article>`).join('');
  }

  function grafico(ls) {
    const W = 640, H = 290, X = 66, Y = 24, mn = 15, mx = 45, t0 = ls.length ? ls[0].ts : 0, t1 = ls.length ? ls[ls.length - 1].ts : 1;
    const x = ts => X + (t1 === t0 ? W : (ts - t0) / (t1 - t0) * W), y = v => Y + H - (Math.min(mx, Math.max(mn, v)) - mn) / (mx - mn) * H;
    let s = `<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="var(--surface-soft)" stroke="var(--line)"/>`;
    for (let v = mn; v <= mx; v += 5) s += `<path d="M${X} ${y(v)}H${X + W}" stroke="var(--line)"/><text x="20" y="${y(v) + 5}" fill="var(--ink)" font-size="16">${v}°</text>`;
    const linha = (k, c) => { const p = ls.filter(l => l[k] != null).map(l => x(l.ts).toFixed(0) + ',' + y(l[k]).toFixed(0)).join(' '); return p ? `<polyline points="${p}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` : ''; };
    s += linha('temperatura_externa', '#ca8a04') + linha('temperatura', '#d12b2b');
    if (ls.length) s += `<g fill="var(--ink)" font-size="16"><text x="${X}" y="345">${hhmm(t0)}</text><text x="${X + W}" y="345" text-anchor="end">${hhmm(t1)}</text></g>`;
    $('#grafico').innerHTML = s;
  }

  async function historico() {
    try {
      const ls = await Api.leituras(24); grafico(ls);
      const linha = (nome, k, u) => { const v = ls.map(l => l[k]).filter(n => n != null); return `<tr><td>${nome}</td>` + (v.length ? [Math.min(...v), v.reduce((a, b) => a + b) / v.length, Math.max(...v)].map(n => `<td>${fmt(n, u)}</td>`).join('') : '<td colspan="3">Sem dados</td>') + '</tr>'; };
      $('#tabela').innerHTML = linha('Dentro do galpão', 'temperatura', '°C') + linha('Umidade', 'umidade', '%') + linha('Temperatura de fora', 'temperatura_externa', '°C');
    } catch {}
  }

  function entrar() {
    $('#login').hidden = true; $('#app').hidden = false;
    $('#url-esp').textContent = location.origin + '/api/leituras';
    render({ ts: 0, temperatura: SEM, umidade: SEM, externa: SEM, calor: SEM });
    const atualizar = () => Api.ultima().then(render).catch(() => {});
    atualizar(); historico();
    Api.eventos(d => render(d.avaliacao));
    setInterval(atualizar, 60000); setInterval(historico, 30000);
  }

  $('#form-login').addEventListener('submit', async e => {
    e.preventDefault(); $('#erro-login').textContent = '';
    try { await Api.login($('#usuario').value, $('#senha').value); entrar(); }
    catch (x) { $('#erro-login').textContent = x.message; }
  });
  $('#sair').addEventListener('click', Api.sair);
  if (Api.logado()) entrar(); else $('#login').hidden = false;
})();
