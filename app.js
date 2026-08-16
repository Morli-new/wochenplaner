(() => {
  "use strict";

  const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const PRIORITIES = ["high", "medium", "low"];

  const uid = () =>
    (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  // ---------- Date helpers ----------

  function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function isoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return { week, year: d.getUTCFullYear() };
  }

  function weekKeyFor(monday) {
    const { week, year } = isoWeek(monday);
    return `${year}-W${String(week).padStart(2, "0")}`;
  }

  function formatWeekLabel(monday) {
    const sunday = addDays(monday, 6);
    const { week } = isoWeek(monday);
    const sameMonth = monday.getMonth() === sunday.getMonth();
    const range = sameMonth
      ? `${monday.getDate()}.–${sunday.getDate()}. ${MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`
      : `${monday.getDate()}. ${MONTHS[monday.getMonth()]} – ${sunday.getDate()}. ${MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`;
    return `KW ${week} · ${range}`;
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // ---------- Storage ----------

  const THEME_KEY = "planner:theme";
  const HABITS_KEY = "planner:habits";
  const weekStorageKey = (weekKey) => `planner:week:${weekKey}`;

  function loadHabitDefs() {
    try {
      return JSON.parse(localStorage.getItem(HABITS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveHabitDefs(defs) {
    localStorage.setItem(HABITS_KEY, JSON.stringify(defs));
  }

  function emptyWeekData() {
    return {
      goals: [],
      tasks: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
      habitChecks: {},
      notes: "",
    };
  }

  function loadWeekData(weekKey) {
    try {
      const raw = JSON.parse(localStorage.getItem(weekStorageKey(weekKey)));
      if (!raw) return emptyWeekData();
      const base = emptyWeekData();
      return {
        goals: raw.goals || base.goals,
        tasks: { ...base.tasks, ...(raw.tasks || {}) },
        habitChecks: raw.habitChecks || base.habitChecks,
        notes: raw.notes || "",
      };
    } catch {
      return emptyWeekData();
    }
  }

  function saveWeekData(weekKey, data) {
    localStorage.setItem(weekStorageKey(weekKey), JSON.stringify(data));
  }

  // ---------- State ----------

  let currentMonday = startOfWeek(new Date());
  let weekKey = weekKeyFor(currentMonday);
  let weekData = loadWeekData(weekKey);
  let habitDefs = loadHabitDefs();

  function persist() {
    saveWeekData(weekKey, weekData);
  }

  function switchWeek(monday) {
    currentMonday = monday;
    weekKey = weekKeyFor(currentMonday);
    weekData = loadWeekData(weekKey);
    renderAll();
  }

  // ---------- DOM refs ----------

  const el = {
    weekLabel: document.getElementById("weekLabel"),
    prevWeek: document.getElementById("prevWeek"),
    nextWeek: document.getElementById("nextWeek"),
    todayBtn: document.getElementById("todayBtn"),
    themeToggle: document.getElementById("themeToggle"),
    progressFill: document.getElementById("progressFill"),
    progressLabel: document.getElementById("progressLabel"),
    goalsList: document.getElementById("goalsList"),
    goalForm: document.getElementById("goalForm"),
    goalInput: document.getElementById("goalInput"),
    daysGrid: document.getElementById("daysGrid"),
    habitsBody: document.getElementById("habitsBody"),
    habitForm: document.getElementById("habitForm"),
    habitInput: document.getElementById("habitInput"),
    notesArea: document.getElementById("notesArea"),
  };

  // ---------- Rendering ----------

  function renderAll() {
    el.weekLabel.textContent = formatWeekLabel(currentMonday);
    renderGoals();
    renderDays();
    renderHabits();
    renderNotes();
    renderProgress();
  }

  function renderGoals() {
    el.goalsList.innerHTML = "";
    weekData.goals.forEach((goal) => {
      const li = document.createElement("li");
      li.className = goal.done ? "done" : "";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = goal.done;
      checkbox.addEventListener("change", () => {
        goal.done = checkbox.checked;
        persist();
        renderGoals();
        renderProgress();
      });

      const span = document.createElement("span");
      span.className = "goal-text";
      span.textContent = goal.text;

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "✕";
      del.title = "Ziel entfernen";
      del.addEventListener("click", () => {
        weekData.goals = weekData.goals.filter((g) => g.id !== goal.id);
        persist();
        renderGoals();
        renderProgress();
      });

      li.append(checkbox, span, del);
      el.goalsList.appendChild(li);
    });
  }

  function nextPriority(p) {
    const idx = PRIORITIES.indexOf(p);
    return PRIORITIES[(idx + 1) % PRIORITIES.length];
  }

  function renderDays() {
    el.daysGrid.innerHTML = "";
    const today = new Date();

    DAY_NAMES.forEach((name, dayIndex) => {
      const date = addDays(currentMonday, dayIndex);
      const card = document.createElement("div");
      card.className = "day-card" + (sameDay(date, today) ? " is-today" : "");

      const head = document.createElement("div");
      head.className = "day-head";
      head.innerHTML = `<span class="day-name">${name}</span><span class="day-date">${date.getDate()}. ${MONTHS[date.getMonth()]}</span>`;
      card.appendChild(head);

      const list = document.createElement("ul");
      list.className = "task-list";
      (weekData.tasks[dayIndex] || []).forEach((task) => {
        const li = document.createElement("li");
        li.className = "task-item" + (task.done ? " done" : "");

        const dot = document.createElement("span");
        dot.className = `prio-dot prio-${task.priority}`;
        dot.title = "Priorität ändern";
        dot.addEventListener("click", () => {
          task.priority = nextPriority(task.priority);
          persist();
          renderDays();
        });

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.addEventListener("change", () => {
          task.done = checkbox.checked;
          persist();
          renderDays();
          renderProgress();
        });

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;

        const del = document.createElement("button");
        del.className = "delete-btn";
        del.textContent = "✕";
        del.title = "Aufgabe entfernen";
        del.addEventListener("click", () => {
          weekData.tasks[dayIndex] = weekData.tasks[dayIndex].filter((t) => t.id !== task.id);
          persist();
          renderDays();
          renderProgress();
        });

        li.append(dot, checkbox, text, del);
        list.appendChild(li);
      });
      card.appendChild(list);

      const form = document.createElement("form");
      form.className = "day-add-form";
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Aufgabe hinzufügen…";
      input.maxLength = 140;
      form.appendChild(input);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        weekData.tasks[dayIndex] = weekData.tasks[dayIndex] || [];
        weekData.tasks[dayIndex].push({ id: uid(), text: value, done: false, priority: "medium" });
        persist();
        input.value = "";
        renderDays();
        renderProgress();
      });
      card.appendChild(form);

      el.daysGrid.appendChild(card);
    });
  }

  function renderHabits() {
    el.habitsBody.innerHTML = "";
    habitDefs.forEach((habit) => {
      const row = document.createElement("tr");
      row.className = "habit-row";

      const nameCell = document.createElement("td");
      nameCell.className = "habit-name-col";
      nameCell.textContent = habit.name;
      row.appendChild(nameCell);

      const checks = weekData.habitChecks[habit.id] || [false, false, false, false, false, false, false];

      for (let i = 0; i < 7; i++) {
        const cell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!checks[i];
        checkbox.addEventListener("change", () => {
          const arr = weekData.habitChecks[habit.id] || [false, false, false, false, false, false, false];
          arr[i] = checkbox.checked;
          weekData.habitChecks[habit.id] = arr;
          persist();
        });
        cell.appendChild(checkbox);
        row.appendChild(cell);
      }

      const delCell = document.createElement("td");
      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "✕";
      del.title = "Gewohnheit entfernen";
      del.addEventListener("click", () => {
        habitDefs = habitDefs.filter((h) => h.id !== habit.id);
        saveHabitDefs(habitDefs);
        renderHabits();
      });
      delCell.appendChild(del);
      row.appendChild(delCell);

      el.habitsBody.appendChild(row);
    });
  }

  function renderNotes() {
    el.notesArea.value = weekData.notes || "";
  }

  function renderProgress() {
    let total = 0;
    let done = 0;
    Object.values(weekData.tasks).forEach((list) => {
      total += list.length;
      done += list.filter((t) => t.done).length;
    });
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    el.progressFill.style.width = `${pct}%`;
    el.progressLabel.textContent = `${pct}%`;
  }

  // ---------- Theme ----------

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    el.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    const preferred = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(preferred);
  }

  // ---------- Events ----------

  el.prevWeek.addEventListener("click", () => switchWeek(addDays(currentMonday, -7)));
  el.nextWeek.addEventListener("click", () => switchWeek(addDays(currentMonday, 7)));
  el.todayBtn.addEventListener("click", () => switchWeek(startOfWeek(new Date())));

  el.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  el.goalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = el.goalInput.value.trim();
    if (!value) return;
    weekData.goals.push({ id: uid(), text: value, done: false });
    persist();
    el.goalInput.value = "";
    renderGoals();
  });

  el.habitForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = el.habitInput.value.trim();
    if (!value) return;
    habitDefs.push({ id: uid(), name: value });
    saveHabitDefs(habitDefs);
    el.habitInput.value = "";
    renderHabits();
  });

  el.notesArea.addEventListener("input", () => {
    weekData.notes = el.notesArea.value;
    persist();
  });

  // ---------- Init ----------

  initTheme();
  renderAll();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
