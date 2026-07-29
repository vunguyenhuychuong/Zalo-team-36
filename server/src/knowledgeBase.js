/**
 * Knowledge base cho bot — FAQ, rule goi y, guardrail va playbook theo nganh.
 *
 * ====================================================================
 * NGUYEN TAC VIET FILE NAY, doc truoc khi them bat ky dong nao:
 * ====================================================================
 *
 * 1. CHI viet dieu co the kiem chung. Nguon la bang portfolio san pham Zalo
 *    trong tai lieu Define-Flow va docs Zalo Bot Platform. Moi muc co truong
 *    `nguon` ghi ro lay tu dau.
 *
 * 2. KHONG bia so lieu, KHONG bia ten khach hang. Mot KB co case study gia
 *    ("quan X tang 40% doanh thu") con te hon khong co KB: model se noi con so
 *    do voi giong chac chan, va khong ai truy duoc no tu dau. Nen phan playbook
 *    la MO TA MO HINH dien hinh, khong phai case study co ket qua.
 *
 * 3. Cau nao chua chac thi de dang `deflect` — bot noi khong chac va chuyen
 *    chuyen vien, thay vi doan. Dung Never List dieu 9.
 *
 * 4. TUYET DOI khong co gia o day. Never List dieu 5, va spec tool ghi ro
 *    `search_product_catalog` khong gom gia.
 */

/**
 * FAQ. `khoa` la tu khoa de tra cuu khi sau nay app tu phuc vu bot (khop tu
 * khoa la du cho ~15 muc, chua can embedding).
 *
 * `loai`:
 *   'fact'    — tra loi duoc, co nguon
 *   'deflect' — khong tra loi, chuyen chuyen vien
 */
export const FAQ = [
  {
    khoa: ['oa', 'official account', 'khác gì zalo cá nhân', 'tài khoản'],
    hoi: 'Zalo OA khác gì dùng Zalo cá nhân của nhân viên?',
    dap:
      'OA là tài khoản chính danh của doanh nghiệp, có dấu xác thực. Nhiều nhân viên trực chung một hộp thư nên tin nhắn không nằm trong máy riêng của ai, ' +
      'nhân viên nghỉ việc cũng không mang khách đi. OA có sẵn MiniCRM để lưu thông tin và lịch sử trao đổi của từng khách.',
    loai: 'fact',
    nguon: 'Bảng portfolio — OA: tài khoản thương hiệu chính thức, chat/gọi/menu/chatbot/MiniCRM',
  },
  {
    khoa: ['mini app', 'miniapp', 'tải app', 'cài app', 'app riêng'],
    hoi: 'Mini App có phải khách phải tải thêm app không?',
    dap:
      'Không. Mini App chạy trực tiếp trong Zalo, khách mở là dùng được, không cần cài đặt gì thêm. ' +
      'Mini App tích hợp được xác thực, thanh toán, vị trí và thông báo.',
    loai: 'fact',
    nguon: 'Bảng portfolio — Mini App: chạy trực tiếp trong Zalo, không cần cài đặt',
  },
  {
    khoa: ['zns', 'zbs', 'template message', 'tin nhắn mẫu', 'otp', 'nhắc lịch'],
    hoi: 'ZBS Template Message khác tin nhắn OA thế nào?',
    dap:
      'Tin OA gửi cho người đã quan tâm OA. ZBS Template Message gửi theo số điện thoại hoặc UID nên tới được cả khách chưa quan tâm OA — dùng cho OTP, xác nhận đơn, ' +
      'trạng thái giao hàng, nhắc lịch, thông báo thanh toán. Từ 1/1/2026 ZNS và các loại tin UID đã hợp nhất vào ZBS.',
    loai: 'fact',
    nguon: 'Bảng portfolio — ZBS: gửi qua số điện thoại hoặc UID, hợp nhất ZNS từ 1/1/2026',
  },
  {
    khoa: ['duyệt', 'phê duyệt', 'mẫu tin', 'kiểm duyệt'],
    hoi: 'Tin nhắn mẫu có phải xin Zalo duyệt không?',
    dap:
      'Có. Mẫu tin ZBS phải được Zalo duyệt trước khi gửi. Nên chuẩn bị nội dung mẫu sớm để không bị kẹt lúc chạy thật.',
    loai: 'fact',
    nguon: 'Bảng portfolio — ZBS: mẫu tin phải được Zalo duyệt',
  },
  {
    khoa: ['loyalty', 'tích điểm', 'qr', 'thẻ thành viên', 'voucher'],
    hoi: 'QR / Loyalty là một sản phẩm riêng à?',
    dap:
      'Không phải sản phẩm độc lập. Đây là cách kết hợp QR, OA, Mini App cùng POS hoặc CRM để định danh khách và chăm sóc lại. ' +
      'Zalo định vị Mini App cho phần loyalty và gamification.',
    loai: 'fact',
    nguon: 'Bảng portfolio — QR/Loyalty: không phải sản phẩm độc lập',
  },
  {
    khoa: ['business box', 'hộp thư', 'inbox'],
    hoi: 'Business Box có mua riêng được không?',
    dap:
      'Không. Business Box là hộp thư phía người dùng, hiển thị tin hậu mãi từ các OA mà họ chưa theo dõi — không phải công cụ doanh nghiệp mua riêng. ' +
      'Việc doanh nghiệp làm được là tối ưu nội dung tin và khuyến khích khách theo dõi OA để tin vào Inbox chính.',
    loai: 'fact',
    nguon: 'Bảng portfolio — Business Box: không phải công cụ CSKH doanh nghiệp mua riêng',
  },
  {
    khoa: ['website', 'cần website', 'chưa có web'],
    hoi: 'Chưa có website thì làm được không?',
    dap:
      'Được. OA không cần website. Mini App cũng chạy độc lập trong Zalo, không phụ thuộc website. ' +
      'Nếu đã có website hoặc phần mềm bán hàng thì nối vào được, nhưng không phải điều kiện bắt buộc.',
    loai: 'fact',
    nguon: 'Suy ra từ mô tả OA và Mini App trong bảng portfolio',
  },
  {
    khoa: ['khách không dùng zalo', 'độ phủ', 'bao nhiêu người dùng'],
    hoi: 'Khách của tôi không dùng Zalo thì sao?',
    dap:
      'Zalo có độ phủ gần như toàn bộ người dùng internet tại Việt Nam, nên phần khách không dùng Zalo thường rất nhỏ. ' +
      'Nếu tệp khách của mình có đặc thù riêng thì em ghi nhận để chuyên viên xem cụ thể hơn.',
    loai: 'fact',
    nguon: 'Tài liệu Define-Flow — penetration rate so với người dùng internet VN đạt 99-100%',
  },
  {
    khoa: ['pos', 'crm', 'phần mềm bán hàng', 'tích hợp', 'nối hệ thống'],
    hoi: 'Có nối được với POS hoặc CRM đang dùng không?',
    dap:
      'OA hỗ trợ kết nối hệ thống, và ZBS thường được nối để tin tự bắn ra theo trạng thái đơn. ' +
      'Phần mềm cụ thể bên mình đang dùng thì em ghi nhận để chuyên viên xác nhận chính xác khả năng nối.',
    loai: 'fact',
    nguon: 'Bảng portfolio — OA: kết nối hệ thống. Phần "phần mềm cụ thể" cố ý để ngỏ.',
  },
  {
    khoa: ['cần oa', 'chưa có oa', 'mini app cần oa', 'business message cần oa', 'zbs cần oa'],
    hoi: 'Cần OA mới làm Mini App hoặc ZBS không?',
    dap:
      'Có. OA là nền tảng gốc để doanh nghiệp hiện diện chính danh trên Zalo. Nếu bên mình chưa có OA thì nên làm OA trước; ' +
      'Mini App hoặc ZBS là bước tiếp theo khi đã rõ nhu cầu đặt hàng, đặt lịch hoặc gửi thông báo.',
    loai: 'fact',
    nguon: 'Tài liệu bàn giao zalo_sme_agent_handover.md — B1 M0: OA là nền tảng gốc',
  },
  {
    khoa: ['mini app khác website', 'mini app khác app riêng', 'native app', 'sandbox', 'chạy nền', 'background'],
    hoi: 'Mini App khác website hoặc app riêng thế nào?',
    dap:
      'Mini App chạy trực tiếp trong Zalo nên khách không cần cài app riêng, phù hợp các luồng đặt hàng, đặt lịch, tích điểm và thanh toán trong Zalo. ' +
      'Đổi lại, Mini App không chạy nền như app native, không truy cập toàn bộ dữ liệu điện thoại và phải tuân theo cơ chế duyệt của nền tảng.',
    loai: 'fact',
    nguon: 'Tài liệu bàn giao zalo_sme_agent_handover.md — B2 guardrails Mini App, B3 FAQ',
  },
  {
    khoa: ['gửi hàng loạt', 'spam', 'marketing tự do', 'nhắn mọi user', 'broadcast', 'người chưa tương tác'],
    hoi: 'Có gửi tin hàng loạt cho mọi người dùng Zalo được không?',
    dap:
      'Không. OA không phải kênh để gửi marketing tự do cho toàn bộ người dùng Zalo hoặc nhắn người chưa từng tương tác. ' +
      'Các luồng ZBS cần mẫu tin được duyệt và cơ sở hợp lệ như giao dịch hoặc sự đồng ý của khách.',
    loai: 'fact',
    nguon: 'Tài liệu bàn giao zalo_sme_agent_handover.md — B2 guardrails OA/BM, B3 FAQ',
  },
  {
    khoa: ['bạn là nhân viên zalo', 'có phải sales', 'chốt deal', 'ký hợp đồng', 'hợp đồng'],
    hoi: 'Bạn có phải nhân viên Zalo và có chốt hợp đồng được không?',
    dap:
      'Em là trợ lý tư vấn để ghi nhận nhu cầu ban đầu và chuẩn bị thông tin bàn giao. Việc làm việc chi tiết, báo giá và chốt hợp đồng do chuyên viên Zalo phụ trách.',
    loai: 'fact',
    nguon: 'Tài liệu bàn giao zalo_sme_agent_handover.md — Phần A: danh tính và Never List',
  },

  /* ---- Cac cau CO Y KHONG tra loi ---- */
  {
    khoa: ['giá', 'bao nhiêu tiền', 'báo giá', 'chi phí', 'phí'],
    hoi: 'Chi phí bao nhiêu?',
    dap: 'Chi phí tuỳ phạm vi triển khai. Chuyên viên Zalo sẽ báo giá chính thức cho anh/chị.',
    loai: 'deflect',
    nguon: 'Never List điều 5 — agent không nêu con số chi phí nào',
  },
  {
    khoa: ['giới hạn', 'bao nhiêu tin', 'rate limit', 'gửi được mấy tin'],
    hoi: 'Một tháng gửi được bao nhiêu tin?',
    dap: 'Phần giới hạn theo gói thì em không chắc. Em ghi nhận để chuyên viên xác nhận chính xác với anh/chị.',
    loai: 'deflect',
    nguon: 'Chưa có số liệu kiểm chứng được — không đoán',
  },
  {
    khoa: ['bao giờ có', 'lộ trình', 'sắp ra', 'tính năng mới'],
    hoi: 'Tính năng X bao giờ có?',
    dap: 'Lộ trình sản phẩm thì em không nắm. Em ghi nhận nhu cầu này để chuyên viên phản hồi anh/chị.',
    loai: 'deflect',
    nguon: 'Never List điều 6 — không cam kết lộ trình sản phẩm',
  },
  {
    khoa: ['mini app gửi thông báo', 'push notification', 'đẩy thông báo', 'nhắc qua mini app'],
    hoi: 'Mini App có tự gửi thông báo cho khách được không?',
    dap:
      'Phần thông báo cần kiểm tra theo luồng triển khai cụ thể và điều kiện của nền tảng. Em ghi nhận nhu cầu này để chuyên viên xác nhận chính xác với anh/chị.',
    loai: 'deflect',
    nguon: 'Tài liệu bàn giao zalo_sme_agent_handover.md — B2 guardrails Mini App: quyền thông báo cần account xác nhận',
  },
  {
    khoa: ['quản lý kho', 'quản lý nội bộ', 'nhân sự nội bộ', 'erp', 'vận hành nội bộ'],
    hoi: 'Mini App có phù hợp để làm hệ thống quản lý nội bộ không?',
    dap:
      'Nếu nhu cầu chính là công cụ vận hành nội bộ, không hướng tới khách cuối trên Zalo, thì em không nên ép sang Mini App. ' +
      'Em ghi nhận đúng nhu cầu để chuyên viên xem hướng phù hợp hơn.',
    loai: 'deflect',
    nguon: 'Tài liệu bàn giao zalo_sme_agent_handover.md — B1 M5: nhu cầu ngoài portfolio',
  },
  {
    khoa: ['cccd', 'mật khẩu', 'số tài khoản', 'dữ liệu nhạy cảm', 'danh sách khách', 'pháp lý', 'an toàn dữ liệu'],
    hoi: 'Có cần cung cấp dữ liệu nhạy cảm ở bước tư vấn không?',
    dap:
      'Không cần cung cấp CCCD, mật khẩu, số tài khoản hoặc danh sách khách ở bước tư vấn này. ' +
      'Các chi tiết pháp lý và dữ liệu nhạy cảm sẽ được chuyên viên xử lý qua kênh chính thức.',
    loai: 'deflect',
    nguon: 'Tài liệu bàn giao zalo_sme_agent_handover.md — Never List dữ liệu nhạy cảm',
  },
]

/**
 * Rule anh xa nhu cau -> san pham.
 *
 * Phan nay khong cham diem. No chi giup bot noi dung thu tu trien khai khi
 * khach da ke nhu cau. Diem so va phan loai lead van nam trong scoring.js.
 */
export const RECOMMENDATION_RULES = [
  {
    id: 'M0',
    dieuKien: 'Khách chưa có OA, hoặc chưa rõ đã có OA hay chưa.',
    deXuat: 'Xác nhận trạng thái OA. Nếu chưa có OA thì đề xuất OA trước, Mini App/ZBS để ở bước sau.',
    tienQuyet: 'Đăng ký OA và xác minh doanh nghiệp khi cần.',
    ghiChu: 'OA là nền tảng gốc; không nhảy thẳng sang Mini App hoặc ZBS khi chưa biết trạng thái OA.',
  },
  {
    id: 'M1',
    dieuKien: 'Mục tiêu chính là hiện diện chính danh, tư vấn, chat, chatbot hoặc CSKH.',
    deXuat: 'Zalo Official Account (OA).',
    tienQuyet: 'Đăng ký OA và thiết lập hộp thư/quy trình trực chat.',
    ghiChu: 'Với micro hoặc ngân sách thấp, ưu tiên OA cơ bản trước khi mở rộng.',
  },
  {
    id: 'M2',
    dieuKien: 'Đã có OA và mục tiêu là bán hàng/số hoá dịch vụ trong Zalo.',
    deXuat: 'Zalo Mini App cho đặt hàng, đặt lịch, loyalty, tra cứu đơn hoặc bảo hành.',
    tienQuyet: 'Có OA, xác định use case, luồng giao dịch, thanh toán và hệ thống backend/API nếu có.',
    ghiChu: 'Chỉ đề xuất như bước chính khi nhu cầu hướng tới khách cuối, không phải công cụ vận hành nội bộ.',
  },
  {
    id: 'M3',
    dieuKien: 'Mục tiêu là gửi thông báo chủ động như OTP, xác nhận đơn, giao hàng, nhắc lịch hoặc nhắc thanh toán.',
    deXuat: 'ZBS Template Message.',
    tienQuyet: 'OA phù hợp, mẫu tin được duyệt và có cơ sở gửi hợp lệ như giao dịch hoặc sự đồng ý của khách.',
    ghiChu: 'Không báo giá và không hứa hạn mức gửi; chuyên viên xác nhận theo chính sách hiện hành.',
  },
  {
    id: 'M4',
    dieuKien: 'Nhu cầu vừa bán hàng/số hoá trong Zalo, vừa cần thông báo tự động sau giao dịch.',
    deXuat: 'Combo OA + Mini App + ZBS theo từng phase.',
    tienQuyet: 'Đủ điều kiện riêng của từng sản phẩm.',
    ghiChu: 'Mô hình điển hình: Mini App tạo giao dịch, backend gọi API, ZBS/OA gửi thông báo phù hợp.',
  },
  {
    id: 'M5',
    dieuKien: 'Nhu cầu nằm ngoài portfolio Zalo for Business, như app native chạy nền hoặc công cụ quản lý nội bộ thuần tuý.',
    deXuat: 'Không ép sản phẩm.',
    tienQuyet: 'Ghi nhận trung thực để chuyên viên xem hướng phù hợp.',
    ghiChu: 'Có thể hỏi thêm doanh nghiệp có điểm chạm khách cuối nào trên Zalo không.',
  },
]

/**
 * Guardrail san pham — tra kem khi co nguy co khach hieu nham nang luc.
 */
export const PRODUCT_GUARDRAILS = {
  miniapp: {
    ten: 'Zalo Mini App',
    khongThe: [
      'Chạy nền như native app.',
      'Truy cập toàn bộ dữ liệu điện thoại.',
      'Bỏ qua quy trình review khi phát hành hoặc cập nhật.',
      'Tự do gửi mọi loại thông báo mà không cần điều kiện nền tảng.',
    ],
    loiThoat:
      'Nếu khách hỏi quyền nền tảng hoặc tính năng chưa chắc, nói em ghi nhận để chuyên viên xác nhận chính xác.',
  },
  oa: {
    ten: 'Zalo Official Account',
    khongThe: [
      'Gửi marketing tự do cho toàn bộ người dùng Zalo.',
      'Nhắn người chưa từng tương tác nếu không có luồng Business Message đủ điều kiện.',
      'Lấy thông tin người dùng khi chưa có đồng ý.',
      'Bỏ qua quota hoặc chính sách gói.',
    ],
    loiThoat:
      'Nếu khách hỏi hạn mức hoặc chính sách gói, chuyển chuyên viên xác nhận thay vì đoán.',
  },
  zbs: {
    ten: 'ZBS Template Message',
    khongThe: [
      'Gửi spam.',
      'Gửi quảng cáo trá hình trong template giao dịch.',
      'Sửa template đã duyệt mà không xét duyệt lại.',
      'Gửi ngoài mục đích đã đăng ký.',
    ],
    loiThoat:
      'Nếu khách hỏi nội dung/tần suất cụ thể, ghi nhận use case và để chuyên viên xác nhận mẫu tin hợp lệ.',
  },
}

/**
 * Schema report handover cho account.
 *
 * App hien tai chua co tool `save_lead_report`, nhung dashboard lead da can
 * cung mot logic: account doc nhanh khach can gi, dang thieu dieu kien nao, va
 * buoc tiep theo nen lam gi. Giu schema o KB/config de sau nay gan runtime ma
 * khong phai sua lai prompt hanh vi.
 */
export const HANDOVER_REPORT_SCHEMA = {
  phanLoai: [
    {
      key: 'quyMoNhanSu',
      nhan: 'Quy mô nhân sự',
      giaTri: ['micro', 'small', 'medium', 'large', 'chưa xác định'],
      ghiChu: 'Ghi theo khách nói; không suy đoán nếu khách chưa nêu.',
    },
    {
      key: 'nganSach',
      nhan: 'Ngân sách dự kiến',
      giaTri: ['low', 'mid', 'high', 'khách nêu cụ thể', 'chưa xác định'],
      ghiChu: 'Chỉ ghi ngân sách khách tự nêu. Không biến thành báo giá của Zalo.',
    },
    {
      key: 'mucTieuChinh',
      nhan: 'Mục tiêu chính',
      giaTri: ['presence_cskh', 'sales_digitization', 'notification', 'chưa xác định'],
      ghiChu: 'Presence/CSKH cho OA; sales_digitization cho Mini App; notification cho ZBS.',
    },
    {
      key: 'temperature',
      nhan: 'Mức độ quan tâm',
      giaTri: ['cold', 'warm', 'hot'],
      ghiChu: 'Cold nếu còn tham khảo; warm nếu có pain/use case; hot nếu có nhu cầu rõ, timeline hoặc yêu cầu demo/báo giá/gọi lại.',
    },
  ],
  nhuCau: [
    'painPoint — vấn đề khách nói, giữ đúng ý khách',
    'useCase — use case cụ thể nếu đã rõ',
    'loaiGiaoDich — ecommerce / booking / loyalty / notification / n/a',
  ],
  hienTrang: [
    'daCoOA — có / chưa / chưa rõ',
    'oaDaXacThuc — có / chưa / chưa rõ',
    'backendApi — có / chưa / chưa rõ',
    'kenhHienTai — kênh khách đang bán hoặc chăm sóc',
  ],
  deXuatAgent: [
    'ruleId — M0 đến M5 từ RECOMMENDATION_RULES',
    'sanPhamDeXuat — OA / Mini App / ZBS / combo / không đề xuất',
    'tienQuyetConThieu — điều kiện còn thiếu trước khi triển khai',
    'diemCanAccountXacNhan — guardrail, pháp lý, kỹ thuật hoặc chính sách chưa chắc',
  ],
  handover: [
    'mocThoiGianMongMuon — chỉ ghi nếu khách nói',
    'ghiChuChoAccount — điểm cần hỏi tiếp hoặc xác nhận',
    'cauHoiBoNgo — các trường quan trọng khách chưa trả lời',
    'nextAction — 1 đến 3 hành động cụ thể cho account',
  ],
}

export const HANDOVER_REPORT_WORKFLOW = {
  nguyenTac: [
    'Report phục vụ account, không đọc nguyên văn cho khách.',
    'Chỉ ghi sự thật từ hội thoại; trường thiếu ghi "chưa xác định".',
    'Phân biệt điều khách nói với đánh giá của agent.',
    'Không đưa giá hoặc cam kết như thể đã được chốt.',
  ],
  trigger: [
    'Đủ điều kiện handover.',
    'Khách chủ động dừng hoặc muốn nhận thông tin sau.',
    'Nhu cầu ngoài phạm vi portfolio nhưng vẫn cần account biết.',
    'Hết luồng hội thoại hoặc timeout thì lưu report partial.',
  ],
  cacBuoc: [
    'Gom dữ liệu vào schema HANDOVER_REPORT_SCHEMA.',
    'Phân loại headcount, budget, goal và temperature.',
    'Ánh xạ rule M0-M5 và ghi sản phẩm/điều kiện tiên quyết còn thiếu.',
    'Gắn guardrail hoặc điểm cần account xác nhận.',
    'Dựng 1-3 next action cụ thể cho account.',
    'Lưu report và chỉ xác nhận ngắn với khách rằng chuyên viên sẽ liên hệ.',
  ],
  duDieuKienHandover: [
    'Có mục tiêu chính.',
    'Có pain point hoặc use case cụ thể.',
    'Biết trạng thái OA hoặc ghi rõ chưa xác định để account hỏi ngay.',
    'Có rule ID và sản phẩm đề xuất hoặc lý do không đề xuất.',
    'Có ít nhất một next action cụ thể cho account.',
  ],
}

/**
 * Playbook theo nganh — MO TA MO HINH dien hinh, KHONG phai case study.
 *
 * Co y khong co ten khach hang va khong co con so ket qua. Mot con so bia ra se
 * duoc model noi lai voi giong chac chan, va khong ai truy duoc nguon.
 */
export const PLAYBOOKS = {
  fnb: {
    ten: 'F&B',
    monHinh:
      'Thường bắt đầu bằng OA để gom tin nhắn đặt bàn về một chỗ, gắn QR tại bàn và trên hoá đơn để khách quét vào OA. ' +
      'Khi lượng đặt bàn đủ nhiều thì thêm Mini App cho khách tự chọn giờ và tự gọi món, kèm thẻ tích điểm.',
    thuTu: 'OA trước, Mini App sau khi luồng đặt bàn qua chat đã ổn',
    chuaNen: 'Quán một cơ sở, dưới mười nhân sự thì chưa cần chatbot riêng — trả lời tay vẫn kịp',
  },
  retail: {
    ten: 'Bán lẻ',
    monHinh:
      'OA để tư vấn size, mẫu và chốt đơn qua chat. Nếu đang bán trên sàn và muốn giữ dữ liệu khách thì Mini App là kênh riêng, ' +
      'không mất phí sàn. ZBS dùng cho xác nhận đơn và trạng thái giao hàng.',
    thuTu: 'OA và ZBS trước, Mini App khi muốn thoát phụ thuộc sàn',
    chuaNen: 'Chưa có kênh số nào và chưa rõ mục tiêu thì làm OA trước, đừng làm Mini App',
  },
  beauty: {
    ten: 'Làm đẹp',
    monHinh:
      'Bài toán chính là đặt lịch và nhắc lịch. OA nhận đặt lịch qua chat, ZBS nhắc lịch trước giờ hẹn. ' +
      'Nhiều chi nhánh thì Mini App cho khách tự xem giờ trống, tránh trùng lịch giữa các cơ sở.',
    thuTu: 'OA và ZBS trước, Mini App khi có nhiều chi nhánh',
    chuaNen: 'Một cơ sở, lịch còn thưa thì chưa cần Mini App',
  },
  health: {
    ten: 'Y tế',
    monHinh:
      'OA để hỏi đáp trước khám và trả kết quả. ZBS nhắc lịch hẹn — đây thường là phần tiết kiệm rõ nhất vì giảm được việc lễ tân gọi từng người. ' +
      'Mini App cho khách tự đặt lịch theo bác sĩ và tra cứu kết quả.',
    thuTu: 'OA và ZBS trước vì giải quyết ngay việc khách quên lịch',
    chuaNen: 'Lưu ý dữ liệu sức khoẻ là dữ liệu nhạy cảm — phạm vi lưu trữ cần chuyên viên xác nhận',
  },
  education: {
    ten: 'Giáo dục',
    monHinh:
      'OA thay cho việc giáo vụ nhắn Zalo cá nhân cho từng phụ huynh — đây là điểm chuyển quan trọng vì nhân viên nghỉ việc không mang danh sách phụ huynh đi. ' +
      'ZBS cho điểm danh, học phí, đổi lịch học. Mini App cho đăng ký lớp và xem thời khoá biểu.',
    thuTu: 'OA trước để chính danh hoá kênh liên lạc, rồi ZBS',
    chuaNen: 'Trung tâm nhỏ, ít lớp thì Mini App chưa cần',
  },
  travel: {
    ten: 'Du lịch',
    monHinh:
      'OA để tư vấn và hỗ trợ khách đang lưu trú. Mini App cho khách xem phòng trống và tự giữ chỗ — giải quyết việc trùng phòng khi khách hỏi từ nhiều kênh. ' +
      'ZBS cho xác nhận booking và nhắc ngày nhận phòng.',
    thuTu: 'Mini App có thể lên trước nếu bài toán chính là trùng chỗ',
    chuaNen: 'Ít phòng và đặt qua một kênh duy nhất thì OA là đủ',
  },
  manufacture: {
    ten: 'Sản xuất, phân phối B2B',
    monHinh:
      'Khác các ngành B2C: khách là đại lý, không phải người tiêu dùng. Mini App làm cổng để đại lý tự đặt hàng và tra công nợ, thay cho việc ghi đơn tay. ' +
      'ZBS tự động nhắn xác nhận đơn. OA thường đã có sẵn, việc cần làm là tối ưu lại.',
    thuTu: 'Mini App thường quan trọng hơn OA ở ngành này',
    chuaNen: 'Ít đại lý và đơn hàng đơn giản thì chưa cần cổng riêng',
  },
}
