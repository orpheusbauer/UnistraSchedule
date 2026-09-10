(() => {
  "use strict";

  if (window.__unistraPersonalScheduleLoaded) return;
  window.__unistraPersonalScheduleLoaded = true;

  // Le stockage Chrome appartient à l’extension : cette clé est commune aux deux domaines pris en charge.
  const STORAGE_KEY = "unistraPersonalSchedule";
  const MONTHS = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  const DEFAULT_DATA = { hiddenKeywords: [], customEvents: [] };

  let data = structuredCloneSafe(DEFAULT_DATA);
  let editingId = null;
  let observerTimer = null;

  const storage = {
    get() {
      if (globalThis.chrome?.storage?.local) {
        return new Promise((resolve) => {
          chrome.storage.local.get({ [STORAGE_KEY]: DEFAULT_DATA }, (result) => {
            resolve(result?.[STORAGE_KEY] || DEFAULT_DATA);
          });
        });
      }

      try {
        return Promise.resolve(JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_DATA);
      } catch (_error) {
        return Promise.resolve(DEFAULT_DATA);
      }
    },
    set(value) {
      if (globalThis.chrome?.storage?.local) {
        return new Promise((resolve) => chrome.storage.local.set({ [STORAGE_KEY]: value }, resolve));
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return Promise.resolve();
    }
  };

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr")
      .trim();
  }

  function sanitizeData(value) {
    const hiddenKeywords = Array.isArray(value?.hiddenKeywords)
      ? value.hiddenKeywords.filter((word) => typeof word === "string" && word.trim()).map((word) => word.trim())
      : [];
    const customEvents = Array.isArray(value?.customEvents)
      ? value.customEvents.filter((event) => event && event.id && event.title && event.date)
      : [];

    return { hiddenKeywords, customEvents };
  }

  function uid() {
    return globalThis.crypto?.randomUUID?.() || `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function localIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseIso(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }

  function addDays(date, count) {
    const result = new Date(date);
    result.setDate(result.getDate() + count);
    return result;
  }

  function parseFrenchDate(text) {
    const cleaned = normalize(text);
    const expression = new RegExp(`(\\d{1,2})\\s+(${MONTHS.map(normalize).join("|")})\\s+(\\d{4})`, "g");
    const matches = [...cleaned.matchAll(expression)];
    if (!matches.length) return null;
    const [, day, month, year] = matches[0];
    return new Date(Number(year), MONTHS.map(normalize).indexOf(month), Number(day));
  }

  function parseFrenchMonth(text) {
    const cleaned = normalize(text);
    const match = new RegExp(`(${MONTHS.map(normalize).join("|")})\\s+(\\d{4})`).exec(cleaned);
    if (!match) return null;
    return { month: MONTHS.map(normalize).indexOf(match[1]), year: Number(match[2]) };
  }

  function findCalendarTitle() {
    return [...document.querySelectorAll(".v-toolbar__title")]
      .map((element) => element.textContent.trim())
      .find((text) => /\d{4}/.test(text) && MONTHS.some((month) => normalize(text).includes(normalize(month)))) || "";
  }

  function minutes(value) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
    return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
  }

  function eventOccursOn(event, dateIso) {
    if (event.date === dateIso) return true;
    if (event.recurrence !== "weekly") return false;

    const first = parseIso(event.date);
    const current = parseIso(dateIso);
    const last = parseIso(event.repeatUntil);
    if (!first || !current || !last || current < first || current > last) return false;
    return current.getDay() === first.getDay();
  }

  function readableDate(value) {
    const date = parseIso(value);
    return date
      ? new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(date)
      : value;
  }

  function contrastColor(hex) {
    const value = String(hex || "#3e8f93").replace("#", "");
    const full = value.length === 3 ? value.split("").map((character) => character + character).join("") : value;
    const red = parseInt(full.slice(0, 2), 16) || 0;
    const green = parseInt(full.slice(2, 4), 16) || 0;
    const blue = parseInt(full.slice(4, 6), 16) || 0;
    return (red * 299 + green * 587 + blue * 114) / 1000 > 156 ? "#182426" : "#ffffff";
  }

  function createEventElement(event, monthMode = false) {
    const element = document.createElement("div");
    element.dataset.uextCustom = event.id;
    element.className = monthMode
      ? "v-event uext-custom-event uext-month-event"
      : "v-event-timed onsecondary--text uext-custom-event";
    element.style.backgroundColor = event.color || "#78c6c9";
    element.style.borderColor = event.color || "#78c6c9";
    element.style.color = contrastColor(event.color);
    element.title = [event.title, event.teacher, event.room, event.notes].filter(Boolean).join("\n");
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", `Modifier ${event.title}`);

    if (monthMode) {
      const time = document.createElement("span");
      time.className = "uext-month-time";
      time.textContent = event.start;
      const title = document.createElement("strong");
      title.textContent = event.title;
      element.append(time, title);
    } else {
      const content = document.createElement("div");
      content.className = "pl-1 uext-event-content";
      const summary = document.createElement("span");
      summary.className = "v-event-summary";
      const title = document.createElement("strong");
      title.textContent = event.title;
      summary.appendChild(title);

      const details = [event.teacher, event.room, event.notes].filter(Boolean);
      if (details.length) {
        const detail = document.createElement("span");
        details.forEach((line) => {
          detail.append(document.createElement("br"), document.createTextNode(line));
        });
        summary.appendChild(detail);
      }
      content.appendChild(summary);
      element.appendChild(content);
    }

    const openEditor = () => openEventForm(event.id);
    element.addEventListener("click", (eventClick) => {
      eventClick.stopPropagation();
      openEditor();
    });
    element.addEventListener("keydown", (keyboardEvent) => {
      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") openEditor();
    });
    return element;
  }

  function filterOriginalEvents() {
    const keywords = data.hiddenKeywords.map(normalize).filter(Boolean);
    const selector = ".v-event-timed:not([data-uext-custom]), .v-calendar-weekly .v-event:not([data-uext-custom])";
    document.querySelectorAll(selector).forEach((event) => {
      const normalizedText = normalize(event.textContent);
      const hidden = keywords.some((keyword) => normalizedText.includes(keyword));
      event.classList.toggle("uext-hidden-event", hidden);
    });
  }

  function dailyMetrics() {
    const intervals = [...document.querySelectorAll(".v-calendar-daily__intervals-body .v-calendar-daily__interval")];
    if (!intervals.length) return { baseMinutes: 0, pixelsPerMinute: 2 / 3 };

    let stepMinutes = 30;
    const labelled = intervals
      .map((element, index) => ({ element, index, value: minutes(element.textContent.trim()) }))
      .filter((item) => Number.isFinite(item.value));
    if (labelled.length > 1) stepMinutes = labelled[1].value - labelled[0].value || 30;

    const intervalHeight = parseFloat(getComputedStyle(intervals[0]).height) || parseFloat(intervals[0].style.height) || 20;
    const first = labelled[0];
    const baseMinutes = first ? first.value - first.index * stepMinutes : 0;
    return { baseMinutes, pixelsPerMinute: intervalHeight / stepMinutes };
  }

  function renderDailyEvents() {
    const columns = [...document.querySelectorAll(".v-calendar-daily__day")];
    if (!columns.length) return false;
    const firstDate = parseFrenchDate(findCalendarTitle());
    if (!firstDate) return false;

    const { baseMinutes, pixelsPerMinute } = dailyMetrics();
    columns.forEach((column, index) => {
      const dateIso = localIso(addDays(firstDate, index));
      const container = column.querySelector(".v-event-timed-container");
      if (!container) return;

      data.customEvents
        .filter((event) => eventOccursOn(event, dateIso))
        .sort((first, second) => first.start.localeCompare(second.start))
        .forEach((event) => {
          const start = minutes(event.start);
          const end = minutes(event.end);
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
          const element = createEventElement(event);
          element.style.top = `${(start - baseMinutes) * pixelsPerMinute}px`;
          element.style.height = `${Math.max(22, (end - start) * pixelsPerMinute)}px`;
          element.style.left = "0%";
          element.style.width = "100%";
          container.appendChild(element);
        });
    });
    return true;
  }

  function monthCellDates(cells) {
    const dataDates = cells.map((cell) => cell.dataset.date).filter(Boolean);
    if (dataDates.length === cells.length) return dataDates;

    const month = parseFrenchMonth(findCalendarTitle());
    if (!month) return [];
    const firstOfMonth = new Date(month.year, month.month, 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = addDays(firstOfMonth, -mondayOffset);
    return cells.map((_cell, index) => localIso(addDays(gridStart, index)));
  }

  function renderMonthEvents() {
    const cells = [...document.querySelectorAll(".v-calendar-weekly__day")];
    if (!cells.length) return false;
    const dates = monthCellDates(cells);
    cells.forEach((cell, index) => {
      const dateIso = dates[index];
      if (!dateIso) return;
      data.customEvents
        .filter((event) => eventOccursOn(event, dateIso))
        .sort((first, second) => first.start.localeCompare(second.start))
        .forEach((event) => cell.appendChild(createEventElement(event, true)));
    });
    return true;
  }

  function renderCalendar() {
    document.querySelectorAll("[data-uext-custom]").forEach((element) => element.remove());
    filterOriginalEvents();
    renderDailyEvents() || renderMonthEvents();
    updateSummary();
  }

  async function persistAndRender() {
    await storage.set(data);
    renderPanelLists();
    renderCalendar();
  }

  function buildInterface() {
    const root = document.createElement("div");
    root.id = "uext-root";
    root.innerHTML = `
      <button id="uext-trigger" type="button" aria-label="Ouvrir la personnalisation de l'emploi du temps" aria-expanded="false">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 17H5V9h14v10ZM7 11h4v3H7v-3Z"/></svg>
        <span>Mon EDT</span>
        <span id="uext-badge" aria-hidden="true"></span>
      </button>
      <div id="uext-backdrop" hidden></div>
      <aside id="uext-panel" aria-hidden="true" aria-label="Personnaliser mon emploi du temps">
        <header class="uext-panel-header">
          <div>
            <span class="uext-eyebrow">Personnalisation locale</span>
            <h2>Mon emploi du temps</h2>
            <p id="uext-summary">Aucune personnalisation</p>
          </div>
          <button id="uext-close" class="uext-icon-button" type="button" aria-label="Fermer">×</button>
        </header>

        <div class="uext-scroll">
          <section class="uext-section" aria-labelledby="uext-filter-title">
            <div class="uext-section-heading">
              <div><h3 id="uext-filter-title">Cours à masquer</h3></div>
              <p>Le mot peut apparaître dans le cours, l’enseignant ou la salle.</p>
            </div>
            <form id="uext-keyword-form" class="uext-inline-form">
              <label class="uext-sr-only" for="uext-keyword">Mot-clé à masquer</label>
              <input id="uext-keyword" type="text" autocomplete="off" placeholder="Ex. Architecture" maxlength="80" required>
              <button type="submit">Ajouter</button>
            </form>
            <div id="uext-keyword-list" class="uext-chip-list" aria-live="polite"></div>
          </section>

          <section class="uext-section" aria-labelledby="uext-events-title">
            <div class="uext-section-heading uext-with-action">
              <div><h3 id="uext-events-title">Mes cours</h3></div>
              <button id="uext-add-event" class="uext-primary-button" type="button">+ Ajouter</button>
            </div>
            <div id="uext-event-list" class="uext-event-list" aria-live="polite"></div>
          </section>
          <p class="uext-storage-note">Les réglages restent enregistrés dans ce navigateur. Aucune donnée n’est envoyée à un service externe.</p>
        </div>

        <div id="uext-form-view" hidden>
          <form id="uext-event-form">
            <div class="uext-form-title">
              <button id="uext-form-back" class="uext-icon-button" type="button" aria-label="Retour">←</button>
              <div><span class="uext-eyebrow">Cours personnalisé</span><h3 id="uext-form-heading">Nouveau cours</h3></div>
            </div>
            <div class="uext-form-scroll">
              <label>Intitulé du cours<input name="title" type="text" maxlength="120" placeholder="Ex. Intelligence artificielle" required></label>
              <div class="uext-two-columns">
                <label>Date<input name="date" type="date" required></label>
                <label>Couleur<span class="uext-color-row"><input name="color" type="color" value="#78c6c9"><span id="uext-color-value">#78C6C9</span></span></label>
              </div>
              <div class="uext-two-columns">
                <label>Début<input name="start" type="time" value="08:00" step="300" required></label>
                <label>Fin<input name="end" type="time" value="10:00" step="300" required></label>
              </div>
              <label>Enseignant·e<input name="teacher" type="text" maxlength="100" placeholder="Prénom Nom"></label>
              <label>Salle<input name="room" type="text" maxlength="100" placeholder="Ex. A301 — Escarpe"></label>
              <label>Note<textarea name="notes" maxlength="300" rows="3" placeholder="Matériel à apporter, rappel…"></textarea></label>
              <label class="uext-check"><input id="uext-weekly" name="weekly" type="checkbox"><span>Répéter chaque semaine</span></label>
              <label id="uext-repeat-wrap" hidden>Répéter jusqu’au<input name="repeatUntil" type="date"></label>
              <p id="uext-form-error" class="uext-form-error" role="alert" hidden></p>
            </div>
            <footer class="uext-form-actions">
              <button id="uext-delete-event" class="uext-danger-button" type="button" hidden>Supprimer</button>
              <span></span>
              <button id="uext-cancel-event" class="uext-secondary-button" type="button">Annuler</button>
              <button class="uext-primary-button" type="submit">Enregistrer</button>
            </footer>
          </form>
        </div>
      </aside>`;
    document.body.appendChild(root);

    root.querySelector("#uext-trigger").addEventListener("click", togglePanel);
    root.querySelector("#uext-close").addEventListener("click", closePanel);
    root.querySelector("#uext-backdrop").addEventListener("click", closePanel);
    root.querySelector("#uext-add-event").addEventListener("click", () => openEventForm());
    root.querySelector("#uext-form-back").addEventListener("click", closeEventForm);
    root.querySelector("#uext-cancel-event").addEventListener("click", closeEventForm);
    root.querySelector("#uext-keyword-form").addEventListener("submit", addKeyword);
    root.querySelector("#uext-event-form").addEventListener("submit", saveEvent);
    root.querySelector("#uext-delete-event").addEventListener("click", deleteEditingEvent);
    root.querySelector("#uext-weekly").addEventListener("change", updateRepeatVisibility);
    root.querySelector("input[name='color']").addEventListener("input", (event) => {
      root.querySelector("#uext-color-value").textContent = event.target.value.toUpperCase();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && root.querySelector("#uext-panel").classList.contains("uext-open")) closePanel();
    });
  }

  function togglePanel() {
    const panel = document.querySelector("#uext-panel");
    panel?.classList.contains("uext-open") ? closePanel() : openPanel();
  }

  function openPanel() {
    const panel = document.querySelector("#uext-panel");
    const backdrop = document.querySelector("#uext-backdrop");
    const trigger = document.querySelector("#uext-trigger");
    if (!panel || !backdrop || !trigger) return;
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add("uext-visible");
      panel.classList.add("uext-open");
    });
    panel.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
  }

  function closePanel() {
    const panel = document.querySelector("#uext-panel");
    const backdrop = document.querySelector("#uext-backdrop");
    const trigger = document.querySelector("#uext-trigger");
    if (!panel || !backdrop || !trigger) return;
    panel.classList.remove("uext-open");
    backdrop.classList.remove("uext-visible");
    panel.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!backdrop.classList.contains("uext-visible")) backdrop.hidden = true; }, 220);
  }

  function updateSummary() {
    const summary = document.querySelector("#uext-summary");
    const badge = document.querySelector("#uext-badge");
    if (!summary || !badge) return;
    const total = data.hiddenKeywords.length + data.customEvents.length;
    summary.textContent = total
      ? `${data.hiddenKeywords.length} filtre${data.hiddenKeywords.length > 1 ? "s" : ""} · ${data.customEvents.length} cours ajouté${data.customEvents.length > 1 ? "s" : ""}`
      : "Aucune personnalisation";
    badge.textContent = total || "";
    badge.hidden = !total;
  }

  function renderPanelLists() {
    const keywordList = document.querySelector("#uext-keyword-list");
    const eventList = document.querySelector("#uext-event-list");
    if (!keywordList || !eventList) return;
    keywordList.replaceChildren();
    eventList.replaceChildren();

    if (!data.hiddenKeywords.length) {
      const empty = document.createElement("p");
      empty.className = "uext-empty-inline";
      empty.textContent = "Aucun cours masqué pour le moment.";
      keywordList.appendChild(empty);
    } else {
      data.hiddenKeywords.forEach((keyword, index) => {
        const chip = document.createElement("span");
        chip.className = "uext-chip";
        const text = document.createElement("span");
        text.textContent = keyword;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.setAttribute("aria-label", `Ne plus masquer ${keyword}`);
        remove.textContent = "×";
        remove.addEventListener("click", () => {
          data.hiddenKeywords.splice(index, 1);
          persistAndRender();
        });
        chip.append(text, remove);
        keywordList.appendChild(chip);
      });
    }

    if (!data.customEvents.length) {
      const empty = document.createElement("div");
      empty.className = "uext-empty-card";
      empty.innerHTML = `<span aria-hidden="true">▦</span><strong>Aucun cours personnel</strong><p>Ajoutez un cours ponctuel ou récurrent.</p>`;
      eventList.appendChild(empty);
    } else {
      [...data.customEvents]
        .sort((first, second) => `${first.date}${first.start}`.localeCompare(`${second.date}${second.start}`))
        .forEach((event) => {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "uext-event-card";
          const color = document.createElement("span");
          color.className = "uext-event-color";
          color.style.backgroundColor = event.color;
          const body = document.createElement("span");
          body.className = "uext-event-card-body";
          const title = document.createElement("strong");
          title.textContent = event.title;
          const meta = document.createElement("span");
          meta.textContent = `${readableDate(event.date)} · ${event.start}–${event.end}${event.recurrence === "weekly" ? " · chaque semaine" : ""}`;
          body.append(title, meta);
          const arrow = document.createElement("span");
          arrow.className = "uext-card-arrow";
          arrow.textContent = "›";
          card.append(color, body, arrow);
          card.addEventListener("click", () => openEventForm(event.id));
          eventList.appendChild(card);
        });
    }
    updateSummary();
  }

  function addKeyword(submitEvent) {
    submitEvent.preventDefault();
    const input = document.querySelector("#uext-keyword");
    const keyword = input.value.trim();
    if (!keyword) return;
    if (!data.hiddenKeywords.some((current) => normalize(current) === normalize(keyword))) {
      data.hiddenKeywords.push(keyword);
    }
    input.value = "";
    persistAndRender();
  }

  function suggestedDate() {
    const displayed = parseFrenchDate(findCalendarTitle());
    return displayed ? localIso(displayed) : localIso(new Date());
  }

  function openEventForm(id = null) {
    openPanel();
    editingId = id;
    const root = document.querySelector("#uext-root");
    const form = root.querySelector("#uext-event-form");
    const event = data.customEvents.find((item) => item.id === id);
    form.reset();
    form.elements.color.value = event?.color || "#78c6c9";
    form.elements.title.value = event?.title || "";
    form.elements.date.value = event?.date || suggestedDate();
    form.elements.start.value = event?.start || "08:00";
    form.elements.end.value = event?.end || "10:00";
    form.elements.teacher.value = event?.teacher || "";
    form.elements.room.value = event?.room || "";
    form.elements.notes.value = event?.notes || "";
    form.elements.weekly.checked = event?.recurrence === "weekly";
    form.elements.repeatUntil.value = event?.repeatUntil || "";
    root.querySelector("#uext-color-value").textContent = form.elements.color.value.toUpperCase();
    root.querySelector("#uext-form-heading").textContent = event ? "Modifier le cours" : "Nouveau cours";
    root.querySelector("#uext-delete-event").hidden = !event;
    root.querySelector("#uext-form-error").hidden = true;
    root.querySelector(".uext-scroll").hidden = true;
    root.querySelector("#uext-form-view").hidden = false;
    updateRepeatVisibility();
    setTimeout(() => form.elements.title.focus(), 250);
  }

  function closeEventForm() {
    editingId = null;
    const root = document.querySelector("#uext-root");
    root.querySelector("#uext-form-view").hidden = true;
    root.querySelector(".uext-scroll").hidden = false;
  }

  function updateRepeatVisibility() {
    const root = document.querySelector("#uext-root");
    const weekly = root.querySelector("#uext-weekly").checked;
    const wrap = root.querySelector("#uext-repeat-wrap");
    wrap.hidden = !weekly;
    wrap.querySelector("input").required = weekly;
  }

  function saveEvent(submitEvent) {
    submitEvent.preventDefault();
    const form = submitEvent.currentTarget;
    const formData = new FormData(form);
    const error = document.querySelector("#uext-form-error");
    const start = String(formData.get("start"));
    const end = String(formData.get("end"));
    const date = String(formData.get("date"));
    const weekly = form.elements.weekly.checked;
    const repeatUntil = weekly ? String(formData.get("repeatUntil")) : "";

    let message = "";
    if (minutes(end) <= minutes(start)) message = "L’heure de fin doit être postérieure à l’heure de début.";
    else if (weekly && repeatUntil < date) message = "La date de fin de répétition doit être postérieure à la première séance.";
    if (message) {
      error.textContent = message;
      error.hidden = false;
      return;
    }

    const existing = data.customEvents.find((item) => item.id === editingId);
    const value = {
      id: existing?.id || uid(),
      title: String(formData.get("title")).trim(),
      date,
      start,
      end,
      teacher: String(formData.get("teacher")).trim(),
      room: String(formData.get("room")).trim(),
      notes: String(formData.get("notes")).trim(),
      color: String(formData.get("color")),
      recurrence: weekly ? "weekly" : "once",
      repeatUntil
    };
    if (existing) Object.assign(existing, value);
    else data.customEvents.push(value);
    closeEventForm();
    persistAndRender();
  }

  function deleteEditingEvent() {
    if (!editingId) return;
    data.customEvents = data.customEvents.filter((event) => event.id !== editingId);
    closeEventForm();
    persistAndRender();
  }

  function observeCalendar() {
    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some((mutation) => {
        if (mutation.type === "characterData") {
          const parent = mutation.target.parentElement;
          return Boolean(parent?.closest(".v-toolbar__title") && !parent.closest("#uext-root"));
        }

        return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return false;
          return !node.matches?.("[data-uext-custom], #uext-root") && !node.closest?.("#uext-root");
        });
      });
      if (!relevant) return;
      clearTimeout(observerTimer);
      observerTimer = setTimeout(renderCalendar, 90);
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  async function init() {
    data = sanitizeData(await storage.get());
    buildInterface();
    renderPanelLists();
    renderCalendar();
    observeCalendar();
  }

  let initialization = null;

  function ensureInitialized() {
    if (!initialization) {
      initialization = init().catch((error) => {
        initialization = null;
        throw error;
      });
    }
    return initialization;
  }

  globalThis.chrome?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "UEXT_TOGGLE_PANEL") return false;
    void ensureInitialized()
      .then(() => {
        togglePanel();
        sendResponse({ ok: true });
      })
      .catch((error) => {
        console.error("Unistra Schedule n'a pas pu initialiser le panneau.", error);
        sendResponse({ ok: false, message: String(error?.message || error) });
      });
    return true;
  });

  void ensureInitialized();
})();
