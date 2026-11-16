# AGENTS.md — 資管所考古題解答網站（IM Exam Archive）

> 這份文件寫給**接手這個專案的 AI（Claude / Codex / Cursor 等）與協作者**。
> 開始任何修改前，先完整讀完本文件；所有新增內容都必須符合這裡的規則。
> `CLAUDE.md` 只是指向本文件的捷徑，規則以本文件為準。

---

## 1. 專案目的

收錄台灣**資訊管理研究所（碩士班）入學考試**的歷屆考題，並為每一題提供**結構化、可逐步理解的解答**，幫助準備資管所的考生依「學校 × 科目 × 年度」快速找題、練題、看解析。

收錄範圍（共 12 校，代碼固定，**不可自行更改**）：

| 分類 | 學校代碼 | 學校 |
|---|---|---|
| 四大 | `ntu` | 國立臺灣大學 |
| 四大 | `nthu` | 國立清華大學 |
| 四大 | `nycu` | 國立陽明交通大學 |
| 四大 | `ncku` | 國立成功大學 |
| 四中 | `ncu` | 國立中央大學 |
| 四中 | `nchu` | 國立中興大學 |
| 四中 | `nsysu` | 國立中山大學 |
| 四中 | `ccu` | 國立中正大學 |
| 其他 | `nccu` | 國立政治大學 |
| 其他 | `ntpu` | 國立臺北大學 |
| 其他 | `ntust` | 國立臺灣科技大學 |
| 其他 | `ntut` | 國立臺北科技大學 |

學校清單的唯一來源是 `data/schools.json`。

---

## 2. 技術架構（重要：不要引入建置工具）

- **純靜態網站**：HTML + CSS + 原生 JavaScript（ES Modules 不需要），部署在 **GitHub Pages**（`main` 分支根目錄）。
- **不使用** React / Vue / npm 套件 / bundler。唯一的外部依賴是 CDN 載入的 `marked`（Markdown 轉 HTML）與 `KaTeX`（數學式）。
- **內容與程式分離**：所有考題都是 `data/exams/` 底下的 JSON 檔；網頁程式（`assets/app.js`）只負責讀 JSON 並渲染。
  **新增內容時，原則上只需要新增 JSON，不需要改任何 HTML/JS/CSS。**
- 路由使用 hash（`#/school/ncu`、`#/exam/ncu-110-ds`），因此 GitHub Pages 不需要額外設定。
- 根目錄有 `.nojekyll`，請勿刪除。

## 3. 目錄結構

```
.
├── AGENTS.md              ← 本文件（專案規則，唯一真相來源）
├── CLAUDE.md              ← 指向 AGENTS.md
├── README.md              ← 給人看的專案介紹
├── index.html             ← 唯一的 HTML 入口（SPA）
├── .nojekyll
├── assets/
│   ├── style.css          ← 全站樣式（設計 token 在 :root）
│   └── app.js             ← 路由 + 渲染
├── data/
│   ├── schools.json       ← 學校清單（12 校，固定）
│   ├── subjects.json      ← 科目代碼表
│   ├── index.json         ← 考卷索引（由腳本自動產生，勿手改）
│   └── exams/
│       └── <school>/
│           └── <year>-<subject>[-<group>].json   ← 一份考卷一個檔
├── templates/
│   └── exam.template.json ← 新增考卷時複製這份
└── scripts/
    └── build-index.mjs    ← 驗證所有考卷 + 重建 data/index.json
```

## 4. 命名規則

### 4.1 檔名
`data/exams/<school>/<year>-<subject>[-<group>].json`

- `<school>`：第 1 節的學校代碼。
- `<year>`：**民國學年度**三位數，例如 `110`、`114`。
- `<subject>`：`data/subjects.json` 裡的科目代碼（見下表）。
- `<group>`：選填，同校同年同科有多組考卷時使用，小寫英數，例如 `a`、`b`、`ee`（電子系）。
- 全部小寫、以 `-` 分隔，不可有空白或中文。

範例：`data/exams/ncu/110-ds.json`、`data/exams/nsysu/110-ds-b.json`

### 4.2 考卷 id
`id` 欄位 = 檔名去掉 `.json` 並在前面加上學校代碼：`<school>-<year>-<subject>[-<group>]`
例：`ncu-110-ds`、`nsysu-110-ds-b`。**id 必須與檔名一致**，腳本會檢查。

### 4.3 科目代碼

| 代碼 | 科目 |
|---|---|
| `cs` | 計算機概論 |
| `ds` | 資料結構 |
| `alg` | 演算法 |
| `db` | 資料庫 |
| `mis` | 管理資訊系統 / 資訊管理導論 |
| `stat` | 統計學 |
| `om` | 作業研究 / 作業管理 |
| `mgmt` | 管理學 |
| `econ` | 經濟學 |
| `eng` | 英文 |

需要新科目時：先在 `data/subjects.json` 新增，再更新此表。

## 5. 考卷 JSON 格式（Schema）

```jsonc
{
  "id": "ncu-110-ds",                 // 必填，見 4.2
  "school": "ncu",                    // 必填，學校代碼
  "year": 110,                        // 必填，民國學年度（數字）
  "subject": "ds",                    // 必填，科目代碼
  "dept": "資訊管理暨大數據分析類",     // 必填，系所／組別全名（照考卷寫）
  "title": "資料結構",                 // 必填，考卷上的科目名稱
  "source": {                         // 必填
    "type": "official",               // official = 真實考題；mock = 自擬練習題
    "url": "https://...",             // 題目來源連結
    "note": "說明（例如：部分題目含圖，僅收錄文字可完整呈現者）"
  },
  "partial": true,                    // 選填：只收錄部分題目時設 true
  "questions": [
    {
      "no": "1(a)",                   // 必填，照考卷題號（字串）
      "type": "essay",                // 必填：essay | mcq | calc | code
      "points": 6,                    // 選填，配分（%）
      "tags": ["排序", "Quick Sort"],  // 必填，至少 1 個主題標籤（中文為主）
      "question": "Markdown 字串",     // 必填，題目
      "options": ["(A) ...", "..."],  // 只有 mcq 需要
      "answer": "Markdown 字串",       // 必填，最終答案（簡短）
      "explanation": "Markdown 字串"   // 必填，詳解（步驟、推導、觀念）
    }
  ]
}
```

- 所有 Markdown 欄位支援：表格、程式碼區塊（```c / ```python）、行內數學 `$...$`、區塊數學 `$$...$$`。
- JSON 裡的換行一律寫成 `\n`；反斜線要寫成 `\\`（例如 LaTeX 的 `\\log`）。

## 6. 內容規則（AI 新增題目與解答時必須遵守）

1. **題目忠於原文**：`source.type = "official"` 的題目必須照考卷原文（英文題就保留英文），只能修正明顯的 OCR 錯字。不可改寫數據。
   - 若只能取得題意而非原文，在 `question` 開頭加上 `> 題意整理（非逐字原文）`。
2. **不得捏造考題**：沒有來源的題目一律標 `"type": "mock"`，網頁會顯示「自擬練習題」徽章。絕不可把自擬題標成 official。
3. **含圖題**：若題目依賴無法取得的圖，**不要收錄**或在 `source.note` 註明並設 `"partial": true`。
4. **解答格式**：
   - `answer`：一句話或一個結果（數字、選項、最後的樹／表）。
   - `explanation`：依序寫「**觀念** → **步驟** → **結果**」；演算法題必須逐步列出中間狀態（每一輪 pass、每一次 rotation）。
   - 若題目有多種慣例（例如 Quick Sort 的 pivot 取法、AVL 刪除用前驅或後繼），**在詳解第一行寫明採用的假設**。
   - 程式碼題用 C（題目指定 ANSI C 時）或 Python，並附時間複雜度。
5. **自我驗證**：排序、雜湊、樹的結果，AI 應實際用程式跑一次確認（可以寫暫時腳本，但不要提交到 repo）。
6. **語言**：解答用繁體中文（台灣用語），專有名詞保留英文，例如「雜湊表（hash table）」。

## 7. 新增一份考卷的標準流程（SOP）

1. 複製 `templates/exam.template.json` → `data/exams/<school>/<year>-<subject>.json`（資料夾不存在就建立）。
2. 填入 metadata 與題目、解答（遵守第 5、6 節）。
3. 執行：
   ```bash
   node scripts/build-index.mjs
   ```
   腳本會驗證所有考卷（欄位、id 與檔名、學校／科目代碼、題號重複），並重建 `data/index.json`。**有錯誤就修到通過為止。**
4. 本機預覽：`python3 -m http.server 8000` → 開 `http://localhost:8000/#/exam/<id>` 檢查顯示。
5. Commit 訊息格式：`exam: add <id>`（新增）、`exam: fix <id>`（修正）、`site: ...`（改網頁）、`docs: ...`（改文件）。

## 8. 網頁設計規範

- 風格：**乾淨的學術筆記感**。白底、深藍主色 `--ink`、琥珀色強調 `--accent`，學校分類用色條區分（四大／四中／其他）。
- 字型：系統字 + `"Noto Sans TC"`；程式碼用等寬字。
- 頁面只有三種，**不要新增第四種 HTML 檔**：
  1. 首頁 `#/`：Hero、全站統計、12 校卡片（依四大／四中／其他分區）、科目篩選。
  2. 學校頁 `#/school/<code>`：該校所有考卷，依年度新→舊。
  3. 考卷頁 `#/exam/<id>`：來源資訊、題目列表；解答預設**收合**，點「看解答」展開；可一鍵全部展開。
- 新樣式寫在 `assets/style.css` 並優先使用 `:root` 的 CSS 變數；不要寫 inline style。
- 必須支援手機寬度（≥ 360px）與深色模式（`prefers-color-scheme: dark`）。

## 9. AI 修改程式時的規則

- 修改 `app.js` 時保持「資料驅動」：不得把考題內容寫死在 JS 或 HTML 中。
- 不要修改 `data/index.json` 的手寫內容——它永遠由腳本產生。
- 不要刪除或改名既有考卷檔（會破壞已分享的連結）；需要修正時直接改內容。
- 任何改動完成後都要跑 `node scripts/build-index.mjs`，並在瀏覽器確認首頁、一個學校頁、一個考卷頁都正常。

## 10. 版權與來源

- 依《著作權法》第 9 條，依法令舉行之各類考試試題不得為著作權之標的，因此收錄研究所入學考題原文。
- **解答與詳解為本專案自行撰寫**，不得複製補習班或其他網站的詳解文字。
- 每份考卷都必須填 `source.url`，讓讀者能回到原始出處核對。
