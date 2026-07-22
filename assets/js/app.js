(() => {
  const CACHE_BUST = "20260722i";
  const owner = "Seonji Kim";
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
  const siteStamp = document.getElementById("site-stamp");
  const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
  const sections = sectionLinks
    .map(link => document.getElementById(link.dataset.sectionLink))
    .filter(Boolean);

  let papers = [];

  const cacheBusted = path => path ? `${path}${path.includes("?") ? "&" : "?"}v=${CACHE_BUST}` : "";
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
  const multilineEmphasisHTML = text => emphasisHTML(text).replace(/\n/g, "<br>");

  function paperFigurePath(paper) {
    return paper.mainFigure || paper.thumbnail || paper.representativeFigure || "";
  }

  function figurePlaceholderHTML(paper) {
    return `<span class="abstract-visual abstract-visual--${escapeHTML(paper?.visualType || "generic")}" aria-hidden="true"><span></span><span></span><span></span></span>`;
  }

  function visualHTML(paper) {
    const figurePath = paperFigurePath(paper);
    if (figurePath) {
      return `<img src="${escapeHTML(cacheBusted(figurePath))}" alt="${escapeHTML(`Main figure from ${paper.title}`)}">`;
    }
    return figurePlaceholderHTML(paper);
  }

  function setActiveSection(sectionId) {
    sectionLinks.forEach(link => {
      link.setAttribute("aria-current", String(link.dataset.sectionLink === sectionId));
    });
  }

  function splitTitle(value) {
    const parts = String(value || "").split(" · ");
    if (parts.length < 2) return null;
    return {
      primary: parts[0],
      secondary: parts.slice(1).join(" · ")
    };
  }

  function renderProfile(data) {
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

    heroName.innerHTML = (data.nameLines || []).map(escapeHTML).join("<br>");
    heroStatement.innerHTML = data.statementHtml || multilineEmphasisHTML(data.statement || "");
    aboutCopy.innerHTML = data.aboutHtml || emphasisHTML(data.about || "");

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
      const titleParts = splitTitle(item.title);
      const titleHTML = titleParts
        ? `<h3><span class="entry-title-primary">${escapeHTML(titleParts.primary)}</span><span class="entry-title-affiliation">${escapeHTML(titleParts.secondary)}</span></h3>`
        : `<h3>${escapeHTML(item.title)}</h3>`;
      entry.innerHTML = `<span>${escapeHTML(item.period)}</span><div>${titleHTML}<p>${escapeHTML(item.summary)}</p></div>`;
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
        card.href = `paper.html?id=${encodeURIComponent(paper.id)}`;
        card.target = "_blank";
        card.rel = "noreferrer";
        card.innerHTML = `<span class="publication-visual">${visualHTML(paper)}</span><span><span class="publication-title">${escapeHTML(paper.title)}</span><span class="publication-authors">${authorHTML(paper.authors)}</span><span class="publication-venue">${escapeHTML(paper.venue)}</span></span>`;
        group.querySelector(".publication-grid").appendChild(card);
      });
      list.appendChild(group);
    });
  }

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  }

  function syncFromHash() {
    const hash = location.hash.replace(/^#/, "");
    if (!hash) {
      setActiveSection("");
      return;
    }
    scrollToSection(hash);
  }

  sectionLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const sectionId = link.dataset.sectionLink;
      history.pushState(null, "", `#${sectionId}`);
      scrollToSection(sectionId);
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveSection(visible.target.id);
    }, { rootMargin: "-20% 0px -60% 0px", threshold: [0.15, 0.4, 0.7] });
    sections.forEach(section => observer.observe(section));
  }

  Promise.all([
    fetch(cacheBusted("data/profile.json")).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }),
    fetch(cacheBusted("data/publications.json")).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
  ])
    .then(([profileData, publicationData]) => {
      renderProfile(profileData);
      papers = publicationData.publications || [];
      renderPublications();
      if (publicationData.lastUpdated && siteStamp) siteStamp.textContent = `Last updated ${publicationData.lastUpdated}`;
      if (location.hash) syncFromHash();
    })
    .catch(error => {
      list.innerHTML = `<p class="notice">Site data could not be loaded. Open this site through a web server or GitHub Pages, not by double-clicking index.html.<br><small>${escapeHTML(error.message)}</small></p>`;
    });

  window.addEventListener("popstate", syncFromHash);
})();
