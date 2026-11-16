/* 資管所考古題解答庫 — 路由 + 渲染
 * 規則：本檔只負責「讀資料 → 渲染」，不得寫死任何考題內容（見 AGENTS.md 第 9 節）。
 * 路由：#/  |  #/school/<code>  |  #/exam/<id>  |  #/?subject=<code>
 */
(() => {
  const app = document.getElementById("app");

  // 由 GitHub Pages 網址（<user>.github.io/<repo>/）推出 repo 連結，換帳號或改名都不用改程式
  const REPO = (() => {
    const user = location.hostname.endsWith(".github.io") ? location.hostname.split(".")[0] : "";
    const repo = location.pathname.split("/").filter(Boolean)[0] || "";
    return user && repo ? `https://github.com/${user}/${repo}` : "";
  })();
  const AGENTS_URL = REPO ? `${REPO}/blob/main/AGENTS.md` : "AGENTS.md";
  const gh = document.getElementById("gh-link");
  if (gh) REPO ? (gh.href = REPO) : gh.remove();
  const ag = document.getElementById("agents-link");
  if (ag) ag.href = AGENTS_URL;
  const cache = {};
  const getJSON = async (p) => (cache[p] ??= fetch(p).then((r) => {
    if (!r.ok) throw new Error(`${p} (${r.status})`);
    return r.json();
  }));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Markdown：先把數學式保護起來，避免 marked 吃掉底線與反斜線
  const md = (text) => {
    const math = [];
    const guarded = String(text ?? "").replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, (m) => `@@MATH${math.push(m) - 1}@@`);
    return marked.parse(guarded).replace(/@@MATH(\d+)@@/g, (_, i) => esc(math[i]));
  };
  const typeset = (el) => window.renderMathInElement?.(el, {
    delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
    throwOnError: false,
  });

  const GROUPS = [
    { key: "四大", desc: "台大・清大・陽明交大・成大" },
    { key: "四中", desc: "中央・中興・中山・中正" },
    { key: "其他", desc: "政大・北大・台科・北科" },
  ];
  const TYPE_LABEL = { essay: "申論", mcq: "選擇", calc: "計算", code: "程式" };

  async function loadAll() {
    const [schools, subjects, index] = await Promise.all([
      getJSON("data/schools.json"), getJSON("data/subjects.json"), getJSON("data/index.json"),
    ]);
    return { schools, subjects, index, bySchool: Object.fromEntries(schools.map((s) => [s.code, s])) };
  }

  const badge = (e) => (e.sourceType === "mock"
    ? '<span class="badge badge-mock">自擬練習題</span>'
    : '<span class="badge badge-official">真實考題</span>') + (e.partial ? '<span class="badge">部分收錄</span>' : "");

  const examCard = (e, ctx) => `
    <a class="exam-card" href="#/exam/${e.id}">
      <div class="exam-card-top">
        <span class="year">${e.year} 學年度</span>${badge(e)}
      </div>
      <h3>${esc(ctx.bySchool[e.school]?.short)}｜${esc(e.title)}</h3>
      <p class="muted">${esc(e.dept)}</p>
      <div class="tags">${e.tags.slice(0, 5).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <span class="count">${e.count} 題 →</span>
    </a>`;

  // ---------- 首頁 ----------
  async function renderHome(params) {
    const ctx = await loadAll();
    const subject = params.get("subject") || "";
    const list = subject ? ctx.index.filter((e) => e.subject === subject) : ctx.index;
    const total = ctx.index.reduce((s, e) => s + e.count, 0);
    const covered = new Set(ctx.index.map((e) => e.school)).size;
    const usedSubjects = [...new Set(ctx.index.map((e) => e.subject))];

    app.innerHTML = `
      <section class="hero">
        <p class="eyebrow">Information Management · Graduate Entrance Exams</p>
        <h1>資管所考古題，<br/>每一題都有<span class="hl">看得懂的詳解</span>。</h1>
        <p class="lead">收錄四大、四中、政大、北大、台科、北科資管所入學考題。題目附原始出處，解答逐步列出中間過程，並用程式驗證計算結果。</p>
        <div class="stats">
          <div><b>${ctx.index.length}</b><span>份考卷</span></div>
          <div><b>${total}</b><span>題詳解</span></div>
          <div><b>${covered}<small>/${ctx.schools.length}</small></b><span>校已收錄</span></div>
        </div>
      </section>

      <section>
        <div class="section-head">
          <h2>${subject ? `科目：${esc(ctx.subjects[subject])}` : "最新收錄"}</h2>
          <div class="chips">
            <a class="chip ${subject ? "" : "on"}" href="#/">全部</a>
            ${usedSubjects.map((s) => `<a class="chip ${s === subject ? "on" : ""}" href="#/?subject=${s}">${esc(ctx.subjects[s])}</a>`).join("")}
          </div>
        </div>
        <div class="grid">${list.map((e) => examCard(e, ctx)).join("") || '<p class="muted">這個科目還沒有考卷。</p>'}</div>
      </section>

      ${GROUPS.map((g) => `
        <section>
          <div class="section-head"><h2><span class="grp grp-${g.key}">${g.key}</span></h2><p class="muted">${g.desc}</p></div>
          <div class="school-grid">
            ${ctx.schools.filter((s) => s.group === g.key).map((s) => {
              const n = ctx.index.filter((e) => e.school === s.code).length;
              return `<a class="school-card grp-border-${g.key} ${n ? "" : "empty"}" href="#/school/${s.code}">
                <span class="school-short">${esc(s.short)}</span>
                <span class="school-name">${esc(s.name)}</span>
                <span class="school-count">${n ? `${n} 份考卷` : "待收錄"}</span>
              </a>`;
            }).join("")}
          </div>
        </section>`).join("")}`;
  }

  // ---------- 學校頁 ----------
  async function renderSchool(code) {
    const ctx = await loadAll();
    const s = ctx.bySchool[code];
    if (!s) return renderNotFound();
    const list = ctx.index.filter((e) => e.school === code);
    app.innerHTML = `
      <nav class="crumbs"><a href="#/">首頁</a> / ${esc(s.short)}</nav>
      <section class="page-head grp-border-${s.group}">
        <span class="grp grp-${s.group}">${s.group}</span>
        <h1>${esc(s.name)}</h1>
        <p class="muted">資訊管理相關碩士班入學考試</p>
      </section>
      ${list.length ? `<div class="grid">${list.map((e) => examCard(e, ctx)).join("")}</div>` : `
        <div class="empty-state">
          <h3>這間學校還沒有收錄考卷</h3>
          <p>依照 <a href="${AGENTS_URL}" target="_blank" rel="noopener">AGENTS.md</a> 第 7 節的流程，新增 <code>data/exams/${code}/&lt;year&gt;-&lt;subject&gt;.json</code> 即可出現在這裡。</p>
        </div>`}`;
  }

  // ---------- 考卷頁 ----------
  async function renderExam(id) {
    const ctx = await loadAll();
    const meta = ctx.index.find((e) => e.id === id);
    if (!meta) return renderNotFound();
    const ex = await getJSON(meta.path);
    const s = ctx.bySchool[ex.school];
    app.innerHTML = `
      <nav class="crumbs"><a href="#/">首頁</a> / <a href="#/school/${s.code}">${esc(s.short)}</a> / ${ex.year} ${esc(ex.title)}</nav>
      <section class="page-head grp-border-${s.group}">
        <div class="exam-card-top"><span class="year">${ex.year} 學年度</span>${badge(meta)}</div>
        <h1>${esc(s.name)}｜${esc(ex.title)}</h1>
        <p class="muted">${esc(ex.dept)}・共收錄 ${ex.questions.length} 題</p>
        <div class="source">
          <b>來源</b>：<a href="${esc(ex.source.url)}" target="_blank" rel="noopener">${esc(ex.source.url)}</a>
          ${ex.source.note ? `<p>${esc(ex.source.note)}</p>` : ""}
        </div>
        <div class="toolbar">
          <button class="btn" data-act="open">全部展開解答</button>
          <button class="btn ghost" data-act="close">全部收合</button>
        </div>
      </section>
      <ol class="questions">
        ${ex.questions.map((q) => `
          <li class="q" id="q-${esc(q.no)}">
            <header class="q-head">
              <span class="q-no">${esc(q.no)}</span>
              <span class="q-type">${TYPE_LABEL[q.type] || q.type}</span>
              ${q.points ? `<span class="q-pts">${q.points}%</span>` : ""}
              <span class="tags">${q.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</span>
            </header>
            <div class="q-body md">${md(q.question)}</div>
            ${q.options ? `<ul class="options">${q.options.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>` : ""}
            <details class="sol">
              <summary>看解答</summary>
              <div class="answer"><b>答案</b><div class="md">${md(q.answer)}</div></div>
              <div class="explain md">${md(q.explanation)}</div>
            </details>
          </li>`).join("")}
      </ol>`;
    typeset(app);
    app.querySelector(".toolbar").addEventListener("click", (ev) => {
      const act = ev.target.dataset.act;
      if (act) app.querySelectorAll("details.sol").forEach((d) => (d.open = act === "open"));
    });
  }

  function renderNotFound() {
    app.innerHTML = `<div class="empty-state"><h3>找不到這個頁面</h3><p><a href="#/">回首頁</a></p></div>`;
  }

  async function route() {
    const [path, query = ""] = (location.hash.slice(1) || "/").split("?");
    const parts = path.split("/").filter(Boolean);
    try {
      if (parts[0] === "school" && parts[1]) await renderSchool(parts[1]);
      else if (parts[0] === "exam" && parts[1]) await renderExam(parts[1]);
      else if (!parts.length) await renderHome(new URLSearchParams(query));
      else renderNotFound();
    } catch (err) {
      app.innerHTML = `<div class="empty-state"><h3>資料載入失敗</h3><p class="muted">${esc(err.message)}</p><p>本機預覽請用 <code>python3 -m http.server</code>，不要直接開 file://</p></div>`;
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
})();
