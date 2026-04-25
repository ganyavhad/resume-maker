/* ATS Resume Builder — vanilla JS
   State-driven render. Sections are dynamic; items inside sections are dynamic.
   Project descriptions and experience descriptions support bullets (one per line).
*/

const STORAGE_KEY = "ats_resume_builder_v1";

/* ---------- Default state ---------- */
function uid() { return Math.random().toString(36).slice(2, 9); }

function defaultState() {
  return {
    template: "t1",
    personal: {
      name: "Jane Doe",
      title: "Software Engineer",
      email: "jane@example.com",
      phone: "+1 555 555 5555",
      location: "San Francisco, CA",
      website: "janedoe.dev",
      linkedin: "linkedin.com/in/janedoe",
      github: "github.com/janedoe",
      summary:
        "Results-driven software engineer with 5+ years building scalable web applications. Strong in JavaScript, TypeScript, and cloud platforms. Passionate about clean code, testing, and delivering measurable business impact.",
    },
    sections: [
      {
        id: uid(), type: "experience", title: "Experience",
        items: [
          {
            id: uid(),
            role: "Senior Software Engineer",
            org: "Acme Corp",
            location: "Remote",
            start: "2022", end: "Present",
            description:
              "Led migration of monolith to microservices, reducing latency by 40%.\nMentored 4 junior engineers; introduced code review standards.\nOwned CI/CD pipeline (GitHub Actions, Docker, AWS ECS).",
          },
          {
            id: uid(),
            role: "Software Engineer",
            org: "Beta Labs",
            location: "New York, NY",
            start: "2019", end: "2022",
            description:
              "Built customer-facing dashboards in React, serving 100k+ MAU.\nReduced bundle size by 35% via code splitting and tree shaking.",
          },
        ],
      },
      {
        id: uid(), type: "projects", title: "Projects",
        items: [
          {
            id: uid(),
            name: "Open Source Resume Builder",
            link: "github.com/janedoe/resume-builder",
            tech: "JavaScript, HTML, CSS",
            description:
              "Built a fully client-side ATS resume builder with 10 templates.\nImplemented dynamic sections and PDF export.\nReached 1.2k GitHub stars in 6 months.",
          },
        ],
      },
      {
        id: uid(), type: "education", title: "Education",
        items: [
          {
            id: uid(),
            degree: "B.Sc. Computer Science",
            school: "State University",
            location: "Boston, MA",
            start: "2015", end: "2019",
            details: "GPA 3.8/4.0 · Dean's List",
          },
        ],
      },
      {
        id: uid(), type: "skills", title: "Skills",
        items: [
          { id: uid(), group: "Languages", tags: "JavaScript, TypeScript, Python, SQL" },
          { id: uid(), group: "Frameworks", tags: "React, Node.js, Express, Next.js" },
          { id: uid(), group: "Tools", tags: "Git, Docker, AWS, GitHub Actions" },
        ],
      },
    ],
  };
}

/* ---------- State management ---------- */
let state = loadState() || defaultState();

function saveState(showAlert = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (showAlert) toast("Saved to this browser.");
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function resetState() {
  if (!confirm("Reset all content to the sample resume?")) return;
  state = defaultState();
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
}

/* ---------- Helpers ---------- */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}
function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}
function toBullets(text) {
  // Split on newlines; trim; drop empties; strip leading bullet markers
  return String(text || "")
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*[•\-\*\u2022]+\s*/, "").trim())
    .filter(Boolean);
}
function toast(msg) {
  const t = el("div", { class: "no-print", style:
    "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111827;color:#fff;padding:8px 14px;border-radius:6px;font-size:13px;z-index:50;opacity:.95;" }, msg);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

/* ---------- Editor render ---------- */
function bindPersonalInputs() {
  $$("input[data-bind], textarea[data-bind]").forEach(input => {
    const key = input.dataset.bind;
    input.value = state.personal[key] ?? "";
    input.addEventListener("input", () => {
      state.personal[key] = input.value;
      renderPreview();
    });
  });
}

function renderSectionsEditor() {
  const root = $("#sectionsEditor");
  root.innerHTML = "";
  state.sections.forEach((section, idx) => {
    root.appendChild(renderSectionCard(section, idx));
  });
}

function renderSectionCard(section, idx) {
  const card = el("div", { class: "card section-card" });

  const head = el("div", { class: "section-head" }, [
    el("input", {
      class: "section-title", type: "text", value: section.title,
      oninput: (e) => { section.title = e.target.value; renderPreview(); }
    }),
    el("div", { class: "section-actions" }, [
      el("button", { class: "icon-btn", title: "Move up",
        onclick: () => moveSection(idx, -1) }, "↑"),
      el("button", { class: "icon-btn", title: "Move down",
        onclick: () => moveSection(idx, 1) }, "↓"),
      el("button", { class: "icon-btn danger", title: "Delete section",
        onclick: () => deleteSection(idx) }, "✕"),
    ]),
  ]);
  card.appendChild(head);

  const itemsWrap = el("div", { class: "items" });
  section.items.forEach((item, i) => itemsWrap.appendChild(renderItemEditor(section, item, i)));
  card.appendChild(itemsWrap);

  if (section.type !== "text") {
    card.appendChild(el("div", { class: "row", style: "margin-top:10px;" }, [
      el("button", { class: "subtle",
        onclick: () => addItem(section) }, `+ Add ${labelForItem(section.type)}`),
    ]));
  }

  if (section.type === "text") {
    // Single textarea content
    const ta = el("textarea", {
      rows: 4, placeholder: "Free text...",
      oninput: (e) => { section.content = e.target.value; renderPreview(); }
    });
    ta.value = section.content || "";
    card.appendChild(el("label", { class: "full" }, ["Content", ta]));
  }

  return card;
}

function labelForItem(type) {
  switch (type) {
    case "experience": return "Experience";
    case "projects": return "Project";
    case "education": return "Education";
    case "skills": return "Skill Group";
    case "list": return "Bullet";
    default: return "Item";
  }
}

function renderItemEditor(section, item, i) {
  const wrap = el("div", { class: "item" });
  wrap.appendChild(el("div", { class: "item-head" }, [
    el("div", { class: "row", style: "gap:6px;" }, [
      el("button", { class: "icon-btn", title: "Move up",
        onclick: () => moveItem(section, i, -1) }, "↑"),
      el("button", { class: "icon-btn", title: "Move down",
        onclick: () => moveItem(section, i, 1) }, "↓"),
      el("button", { class: "icon-btn danger", title: "Remove",
        onclick: () => removeItem(section, i) }, "✕"),
    ])
  ]));

  const bind = (key, attrs = {}) => {
    const isArea = attrs.tag === "textarea";
    delete attrs.tag;
    const node = el(isArea ? "textarea" : "input", {
      ...attrs,
      oninput: (e) => { item[key] = e.target.value; renderPreview(); }
    });
    node.value = item[key] ?? "";
    return node;
  };

  switch (section.type) {
    case "experience": {
      wrap.appendChild(el("div", { class: "grid2" }, [
        el("label", {}, ["Role / Title", bind("role", { type: "text", placeholder: "Senior Engineer" })]),
        el("label", {}, ["Organization", bind("org", { type: "text", placeholder: "Company" })]),
        el("label", {}, ["Location", bind("location", { type: "text", placeholder: "City / Remote" })]),
        el("label", {}, ["Dates", el("div", { class: "row", style: "gap:6px;" }, [
          bind("start", { type: "text", placeholder: "2022", style: "flex:1;" }),
          bind("end",   { type: "text", placeholder: "Present", style: "flex:1;" }),
        ])]),
      ]));
      wrap.appendChild(el("label", { class: "full" }, [
        "Description (one bullet per line)",
        bind("description", { tag: "textarea", rows: 4, placeholder: "One bullet per line..." })
      ]));
      break;
    }
    case "projects": {
      wrap.appendChild(el("div", { class: "grid2" }, [
        el("label", {}, ["Project Name", bind("name", { type: "text", placeholder: "My Project" })]),
        el("label", {}, ["Link", bind("link", { type: "text", placeholder: "github.com/..." })]),
      ]));
      wrap.appendChild(el("label", { class: "full" }, [
        "Tech / Stack", bind("tech", { type: "text", placeholder: "React, Node.js, Postgres" })
      ]));
      wrap.appendChild(el("label", { class: "full" }, [
        "Description (one bullet per line)",
        bind("description", { tag: "textarea", rows: 4, placeholder: "Built X to do Y...\nReduced Z by 30%..." })
      ]));
      break;
    }
    case "education": {
      wrap.appendChild(el("div", { class: "grid2" }, [
        el("label", {}, ["Degree", bind("degree", { type: "text", placeholder: "B.Sc. CS" })]),
        el("label", {}, ["School", bind("school", { type: "text", placeholder: "University" })]),
        el("label", {}, ["Location", bind("location", { type: "text", placeholder: "City" })]),
        el("label", {}, ["Dates", el("div", { class: "row", style: "gap:6px;" }, [
          bind("start", { type: "text", placeholder: "2015", style: "flex:1;" }),
          bind("end",   { type: "text", placeholder: "2019", style: "flex:1;" }),
        ])]),
      ]));
      wrap.appendChild(el("label", { class: "full" }, [
        "Details", bind("details", { type: "text", placeholder: "GPA, honors, coursework" })
      ]));
      break;
    }
    case "skills": {
      wrap.appendChild(el("div", { class: "grid2" }, [
        el("label", {}, ["Group", bind("group", { type: "text", placeholder: "Languages" })]),
        el("label", {}, ["Tags (comma-separated)", bind("tags", { type: "text", placeholder: "JS, TS, Python" })]),
      ]));
      break;
    }
    case "list": {
      wrap.appendChild(el("label", { class: "full" }, [
        "Bullet text",
        bind("text", { tag: "textarea", rows: 2, placeholder: "Achievement / item..." })
      ]));
      break;
    }
    default: {
      wrap.appendChild(el("label", { class: "full" }, [
        "Text", bind("text", { tag: "textarea", rows: 3 })
      ]));
    }
  }
  return wrap;
}

/* ---------- Mutations ---------- */
function addSection() {
  const title = $("#newSectionTitle").value.trim() || "New Section";
  const type = $("#newSectionType").value;
  const section = { id: uid(), type, title, items: [] };
  if (type === "text") section.content = "";
  else section.items.push(blankItem(type));
  state.sections.push(section);
  $("#newSectionTitle").value = "";
  renderAll();
}
function blankItem(type) {
  switch (type) {
    case "experience": return { id: uid(), role: "", org: "", location: "", start: "", end: "", description: "" };
    case "projects":   return { id: uid(), name: "", link: "", tech: "", description: "" };
    case "education":  return { id: uid(), degree: "", school: "", location: "", start: "", end: "", details: "" };
    case "skills":     return { id: uid(), group: "", tags: "" };
    case "list":       return { id: uid(), text: "" };
    default:           return { id: uid(), text: "" };
  }
}
function addItem(section) { section.items.push(blankItem(section.type)); renderAll(); }
function removeItem(section, i) { section.items.splice(i, 1); renderAll(); }
function moveItem(section, i, delta) {
  const j = i + delta;
  if (j < 0 || j >= section.items.length) return;
  [section.items[i], section.items[j]] = [section.items[j], section.items[i]];
  renderAll();
}
function moveSection(i, delta) {
  const j = i + delta;
  if (j < 0 || j >= state.sections.length) return;
  [state.sections[i], state.sections[j]] = [state.sections[j], state.sections[i]];
  renderAll();
}
function deleteSection(i) {
  if (!confirm(`Delete section "${state.sections[i].title}"?`)) return;
  state.sections.splice(i, 1);
  renderAll();
}

/* ---------- Preview render ---------- */
function renderPreview() {
  const r = $("#resume");
  r.className = "resume " + state.template;
  r.innerHTML = renderResumeHTML();
}

function renderResumeHTML() {
  const p = state.personal;
  const contactBits = [
    p.email && `<span>${escapeHTML(p.email)}</span>`,
    p.phone && `<span>${escapeHTML(p.phone)}</span>`,
    p.location && `<span>${escapeHTML(p.location)}</span>`,
    p.website && `<span>${escapeHTML(p.website)}</span>`,
    p.linkedin && `<span>${escapeHTML(p.linkedin)}</span>`,
    p.github && `<span>${escapeHTML(p.github)}</span>`,
  ].filter(Boolean).join("");

  const header = `
    <header class="r-header">
      <div class="r-name">${escapeHTML(p.name) || "Your Name"}</div>
      ${p.title ? `<div class="r-title">${escapeHTML(p.title)}</div>` : ""}
      ${contactBits ? `<div class="r-contact">${contactBits}</div>` : ""}
    </header>`;

  let summary = "";
  if (p.summary && p.summary.trim()) {
    summary = `
      <section class="r-section ${state.template === "t10" ? "col-main" : ""}">
        <div class="r-section-title">Summary</div>
        <p>${escapeHTML(p.summary).replace(/\n/g, "<br>")}</p>
      </section>`;
  }

  const sectionsHTML = state.sections.map(s => renderSectionHTML(s)).join("");

  return header + summary + sectionsHTML;
}

function renderSectionHTML(section) {
  const sideTypes = new Set(["skills", "list"]);
  const colClass = state.template === "t10"
    ? (sideTypes.has(section.type) ? "col-side" : "col-main")
    : "";

  let body = "";
  switch (section.type) {
    case "experience":
      body = section.items.map(it => {
        const bullets = toBullets(it.description);
        return `
        <div class="r-item">
          <div class="r-item-row">
            <div>
              <div class="r-item-title">${escapeHTML(it.role || "")}${it.org ? ` · <span class="r-item-sub">${escapeHTML(it.org)}</span>` : ""}</div>
              ${it.location ? `<div class="r-item-meta">${escapeHTML(it.location)}</div>` : ""}
            </div>
            <div class="r-item-meta">${escapeHTML([it.start, it.end].filter(Boolean).join(" – "))}</div>
          </div>
          ${bullets.length ? `<ul>${bullets.map(b => `<li>${escapeHTML(b)}</li>`).join("")}</ul>` : ""}
        </div>`;
      }).join("");
      break;

    case "projects":
      body = section.items.map(it => {
        const bullets = toBullets(it.description);
        return `
        <div class="r-item">
          <div class="r-item-row">
            <div>
              <div class="r-item-title">${escapeHTML(it.name || "")}${it.link ? ` · <a class="r-item-link" href="${escapeHTML(/^https?:/.test(it.link) ? it.link : "https://" + it.link)}">${escapeHTML(it.link)}</a>` : ""}</div>
              ${it.tech ? `<div class="r-item-sub">${escapeHTML(it.tech)}</div>` : ""}
            </div>
          </div>
          ${bullets.length ? `<ul>${bullets.map(b => `<li>${escapeHTML(b)}</li>`).join("")}</ul>` : ""}
        </div>`;
      }).join("");
      break;

    case "education":
      body = section.items.map(it => `
        <div class="r-item">
          <div class="r-item-row">
            <div>
              <div class="r-item-title">${escapeHTML(it.degree || "")}${it.school ? ` · <span class="r-item-sub">${escapeHTML(it.school)}</span>` : ""}</div>
              ${it.location ? `<div class="r-item-meta">${escapeHTML(it.location)}</div>` : ""}
              ${it.details ? `<div class="r-item-meta">${escapeHTML(it.details)}</div>` : ""}
            </div>
            <div class="r-item-meta">${escapeHTML([it.start, it.end].filter(Boolean).join(" – "))}</div>
          </div>
        </div>`).join("");
      break;

    case "skills":
      body = section.items.map(it => {
        const tags = (it.tags || "").split(",").map(t => t.trim()).filter(Boolean);
        return `
        <div class="r-item">
          ${it.group ? `<div class="r-item-title">${escapeHTML(it.group)}</div>` : ""}
          ${tags.length ? `<div class="r-tags">${tags.map(t => `<span class="r-tag">${escapeHTML(t)}</span>`).join("")}</div>` : ""}
        </div>`;
      }).join("");
      break;

    case "list":
      body = `<ul>${section.items.map(it => {
        const lines = toBullets(it.text);
        return lines.map(l => `<li>${escapeHTML(l)}</li>`).join("");
      }).join("")}</ul>`;
      break;

    case "text":
      body = `<p>${escapeHTML(section.content || "").replace(/\n/g, "<br>")}</p>`;
      break;
  }

  return `
    <section class="r-section ${colClass}">
      <div class="r-section-title">${escapeHTML(section.title)}</div>
      ${body}
    </section>`;
}

/* ---------- Wire-up ---------- */
function renderAll() {
  renderSectionsEditor();
  renderPreview();
}

document.addEventListener("DOMContentLoaded", () => {
  // Personal info
  bindPersonalInputs();

  // Template select
  const sel = $("#templateSelect");
  sel.value = state.template;
  sel.addEventListener("change", () => {
    state.template = sel.value;
    renderPreview();
  });

  // Top buttons
  $("#saveBtn").addEventListener("click", () => saveState(true));
  $("#loadBtn").addEventListener("click", () => {
    const loaded = loadState();
    if (!loaded) return toast("No saved resume found.");
    state = loaded;
    $("#templateSelect").value = state.template;
    bindPersonalInputs();
    renderAll();
    toast("Loaded saved resume.");
  });
  $("#resetBtn").addEventListener("click", resetState);
  $("#exportBtn").addEventListener("click", () => window.print());

  // Add section
  $("#addSectionBtn").addEventListener("click", addSection);

  renderAll();

  // Auto-save lightly on changes
  let t;
  document.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => saveState(false), 600);
  });
});
