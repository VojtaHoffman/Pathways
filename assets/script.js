
const state = {
  raw: [],
  items: [],
  meta: {},
  detected: {},
  filters: {
    q: "",
    area: "All",
    industry: "All",
    paid: "All",
    sort: "relevance"
  }
};

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs={}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  });
  children.flat().forEach(c => node.append(c instanceof Node ? c : document.createTextNode(c)));
  return node;
}

async function loadData() {
  const res = await fetch("data/internships.json");
  const data = await res.json();
  state.meta = data.meta;
  state.detected = data.meta.detected || {};
  state.raw = data.items;
  state.items = [...state.raw];
  buildFilters();
  render();
}

function uniqueValues(field) {
  const vals = new Set();
  state.raw.forEach(r => {
    let v = (r[field] || r[`_${field}`] || "").toString().trim();
    if (!v) return;
    // Split on commas or slashes for multi-valued fields
    v.split(/[\/,]| and /i).map(s => s.trim()).filter(Boolean).forEach(s => vals.add(s));
  });
  return Array.from(vals).sort((a,b)=>a.localeCompare(b));
}

function buildFilters() {
  const areaField = state.detected.area_col ? state.detected.area_col : "_area";
  const industryField = state.detected.industry_col ? state.detected.industry_col : "_industry";
  const paidField = state.detected.paid_col ? state.detected.paid_col : "_paid";

  // Populate selects
  const areaSelect = $("#filter-area");
  const indSelect = $("#filter-industry");
  const paidSelect = $("#filter-paid");

  [areaSelect, indSelect, paidSelect].forEach(sel => sel.innerHTML = "");

  function addOptions(select, options) {
    const frag = document.createDocumentFragment();
    const first = el("option", {value: "All"}, "All");
    frag.append(first);
    options.forEach(o => frag.append(el("option", {value: o}, o)));
    select.append(frag);
  }

  addOptions(areaSelect, uniqueValues(areaField));
  addOptions(indSelect, uniqueValues(industryField));
  addOptions(paidSelect, uniqueValues(paidField));

  // Event listeners
  $("#search").addEventListener("input", (e)=>{ state.filters.q = e.target.value; render(); });
  areaSelect.addEventListener("change", (e)=>{ state.filters.area = e.target.value; render(); });
  indSelect.addEventListener("change", (e)=>{ state.filters.industry = e.target.value; render(); });
  paidSelect.addEventListener("change", (e)=>{ state.filters.paid = e.target.value; render(); });
  $("#sort").addEventListener("change", (e)=>{ state.filters.sort = e.target.value; render(); });
}

function matchesFilter(rec) {
  const q = state.filters.q.toLowerCase().trim();
  const area = state.filters.area;
  const industry = state.filters.industry;
  const paid = state.filters.paid;
  const areaField = state.detected.area_col || "_area";
  const industryField = state.detected.industry_col || "_industry";
  const paidField = state.detected.paid_col || "_paid";

  const text = Object.values(rec).join(" ").toLowerCase();

  const qOk = !q || text.includes(q);
  const areaOk = area === "All" || (rec[areaField] || rec._area || "").toString().toLowerCase().includes(area.toLowerCase());
  const indOk = industry === "All" || (rec[industryField] || rec._industry || "").toString().toLowerCase().includes(industry.toLowerCase());
  const paidOk = paid === "All" || (rec[paidField] || rec._paid || "").toString().toLowerCase().includes(paid.toLowerCase());

  return qOk && areaOk && indOk && paidOk;
}

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d)) return d;
  // try DD/MM/YYYY or similar
  const m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    const day = parseInt(m[1],10), mon = parseInt(m[2],10)-1, yr = parseInt(m[3].length===2 ? "20"+m[3] : m[3],10);
    const d2 = new Date(yr, mon, day);
    if (!isNaN(d2)) return d2;
  }
  return null;
}

function sortItems(items) {
  const sort = state.filters.sort;
  if (sort === "deadline-asc" || sort === "deadline-desc") {
    const dcol = state.detected.deadline_col || "_deadline";
    items.sort((a,b)=>{
      const da = parseDate(a[dcol]); const db = parseDate(b[dcol]);
      const na = da ? da.getTime() : Infinity;
      const nb = db ? db.getTime() : Infinity;
      return sort==="deadline-asc" ? na - nb : nb - na;
    });
  } else if (sort === "title-asc" || sort === "title-desc") {
    const tcol = state.detected.title_col || "_title";
    items.sort((a,b)=> (a[tcol]||"").localeCompare(b[tcol]||"") * (sort==="title-asc"?1:-1));
  } else {
    // relevance (no-op for now)
  }
  return items;
}

function render() {
  const wrap = $("#list");
  wrap.innerHTML = "";

  let items = state.raw.filter(matchesFilter);
  items = sortItems(items);

  if (!items.length) {
    wrap.append(el("div", {class: "empty"}, "No internships match your filters. Try broadening your search."));
    $("#count").textContent = "0";
    return;
  }

  const frag = document.createDocumentFragment();
  const tcol = state.detected.title_col || "_title";
  const ocol = state.detected.org_col || "_org";
  const acol = state.detected.area_col || "_area";
  const icol = state.detected.industry_col || "_industry";
  const dcol = state.detected.deadline_col || "_deadline";
  const durcol = state.detected.duration_col || "_duration";
  const pcol = state.detected.paid_col || "_paid";
  const lcol = state.detected.link_col || "_link";
  const desc = state.detected.desc_col || "_desc";

  items.forEach(rec => {
    const chips = [];
    const maybe = (label, val) => {
      const v = (val || "").toString().trim();
      if (!v) return null;
      return el("span", {class: "chip", title: label}, `${label}: ${v}`);
    };
    [maybe("Area", rec[acol]), maybe("Industry", rec[icol]), maybe("Deadline", rec[dcol]), maybe("Duration", rec[durcol]), maybe("Paid", rec[pcol])].forEach(c => c && chips.push(c));

    const link = (rec[lcol] || "").toString().trim();
    const hasLink = link && /^https?:\/\//i.test(link);

    const item = el("article", {class: "item", role: "article"},
      el("h4", {}, rec[tcol] || rec[ocol] || "Internship"),
      el("div", {class: "meta"}, 
        el("span", {}, rec[ocol] || "Student Nonprofit Partner")
      ),
      el("div", {class: "chips"}, chips),
      el("p", {class: "desc"}, (rec[desc] || "").toString().slice(0, 240)),
      el("div", {class: "actions"},
        hasLink ? el("a", {href: link, target: "_blank", rel: "noopener", class: "button primary"}, "Apply / Learn more") : el("span", {class: "kbd"}, "No link provided")
      )
    );
    frag.append(item);
  });

  wrap.append(frag);
  $("#count").textContent = String(items.length);
}

document.addEventListener("DOMContentLoaded", loadData);
