const DEV = { name: "Your Name", email: "you@example.com" }; // edit these two lines
document.getElementById("devname").textContent = DEV.name;
document.getElementById("devmail").href =
  "mailto:" + DEV.email + "?subject=" + encodeURIComponent("Booking site quote");

const SV = [
  { id: 1, n: "Classic haircut", m: 30, p: 30 },
  { id: 2, n: "Skin fade", m: 45, p: 38 },
  { id: 3, n: "Beard trim and shape", m: 30, p: 22 },
  { id: 4, n: "Hot towel shave", m: 30, p: 30 },
  { id: 5, n: "Haircut and beard combo", m: 60, p: 50 },
  { id: 6, n: "Kids cut (under 12)", m: 30, p: 22 },
  { id: 7, n: "Wash and style", m: 15, p: 12 },
];
const BB = [
  {
    id: "m",
    n: "Marcus",
    r: "Fades and tapers",
    b: "10 years behind the chair. Clean lines, no rush.",
  },
  {
    id: "d",
    n: "Dee",
    r: "Classic cuts and shaves",
    b: "Old-school scissor work and the best hot towel shave in town.",
  },
  {
    id: "j",
    n: "Joel",
    r: "Beards and kids",
    b: "Patient with little ones and picky about every beard edge.",
  },
];
const SLOTS = 18; // 9:00 am to 6:00 pm in 30-minute steps
const S = { sel: new Set(), barber: "any", date: null, time: null };
let booked = new Set();
try {
  booked = new Set(JSON.parse(localStorage.getItem("mb-booked") || "[]"));
} catch (e) {}
const saveB = () => {
  try {
    localStorage.setItem("mb-booked", JSON.stringify([...booked]));
  } catch (e) {}
};
const $id = (i) => document.getElementById(i);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const hash = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};
const busy = (b, d, i) => hash(b + d + i) % 100 < 28; // pretend regulars already booked some slots
const free = (b, d, i) => !busy(b, d, i) && !booked.has(b + "|" + d + "|" + i);
const T = (i) => {
  const m = 540 + i * 30,
    h = Math.floor(m / 60);
  return (h % 12 || 12) + ":" + (m % 60 ? "30" : "00") + (h < 12 ? " am" : " pm");
};
const iso = (d) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");
const label = (d) =>
  d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const money = (n) => "$" + n;

function days() {
  const o = [];
  for (let k = 0; o.length < 7; k++) {
    const d = new Date();
    d.setDate(d.getDate() + k);
    if (d.getDay() !== 0) o.push(d);
  }
  return o;
}
function totals() {
  let m = 0,
    p = 0;
  S.sel.forEach((id) => {
    const s = SV.find((x) => x.id === id);
    m += s.m;
    p += s.p;
  });
  return { m, p, n: Math.max(1, Math.ceil(m / 30)) };
}
function who(d, i, n) {
  const list = S.barber === "any" ? BB.map((b) => b.id) : [S.barber];
  return list.find((b) => {
    for (let k = 0; k < n; k++) if (!free(b, d, i + k)) return false;
    return true;
  });
}
const past = (d, i) => {
  const n = new Date();
  return d === iso(n) && 540 + i * 30 <= n.getHours() * 60 + n.getMinutes() + 30;
};

function render() {
  const t = totals();
  $id("svc").innerHTML = SV.map(
    (s) =>
      `<button type="button" class="opt svc" aria-pressed="${S.sel.has(s.id)}" data-s="${s.id}">${s.n}<small>${s.m} min, ${money(s.p)}</small></button>`,
  ).join("");
  $id("bar").innerHTML = [{ id: "any", n: "Any barber", r: "First available" }, ...BB]
    .map(
      (b) =>
        `<button type="button" class="opt" aria-pressed="${S.barber === b.id}" data-b="${b.id}">${b.n}<small>${b.r}</small></button>`,
    )
    .join("");
  $id("day").innerHTML = days()
    .map(
      (d) =>
        `<button type="button" class="opt" aria-pressed="${S.date === iso(d)}" data-d="${iso(d)}">${label(d)}</button>`,
    )
    .join("");
  let html = "";
  if (S.date)
    for (let i = 0; i <= SLOTS - t.n; i++) {
      const ok = !past(S.date, i) && !!who(S.date, i, t.n);
      html += `<button type="button" class="opt slot" aria-pressed="${S.time === i}" data-t="${i}" ${ok ? "" : "disabled"}>${T(i)}</button>`;
    }
  $id("slots").innerHTML =
    html || (S.date ? "" : `<p class="mut">Choose a day to see open times.</p>`);
  const b = S.barber === "any" ? "Any barber" : BB.find((x) => x.id === S.barber).n;
  $id("sum").innerHTML =
    (S.sel.size
      ? [...S.sel]
          .map((id) => {
            const s = SV.find((x) => x.id === id);
            return `<div class="sl"><span>${s.n}</span><span>${money(s.p)}</span></div>`;
          })
          .join("")
      : `<p class="mut">No services chosen yet.</p>`) +
    `<div class="sl"><span>Barber</span><span>${b}</span></div><div class="sl"><span>When</span><span>${S.time !== null ? label(new Date(S.date + "T12:00")) + ", " + T(S.time) : "Not chosen"}</span></div><div class="sl"><span>Time needed</span><span>${t.m} min</span></div>` +
    `<div class="tot"><span>Total</span><span>${money(t.p)}</span></div>`;
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const d = b.dataset;
  $id("msg").textContent = "";
  if (d.s) {
    const id = +d.s;
    S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id);
    S.time = null;
  } else if (d.b) {
    S.barber = d.b;
    S.time = null;
  } else if (d.d) {
    S.date = d.d;
    S.time = null;
  } else if (d.t) S.time = +d.t;
  else return;
  render();
});
$id("f").onsubmit = (e) => {
  e.preventDefault();
  const msg = (m) => {
    $id("msg").textContent = m;
  };
  const t = totals();
  if (!S.sel.size) return msg("Choose at least one service.");
  if (S.time === null) return msg("Pick a day and a time.");
  const barber = who(S.date, S.time, t.n);
  if (!barber) {
    S.time = null;
    render();
    return msg("That time was just taken. Pick another.");
  }
  for (let k = 0; k < t.n; k++) booked.add(barber + "|" + S.date + "|" + (S.time + k));
  saveB();
  $id("done").innerHTML =
    `<div class="ok" role="status">You’re booked, ${esc($id("nm").value)}! ${BB.find((x) => x.id === barber).n} will see you on ${label(new Date(S.date + "T12:00"))} at ${T(S.time)}. Total ${money(t.p)}, paid in the shop. (Demo: no real booking was made.)</div>`;
  S.sel.clear();
  S.time = null;
  S.barber = "any";
  e.target.reset();
  render();
  scrollTo({ top: $id("book").offsetTop - 70 });
};
$id("team-grid").innerHTML = BB.map(
  (b) =>
    `<div class="card"><div class="av" aria-hidden="true">${b.n[0]}</div><h3>${b.n}</h3><p class="mut" style="margin:2px 0 8px">${b.r}</p><p style="margin:0">${b.b}</p></div>`,
).join("");
render();