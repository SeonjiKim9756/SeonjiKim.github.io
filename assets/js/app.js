(() => {
  const owner = "Seonji Kim";
  const panels = [...document.querySelectorAll("[data-panel]")];
  const tabs = [...document.querySelectorAll("[data-tab]")];
  const list = document.getElementById("publication-list");
  const heroMeta = document.getElementById("hero-meta");
  const heroName = document.getElementById("hero-name");
  const heroStatement = document.getElementById("hero-statement");
  const aboutCopy = document.getElementById("about-copy");
  const interestList = document.getElementById("interest-list");
  const researchTimeline = document.getElementById("research-timeline");
  const educationTimeline = document.getElementById("education-timeline");
  const teachingGrid = document.getElementById("teaching-grid");
  const socialLinks = document.getElementById("social-links");
  const bibtexCopyButton = document.getElementById("paper-bibtex-copy");
  const bibtexText = document.getElementById("paper-bibtex-text");
  let papers = [];
  let profile = null;

  const socialIcons = {
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
    scholar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 12v4c3 2 7 2 10 0v-4"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.04H3.54V8.98H7.1v11.47Z"/></svg>'
  };

  const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[char]));

  const authorHTML = authors => authors.map(name => name === owner ? `<strong>${escapeHTML(name)}</strong>` : escapeHTML(name)).join(", ");
  const emphasisHTML = text => escapeHTML(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  function paperFigurePath(paper) {
    return paper.mainFigure || paper.thumbnail || "";
  }

  function figurePlaceholderHTML(compact = false) {
    const className = compact ? "figure-placeholder compact" : "figure-placeholder";
    return `<span class="${className}"><strong>Main figure</strong><span>Figure coming soon</span></span>`;
  }

  function visualHTML(paper, compact = false) {
    const figurePath = paperFigurePath(paper);
    if (figurePath) {
      const alt = compact ? `Main figure from ${paper.title}` : `Main figure for ${paper.title}`;
      return `<img src="${escapeHTML(figurePath)}" alt="${escapeHTML(alt)}">`;
    }
    return figurePlaceholderHTML(compact);
  }

  function showPanel(name) {
    panels.forEach(panel => {
      panel.hidden = panel.dataset.panel !== name;
    });
    tabs.forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset.tab === name)));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderProfile(data) {
    profile = data;
    heroMeta.innerHTML = "";
    (data.heroMeta || []).forEach((item, index) => {
      const span = document.createElement("span");
      span.textContent = item;
      heroMeta.appendChild(span);
      if (index < data.heroMeta.length - 1) {
        const divider = document.createElement("span");
        divider.textContent = "·";
        heroMeta.appendChild(divider);
      }
    });
    const updated = document.createElement("span");
    updated.id = "last-updated";
    updated.textContent = "Last updated July 2026";
    heroMeta.appendChild(document.createElement("span")).textContent = "·";
    heroMeta.appendChild(updated);

    heroName.innerHTML = (data.nameLines || []).map(escapeHTML).join("<br>");
    heroStatement.innerHTML = emphasisHTML(data.statement || "");
    aboutCopy.innerHTML = emphasisHTML(data.about || "");

    interestList.innerHTML = "";
    (data.interests || []).forEach(interest => {
      const chip = document.createElement("span");
      chip.textContent = interest;
      interestList.appendChild(chip);
    });

    socialLinks.innerHTML = "";
    (data.socialLinks || []).forEach(link => {
      const anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.innerHTML = `${socialIcons[link.icon] || ""}${escapeHTML(link.label)}`;
      if (!link.href.startsWith("mailto:")) {
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
      }
      socialLinks.appendChild(anchor);
    });

    researchTimeline.innerHTML = "";
    (data.research || []).forEach(item => {
      const entry = document.createElement("li");
      entry.innerHTML = `<span>${escapeHTML(item.period)}</span><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.summary)}</p>${item.meta ? `<p class="small">${escapeHTML(item.meta)}</p>` : ""}</div>`;
      researchTimeline.appendChild(entry);
    });

    educationTimeline.innerHTML = "";
    (data.education || []).forEach(item => {
      const entry = document.createElement("li");
      entry.innerHTML = `<span>${escapeHTML(item.period)}</span><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.summary)}</p></div>`;
      educationTimeline.appendChild(entry);
    });

    teachingGrid.innerHTML = "";
    (data.teaching || []).forEach(item => {
      const entry = document.createElement("div");
      entry.innerHTML = `<span>${escapeHTML(item.code)}</span><section><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.summary)}</p></section>`;
      teachingGrid.appendChild(entry);
    });
  }

  function renderPublications() {
    list.innerHTML = "";
    const years = [...new Set(papers.map(paper => paper.year))].sort((a, b) => b - a);
    years.forEach(year => {
      const group = document.createElement("section");
      group.className = "year-group";
      group.innerHTML = `<h3>${year}</h3><div class="publication-grid"></div>`;
      papers.filter(paper => paper.year === year).forEach(paper => {
        const card = document.createElement("a");
        card.className = "publication-card";
        card.href = `#paper/${paper.id}`;
        card.dataset.paper = paper.id;
        card.innerHTML = `<span class="publication-visual">${visualHTML(paper, true)}</span><span><span class="publication-title">${escapeHTML(paper.title)}</span><span class="publication-authors">${authorHTML(paper.authors)}</span><span class="publication-venue">${escapeHTML(paper.venue)}</span></span>`;
        group.querySelector(".publication-grid").appendChild(card);
      });
      list.appendChild(group);
    });
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }

  function updateBibtexPanel(paper) {
    const value = (paper.bibtexText || "").trim();
    bibtexText.textContent = value || "BibTeX unavailable for this entry yet.";
    bibtexCopyButton.disabled = !value;
    bibtexCopyButton.dataset.bibtexValue = value;
    bibtexCopyButton.textContent = "Copy BibTeX";
  }

  function openPaper(id, updateHash = true) {
    const paper = papers.find(item => item.id === id);
    if (!paper) return;

    document.getElementById("paper-kicker").textContent = paper.venue;
    document.getElementById("paper-title").textContent = paper.title;
    document.getElementById("paper-authors").innerHTML = authorHTML(paper.authors);
    document.getElementById("paper-abstract").textContent = paper.abstract || "Abstract will be added from the paper PDF.";

    const pdf = document.getElementById("paper-pdf");
    pdf.hidden = !paper.pdf;
    if (paper.pdf) pdf.href = paper.pdf;

    const record = document.getElementById("paper-record");
    record.hidden = !paper.record;
    if (paper.record) record.href = paper.record;

    updateBibtexPanel(paper);

    const figure = document.getElementById("paper-figure");
    figure.innerHTML = visualHTML(paper, false);
    document.getElementById("figure-caption").textContent = paper.figureCaption || (paperFigurePath(paper) ? "" : "Main figure is not cached yet for this publication.");

    showPanel("paper");
    if (updateHash) history.replaceState(null, "", `#paper/${paper.id}`);
  }

  document.addEventListener("click", async event => {
    const tab = event.target.closest("[data-tab]");
    if (tab) {
      event.preventDefault();
      showPanel(tab.dataset.tab);
      history.replaceState(null, "", `#${tab.dataset.tab}`);
      return;
    }

    const card = event.target.closest("[data-paper]");
    if (card) {
      event.preventDefault();
      openPaper(card.dataset.paper);
      return;
    }

    if (event.target.closest("[data-paper-back]")) {
      event.preventDefault();
      showPanel("publications");
      history.replaceState(null, "", "#publications");
      return;
    }

    const copyButton = event.target.closest("[data-copy-bibtex]");
    if (copyButton) {
      event.preventDefault();
      if (copyButton.disabled) return;
      try {
        await copyText(copyButton.dataset.bibtexValue || "");
        copyButton.textContent = "Copied";
      } catch (error) {
        copyButton.textContent = "Copy failed";
      }
      window.setTimeout(() => {
        copyButton.textContent = "Copy BibTeX";
      }, 1800);
    }
  });

  Promise.all([
    fetch("data/profile.json").then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }),
    fetch("data/publications.json").then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
  ])
    .then(([profileData, publicationData]) => {
      renderProfile(profileData);
      papers = publicationData.publications || [];
      renderPublications();
      if (publicationData.lastUpdated) {
        const updated = document.getElementById("last-updated");
        if (updated) updated.textContent = `Last updated ${publicationData.lastUpdated}`;
      }
      const initial = location.hash.replace(/^#/, "");
      if (initial.startsWith("paper/")) openPaper(initial.split("/")[1], false);
      else if (["about", "publications", "research", "education", "teaching"].includes(initial)) showPanel(initial);
    })
    .catch(error => {
      list.innerHTML = `<p class="notice">Site data could not be loaded. Open this site through a web server or GitHub Pages, not by double-clicking index.html.<br><small>${escapeHTML(error.message)}</small></p>`;
    });
})();
