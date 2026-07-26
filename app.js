"use strict";
/* ================= Data ================= */
const LS_KEY = "budgetData";
const DATA_FILENAME = "budget-data.json";
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GROUPS = [
  { id: "dd",      name: "Direct Debits" },
  { id: "subs",    name: "Subscriptions" },
  { id: "exp",     name: "Expenses" },
  { id: "martina", name: "Martina's" },
  { id: "sean",    name: "Sean's" }
];

const uid = () => Math.random().toString(36).slice(2, 10);

/* Supabase — same project as the Week Planner */
const SUPA_URL = "https://ckaahrsyjeikfnqdbpbo.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrYWFocnN5amVpa2ZucWRicGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNDA4NDYsImV4cCI6MjA5ODgxNjg0Nn0.Amm6sk-XIezov1qXNHZvwZvnLS3aGydeGt7SaF4Kn4s";
const supa = window.supabase ? window.supabase.createClient(SUPA_URL, SUPA_KEY) : null;
let userId = null;          // signed-in account id (shared by Sean & Martina)
let userEmail = "";
let cloudState = "sync";    // sync | ok | offline
let dirty = false;          // unpushed local changes
function lsKey() { return userId ? LS_KEY + "_" + userId : LS_KEY; }

/* Starting data imported from the "Budget 2025" spreadsheet */
const defaultData = () => ({
  version: 1,
  savedAt: null,
  income: {
    "2025-01": { sean: 3000, seanT: 2820, martina: 1680, martinaT: 1440 },
    "2025-08": { sean: 2100, seanT: 1500, martina: 1813, martinaT: 1600 }
  },
  outgoings: [
    { id: uid(), group: "dd", name: "Mortgage", amount: 824, dueDay: 1, account: "", notes: "till September 26" },
    { id: uid(), group: "dd", name: "Home Insurance", amount: 26, dueDay: 1, account: "", notes: "till September 25" },
    { id: uid(), group: "dd", name: "Gas & Electric", amount: 72, dueDay: 1, account: "", notes: "amount to confirm" },
    { id: uid(), group: "dd", name: "Council Tax", amount: 197, dueDay: 1, account: "", notes: "till January 26" },
    { id: uid(), group: "dd", name: "TV License", amount: 15, dueDay: 1, account: "", notes: "" },
    { id: uid(), group: "dd", name: "Car Insurance", amount: 26, dueDay: 2, account: "", notes: "till November 25" },
    { id: uid(), group: "dd", name: "EE", amount: 150, dueDay: 3, account: "", notes: "" },
    { id: uid(), group: "dd", name: "Road Tax", amount: 17, dueDay: 3, account: "Martina Monzo", notes: "" },
    { id: uid(), group: "dd", name: "Fibernest", amount: 48, dueDay: null, account: "Sean Monzo", notes: "" },
    { id: uid(), group: "subs", name: "YouTube", amount: 20, dueDay: 7, account: "", notes: "" },
    { id: uid(), group: "subs", name: "Spotify", amount: 17, dueDay: 24, account: "", notes: "" },
    { id: uid(), group: "subs", name: "Prime", amount: 9, dueDay: 17, account: "", notes: "" },
    { id: uid(), group: "subs", name: "Netflix", amount: 0, dueDay: 6, account: "", notes: "" },
    { id: uid(), group: "subs", name: "Apple TV", amount: 0, dueDay: 20, account: "", notes: "" },
    { id: uid(), group: "subs", name: "NowTV - Series", amount: 10, dueDay: 26, account: "", notes: "" },
    { id: uid(), group: "subs", name: "NowTV - Sports", amount: 26, dueDay: 18, account: "", notes: "" },
    { id: uid(), group: "subs", name: "NowTV - Cinema", amount: 0, dueDay: 25, account: "", notes: "" },
    { id: uid(), group: "subs", name: "NowTV - Booster", amount: 6, dueDay: 6, account: "", notes: "" },
    { id: uid(), group: "exp", name: "Food + Home Shopping", amount: 300, dueDay: null, account: "", notes: "" },
    { id: uid(), group: "exp", name: "Apollo", amount: 70, dueDay: null, account: "", notes: "" },
    { id: uid(), group: "exp", name: "Vape", amount: 100, dueDay: null, account: "", notes: "" },
    { id: uid(), group: "exp", name: "Petrol", amount: 40, dueDay: null, account: "", notes: "" },
    { id: uid(), group: "exp", name: "Trains", amount: 100, dueDay: null, account: "", notes: "" },
    { id: uid(), group: "martina", name: "Patreon - NAQP", amount: 10, dueDay: 27, account: "Martina BoS", notes: "" },
    { id: uid(), group: "martina", name: "Patreon - Cecilia", amount: 3.60, dueDay: 30, account: "Martina BoS", notes: "" },
    { id: uid(), group: "martina", name: "Pret", amount: 5, dueDay: 7, account: "Joint", notes: "" },
    { id: uid(), group: "martina", name: "AppleCare", amount: 4, dueDay: 13, account: "Joint", notes: "" },
    { id: uid(), group: "martina", name: "Adobe PS", amount: 10, dueDay: 23, account: "Joint/BoS", notes: "" },
    { id: uid(), group: "martina", name: "iCloud", amount: 3, dueDay: 2, account: "", notes: "" },
    { id: uid(), group: "sean", name: "Lendwise", amount: 140, dueDay: null, account: "Sean Monzo", notes: "" },
    { id: uid(), group: "sean", name: "Audible", amount: 8, dueDay: 1, account: "Joint", notes: "" },
    { id: uid(), group: "sean", name: "XBox", amount: 13, dueDay: null, account: "Sean Monzo", notes: "" },
    { id: uid(), group: "sean", name: "ChatGPT", amount: 18, dueDay: 6, account: "Joint", notes: "" },
    { id: uid(), group: "sean", name: "Nord VPN", amount: 12, dueDay: null, account: "Joint", notes: "" }
  ],
  debts: [
    { id: uid(), name: "Martina Credit Card", owner: "Martina", history: [
      { month: "2025-01", balance: 1753, payment: 50 },
      { month: "2025-09", balance: 3274.75, payment: null }
    ]},
    { id: uid(), name: "Martina PayPal Credit", owner: "Martina", history: [
      { month: "2025-09", balance: 624, payment: 36 },
      { month: "2025-10", balance: 589.66, payment: null }
    ]},
    { id: uid(), name: "Sean Capital One", owner: "Sean", history: [
      { month: "2025-09", balance: 1486.60, payment: null }
    ]},
    { id: uid(), name: "Sean NatWest", owner: "Sean", history: [
      { month: "2025-09", balance: 1435.91, payment: null }
    ]}
  ],
  log: [
    { id: uid(), date: "2025-08-22", name: "Broccoli", amount: 80 }
  ]
});

let data = load();
let curView = "home";
const now = new Date();
let selMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
let incomeYear = now.getFullYear();
let openHistory = {};   // debtId -> bool
let fileHandle = null;  // FileSystemFileHandle (desktop export)

function migrate(d) {
  d.income = d.income || {};
  d.outgoings = d.outgoings || [];
  d.debts = d.debts || [];
  d.log = d.log || [];
  return d;
}
function load() {
  try {
    const raw = localStorage.getItem(lsKey());
    if (raw) { const d = JSON.parse(raw); if (d && d.outgoings && d.debts) return migrate(d); }
  } catch (e) {}
  return defaultData();
}
function persist() {
  data.savedAt = new Date().toISOString();
  localStorage.setItem(lsKey(), JSON.stringify(data));
  dirty = true;
  schedulePush();
}

/* ================= Helpers ================= */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function gbp(n, dash) {
  if (n == null || isNaN(n)) return dash ? "—" : "£0";
  const opts = Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  const sign = n < 0 ? "-" : "";
  return sign + "£" + Math.abs(n).toLocaleString("en-GB", opts);
}
function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return MONTH_NAMES[m - 1] + " " + y;
}
function shiftMonth(key, delta) {
  let [y, m] = key.split("-").map(Number);
  m += delta;
  while (m < 1) { m += 12; y--; }
  while (m > 12) { m -= 12; y++; }
  return y + "-" + String(m).padStart(2, "0");
}
function ordinal(n) {
  if (n == null) return "";
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function groupTotal(gid) {
  return data.outgoings.filter((o) => o.group === gid).reduce((s, o) => s + (o.amount || 0), 0);
}
function outgoingsTotal() {
  return data.outgoings.reduce((s, o) => s + (o.amount || 0), 0);
}
function latestEntry(debt) {
  if (!debt.history.length) return null;
  return [...debt.history].sort((a, b) => a.month.localeCompare(b.month)).at(-1);
}
function totalDebt() {
  return data.debts.reduce((s, d) => { const e = latestEntry(d); return s + (e ? e.balance || 0 : 0); }, 0);
}

/* ================= Navigation ================= */
document.querySelectorAll("[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});
function showView(v) {
  curView = v;
  document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
  document.querySelectorAll(".view").forEach((s) => s.classList.toggle("active", s.id === "view-" + v));
  render();
}

function render() {
  ({ home: renderHome, income: renderIncome, outgoings: renderOutgoings, debts: renderDebts, more: renderMore })[curView]();
}

/* ================= Home ================= */
function renderHome() {
  const inc = data.income[selMonth];
  const incTotal = inc ? (inc.seanT || 0) + (inc.martinaT || 0) : 0;
  const outTotal = outgoingsTotal();
  const leftover = incTotal - outTotal;
  const debt = totalDebt();

  // Upcoming payments in the next 7 days (only meaningful for the real current month)
  const today = new Date();
  const curKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0");
  let dueHtml = "";
  if (selMonth === curKey) {
    const day = today.getDate();
    const upcoming = data.outgoings
      .filter((o) => o.dueDay != null && o.amount > 0)
      .map((o) => {
        let diff = o.dueDay - day;
        if (diff < 0) diff += 31;   // rolls into next month
        return { ...o, diff };
      })
      .filter((o) => o.diff <= 7)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 5);
    dueHtml = upcoming.length
      ? upcoming.map((o) => `
        <div class="row" style="cursor:default">
          <div class="grow"><div class="name">${esc(o.name)}</div>
          <div class="meta">${ordinal(o.dueDay)}${o.account ? " · " + esc(o.account) : ""}</div></div>
          <span class="badge ${o.diff === 0 ? "today" : "due"}">${o.diff === 0 ? "today" : "in " + o.diff + "d"}</span>
          <div class="amt">${gbp(o.amount)}</div>
        </div>`).join("")
      : `<div class="empty">Nothing due in the next 7 days</div>`;
  } else {
    dueHtml = `<div class="empty">Viewing ${monthLabel(selMonth)} — go to the current month to see what's due soon</div>`;
  }

  $("#view-home").innerHTML = `
    <h1>Budget</h1>
    <div class="sub">Sean &amp; Martina's household budget</div>
    ${monthbarHtml()}
    <div class="cards">
      <div class="card"><div class="label">Income (transferred)</div><div class="value pos">${gbp(incTotal)}</div></div>
      <div class="card"><div class="label">Outgoings</div><div class="value">${gbp(outTotal)}</div></div>
      <div class="card"><div class="label">Leftover</div><div class="value ${leftover >= 0 ? "pos" : "neg"}">${gbp(leftover)}</div></div>
      <div class="card"><div class="label">Total debt</div><div class="value ${debt > 0 ? "neg" : "pos"}">${gbp(debt)}</div></div>
    </div>
    <div class="section">
      <div class="section-head"><h2>${monthLabel(selMonth)} income</h2><span class="total">${gbp(incTotal)}</span></div>
      <div class="rows">
        <button class="row" data-goto="income">
          <div class="grow"><div class="name">Sean → joint</div></div>
          <div class="amt ${inc && inc.seanT ? "" : "muted"}">${gbp(inc ? inc.seanT : null, true)}</div>
        </button>
        <button class="row" data-goto="income">
          <div class="grow"><div class="name">Martina → joint</div></div>
          <div class="amt ${inc && inc.martinaT ? "" : "muted"}">${gbp(inc ? inc.martinaT : null, true)}</div>
        </button>
      </div>
    </div>
    <div class="section">
      <div class="section-head"><h2>Outgoings by group</h2><span class="total">${gbp(outTotal)}</span></div>
      <div class="rows">${GROUPS.map((g) => `
        <button class="row" data-goto="outgoings">
          <div class="grow"><div class="name">${esc(g.name)}</div></div>
          <div class="amt">${gbp(groupTotal(g.id))}</div>
        </button>`).join("")}
      </div>
    </div>
    <div class="section">
      <div class="section-head"><h2>Debts</h2><span class="total">${gbp(debt)}</span></div>
      <div class="rows">${data.debts.length ? data.debts.map((d) => {
        const e = latestEntry(d);
        return `
        <button class="row" data-goto="debts">
          <div class="grow"><div class="name">${esc(d.name)}</div>
          <div class="meta">${e ? "as of " + monthLabel(e.month) : "no entries yet"}</div></div>
          <div class="amt">${e ? gbp(e.balance) : "—"}</div>
        </button>`;
      }).join("") : `<div class="empty">No debts — nice</div>`}
      </div>
    </div>
    <div class="section">
      <div class="section-head"><h2>Due soon</h2></div>
      <div class="rows">${dueHtml}</div>
    </div>`;

  bindMonthbar();
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.goto)));
}

function monthbarHtml() {
  return `
    <div class="monthbar">
      <button id="mPrev">‹</button>
      <span class="cur">${monthLabel(selMonth)}</span>
      <button id="mNext">›</button>
    </div>`;
}
function bindMonthbar() {
  $("#mPrev").addEventListener("click", () => { selMonth = shiftMonth(selMonth, -1); render(); });
  $("#mNext").addEventListener("click", () => { selMonth = shiftMonth(selMonth, 1); render(); });
}

/* ================= Income ================= */
function renderIncome() {
  let rows = "";
  for (let m = 1; m <= 12; m++) {
    const key = incomeYear + "-" + String(m).padStart(2, "0");
    const e = data.income[key] || {};
    const tot = (e.seanT || 0) + (e.martinaT || 0);
    rows += `
      <tr data-month="${key}">
        <td>${MONTH_NAMES[m - 1]}</td>
        <td class="${e.sean ? "" : "dim"}">${gbp(e.sean, true)}</td>
        <td class="${e.seanT ? "" : "dim"}">${gbp(e.seanT, true)}</td>
        <td class="${e.martina ? "" : "dim"}">${gbp(e.martina, true)}</td>
        <td class="${e.martinaT ? "" : "dim"}">${gbp(e.martinaT, true)}</td>
        <td class="${tot ? "tot" : "dim"}">${tot ? gbp(tot) : "—"}</td>
      </tr>`;
  }
  $("#view-income").innerHTML = `
    <h1>Income</h1>
    <div class="sub">Earned and transferred to joint, per month — tap a month to edit</div>
    <div class="monthbar">
      <button id="yPrev">‹</button>
      <span class="cur">${incomeYear}</span>
      <button id="yNext">›</button>
    </div>
    <div class="inc-wrap"><table class="inc-table">
      <thead><tr><th>Month</th><th>Sean</th><th>S → Joint</th><th>Martina</th><th>M → Joint</th><th>Joint total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;

  $("#yPrev").addEventListener("click", () => { incomeYear--; renderIncome(); });
  $("#yNext").addEventListener("click", () => { incomeYear++; renderIncome(); });
  document.querySelectorAll("[data-month]").forEach((tr) =>
    tr.addEventListener("click", () => editIncome(tr.dataset.month)));
}

function editIncome(key) {
  const e = data.income[key] || {};
  openModal(monthLabel(key) + " income", `
    <div class="field-row">
      <div class="field"><label>Sean earned</label><input id="f_sean" type="number" step="0.01" inputmode="decimal" value="${e.sean ?? ""}"></div>
      <div class="field"><label>Sean → joint</label><input id="f_seanT" type="number" step="0.01" inputmode="decimal" value="${e.seanT ?? ""}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Martina earned</label><input id="f_martina" type="number" step="0.01" inputmode="decimal" value="${e.martina ?? ""}"></div>
      <div class="field"><label>Martina → joint</label><input id="f_martinaT" type="number" step="0.01" inputmode="decimal" value="${e.martinaT ?? ""}"></div>
    </div>`,
    [
      { label: "Cancel", cls: "btn-ghost", fn: closeModal },
      { label: "Save", cls: "btn-primary", fn: () => {
        const num = (id) => { const v = parseFloat($(id).value); return isNaN(v) ? null : v; };
        const entry = { sean: num("#f_sean"), seanT: num("#f_seanT"), martina: num("#f_martina"), martinaT: num("#f_martinaT") };
        if (Object.values(entry).every((v) => v == null)) delete data.income[key];
        else data.income[key] = entry;
        persist(); closeModal(); render();
      }}
    ]);
}

/* ================= Outgoings ================= */
function renderOutgoings() {
  $("#view-outgoings").innerHTML = `
    <h1>Outgoings</h1>
    <div class="sub">Monthly total: <b>${gbp(outgoingsTotal())}</b> — tap an item to edit</div>
    ${GROUPS.map((g) => {
      const items = data.outgoings.filter((o) => o.group === g.id);
      return `
      <div class="section">
        <div class="section-head"><h2>${esc(g.name)}</h2><span class="total">${gbp(groupTotal(g.id))}</span></div>
        <div class="rows">${items.length ? items.map((o) => `
          <button class="row" data-edit-out="${o.id}">
            <div class="grow"><div class="name">${esc(o.name)}</div>
            <div class="meta">${[o.dueDay != null ? ordinal(o.dueDay) : "", o.account, o.notes].filter(Boolean).map(esc).join(" · ") || "&nbsp;"}</div></div>
            <div class="amt ${o.amount ? "" : "muted"}">${o.amount ? gbp(o.amount) : "—"}</div>
          </button>`).join("") : `<div class="empty">Nothing here yet</div>`}
        </div>
        <button class="addbtn" data-add-out="${g.id}">+ Add to ${esc(g.name)}</button>
      </div>`;
    }).join("")}`;

  document.querySelectorAll("[data-edit-out]").forEach((b) =>
    b.addEventListener("click", () => editOutgoing(b.dataset.editOut)));
  document.querySelectorAll("[data-add-out]").forEach((b) =>
    b.addEventListener("click", () => editOutgoing(null, b.dataset.addOut)));
}

function editOutgoing(id, group) {
  const o = id ? data.outgoings.find((x) => x.id === id) : { group, name: "", amount: "", dueDay: "", account: "", notes: "" };
  openModal(id ? "Edit outgoing" : "Add outgoing", `
    <div class="field"><label>Name</label><input id="f_name" value="${esc(o.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Amount (£/month)</label><input id="f_amount" type="number" step="0.01" inputmode="decimal" value="${o.amount ?? ""}"></div>
      <div class="field"><label>Due day (1–31)</label><input id="f_due" type="number" min="1" max="31" inputmode="numeric" value="${o.dueDay ?? ""}"></div>
    </div>
    <div class="field"><label>Group</label><select id="f_group">${GROUPS.map((g) =>
      `<option value="${g.id}" ${g.id === o.group ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select></div>
    <div class="field"><label>Account (optional)</label><input id="f_account" value="${esc(o.account)}"></div>
    <div class="field"><label>Notes (optional)</label><input id="f_notes" value="${esc(o.notes)}"></div>`,
    [
      ...(id ? [{ label: "Delete", cls: "btn-danger", fn: () => {
        if (!confirm("Delete " + o.name + "?")) return;
        data.outgoings = data.outgoings.filter((x) => x.id !== id);
        persist(); closeModal(); render();
      }}] : []),
      { label: "Cancel", cls: "btn-ghost", fn: closeModal },
      { label: "Save", cls: "btn-primary", fn: () => {
        const name = $("#f_name").value.trim();
        if (!name) { alert("Name is required"); return; }
        const amount = parseFloat($("#f_amount").value) || 0;
        const due = parseInt($("#f_due").value, 10);
        const item = {
          id: id || uid(), group: $("#f_group").value, name, amount,
          dueDay: isNaN(due) ? null : Math.min(31, Math.max(1, due)),
          account: $("#f_account").value.trim(), notes: $("#f_notes").value.trim()
        };
        if (id) data.outgoings = data.outgoings.map((x) => (x.id === id ? item : x));
        else data.outgoings.push(item);
        persist(); closeModal(); render();
      }}
    ]);
}

/* ================= Debts ================= */
function renderDebts() {
  const total = totalDebt();
  $("#view-debts").innerHTML = `
    <h1>Debts</h1>
    <div class="sub">Total outstanding: <b class="${total > 0 ? "" : "paidoff"}">${gbp(total)}</b></div>
    ${data.debts.map((d) => {
      const e = latestEntry(d);
      const hist = [...d.history].sort((a, b) => b.month.localeCompare(a.month));
      return `
      <div class="debt-card">
        <div class="debt-top">
          <div><div class="debt-name">${esc(d.name)}</div><div class="debt-owner">${esc(d.owner)}</div></div>
          <div>
            <div class="debt-bal ${e && e.balance === 0 ? "paidoff" : ""}">${e ? gbp(e.balance) : "—"}</div>
            <div class="debt-meta">${e ? "as of " + monthLabel(e.month) + (e.payment ? " · paying " + gbp(e.payment) + "/mo" : "") : "no entries yet"}</div>
          </div>
        </div>
        <div class="debt-actions">
          <button data-debt-update="${d.id}">Update balance</button>
          <button data-debt-history="${d.id}">${openHistory[d.id] ? "Hide" : "History"} (${d.history.length})</button>
          <button data-debt-edit="${d.id}">Edit</button>
        </div>
        ${openHistory[d.id] ? `<div class="debt-history">${hist.map((h) => `
          <div class="hrow"><span>${monthLabel(h.month)}</span>
          <span>${h.payment ? gbp(h.payment) + "/mo · " : ""}<span class="hbal">${gbp(h.balance)}</span></span></div>`).join("")}
        </div>` : ""}
      </div>`;
    }).join("")}
    <button class="addbtn" id="addDebt">+ Add a debt</button>`;

  document.querySelectorAll("[data-debt-update]").forEach((b) =>
    b.addEventListener("click", () => updateDebt(b.dataset.debtUpdate)));
  document.querySelectorAll("[data-debt-history]").forEach((b) =>
    b.addEventListener("click", () => { openHistory[b.dataset.debtHistory] = !openHistory[b.dataset.debtHistory]; render(); }));
  document.querySelectorAll("[data-debt-edit]").forEach((b) =>
    b.addEventListener("click", () => editDebt(b.dataset.debtEdit)));
  $("#addDebt").addEventListener("click", () => editDebt(null));
}

function updateDebt(id) {
  const d = data.debts.find((x) => x.id === id);
  const e = latestEntry(d);
  const today = new Date();
  const curKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0");
  openModal("Update " + d.name, `
    <div class="field"><label>Month</label><input id="f_month" type="month" value="${curKey}"></div>
    <div class="field-row">
      <div class="field"><label>Balance (£)</label><input id="f_bal" type="number" step="0.01" inputmode="decimal" value="${e ? e.balance : ""}"></div>
      <div class="field"><label>Monthly payment (£)</label><input id="f_pay" type="number" step="0.01" inputmode="decimal" value="${e && e.payment != null ? e.payment : ""}"></div>
    </div>`,
    [
      { label: "Cancel", cls: "btn-ghost", fn: closeModal },
      { label: "Save", cls: "btn-primary", fn: () => {
        const month = $("#f_month").value;
        const bal = parseFloat($("#f_bal").value);
        if (!month || isNaN(bal)) { alert("Month and balance are required"); return; }
        const pay = parseFloat($("#f_pay").value);
        d.history = d.history.filter((h) => h.month !== month);
        d.history.push({ month, balance: bal, payment: isNaN(pay) ? null : pay });
        persist(); closeModal(); render();
      }}
    ]);
}

function editDebt(id) {
  const d = id ? data.debts.find((x) => x.id === id) : { name: "", owner: "" };
  openModal(id ? "Edit debt" : "Add a debt", `
    <div class="field"><label>Name (e.g. "Sean Barclaycard")</label><input id="f_name" value="${esc(d.name)}"></div>
    <div class="field"><label>Whose is it?</label><select id="f_owner">
      ${["Sean", "Martina", "Joint"].map((o) => `<option ${o === d.owner ? "selected" : ""}>${o}</option>`).join("")}
    </select></div>`,
    [
      ...(id ? [{ label: "Delete", cls: "btn-danger", fn: () => {
        if (!confirm("Delete " + d.name + " and all its history?")) return;
        data.debts = data.debts.filter((x) => x.id !== id);
        persist(); closeModal(); render();
      }}] : []),
      { label: "Cancel", cls: "btn-ghost", fn: closeModal },
      { label: "Save", cls: "btn-primary", fn: () => {
        const name = $("#f_name").value.trim();
        if (!name) { alert("Name is required"); return; }
        if (id) { d.name = name; d.owner = $("#f_owner").value; }
        else data.debts.push({ id: uid(), name, owner: $("#f_owner").value, history: [] });
        persist(); closeModal(); render();
      }}
    ]);
}

/* ================= More (log + sync) ================= */
function renderMore() {
  const logSorted = [...data.log].sort((a, b) => b.date.localeCompare(a.date));
  const logTotal = data.log.reduce((s, l) => s + (l.amount || 0), 0);
  $("#view-more").innerHTML = `
    <h1>More</h1>
    <div class="sub">One-off spending log, backup and settings</div>

    <div class="section">
      <div class="section-head"><h2>Spending log</h2><span class="total">${gbp(logTotal)}</span></div>
      <div class="rows">${logSorted.length ? logSorted.map((l) => `
        <button class="row" data-edit-log="${l.id}">
          <div class="grow"><div class="name">${esc(l.name)}</div>
          <div class="meta">${l.date}</div></div>
          <div class="amt">${gbp(l.amount)}</div>
        </button>`).join("") : `<div class="empty">No one-off expenses logged</div>`}
      </div>
      <button class="addbtn" id="addLog">+ Log an expense</button>
    </div>

    <div class="section">
      <div class="section-head"><h2>Account</h2></div>
      <div class="sync-status">${userId
        ? "Signed in as <b>" + esc(userEmail) + "</b> — changes sync live between devices"
        : "Not signed in — data only lives on this device"}</div>
      ${userId ? `<div class="more-list"><button class="morebtn" id="signOutBtn"><span class="ico">🚪</span>
        <div>Sign out<div class="desc">Stop syncing on this device</div></div></button></div>` : ""}
    </div>

    <div class="section">
      <div class="section-head"><h2>Backup</h2></div>
      <div class="sync-status">${data.savedAt ? "Last change: " + new Date(data.savedAt).toLocaleString("en-GB") : "No changes yet"}</div>
      <div class="more-list">
        <button class="morebtn" id="exportBtn"><span class="ico">⬇️</span>
          <div>Export data<div class="desc">Save ${DATA_FILENAME} — put it in OneDrive to share</div></div></button>
        <button class="morebtn" id="importBtn"><span class="ico">⬆️</span>
          <div>Import data<div class="desc">Load a ${DATA_FILENAME} file (replaces what's on this device)</div></div></button>
        <button class="morebtn" id="resetBtn"><span class="ico">🗑️</span>
          <div>Reset to spreadsheet data<div class="desc">Wipe this device's data back to the original Budget 2025 numbers</div></div></button>
      </div>
    </div>`;

  const so = $("#signOutBtn");
  if (so) so.addEventListener("click", async () => {
    if (confirm("Sign out of the budget on this device?")) await supa.auth.signOut();
  });
  $("#addLog").addEventListener("click", () => editLog(null));
  document.querySelectorAll("[data-edit-log]").forEach((b) =>
    b.addEventListener("click", () => editLog(b.dataset.editLog)));
  $("#exportBtn").addEventListener("click", exportData);
  $("#importBtn").addEventListener("click", importData);
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset ALL data on this device back to the original spreadsheet numbers?")) return;
    data = defaultData(); persist(); render();
  });
}

function editLog(id) {
  const l = id ? data.log.find((x) => x.id === id) : { date: new Date().toISOString().slice(0, 10), name: "", amount: "" };
  openModal(id ? "Edit expense" : "Log an expense", `
    <div class="field"><label>What was it?</label><input id="f_name" value="${esc(l.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Amount (£)</label><input id="f_amount" type="number" step="0.01" inputmode="decimal" value="${l.amount ?? ""}"></div>
      <div class="field"><label>Date</label><input id="f_date" type="date" value="${l.date}"></div>
    </div>`,
    [
      ...(id ? [{ label: "Delete", cls: "btn-danger", fn: () => {
        data.log = data.log.filter((x) => x.id !== id);
        persist(); closeModal(); render();
      }}] : []),
      { label: "Cancel", cls: "btn-ghost", fn: closeModal },
      { label: "Save", cls: "btn-primary", fn: () => {
        const name = $("#f_name").value.trim();
        const amount = parseFloat($("#f_amount").value);
        const date = $("#f_date").value;
        if (!name || isNaN(amount) || !date) { alert("All fields are required"); return; }
        if (id) { l.name = name; l.amount = amount; l.date = date; }
        else data.log.push({ id: uid(), name, amount, date });
        persist(); closeModal(); render();
      }}
    ]);
}

/* ================= Export / import ================= */
async function exportData() {
  const json = JSON.stringify(data, null, 2);
  if (window.showSaveFilePicker) {
    try {
      if (!fileHandle) {
        fileHandle = await showSaveFilePicker({
          suggestedName: DATA_FILENAME,
          types: [{ description: "JSON", accept: { "application/json": [".json"] } }]
        });
      }
      const w = await fileHandle.createWritable();
      await w.write(json); await w.close();
      alert("Saved to " + fileHandle.name);
      return;
    } catch (e) { if (e.name === "AbortError") return; fileHandle = null; }
  }
  // Fallback (phones): download, then move it into OneDrive
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = DATA_FILENAME;
  a.click(); URL.revokeObjectURL(a.href);
}

function importData() {
  const input = document.createElement("input");
  input.type = "file"; input.accept = ".json,application/json";
  input.onchange = () => {
    const f = input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !d.outgoings || !d.debts) throw new Error("bad shape");
        if (!confirm("Replace this device's data with " + f.name + "?")) return;
        data = d; persist(); render();
      } catch (e) { alert("That doesn't look like a valid budget data file."); }
    };
    r.readAsText(f);
  };
  input.click();
}

/* ================= Modal ================= */
function openModal(title, bodyHtml, actions) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHtml;
  const box = $("#modalActions");
  box.innerHTML = "";
  actions.forEach((a) => {
    const b = document.createElement("button");
    b.textContent = a.label; b.className = a.cls;
    b.addEventListener("click", a.fn);
    box.appendChild(b);
  });
  $("#modalBackdrop").hidden = false;
  const first = $("#modalBody input");
  if (first) first.focus();
}
function closeModal() { $("#modalBackdrop").hidden = true; }
$("#modalBackdrop").addEventListener("click", (e) => { if (e.target.id === "modalBackdrop") closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ================= Cloud sync ================= */
let pushTimer = null;
function updateCloudDot() {
  const dot = $("#cloudDot");
  dot.hidden = !userId;
  dot.className = "clouddot" + (cloudState === "ok" ? " ok" : cloudState === "offline" ? " offline" : "");
  dot.title = cloudState === "ok" ? "Synced" : cloudState === "offline" ? "Offline — will sync when back online" : "Syncing…";
}
function schedulePush() {
  if (!userId || !supa) return;
  clearTimeout(pushTimer);
  cloudState = "sync"; updateCloudDot();
  pushTimer = setTimeout(pushCloud, 800);
}
async function pushCloud() {
  if (!userId || !supa) return;
  pushTimer = null;
  try {
    const { error } = await supa.from("budget").upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
    if (error) throw error;
    dirty = false; cloudState = "ok";
  } catch (e) { cloudState = "offline"; }
  updateCloudDot();
}
async function initialCloudSync() {
  cloudState = "sync"; updateCloudDot();
  try {
    const { data: row, error } = await supa.from("budget").select("data").maybeSingle();
    if (error) throw error;
    if (row && row.data) {
      const remote = migrate(typeof row.data === "string" ? JSON.parse(row.data) : row.data);
      if (!data.savedAt || (remote.savedAt && remote.savedAt > data.savedAt)) {
        data = remote;
        localStorage.setItem(lsKey(), JSON.stringify(data));
        render();
      } else if (remote.savedAt !== data.savedAt) {
        schedulePush();
      }
    } else {
      // First sign-in for this account: adopt any pre-account data on this device
      try {
        const legacy = localStorage.getItem(LS_KEY);
        if (legacy) {
          const d = JSON.parse(legacy);
          if (d && d.outgoings && d.debts) {
            data = migrate(d);
            localStorage.setItem(lsKey(), JSON.stringify(data));
            render();
          }
        }
      } catch (e) {}
      schedulePush();
    }
    cloudState = "ok";
    if (!pushTimer) dirty = false;
  } catch (e) { cloudState = "offline"; }
  updateCloudDot();
}
function subscribeRealtime() {
  supa.channel("budget-sync")
    .on("postgres_changes",
        { event: "*", schema: "public", table: "budget", filter: "user_id=eq." + userId },
        (payload) => {
          const row = payload.new;
          if (!row || !row.data) return;
          const remote = migrate(typeof row.data === "string" ? JSON.parse(row.data) : row.data);
          if (remote.savedAt && (!data.savedAt || remote.savedAt > data.savedAt)) {
            data = remote;
            localStorage.setItem(lsKey(), JSON.stringify(data));
            dirty = false; cloudState = "ok";
            render(); updateCloudDot();
          }
        })
    .subscribe();
}
window.addEventListener("online", () => { if (userId && dirty) pushCloud(); });

/* ================= Auth + boot ================= */
const authScreen = $("#authScreen");
let authMode = "signin";
$("#aToggle").addEventListener("click", () => {
  authMode = authMode === "signin" ? "signup" : "signin";
  $("#aGo").textContent = authMode === "signin" ? "Sign in" : "Create account";
  $("#aToggle").textContent = authMode === "signin"
    ? "New here? Create the account" : "Already have the account? Sign in";
  $("#authSub").textContent = authMode === "signin"
    ? "Sign in — use the same account on both phones so you share one budget"
    : "Create ONE account and both sign in with it — you share a single budget";
  $("#authErr").textContent = "";
});
$("#aGo").addEventListener("click", async () => {
  const email = $("#aEmail").value.trim();
  const pass = $("#aPass").value;
  const err = $("#authErr");
  if (!email || pass.length < 6) { err.textContent = "Enter your email and a password of 6+ characters."; return; }
  err.textContent = "";
  const btn = $("#aGo");
  btn.disabled = true;
  const { error } = authMode === "signup"
    ? await supa.auth.signUp({ email, password: pass })
    : await supa.auth.signInWithPassword({ email, password: pass });
  btn.disabled = false;
  if (error) err.textContent = error.message;
});
$("#aPass").addEventListener("keydown", (ev) => { if (ev.key === "Enter") $("#aGo").click(); });

function startApp(session) {
  userId = session.user.id;
  userEmail = session.user.email || "";
  authScreen.classList.remove("open");
  data = load();
  render();
  updateCloudDot();
  initialCloudSync();
  subscribeRealtime();
}
async function boot() {
  if (!supa) {   // supabase library unreachable (first load offline) — run on this device only
    render();
    return;
  }
  const { data: { session } } = await supa.auth.getSession();
  if (session) startApp(session);
  else { render(); authScreen.classList.add("open"); }
  supa.auth.onAuthStateChange((ev, sess) => {
    if (sess && !userId) startApp(sess);
    if (ev === "SIGNED_OUT") { userId = null; location.reload(); }
  });
}
boot();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
