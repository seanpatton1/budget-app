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
  cats: [],       // spending categories, seeded in migrate() from the Expenses group
  notes: [],      // [{id, text, done}] shared to-do list
  snapshots: {},  // { "YYYY-MM": {out} } — what outgoings actually totalled that month
  settings: { payday: null, remind: false }
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
  d.notes = d.notes || [];
  d.snapshots = d.snapshots || {};
  d.settings = d.settings || { payday: null, remind: false };

  // Bills: default frequency, and a flag for ones whose amount varies
  d.outgoings.forEach((o) => {
    if (!o.freq) o.freq = "monthly";
    if (o.variable == null) o.variable = false;
  });
  // Debts: interest rate + whether the monthly payment counts as an outgoing
  d.debts.forEach((x) => {
    if (x.apr == null) x.apr = null;
    if (x.inOutgoings == null) x.inOutgoings = false;
  });
  // paid: [ids] → { id: actualAmount|null } so we can record what a bill really cost
  Object.keys(d.paid).forEach((k) => {
    if (Array.isArray(d.paid[k])) {
      const obj = {};
      d.paid[k].forEach((id) => { obj[id] = null; });
      d.paid[k] = obj;
    }
  });
  // Spending categories seeded from the Expenses group — those amounts are the budgets
  if (!d.cats || !d.cats.length) {
    d.cats = d.outgoings.filter((o) => o.group === "exp")
      .map((o) => ({ id: uid(), name: o.name, budget: o.amount || null }));
    d.cats.push({ id: uid(), name: "Other", budget: null });
  }
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
  return migrate(defaultData());
}
function persist() {
  snapshotThisMonth();
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
  signout: '<svg viewBox="0 0 24 24"><path d="M9 21H4V3h5"/><path d="M15 17l5-5-5-5"/><path d="M20 12H9"/></svg>',
  wallet: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
  basket: '<svg viewBox="0 0 24 24"><path d="M3 6h18l-1.5 13.5a2 2 0 01-2 1.5H6.5a2 2 0 01-2-1.5z"/><path d="M8.5 9V5.5a3.5 3.5 0 017 0V9"/></svg>',
  out: '<svg viewBox="0 0 24 24"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>',
  card: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  sliders: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><circle cx="9" cy="7" r="2.5"/><path d="M4 17h16"/><circle cx="15" cy="17" r="2.5"/></svg>'
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
const FREQS = { monthly: "Monthly", quarterly: "Every 3 months", annual: "Yearly" };
/* What a bill costs per month once spread out — an £312 yearly policy is £26/mo */
function monthlyAmount(o) {
  const a = o.amount || 0;
  if (o.freq === "annual") return a / 12;
  if (o.freq === "quarterly") return a / 3;
  return a;
}
/* Does this bill actually leave the account in the given month? */
function occursIn(o, monthKey) {
  if (!o.freq || o.freq === "monthly") return true;
  if (!o.nextDue) return false;
  const [ay, am] = o.nextDue.split("-").map(Number);
  const [y, m] = monthKey.split("-").map(Number);
  const diff = (y - ay) * 12 + (m - am);
  if (diff < 0) return false;
  return o.freq === "annual" ? diff % 12 === 0 : diff % 3 === 0;
}
function dueDayOf(o) {
  if (!o.freq || o.freq === "monthly") return o.dueDay;
  return o.nextDue ? Number(o.nextDue.slice(8, 10)) : null;
}
function groupTotal(gid) {
  return data.outgoings.filter((o) => o.group === gid).reduce((s, o) => s + monthlyAmount(o), 0);
}
/* Debt repayments count as outgoings when you've flagged them */
function debtPaymentsTotal() {
  return data.debts.reduce((s, d) => s + (d.inOutgoings ? (latestPayment(d) || 0) : 0), 0);
}
function outgoingsTotal() {
  return data.outgoings.reduce((s, o) => s + monthlyAmount(o), 0) + debtPaymentsTotal();
}
/* Past months keep whatever they totalled at the time */
function outgoingsTotalFor(key) {
  if (key < curMonthKey() && data.snapshots[key] != null) return data.snapshots[key].out;
  return outgoingsTotal();
}
function snapshotThisMonth() {
  data.snapshots[curMonthKey()] = { out: outgoingsTotal() };
}
/* ---- Spending ---- */
function logInMonth(key) {
  return data.log.filter((l) => l.date.slice(0, 7) === key);
}
function spentInCat(catId, key) {
  return logInMonth(key).filter((l) => l.cat === catId).reduce((s, l) => s + (l.amount || 0), 0);
}
function spentTotal(key) {
  return logInMonth(key).reduce((s, l) => s + (l.amount || 0), 0);
}
function catBudgetTotal() {
  return data.cats.reduce((s, c) => s + (c.budget || 0), 0);
}
function catName(id) {
  const c = data.cats.find((x) => x.id === id);
  return c ? c.name : "Uncategorised";
}
/* ---- Pots ---- */
function potsMonthlyTotal() {
  return data.pots.reduce((s, p) => s + (p.monthly || 0), 0);
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
  const m = data.paid[monthKey || curMonthKey()];
  return !!m && oid in m;
}
/* What it actually cost — falls back to the expected amount */
function paidAmount(o, monthKey) {
  const m = data.paid[monthKey || curMonthKey()] || {};
  const actual = m[o.id];
  return actual == null ? monthlyAmount(o) : actual;
}
function togglePaid(oid, actual) {
  const key = curMonthKey();
  const m = data.paid[key] || (data.paid[key] = {});
  const o = data.outgoings.find((x) => x.id === oid);
  if (oid in m && actual === undefined) {
    delete m[oid];
    act("Unticked " + (o ? o.name : "a bill"));
  } else {
    m[oid] = actual === undefined ? null : actual;
    act("Paid " + (o ? o.name : "a bill") + (actual != null ? " — " + gbp(actual) : ""));
  }
  buzz();
  persist();
}
function paidTotals() {
  const key = curMonthKey();
  const billable = data.outgoings.filter((o) => monthlyAmount(o) > 0);
  const due = billable.reduce((s, o) => s + monthlyAmount(o), 0) + debtPaymentsTotal();
  const paid = billable.filter((o) => isPaid(o.id, key)).reduce((s, o) => s + paidAmount(o, key), 0);
  return { due, paid };
}
/* Expected vs actual across everything ticked this month */
function varianceThisMonth() {
  const key = curMonthKey();
  const m = data.paid[key] || {};
  let expected = 0, actual = 0, n = 0;
  Object.keys(m).forEach((id) => {
    if (m[id] == null) return;
    const o = data.outgoings.find((x) => x.id === id);
    if (!o) return;
    expected += monthlyAmount(o); actual += m[id]; n++;
  });
  return { expected, actual, n, diff: actual - expected };
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
/* Roll the debts forward month by month to see when they clear */
function simulatePayoff(extra, strategy) {
  const list = data.debts.map((d) => {
    const e = latestEntry(d);
    return { name: d.name, bal: e ? e.balance || 0 : 0, pay: latestPayment(d) || 0, apr: d.apr || 0 };
  }).filter((d) => d.bal > 0);
  if (!list.length) return null;
  if (!list.some((d) => d.pay > 0) && !extra) return { impossible: true };

  let months = 0, interest = 0;
  const cleared = {};
  while (list.some((d) => d.bal > 0) && months < 600) {
    months++;
    list.forEach((d) => {
      if (d.bal <= 0) return;
      const i = d.bal * (d.apr / 100 / 12);
      d.bal += i; interest += i;
    });
    list.forEach((d) => {
      if (d.bal <= 0) return;
      d.bal = Math.max(0, d.bal - Math.min(d.pay, d.bal));
    });
    let pool = extra;
    const order = list.filter((d) => d.bal > 0)
      .sort((a, b) => (strategy === "avalanche" ? b.apr - a.apr : a.bal - b.bal));
    for (const d of order) {
      if (pool <= 0) break;
      const p = Math.min(pool, d.bal);
      d.bal -= p; pool -= p;
    }
    list.forEach((d) => { if (d.bal <= 0 && !cleared[d.name]) cleared[d.name] = months; });
  }
  if (months >= 600) return { impossible: true };
  return { months, interest, cleared };
}
function monthsAway(months) {
  const t = new Date();
  const m = t.getMonth() + months;
  return MONTH_NAMES[((m % 12) + 12) % 12].slice(0, 3) + " " + (t.getFullYear() + Math.floor(m / 12));
}

/* ---- Bill reminders (checked when the app opens) ---- */
async function enableReminders() {
  if (!("Notification" in window)) { alert("This device doesn't support notifications."); return; }
  const perm = await Notification.requestPermission();
  data.settings.remind = perm === "granted";
  if (perm !== "granted") alert("Notifications are blocked — allow them in your browser settings to get bill reminders.");
  persist(); render();
}
function checkReminders() {
  if (!data.settings.remind || Notification.permission !== "granted") return;
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 864e5).getDate();
  const stamp = "budgetRemind_" + today.toISOString().slice(0, 10);
  if (localStorage.getItem(stamp)) return;
  const due = data.outgoings.filter((o) =>
    monthlyAmount(o) > 0 && dueDayOf(o) === tomorrow && occursIn(o, curMonthKey()) && !isPaid(o.id));
  if (!due.length) return;
  const total = due.reduce((s, o) => s + (o.amount || 0), 0);
  new Notification("Bills due tomorrow", {
    body: due.map((o) => o.name).join(", ") + " — " + gbp(total),
    icon: "icon-192.png", badge: "icon-192.png"
  });
  localStorage.setItem(stamp, "1");
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
/* ---- Feel: haptics, motion, collapsing ---- */
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms || 12); } catch (e) {} }

/* Which Home sections this device shows — Martina and Sean can differ */
const HOME_SECTIONS = [
  { id: "spendCats", label: "Spending categories", desc: "Progress bar per category", def: false },
  { id: "big",       label: "Coming up",           desc: "Yearly and quarterly bills ahead", def: false },
  { id: "inc",       label: "Income breakdown",    desc: "Who paid what into joint", def: false },
  { id: "groups",    label: "Outgoings by group",  desc: "Totals per group", def: false },
  { id: "debts",     label: "Debts list",          desc: "Every balance on Home", def: false },
  { id: "pots",      label: "Savings pots",        desc: "Pot balances and targets", def: false },
  { id: "cal",       label: "Bill calendar",       desc: "Month grid with bill days", def: false }
];
function homePrefs() {
  try { return JSON.parse(localStorage.getItem("budgetHomeSections") || "{}"); } catch (e) { return {}; }
}
function showsOnHome(id) {
  const p = homePrefs();
  if (id in p) return p[id];
  const s = HOME_SECTIONS.find((x) => x.id === id);
  return s ? s.def : true;
}
function setHomeSection(id, on) {
  const p = homePrefs();
  p[id] = on;
  localStorage.setItem("budgetHomeSections", JSON.stringify(p));
}
/* Only renders when this device wants the section */
function optSection(id, title, totalHtml, bodyHtml, extraHtml) {
  return showsOnHome(id) ? section(id, title, totalHtml, bodyHtml, extraHtml) : "";
}

function collapsed() {
  try { return JSON.parse(localStorage.getItem("budgetCollapsed") || "[]"); } catch (e) { return []; }
}
function isCollapsed(id) { return collapsed().includes(id); }
function toggleCollapsed(id) {
  const c = collapsed();
  const i = c.indexOf(id);
  if (i >= 0) c.splice(i, 1); else c.push(id);
  localStorage.setItem("budgetCollapsed", JSON.stringify(c));
  buzz(8);
}
/* Section wrapper that remembers whether you've folded it away */
function section(id, title, totalHtml, bodyHtml, extraHtml) {
  const shut = isCollapsed(id);
  return `
    <div class="section" data-sec="${id}">
      <button class="section-head sec-toggle" data-toggle-sec="${id}">
        <h2>${title}<span class="chev ${shut ? "shut" : ""}">›</span></h2>
        <span class="total">${totalHtml || ""}</span>
      </button>
      <div class="sec-body" ${shut ? "hidden" : ""}>${bodyHtml}${extraHtml || ""}</div>
    </div>`;
}

/* Numbers tick up to their new value rather than snapping */
let lastHero = null;
function animateHero(el, to) {
  const from = lastHero;
  lastHero = to;
  if (from == null || from === to || reduceMotion()) { el.innerHTML = gbpHero(to); return; }
  const start = performance.now(), dur = 550;
  (function step(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.innerHTML = gbpHero(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
    else el.innerHTML = gbpHero(to);
  })(start);
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
  ({ home: renderHome, spending: renderSpending, income: renderIncome,
     outgoings: renderOutgoings, debts: renderDebts, more: renderMore,
     yearly: renderYearly })[curView]();
  document.querySelectorAll("[data-toggle-sec]").forEach((b) =>
    b.addEventListener("click", () => { toggleCollapsed(b.dataset.toggleSec); render(); }));
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
  const outTotal = outgoingsTotalFor(selMonth);
  const leftover = incTotal - outTotal;
  const saving = potsMonthlyTotal();
  const free = leftover - saving;
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
    const v = varianceThisMonth();
    const vLine = v.n
      ? ` · actuals ${v.diff === 0 ? "spot on" :
          (v.diff > 0 ? gbp(v.diff) + " over" : gbp(-v.diff) + " under")} on ${v.n} bill${v.n === 1 ? "" : "s"}`
      : "";
    paidHtml = `
    <div class="section">
      <div class="section-head"><h2>Paid this month</h2><span class="total">${gbp(paid)} of ${gbp(due)}</span></div>
      <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-sub">${pct}% paid${vLine}</div>
    </div>`;
  }

  // Spending against category budgets
  const spendBudget = catBudgetTotal();
  const spent = spentTotal(selMonth);
  const spendPct = spendBudget ? Math.min(100, Math.round((spent / spendBudget) * 100)) : 0;
  const topCats = [...data.cats]
    .map((c) => ({ ...c, spent: spentInCat(c.id, selMonth) }))
    .filter((c) => c.budget || c.spent)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 4);
  const spendHtml = `
    <div class="section">
      <div class="section-head"><h2>Day-to-day spending</h2><span class="total">${gbp(spent)} of ${gbp(spendBudget)}</span></div>
      <div class="progress"><div class="progress-bar ${spent > spendBudget && spendBudget ? "over" : ""}" style="width:${spendPct}%"></div></div>
      <div class="progress-sub">${spendBudget ? (spent > spendBudget
        ? gbp(spent - spendBudget) + " over budget this month"
        : gbp(spendBudget - spent) + " left of your spending money") + " · this budget is already inside your outgoings"
        : "Set budgets on the Spending tab"}</div>
    </div>`;
  const spendCatsHtml = optSection("spendCats", "By category", "", `
    <div class="rows">${topCats.length ? topCats.map((c) => {
      const pct = c.budget ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : null;
      const over = c.budget && c.spent > c.budget;
      return `
      <button class="row" data-goto="spending">
        <div class="grow"><div class="name">${esc(c.name)}</div>
        ${pct != null ? `<div class="progress sm"><div class="progress-bar ${over ? "over" : ""}" style="width:${pct}%"></div></div>` : ""}
        <div class="meta">${c.budget ? gbp(c.spent) + " of " + gbp(c.budget) : gbp(c.spent) + " spent"}</div></div>
        <div class="amt ${over ? "over" : ""}">${c.budget ? (over ? "+" + gbp(c.spent - c.budget) : gbp(c.budget - c.spent)) : gbp(c.spent)}</div>
      </button>`;
    }).join("") : `<div class="empty"><b>No spending logged</b>Tap + to log what you spend as you go</div>`}
    </div>`);

  // Annual and quarterly bills landing in the next couple of months
  const upcomingBig = data.outgoings
    .filter((o) => o.freq && o.freq !== "monthly" && o.amount > 0)
    .map((o) => {
      for (let i = 0; i < 6; i++) {
        const k = shiftMonth(curMonthKey(), i);
        if (occursIn(o, k)) return { o, k, i };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.i - b.i);
  const bigHtml = upcomingBig.length ? optSection("big", "Coming up", "", `
    <div class="rows">${upcomingBig.map(({ o, k, i }) => `
      <button class="row" data-edit-out="${o.id}">
        <div class="grow"><div class="name">${esc(o.name)}</div>
        <div class="meta">${FREQS[o.freq]} · ${monthLabel(k)}${dueDayOf(o) ? " · " + ordinal(dueDayOf(o)) : ""}</div></div>
        <span class="badge ${i === 0 ? "due" : ""}">${i === 0 ? "this month" : i === 1 ? "next month" : "in " + i + " months"}</span>
        <div class="amt">${gbp(o.amount)}</div>
      </button>`).join("")}
    </div>`) : "";

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
      .filter((o) => dueDayOf(o) != null && o.amount > 0 && !isPaid(o.id) && occursIn(o, selMonth))
      .map((o) => {
        let diff = dueDayOf(o) - day;
        if (diff < 0) diff += 31;   // rolls into next month
        return { o, diff };
      })
      .filter((x) => x.diff <= 7)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 5);
    dueHtml = upcoming.length
      ? upcoming.map(({ o, diff }) => `
        <div class="row" style="cursor:default">
          <div class="grow"><div class="name">${esc(o.name)}</div>
          <div class="meta">${ordinal(dueDayOf(o))}${o.account ? " · " + esc(o.account) : ""}</div></div>
          <span class="badge ${diff === 0 ? "today" : "due"}">${diff === 0 ? "today" : "in " + diff + "d"}</span>
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
    <button class="hero" id="heroBtn">
      <div class="hero-label">Left to allocate · ${monthLabel(selMonth)} <span class="hero-info">?</span></div>
      <div class="hero-value ${free < 0 ? "neg" : ""}" id="heroValue">${gbpHero(free)}</div>
      <div class="hero-note">after bills, ${gbp(spendBudget)} spending money${saving ? " and " + gbp(saving) + " into pots" : ""}</div>
      <div class="hero-stats">
        <div class="hstat"><div class="hs-label">Income in</div><div class="hs-value">${gbp(incTotal)} ${incDelta}</div></div>
        <div class="hstat"><div class="hs-label">Committed</div><div class="hs-value">${gbp(outTotal + saving)}</div></div>
        <div class="hstat"><div class="hs-label">Total debt</div><div class="hs-value">${gbp(debt)} ${debtDelta}</div></div>
      </div>
    </button>
    ${incTotal && free > 0 ? `
      <button class="allocate-cta" id="allocateBtn">
        <div><div class="planner-title">${gbp(free)} without a job</div>
        <div class="planner-sub">earmark it for savings, a holiday or clearing debt faster</div></div>
        <span class="chev">›</span>
      </button>` : ""}
    ${paidHtml}
    ${spendHtml}
    ${spendCatsHtml}
    ${bigHtml}
    ${section("due", "Due soon", "", `<div class="rows">${dueHtml}</div>`)}
    ${optSection("inc", monthLabel(selMonth) + " income", gbp(incTotal), `
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
      </div>`,
      `<button class="addbtn" id="enterSalary">${inc ? "Edit" : "+ Enter"} ${monthLabel(selMonth)} salaries</button>`)}
    ${optSection("groups", "Outgoings by group", gbp(outTotal), `
      <div class="rows">${GROUPS.map((g) => `
        <button class="row acc" style="--acc:${g.color}" data-goto="outgoings">
          <div class="grow"><div class="name">${esc(g.name)}</div></div>
          <div class="amt">${gbp(groupTotal(g.id))}</div>
        </button>`).join("")}
        ${debtPaymentsTotal() ? `
        <button class="row acc" style="--acc:var(--red)" data-goto="debts">
          <div class="grow"><div class="name">Debt repayments</div>
          <div class="meta">counted in your outgoings</div></div>
          <div class="amt">${gbp(debtPaymentsTotal())}</div>
        </button>` : ""}
      </div>`)}
    ${optSection("debts", "Debts", gbp(debt), `
      <div class="rows">${data.debts.length ? data.debts.map((d) => {
        const e = latestEntry(d);
        return `
        <button class="row" data-goto="debts">
          <div class="grow"><div class="name">${esc(d.name)}</div>
          <div class="meta">${e ? "as of " + monthLabel(e.month) : "no entries yet"}</div></div>
          <div class="amt">${e ? gbp(e.balance) : "—"}</div>
        </button>`;
      }).join("") : `<div class="empty"><b>Debt free</b>Nothing owed — long may it last</div>`}
      </div>`)}
    ${optSection("pots", "Savings pots", gbp(data.pots.reduce((s, p) => s + (p.balance || 0), 0)), `
      <div class="rows">${data.pots.length ? data.pots.map((p) => {
        const pct = p.target ? Math.min(100, Math.round((p.balance / p.target) * 100)) : null;
        return `
        <button class="row" data-edit-pot="${p.id}">
          <div class="grow"><div class="name">${esc(p.name)}</div>
          ${pct != null ? `<div class="progress sm"><div class="progress-bar" style="width:${pct}%"></div></div>` : ""}
          <div class="meta">${p.target ? gbp(p.balance) + " of " + gbp(p.target) + " · " + pct + "%" : "no target set"}${p.monthly ? " · " + gbp(p.monthly) + "/mo" : ""}</div></div>
          <div class="amt">${gbp(p.balance)}</div>
        </button>`;
      }).join("") : `<div class="empty"><b>No pots yet</b>Add one below to start putting money aside</div>`}
      </div>`,
      `<button class="addbtn" id="addPot">+ Add a pot</button>`)}
    ${optSection("cal", monthLabel(selMonth) + " calendar", "", miniCalendarHtml())}
    <div class="quicklinks">
      <button class="qlink" data-goto="spending"><span class="ico">${ICONS.basket}</span><span>Spending</span></button>
      <button class="qlink" data-goto="outgoings"><span class="ico">${ICONS.out}</span><span>Outgoings</span></button>
      <button class="qlink" data-goto="debts"><span class="ico">${ICONS.card}</span><span>Debts</span></button>
      <button class="qlink" data-goto="income"><span class="ico">${ICONS.wallet}</span><span>Income</span></button>
      <button class="qlink" data-goto="yearly"><span class="ico">${ICONS.chart}</span><span>Year</span></button>
      <button class="qlink" id="customiseHome"><span class="ico">${ICONS.sliders}</span><span>Customise</span></button>
    </div>`;

  animateHero($("#heroValue"), free);
  bindMonthbar();
  document.querySelectorAll("[data-edit-out]").forEach((b) =>
    b.addEventListener("click", () => editOutgoing(b.dataset.editOut)));
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.goto)));
  ["#editIncomeHome", "#editIncomeHome2", "#enterSalary"].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener("click", () => editIncome(selMonth));
  });
  document.querySelectorAll("[data-edit-pot]").forEach((b) =>
    b.addEventListener("click", () => editPot(b.dataset.editPot)));
  const ap = $("#addPot");
  if (ap) ap.addEventListener("click", () => editPot(null));
  $("#customiseHome").addEventListener("click", customiseHome);
  $("#heroBtn").addEventListener("click", () => showBreakdown(incTotal, outTotal, leftover, saving, free));
  const alloc = $("#allocateBtn");
  if (alloc) alloc.addEventListener("click", () => allocateSpare(free));
}

/* Give the spare money a job */
function allocateSpare(free) {
  openModal("Give " + gbp(free) + " a job", `
    <div class="field-hint" style="margin-bottom:14px">Anything you earmark comes off the headline figure,
    so what's left really is spare.</div>
    <div class="rows">${data.pots.map((p) => `
      <button class="row" data-alloc-pot="${p.id}">
        <div class="grow"><div class="name">${esc(p.name)}</div>
        <div class="meta">${p.monthly ? gbp(p.monthly) + " a month already" : "nothing set aside monthly"}</div></div>
        <div class="amt">${gbp(p.balance)}</div>
      </button>`).join("")}
      ${data.debts.filter((d) => { const e = latestEntry(d); return e && e.balance > 0; }).map((d) => `
        <button class="row acc" style="--acc:var(--red)" data-alloc-debt="${d.id}">
          <div class="grow"><div class="name">Pay more off ${esc(d.name)}</div>
          <div class="meta">${gbp(latestPayment(d) || 0)} a month now</div></div>
          <div class="amt">${gbp(latestEntry(d).balance)}</div>
        </button>`).join("")}
    </div>
    <button class="addbtn" id="allocNewPot">+ Make a new pot for it</button>`,
    [{ label: "Close", cls: "btn-ghost", fn: closeModal }]);
  document.querySelectorAll("[data-alloc-pot]").forEach((b) =>
    b.addEventListener("click", () => { closeModal(); editPot(b.dataset.allocPot); }));
  document.querySelectorAll("[data-alloc-debt]").forEach((b) =>
    b.addEventListener("click", () => { closeModal(); updateDebt(b.dataset.allocDebt); }));
  $("#allocNewPot").addEventListener("click", () => { closeModal(); editPot(null); });
}

/* Where the money actually went */
function showBreakdown(incTotal, outTotal, leftover, saving, free) {
  const dp = debtPaymentsTotal();
  const rows = GROUPS.map((g) => ({ name: g.name, amt: groupTotal(g.id), color: g.color }))
    .filter((r) => r.amt > 0);
  if (dp) rows.push({ name: "Debt repayments", amt: dp, color: "var(--red)" });

  openModal(monthLabel(selMonth) + " breakdown", `
    <div class="rows">
      <div class="row" style="cursor:default">
        <div class="grow"><div class="name">Income into joint</div>
        <div class="meta">Sean and Martina's transfers</div></div>
        <div class="amt">${gbp(incTotal)}</div>
      </div>
      ${rows.map((r) => `
        <div class="row acc" style="--acc:${r.color};cursor:default">
          <div class="grow"><div class="name">${esc(r.name)}</div>
          ${r.name === "Expenses" ? `<div class="meta">your day-to-day spending money</div>` : ""}</div>
          <div class="amt">−${gbp(r.amt)}</div>
        </div>`).join("")}
      ${saving ? `
      <div class="row" style="cursor:default">
        <div class="grow"><div class="name">Into savings pots</div>
        <div class="meta">${data.pots.filter((p) => p.monthly).map((p) => esc(p.name) + " " + gbp(p.monthly)).join(" · ")}</div></div>
        <div class="amt">−${gbp(saving)}</div>
      </div>` : ""}
      <div class="row" style="cursor:default;background:var(--card2)">
        <div class="grow"><div class="name"><b>Left to allocate</b></div>
        <div class="meta">not spoken for by anything yet</div></div>
        <div class="amt ${free < 0 ? "over" : ""}">${gbp(free)}</div>
      </div>
    </div>
    <div class="field-hint" style="margin-top:12px">Your spending budget sits inside Expenses, so it's already
    deducted above — the Spending tab just tracks how much of it you've used.</div>`,
    [{ label: "Got it", cls: "btn-primary", fn: closeModal }]);
}

/* Per-device: choose what Home shows */
function customiseHome() {
  openModal("What shows on Home", `
    <div class="field-hint" style="margin-bottom:12px">Just for this device — Martina's phone keeps its own layout.
    The disposable income, what's paid, spending and due soon always show.</div>
    <div class="rows">${HOME_SECTIONS.map((s) => `
      <label class="row" style="cursor:pointer">
        <div class="grow"><div class="name">${esc(s.label)}</div><div class="meta">${esc(s.desc)}</div></div>
        <input type="checkbox" class="paidbox" data-home-sec="${s.id}" ${showsOnHome(s.id) ? "checked" : ""}>
      </label>`).join("")}
    </div>`,
    [{ label: "Done", cls: "btn-primary", fn: () => { closeModal(); render(); } }]);
  document.querySelectorAll("[data-home-sec]").forEach((cb) =>
    cb.addEventListener("change", () => { setHomeSection(cb.dataset.homeSec, cb.checked); buzz(8); }));
}

/* ================= Pots ================= */
function editPot(id) {
  const p = id ? data.pots.find((x) => x.id === id) : { name: "", target: "", balance: "" };
  openModal(id ? "Update " + p.name : "Add a pot", `
    <div class="field"><label>Name</label><input id="f_name" value="${esc(p.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Current amount (£)</label><input id="f_bal" type="number" step="0.01" inputmode="decimal" value="${p.balance ?? ""}"></div>
      <div class="field"><label>Target (£, optional)</label><input id="f_target" type="number" step="0.01" inputmode="decimal" value="${p.target ?? ""}"></div>
    </div>
    <div class="field"><label>Paying in each month (£, optional)</label>
      <input id="f_monthly" type="number" step="0.01" inputmode="decimal" value="${p.monthly ?? ""}">
      <div class="field-hint">Taken off your disposable income on Home so you see what's truly free</div>
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
        const monthly = parseFloat($("#f_monthly").value);
        const t = isNaN(target) ? null : target, mo = isNaN(monthly) ? null : monthly;
        if (id) { p.name = name; p.balance = bal; p.target = t; p.monthly = mo; }
        else data.pots.push({ id: uid(), name, balance: bal, target: t, monthly: mo });
        act((id ? "Updated" : "Added") + " pot " + name + " — " + gbp(bal));
        persist(); closeModal(); render();
      }}
    ]);
}

/* ================= Spending ================= */
function renderSpending() {
  const budget = catBudgetTotal();
  const spent = spentTotal(selMonth);
  const pct = budget ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const entries = logInMonth(selMonth).sort((a, b) => b.date.localeCompare(a.date));

  $("#view-spending").innerHTML = `
    <h1>Spending</h1>
    <div class="sub">What you've actually spent against each budget — tap + to log as you go</div>
    ${monthbarHtml()}
    <div class="hero">
      <div class="hero-label">Spent · ${monthLabel(selMonth)}</div>
      <div class="hero-value ${budget && spent > budget ? "neg" : ""}">${gbpHero(spent)}</div>
      <div class="hero-stats">
        <div class="hstat"><div class="hs-label">Budget</div><div class="hs-value">${gbp(budget)}</div></div>
        <div class="hstat"><div class="hs-label">${spent > budget ? "Over by" : "Left"}</div>
          <div class="hs-value ${spent > budget && budget ? "over" : ""}">${gbp(Math.abs(budget - spent))}</div></div>
      </div>
    </div>
    <div class="progress"><div class="progress-bar ${budget && spent > budget ? "over" : ""}" style="width:${pct}%"></div></div>
    <div class="progress-sub">${budget ? pct + "% of budget used" : "No budgets set yet"}</div>

    ${section("cats", "Categories", gbp(budget), `
      <div class="rows">${data.cats.length ? data.cats.map((c) => {
        const cs = spentInCat(c.id, selMonth);
        const cp = c.budget ? Math.min(100, Math.round((cs / c.budget) * 100)) : null;
        const over = c.budget && cs > c.budget;
        return `
        <button class="row" data-edit-cat="${c.id}">
          <div class="grow"><div class="name">${esc(c.name)}</div>
          ${cp != null ? `<div class="progress sm"><div class="progress-bar ${over ? "over" : ""}" style="width:${cp}%"></div></div>` : ""}
          <div class="meta">${c.budget ? gbp(cs) + " of " + gbp(c.budget) : gbp(cs) + " spent · no budget"}</div></div>
          <div class="amt ${over ? "over" : ""}">${c.budget ? (over ? "+" + gbp(cs - c.budget) : gbp(c.budget - cs)) : gbp(cs)}</div>
        </button>`;
      }).join("") : `<div class="empty"><b>No categories</b>Add one to start budgeting</div>`}
      </div>`,
      `<button class="addbtn" id="addCat">+ Add a category</button>`)}

    ${section("log", monthLabel(selMonth) + " log", gbp(spent), `
      <div class="rows">${entries.length ? entries.map((l) => `
        <button class="row" data-edit-log="${l.id}">
          <div class="grow"><div class="name">${esc(l.name)}</div>
          <div class="meta">${new Date(l.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${esc(catName(l.cat))}</div></div>
          <div class="amt">${gbp(l.amount)}</div>
        </button>`).join("") : `<div class="empty"><b>Nothing logged this month</b>Tap the green + to add a spend</div>`}
      </div>`,
      `<button class="addbtn" id="addLogSpend">+ Log a spend</button>`)}`;

  bindMonthbar();
  document.querySelectorAll("[data-edit-cat]").forEach((b) =>
    b.addEventListener("click", () => editCat(b.dataset.editCat)));
  document.querySelectorAll("[data-edit-log]").forEach((b) =>
    b.addEventListener("click", () => editLog(b.dataset.editLog)));
  $("#addCat").addEventListener("click", () => editCat(null));
  $("#addLogSpend").addEventListener("click", () => editLog(null));
}

function editCat(id) {
  const c = id ? data.cats.find((x) => x.id === id) : { name: "", budget: "" };
  openModal(id ? "Edit category" : "Add a category", `
    <div class="field"><label>Name</label><input id="f_name" value="${esc(c.name)}"></div>
    <div class="field"><label>Monthly budget (£, optional)</label>
      <input id="f_budget" type="number" step="0.01" inputmode="decimal" value="${c.budget ?? ""}"></div>`,
    [
      ...(id ? [{ label: "Delete", cls: "btn-danger", fn: () => {
        if (!confirm("Delete the " + c.name + " category? Logged spends keep their amount but lose the label.")) return;
        data.cats = data.cats.filter((x) => x.id !== id);
        act("Deleted category " + c.name);
        persist(); closeModal(); render();
      }}] : []),
      { label: "Cancel", cls: "btn-ghost", fn: closeModal },
      { label: "Save", cls: "btn-primary", fn: () => {
        const name = $("#f_name").value.trim();
        if (!name) { alert("Name is required"); return; }
        const b = parseFloat($("#f_budget").value);
        const budget = isNaN(b) ? null : b;
        if (id) { c.name = name; c.budget = budget; }
        else data.cats.push({ id: uid(), name, budget });
        act((id ? "Edited" : "Added") + " category " + name);
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
        <button class="chart-col" data-chart-month="${incomeYear}-${String(i + 1).padStart(2, "0")}"
                title="${MONTH_NAMES[i]}: in ${gbp(t)}, out ${gbp(outTotal)}">
          <div class="chart-bars">
            <div class="chart-bar in" style="height:${Math.round((t / maxVal) * 100)}%"></div>
            <div class="chart-bar out" style="height:${Math.round((outTotal / maxVal) * 100)}%"></div>
          </div>
          <div class="chart-lbl">${MONTH_NAMES[i][0]}</div>
        </button>`).join("")}
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
    </table></div>
    <button class="addbtn" data-goto="yearly">See the full ${incomeYear} review</button>`;

  $("#yPrev").addEventListener("click", () => { incomeYear--; renderIncome(); });
  $("#yNext").addEventListener("click", () => { incomeYear++; renderIncome(); });
  document.querySelectorAll("[data-month]").forEach((tr) =>
    tr.addEventListener("click", () => editIncome(tr.dataset.month)));
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.goto)));
  document.querySelectorAll("[data-chart-month]").forEach((b) =>
    b.addEventListener("click", () => monthBreakdown(b.dataset.chartMonth)));
}

/* Tap a bar in the year chart for that month's figures */
function monthBreakdown(key) {
  const inc = data.income[key];
  const incT = incTotalFor(key);
  const out = outgoingsTotalFor(key);
  const spent = spentTotal(key);
  openModal(monthLabel(key), `
    <div class="rows">
      <div class="row" style="cursor:default"><div class="grow"><div class="name">Sean → joint</div>
        <div class="meta">earned ${gbp(inc ? inc.sean : null, true)}</div></div>
        <div class="amt">${gbp(inc ? inc.seanT : null, true)}</div></div>
      <div class="row" style="cursor:default"><div class="grow"><div class="name">Martina → joint</div>
        <div class="meta">earned ${gbp(inc ? inc.martina : null, true)}</div></div>
        <div class="amt">${gbp(inc ? inc.martinaT : null, true)}</div></div>
      <div class="row" style="cursor:default"><div class="grow"><div class="name">Outgoings</div></div>
        <div class="amt">${gbp(out)}</div></div>
      <div class="row" style="cursor:default"><div class="grow"><div class="name">Logged spends</div></div>
        <div class="amt">${gbp(spent)}</div></div>
      <div class="row" style="cursor:default"><div class="grow"><div class="name"><b>Left over</b></div></div>
        <div class="amt ${incT - out < 0 ? "over" : ""}">${incT ? gbp(incT - out) : "—"}</div></div>
    </div>`,
    [
      { label: "Edit income", cls: "btn-ghost", fn: () => { closeModal(); editIncome(key); } },
      { label: "Close", cls: "btn-primary", fn: closeModal }
    ]);
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
      return section("out_" + g.id, esc(g.name), gbp(groupTotal(g.id)), `
        <div class="rows">${items.length ? items.map((o) => {
          const paidNow = isPaid(o.id);
          const actual = (data.paid[curMonthKey()] || {})[o.id];
          const dd = dueDayOf(o);
          const meta = [
            dd != null ? ordinal(dd) : "",
            o.freq && o.freq !== "monthly" ? FREQS[o.freq] : "",
            o.variable ? "varies" : "",
            o.account, o.notes
          ].filter(Boolean).map(esc).join(" · ");
          return `
          <div class="swipe-wrap">
            <div class="swipe-hint left">Paid</div>
            <div class="swipe-hint right">Edit</div>
            <div class="row acc ${paidNow ? "isPaid" : ""} swipeable" style="--acc:${g.color}" data-swipe="${o.id}">
              ${monthlyAmount(o) > 0
                ? `<input type="checkbox" class="paidbox" data-paid="${o.id}" ${paidNow ? "checked" : ""} aria-label="Paid this month">`
                : `<span class="paidbox-spacer"></span>`}
              <button class="rowbtn grow" data-edit-out="${o.id}">
                <div class="name">${esc(o.name)}</div>
                <div class="meta">${meta || "&nbsp;"}</div>
              </button>
              <div class="amt-col">
                <div class="amt ${monthlyAmount(o) ? "" : "muted"}">${monthlyAmount(o) ? gbp(o.amount) : "—"}</div>
                ${o.freq && o.freq !== "monthly" && o.amount
                  ? `<div class="amt-sub">${gbp(monthlyAmount(o))}/mo</div>` : ""}
                ${actual != null && actual !== monthlyAmount(o)
                  ? `<div class="amt-sub ${actual > monthlyAmount(o) ? "over" : "under"}">actual ${gbp(actual)}</div>` : ""}
              </div>
            </div>
          </div>`;
        }).join("") : `<div class="empty"><b>Nothing here yet</b>Add your first ${esc(g.name.toLowerCase())} bill below</div>`}
        </div>`,
        `<button class="addbtn" data-add-out="${g.id}">+ Add to ${esc(g.name)}</button>`);
    }).join("")}
    ${debtPaymentsTotal() ? section("out_debt", "Debt repayments", gbp(debtPaymentsTotal()), `
      <div class="rows">${data.debts.filter((d) => d.inOutgoings).map((d) => `
        <button class="row acc" style="--acc:var(--red)" data-goto="debts">
          <div class="grow"><div class="name">${esc(d.name)}</div>
          <div class="meta">monthly payment · ${esc(d.owner)}</div></div>
          <div class="amt">${gbp(latestPayment(d) || 0)}</div>
        </button>`).join("")}
      </div>`) : ""}`;

  document.querySelectorAll("[data-edit-out]").forEach((b) =>
    b.addEventListener("click", () => editOutgoing(b.dataset.editOut)));
  document.querySelectorAll("[data-add-out]").forEach((b) =>
    b.addEventListener("click", () => editOutgoing(null, b.dataset.addOut)));
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.goto)));
  document.querySelectorAll("[data-paid]").forEach((cb) =>
    cb.addEventListener("change", (e) => {
      const o = data.outgoings.find((x) => x.id === cb.dataset.paid);
      if (e.target.checked && o && o.variable) { askActual(o); return; }
      togglePaid(cb.dataset.paid); render();
    }));
  bindSwipe();
}

/* A bill flagged as variable asks what it really came to */
function askActual(o) {
  openModal(o.name + " — what did it come to?", `
    <div class="field"><label>Actual amount (£)</label>
      <input id="f_actual" type="number" step="0.01" inputmode="decimal" value="${o.amount ?? ""}">
      <div class="field-hint">Budgeted ${gbp(monthlyAmount(o))}. Leave as is if it was the same.</div>
    </div>`,
    [
      { label: "Cancel", cls: "btn-ghost", fn: () => { closeModal(); render(); } },
      { label: "Mark paid", cls: "btn-primary", fn: () => {
        const v = parseFloat($("#f_actual").value);
        togglePaid(o.id, isNaN(v) ? null : v);
        closeModal(); render();
      }}
    ]);
}

/* Swipe right to tick paid, left to edit */
function bindSwipe() {
  document.querySelectorAll(".swipeable").forEach((row) => {
    let x0 = null, dx = 0;
    row.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; dx = 0; }, { passive: true });
    row.addEventListener("touchmove", (e) => {
      if (x0 == null) return;
      dx = e.touches[0].clientX - x0;
      if (Math.abs(dx) > 8) row.style.transform = `translateX(${Math.max(-90, Math.min(90, dx))}px)`;
    }, { passive: true });
    row.addEventListener("touchend", () => {
      row.style.transform = "";
      const id = row.dataset.swipe;
      if (dx > 70) {
        const o = data.outgoings.find((x) => x.id === id);
        if (o && o.variable && !isPaid(id)) { askActual(o); }
        else { togglePaid(id); render(); }
      } else if (dx < -70) {
        editOutgoing(id);
      }
      x0 = null; dx = 0;
    });
  });
}

function editOutgoing(id, group) {
  const o = id ? data.outgoings.find((x) => x.id === id)
              : { group, name: "", amount: "", dueDay: "", account: "", notes: "", freq: "monthly", variable: false };
  const nonMonthly = o.freq && o.freq !== "monthly";
  openModal(id ? "Edit outgoing" : "Add outgoing", `
    <div class="field"><label>Name</label><input id="f_name" value="${esc(o.name)}"></div>
    <div class="field"><label>How often?</label><select id="f_freq">${Object.keys(FREQS).map((f) =>
      `<option value="${f}" ${f === (o.freq || "monthly") ? "selected" : ""}>${FREQS[f]}</option>`).join("")}</select></div>
    <div class="field-row">
      <div class="field"><label>Amount each time (£)</label><input id="f_amount" type="number" step="0.01" inputmode="decimal" value="${o.amount ?? ""}"></div>
      <div class="field" id="dueDayField" ${nonMonthly ? "hidden" : ""}>
        <label>Due day (1–31)</label><input id="f_due" type="number" min="1" max="31" inputmode="numeric" value="${o.dueDay ?? ""}"></div>
    </div>
    <div class="field" id="nextDueField" ${nonMonthly ? "" : "hidden"}>
      <label>Next payment date</label><input id="f_nextDue" type="date" value="${o.nextDue || ""}">
      <div class="field-hint">It'll repeat from this date, and we'll spread the cost across the months in between.</div>
    </div>
    <div class="field"><label>Group</label><select id="f_group">${GROUPS.map((g) =>
      `<option value="${g.id}" ${g.id === o.group ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select></div>
    <label class="check"><input type="checkbox" id="f_variable" ${o.variable ? "checked" : ""}>
      <span>Amount varies each time<small>Ticking it paid will ask what it actually came to</small></span></label>
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
        const freq = $("#f_freq").value;
        const nextDue = $("#f_nextDue").value;
        if (freq !== "monthly" && !nextDue) { alert("Give the next payment date for a " + FREQS[freq].toLowerCase() + " bill"); return; }
        const item = {
          id: id || uid(), group: $("#f_group").value, name, amount, freq,
          nextDue: freq === "monthly" ? null : nextDue,
          dueDay: isNaN(due) ? null : Math.min(31, Math.max(1, due)),
          variable: $("#f_variable").checked,
          account: $("#f_account").value.trim(), notes: $("#f_notes").value.trim()
        };
        if (id) data.outgoings = data.outgoings.map((x) => (x.id === id ? item : x));
        else data.outgoings.push(item);
        act((id ? "Edited" : "Added") + " outgoing " + name + " — " + gbp(amount));
        persist(); closeModal(); render();
      }}
    ]);
  $("#f_freq").addEventListener("change", (e) => {
    const nm = e.target.value !== "monthly";
    $("#nextDueField").hidden = !nm;
    $("#dueDayField").hidden = nm;
  });
}

/* ================= Debts ================= */
function renderDebts() {
  const total = totalDebt();
  const base = simulatePayoff(0, "avalanche");
  $("#view-debts").innerHTML = `
    <h1>Debts</h1>
    <div class="sub">Total outstanding: <b class="${total > 0 ? "" : "paidoff"}">${gbp(total)}</b></div>
    ${base && !base.impossible ? `
      <button class="planner-cta" id="openPlanner">
        <div><div class="planner-title">Debt-free ${monthsAway(base.months)}</div>
        <div class="planner-sub">at your current payments · tap to plan paying more</div></div>
        <span class="chev">›</span>
      </button>` : total > 0 ? `
      <button class="planner-cta" id="openPlanner">
        <div><div class="planner-title">Plan your payoff</div>
        <div class="planner-sub">add monthly payments to see when you'd be debt-free</div></div>
        <span class="chev">›</span>
      </button>` : ""}
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
            ${d.apr ? `<div class="debt-meta">${d.apr}% APR</div>` : ""}
            ${d.inOutgoings ? `<div class="debt-meta">in outgoings</div>` : ""}
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
  const pl = $("#openPlanner");
  if (pl) pl.addEventListener("click", openPlanner);
}

/* ---- Payoff planner ---- */
let planExtra = 100, planStrategy = "avalanche";
function openPlanner() {
  const draw = () => {
    const base = simulatePayoff(0, planStrategy);
    const plan = simulatePayoff(planExtra, planStrategy);
    const body = $("#planResult");
    if (!body) return;
    if (!plan || plan.impossible) {
      body.innerHTML = `<div class="empty"><b>Not enough going in</b>Set a monthly payment on your debts, or add extra above.</div>`;
      return;
    }
    const saved = base && !base.impossible ? base.months - plan.months : null;
    const intSaved = base && !base.impossible ? base.interest - plan.interest : null;
    body.innerHTML = `
      <div class="plan-headline">Debt-free ${monthsAway(plan.months)}</div>
      <div class="plan-sub">${plan.months} month${plan.months === 1 ? "" : "s"} · ${gbp(Math.round(plan.interest))} interest paid</div>
      ${saved > 0 ? `<div class="plan-win">${saved} month${saved === 1 ? "" : "s"} sooner${intSaved > 1 ? " · " + gbp(Math.round(intSaved)) + " less interest" : ""}</div>` : ""}
      <div class="rows" style="margin-top:12px">
        ${Object.keys(plan.cleared).sort((a, b) => plan.cleared[a] - plan.cleared[b]).map((n) => `
          <div class="row" style="cursor:default">
            <div class="grow"><div class="name">${esc(n)}</div></div>
            <div class="amt">${monthsAway(plan.cleared[n])}</div>
          </div>`).join("")}
      </div>`;
  };
  openModal("Payoff planner", `
    <div class="field"><label>Extra per month, on top of what you pay now</label>
      <input id="f_extra" type="number" step="10" inputmode="decimal" value="${planExtra}"></div>
    <div class="field"><label>Which debt gets the extra?</label>
      <div class="seg wide" id="stratSeg">
        <button data-s="avalanche" class="${planStrategy === "avalanche" ? "active" : ""}">Highest rate</button>
        <button data-s="snowball" class="${planStrategy === "snowball" ? "active" : ""}">Smallest first</button>
      </div>
      <div class="field-hint">Highest rate costs you least. Smallest first clears cards quicker, which some folk find more motivating.</div>
    </div>
    <div id="planResult"></div>`,
    [{ label: "Done", cls: "btn-primary", fn: closeModal }]);
  $("#f_extra").addEventListener("input", (e) => {
    planExtra = parseFloat(e.target.value) || 0; draw();
  });
  document.querySelectorAll("#stratSeg button").forEach((b) =>
    b.addEventListener("click", () => {
      planStrategy = b.dataset.s;
      document.querySelectorAll("#stratSeg button").forEach((x) => x.classList.toggle("active", x === b));
      draw();
    }));
  draw();
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
  const d = id ? data.debts.find((x) => x.id === id) : { name: "", owner: "", apr: "", inOutgoings: false };
  openModal(id ? "Edit debt" : "Add a debt", `
    <div class="field"><label>Name (e.g. "Sean Barclaycard")</label><input id="f_name" value="${esc(d.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Whose is it?</label><select id="f_owner">
        ${["Sean", "Martina", "Joint"].map((o) => `<option ${o === d.owner ? "selected" : ""}>${o}</option>`).join("")}
      </select></div>
      <div class="field"><label>Interest rate (% APR)</label>
        <input id="f_apr" type="number" step="0.1" inputmode="decimal" value="${d.apr ?? ""}"></div>
    </div>
    <label class="check"><input type="checkbox" id="f_inOut" ${d.inOutgoings ? "checked" : ""}>
      <span>Count the monthly payment as an outgoing<small>Keeps your disposable income honest</small></span></label>`,
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
        const apr = parseFloat($("#f_apr").value);
        const fields = { name, owner: $("#f_owner").value, apr: isNaN(apr) ? null : apr, inOutgoings: $("#f_inOut").checked };
        if (id) Object.assign(d, fields);
        else data.debts.push({ id: uid(), ...fields, history: [] });
        act((id ? "Edited" : "Added") + " debt " + name);
        persist(); closeModal(); render();
      }}
    ]);
}

/* ================= Yearly review ================= */
function renderYearly() {
  const rows = [];
  let totIn = 0, totOut = 0, totSpent = 0;
  for (let m = 1; m <= 12; m++) {
    const key = incomeYear + "-" + String(m).padStart(2, "0");
    const inc = incTotalFor(key);
    const out = data.income[key] || data.snapshots[key] ? outgoingsTotalFor(key) : 0;
    const spent = spentTotal(key);
    totIn += inc; totOut += (inc ? out : 0); totSpent += spent;
    rows.push({ m, key, inc, out: inc ? out : 0, spent, left: inc ? inc - out : 0 });
  }
  const debtStart = totalDebtAsOf(incomeYear + "-01");
  const debtEnd = totalDebtAsOf(incomeYear + "-12");
  const cleared = debtStart != null && debtEnd != null ? debtStart - debtEnd : null;
  const potsNow = data.pots.reduce((s, p) => s + (p.balance || 0), 0);

  $("#view-yearly").innerHTML = `
    <h1>${incomeYear} review</h1>
    <div class="sub">Everything for the year on one page</div>
    <div class="monthbar">
      <button id="ryPrev">‹</button><span class="cur">${incomeYear}</span><button id="ryNext">›</button>
    </div>
    <div class="hero">
      <div class="hero-label">Left over across ${incomeYear}</div>
      <!-- yearly view keeps the simpler "what was left after bills" framing -->
      <div class="hero-value ${totIn - totOut < 0 ? "neg" : ""}">${gbpHero(totIn - totOut)}</div>
      <div class="hero-stats">
        <div class="hstat"><div class="hs-label">Income</div><div class="hs-value">${gbp(totIn)}</div></div>
        <div class="hstat"><div class="hs-label">Outgoings</div><div class="hs-value">${gbp(totOut)}</div></div>
        <div class="hstat"><div class="hs-label">Logged spends</div><div class="hs-value">${gbp(totSpent)}</div></div>
      </div>
    </div>
    <div class="cards">
      <div class="card"><div class="label">Debt cleared</div>
        <div class="value ${cleared > 0 ? "pos" : cleared < 0 ? "neg" : ""}">${cleared == null ? "—" : gbp(Math.abs(cleared))}</div></div>
      <div class="card"><div class="label">In savings pots</div><div class="value pos">${gbp(potsNow)}</div></div>
    </div>
    ${section("ymonths", "Month by month", "", `
      <div class="inc-wrap"><table class="inc-table">
        <thead><tr><th>Month</th><th>In</th><th>Out</th><th>Spent</th><th>Left</th></tr></thead>
        <tbody>${rows.map((r) => `
          <tr>
            <td>${MONTH_NAMES[r.m - 1]}</td>
            <td class="${r.inc ? "" : "dim"}">${r.inc ? gbp(r.inc) : "—"}</td>
            <td class="${r.out ? "" : "dim"}">${r.out ? gbp(r.out) : "—"}</td>
            <td class="${r.spent ? "" : "dim"}">${r.spent ? gbp(r.spent) : "—"}</td>
            <td class="${r.inc ? (r.left >= 0 ? "tot" : "") : "dim"}">${r.inc ? gbp(r.left) : "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table></div>`)}`;

  $("#ryPrev").addEventListener("click", () => { incomeYear--; renderYearly(); });
  $("#ryNext").addEventListener("click", () => { incomeYear++; renderYearly(); });
}

/* ================= More (log + sync) ================= */
function renderMore() {
  const openNotes = data.notes.filter((n) => !n.done).length;
  $("#view-more").innerHTML = `
    <h1>More</h1>
    <div class="sub">Shared list, other views, backup and settings</div>

    ${section("notes", "Shared list", openNotes ? openNotes + " to do" : "", `
      <div class="rows">${data.notes.length ? data.notes.map((n) => `
        <div class="row">
          <input type="checkbox" class="paidbox" data-note="${n.id}" ${n.done ? "checked" : ""} aria-label="Done">
          <button class="rowbtn grow" data-edit-note="${n.id}">
            <div class="name ${n.done ? "struck" : ""}">${esc(n.text)}</div>
          </button>
        </div>`).join("") : `<div class="empty"><b>Nothing on the list</b>Jot down things like "cancel Netflix" so you both see them</div>`}
      </div>`,
      `<button class="addbtn" id="addNote">+ Add to the list</button>`)}

    <div class="section">
      <div class="section-head"><h2>Other views</h2></div>
      <div class="more-list">
        <button class="morebtn" data-goto="income"><span class="ico">${ICONS.wallet}</span>
          <div>Income<div class="desc">Month-by-month salaries and the year chart</div></div></button>
        <button class="morebtn" data-goto="yearly"><span class="ico">${ICONS.chart}</span>
          <div>Yearly review<div class="desc">The whole year on one page</div></div></button>
        <button class="morebtn" id="customiseHomeMore"><span class="ico">${ICONS.sliders}</span>
          <div>Customise Home<div class="desc">Choose what shows on this device's home page</div></div></button>
      </div>
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
          <div class="grow"><div class="name">Bill reminders</div>
          <div class="meta">A notification the day before a bill goes out</div></div>
          ${data.settings.remind && ("Notification" in window) && Notification.permission === "granted"
            ? `<span class="badge due">On</span>`
            : `<button class="minibtn" id="remindBtn">Turn on</button>`}
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
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showView(b.dataset.goto)));
  $("#customiseHomeMore").addEventListener("click", customiseHome);
  $("#addNote").addEventListener("click", () => editNote(null));
  document.querySelectorAll("[data-edit-note]").forEach((b) =>
    b.addEventListener("click", () => editNote(b.dataset.editNote)));
  document.querySelectorAll("[data-note]").forEach((cb) =>
    cb.addEventListener("change", () => {
      const n = data.notes.find((x) => x.id === cb.dataset.note);
      if (n) { n.done = cb.checked; buzz(); persist(); render(); }
    }));
  const rb = $("#remindBtn");
  if (rb) rb.addEventListener("click", enableReminders);
  $("#exportBtn").addEventListener("click", exportData);
  $("#importBtn").addEventListener("click", importData);
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset ALL data on this device back to the original spreadsheet numbers?")) return;
    data = migrate(defaultData()); persist(); render();
  });
}

function editNote(id) {
  const n = id ? data.notes.find((x) => x.id === id) : { text: "" };
  openModal(id ? "Edit item" : "Add to the list", `
    <div class="field"><label>What is it?</label><input id="f_text" value="${esc(n.text)}" placeholder="e.g. Cancel Netflix"></div>`,
    [
      ...(id ? [{ label: "Delete", cls: "btn-danger", fn: () => {
        data.notes = data.notes.filter((x) => x.id !== id);
        persist(); closeModal(); render();
      }}] : []),
      { label: "Cancel", cls: "btn-ghost", fn: closeModal },
      { label: "Save", cls: "btn-primary", fn: () => {
        const text = $("#f_text").value.trim();
        if (!text) { alert("Type something first"); return; }
        if (id) n.text = text;
        else data.notes.push({ id: uid(), text, done: false });
        act((id ? "Edited" : "Added") + " list item: " + text);
        persist(); closeModal(); render();
      }}
    ]);
}

function editLog(id) {
  const l = id ? data.log.find((x) => x.id === id) : { date: new Date().toISOString().slice(0, 10), name: "", amount: "", cat: "" };
  openModal(id ? "Edit expense" : "Log a spend", `
    <div class="field"><label>What was it?</label><input id="f_name" value="${esc(l.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Amount (£)</label><input id="f_amount" type="number" step="0.01" inputmode="decimal" value="${l.amount ?? ""}"></div>
      <div class="field"><label>Date</label><input id="f_date" type="date" value="${l.date}"></div>
    </div>
    <div class="field"><label>Category</label><select id="f_cat">
      <option value="">Uncategorised</option>
      ${data.cats.map((c) => `<option value="${c.id}" ${c.id === l.cat ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
    </select></div>`,
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
        const cat = $("#f_cat").value;
        if (!name || isNaN(amount) || !date) { alert("Name, amount and date are required"); return; }
        if (id) { l.name = name; l.amount = amount; l.date = date; l.cat = cat; }
        else data.log.push({ id: uid(), name, amount, date, cat });
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
  setTimeout(checkReminders, 2500);
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
