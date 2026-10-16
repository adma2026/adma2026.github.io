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
  const specialSessions = data.specialSessions || [];
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

  function normalizeProgramSearch(value) {
    return String(value ?? "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
  }

  function programPaperText(paperId) {
    const paper = paperById.get(paperId);
    return paper ? `${paper.id} ${paper.title} ${paper.authors} ${paper.type}` : String(paperId);
  }

  function buildProgramRecords() {
    const records = [
      ...data.oralSessions.map((session) => ({
        key: `paper-${session.number}`,
        anchor: `paper-session-${session.number}`,
        type: "paper",
        typeLabel: "Paper Session",
        label: `Paper Session ${session.number}`,
        title: session.topic,
        day: session.day,
        date: session.date,
        time: session.time,
        room: session.room,
        paperIds: session.paperIds,
      })),
      ...data.posterSessions.map((session) => ({
        key: `poster-${session.number}`,
        anchor: `poster-session-${session.number}`,
        type: "poster",
        typeLabel: "Poster Session",
        label: `Poster Session ${session.number}`,
        title: session.topic,
        day: session.day,
        date: session.date,
        time: session.time,
        room: session.room,
        paperIds: session.paperIds,
      })),
      ...specialSessions.map((session) => ({
        key: `special-${session.id}`,
        anchor: session.anchor,
        type: "special",
        typeLabel: "Special Session",
        label: session.label,
        title: session.label,
        day: session.day,
        date: session.date,
        time: session.time,
        room: session.room,
        items: session.items,
      })),
      ...data.keynotes.map((keynote) => ({
        key: `keynote-${keynote.number}`,
        anchor: `program-keynote-${keynote.number}`,
        href: `./keynote.html#keynote-${keynote.number}`,
        type: "keynote",
        typeLabel: "Keynote",
        label: `Keynote ${keynote.number}`,
        title: keynote.title,
        speakerLine: `${keynote.speaker} · ${keynote.affiliation}`,
        day: keynote.day,
        date: keynote.date,
        time: keynote.time,
        room: keynote.room,
      })),
      ...data.tutorials.map((tutorial) => ({
        key: `tutorial-${tutorial.number}`,
        anchor: `program-tutorial-${tutorial.number}`,
        href: `./tutorial.html#tutorial-${tutorial.number}`,
        type: "tutorial",
        typeLabel: "Tutorial",
        label: `Tutorial ${tutorial.number}`,
        title: tutorial.title,
        speakerLine: tutorial.presenters.map((presenter) => presenter.name).join("; "),
        day: tutorial.day,
        date: tutorial.date,
        time: tutorial.time,
        times: tutorial.times,
        room: tutorial.room,
      })),
    ];

    const typeOrder = { keynote: 0, tutorial: 1, special: 2, paper: 3, poster: 4 };
    for (const record of records) {
      const itemText = record.items?.map((item) => item.kind === "paper" ? programPaperText(item.paperId) : item.label).join(" ") || "";
      const paperText = record.paperIds?.map(programPaperText).join(" ") || "";
      record.searchText = normalizeProgramSearch([
        record.label,
        record.title,
        record.speakerLine,
        record.date,
        record.time,
        record.times?.join(" "),
        record.room,
        itemText,
        paperText,
      ].join(" "));
    }
    return records.sort((left, right) => (
      left.day - right.day
      || left.time.localeCompare(right.time)
      || typeOrder[left.type] - typeOrder[right.type]
      || left.label.localeCompare(right.label)
    ));
  }

  const programRecords = buildProgramRecords();
  const programRecordByAnchor = new Map(programRecords.map((record) => [record.anchor, record]));
  const programRecordByKey = new Map(programRecords.map((record) => [record.key, record]));
  const programTypes = [
    { id: "all", label: "All" },
    { id: "paper", label: "Paper" },
    { id: "poster", label: "Poster" },
    { id: "special", label: "Special" },
    { id: "keynote", label: "Keynote" },
    { id: "tutorial", label: "Tutorial" },
  ];
  const programState = {
    overviewDay: data.programDays[0]?.number || 1,
    detailDay: "all",
    detailType: "all",
    query: "",
  };

  function recordMatchesProgramQuery(record) {
    if (!programState.query) return true;
    const paperIdMatch = programState.query.match(/^(?:paper(?: id)?\s*[:#-]?\s*)?#?(\d+)$/);
    if (paperIdMatch) {
      const paperId = Number(paperIdMatch[1]);
      return (record.paperIds || []).includes(paperId)
        || (record.items || []).some((item) => item.kind === "paper" && item.paperId === paperId);
    }
    return record.searchText.includes(programState.query);
  }

  function programRecordForCell(cell) {
    if (cell.anchor) return programRecordByAnchor.get(cell.anchor) || null;
    const label = cell.label.replace(/\s*@.*$/, "");
    const keynoteMatch = label.match(/^Keynote (\d+)/);
    if (keynoteMatch) return programRecordByKey.get(`keynote-${keynoteMatch[1]}`) || null;
    const tutorialMatch = label.match(/^Tutorial (\d+)/);
    if (tutorialMatch) return programRecordByKey.get(`tutorial-${tutorialMatch[1]}`) || null;
    return null;
  }

  function programEventParts(cell) {
    const parts = cell.label.split(/\s*@\s*/);
    return { label: parts.shift(), room: parts.length ? parts.join(" @ ") : cell.room };
  }

  function programEventType(cell, record) {
    if (record) return record.type;
    if (/^Panel Discussion/i.test(cell.label)) return "special";
    return "event";
  }

  function renderProgramOverviewCard(cell, wide = false) {
    const record = programRecordForCell(cell);
    const parts = programEventParts(cell);
    const type = programEventType(cell, record);
    const isHit = record && programState.query && recordMatchesProgramQuery(record);
    const isDimmed = programState.query && !isHit;
    const classes = [
      "adma-overview-card",
      `adma-overview-${type}`,
      wide ? "adma-overview-band" : "",
      isHit ? "is-search-hit" : "",
      isDimmed ? "is-search-dimmed" : "",
    ].filter(Boolean).join(" ");
    const title = record
      ? record.type === "keynote" && record.title === "TBA"
        ? record.speakerLine.split(" · ")[0]
        : record.title
      : parts.label;
    const meta = record ? record.label : parts.room && parts.room !== cell.room ? parts.room : "";
    const content = `
      <span class="adma-overview-name">${escapeHtml(title)}</span>
      ${meta && meta !== title ? `<span class="adma-overview-meta">${escapeHtml(meta)}</span>` : ""}`;
    const href = record?.href || (record ? `#${record.anchor}` : /^Panel Discussion/i.test(parts.label) ? "./panel.html" : "");
    if (!href) return `<div class="${classes}">${content}</div>`;
    const detailAttributes = record && !record.href
      ? ` data-program-detail-link="${escapeHtml(record.key)}"`
      : "";
    return `<a class="${classes}" href="${escapeHtml(href)}"${detailAttributes}>${content}</a>`;
  }

  function isProgramWideEvent(row) {
    if (row.general) return true;
    const populated = row.cells.filter((cell) => cell.label && !cell.covered);
    if (populated.some((cell) => cell.rowSpan > 1 || cell.colSpan > 1)) return false;
    return populated.length === 1 && !/^(?:Paper|Poster|PSTDA|RDI|Tutorial)\b/.test(populated[0].label);
  }

  function programGridPosition(rowIndex, roomIndex, rowSpan = 1, colSpan = 1) {
    return `grid-row:${rowIndex + 2} / span ${rowSpan};grid-column:${roomIndex + 2} / span ${colSpan}`;
  }

  function renderProgramOverviewGrid(day) {
    return `
      <div class="adma-program-grid-wrap">
        <div class="adma-program-grid" style="--adma-room-count:${day.rooms.length}">
          <div class="adma-program-grid-corner">Time</div>
          ${day.rooms.map((room) => `<div class="adma-program-room">${escapeHtml(room)}</div>`).join("")}
          ${day.rows.map((row, rowIndex) => {
            const populated = row.cells.filter((cell) => cell.label && !cell.covered);
            const wide = isProgramWideEvent(row);
            const wideCell = row.general
              ? { label: row.general, room: "", anchor: null }
              : populated[0];
            return `
              <div class="adma-program-time" style="${programGridPosition(rowIndex, -1)}">${escapeHtml(row.time)}</div>
              ${wide
                ? `<div class="adma-program-cell adma-program-cell-wide" style="${programGridPosition(rowIndex, 0, 1, day.rooms.length)}">${renderProgramOverviewCard(wideCell, true)}</div>`
                : row.cells.map((cell, roomIndex) => {
                  if (cell.covered) return "";
                  const rowSpan = cell.rowSpan || 1;
                  const colSpan = cell.colSpan || 1;
                  const style = programGridPosition(rowIndex, roomIndex, rowSpan, colSpan);
                  const cellClasses = `adma-program-cell${colSpan > 1 ? " adma-program-cell-wide" : ""}`;
                  return cell.label
                    ? `<div class="${cellClasses}" style="${style}">${renderProgramOverviewCard(cell, colSpan === day.rooms.length)}</div>`
                    : `<div class="adma-program-cell adma-program-cell-empty" style="${style}" aria-label="No scheduled event"></div>`;
                }).join("")}`;
          }).join("")}
        </div>
      </div>`;
  }

  function overviewDayHitCount(dayNumber) {
    if (!programState.query) return 0;
    return programRecords.filter((record) => record.day === dayNumber && recordMatchesProgramQuery(record)).length;
  }

  function renderProgramOverview() {
    const container = root.querySelector("[data-program-overview]");
    if (!container) return;
    const day = data.programDays.find((item) => item.number === programState.overviewDay) || data.programDays[0];
    container.innerHTML = `
      <div class="adma-program-day-tabs" role="tablist" aria-label="Program days">
        ${data.programDays.map((item) => {
          const selected = item.number === day.number;
          const hitCount = overviewDayHitCount(item.number);
          return `<button class="adma-program-filter${selected ? " is-active" : ""}" type="button" role="tab" aria-selected="${selected}" aria-controls="program-overview-panel" data-overview-day="${item.number}">${escapeHtml(item.label)} · ${escapeHtml(item.date)}${programState.query ? ` <span class="adma-filter-count">${hitCount}</span>` : ""}</button>`;
        }).join("")}
      </div>
      <div id="program-overview-panel" role="tabpanel" aria-label="${escapeHtml(`${day.label} ${day.date}`)}">
        <p class="adma-program-venue"><strong>${escapeHtml(day.label)} · ${escapeHtml(day.date)}</strong></p>
        ${renderProgramOverviewGrid(day)}
      </div>`;
  }

  function renderProgramPaperList(paperIds) {
    const papers = paperIds.map((id) => paperById.get(id)).filter(Boolean);
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

  function renderSpecialSessionItems(items) {
    return `
      <ol class="adma-session-paper-list adma-special-session-list text-orgSmall">
        ${items.map((item) => {
          if (item.kind === "invited") {
            return `<li class="adma-invited-talk"><strong>${escapeHtml(item.label)}</strong></li>`;
          }
          const paper = paperById.get(item.paperId);
          return paper ? `
            <li>
              <strong>${escapeHtml(paper.id)}. ${escapeHtml(paper.title)}</strong>
              <span class="adma-session-paper-authors">${escapeHtml(paper.authors)}</span>
              <span class="adma-session-paper-type">${escapeHtml(paper.type)} Paper</span>
            </li>` : "";
        }).join("")}
      </ol>`;
  }

  function renderProgramRecord(record) {
    const linkLabel = record.type === "keynote" ? "View keynote details" : "View tutorial details";
    const body = record.paperIds
      ? renderProgramPaperList(record.paperIds)
      : record.items
        ? renderSpecialSessionItems(record.items)
        : `
          <p class="mb-3 text-orgSmall">${escapeHtml(record.speakerLine)}</p>
          <p class="mb-0"><a class="${siteLinkClass}" href="${escapeHtml(record.href)}">${linkLabel}</a></p>`;
    const kindLabel = record.title === record.label ? record.typeLabel : record.label;
    return `
      <article class="adma-session-detail adma-session-detail-${record.type}" id="${escapeHtml(record.anchor)}" data-program-record="${escapeHtml(record.key)}">
        <header class="adma-session-detail-header">
          <div>
            <p class="adma-session-kind">${escapeHtml(kindLabel)}</p>
            <h4>${escapeHtml(record.title)}</h4>
          </div>
          <p class="adma-session-meta">${escapeHtml(programRecordTime(record))}<br>${escapeHtml(record.room)}</p>
        </header>
        ${body}
      </article>`;
  }

  function filteredProgramRecords() {
    return programRecords.filter((record) => (
      (programState.detailDay === "all" || record.day === Number(programState.detailDay))
      && (programState.detailType === "all" || record.type === programState.detailType)
      && recordMatchesProgramQuery(record)
    ));
  }

  function renderProgramDetailsList() {
    const container = root.querySelector("[data-program-details-list]");
    if (!container) return;
    const records = filteredProgramRecords();
    if (!records.length) {
      container.innerHTML = '<p class="adma-program-empty" role="status">No sessions match the current search and filters.</p>';
      return;
    }

    const days = [...new Set(records.map((record) => record.day))];
    container.innerHTML = days.map((dayNumber) => {
      const day = data.programDays.find((item) => item.number === dayNumber);
      const dayRecords = records.filter((record) => record.day === dayNumber);
      const times = [...new Set(dayRecords.map((record) => record.time))];
      return `
        <section class="adma-program-detail-day" aria-labelledby="program-detail-day-${dayNumber}">
          <h3 id="program-detail-day-${dayNumber}">${escapeHtml(day.label)} · ${escapeHtml(day.date)}</h3>
          ${times.map((time, index) => `
            <section class="adma-program-detail-slot" aria-labelledby="program-detail-slot-${dayNumber}-${index + 1}">
              <h4 class="adma-program-slot-heading" id="program-detail-slot-${dayNumber}-${index + 1}">${escapeHtml(time)}</h4>
              <div class="adma-program-detail-grid">
                ${dayRecords.filter((record) => record.time === time).map(renderProgramRecord).join("")}
              </div>
            </section>`).join("")}
        </section>`;
    }).join("");
  }

  function renderProgramFilters() {
    const dayFilters = root.querySelector("[data-program-day-filters]");
    const typeFilters = root.querySelector("[data-program-type-filters]");
    if (dayFilters) {
      dayFilters.innerHTML = [
        { id: "all", label: "All Days" },
        ...data.programDays.map((day) => ({ id: String(day.number), label: day.label })),
      ].map((filter) => `<button class="adma-program-filter${programState.detailDay === filter.id ? " is-active" : ""}" type="button" aria-pressed="${programState.detailDay === filter.id}" data-detail-day="${filter.id}">${escapeHtml(filter.label)}</button>`).join("");
    }
    if (typeFilters) {
      typeFilters.innerHTML = programTypes.map((filter) => `<button class="adma-program-filter adma-filter-${filter.id}${programState.detailType === filter.id ? " is-active" : ""}" type="button" aria-pressed="${programState.detailType === filter.id}" data-detail-type="${filter.id}">${escapeHtml(filter.label)}</button>`).join("");
    }
  }

  function updateProgramSearchStatus() {
    const status = root.querySelector("[data-program-search-status]");
    if (!status) return;
    if (!programState.query) {
      status.textContent = "";
      return;
    }
    const matchCount = programRecords.filter(recordMatchesProgramQuery).length;
    status.textContent = `${matchCount} matching session${matchCount === 1 ? "" : "s"}`;
  }

  function renderProgramInteractiveAreas() {
    renderProgramOverview();
    renderProgramFilters();
    renderProgramDetailsList();
    updateProgramSearchStatus();
  }

  function applyProgramSearch(value) {
    programState.query = normalizeProgramSearch(value);
    if (programState.query) {
      const matches = programRecords.filter(recordMatchesProgramQuery);
      const firstMatch = matches.find((record) => record.type !== "poster") || matches[0];
      if (firstMatch) programState.overviewDay = firstMatch.day;
    }
    renderProgramInteractiveAreas();
  }

  function bindProgramInteractions() {
    const searchForm = root.querySelector("[data-program-search-form]");
    const searchInput = root.querySelector("[data-program-search-input]");
    searchForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      applyProgramSearch(searchInput.value);
    });
    root.querySelector("[data-program-search-clear]")?.addEventListener("click", () => {
      searchInput.value = "";
      applyProgramSearch("");
      searchInput.focus();
    });

    root.addEventListener("click", (event) => {
      const overviewDayButton = event.target.closest("[data-overview-day]");
      if (overviewDayButton) {
        programState.overviewDay = Number(overviewDayButton.dataset.overviewDay);
        renderProgramOverview();
        return;
      }
      const detailDayButton = event.target.closest("[data-detail-day]");
      if (detailDayButton) {
        programState.detailDay = detailDayButton.dataset.detailDay;
        renderProgramFilters();
        renderProgramDetailsList();
        return;
      }
      const detailTypeButton = event.target.closest("[data-detail-type]");
      if (detailTypeButton) {
        programState.detailType = detailTypeButton.dataset.detailType;
        renderProgramFilters();
        renderProgramDetailsList();
        return;
      }
      const detailLink = event.target.closest("[data-program-detail-link]");
      if (detailLink) {
        event.preventDefault();
        const record = programRecordByKey.get(detailLink.dataset.programDetailLink);
        if (!record) return;
        if (!recordMatchesProgramQuery(record)) {
          searchInput.value = "";
          programState.query = "";
        }
        programState.detailDay = String(record.day);
        programState.detailType = record.type;
        renderProgramInteractiveAreas();
        requestAnimationFrame(() => {
          document.getElementById(record.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
          if (window.history?.replaceState) window.history.replaceState(null, "", `#${record.anchor}`);
        });
      }
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "f" && document.activeElement !== searchInput) {
        event.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  function renderProgramDetails() {
    root.innerHTML = `
      ${pageHeading("ADMA 2026 Conference Program", "Browse the full schedule, search session content, and open detailed paper, poster, special, keynote, and tutorial information.")}
      <nav class="adma-program-nav" aria-label="Program navigation and search">
        <div class="adma-program-jump-links">
          <a href="#program-overview">Program Overview</a>
          <a href="#session-details">Session Details</a>
        </div>
        <form class="adma-program-search" role="search" data-program-search-form>
          <label class="sr-only" for="program-search">Search the conference program</label>
          <input id="program-search" type="search" placeholder="Search title, author, Paper ID, room…" autocomplete="off" data-program-search-input>
          <button type="submit">Search</button>
          <button class="adma-program-button-secondary" type="button" data-program-search-clear>Clear</button>
          <span class="adma-program-search-status" aria-live="polite" data-program-search-status></span>
        </form>
      </nav>
      <section id="program-overview" aria-labelledby="program-overview-heading">
        ${sectionHeading("Program Overview", "program-overview-heading")}
        <p class="adma-program-lead">Select a day, then choose a session to open its details. Keynotes and Tutorials link to their dedicated pages.</p>
        <div class="adma-program-legend" aria-label="Program type legend">
          ${programTypes.filter((type) => type.id !== "all").map((type) => `<span class="adma-legend-${type.id}"><i aria-hidden="true"></i>${escapeHtml(type.label)}</span>`).join("")}
        </div>
        <div data-program-overview></div>
      </section>
      <section id="session-details" aria-labelledby="session-details-heading">
        ${sectionHeading("Session Details", "session-details-heading")}
        <div class="adma-program-filter-panel">
          <div>
            <p class="adma-filter-label">Day</p>
            <div class="adma-program-filter-row" aria-label="Filter session details by day" data-program-day-filters></div>
          </div>
          <div>
            <p class="adma-filter-label">Type</p>
            <div class="adma-program-filter-row" aria-label="Filter session details by type" data-program-type-filters></div>
          </div>
        </div>
        <div data-program-details-list></div>
      </section>`;
    renderProgramInteractiveAreas();
    bindProgramInteractions();
  }

  function contentBlock(title, content) {
    return `
      ${sectionHeading(title)}
      <div class="adma-content-block mb-4 justified-text">${content}</div>`;
  }

  function textParagraphs(value) {
    return String(value ?? "").split(/\n\s*\n/).map((paragraph) => `<p class="mb-4">${escapeHtml(paragraph)}</p>`).join("");
  }

  function tutorialAuthorLine(runs) {
    return (runs || []).map((run) => run.text).join("");
  }

  function formatTimeRange(value) {
    return String(value || "").replace(/\s*-\s*/, " - ");
  }

  function mergeContiguousTimeRanges(values) {
    const merged = [];
    for (const value of values) {
      const [start, end] = String(value || "").split(/\s*-\s*/);
      if (!start || !end) {
        merged.push({ start: String(value || ""), end: "" });
        continue;
      }
      const previous = merged.at(-1);
      if (previous?.end === start) {
        previous.end = end;
      } else {
        merged.push({ start, end });
      }
    }
    return merged.map(({ start, end }) => end ? `${start}-${end}` : start);
  }

  function programRecordTime(record) {
    const times = record.times?.length ? record.times : [record.time];
    return mergeContiguousTimeRanges(times).map(formatTimeRange).join(" / ");
  }

  function tutorialScheduleLabels(tutorial) {
    const times = tutorial.times?.length ? tutorial.times : [tutorial.time];
    return mergeContiguousTimeRanges(times).map((time) => `Day ${tutorial.day}, ${formatTimeRange(time)}`);
  }

  function renderTutorialAbstract(value) {
    return String(value ?? "")
      .split(/\n\s*\n/)
      .map((paragraph, index) => `
        <p>${index === 0 ? "<strong>Abstract.</strong> " : ""}${escapeHtml(paragraph)}</p>`)
      .join("");
  }

  function renderTutorials() {
    root.innerHTML = `
      ${pageHeading("ADMA2026 Tutorials")}
      <div class="adma-tutorial-list">
        ${data.tutorials.map((tutorial) => `
          <section class="adma-tutorial-detail" id="tutorial-${tutorial.number}" aria-labelledby="tutorial-${tutorial.number}-title">
            <h2 class="adma-tutorial-title" id="tutorial-${tutorial.number}-title">${escapeHtml(tutorial.title)}</h2>
            <div class="adma-tutorial-authors" aria-label="Authors">
              ${tutorial.authorLines.map((line) => `<p class="adma-tutorial-author-line">${escapeHtml(tutorialAuthorLine(line))}</p>`).join("")}
            </div>
            <p class="adma-tutorial-time"><strong>Time:</strong> ${tutorialScheduleLabels(tutorial).map(escapeHtml).join(" / ")}</p>
            <div class="adma-tutorial-abstract">
              ${renderTutorialAbstract(tutorial.abstract)}
            </div>
          </section>`).join("")}
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
          ${contentBlock("Abstract", textParagraphs(keynote.abstract))}
          ${contentBlock("Biography", textParagraphs(keynote.biography))}
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
