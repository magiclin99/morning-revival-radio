---
name: outline-page
description: 把 /meeting-to-md 產出的晨興聖言 .md 做成好讀的綱要網頁（綱要附完整經文、點經文展開恢復本註解、每日晨興聖言），放進 radio 的 public/outlines/，並接上首頁週選單旁的「綱要」按鈕。使用者要把某一週的 .md 做成網頁、上架綱要、讓 radio 首頁連到綱要時使用。
---

# 晨興聖言 .md → 綱要網頁，並接到 radio 首頁

輸入：`/meeting-to-md` 產出的某一週 `.md`。
輸出：`public/outlines/<特會代號>/w<週>.html`，以及 `public/outlines/index.json` 裡的一筆對照。

```
.claude/skills/outline-page/
├── SKILL.md
├── build.py                    # list：列出處；build：產網頁
└── template/
    ├── head.html               # 樣式＋頁面骨架（{{TITLE}} 由 build 代入）
    ├── app.js                  # 渲染、導覽列、註解展開、連結卡片
    └── refs.example.txt        # 2026 秋季訓練第一週的出處判讀，當範例
```

---

## 步驟

### 1. 列出綱要的經文出處

```bash
python3 -I .claude/skills/outline-page/build.py list <週.md>
```

每行是：`.md 行號`、綱要開頭、結尾「—」後的出處、括號裏的出處。讀經那一行也會列出。

### 2. 人工判讀成 refs.txt（不要寫程式判讀）

在 scratchpad 寫一份 `refs.txt`，格式見 `template/refs.example.txt`：

```
<.md 行號>\t<書> <章:節>；<書> <章:節-節>；…
```

| 寫法 | 意思 |
|---|---|
| `羅 8:28` | 單節 |
| `出 3:14-15` | 同章範圍 |
| `創 28:1-35:12` | 跨章範圍 |
| `創 37` | 整章 |
| `創 39-49` | 多章 |

書名用 `verses/` 的資料夾名稱，例如啟示錄是「啟」（不是「啓」），詩篇是「詩」。

**判讀規則：**

- **沒寫書名就接續前文**：沿用前面最近一次出現的書卷，綱要的上一條也算。
  - 週三「一、…—四17」接在週二最後的「羅八28～29」後面，是羅4:17。
  - 「（林後十三14）…（三18…）」裏的「三18」是林後3:18。
- **「16節」「1～14節」**：沿用前一處出處的書和章。前一處是「加六10、15～16」，那「16節」就是加6:16。
- **上下文比前一個出處更準時，以上下文為準**。週二「二、在創世記這卷書中…」底下的「十二1」是創12:1，雖然前一處出處是出三15～16。
- **「12下」「5上」**：當整節處理，寫 `林前 11:12`。
- **頓號分開的節**（「十七17、19、21」）：拆成各自一筆。
- 括號裏的出處也要收，順序照原文。
- 沒有出處的綱要不用寫。

**大範圍要先問使用者：** 只要判讀出跨章或整章的範圍（例如創二八1～三五12 共 250 節、創三九～四九），就先停下來，列出來問使用者要怎麼處理。使用者過去的選擇是改成「連結卡片」：不列經文，點了在新分頁開 bible-reading-loop，從起始節讀起。`build.py` 遇到跨章或整章會自動做成卡片，同一章內的範圍則全部列出。

### 3. 產生網頁

經文與註解來自 cloud-food repo 的 `verses/`（恢復本，一節一檔）：

```bash
python3 -I .claude/skills/outline-page/build.py build <週.md> <refs.txt> \
  ../cloud-food/verses public/outlines/<特會代號>/w<週>.html
```

輸出會列出綱要條數、天數、內嵌經文節數，以及有哪些連結卡片。**卡片清單要和使用者確認過的一致。**

特會代號：`{西元年}-{季節}-{簡稱}`，例如 `2026-fall-itero`。同一個特會的各週放同一個資料夾。

### 4. 接到 radio 首頁

首頁 `src/components/HelloWorld.vue` 會讀 `public/outlines/index.json`。只要選到的那一週有對照，週選單右邊就會出現「綱要」按鈕，在同一個分頁開網頁；沒有對照就不顯示。**加新的一週只要改 `index.json`，不用動 Vue 程式。**

對照的鍵是**音檔路徑**，不是週標題：

```json
{
  "2026/5-Fall-Elders/week1": "outlines/2026-fall-itero/w1.html"
}
```

- 鍵的格式是 `{年}/{資料夾}/week{N}`，取自這一週晨興聖言音檔網址 `…/7-Morning_Revival/2026/5-Fall-Elders/week1day3.mp3` 的中段。
- 值是相對於網站根目錄的路徑，前面不要加 `/`。build 時 Vite 會補上 `/morning-revival-radio/`。
- **不要用週標題比對**：radio 的週標題寫「第一週　…成為神的以色列」，網頁和綱要寫「第一週、…成爲神的以色列」。分隔符號不同，連異體字也不同。
- 資料夾名稱要從目錄裏查（見下面「查音檔資料夾」），不要用猜的。

### 5. 驗證

1. **本機目錄**：本機的 `src/components/db.json` 通常是舊的，因為它只在部署時重建，不會 commit。要先更新，看 `update` skill。上游 plist 很大，`update-db.sh` 的 60 秒逾時可能不夠；失敗時改手動下載：
   ```bash
   cd db && T=$(mktemp) && curl -fsSL -m 280 "<PLIST_URL>" -o $T && head -3 $T | grep -q plist && mv $T data.xml && node main.js
   ```
2. **跑起來看**：執行 `yarn dev --port 3123 --strictPort`，選到那一週，確認「綱要」出現、連得到網頁，網頁的「‹ 收聽」能退回原本選的週；換到沒有網頁的週，確認按鈕消失。網頁本身可以直接開 `http://localhost:3123/outlines/<代號>/w<N>.html`。
3. **自動化檢查（選用）**：用無頭 Chrome 時，可以在 `public/` 暫時放一頁先寫好 localStorage 的 `selectedYear`、`selectedMessage`、`selectedWeek`，再 `location.replace('/')`，就能直接看到那一週。測完一定要刪。無頭 Chrome 的視窗最小是 500px，比這更窄的截圖會被裁切，那不是頁面的問題。
4. **收尾**：用 `git checkout -- db/data.xml src/components/db.json` 還原目錄，這兩個檔案不能 commit。關掉 dev server。

### 6. 上線

commit `public/outlines/`，合進 main。每天的 Action（台灣時間 02:00）會一起部署，不用改 workflow；要馬上上線就用 `update` skill 手動觸發。

---

## 查音檔資料夾

```bash
python3 -I - <<'EOF'
import json
d = json.load(open('src/components/db.json'))
for y in d['yearList'][:1]:
    for m in d['yearContents'][y]['messageList']:
        wc = d['yearContents'][y]['messageContents'][m]['weeklyContents']
        first = next((i['link'] for w in wc.values() for i in w if '7-Morning_Revival' in i['link']), '')
        print(m, '|', first.split('7-Morning_Revival/')[-1])
EOF
```

同一個特會的週清單裏也可能有不是晨興聖言的音檔，例如夏季訓練的「信息」放在 `ondemand/Ministry/`。首頁的比對會掃過整週清單，找第一個 `7-Morning_Revival` 的音檔，所以這類特會也能對應。

---

## 網頁設計（template/ 已實作，修改時要保留）

- **結構**：
  - 頂部固定列：最左邊是「‹ 收聽」返回 radio 首頁，接著是「綱要」和週一到週六的跳轉連結，右邊是「經文」顯示／隱藏開關。
  - 「‹ 收聽」的 href 是相對路徑 `../../`，線上和本機都通。從 radio 點進來的，改用 `history.back()` 退回，首頁會用 localStorage 記住選到的年、特會、週，回去還停在原處。所以 radio 的「綱要」按鈕要在**同一個分頁**開，用新分頁開會讓返回變成再開一個 radio。
  - 開頭：特會、總題、第 N 週篇題、讀經，讀經下面列出經文全文。
  - 綱要：分週一到週六，依 壹 → 一 → 1 → a → (一) 縮排，每條綱要底下附它引用的經文。
  - 晨興聖言：每天有晨興餧養（經節加信息）、信息選讀、參讀。
  - 跳轉錨點：綱要是 `#outline`，各天是 `#d1` 到 `#d6`。
- **經文**：出處標成「羅8:28」這種簡寫。經文保留 `verses/` 裏的上標註號（¹²），用字也照 `verses/`（例如「著」），不轉成綱要的「着」。
- **註解**：
  - 有註解的經節，經文下面有虛線；沒有註解的就沒有，也不能點。
  - 點經文本身，註解在正下方展開，每條標「註1」「註2」；再點一次收合。
  - 選取文字時不會觸發展開。Enter 和空白鍵也能操作。
  - 這是參考 bible-reading-loop 的設計。
- **連結卡片**：
  - 跨章或整章的出處做成有細框和「讀經網頁 ↗」的卡片，看得出和原地展開的經節不同。
  - 副標寫「共 N 節・跨 M 章」或「整章 N 節」，加上從哪一節讀起。
  - 連結格式是 `https://magiclin99.github.io/bible-reading-loop/#ref=` 加上 `encodeURIComponent('創28:1')`。bible-reading-loop 只能定位到起始節，會開成「查考」分頁，不會覆蓋使用者在那邊的閱讀進度。
- **深色模式**：所有顏色都是 `:root` 的變數，跟著 `prefers-color-scheme` 和 `data-theme` 切換。

## 已知的坑

- **導覽列不能用 `scrollIntoView`**：要把目前區段的連結捲進導覽列時，sticky 元素上的 `scrollIntoView` 會連整頁一起捲回頂端，使用者捲到「綱要」就會一直被彈回去。只能改導覽列自己的 `scrollLeft`，而且只在區段改變時才改。
- **連結卡片和經文要分清楚**：一般經節點了是原地展開，卡片是離開這頁。兩者的外觀要不同，卡片要有 ↗。
- **「點此展開」不夠**：大範圍收合起來，展開後還是好幾百節，使用者不要。所以才改成連結卡片，而且要先問。
- **claude.ai 的 artifact 連結是私人的**：要給 radio 用，一定要放進 `public/outlines/` 跟著 GitHub Pages 部署，不能連到 claude.ai。
- **異體字**：綱要和晨興聖言照網頁原字（爲、着、裏），經文照 `verses/`（為、著、裡），兩邊都不轉換。
