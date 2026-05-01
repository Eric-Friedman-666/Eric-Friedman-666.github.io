const profileUrl = "data/profile.json";
const progressUrl = "data/progress.json";
const refreshMs = 30000;

const state = {
  profile: null,
  progress: [],
  filter: "all",
  loading: false,
};

const $ = (selector) => document.querySelector(selector);

async function fetchJson(url) {
  const target = `${url}?t=${Date.now()}`;
  const response = await fetch(target, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateTime(value) {
  if (!value) return "No timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

function statusLabel(status) {
  const labels = {
    active: "Active",
    analysis: "Analysis",
    production: "Production",
    manuscript: "Manuscript",
    running: "Running",
    planning: "Planning",
  };
  return labels[status] || status;
}

function statusClass(status) {
  return `status-${status || "active"}`;
}

function tagsHtml(tags) {
  return (tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
}

function renderLinks(links) {
  const container = $("#profile-links");
  container.innerHTML = "";
  (links || []).forEach((link, index) => {
    const anchor = document.createElement("a");
    anchor.className = `text-button ${index === 0 ? "primary" : ""}`;
    anchor.href = link.href;
    anchor.textContent = link.label;
    if (/^https?:/.test(link.href)) {
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
    }
    container.appendChild(anchor);
  });
}

function renderProfile(profile) {
  $("#profile-kicker").textContent = profile.kicker || "Research Homepage";
  renderDisplayName(profile.name || "Eric Friedman (Qingyuan Liang)");
  $("#profile-headline").textContent = profile.headline || "";
  $("#profile-summary").textContent = profile.summary || "";
  $("#footer-note").textContent = profile.footer || "Built as a local research homepage.";

  renderLinks(profile.links);
  renderCV(profile.cv || {});
  renderWork(profile.workHighlights || []);
  renderProjects(profile.currentProjects || []);
  renderTimeline(profile.futureDirections || []);
  renderOutputs(profile.outputs || []);
  renderContact(profile.contact || []);
}

function renderDisplayName(name) {
  const target = $("#profile-name");
  const match = String(name).match(/^(.*?)\s*(\([^)]*\))\s*$/);
  if (!match) {
    target.textContent = name;
    return;
  }

  const primary = escapeHtml(match[1].trim());
  const alias = escapeHtml(match[2].replace(/ /g, "\u00a0"));
  target.innerHTML = `<span class="name-primary">${primary}</span> <span class="name-alias">${alias}</span>`;
}

function renderCV(cv) {
  $("#cv-overview").textContent = cv.overview || "";
  $("#cv-tags").innerHTML = tagsHtml(cv.focus || []);

  $("#education-list").innerHTML = (cv.education || [])
    .map(
      (item) => `
        <div class="cv-item">
          <strong>${escapeHtml(item.degree)}</strong>
          <span>${escapeHtml(item.institution)}</span>
          <small>${escapeHtml(item.period)} | ${escapeHtml(item.note)}</small>
        </div>
      `,
    )
    .join("");

  $("#skills-list").innerHTML = (cv.skills || [])
    .map(
      (group) => `
        <div class="skill-group">
          <strong>${escapeHtml(group.label)}</strong>
          <p>${escapeHtml(group.items.join(", "))}</p>
        </div>
      `,
    )
    .join("");
}

function renderWork(items) {
  const container = $("#work-list");
  container.innerHTML = items
    .map((item, index) => {
      return `
        <article class="research-card">
          <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <div class="tag-row">${tagsHtml(item.tags)}</div>
        </article>
      `;
    })
    .join("");
}

function renderProjects(items) {
  const container = $("#project-list");
  container.innerHTML = items
    .map(
      (item, index) => `
        <article class="project-card">
          <div class="project-number">${String(index + 1).padStart(2, "0")}</div>
          <div class="project-body">
            <div class="project-heading">
              <p class="eyebrow">${escapeHtml(item.area)}</p>
              <h3>${escapeHtml(item.title)}</h3>
            </div>
            <p>${escapeHtml(item.description)}</p>
            <div class="project-columns">
              <div>
                <strong>My role</strong>
                <p>${escapeHtml(item.role)}</p>
              </div>
              <div>
                <strong>Current progress</strong>
                <p>${escapeHtml(item.progress)}</p>
              </div>
            </div>
            <div class="tag-row">${tagsHtml(item.tags)}</div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderTimeline(items) {
  const container = $("#timeline-list");
  container.innerHTML = items
    .map(
      (item) => `
        <li>
          <time>${escapeHtml(item.when)}</time>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
          </div>
        </li>
      `,
    )
    .join("");
}

function renderOutputs(items) {
  const container = $("#outputs-list");
  container.innerHTML = items
    .map((item) => {
      const link = item.href
        ? `<a href="${escapeHtml(item.href)}" ${/^https?:/.test(item.href) ? 'target="_blank" rel="noreferrer"' : ""}>Open material</a>`
        : "";
      return `
        <article class="output-card">
          <p class="eyebrow">${escapeHtml(item.type)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          ${link}
        </article>
      `;
    })
    .join("");
}

function renderContact(items) {
  const container = $("#contact-links");
  container.innerHTML = items
    .map((item) => {
      const value = escapeHtml(item.value);
      const href = item.href ? escapeHtml(item.href) : "#";
      return `
        <a class="contact-link" href="${href}">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${value}</span>
        </a>
      `;
    })
    .join("");
}

function renderFilters(progress) {
  const statuses = Array.from(new Set(progress.map((item) => item.status).filter(Boolean)));
  const filters = [{ key: "all", label: "All" }].concat(
    statuses.map((status) => ({ key: status, label: statusLabel(status) })),
  );

  $("#progress-filters").innerHTML = filters
    .map(
      (filter) => `
        <button type="button" data-filter="${escapeHtml(filter.key)}" aria-pressed="${filter.key === state.filter}">
          ${escapeHtml(filter.label)}
        </button>
      `,
    )
    .join("");

  $("#progress-filters").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      renderProgress(state.progress);
    });
  });
}

function renderStats(progress) {
  const activeCount = progress.filter((item) => ["active", "running", "production"].includes(item.status)).length;
  const avg =
    progress.length === 0
      ? 0
      : Math.round(progress.reduce((sum, item) => sum + Number(item.percent || 0), 0) / progress.length);
  const latest = progress
    .map((item) => new Date(item.updatedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a)[0];

  const latestLabel = latest
    ? new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(latest)
    : "N/A";

  $("#status-stats").innerHTML = `
    <div class="stat"><strong>${progress.length}</strong><span>Main projects</span></div>
    <div class="stat"><strong>${activeCount}</strong><span>Active or running</span></div>
    <div class="stat"><strong>${avg}%</strong><span>Mean completion</span></div>
    <div class="stat"><strong class="compact-value">${escapeHtml(latestLabel)}</strong><span>Latest update</span></div>
  `;
}

function renderProgress(progress) {
  renderFilters(progress);
  renderStats(progress);

  const filtered =
    state.filter === "all" ? progress : progress.filter((item) => item.status === state.filter);

  $("#progress-list").innerHTML = filtered
    .map((item) => {
      const tasks = (item.tasks || []).map((task) => `<li>${escapeHtml(task)}</li>`).join("");
      const percent = Math.max(0, Math.min(100, Number(item.percent || 0)));
      return `
        <article class="progress-card">
          <div class="progress-topline">
            <div>
              <p class="eyebrow">${escapeHtml(item.area)}</p>
              <h3>${escapeHtml(item.title)}</h3>
            </div>
            <span class="status-pill ${statusClass(item.status)}">${escapeHtml(statusLabel(item.status))}</span>
          </div>
          <p>${escapeHtml(item.summary)}</p>
          <div class="bar" aria-label="${escapeHtml(item.title)} progress">
            <span style="--value: ${percent}%"></span>
          </div>
          <strong>${percent}%</strong>
          <ol class="task-list">${tasks}</ol>
          <div class="meta-row">
            <span>Updated ${escapeHtml(formatDateTime(item.updatedAt))}</span>
            <span>${escapeHtml(item.source || "Local project evidence")}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadProfile() {
  state.profile = await fetchJson(profileUrl);
  renderProfile(state.profile);
}

async function loadProgress() {
  if (state.loading) return;
  state.loading = true;
  try {
    const payload = await fetchJson(progressUrl);
    state.progress = Array.isArray(payload.items) ? payload.items : [];
    renderProgress(state.progress);
    $("#last-refresh").textContent = `Last refresh: ${formatDateTime(new Date())}`;
  } catch (error) {
    $("#last-refresh").textContent = `Progress data unavailable: ${error.message}`;
  } finally {
    state.loading = false;
  }
}

function updateClock() {
  $("#clock").textContent = new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function drawSignalCanvas() {
  const canvas = $("#signalCanvas");
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let raf = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(248, 247, 242, 0.8)";
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(23, 32, 28, 0.055)";
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 80) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    const bands = [
      { color: "rgba(15, 118, 110, 0.22)", amp: 34, speed: 0.0007, offset: 0 },
      { color: "rgba(39, 100, 167, 0.18)", amp: 24, speed: 0.0011, offset: 1.8 },
      { color: "rgba(179, 67, 51, 0.14)", amp: 18, speed: 0.0015, offset: 3.1 },
    ];

    bands.forEach((band, index) => {
      context.beginPath();
      context.strokeStyle = band.color;
      context.lineWidth = index === 0 ? 2 : 1.5;
      for (let x = -20; x <= width + 20; x += 10) {
        const y =
          height * (0.28 + index * 0.18) +
          Math.sin(x * 0.011 + time * band.speed + band.offset) * band.amp +
          Math.cos(x * 0.004 + time * band.speed * 0.7) * band.amp * 0.4;
        if (x === -20) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    });

    context.strokeStyle = "rgba(15, 118, 110, 0.24)";
    context.lineWidth = 1.2;
    const centerX = width * 0.74;
    const centerY = height * 0.35;
    const radius = Math.min(width, height) * 0.11;
    context.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / 3 + time * 0.00008;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.stroke();

    raf = window.requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  raf = window.requestAnimationFrame(draw);
  return () => window.cancelAnimationFrame(raf);
}

async function init() {
  $("#refresh-button").addEventListener("click", loadProgress);
  updateClock();
  window.setInterval(updateClock, 1000);
  drawSignalCanvas();
  await Promise.all([loadProfile(), loadProgress()]);
  window.setInterval(loadProgress, refreshMs);
}

init();
