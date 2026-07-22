(() => {
  const CACHE_BUST = "20260722s";
  const owner = "Seonji Kim";
  const siteStamp = document.getElementById("site-stamp");
  const bibtexCopyButton = document.getElementById("paper-bibtex-copy");
  const bibtexText = document.getElementById("paper-bibtex-text");
  const cacheBusted = path => path ? `${path}${path.includes("?") ? "&" : "?"}v=${CACHE_BUST}` : "";
  const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[char]));

  const authorHTML = authors => authors.map(name => name === owner ? `<strong>${escapeHTML(name)}</strong>` : escapeHTML(name)).join(", ");

  function paperFigurePath(paper) {
    return paper.mainFigure || paper.thumbnail || paper.representativeFigure || "";
  }

  function figurePlaceholderHTML(paper) {
    return `<span class="abstract-visual abstract-visual--${escapeHTML(paper?.visualType || "generic")}" aria-hidden="true"><span></span><span></span><span></span></span>`;
  }

  function visualHTML(paper) {
    const figurePath = paperFigurePath(paper);
    if (figurePath) {
      return `<img src="${escapeHTML(cacheBusted(figurePath))}" alt="${escapeHTML(`Representative image for ${paper.title}`)}">`;
    }
    return figurePlaceholderHTML(paper);
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
    bibtexText.value = value || "BibTeX unavailable for this entry yet.";
    bibtexCopyButton.disabled = !value;
    bibtexCopyButton.dataset.bibtexValue = value;
    bibtexCopyButton.textContent = "Copy BibTeX";
  }

  function renderPaper(paper) {
    document.title = `${paper.title} · Seonji Kim`;
    document.getElementById("paper-kicker").textContent = paper.venue;
    document.getElementById("paper-title").textContent = paper.title;
    document.getElementById("paper-authors").innerHTML = authorHTML(paper.authors || []);
    document.getElementById("paper-abstract").textContent = paper.abstract || "Abstract will be added from the paper PDF.";

    const pdf = document.getElementById("paper-pdf");
    pdf.hidden = !paper.pdf;
    if (paper.pdf) pdf.href = paper.pdf;

    const record = document.getElementById("paper-record");
    record.hidden = !paper.record;
    if (paper.record) {
      record.href = paper.record;
      if (paper.record.includes("dblp.org")) {
        record.textContent = "DBLP record ↗";
      } else if (paper.record.includes("doi.org")) {
        record.textContent = "DOI page ↗";
      } else {
        record.textContent = "External record ↗";
      }
    }

    updateBibtexPanel(paper);
    document.getElementById("paper-figure").innerHTML = visualHTML(paper);
    document.getElementById("figure-caption").textContent = paper.figureCaption || "";
  }

  function renderMissing(message) {
    document.getElementById("paper-title").textContent = message;
    document.getElementById("paper-authors").textContent = "";
    document.getElementById("paper-abstract").textContent = "";
    document.getElementById("paper-pdf").hidden = true;
    document.getElementById("paper-record").hidden = true;
    document.getElementById("paper-figure").innerHTML = figurePlaceholderHTML();
    document.getElementById("figure-caption").textContent = "";
    bibtexCopyButton.disabled = true;
    bibtexText.value = "BibTeX unavailable for this entry yet.";
  }

  document.addEventListener("click", async event => {
    const copyButton = event.target.closest("[data-copy-bibtex]");
    if (!copyButton) return;
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
  });

  const params = new URLSearchParams(window.location.search);
  const paperId = params.get("id");

  fetch(cacheBusted("data/publications.json"))
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(publicationData => {
      if (publicationData.lastUpdated && siteStamp) siteStamp.textContent = `Last updated ${publicationData.lastUpdated}`;
      const papers = publicationData.publications || [];
      const paper = papers.find(item => item.id === paperId);
      if (!paperId || !paper) {
        renderMissing("Publication not found.");
        return;
      }
      renderPaper(paper);
    })
    .catch(() => {
      renderMissing("Publication could not be loaded.");
    });
})();
