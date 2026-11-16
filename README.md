# 資管所考古題解答庫（IM Exam Archive）

台灣**資訊管理研究所**入學考古題 + 詳解網站，收錄範圍：四大（台、清、交、成）、四中（央、興、山、正）、政大、北大、台科、北科。

🌐 網站：https://no13225.github.io/im-exam-archive/

## 特色
- 依「學校 × 科目 × 年度」瀏覽，解答預設收合，方便自我練習
- 每題標註主題標籤、配分、題型；詳解逐步列出中間過程（排序每一輪、AVL 每次旋轉）
- 計算題答案皆用程式實際驗證
- 每份考卷附原始出處連結，並標示「真實考題 / 自擬練習題」

## 這個專案怎麼擴充？
所有規則寫在 **[AGENTS.md](./AGENTS.md)**（`CLAUDE.md` 指向它）。新增一份考卷只要：

1. 複製 `templates/exam.template.json` 到 `data/exams/<學校代碼>/<學年度>-<科目>.json`
2. 填入題目與解答
3. 執行 `node scripts/build-index.mjs`（驗證格式並更新索引）

不需要修改任何 HTML / JS。

## 本機預覽
```bash
python3 -m http.server 8000
# 開 http://localhost:8000
```

## 技術
純靜態 HTML/CSS/JS，資料存在 JSON，Markdown 用 marked、數學式用 KaTeX，部署於 GitHub Pages。
