(function () {
  "use strict";

  const data = window.ADMA2026Content;
  const root = document.querySelector("[data-adma-page]");
  if (!data || !root) return;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const paperById = new Map(data.papers.map((paper) => [paper.id, paper]));
  const sessionByAnchor = new Map([
    ...data.oralSessions.map((session) => [`paper-session-${session.number}`, session]),
    ...data.posterSessions.map((session) => [`poster-session-${session.number}`, session]),
  ]);
  const siteLinkClass = "adma-site-link";

  function pageHeading(title, introduction, centered = false) {
    const alignment = centered ? " text-center" : "";
    return `
      <h2 class="pt-9 mb-5 font-titleFont text-3xl text-mainPurple font-extrabold${alignment}">${escapeHtml(title)}</h2>
      ${introduction ? `<p class="mb-4${alignment}">${escapeHtml(introduction)}</p>` : ""}`;
  }

  function sectionHeading(title, id = "") {
    return `<h2${id ? ` id="${id}"` : ""} class="text-xl font-bold mt-4 sm:mt-6 text-center sm:text-left pb-2 mb-6 text-mainPurple border-b border-gray-200 font-headingStyle tracking-semiWide">${escapeHtml(title)}</h2>`;
  }

  function renderAcceptedPapers() {
    const groups = [
      { id: "full-papers", title: "Full Papers", type: "Full" },
      { id: "short-papers", title: "Short Papers", type: "Short" },
      { id: "poster-papers", title: "Poster Papers", type: "Poster" },
      { id: "encore-papers", title: "Encore Papers", type: "Encore" },
    ];

    const renderGroup = (group) => {
      const papers = data.papers.filter((paper) => paper.type === group.type);
      return `
        <section id="${group.id}" aria-labelledby="${group.id}-heading">
          ${sectionHeading(group.title, `${group.id}-heading`)}
          <div class="adma-table-wrap">
            <table class="adma-plain-table adma-paper-table">
              <thead>
                <tr><th scope="col">Paper ID</th><th scope="col">Paper Title</th><th scope="col">Author(s)</th></tr>
              </thead>
              <tbody>
                ${papers.map((paper) => `
                  <tr>
                    <td><strong>${escapeHtml(paper.id)}</strong></td>
                    <td>${escapeHtml(paper.title)}</td>
                    <td>${escapeHtml(paper.authors)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>`;
    };

    root.innerHTML = `
      ${pageHeading("ADMA2026 Accepted Papers")}
      ${groups.map(renderGroup).join("")}`;
  }

  function matrixCell(cell) {
    if (!cell.label) return `<td aria-label="No scheduled event">—</td>`;
    const label = escapeHtml(cell.label.replace(/\s*@.*$/, ""));
    return `<td>${cell.anchor ? `<a class="${siteLinkClass}" href="#${cell.anchor}">${label}</a>` : label}</td>`;
  }

  function renderProgramMatrix(day) {
    return `
      <div class="adma-table-wrap">
        <table class="adma-plain-table adma-schedule-table">
          <thead><tr><th scope="col">Time</th>${day.rooms.map((room) => `<th scope="col">${escapeHtml(room)}</th>`).join("")}</tr></thead>
          <tbody>${day.rows.map((row) => `
            <tr>
              <th scope="row">${escapeHtml(row.time)}</th>
              ${row.general ? `<td colspan="${day.rooms.length}"><strong>${escapeHtml(row.general)}</strong></td>` : row.cells.map(matrixCell).join("")}
            </tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  function scheduleEntry(cell) {
    const parts = cell.label.split(/\s*@\s*/);
    return {
      anchor: cell.anchor,
      label: parts.shift(),
      room: parts.length ? parts.join(" @ ") : cell.room,
    };
  }

  function renderSessionPapers(session) {
    const papers = session.paperIds.map((id) => paperById.get(id)).filter(Boolean);
    return `
      <ol class="adma-session-paper-list text-orgSmall">
        ${papers.map((paper) => `
          <li>
            <strong>${escapeHtml(paper.id)}. ${escapeHtml(paper.title)}</strong>
            <span class="adma-session-paper-authors">${escapeHtml(paper.authors)}</span>
            <span class="adma-session-paper-type">${escapeHtml(paper.type)} Paper</span>
          </li>`).join("")}
      </ol>`;
  }

  function renderScheduleCard(entry, onlyCard) {
    const session = entry.anchor ? sessionByAnchor.get(entry.anchor) : null;
    const sessionLabel = entry.label || "Scheduled Event";
    const sessionTitle = session && session.topic !== sessionLabel ? session.topic : sessionLabel;
    const extraAnchor = entry.anchor === "paper-session-1"
      ? '<span class="adma-anchor-target" id="paper-sessions" aria-hidden="true"></span>'
      : entry.anchor === "poster-session-1"
        ? '<span class="adma-anchor-target" id="poster-sessions" aria-hidden="true"></span>'
        : "";
    return `
      <article class="adma-session-card${onlyCard ? " adma-session-card-wide" : ""}"${entry.anchor ? ` id="${entry.anchor}"` : ""}>
        ${extraAnchor}
        ${entry.room ? `<p class="mb-2 text-orgSmall text-gray-700"><strong>${escapeHtml(entry.room)}</strong></p>` : ""}
        ${session && sessionTitle !== sessionLabel ? `<p class="mb-2 font-bold">${escapeHtml(sessionLabel)}</p>` : ""}
        <h4 class="mb-3 font-titleFont text-xl text-mainPurple font-extrabold">${escapeHtml(sessionTitle)}</h4>
        ${session ? renderSessionPapers(session) : ""}
      </article>`;
  }

  function renderTimeSlot(day, row, index) {
    const entries = row.general
      ? [{ anchor: null, label: row.general, room: "" }]
      : row.cells.filter((cell) => cell.label).map(scheduleEntry);
    const tutorialEntries = entries.filter((entry) => /^Tutorial(?:\s|$)/i.test(entry.label));
    const roomEntries = entries.filter((entry) => !/^Tutorial(?:\s|$)/i.test(entry.label));
    const headingId = `day-${day.number}-slot-${index + 1}`;
    return `
      <section class="adma-time-slot" aria-labelledby="${headingId}">
        <h3 class="mb-4 font-titleFont text-xl text-mainPurple font-extrabold" id="${headingId}">${escapeHtml(row.time)}</h3>
        ${tutorialEntries.length ? `
          <div class="adma-session-featured">
            ${tutorialEntries.map((entry) => renderScheduleCard(entry, true)).join("")}
          </div>` : ""}
        ${roomEntries.length ? `
          <div class="adma-session-grid">
            ${roomEntries.map((entry) => renderScheduleCard(entry, roomEntries.length === 1 && tutorialEntries.length === 0)).join("")}
          </div>` : ""}
      </section>`;
  }

  function renderProgramDay(day) {
    return `
      <section class="adma-program-day" id="day-${day.number}">
        ${sectionHeading(`${day.label} — ${day.date}`)}
        <h3 class="mb-4 font-titleFont text-xl text-mainPurple font-extrabold">Program Overview</h3>
        ${renderProgramMatrix(day)}
        <h3 class="mb-4 font-titleFont text-xl text-mainPurple font-extrabold">Detailed Schedule</h3>
        ${day.rows.map((row, index) => renderTimeSlot(day, row, index)).join("")}
      </section>`;
  }

  function renderProgramDetails() {
    const dayLinks = data.programDays.map((day) => `<a class="${siteLinkClass}" href="#day-${day.number}">Day ${day.number}</a>`);
    root.innerHTML = `
      <p class="mb-4"><strong>Jump to:</strong> ${[...dayLinks, `<a class="${siteLinkClass}" href="#paper-sessions">Paper Sessions</a>`, `<a class="${siteLinkClass}" href="#poster-sessions">Poster Sessions</a>`].join(" · ")}</p>
      <p class="mb-4">Paper Sessions contain oral Full Papers. Poster Sessions may include Full, Short, Poster, and Encore papers.</p>
      ${data.programDays.map(renderProgramDay).join("")}`;
  }

  function contentBlock(title, content) {
    return `
      ${sectionHeading(title)}
      <div class="mb-4 justified-text">${content}</div>`;
  }

  function textParagraphs(value) {
    return String(value ?? "").split(/\n\s*\n/).map((paragraph) => `<p class="mb-4">${escapeHtml(paragraph)}</p>`).join("");
  }

  function renderTutorials() {
    root.innerHTML = `
      ${pageHeading("ADMA2026 Tutorials")}
      <div class="adma-table-wrap">
        <table class="adma-plain-table adma-tutorial-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Title</th>
              <th scope="col">Authors</th>
            </tr>
          </thead>
          ${data.tutorials.map((tutorial) => `
            <tbody id="tutorial-${tutorial.number}">
              <tr>
                <td><strong>${escapeHtml(tutorial.date)}</strong><br>${escapeHtml(tutorial.time)}</td>
                <td><strong class="text-mainPurple">${escapeHtml(tutorial.title)}</strong></td>
                <td>${tutorial.presenters.map((speaker) => escapeHtml(speaker.name)).join("; ")}</td>
              </tr>
              <tr class="adma-tutorial-abstract-row">
                <th scope="row">Abstract</th>
                <td colspan="2">${textParagraphs(tutorial.abstract)}</td>
              </tr>
            </tbody>`).join("")}
        </table>
      </div>`;
  }

  function renderKeynotes() {
    root.innerHTML = `
      ${pageHeading("ADMA2026 Keynotes", "Meet the three keynote speakers and explore their talks.", true)}
      <p class="mb-4 text-center"><strong>Jump to:</strong> ${data.keynotes.map((keynote) => `<a class="${siteLinkClass}" href="#keynote-${keynote.number}">Keynote ${keynote.number}</a>`).join(" · ")}</p>
      ${data.keynotes.map((keynote) => `
        <section class="pt-9" id="keynote-${keynote.number}">
          <p class="text-xl font-bold mt-6 mb-2 text-center leading-6">Keynote ${keynote.number}</p>
          <p class="mb-4 text-center"><strong>${escapeHtml(keynote.date)} · ${escapeHtml(keynote.time)} · ${escapeHtml(keynote.room)}</strong></p>
          <div class="flex flex-row justify-center flex-wrap">
            <a class="adma-presenter adma-presenter-wide" href="${escapeHtml(keynote.profileUrl)}" target="_blank" rel="noreferrer">
              <img class="rounded-lg" src="${escapeHtml(keynote.photo)}" alt="Portrait of ${escapeHtml(keynote.speaker)}" loading="lazy">
              <p class="text-xl font-bold mt-6 mb-2 text-center leading-6">${escapeHtml(keynote.speaker)}</p>
              <p class="mb-0 text-orgSmall text-gray-700 leading-5 text-center">${escapeHtml(keynote.affiliation)}</p>
            </a>
          </div>
          <p class="mb-4 text-center"><a class="${siteLinkClass}" href="${escapeHtml(keynote.profileUrl)}" target="_blank" rel="noreferrer">Official profile</a></p>
          ${contentBlock("Title", `<p>${escapeHtml(keynote.title)}</p>`)}
          ${contentBlock("Abstract", `<p>${escapeHtml(keynote.abstract)}</p>`)}
          ${contentBlock("Biography", `<p>${escapeHtml(keynote.biography)}</p>`)}
        </section>`).join("")}`;
  }

  const renderers = {
    "accepted-papers": renderAcceptedPapers,
    "program-details": renderProgramDetails,
    tutorials: renderTutorials,
    keynotes: renderKeynotes,
  };
  const render = renderers[root.dataset.admaPage];
  if (render) render();
})();
