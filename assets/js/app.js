(() => {
  const owner = 'Seonji Kim';
  const panels = [...document.querySelectorAll('[data-panel]')];
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const list = document.getElementById('publication-list');
  let papers = [];

  const icons = {
    spaces: '<svg viewBox="0 0 220 150" fill="none" stroke="currentColor"><path d="M13 110 75 79l44 24-63 33-43-26Z"/><path d="m105 96 62-31 40 23-63 33-39-25Z"/><path d="m65 77 42-39 48 27M107 38l1 57"/><circle cx="65" cy="77" r="5" fill="currentColor"/><circle cx="107" cy="38" r="5" fill="currentColor"/><circle cx="155" cy="65" r="5" fill="currentColor"/></svg>',
    graph: '<svg viewBox="0 0 220 150" fill="none" stroke="currentColor"><path d="m26 103 45-57 45 32 42-49 36 68M71 46l87-17M71 46l45 86m0-54 78 19"/><g fill="currentColor"><circle cx="26" cy="103" r="6"/><circle cx="71" cy="46" r="6"/><circle cx="116" cy="78" r="6"/><circle cx="158" cy="29" r="6"/><circle cx="194" cy="97" r="6"/><circle cx="116" cy="132" r="6"/></g></svg>',
    environment: '<svg viewBox="0 0 220 150" fill="none" stroke="currentColor"><path d="M18 128V30h184v98M18 30l38 27h109l37-27"/><rect x="74" y="60" width="72" height="45"/><path d="m82 96 20-18 14 10 19-18"/></svg>',
    walking: '<svg viewBox="0 0 220 150" fill="none" stroke="currentColor"><path d="M9 121C45 24 154 15 211 110" stroke-dasharray="8 6"/><path d="m55 99 18-14m25-17 20-7m27 4 19 10" stroke-width="5" stroke-linecap="round"/><circle cx="109" cy="38" r="8"/><path d="m109 47-12 27 21 17m-9-30 24 7m-36 6-15 22" stroke-width="3"/></svg>',
    object: '<svg viewBox="0 0 220 150" fill="none" stroke="currentColor"><path d="m71 32 55-18 43 32-56 20-42-34Z"/><path d="m71 32 2 61 42 37-2-64m56-20-1 61-53 23"/><path d="M20 104h39M39 84v40M179 121h28M193 107v28" stroke-dasharray="5 4"/></svg>',
    collaboration: '<svg viewBox="0 0 220 150" fill="none" stroke="currentColor"><circle cx="37" cy="44" r="14"/><circle cx="183" cy="44" r="14"/><path d="M37 60v47m146-47v47M57 51c32-29 74-29 106 0"/><rect x="73" y="89" width="74" height="12" rx="6"/><path d="M111 82v26" stroke-width="4"/></svg>'
  };

  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const authorHTML = authors => authors.map(name => name === owner ? `<strong>${escapeHTML(name)}</strong>` : escapeHTML(name)).join(', ');
  const visualHTML = paper => paper.thumbnail
    ? `<img src="${escapeHTML(paper.thumbnail)}" alt="Thumbnail from ${escapeHTML(paper.title)}">`
    : (icons[paper.visualType] || icons.spaces);

  function showPanel(name) {
    panels.forEach(panel => { panel.hidden = panel.dataset.panel !== name; });
    tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.tab === name)));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderPublications() {
    list.innerHTML = '';
    const years = [...new Set(papers.map(paper => paper.year))].sort((a, b) => b - a);
    years.forEach(year => {
      const group = document.createElement('section');
      group.className = 'year-group';
      group.innerHTML = `<h3>${year}</h3><div class="publication-grid"></div>`;
      papers.filter(paper => paper.year === year).forEach(paper => {
        const card = document.createElement('a');
        card.className = 'publication-card';
        card.href = `#paper/${paper.id}`;
        card.dataset.paper = paper.id;
        card.innerHTML = `<span class="publication-visual">${visualHTML(paper)}</span><span><span class="publication-title">${escapeHTML(paper.title)}</span><span class="publication-authors">${authorHTML(paper.authors)}</span><span class="publication-venue">${escapeHTML(paper.venue)}</span></span>`;
        group.querySelector('.publication-grid').appendChild(card);
      });
      list.appendChild(group);
    });
  }

  function openPaper(id, updateHash = true) {
    const paper = papers.find(item => item.id === id);
    if (!paper) return;
    document.getElementById('paper-kicker').textContent = paper.venue;
    document.getElementById('paper-title').textContent = paper.title;
    document.getElementById('paper-authors').innerHTML = authorHTML(paper.authors);
    document.getElementById('paper-abstract').textContent = paper.abstract || 'Abstract will be added from the paper PDF.';

    const pdf = document.getElementById('paper-pdf');
    pdf.hidden = !paper.pdf;
    if (paper.pdf) pdf.href = paper.pdf;
    const bib = document.getElementById('paper-bib');
    bib.hidden = !paper.bibtex;
    if (paper.bibtex) bib.href = paper.bibtex;
    const record = document.getElementById('paper-record');
    record.hidden = !paper.record;
    if (paper.record) record.href = paper.record;

    const figure = document.getElementById('paper-figure');
    figure.innerHTML = paper.mainFigure
      ? `<img src="${escapeHTML(paper.mainFigure)}" alt="Main figure from ${escapeHTML(paper.title)}">`
      : (icons[paper.visualType] || icons.spaces);
    document.getElementById('figure-caption').textContent = paper.figureCaption || (paper.mainFigure ? '' : 'Representative placeholder · add a paper figure through the paper form.');
    showPanel('paper');
    if (updateHash) history.replaceState(null, '', `#paper/${paper.id}`);
  }

  document.addEventListener('click', event => {
    const tab = event.target.closest('[data-tab]');
    if (tab) {
      event.preventDefault();
      showPanel(tab.dataset.tab);
      history.replaceState(null, '', `#${tab.dataset.tab}`);
      return;
    }
    const card = event.target.closest('[data-paper]');
    if (card) {
      event.preventDefault();
      openPaper(card.dataset.paper);
      return;
    }
    if (event.target.closest('[data-paper-back]')) {
      event.preventDefault();
      showPanel('publications');
      history.replaceState(null, '', '#publications');
    }
  });

  fetch('data/publications.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      papers = data.publications || [];
      renderPublications();
      if (data.lastUpdated) document.getElementById('last-updated').textContent = `Last updated ${data.lastUpdated}`;
      const initial = location.hash.replace(/^#/, '');
      if (initial.startsWith('paper/')) openPaper(initial.split('/')[1], false);
      else if (['about','publications','research','education','teaching'].includes(initial)) showPanel(initial);
    })
    .catch(error => {
      list.innerHTML = `<p class="notice">Publication data could not be loaded. Open this site through a web server or GitHub Pages, not by double-clicking index.html.<br><small>${escapeHTML(error.message)}</small></p>`;
    });
})();
