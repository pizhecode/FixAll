/* ============================================================
   万物可修 · 交互逻辑  app.js
   ============================================================ */
(function(){
"use strict";

/* ---------------- 基础工具 ---------------- */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// 数据内置可信，仅放行 <b> 标签
const rich = s => esc(s).replace(/&lt;b&gt;/g, "<b>").replace(/&lt;\/b&gt;/g, "</b>");

/* ---------------- 图解 ---------------- */
// 图解是内置 SVG，位置与内容都在代码里定死，按原样插入即可
function diagramFigures(ids, opts){
  opts = opts || {};
  return (ids || []).map((id, i) => {
    const d = DIAGRAMS[id];
    if (!d || !d.svg) return "";
    return '<figure class="diagram">' +
             '<figcaption class="diagram-title">' +
               (opts.numbered === false ? "" : '<span class="dgm-no">' + (i + 1) + "</span>") +
               esc(d.t) + "</figcaption>" +
             '<div class="diagram-canvas">' + d.svg + "</div>" +
             (d.cap ? '<div class="diagram-cap">' + rich(d.cap) + "</div>" : "") +
           "</figure>";
  }).join("");
}

// 图题与图注参与搜索（去掉 <b> 标记再匹配）
function diagramText(e){
  return (e.diagrams || []).map(id => {
    const d = DIAGRAMS[id];
    return d ? d.t + " " + String(d.cap || "").replace(/<[^>]*>/g, " ") : "";
  }).join(" ");
}

const LEVEL = {
  self:  { t: "可自修",   cls: "self"  },
  mixed: { t: "部分自修", cls: "mixed" },
  pro:   { t: "需专业",   cls: "pro"   }
};

const KEY = "wkwx.repairkb.v1";
const DATA = window.KB_DATA || [];
const GROUPS = window.KB_GROUPS || [];
const DIAGRAMS = window.KB_DIAGRAMS || {};
const DGM_SECTIONS = window.KB_DIAGRAM_SECTIONS || [];

/* ---------------- 持久化状态 ---------------- */
const store = { fav: [], records: [], done: {} };

function loadStore(){
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (Array.isArray(o.fav)) store.fav = o.fav;
      if (Array.isArray(o.records)) store.records = o.records;
      if (o.done && typeof o.done === "object") store.done = o.done;
    }
  } catch (e) { /* localStorage 不可用时降级为内存态 */ }
}
function saveStore(){
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
}

/* ---------------- 视图状态 ---------------- */
const state = {
  mode: "browse",          // browse | diag | fav | records
  cat: null,               // 当前设备分类
  q: "",
  detailId: null,
  levels: { self: true, mixed: true, pro: true },
  collapsed: {},           // 分类折叠
  diag: { device: null, sym: null, open: {} }
};

/* ---------------- 数据索引 ---------------- */
const byId = {};
DATA.forEach(e => { byId[e.id] = e; });

function catCount(cat){ return DATA.filter(e => e.cat === cat).length; }
function groupCount(g){ return g.cats.reduce((n, c) => n + catCount(c), 0); }
function levelAllowed(e){ return state.levels[e.level] !== false; }

function searchHit(e, q){
  if (!q) return true;
  const k = q.toLowerCase();
  const hay = [e.title, e.sym, e.cat, e.group, e.brief, (e.alias || []).join(" "),
               (e.causes || []).map(c => c.n + c.why).join(" "),
               (e.steps || []).join(" "),
               (e.tools || []).join(" "),
               (e.checks || []).map(c => c.n + c.how + c.ok).join(" "),
               diagramText(e),
               (e.stop || ""), (e.tip || ""), (e.cost || "")]
              .join(" ").toLowerCase();
  return hay.indexOf(k) >= 0;
}

function currentList(){
  let list = DATA.slice();
  if (state.mode === "fav") {
    list = list.filter(e => store.fav.indexOf(e.id) >= 0);
  } else if (state.cat) {
    list = list.filter(e => e.cat === state.cat);
  }
  if (state.q) list = list.filter(e => searchHit(e, state.q));
  list = list.filter(levelAllowed);
  // 收藏置顶
  list.sort((a, b) => {
    const fa = store.fav.indexOf(a.id) >= 0 ? 0 : 1;
    const fb = store.fav.indexOf(b.id) >= 0 ? 0 : 1;
    return fa - fb;
  });
  return list;
}

/* ---------------- 高亮 ---------------- */
// 带 <b> 标记的文本也能安全高亮：先把 <b> 抽成占位符，转义后再还原
function hl(text, q){
  let s = String(text == null ? "" : text);
  const slots = [];
  s = s.replace(/<\/?b>/g, function(m){ slots.push(m); return "\u0001" + (slots.length - 1) + "\u0001"; });
  let safe = esc(s);
  if (q) {
    const k = esc(q);
    if (k) {
      const re = new RegExp("(" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      safe = safe.replace(re, "<mark>$1</mark>");
    }
  }
  return safe.replace(/\u0001(\d+)\u0001/g, function(m, i){ return slots[+i]; });
}

/* ---------------- 渲染：分类树 ---------------- */
function renderTree(){
  const wrap = $("#catTree");
  let html = '<button class="cat-item' + (state.mode === "browse" && !state.cat && !state.q ? " active" : "") +
             '" data-cat="" style="padding-left:10px">全部条目<span class="cnt">' + DATA.length + "</span></button>";

  GROUPS.forEach(g => {
    const cats = g.cats.filter(c => catCount(c) > 0);
    if (!cats.length) return;
    const collapsed = !!state.collapsed[g.id];
    html += '<div class="cat-group' + (collapsed ? " collapsed" : "") + '" data-gid="' + g.id + '">';
    html += '<button class="cat-group-head" type="button" data-toggle="' + g.id + '">' +
            '<span class="caret">▼</span><span>' + esc(g.name) + '</span>' +
            '<span class="cnt">' + groupCount(g) + "</span></button>";
    html += '<div class="cat-group-items">';
    cats.forEach(c => {
      const active = state.mode === "browse" && state.cat === c;
      html += '<button class="cat-item' + (active ? " active" : "") + '" data-cat="' + esc(c) + '">' +
              esc(c) + '<span class="cnt">' + catCount(c) + "</span></button>";
    });
    html += "</div></div>";
  });
  wrap.innerHTML = html;
}

/* ---------------- 渲染：列表 ---------------- */
function cardHTML(e){
  const lv = LEVEL[e.level] || LEVEL.self;
  const starred = store.fav.indexOf(e.id) >= 0;
  const q = state.q;
  let desc = e.brief || "";
  if (desc.length > 96) desc = desc.slice(0, 96) + "…";
  return '' +
    '<article class="card" data-id="' + e.id + '">' +
      '<button class="card-star' + (starred ? " on" : "") + '" data-star="' + e.id + '" title="收藏">★</button>' +
      '<div class="card-top">' +
        '<span class="card-title">' + hl(e.title, q) + "</span>" +
        '<span class="card-cat">' + hl(e.cat, q) + "</span>" +
      "</div>" +
      '<div class="card-desc">' + hl(desc, q) + "</div>" +
      '<div class="card-foot">' +
        '<span class="badge ' + lv.cls + '">' + lv.t + "</span>" +
        (e.risks || []).slice(0, 2).map(r => '<span class="badge risk">' + esc(r) + "</span>").join("") +
        '<span class="badge tag">' + esc(e.sym) + "</span>" +
      "</div>" +
    "</article>";
}

function renderList(){
  const list = currentList();
  const title = $("#listTitle"), sub = $("#listSub"), area = $("#listArea");

  if (state.mode === "fav") {
    title.textContent = "我的收藏";
    sub.textContent = list.length ? "共 " + list.length + " 条，收藏的条目会在列表里置顶显示。" : "";
  } else if (state.q) {
    title.textContent = "搜索：「" + state.q + "」";
    sub.textContent = list.length ? "命中 " + list.length + " 条" : "";
  } else if (state.cat) {
    title.textContent = state.cat;
    sub.textContent = list.length ? "共 " + list.length + " 条维修方案" : "";
  } else {
    title.textContent = "全部维修条目";
    sub.textContent = "共 " + DATA.length + " 条，覆盖 " + new Set(DATA.map(e => e.cat)).size + " 种设备与物件。";
  }

  if (!list.length) {
    area.innerHTML = '<div class="empty"><div class="big">∅</div>' +
      (state.mode === "fav" ? "还没有收藏。在任意条目上点右上角的 ★ 就能收进来。"
        : state.q ? "没有匹配的条目。换个说法试试，比如搜「漏水」「不打火」「跑不远」。"
        : "这一分类下的条目都被筛选条件排除了。") + "</div>";
    return;
  }
  area.innerHTML = list.map(cardHTML).join("");
}

/* ---------------- 渲染：详情 ---------------- */
function renderDetail(id){
  const e = byId[id];
  const view = $("#view-detail");
  if (!e) { view.innerHTML = '<div class="empty">条目不存在</div>'; return; }

  const lv = LEVEL[e.level] || LEVEL.self;
  const starred = store.fav.indexOf(e.id) >= 0;
  const done = store.done[e.id] || [];
  const q = state.q;

  let h = "";
  let sec = 0;
  const num = () => '<span class="n">' + (++sec) + "</span>";

  /* 头部 */
  h += '<div class="detail-head">';
  h += '<div class="detail-nav">' +
       '<button class="back-btn" data-act="back">← 返回列表</button>' +
       "</div>";
  h += "<h1>" + hl(e.title, q) + "</h1>";
  h += '<div class="detail-meta">' +
       '<span class="badge ' + lv.cls + '">' + lv.t + "</span>" +
       '<span class="badge tag">' + esc(e.group) + " · " + esc(e.cat) + "</span>" +
       '<span class="badge tag">故障现象：' + esc(e.sym) + "</span>" +
       (e.risks || []).map(r => '<span class="badge risk">⚠ ' + esc(r) + "</span>").join("") +
       "</div>";
  h += "</div>";

  /* 操作区 */
  h += '<div class="detail-actions">' +
       '<button class="primary-btn' + (starred ? " soft" : "") + '" data-act="fav" data-id="' + e.id + '">' +
         (starred ? "★ 已收藏（点击取消）" : "☆ 收藏这条") + "</button>" +
       '<button class="primary-btn soft" data-act="newrec" data-id="' + e.id + '">+ 记一笔维修记录</button>' +
       (done.some(Boolean) ? '<button class="danger-btn" data-act="cleardone" data-id="' + e.id + '">清除排查进度</button>' : "") +
       "</div>";

  /* 一句话说明 */
  if (e.brief) {
    h += '<div class="panel"><div class="alert info"><span class="ico">💡</span><span>' + rich(e.brief) + "</span></div></div>";
  }

  /* 可能原因 */
  h += '<div class="panel"><h2>' + num() + '可能的原因（按可能性排序）</h2><div class="cause-list">';
  (e.causes || []).forEach((c, i) => {
    h += '<div class="cause-row' + (c.hot ? " hot" : "") + '">' +
         '<div class="cause-rank">' + (i + 1) + "</div>" +
         '<div class="cause-body"><div class="cause-name">' + hl(c.n, q) + "</div>" +
         '<div class="cause-why">' + hl(c.why, q) + "</div></div>" +
         (c.hot ? '<span class="cause-flag">最常见</span>' : "") +
         "</div>";
  });
  h += "</div></div>";

  /* 图解 */
  const figs = diagramFigures(e.diagrams);
  if (figs) {
    h += '<div class="panel"><h2>' + num() + "图解（" + (e.diagrams || []).length + " 张）</h2>" +
         '<div class="diagrams">' + figs + "</div>" +
         (e.id !== "teardown-basics"
           ? '<div class="dgm-more"><button class="link-btn" data-act="goto" data-id="teardown-basics">' +
             "拆机通用手册：工具清单、拆解顺序、卡扣手法、安全底线 →</button></div>"
           : "") +
         "</div>";
  }

  /* 排查步骤 */
  h += '<div class="panel"><h2>' + num() + '排查与处理步骤</h2><div class="steps">';
  (e.steps || []).forEach((s, i) => {
    const checked = done[i] ? " checked" : "";
    h += '<div class="step' + (done[i] ? " done" : "") + '">' +
         '<input type="checkbox" class="step-box" data-step="' + i + '" data-eid="' + e.id + '"' + checked + ">" +
         '<div class="step-num">' + (i + 1) + "</div>" +
         '<div class="step-text">' + hl(s, q) + "</div>" +
         "</div>";
  });
  h += "</div></div>";

  /* 关键检测项 */
  if ((e.checks || []).length) {
    h += '<div class="panel"><h2>' + num() + '关键检测项</h2>' +
         '<table class="check-table"><thead><tr><th>检查什么</th><th>怎么查</th><th>正常应该是</th></tr></thead><tbody>';
    e.checks.forEach(c => {
      h += "<tr><td>" + hl(c.n, q) + "</td><td>" + hl(c.how, q) + "</td><td>" + hl(c.ok, q) + "</td></tr>";
    });
    h += "</tbody></table></div>";
  }

  /* 工具 */
  if ((e.tools || []).length) {
    h += '<div class="panel"><h2>' + num() + '需要的工具</h2><div class="kv">' +
         e.tools.map(t => '<span class="badge tag">' + esc(t) + "</span>").join("") + "</div></div>";
  }

  /* 停手条件 */
  if (e.stop) {
    h += '<div class="panel"><h2>' + num() + '什么时候必须停手</h2>' +
         '<div class="alert danger"><span class="ico">⛔</span><span>' + rich(e.stop) + "</span></div></div>";
  }

  /* 费用 */
  if (e.cost) {
    h += '<div class="panel"><h2>' + num() + '费用参考</h2>' +
         '<div class="alert warn"><span class="ico">¥</span><span>' + rich(e.cost) + "</span></div></div>";
  }

  /* 提示 */
  if (e.tip) {
    h += '<div class="panel"><div class="alert info"><span class="ico">✦</span><span>经验提示：' + rich(e.tip) + "</span></div></div>";
  }

  view.innerHTML = h;
}

/* ---------------- 渲染：自诊向导 ---------------- */
function renderDiag(){
  // 第一步：设备
  const devices = [];
  GROUPS.forEach(g => g.cats.forEach(c => { if (catCount(c) > 0) devices.push(c); }));
  $("#diagDevices").innerHTML = devices.map(d =>
    '<button class="pick' + (state.diag.device === d ? " on" : "") + '" data-dev="' + esc(d) + '">' + esc(d) + "</button>"
  ).join("");

  // 第二步：现象
  const symBox = $("#diagSymptoms");
  if (!state.diag.device) {
    symBox.innerHTML = '<span class="hint">先选设备</span>';
  } else {
    const items = DATA.filter(e => e.cat === state.diag.device);
    symBox.innerHTML = items.map(e =>
      '<button class="pick' + (state.diag.sym === e.sym ? " on" : "") + '" data-sym="' + esc(e.sym) + '">' + esc(e.sym) + "</button>"
    ).join("");
  }

  // 第三步：结果
  const box = $("#diagResult");
  if (!state.diag.device || !state.diag.sym) {
    box.innerHTML = '<span class="hint">选完现象后，这里会给出按可能性排序的排查顺序。</span>';
    return;
  }
  const e = DATA.filter(x => x.cat === state.diag.device && x.sym === state.diag.sym)[0];
  if (!e) { box.innerHTML = '<span class="hint">没找到对应条目。</span>'; return; }

  const lv = LEVEL[e.level] || LEVEL.self;
  const done = store.done[e.id] || [];

  let h = "";
  h += '<div class="detail-meta" style="margin-bottom:12px">' +
       '<span class="badge ' + lv.cls + '">' + lv.t + "</span>" +
       (e.risks || []).map(r => '<span class="badge risk">⚠ ' + esc(r) + "</span>").join("") +
       '<span class="badge tag">共 ' + e.causes.length + " 个可能原因 · " + e.steps.length + " 步排查</span>" +
       "</div>";
  if (e.brief) {
    h += '<div class="alert info" style="margin-bottom:13px"><span class="ico">💡</span><span>' + rich(e.brief) + "</span></div>";
  }

  // 原因（可展开）
  h += '<div class="diag-causes">';
  e.causes.forEach((c, i) => {
    const key = e.id + ":" + i;
    const open = !!state.diag.open[key];
    h += '<div class="diag-cause' + (open ? " open" : "") + '">' +
           '<div class="diag-cause-head" data-open="' + key + '">' +
             '<div class="dc-rank">' + (i + 1) + "</div>" +
             '<div class="dc-title">' + esc(c.n) + "</div>" +
             '<div class="dc-chance">' + (c.hot ? "最常见" : "可能性递减") + "</div>" +
             '<div class="dc-arrow">▶</div>' +
           "</div>" +
           '<div class="diag-cause-body">' +
             "<div>" + esc(c.why) + "</div>" +
             '<div class="dc-how"><strong>怎么处理：</strong>按下面清单从上往下做，' +
               (c.hot ? "这一条排在第一，通常就是它。" : "排在第 " + (i + 1) + " 位，前面几条排除后再重点看这条。") +
             "</div>" +
           "</div>" +
         "</div>";
  });
  h += "</div>";

  // 图解
  const figs = diagramFigures(e.diagrams, { numbered: false });
  if (figs) {
    h += '<div class="ds-label" style="margin-top:18px">图解（' + (e.diagrams || []).length + ' 张）</div><div class="diagrams">' + figs + "</div>";
  }

  // 排查清单
  h += '<div style="margin-top:16px"><div class="ds-label">排查与处理清单（做完一步勾一步）</div><div class="steps">';
  e.steps.forEach((s, i) => {
    h += '<div class="step' + (done[i] ? " done" : "") + '">' +
         '<input type="checkbox" class="step-box" data-step="' + i + '" data-eid="' + e.id + '"' + (done[i] ? " checked" : "") + ">" +
         '<div class="step-num">' + (i + 1) + "</div>" +
         '<div class="step-text">' + rich(s) + "</div>" +
         "</div>";
  });
  h += "</div></div>";

  if (e.stop) {
    h += '<div class="alert danger" style="margin-top:14px"><span class="ico">⛔</span><span>' + rich(e.stop) + "</span></div>";
  }

  h += '<div style="margin-top:14px;display:flex;gap:9px;flex-wrap:wrap">' +
       '<button class="primary-btn" data-act="goto" data-id="' + e.id + '">打开完整详情（含检测项、工具、费用）</button>' +
       '<button class="primary-btn soft" data-act="fav" data-id="' + e.id + '">' +
         (store.fav.indexOf(e.id) >= 0 ? "★ 已收藏" : "☆ 收藏这条") + "</button>" +
       "</div>";

  box.innerHTML = h;
}

/* ---------------- 渲染：图解速查 ---------------- */
function renderDiagrams(){
  const area = $("#dgmArea");
  if (!area) return;

  // 每张图被哪些条目引用
  const refBy = {};
  DATA.forEach(e => (e.diagrams || []).forEach(id => {
    if (!refBy[id]) refBy[id] = [];
    refBy[id].push(e);
  }));

  const total = Object.keys(DIAGRAMS).length;
  const sub = $("#dgmSub");
  if (sub) sub.textContent = "全部 " + total + " 张矢量图解，按板块归集。图下面的标签可以直接跳到对应的维修条目。";

  let h = '<div class="dgm-nav">';
  DGM_SECTIONS.forEach(s => {
    h += '<button class="dgm-nav-btn" data-jump="' + esc(s.id) + '">' + esc(s.name) +
         "<em>" + s.ids.length + "</em></button>";
  });
  h += "</div>";

  DGM_SECTIONS.forEach(sec => {
    const figs = sec.ids.map((id, i) => {
      const d = DIAGRAMS[id];
      if (!d || !d.svg) return "";
      const refs = refBy[id] || [];
      const shown = refs.slice(0, 6);
      const refHtml = shown.length
        ? shown.map(e => '<button class="ref-chip" data-openentry="' + e.id + '">' + esc(e.cat) + "</button>").join("") +
          (refs.length > shown.length ? '<span class="dgm-refs-more">等 ' + refs.length + " 条</span>" : "")
        : '<span class="dgm-refs-more">通用图解 · 多数条目都会用到</span>';
      return '<figure class="diagram" id="dgm-' + esc(id) + '">' +
        '<figcaption class="diagram-title"><span class="dgm-no">' + (i + 1) + "</span>" + esc(d.t) + "</figcaption>" +
        '<div class="diagram-canvas">' + d.svg + "</div>" +
        (d.cap ? '<div class="diagram-cap">' + rich(d.cap) + "</div>" : "") +
        '<div class="dgm-refs"><span class="dgm-refs-label">相关条目</span>' + refHtml + "</div>" +
        "</figure>";
    }).join("");

    h += '<section class="dgm-sec" id="dgm-sec-' + esc(sec.id) + '">' +
           '<div class="dgm-sec-head"><h2>' + esc(sec.name) + "</h2>" +
             '<span class="dgm-sec-cnt">' + sec.ids.length + " 张</span></div>" +
           '<p class="dgm-sec-desc">' + esc(sec.desc) + "</p>" +
           '<div class="diagrams">' + figs + "</div>" +
         "</section>";
  });

  area.innerHTML = h;
}

/* ---------------- 渲染：维修记录 ---------------- */
function fmtMoney(n){
  const v = Number(n || 0);
  return v ? "¥ " + v.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) : "¥ 0";
}

function renderRecords(){
  const area = $("#recList");
  const list = store.records.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const total = list.reduce((n, r) => n + Number(r.cost || 0), 0);
  $("#recSummary").textContent = list.length
    ? "共 " + list.length + " 条记录，累计花费 " + fmtMoney(total) + "。"
    : "还没有记录。修过的东西顺手记一笔，以后翻得着。";

  if (!list.length) {
    area.innerHTML = '<div class="empty"><div class="big">📝</div>还没有维修记录。点上面的「+ 新增记录」，' +
      "或者在任意维修条目的详情页点「+ 记一笔维修记录」。</div>";
    return;
  }

  area.innerHTML = list.map(r => {
    const rel = r.entryId && byId[r.entryId] ? byId[r.entryId] : null;
    let body = "";
    if (r.fault) body += "故障：" + r.fault + "\n";
    if (r.fix) body += "处理：" + r.fix + "\n";
    if (r.parts) body += "换件：" + r.parts + "\n";
    if (r.note) body += "备注：" + r.note;
    return '<div class="rec-card">' +
      '<div class="rec-head">' +
        '<span class="rec-date">' + esc(r.date || "未填日期") + "</span>" +
        '<span class="rec-title">' + esc(r.item || "未命名") + "</span>" +
        (rel ? '<span class="badge tag">' + esc(rel.cat) + "</span>" : "") +
        '<span class="rec-cost">' + fmtMoney(r.cost) + "</span>" +
      "</div>" +
      (body ? '<div class="rec-body">' + esc(body.trim()) + "</div>" : "") +
      '<div class="rec-actions">' +
        (rel ? '<button data-openentry="' + rel.id + '">查看对应方案</button>' : "") +
        '<button data-editrec="' + r.id + '">编辑</button>' +
        '<button class="del" data-delrec="' + r.id + '">删除</button>' +
      "</div>" +
    "</div>";
  }).join("");
}

/* ---------------- 记录弹窗 ---------------- */
function todayStr(){
  const d = new Date();
  const p = n => (n < 10 ? "0" : "") + n;
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function openModal(html){
  $("#modalRoot").innerHTML = '<div class="modal-mask" data-mask>' + html + "</div>";
}
function closeModal(){ $("#modalRoot").innerHTML = ""; }

function openRecordModal(recId, entryId){
  const rec = recId ? store.records.filter(r => r.id === recId)[0] : null;
  const e = entryId ? byId[entryId] : null;

  const val = k => esc(rec && rec[k] != null ? rec[k] : "");
  const defDate = rec ? rec.date : todayStr();
  const defItem = rec ? (rec.item || "") : (e ? e.cat : "");
  const defFault = rec ? (rec.fault || "") : (e ? e.sym : "");
  const eid = rec ? (rec.entryId || "") : (entryId || "");

  openModal(
    '<div class="modal">' +
      '<div class="modal-head"><h3>' + (rec ? "编辑维修记录" : "新增维修记录") + "</h3>" +
        '<button class="modal-close" data-close>×</button></div>' +
      '<div class="modal-body">' +
        '<div class="field-row">' +
          '<div class="field"><label>日期</label><input type="date" id="mDate" value="' + esc(defDate) + '"></div>' +
          '<div class="field"><label>花费（元）</label><input type="number" id="mCost" min="0" step="1" value="' + val("cost") + '"></div>' +
        "</div>" +
        '<div class="field"><label>修的是什么</label><input id="mItem" placeholder="例：卧室空调" value="' + esc(rec ? defItem : defItem) + '"></div>' +
        '<div class="field"><label>故障现象</label><input id="mFault" placeholder="例：不制冷，外机不转" value="' + esc(rec ? defFault : defFault) + '"></div>' +
        '<div class="field"><label>怎么处理的</label><textarea id="mFix" placeholder="例：清洗滤网 + 冲外机，恢复正常">' + val("fix") + "</textarea></div>" +
        '<div class="field"><label>更换的配件</label><input id="mParts" placeholder="例：排水阀总成 ×1" value="' + val("parts") + '"></div>' +
        '<div class="field"><label>备注</label><input id="mNote" placeholder="例：下次入夏前再洗一次" value="' + val("note") + '"></div>' +
      "</div>" +
      '<div class="modal-foot">' +
        '<button class="ghost-btn" data-close>取消</button>' +
        '<button class="primary-btn" data-save data-rid="' + (rec ? rec.id : "") + '" data-eid="' + esc(eid) + '">保存</button>' +
      "</div>" +
    "</div>"
  );
  const f = $("#mItem");
  if (f) f.focus();
}

function saveRecord(rid, eid){
  const item = ($("#mItem") || {}).value || "";
  if (!item.trim()) { alert("「修的是什么」不能为空。"); $("#mItem").focus(); return; }
  const payload = {
    date: ($("#mDate") || {}).value || "",
    cost: ($("#mCost") || {}).value || "",
    item: item.trim(),
    fault: ($("#mFault") || {}).value || "",
    fix: ($("#mFix") || {}).value || "",
    parts: ($("#mParts") || {}).value || "",
    note: ($("#mNote") || {}).value || "",
    entryId: eid || ""
  };
  if (rid) {
    const r = store.records.filter(x => x.id === rid)[0];
    if (r) Object.assign(r, payload);
  } else {
    payload.id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    store.records.push(payload);
  }
  saveStore(); closeModal(); render();
}

/* ---------------- 导入导出 ---------------- */
function exportData(){
  const payload = {
    app: "万物可修 · 家庭维修知识库",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { fav: store.fav, records: store.records, done: store.done }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "万物可修-备份-" + todayStr() + ".json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function importData(file){
  const reader = new FileReader();
  reader.onload = function(){
    try {
      const o = JSON.parse(reader.result);
      const d = o && o.data ? o.data : o;
      if (!d || (!Array.isArray(d.fav) && !Array.isArray(d.records) && !d.done)) throw new Error("格式不符");
      if (!confirm("导入将覆盖当前的收藏和维修记录，确定继续？")) return;
      store.fav = Array.isArray(d.fav) ? d.fav : [];
      store.records = Array.isArray(d.records) ? d.records : [];
      store.done = d.done && typeof d.done === "object" ? d.done : {};
      saveStore(); render();
      alert("导入完成：收藏 " + store.fav.length + " 条，维修记录 " + store.records.length + " 条。");
    } catch (err) {
      alert("导入失败：文件不是有效的备份文件。");
    }
  };
  reader.readAsText(file, "utf-8");
}

/* ---------------- 顶栏徽章与视图切换 ---------------- */
function refreshBadges(){
  $("#favCount").textContent = store.fav.length;
  $("#recCount").textContent = store.records.length;
  const dgmCount = $("#dgmCount");
  if (dgmCount) dgmCount.textContent = Object.keys(DIAGRAMS).length;
  $$("#modeNav .mode-btn").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-mode") === state.mode && !state.detailId);
  });
  const cats = new Set(DATA.map(e => e.cat)).size;
  const dgmEntries = DATA.filter(e => (e.diagrams || []).length).length;
  $("#statLine").innerHTML = "知识库 " + DATA.length + " 条 / " + cats + " 类设备<br>" +
    "图解 " + Object.keys(DIAGRAMS).length + " 张 · 覆盖 " + dgmEntries + " 条<br>" +
    "收藏 " + store.fav.length + " · 记录 " + store.records.length + "<br>数据保存在本机浏览器";
}

function showView(){
  const vList = $("#view-list"), vDetail = $("#view-detail"), vDiag = $("#view-diag"),
        vRec = $("#view-records"), vDgm = $("#view-diagrams");
  [vList, vDetail, vDiag, vRec, vDgm].forEach(v => { if (v) v.hidden = true; });
  if (state.detailId) { vDetail.hidden = false; return; }
  if (state.mode === "diagrams") { vDgm.hidden = false; return; }
  if (state.mode === "diag") { vDiag.hidden = false; return; }
  if (state.mode === "records") { vRec.hidden = false; return; }
  vList.hidden = false;
}

function render(){
  renderTree();
  refreshBadges();
  showView();
  if (state.detailId) {
    renderDetail(state.detailId);
  } else if (state.mode === "diagrams") {
    renderDiagrams();
  } else if (state.mode === "diag") {
    renderDiag();
  } else if (state.mode === "records") {
    renderRecords();
  } else {
    renderList();
  }
  const sc = $(".main");
  if (sc && sc.scrollTo) sc.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

function setMode(m){
  state.mode = m;
  state.detailId = null;
  if (m === "browse" && state.cat === null && !state.q) { /* keep */ }
  if (m !== "browse") state.cat = null;
  render();
}

/* ---------------- 事件绑定 ---------------- */
function toggleFav(id){
  const i = store.fav.indexOf(id);
  if (i >= 0) store.fav.splice(i, 1); else store.fav.push(id);
  saveStore();
  render();
}

function bind(){
  // 顶栏模式
  $("#modeNav").addEventListener("click", ev => {
    const b = ev.target.closest(".mode-btn");
    if (!b) return;
    state.q = ""; $("#searchInput").value = "";
    setMode(b.getAttribute("data-mode"));
  });

  // 搜索
  let timer = null;
  $("#searchInput").addEventListener("input", ev => {
    const v = ev.target.value.trim();
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.q = v;
      state.detailId = null;
      if (state.mode !== "browse" && state.mode !== "fav") state.mode = "browse";
      if (v) state.cat = null;
      render();
    }, 180);
  });

  // 筛选
  $("#levelFilters").addEventListener("change", () => {
    $$("#levelFilters input").forEach(i => { state.levels[i.value] = i.checked; });
    render();
  });

  // 侧栏
  $("#collapseAll").addEventListener("click", () => {
    const gs = GROUPS.filter(g => g.cats.some(c => catCount(c) > 0));
    const allCollapsed = gs.every(g => state.collapsed[g.id]);
    gs.forEach(g => { state.collapsed[g.id] = !allCollapsed; });
    renderTree();
    $("#collapseAll").textContent = allCollapsed ? "折叠" : "展开";
  });

  $("#catTree").addEventListener("click", ev => {
    const tg = ev.target.closest("[data-toggle]");
    if (tg) {
      const id = tg.getAttribute("data-toggle");
      state.collapsed[id] = !state.collapsed[id];
      renderTree();
      return;
    }
    const item = ev.target.closest("[data-cat]");
    if (!item) return;
    state.cat = item.getAttribute("data-cat") || null;
    state.q = ""; $("#searchInput").value = "";
    state.mode = "browse"; state.detailId = null;
    render();
  });

  // 导出导入
  $("#btnExport").addEventListener("click", exportData);
  $("#btnImport").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", ev => {
    const f = ev.target.files && ev.target.files[0];
    if (f) importData(f);
    ev.target.value = "";
  });

  // 新增记录
  $("#btnNewRecord").addEventListener("click", () => openRecordModal(null, null));

  // 全局委托
  document.addEventListener("click", ev => {
    // 关闭弹窗
    if (ev.target.hasAttribute && ev.target.hasAttribute("data-mask")) { closeModal(); return; }
    const closeBtn = ev.target.closest("[data-close]");
    if (closeBtn) { closeModal(); return; }
    const saveBtn = ev.target.closest("[data-save]");
    if (saveBtn) { saveRecord(saveBtn.getAttribute("data-rid"), saveBtn.getAttribute("data-eid")); return; }

    // 图解速查：板块内跳转
    const jmp = ev.target.closest("[data-jump]");
    if (jmp) {
      const el = document.getElementById("dgm-sec-" + jmp.getAttribute("data-jump"));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // 收藏星标
    const star = ev.target.closest("[data-star]");
    if (star) { ev.stopPropagation(); toggleFav(star.getAttribute("data-star")); return; }

    // 卡片 -> 详情
    const card = ev.target.closest(".card");
    if (card) { state.detailId = card.getAttribute("data-id"); render(); return; }

    // 详情/自诊内的动作
    const actEl = ev.target.closest("[data-act]");
    if (actEl) {
      const act = actEl.getAttribute("data-act");
      const id = actEl.getAttribute("data-id");
      if (act === "back") { state.detailId = null; render(); return; }
      if (act === "fav") { toggleFav(id); return; }
      if (act === "newrec") { openRecordModal(null, id); return; }
      if (act === "goto") { state.detailId = id; render(); return; }
      if (act === "cleardone") { delete store.done[id]; saveStore(); render(); return; }
    }

    // 自诊 - 设备 / 现象 / 展开原因
    const dev = ev.target.closest("[data-dev]");
    if (dev) {
      state.diag.device = dev.getAttribute("data-dev");
      state.diag.sym = null; state.diag.open = {};
      renderDiag(); return;
    }
    const sym = ev.target.closest("[data-sym]");
    if (sym) {
      state.diag.sym = sym.getAttribute("data-sym");
      state.diag.open = {};
      renderDiag(); return;
    }
    const op = ev.target.closest("[data-open]");
    if (op) {
      const k = op.getAttribute("data-open");
      state.diag.open[k] = !state.diag.open[k];
      renderDiag(); return;
    }

    // 记录操作
    const ed = ev.target.closest("[data-editrec]");
    if (ed) { openRecordModal(ed.getAttribute("data-editrec"), null); return; }
    const dl = ev.target.closest("[data-delrec]");
    if (dl) {
      const rid = dl.getAttribute("data-delrec");
      if (confirm("删除这条维修记录？")) {
        store.records = store.records.filter(r => r.id !== rid);
        saveStore(); render();
      }
      return;
    }
    const oe = ev.target.closest("[data-openentry]");
    if (oe) { state.mode = "browse"; state.detailId = oe.getAttribute("data-openentry"); render(); return; }
  });

  // 步骤勾选
  document.addEventListener("change", ev => {
    const box = ev.target.closest("[data-step]");
    if (!box) return;
    const eid = box.getAttribute("data-eid");
    const i = Number(box.getAttribute("data-step"));
    if (!store.done[eid]) store.done[eid] = [];
    store.done[eid][i] = box.checked;
    saveStore();
    const step = box.closest(".step");
    if (step) step.classList.toggle("done", box.checked);
  });

  // 快捷键
  document.addEventListener("keydown", ev => {
    if (ev.key === "Escape") {
      if ($("#modalRoot").innerHTML) { closeModal(); return; }
      if (state.detailId) { state.detailId = null; render(); }
      return;
    }
    if (ev.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      ev.preventDefault(); $("#searchInput").focus();
    }
  });
}

/* ---------------- 启动 ---------------- */
loadStore();
bind();
render();

})();

