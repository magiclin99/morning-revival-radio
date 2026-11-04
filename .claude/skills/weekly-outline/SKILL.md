---
name: weekly-outline
description: 每週一雲端排程無人看管執行：抓晨興聖言網頁最新一週，若還沒做過就用 /meeting-to-md 和 /outline-page 做成綱要網頁、開 PR，最後發 Slack 通知到 #claude。使用者執行 /weekly-outline，或排程 prompt 要求「做本週綱要」時使用。
---

# 每週綱要（無人看管）

這個 skill 在雲端排程裏跑，**沒有人可以回答問題**。凡是原本要問使用者的地方，照下面的「預設決定」處理，並把判斷寫進 PR 描述，讓使用者事後審。

來源網址：`https://churchintamsui.wixsite.com/index/morning-revival`

## 步驟

### 1. 找出 cloud-food

經文資料在另一個 repo `magiclin99/cloud-food` 的 `verses/`。排程會把兩個 repo 都 clone 下來，位置不固定，先找：

```bash
find / -maxdepth 4 -type d -name verses -path '*cloud-food*' 2>/dev/null | head -1
```

找不到就 `git clone --depth 1 https://github.com/magiclin99/cloud-food /tmp/cloud-food`。

### 2. 判斷要不要做

抓網頁（照 `/meeting-to-md` 步驟 1、2），讀出：
- `<h2>` 的特會名稱與總題
- 篇題「第N週、…」

然後看 `public/outlines/index.json`：

| 狀況 | 處理 |
|---|---|
| 這個特會已經有其他週的頁面，而且第 N 週已經在 `index.json` | 已經做過。發 Slack「本週沒有新內容」，結束，不開 PR。 |
| 有一個開著的 PR 標題含「week N outline」 | 已經做過、等合併。同上，結束。 |
| 特會跟 `index.json` 現有的特會對得上，第 N 週還沒做 | 往下做。 |
| 特會對不上（換了新特會） | **不要猜特會代號和音檔資料夾。** 發 Slack 說明網頁上的特會名稱和篇題，請使用者手動處理，結束。 |

「對得上」的判斷：`index.json` 的值是 `outlines/<代號>/wN.html`，同一個代號資料夾裏已有頁面的 `<title>` 含有這次網頁的總題。

### 3. 產生 .md

照 `/meeting-to-md` 做，含逐字比對。Haiku 子代理核對可以省略，但 difflib 比對一定要做，差異只能是允許的改動。

### 4. 產生網頁

照 `/outline-page` 步驟 1～3 做，**預設決定**：

- **跨章、整章的出處：一律做成連結卡片，不用問。** 使用者之前每次都選卡片。
- 出處判讀有疑慮（沒寫書名、「4節」接哪章、原文看起來是錯字等），照判讀規則選最合理的，**記下來寫進 PR 描述**。
- 原文錯字照抄，也寫進 PR 描述。

### 5. 接到首頁

在 `public/outlines/index.json` 加一筆。鍵沿用同一特會其他週的格式，只改週數：已有 `2026/5-Fall-Elders/week2`，第三週就是 `2026/5-Fall-Elders/week3`。

雲端不一定連得到音檔目錄的主機，**不要**為了查資料夾去下載 plist。

### 6. 驗證（不用瀏覽器）

錨點是 app.js 執行時才產生的，所以檢查頁面內嵌的 `DATA`：

```bash
python3 -I - <html> <N> <<'EOF'
import sys, json, re
h = open(sys.argv[1], encoding='utf-8').read()
d = json.loads(re.search(r'const DATA = (\{.*?\});\n', h, re.S).group(1))
doc = d['doc']
assert len(doc['outline']) == 6 and len(doc['days']) == 6, (len(doc['outline']), len(doc['days']))
assert doc['week'].startswith('第'), doc['week']
assert d['verses'], 'no verses'
print('ok', doc['week'], len(d['verses']), 'verses')
EOF
python3 -c "import json; json.load(open('public/outlines/index.json'))"
```

build.py 的輸出（綱要條數、天數、卡片清單）要記下來放進 PR。

### 7. 開 PR

- 分支：`claude/outline-<代號>-w<N>`
- 只 commit `public/outlines/` 底下的檔案。
- 標題：`Add week N outline page for <特會簡稱>`
- 描述：
  - 新增的網頁路徑與篇題
  - build 統計、連結卡片清單
  - 「請確認」：所有出處判讀疑點、原文錯字
  - 結尾只放 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`，**不要附 session 連結**。
- **不要自己合併。** 使用者審過後合併，合併會自動觸發部署（`daily-update.yml` 的 push 觸發），幾分鐘後上線。

### 8. 發 Slack

Slack bot token 由雲端環境的 network secret 在請求離開機器時自動加上，**不要自己帶 Authorization 標頭，也不要找 token**。

```bash
python3 -I - <<'EOF' > /tmp/slack.json
import json
text = """<訊息內容>"""
print(json.dumps({"channel": "#claude", "text": text}, ensure_ascii=False))
EOF
curl -s -X POST https://slack.com/api/chat.postMessage \
  -H 'Content-type: application/json; charset=utf-8' --data @/tmp/slack.json
```

回應要有 `"ok":true`。失敗（例如 `not_authed`、403 `host_not_allowed`）就把錯誤寫在 session 最後的總結，不要重試其他方式。

訊息內容：

- 做完：`📖 第N週綱要已完成：<篇題>` ＋ PR 連結 ＋「請確認」的疑點（沒有就寫「無」）
- 沒有新內容：`本週晨興聖言還沒更新（網頁仍是第N週），這次沒有產出。`
- 換特會：`⚠️ 網頁換成新特會：<特會名稱>『<總題>』第N週，需要手動設定特會代號與音檔資料夾。`
- 出錯：`❌ 第N週綱要失敗：<原因一句話>`
