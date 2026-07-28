/**
 * Knowledge base cho bot — FAQ va playbook theo nganh.
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
]

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
