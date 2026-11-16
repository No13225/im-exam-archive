// 驗證所有考卷 JSON，並重建 data/index.json
// 用法：node scripts/build-index.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

const schools = new Set(read("data/schools.json").map((s) => s.code));
const subjects = read("data/subjects.json");
const TYPES = ["essay", "mcq", "calc", "code"];
const errors = [];
const index = [];

const examsDir = join(root, "data/exams");
for (const school of existsSync(examsDir) ? readdirSync(examsDir) : []) {
  if (!schools.has(school)) errors.push(`未知的學校資料夾：data/exams/${school}`);
  for (const file of readdirSync(join(examsDir, school)).filter((f) => f.endsWith(".json"))) {
    const where = `data/exams/${school}/${file}`;
    let ex;
    try { ex = read(where); } catch (e) { errors.push(`${where}：JSON 格式錯誤 — ${e.message}`); continue; }
    const err = (m) => errors.push(`${where}：${m}`);

    for (const k of ["id", "school", "year", "subject", "dept", "title", "source", "questions"])
      if (ex[k] === undefined) err(`缺少欄位 "${k}"`);
    if (!/^\d{2,3}-[a-z]+(-[a-z0-9]+)?\.json$/.test(file)) err("檔名需為 <year>-<subject>[-<group>].json");
    if (ex.id !== `${school}-${file.replace(/\.json$/, "")}`) err(`id 應為 "${school}-${file.replace(/\.json$/, "")}"`);
    if (ex.school !== school) err(`school 欄位 (${ex.school}) 與資料夾 (${school}) 不一致`);
    if (!subjects[ex.subject]) err(`未知的科目代碼 "${ex.subject}"（請先加到 data/subjects.json）`);
    if (!Number.isInteger(ex.year)) err("year 必須是整數（民國學年度）");
    if (!["official", "mock"].includes(ex.source?.type)) err('source.type 必須是 "official" 或 "mock"');
    if (ex.source?.type === "official" && !ex.source?.url) err("official 考題必須提供 source.url");

    const seen = new Set();
    (ex.questions || []).forEach((q, i) => {
      const at = `第 ${i + 1} 題 (no=${q.no})`;
      for (const k of ["no", "type", "tags", "question", "answer", "explanation"])
        if (!q[k] || (Array.isArray(q[k]) && !q[k].length)) err(`${at} 缺少 "${k}"`);
      if (!TYPES.includes(q.type)) err(`${at} type 必須是 ${TYPES.join("/")}`);
      if (q.type === "mcq" && !Array.isArray(q.options)) err(`${at} 選擇題需要 options`);
      if (seen.has(q.no)) err(`${at} 題號重複`);
      seen.add(q.no);
    });

    index.push({
      id: ex.id, school: ex.school, year: ex.year, subject: ex.subject,
      dept: ex.dept, title: ex.title, sourceType: ex.source?.type,
      partial: !!ex.partial, count: (ex.questions || []).length,
      tags: [...new Set((ex.questions || []).flatMap((q) => q.tags || []))],
      path: where,
    });
  }
}

if (errors.length) {
  console.error(`✗ 發現 ${errors.length} 個錯誤：\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
index.sort((a, b) => b.year - a.year || a.school.localeCompare(b.school) || a.id.localeCompare(b.id));
writeFileSync(join(root, "data/index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(`✓ 驗證通過：${index.length} 份考卷、${index.reduce((s, e) => s + e.count, 0)} 題 → data/index.json`);
