"use strict";
/* ================= Data ================= */
const LS_KEY = "budgetData";
const DATA_FILENAME = "budget-data.json";
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GROUPS = [
  { id: "dd",      name: "Direct Debits", color: "#2f6fed" },
  { id: "subs",    name: "Subscriptions", color: "#7a6ff0" },
  { id: "exp",     name: "Expenses",      color: "#c9962a" },
  { id: "martina", name: "Martina's",     color: "#d4589c" },
  { id: "sean",    name: "Sean's",        color: "#2a9d9f" }
];
const groupColor = (gid) => (GROUPS.find((g) => g.id === gid) || {}).color || "#5a6b7b";

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
  ],
  paid: {},       // { "YYYY-MM": [outgoingId, ...] } — bills ticked off as paid
  pots: [         // savings pots from the Salary Sorting sheet
    { id: uid(), name: "Emergency Fund", target: null, balance: 0 },
    { id: uid(), name: "Savings", target: null, balance: 0 },
    { id: uid(), name: "Holiday Pot", target: null, balance: 0 }
  ],
  activity: [],   // [{ts, device, text}] newest first, capped
  settings: { payday: null }
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
  d.paid = d.paid || {};
  if (!d.pots) d.pots = [   // seed the pots from the Salary Sorting sheet once
    { id: uid(), name: "Emergency Fund", target: null, balance: 0 },
    { id: uid(), name: "Savings", target: null, balance: 0 },
    { id: uid(), name: "Holiday Pot", target: null, balance: 0 }
  ];
  d.activity = d.activity || [];
  d.settings = d.settings || { payday: null };
  return d;
}

/* Activity feed — device name lives on each device, not in synced data */
function deviceName() { return localStorage.getItem("budgetDeviceName") || ""; }
function act(text) {
  data.activity.unshift({ ts: new Date().toISOString(), device: deviceName() || "Someone", text });
  data.activity = data.activity.slice(0, 50);
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
function gbpHero(n) {
  // big pounds, de-emphasised pence: £1,200<span class=pence>.40</span>
  if (n == null || isNaN(n)) n = 0;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const pounds = Math.floor(abs);
  const pence = Math.round((abs - pounds) * 100);
  return sign + "£" + pounds.toLocaleString("en-GB") +
    (pence ? `<span class="pence">.${String(pence).padStart(2, "0")}</span>` : "");
}
const ICONS = {
  download: '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M4 3h16"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 14h10l1-14"/></svg>',
  signout: '<svg viewBox="0 0 24 24"><path d="M9 21H4V3h5"/><path d="M15 17l5-5-5-5"/><path d="M20 12H9"/></svg>'
};
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
function curMonthKey() {
  const t = new Date();
  return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0");
}
function isPaid(oid, monthKey) {
  return (data.paid[monthKey || curMonthKey()] || []).includes(oid);
}
function togglePaid(oid) {
  const key = curMonthKey();
  const list = data.paid[key] || (data.paid[key] = []);
  const i = list.indexOf(oid);
  const o = data.outgoings.find((x) => x.id === oid);
  if (i >= 0) { list.splice(i, 1); act("Unticked " + (o ? o.name : "a bill")); }
  else { list.push(oid); act("Ticked " + (o ? o.name : "a bill") + " as paid"); }
  persist();
}
function paidTotals() {
  const key = curMonthKey();
  const billable = data.outgoings.filter((o) => o.amount > 0);
  const due = billable.reduce((s, o) => s + o.amount, 0);
  const paid = billable.filter((o) => isPaid(o.id, key)).reduce((s, o) => s + o.amount, 0);
  return { due, paid };
}
function incTotalFor(key) {
  const e = data.income[key];
  return e ? (e.seanT || 0) + (e.martinaT || 0) : 0;
}
function totalDebtAsOf(key) {
  // sum of each debt's latest entry up to and including the given month; null if no debt has data yet
  let any = false;
  const sum = data.debts.reduce((s, d) => {
    const entries = d.history.filter((h) => h.month <= key).sort((a, b) => a.month.localeCompare(b.month));
    if (!entries.length) return s;
    any = true;
    return s + (entries.at(-1).balance || 0);
  }, 0);
  return any ? sum : null;
}
function latestPayment(d) {
  const withPay = d.history.filter((h) => h.payment != null && h.payment > 0).sort((a, b) => a.month.localeCompare(b.month));
  return withPay.length ? withPay.at(-1).payment : null;
}
function payoffLabel(d) {
  const e = latestEntry(d);
  const pay = latestPayment(d);
  if (!e || !e.balance || !pay) return "";
  const months = Math.ceil(e.balance / pay);
  if (months > 240) return "";
  let [y, m] = e.month.split("-").map(Number);
  m += months;
  while (m > 12) { m -= 12; y++; }
  return "~cleared " + MONTH_NAMES[m - 1].slice(0, 3) + " " + y + " at " + gbp(pay) + "/mo";
}
function sparkline(hist) {
  if (hist.length < 2) return "";
  const pts = [...hist].sort((a, b) => a.month.localeCompare(b.month)).map((h) => h.balance || 0);
  const max = Math.max(...pts), min = Math.min(...pts);
  const range = max - min || 1;
  const coords = pts.map((v, i) =>
    ((i / (pts.length - 1)) * 100).toFixed(1) + "," + (4 + 20 * (1 - (v - min) / range)).toFixed(1)
  );
  const line = coords.join(" ");
  const fill = "0,28 " + line + " 100,28";
  return `<svg class="spark" viewBox="0 0 100 28" preserveAspectRatio="none">
    <polygon class="spark-fill" points="${fill}"/>
    <polyline class="spark-line" points="${line}"/>
  </svg>`;
}
function delta(cur, prev, invert) {
  // invert=true → a fall is good (debt); returns a wee arrow chip or ""
  if (cur == null || prev == null || cur === prev) return "";
  const up = cur > prev;
  const good = invert ? !up : up;
  return `<span class="delta ${good ? "good" : "bad"}">${up ? "↑" : "↓"} ${gbp(Math.abs(cur - prev))}</span>`;
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
function miniCalendarHtml() {
  const [y, m] = selMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysIn = new Date(y, m, 0).getDate();
  const startIdx = (first.getDay() + 6) % 7;   // Monday = 0
  const dueDays = new Set(data.outgoings.filter((o) => o.amount > 0 && o.dueDay).map((o) => Math.min(o.dueDay, daysIn)));
  const today = new Date();
  const isCur = selMonth === curMonthKey();
  let cells = ["M", "T", "W", "T", "F", "S", "S"].map((d) => `<div class="cal-h">${d}</div>`).join("");
  for (let i = 0; i < startIdx; i++) cells += `<div></div>`;
  for (let d = 1; d <= daysIn; d++) {
    const classes = ["cal-d"];
    if (isCur && d === today.getDate()) classes.push("today");
    if (data.settings.payday && d === data.settings.payday) classes.push("payday");
    cells += `<div class="${classes.join(" ")}">${d}${dueDays.has(d) ? '<span class="cal-dot"></span>' : ""}</div>`;
  }
  return `<div class="cal">${cells}</div>
    <div class="cal-legend"><span><span class="cal-dot" style="position:static;display:inline-block"></span> bill due</span>${data.settings.payday ? '<span><span class="cal-pay"></span> payday</span>' : ""}</div>`;
}

function renderHome() {
  const inc = data.income[selMonth];
  const incTotal = incTotalFor(selMonth);
  const outTotal = outgoingsTotal();
  const leftover = incTotal - outTotal;
  const debt = totalDebt();
  const prevKey = shiftMonth(selMonth, -1);
  const incDelta = delta(incTotal || null, incTotalFor(prevKey) || null, false);
  const debtDelta = delta(totalDebtAsOf(selMonth), totalDebtAsOf(prevKey), true);
  const isCurMonth = selMonth === curMonthKey();

  // Paid-so-far progress (only for the real current month)
  let paidHtml = "";
  if (isCurMonth) {
    const { due, paid } = paidTotals();
    const pct = due ? Math.round((paid / due) * 100) : 0;
    paidHtml = `
    <div class="section">
      <div class="section-head"><h2>Paid this month</h2><span class="total">${gbp(paid)} of ${gbp(due)}</span></div>
      <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-sub">${pct}% — tick bills off on the Outgoings tab as they come out</div>
    </div>`;
  }

  // Payday countdown
  let paydayChip = "";
  if (data.settings.payday && isCurMonth) {
    const today = new Date().getDate();
    let diff = data.settings.payday - today;
    if (diff < 0) diff += new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    paydayChip = `<div class="payday-chip">💰 Payday ${diff === 0 ? "today!" : "in " + diff + " day" + (diff === 1 ? "" : "s")}</div>`;
  }

  // Upcoming payments in the next 7 days (only meaningful for the real current month)
  const today = new Date();
  let dueHtml = "";
  if (isCurMonth) {
    const day = today.getDate();
    const upcoming = data.outgoings
      .filter((o) => o.dueDay != null && o.amount > 0 && !isPaid(o.id))
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
      : `<div class="empty"><b>All caught up</b>Nothing left to pay in the next 7 days</div>`;
  } else {
    dueHtml = `<div class="empty"><b>Viewing ${monthLabel(selMonth)}</b>Head back to the current month to see what's due soon</div>`;
  }

  $("#view-home").innerHTML = `
    <h1>Budget</h1>
    <div class="sub">Sean &amp; Martina's household budget</div>
    ${monthbarHtml()}
    ${paydayChip}
    <div class="hero">
      <div class="hero-label">Disposable income · ${monthLabel(selMonth)}</div>
      <div class="hero-value ${leftover < 0 ? "neg" : ""}">${gbpHero(leftover)}</div>
      <div class="hero-stats">
        <div class="hstat"><div class="hs-label">Income in</div><div class="hs-value">${gbp(incTotal)} ${incDelta}</div></div>
        <div class="hstat"><div class="hs-label">Outgoings</div><div class="hs-value">${gbp(outTotal)}</div></div>
        <div class="hstat"><div class="hs-label">Total debt</div><div class="hs-value">${gbp(debt)} ${debtDelta}</div></div>
      </div>
    </div>
    ${paidHtml}
    <div class="section">
      <div class="section-head"><h2>${monthLabel(selMonth)} income</h2><span class="total">${gbp(incTotal)}</span></div>
      <div class="rows">
        <button class="row" id="editIncomeHome">
          <div class="grow"><div class="name">Sean</div>
          <div class="meta">earned ${gbp(inc ? inc.sean : null, true)}</div></div>
          <div class="amt ${inc && inc.seanT ? "" : "muted"}">${gbp(inc ? inc.seanT : null, true)} → joint</div>
        </button>
        <button class="row" id="editIncomeHome2">
          <div class="grow"><div class="name">Martina</div>
          <div class="meta">earned ${gbp(inc ? inc.martina : null, true)}</div></div>
          <div class="amt ${inc && inc.martinaT ? "" : "muted"}">${gbp(inc ? inc.martinaT : null, true)} → joint</div>
        </button>
      </div>
      <button class="addbtn" id="enterSalary">${inc ? "✏️ Edit" : "+ Enter"} ${monthLabel(selMonth)} salaries</button>
    </div>
    <div class="section">
      <div class="section-head"><h2>Outgoings by group</h2><span class="total">${gbp(outTotal)}</span></div>
      <div class="rows">${GROUPS.map((g) => `
        <button class="row acc" style="--acc:${g.color}" data-goto="outgoings">
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
      }).join("") : `<div class="empty"><b>Debt free</b>Nothing owed — long may it last</div>`}
      </div>
    </div>
    <div class="section">
      <div class="section-head"><h2>Savings pots</h2><span class="total">${gbp(data.pots.reduce((s, p) => s + (p.balance || 0), 0))}</span></div>
      <div class="rows">${data.pots.length ? data.pots.map((p) => {
        const pct = p.target ? Math.min(100, Math.round((p.balance / p.target) * 100)) : null;
        return `
        <button class="row" data-edit-pot="${p.id}">
          <div class="grow"><div class="name">${esc(p.name)}</div>
          ${pct != null ? `<div class="progress sm"><div class="progress-bar" style="width:${pct}%"></div></div>` : ""}
          <div class="meta">${p.target ? gbp(p.balance) + " of " + gbp(p.target) + " · " + pct + "%" : "no target set"}</div></div>
          <div class="amt">${gbp(p.balance)}</div>
        </button>`;
      }).join("") : `<div class="empty"><b>No pots yet</b>Add one below to start putting money aside</div>`}
      </div>
      <button class="addbtn" id="addPot">+ Add a pot</button>
    </div>
    <div class="section">
      <div class="section-head"><h2>Due soon</h2></div>
      <div class="rows">${dueHtml}</div>
    </div>
    <div class="section">
      <div class="section-head"><h2>${monthLabel(selMonth)} calendar</h2></div>
      ${miniCalendarHtml()}
    </div>`;

  bindMonthbar();
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.goto)));
  ["#editIncomeHome", "#editIncomeHome2", "#enterSalary"].forEach((sel) =>
    $(sel).addEventListener("click", () => editIncome(selMonth)));
  document.querySelectorAll("[data-edit-pot]").forEach((b) =>
    b.addEventListener("click", () => editPot(b.dataset.editPot)));
  $("#addPot").addEventListener("click", () => editPot(null));
}

/* ================= Pots ================= */
function editPot(id) {
  const p = id ? data.pots.find((x) => x.id === id) : { name: "", target: "", balance: "" };
  openModal(id ? "Update " + p.name : "Add a pot", `
    <div class="field"><label>Name</label><input id="f_name" value="${esc(p.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Current amount (£)</label><input id="f_bal" type="number" step="0.01" inputmode="decimal" value="${p.balance ?? ""}"></div>
      <div class="field"><label>Target (£, optional)</label><input id="f_target" type="number" step="0.01" inputmode="decimal" value="${p.target ?? ""}"></div>
    </div>`,
    [
      ...(id ? [{ label: "Delete", cls: "btn-danger", fn: () => {
        if (!confirm("Delete the " + p.name + " pot?")) return;
        data.pots = data.pots.filter((x) => x.id !== id);
        act("Deleted pot " + p.name);
        persist(); closeModal(); render();
      }}] : []),
      { label: "Cancel", cls: "btn-ghost", fn: closeModal },
      { label: "Save", cls: "btn-primary", fn: () => {
        const name = $("#f_name").value.trim();
        if (!name) { alert("Name is required"); return; }
        const bal = parseFloat($("#f_bal").value) || 0;
        const target = parseFloat($("#f_target").value);
        if (id) { p.name = name; p.balance = bal; p.target = isNaN(target) ? null : target; }
        else data.pots.push({ id: uid(), name, balance: bal, target: isNaN(target) ? null : target });
        act((id ? "Updated" : "Added") + " pot " + name + " — " + gbp(bal));
        persist(); closeModal(); render();
      }}
    ]);
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
  // Year in bars: joint income vs outgoings per month, plus a year-total strip
  const outTotal = outgoingsTotal();
  let maxVal = outTotal;
  const monthTotals = [];
  for (let m = 1; m <= 12; m++) {
    const t = incTotalFor(incomeYear + "-" + String(m).padStart(2, "0"));
    monthTotals.push(t);
    if (t > maxVal) maxVal = t;
  }
  maxVal = maxVal || 1;
  const yearIn = monthTotals.reduce((s, t) => s + t, 0);
  const monthsWithIncome = monthTotals.filter((t) => t > 0).length;
  const chart = `
    <div class="chart">
      ${monthTotals.map((t, i) => `
        <div class="chart-col" title="${MONTH_NAMES[i]}: in ${gbp(t)}, out ${gbp(outTotal)}">
          <div class="chart-bars">
            <div class="chart-bar in" style="height:${Math.round((t / maxVal) * 100)}%"></div>
            <div class="chart-bar out" style="height:${Math.round((outTotal / maxVal) * 100)}%"></div>
          </div>
          <div class="chart-lbl">${MONTH_NAMES[i][0]}</div>
        </div>`).join("")}
    </div>
    <div class="chart-legend"><span><i class="in"></i> joint income</span><span><i class="out"></i> outgoings (${gbp(outTotal)}/mo)</span></div>`;

  $("#view-income").innerHTML = `
    <h1>Income</h1>
    <div class="sub">Earned and transferred to joint, per month — tap a month to edit</div>
    <div class="monthbar">
      <button id="yPrev">‹</button>
      <span class="cur">${incomeYear}</span>
      <button id="yNext">›</button>
    </div>
    <div class="section">
      <div class="section-head"><h2>${incomeYear} at a glance</h2></div>
      ${chart}
      <div class="cards" style="margin-top:10px">
        <div class="card"><div class="label">Joint income (${incomeYear})</div><div class="value pos">${gbp(yearIn)}</div></div>
        <div class="card"><div class="label">Disposable (${monthsWithIncome} month${monthsWithIncome === 1 ? "" : "s"})</div>
          <div class="value ${yearIn - outTotal * monthsWithIncome >= 0 ? "pos" : "neg"}">${gbp(yearIn - outTotal * monthsWithIncome)}</div></div>
      </div>
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
        act("Updated " + monthLabel(key) + " income");
        persist(); closeModal(); render();
      }}
    ]);
}

/* ================= Outgoings ================= */
function renderOutgoings() {
  const { due, paid } = paidTotals();
  const pct = due ? Math.round((paid / due) * 100) : 0;
  $("#view-outgoings").innerHTML = `
    <h1>Outgoings</h1>
    <div class="sub">Monthly total: <b>${gbp(outgoingsTotal())}</b> — tap to edit, tick when paid this month</div>
    <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
    <div class="progress-sub">${gbp(paid)} of ${gbp(due)} paid in ${monthLabel(curMonthKey())}</div>
    ${GROUPS.map((g) => {
      const items = data.outgoings.filter((o) => o.group === g.id);
      return `
      <div class="section">
        <div class="section-head"><h2>${esc(g.name)}</h2><span class="total">${gbp(groupTotal(g.id))}</span></div>
        <div class="rows">${items.length ? items.map((o) => {
          const paidNow = isPaid(o.id);
          return `
          <div class="row acc ${paidNow ? "isPaid" : ""}" style="--acc:${g.color}">
            ${o.amount > 0 ? `<input type="checkbox" class="paidbox" data-paid="${o.id}" ${paidNow ? "checked" : ""} aria-label="Paid this month">` : `<span class="paidbox-spacer"></span>`}
            <button class="rowbtn grow" data-edit-out="${o.id}">
              <div class="name">${esc(o.name)}</div>
              <div class="meta">${[o.dueDay != null ? ordinal(o.dueDay) : "", o.account, o.notes].filter(Boolean).map(esc).join(" · ") || "&nbsp;"}</div>
            </button>
            <div class="amt ${o.amount ? "" : "muted"}">${o.amount ? gbp(o.amount) : "—"}</div>
          </div>`;
        }).join("") : `<div class="empty">Nothing here yet</div>`}
        </div>
        <button class="addbtn" data-add-out="${g.id}">+ Add to ${esc(g.name)}</button>
      </div>`;
    }).join("")}`;

  document.querySelectorAll("[data-edit-out]").forEach((b) =>
    b.addEventListener("click", () => editOutgoing(b.dataset.editOut)));
  document.querySelectorAll("[data-add-out]").forEach((b) =>
    b.addEventListener("click", () => editOutgoing(null, b.dataset.addOut)));
  document.querySelectorAll("[data-paid]").forEach((cb) =>
    cb.addEventListener("change", () => { togglePaid(cb.dataset.paid); render(); }));
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
        act("Deleted outgoing " + o.name);
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
        act((id ? "Edited" : "Added") + " outgoing " + name + " — " + gbp(amount));
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
      const prev = hist.length > 1 ? hist[1] : null;
      const peak = d.history.length ? Math.max(...d.history.map((h) => h.balance || 0)) : 0;
      const pct = e && peak ? Math.round(((peak - e.balance) / peak) * 100) : 0;
      const payoff = payoffLabel(d);
      return `
      <div class="debt-card">
        <div class="debt-top">
          <div><div class="debt-name">${esc(d.name)}</div><div class="debt-owner">${esc(d.owner)}</div></div>
          <div>
            <div class="debt-bal ${e && e.balance === 0 ? "paidoff" : ""}">${e ? gbp(e.balance) : "—"}</div>
            <div class="debt-meta">${e ? "as of " + monthLabel(e.month) : "no entries yet"} ${prev && e ? delta(e.balance, prev.balance, true) : ""}</div>
          </div>
        </div>
        ${e && peak > 0 ? `
        <div class="progress sm debtbar"><div class="progress-bar" style="width:${pct}%"></div></div>
        <div class="progress-sub">${pct}% down from its worst (${gbp(peak)})${payoff ? " · " + payoff : ""}</div>` : ""}
        ${sparkline(d.history)}
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
        act("Updated " + d.name + " — " + gbp(bal) + " (" + monthLabel(month) + ")");
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
        act("Deleted debt " + d.name);
        persist(); closeModal(); render();
      }}] : []),
      { label: "Cancel", cls: "btn-ghost", fn: closeModal },
      { label: "Save", cls: "btn-primary", fn: () => {
        const name = $("#f_name").value.trim();
        if (!name) { alert("Name is required"); return; }
        if (id) { d.name = name; d.owner = $("#f_owner").value; }
        else data.debts.push({ id: uid(), name, owner: $("#f_owner").value, history: [] });
        act((id ? "Edited" : "Added") + " debt " + name);
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
        </button>`).join("") : `<div class="empty"><b>Nothing logged yet</b>Use the green + button to log a one-off spend</div>`}
      </div>
      <button class="addbtn" id="addLog">+ Log an expense</button>
    </div>

    <div class="section">
      <div class="section-head"><h2>Recent changes</h2></div>
      <div class="rows">${data.activity.length ? data.activity.slice(0, 12).map((a) => `
        <div class="row" style="cursor:default">
          <div class="grow"><div class="name" style="font-size:13px;font-weight:400">${esc(a.text)}</div>
          <div class="meta">${esc(a.device)} · ${new Date(a.ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div></div>
        </div>`).join("") : `<div class="empty"><b>No changes yet</b>Edits made on any device will show up here</div>`}
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h2>Settings</h2></div>
      <div class="rows">
        <div class="row" style="cursor:default">
          <div class="grow"><div class="name">This device's name</div>
          <div class="meta">Shows in "Recent changes" so you know who did what</div></div>
          <input class="inline-input" id="deviceNameInput" placeholder="e.g. Sean's phone" value="${esc(deviceName())}">
        </div>
        <div class="row" style="cursor:default">
          <div class="grow"><div class="name">Payday (day of month)</div>
          <div class="meta">Shows a countdown on the Home page</div></div>
          <input class="inline-input" id="paydayInput" type="number" min="1" max="31" inputmode="numeric" placeholder="—" value="${data.settings.payday ?? ""}">
        </div>
        <div class="row" style="cursor:default">
          <div class="grow"><div class="name">Appearance</div>
          <div class="meta">Auto follows this device's setting</div></div>
          <div class="seg" id="themeSeg">
            ${["auto", "light", "dark"].map((t) =>
              `<button data-t="${t}" class="${themePref() === t ? "active" : ""}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h2>Account</h2></div>
      <div class="sync-status">${userId
        ? "Signed in as <b>" + esc(userEmail) + "</b> — changes sync live between devices"
        : "Not signed in — data only lives on this device"}</div>
      ${userId ? `<div class="more-list"><button class="morebtn" id="signOutBtn"><span class="ico">${ICONS.signout}</span>
        <div>Sign out<div class="desc">Stop syncing on this device</div></div></button></div>` : ""}
    </div>

    <div class="section">
      <div class="section-head"><h2>Backup</h2></div>
      <div class="sync-status">${data.savedAt ? "Last change: " + new Date(data.savedAt).toLocaleString("en-GB") : "No changes yet"}</div>
      <div class="more-list">
        <button class="morebtn" id="exportBtn"><span class="ico">${ICONS.download}</span>
          <div>Export data<div class="desc">Save ${DATA_FILENAME} — put it in OneDrive to share</div></div></button>
        <button class="morebtn" id="importBtn"><span class="ico">${ICONS.upload}</span>
          <div>Import data<div class="desc">Load a ${DATA_FILENAME} file (replaces what's on this device)</div></div></button>
        <button class="morebtn" id="resetBtn"><span class="ico">${ICONS.trash}</span>
          <div>Reset to spreadsheet data<div class="desc">Wipe this device's data back to the original Budget 2025 numbers</div></div></button>
      </div>
    </div>`;

  const so = $("#signOutBtn");
  if (so) so.addEventListener("click", async () => {
    if (confirm("Sign out of the budget on this device?")) await supa.auth.signOut();
  });
  $("#deviceNameInput").addEventListener("change", (e) => {
    localStorage.setItem("budgetDeviceName", e.target.value.trim());
  });
  document.querySelectorAll("#themeSeg button").forEach((b) =>
    b.addEventListener("click", () => setTheme(b.dataset.t)));
  $("#paydayInput").addEventListener("change", (e) => {
    const v = parseInt(e.target.value, 10);
    data.settings.payday = isNaN(v) ? null : Math.min(31, Math.max(1, v));
    persist();
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
        act((id ? "Edited" : "Logged") + " expense " + name + " — " + gbp(amount));
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
$("#fabAdd").addEventListener("click", () => editLog(null));
$("#modalBackdrop").addEventListener("click", (e) => { if (e.target.id === "modalBackdrop") closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ================= Cloud sync ================= */
let pushTimer = null;
function updateCloudDot() {
  const pill = $("#syncPill");
  pill.hidden = !userId;
  pill.className = "sync-pill" + (cloudState === "ok" ? " ok" : cloudState === "offline" ? " offline" : "");
  pill.querySelector(".pill-text").textContent =
    cloudState === "ok" ? "Synced" : cloudState === "offline" ? "Offline" : "Syncing…";
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

/* ================= Pull to refresh ================= */
const ptrEl = document.createElement("div");
ptrEl.className = "ptr";
ptrEl.textContent = "Refreshing…";
document.body.appendChild(ptrEl);
let ptrStartY = null;
window.addEventListener("touchstart", (e) => {
  ptrStartY = window.scrollY === 0 ? e.touches[0].clientY : null;
}, { passive: true });
window.addEventListener("touchmove", (e) => {
  if (ptrStartY == null || !userId || !supa) return;
  if (e.touches[0].clientY - ptrStartY > 80) {
    ptrStartY = null;
    ptrEl.classList.add("show");
    Promise.resolve(initialCloudSync()).finally(() =>
      setTimeout(() => ptrEl.classList.remove("show"), 600));
  }
}, { passive: true });

/* ================= Theme (Auto / Light / Dark) ================= */
const themeMeta = document.querySelector('meta[name="theme-color"]');
const lightMq = matchMedia("(prefers-color-scheme: light)");
function themePref() { return localStorage.getItem("budgetTheme") || "auto"; }
function applyTheme() {
  const t = themePref();
  document.documentElement.dataset.theme = t;
  const effectiveLight = t === "light" || (t === "auto" && lightMq.matches);
  themeMeta.content = effectiveLight ? "#f4f6f9" : "#14181d";
}
function setTheme(t) {
  localStorage.setItem("budgetTheme", t);
  applyTheme();
  if (curView === "more") render();
}
lightMq.addEventListener("change", applyTheme);
applyTheme();
