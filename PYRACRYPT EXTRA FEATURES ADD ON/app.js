const STORAGE_KEY = "pyracrypt-addon-state-v1";

const preventionControls = [
  "Enable MFA for all admin and high-privilege accounts.",
  "Deploy endpoint protection/EDR with behavior detection.",
  "Patch critical OS and dependency CVEs within 72 hours.",
  "Use least privilege and separate service accounts.",
  "Monitor auth anomalies and brute-force patterns.",
  "Isolate backups and test restore monthly.",
  "Use phishing-resistant authentication where possible.",
  "Add IDS/IPS rules for known attack signatures.",
];

const playbooks = {
  Phishing: [
    "Isolate impacted mailboxes and force password reset.",
    "Revoke active sessions and rotate compromised tokens.",
    "Collect phishing headers, URLs, and sender indicators.",
    "Block indicators in mail gateway and DNS filters.",
    "Run awareness alert and targeted user training follow-up.",
  ],
  Ransomware: [
    "Isolate affected hosts immediately from network.",
    "Preserve disk/memory evidence before reimaging.",
    "Identify patient-zero and lateral movement path.",
    "Restore from known-good offline backups.",
    "Harden exposed vectors and patch exploited systems.",
  ],
  "Credential Stuffing": [
    "Throttle login attempts and activate bot mitigation.",
    "Force resets for exposed credential sets.",
    "Enable adaptive MFA challenges by risk score.",
    "Check for unusual geolocation and device fingerprint patterns.",
    "Notify users and review breached password detection policy.",
  ],
};

const mergeRows = [
  { app: "Pyracrypt", focus: "Core security platform and dashboard", status: "In Progress" },
  { app: "Ai-Tools-Hub", focus: "Assistant and automation modules", status: "In Progress" },
  { app: "CYBER-SECURITY-MINI-APPS", focus: "Playbooks and hardening tools", status: "Planned" },
  { app: "Svivva / SEO pack", focus: "Top-of-funnel acquisition", status: "In Progress" },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { controls: {}, leads: [] };
    const parsed = JSON.parse(raw);
    return { controls: parsed.controls || {}, leads: parsed.leads || [] };
  } catch (err) {
    return { controls: {}, leads: [] };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

function analyzeScenario(text) {
  const q = text.toLowerCase();
  const matches = [];

  if (q.includes("phish")) {
    matches.push("Phishing defense: enforce MFA, block malicious senders/domains, and train users.");
  }
  if (q.includes("ransom")) {
    matches.push("Ransomware defense: isolate endpoints, use immutable backups, and monitor lateral movement.");
  }
  if (q.includes("credential") || q.includes("password")) {
    matches.push("Credential defense: adaptive MFA, breach-password checks, and session anomaly detection.");
  }
  if (q.includes("zero-day") || q.includes("unknown")) {
    matches.push("For unknown attacks, prioritize behavior-based detection, segmentation, and rapid containment playbooks.");
  }
  if (q.includes("crowdstrike") || q.includes("edr")) {
    matches.push("EDR posture: combine signature detections with behavior analytics and threat intel updates.");
  }

  if (matches.length === 0) {
    matches.push(
      "General guidance: use layered defense (MFA, patching, EDR, IDS/IPS), log monitoring, and tested incident response."
    );
  }

  matches.push("Reality check: AI handles known/current patterns best; maintain continuous updates for new threat variants.");
  return matches.join("\n- ");
}

function renderPrevention(state) {
  const root = document.getElementById("preventionList");
  root.innerHTML = "";
  preventionControls.forEach((control, idx) => {
    const id = `control-${idx}`;
    const wrap = document.createElement("div");
    wrap.className = "item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.checked = Boolean(state.controls[id]);
    checkbox.addEventListener("change", () => {
      state.controls[id] = checkbox.checked;
      saveState(state);
    });

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = control;

    wrap.appendChild(checkbox);
    wrap.appendChild(label);
    root.appendChild(wrap);
  });
}

function renderPlaybookOptions() {
  const select = document.getElementById("playbookSelect");
  select.innerHTML = "";
  Object.keys(playbooks).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

function renderPlaybookSteps(name) {
  const steps = playbooks[name] || [];
  const list = document.getElementById("playbookSteps");
  list.innerHTML = "";
  steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    list.appendChild(li);
  });
}

function renderLeads(state) {
  const root = document.getElementById("leadList");
  root.innerHTML = "";
  if (state.leads.length === 0) {
    root.textContent = "No leads yet.";
    return;
  }

  state.leads.forEach((lead, idx) => {
    const card = document.createElement("div");
    card.className = "lead";
    card.innerHTML = `
      <strong>${lead.name}</strong><br />
      <span>${lead.problem}</span><br />
      <small>Stage: ${lead.stage}</small>
      <div style="margin-top:8px;">
        <button data-lead-idx="${idx}" class="btn ghost moveLeadBtn">Move To Next Stage</button>
      </div>
    `;
    root.appendChild(card);
  });

  document.querySelectorAll(".moveLeadBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.leadIdx);
      const stages = ["Awareness", "Evaluation", "Trial", "Conversion", "Retention"];
      const currentIndex = stages.indexOf(state.leads[i].stage);
      if (currentIndex >= 0 && currentIndex < stages.length - 1) {
        state.leads[i].stage = stages[currentIndex + 1];
        saveState(state);
        renderLeads(state);
      }
    });
  });
}

function renderMergeTable() {
  const tbody = document.getElementById("mergeTable");
  tbody.innerHTML = "";
  mergeRows.forEach((row) => {
    const tr = document.createElement("tr");
    const statusClass = row.status === "Planned" ? "warn" : "ok";
    tr.innerHTML = `
      <td>${row.app}</td>
      <td>${row.focus}</td>
      <td><span class="tag ${statusClass}">${row.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function bindEvents(state) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.getElementById("analyzeBtn").addEventListener("click", () => {
    const text = document.getElementById("assistantInput").value.trim();
    const result = analyzeScenario(text || "general defense strategy");
    document.getElementById("assistantOutput").textContent = `Recommended actions:\n- ${result}`;
  });

  document.getElementById("loadDemoBtn").addEventListener("click", () => {
    document.getElementById("assistantInput").value =
      "Can I program software to prevent current forms of intrusion, and how should AI help without pretending it is AGI?";
    switchTab("assistant");
  });

  document.getElementById("loadPlaybookBtn").addEventListener("click", () => {
    const selected = document.getElementById("playbookSelect").value;
    renderPlaybookSteps(selected);
  });

  document.getElementById("addLeadBtn").addEventListener("click", () => {
    const name = document.getElementById("leadName").value.trim();
    const problem = document.getElementById("leadProblem").value.trim();
    const stage = document.getElementById("leadStage").value;
    if (!name || !problem) return;

    state.leads.unshift({ name, problem, stage });
    saveState(state);
    renderLeads(state);

    document.getElementById("leadName").value = "";
    document.getElementById("leadProblem").value = "";
    document.getElementById("leadStage").value = "Awareness";
  });

  document.getElementById("exportStateBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pyracrypt-addon-state.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  const importInput = document.getElementById("importInput");
  document.getElementById("importStateBtn").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      state.controls = parsed.controls || {};
      state.leads = parsed.leads || [];
      saveState(state);
      renderPrevention(state);
      renderLeads(state);
    } catch (err) {
      alert("Invalid JSON state file.");
    }
  });
}

function bootstrap() {
  const state = loadState();
  renderPrevention(state);
  renderPlaybookOptions();
  renderPlaybookSteps("Phishing");
  renderLeads(state);
  renderMergeTable();
  bindEvents(state);
}

bootstrap();
