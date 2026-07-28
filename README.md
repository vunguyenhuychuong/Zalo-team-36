# Zalo Business Copilot

AI Agent tư vấn giải pháp Zalo cho doanh nghiệp vừa và nhỏ — **Stage 1** theo tài liệu Define-Flow.

SME trả lời một form ngắn → agent chấm điểm độ phù hợp của từng giải pháp Zalo kèm lý do cụ thể
theo ngành → đồng thời sinh lead có điểm số cho nhân sự Zalo ở dashboard nội bộ.

---

## Chạy thử

```bash
npm install
```

### Lúc phát triển

```bash
npm run dev
```

- Web SME: http://localhost:5173
- API: http://localhost:4000/api/health
- Dashboard nội bộ: bấm **Zalo Internal** ở góc phải header

Trên form có link **điền nhanh để demo** — điền sẵn 12 field, dùng lúc demo trước giám khảo cho
khỏi phải gõ tay.

### Lúc demo / deploy

```bash
npm run serve
```

Build client rồi cho **chính server Express phục vụ luôn `client/dist`** — web và API cùng một
origin tại http://localhost:4000, một process duy nhất.

Lý do phải làm vậy: đường dẫn `/api` trong client chạy được ở dev là nhờ proxy của Vite, mà proxy
là tính năng của dev server — **không có trong `dist`**. Nếu đưa `dist` lên host tĩnh riêng (Vercel,
Netlify) thì mọi lời gọi API sẽ 404. Deploy 1 service lên Render/Railway là chạy, và cũng là thứ
bạn cần sẵn nếu sau này gắn webhook cho Zalo Bot.

---

## Ba bề mặt, một engine

| Bề mặt | Ai dùng | Auth | Thấy điểm | Thấy giá |
|---|---|---|---|---|
| SME tự phục vụ | Doanh nghiệp ngoài | Không | Không | Không |
| Tư vấn cho khách | Nhân sự Zalo | **Có** | Có | **Có** |
| Hàng đợi lead | Nhân sự Zalo | **Có** | Có | — |

| Màn | File | Actor |
|---|---|---|
| 1 · SME nhập liệu | `client/src/screens/DiscoveryForm.tsx` | SME ngoài Zalo |
| 2 · Gợi ý giải pháp | `client/src/screens/Recommendation.tsx` | SME ngoài Zalo |
| 3 · Dashboard nhận lead | `client/src/screens/LeadDashboard.tsx` | Nhân sự Zalo |
| 4 · Tư vấn cho khách | `client/src/screens/AdvisorResult.tsx` | Nhân sự Zalo |

Bấm **Zalo Internal** ở góc phải header để vào khu nội bộ. Mật khẩu mặc định `zalo-copilot-2026`,
đổi bằng `INTERNAL_PASSWORD` trong `.env` (deploy script tự truyền sang VPS).

### Vì sao tách hai bề mặt

Tài liệu tự mâu thuẫn ở một điểm: phần Bối cảnh nêu pain point của SME là *"khó ước tính chi phí,
nguồn lực và thời gian triển khai"*, còn Never List điều 5 lại cấm agent nêu *"bất kỳ con số chi phí
nào"*. Spec tool cũng ghi `search_product_catalog` **không gồm giá**.

Tách bề mặt là lời giải: Never List cấm **agent nói giá với khách**, không cấm **nội bộ xem bảng
giá**. Nên `/api/analyze` (SME) cắt `estimate.costRange` ở tầng server; `/api/internal/analyze`
giữ lại để account báo giá nhất quán.

Việc cắt làm **ở server chứ không phải ẩn trên UI** — bài học từ một lỗi thật: trước đây
`qualification` nằm trong response của màn SME. Màn 2 không hiển thị, nhưng mở DevTools là đọc được
`classification: MQL`, cả 6 công thức chấm điểm, và ngưỡng phân loại. Vi phạm Never List điều 11, và
SME biết ngưỡng thì điền lại form cho khớp để được sales gọi.

### Auth — "lớp cứng" theo cách tài liệu gọi

Mật khẩu dùng chung đổi lấy token phiên 8 tiếng, lưu ở `sessionStorage` (đóng tab là mất — hợp với
máy demo dùng chung). Cưỡng chế bằng middleware `requireInternal` ở `server/src/auth.js`, **không
phải ẩn trên giao diện**:

```bash
curl https://zah-36.123c.vn/api/leads
# {"ok":false,"message":"Khu vực nội bộ — cần đăng nhập."}   HTTP 401
```

Đủ cho hackathon, **chưa đủ cho production**: không phân biệt được ai đang đăng nhập, mà tài liệu
lại yêu cầu *"ghi lại ai/agent nào đổi trạng thái và khi nào"*. Dùng thật thì thay bằng SSO Zalo và
lưu user id vào lead record.

### Nguồn lead

Lead có `source`: `sme_self` (SME tự gửi) hoặc `internal_advisor` (nhân sự nhập hộ). Cần thiết vì
metric chính của tài liệu là *"tỷ lệ hội thoại hoàn chỉnh trở thành SQL được account xác nhận trong
7 ngày"* — trộn lead do chính account tạo vào thì con số mất ý nghĩa. Dashboard hiện tag
"nhân sự nhập" và đếm riêng.

---

## Cấu trúc

```
client/                  Vite + React + TypeScript, CSS thuần (không thêm UI lib)
  src/data/options.ts    Bộ câu hỏi Màn 1 — sửa option ở đây
  src/types.ts           Hợp đồng dữ liệu client ↔ server
  src/styles.css         Toàn bộ style, token màu ở :root

server/                  Express, ES module
  src/catalog.js         5 giải pháp Zalo + rule chấm điểm
  src/scoring.js         Engine: điểm giải pháp, 2 chỉ số lead, summary, roadmap
  src/store.js           Lead in-memory, ghi xuống server/data/leads.json
  src/index.js           REST API
```

---

## Chấm điểm: rule-based, không gọi LLM

Chọn rule-based cho Stage 1 vì ba lý do:

1. **Ổn định khi demo** — chạy 2 lần ra cùng một kết quả, không sợ lệch trước giám khảo.
2. **Giải thích được** — mỗi điểm cộng đi kèm một câu lý do hiển thị thẳng cho SME. Trả lời được
   câu hỏi *"con số 92% này ở đâu ra?"*.
3. **Sửa nhanh** — muốn đổi khuyến nghị thì sửa số trong `catalog.js`, không cần tune prompt.

Mỗi giải pháp có `base` + danh sách rule `{ points, reason, note, when(input) }`:

- `reason` (rule cộng điểm) → hiện ở mục **Vì sao phù hợp với bạn**
- `note` (rule trừ điểm) → hiện ở mục **Lưu ý**, để agent không trừ điểm âm thầm rồi không giải thích

Ngưỡng phân nhóm: `≥75` core · `50–74` support · `<50` chưa cần thiết.

Khi nào nên gắn LLM: giữ nguyên engine chấm điểm, chỉ đưa `solutions` + `painPoint` cho LLM để
viết lại phần văn (`summary`) cho tự nhiên hơn. **Không** để LLM tự quyết định điểm số — xem ghi
chú cuối `server/src/scoring.js`.

---

## Qualification — mô hình 100 điểm

Sáu thành phần và điểm tối đa lấy nguyên từ bảng trong tài liệu. Cài ở `computeQualification()`
trong `scoring.js`; mỗi thành phần trả về kèm `detail` giải thích, hiển thị khi bấm mở lead.

| Thành phần | Điểm | Tính từ |
|---|---|---|
| Phù hợp sản phẩm và ICP | 25 | Điểm giải pháp dẫn đầu (15) + ngành có trong ICP Zalo (10) |
| Vấn đề kinh doanh rõ ràng | 25 | Số mục tiêu (13) + độ chi tiết mô tả (8) + có số liệu cụ thể (4) |
| Buying intent | 20 | `exploring` 3 · `comparing` 8 · `demo` 15 · `quote`/`callback` 20 |
| Thời gian triển khai | 15 | `t0` 2 · `t1` 6 · `t2` 11 · `t3` 15 |
| Vai trò và quy trình quyết định | 10 | `owner` 10 · `manager` 7 · `staff` 3 |
| Sẵn sàng dữ liệu và kỹ thuật | 5 | Đã có OA (2) + POS (2) + bán online (1) |

Ngưỡng: **< 40 Lead · 40 – 69 MQL · ≥ 70 SQL candidate**.

**Ngân sách không còn là thành phần tính điểm** — mô hình trong tài liệu không có hạng mục này.
Field `budget` vẫn thu thập và vẫn gắn cờ khi thiếu, nhưng không có trọng số riêng.

### Điều kiện cộng để lên SQL candidate

Tài liệu: *"Từ 70: SQL candidate, nhưng chỉ khi đã có nhu cầu rõ, thời gian dự kiến và một hành động
bán hàng cụ thể."* Đủ 70 điểm là **chưa đủ** — phải qua cả ba cổng:

- Buying intent thuộc `demo` / `quote` / `callback`
- Có mốc thời gian, không phải "đang tìm hiểu"
- Thành phần "vấn đề kinh doanh" đạt ít nhất 15/25

Không qua thì giữ ở MQL kèm lý do cụ thể, đúng Never List điều 10: *không đẩy một lead lên SQL
candidate chỉ để đạt chỉ tiêu*. Lead mẫu **Spa Hương Sen** dựng riêng cho tình huống này — 73 điểm
nhưng vẫn là MQL vì chỉ đang so sánh nhà cung cấp.

### Sàn cho MQL — đối xứng với cổng SQL candidate

Tài liệu định nghĩa MQL là *"có nhu cầu rõ"*, Lead là *"chỉ hỏi chung, chưa rõ doanh nghiệp, nhu
cầu hoặc use case"*. Chỉ dựa vào ngưỡng 40 điểm thì một khách hờ hững vẫn lên được MQL nhờ điểm
ngành và điểm vai trò — hồ sơ **Tạp hoá** chỉ viết *"Nghe nói bán trên Zalo được, muốn tìm hiểu xem
sao"* mà vẫn được 44. Đưa vào nurture là lãng phí.

Nên có thêm sàn: thành phần "vấn đề kinh doanh" phải đạt ≥ 12/25 mới được lên MQL. Cùng nguyên tắc
với cổng SQL candidate — **đặt định nghĩa lên trên con số**.

### Điểm giải pháp trần ở 97, không phải 100

Tổng rule của vài ngành vượt 100 (nha khoa: OA cộng tới 106) rồi bị cắt xuống đúng 100, đọc thành
"phù hợp tuyệt đối". Một agent tư vấn không nên tuyên bố như vậy, và con số tròn 100 là dấu hiệu
điển hình của điểm bịa ra. Trần đặt ở 97.

### Trường bắt buộc và trường "nên có"

`buyingIntent` là **bắt buộc** — server trả 400 nếu thiếu. Cùng với ngành và vấn đề kinh doanh, ba
nhóm này chiếm 70/100 điểm nên thiếu thì không chấm điểm có ý nghĩa được.

`decisionRole`, `timeline`, `budget`, `monthlyRevenue` thuộc nhóm "nên có": thiếu vẫn bàn giao được
nhưng bị gắn vào `missingFields` và hiện trên dashboard — **không suy đoán để lấp chỗ trống**.

### Agent đề xuất, account quyết định — cưỡng chế ở API

Hai nhóm trạng thái tách biệt hoàn toàn, định nghĩa ở
[server/src/leadStatus.js](server/src/leadStatus.js):

| Nhóm | Giá trị | Ai đặt |
|---|---|---|
| Phân loại của agent | `LEAD` · `MQL` · `SQL_CANDIDATE` | Tính từ điểm. **Không ai set được qua API** |
| Trạng thái của account | `NEW` → `ACCEPTED` (SAL) → `QUALIFIED` (SQL) · `NURTURING` · `REJECTED` | Chỉ con người, và phải đúng thứ tự |

`POST /api/leads/:id/transition` từ chối hai loại yêu cầu:

```bash
# 403 — đặt phân loại của agent
{"to":"SQL_CANDIDATE"}
# "SQL_CANDIDATE" là phân loại do agent tính từ điểm qualification,
#  không phải trạng thái account đặt được.

# 409 — nhảy bước, bỏ qua SAL
{"to":"QUALIFIED"}   # khi lead đang ở NEW
# Không thể chuyển thẳng sang SQL. Account phải đọc bản bàn giao và tiếp nhận (SAL)
#  trước... Bỏ qua bước SAL nghĩa là tạo opportunity cho một lead chưa ai đọc.
```

Trên dashboard, nút **SQL — đã xác minh** hiện ở trạng thái khoá kèm lý do khi lead còn ở `NEW`.
Bấm SAL xong thì nút SQL mở khoá.

Endpoint cũ `PATCH /api/leads/:id` **đã bỏ**: nó nhận bất kỳ chuỗi nào trong một danh sách cứng và
không kiểm thứ tự, tức là không cưỡng chế gì cả.

### Nhật ký chuyển trạng thái

Mỗi lần chuyển ghi lại `{ at, from, to, by, note, agentSaid }`. `agentSaid` chốt phân loại của agent
tại thời điểm đó, để sau này đo được *"tỷ lệ account chấp nhận phân loại của agent"* mà không bị
ảnh hưởng nếu rule scoring thay đổi.

`by` hiện luôn là `internal` — hệ quả của việc dùng mật khẩu chung, chưa phân biệt được người dùng.
Tài liệu yêu cầu ghi *"ai/agent nào đổi"*, nên chỗ này chỉ đúng một nửa.

4 lead mẫu phủ đủ cả ba phân loại, cộng ca bị chặn ở cổng, và tính bằng chính engine thật nên con số
kiểm chứng được — không hardcode.

---

## API

| Method | Endpoint | Việc |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra server sống |
| `POST` | `/api/analyze` | Màn 1 → Màn 2, đồng thời tạo lead |
| `GET` | `/api/leads` | Danh sách lead cho Màn 3 |
| `PATCH` | `/api/leads/:id` | Đổi trạng thái lead |
| `POST` | `/api/leads/reset` | Về đúng 4 lead mẫu — chạy trước mỗi lần demo |

Server tự validate lại toàn bộ input, không tin client.

| `POST` | `/api/internal/login` | Đổi mật khẩu nội bộ lấy token |
| `POST` | `/api/internal/analyze` | Nhân sự nhập hộ — trả về cả `qualification` và giá |

Bốn endpoint dưới cần header `Authorization: Bearer <token>`: `/api/leads`, `PATCH /api/leads/:id`,
`/api/leads/reset`, `/api/internal/analyze`.

Reset lead trước khi demo (cần đăng nhập vì lệnh này xoá dữ liệu):

```bash
TOKEN=$(curl -s -X POST https://zah-36.123c.vn/api/internal/login -H 'Content-Type: application/json' -d '{"password":"zalo-copilot-2026"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])") && curl -X POST https://zah-36.123c.vn/api/leads/reset -H "Authorization: Bearer $TOKEN"
```

---

## Deploy lên VPS BTC

**Đang chạy tại: https://zah-36.123c.vn**

```bash
bash scripts/deploy.sh
```

Build ở máy local, đóng gói `server/` + `client/dist` (~72KB), đẩy lên, cài dependency, đổi symlink,
restart pm2. Không gửi `node_modules` (binary khác kiến trúc) và không gửi `.env` (chứa API key).

Lần đầu phải cài SSH key một lần:

```bash
ssh-copy-id -i ~/.ssh/zalo-hackathon.pub -p 2222 zah19-team36@118.102.2.136
```

### Hạ tầng — đo bằng cách thử thật, không theo giấy tờ BTC

| Thứ | Giá trị |
|---|---|
| SSH | port **2222**, không phải 22 |
| OS | Rocky Linux 9.4, 4 core / 5.6GB RAM |
| Node | 20.20.2 (khớp máy local), pm2 7.0.3 |
| nginx | 1.20.1 có sẵn, cert wildcard `*.123c.vn` hợp lệ |
| SELinux | Permissive |
| sudo | không cần password |

`nginx -t` cảnh báo `ssl_stapling ignored` — cảnh báo đó thuộc file của BTC, không phải file mình thêm.

### nginx: thêm file mới, không sửa file BTC

BTC dùng `star.123c.vn.conf` với `server_name *.123c.vn`. Config của mình đặt riêng ở
[deploy/nginx/zalo-copilot.conf](deploy/nginx/zalo-copilot.conf) với `server_name zah-36.123c.vn`
khớp chính xác — nginx ưu tiên exact match hơn wildcard nên nó thắng mà không phải sửa file BTC.
Muốn trả lại nguyên trạng: xoá file của mình rồi `sudo systemctl reload nginx`.

### App chỉ bind 127.0.0.1

`app.listen(PORT, HOST)` với `HOST` mặc định `127.0.0.1`. Bản deploy đầu tiên bind `0.0.0.0` và
**cổng 4000 lộ thẳng ra internet** — gọi `http://118.102.2.136:4000/api/leads` từ ngoài trả về dữ
liệu lead (tên, email, số điện thoại) qua HTTP không mã hoá, đi vòng qua cả nginx và HTTPS. Dashboard
nội bộ chưa có đăng nhập nên đó là lỗ thật, đã bít.

Cần mở cho LAN (test từ điện thoại) thì thêm `--host 0.0.0.0`.

### Hồ sơ mẫu để demo và kiểm thử

8 hồ sơ SME viết theo giọng thật, ở
[server/src/demoPersonas.js](server/src/demoPersonas.js). Chạy qua engine để xem mỗi loại ra kết quả
gì — dùng luôn làm kiểm thử hồi quy mỗi khi sửa rule:

```bash
node scripts/run-personas.mjs
```

| Hồ sơ | Điểm | Phân loại | Giải pháp đứng đầu |
|---|---|---|---|
| Quán cà phê nhỏ | 91 | SQL candidate | OA 92% |
| Shop thời trang | 89 | SQL candidate | Mini App 84% |
| Phòng khám nha khoa | 89 | SQL candidate | OA 97% |
| Nhà phân phối | 83 | SQL candidate | Mini App 64% |
| Chuỗi spa | 73 | MQL &nbsp;* | OA 92% |
| Trung tâm tiếng Anh | 72 | MQL &nbsp;* | OA 90% |
| Homestay | 61 | MQL | Mini App 70% |
| Tạp hoá | 44 | Lead | OA 60% |

`*` = đủ 70 điểm nhưng bị chặn ở cổng SQL candidate vì chỉ đang so sánh nhà cung cấp.

Bộ này cố ý phủ cả dải: ngành trong và ngoài ICP, buying intent từ "mới tìm hiểu" tới "cần báo giá",
ca bị chặn cổng, và ca gần như trống thông tin để thấy engine gắn cờ thay vì đoán.

### Trước mỗi lần demo

```bash
curl -X POST https://zah-36.123c.vn/api/leads/reset
```

---

## Xử lý sự cố

**`EADDRINUSE: address already in use :::4000`** — `npm run dev` vẫn đang chạy ở cửa sổ khác và
giữ cổng 4000. Tắt cửa sổ đó rồi chạy lại. Hai lệnh `dev` và `serve` **không chạy song song được**
vì dùng chung cổng 4000.

Nếu cần chạy cả hai, đổi cổng cho lệnh sau:

```bash
npm run start -- --port 4001
```

Tìm xem process nào đang giữ cổng (Windows):

```bash
netstat -ano | findstr :4000
```

**Web mở lên trắng trang ở cổng 4000** — chưa có `client/dist`. Chạy `npm run build` trước, hoặc
dùng `npm run serve` (build + start một lệnh).

---

## Ghi chú kỹ thuật

**Cổng của API.** Server đọc port theo thứ tự `--port <n>` → `API_PORT` → `PORT` → `4000`.
Dùng `lastIndexOf` khi parse `--port` để đối số người dùng thêm vào ghi đè được cái mặc định
trong npm script.
Cần vậy vì khi chạy chung với Vite, biến `PORT` trong môi trường đã trỏ vào cổng của Vite (5173),
đọc `PORT` trước sẽ dính `EADDRINUSE`. Biến `PORT` vẫn giữ lại cho lúc deploy — Render/Railway tự
set biến này.

**Đổi màu thương hiệu.** Sửa `--brand` trong `client/src/styles.css`. Hiện dùng xanh Zalo `#0068FF`;
muốn về tím như form FPT.AI trong ảnh tham chiếu thì đổi thành `#7A00FF`.

**Xem trên điện thoại.** Vite đã bật `host: true`, mở `http://<IP-máy>:5173` từ điện thoại cùng wifi.
Giao diện đã responsive mobile-first vì sau này sẽ chạy trong webview của Zalo.

---

## Bot chat trên Zalo (zClaw / OpenClaw)

Prompt của bot nằm ở [prompts/bot-personality.txt](prompts/bot-personality.txt) — dán nguyên file
này vào ô **Tính cách bot** của zClaw.

| Ô trong zClaw | Điền |
|---|---|
| Nhà cung cấp | FPT AI (tab Việt Nam) |
| Mô hình | `gemma-4-31B-it` |
| Khóa API | Key từ [marketplace.fptcloud.com](https://marketplace.fptcloud.com/en/my-account?tab=my-api-key) |
| Tính cách bot | Nội dung `prompts/bot-personality.txt` |

**Vì sao chọn `gemma-4-31B-it`** — đo bằng `bash scripts/test-fpt-models.sh`:

| Model | reasoning | Kết quả |
|---|---|---|
| `gemma-4-31B-it` | 0 | Tiếng Việt tự nhiên, hiểu đúng đề — **đang dùng** |
| `DeepSeek-V4-Flash` | 1054 ký tự | Đốt token suy nghĩ trước khi trả lời, chậm |
| `Llama-3.3-70B-Instruct` | 0 | Bịa địa danh khách không nói |
| `SaoLa3.1-medium` | 0 | Hiểu sai đề (tưởng là quản lý nhân viên) |
| `gpt-oss-20b` | 0 | `content` trả về **NULL** — app đọc `content` sẽ báo lỗi |

Giá `gemma-4-31B-it`: **$0.15/M input, $0.45/M output**. Một phiên discovery 2 lượt tiêu khoảng
450 token output → **~$0.0002/phiên**, tức $1 chạy được khoảng 5.000 lượt tư vấn. Ngân sách token
không phải thứ đáng lo.

### Prompt phải khớp với rule engine

Bản đầu tiên của prompt để model tự chấm %, và nó nói *"Zalo AI/Chatbot — độ phù hợp 80%"* trong
khi rule engine cho cùng ca đó **38%** (có rule trừ 14 điểm khi quy mô dưới 10 nhân sự). Hai màn
nói hai con số khác nhau cho cùng một doanh nghiệp là lỗ hổng chí mạng khi pitch.

Đã sửa: **bot chat không được tự đặt điểm số**. Chat làm việc khám phá nhu cầu và xếp thứ tự nên
làm trước/sau; điểm phù hợp do web app tính và hiển thị. Prompt cũng được nhắc riêng về ngưỡng
quy mô nhỏ để kết luận trùng với engine.

Thử prompt trước khi dán vào app:

```bash
bash scripts/test-bot-prompt.sh
```

---

## Còn phải làm

**Port sang Zalo Mini App.** Ba screen không phụ thuộc gì vào DOM của web, chuyển sang `zmp-ui`
chỉ cần thay lớp component và giữ nguyên `api.ts` + toàn bộ backend. Cần Zalo Developer account
và Mini App ID.

**Entry point qua Zalo Bot chat.** Xem `zalo-bot-platform-notes.md`. Bot API dùng mô hình
giống Telegram (`bot-api.zaloplatforms.com/bot<TOKEN>/<method>`), có `CommandHandler` nên làm được
luồng discovery bằng slash command. Hai điều cần nhớ khi làm: token **chỉ để ở env var phía server**
(token nằm trong URL path và không tự hết hạn), và **mọi ID phải giữ dạng string** — ID của Zalo
là chuỗi 19 chữ số, vượt `Number.MAX_SAFE_INTEGER` của JS, `parseInt` là mất người nhận.

**Stage 2** — hỗ trợ SME setup và onboard thật. Hiện Màn 2 chỉ dừng ở lộ trình 30-60-90 dạng đọc.

**Chưa có.** Đăng nhập cho dashboard nội bộ (hiện ai vào cũng xem được — chỉ dùng để demo),
lưu trữ thật (đang là file JSON), gửi email/thông báo khi có lead mới.
