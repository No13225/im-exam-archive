# CLAUDE.md

本專案的所有規則寫在 **[AGENTS.md](./AGENTS.md)**，請先完整閱讀後再動手。

快速提醒：
- 新增考卷 = 在 `data/exams/<school>/` 新增一個 JSON（格式見 AGENTS.md 第 5 節），**不需要改 HTML/JS**。
- 完成後一定要跑 `node scripts/build-index.mjs`，通過驗證才算完成。
- 不得捏造考題；沒有來源的題目必須標 `"source": { "type": "mock" }`。
