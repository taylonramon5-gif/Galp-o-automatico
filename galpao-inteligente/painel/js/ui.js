(() => {
  const pages = {
    home: { title: 'Galpão 01', subtitle: 'Veja aqui se está tudo bem com as aves.' },
    barn: { title: 'Ver galpão', subtitle: 'Veja as áreas do galpão e o que precisa de atenção.' },
    history: { title: 'Histórico', subtitle: 'Acompanhe as mudanças nas leituras ao longo do dia.' },
    alerts: { title: 'Alertas', subtitle: 'Veja o que precisa ser verificado primeiro.' },
    settings: { title: 'Configurar', subtitle: 'Ajuste a tela às suas necessidades.' }
  };
  const pageSections = document.querySelectorAll('.page');
  const navButtons = document.querySelectorAll('.nav-button');
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');

  function goToPage(name) {
    if (!pages[name]) return;
    pageSections.forEach(section => {
      const active = section.id === `page-${name}`;
      section.classList.toggle('active', active);
      section.hidden = !active;
    });
    navButtons.forEach(button => {
      if (button.dataset.page === name) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    title.textContent = pages[name].title;
    subtitle.textContent = pages[name].subtitle;
    document.title = `${pages[name].title} — Galpão Inteligente`;
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  navButtons.forEach(button => button.addEventListener('click', () => goToPage(button.dataset.page)));
  document.querySelectorAll('[data-goto]').forEach(button => button.addEventListener('click', () => goToPage(button.dataset.goto)));

  const themeToggle = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');
  function setTheme(dark) {
    document.body.classList.toggle('dark', dark);
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
    themeLabel.textContent = dark ? 'TEMA CLARO' : 'TEMA ESCURO';
  }
  themeToggle.addEventListener('click', () => setTheme(!document.body.classList.contains('dark')));
  document.getElementById('theme-light').addEventListener('click', () => setTheme(false));
  document.getElementById('theme-dark').addEventListener('click', () => setTheme(true));

  let scale = 1;
  function setScale(next) {
    scale = Math.min(1.25, Math.max(.9, next));
    document.documentElement.style.setProperty('--base-scale', scale);
  }
  document.getElementById('font-up').addEventListener('click', () => setScale(scale + .1));
  document.getElementById('font-down').addEventListener('click', () => setScale(scale - .1));
  document.getElementById('font-reset').addEventListener('click', () => setScale(1));
})();
