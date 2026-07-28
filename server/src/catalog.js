/**
 * Danh muc giai phap Zalo + rule cham diem.
 *
 * Moi rule co dang { points, reason, note, when(input) }.
 * Diem cuoi = base + tong points cua cac rule khop, clamp 0..100.
 * `reason` (rule cong diem) hien o muc "Vi sao phu hop".
 * `note`   (rule tru diem) hien o muc "Luu y" — de SME hieu vi sao diem bi keo
 *          xuong, khong de agent tru diem am tham roi khong giai thich.
 * Ca hai deu viet cho nguoi khong ky thuat doc, khong dung tu noi bo.
 *
 * Vi sao rule-based ma khong goi LLM:
 *  - Output on dinh khi demo truoc giam khao, khong bi lech giua 2 lan chay
 *  - Giai thich duoc tung diem cong => tra loi duoc cau hoi "con so nay o dau ra"
 *  - Van de gan LLM sau: xem ghi chu o cuoi file scoring.js
 */

const has = (arr, v) => Array.isArray(arr) && arr.includes(v)
const oneOf = (v, list) => list.includes(v)

/** Use case cu the theo nganh - de goi y khong bi chung chung. */
const USE_CASES = {
  oa: {
    fnb: ['Nhận đặt bàn qua chat', 'Gửi menu & khuyến mãi', 'Phản hồi đánh giá'],
    retail: ['Tư vấn size/mẫu', 'Chốt đơn qua chat', 'Thông báo hàng mới về'],
    beauty: ['Đặt lịch hẹn', 'Nhắc lịch tái khám da', 'Tư vấn liệu trình'],
    health: ['Đặt lịch khám', 'Trả kết quả xét nghiệm', 'Hỏi đáp trước khám'],
    education: ['Tư vấn khoá học', 'Thông báo cho phụ huynh', 'Nhắc học phí'],
    travel: ['Tư vấn tour', 'Gửi voucher phòng', 'Hỗ trợ khách đang lưu trú'],
    realestate: ['Tư vấn dự án', 'Gửi bảng giá', 'Đặt lịch xem nhà'],
    finance: ['Tư vấn gói vay', 'Nhắc kỳ đóng phí', 'Hỗ trợ hồ sơ'],
    manufacture: ['Nhận đơn từ đại lý', 'Báo giá nhanh', 'Hỗ trợ kỹ thuật'],
    service: ['Tiếp nhận yêu cầu', 'Báo giá', 'Chăm sóc sau dịch vụ'],
  },
  miniapp: {
    fnb: ['Menu & gọi món tại bàn', 'Đặt bàn theo giờ', 'Thẻ tích điểm'],
    retail: ['Cửa hàng online trong Zalo', 'Giỏ hàng & thanh toán', 'Đổi điểm lấy voucher'],
    beauty: ['Chọn dịch vụ & đặt lịch', 'Xem lịch sử liệu trình', 'Thẻ thành viên'],
    health: ['Đặt lịch theo bác sĩ', 'Tra cứu kết quả', 'Sổ tiêm chủng'],
    education: ['Đăng ký lớp', 'Xem thời khoá biểu', 'Nộp học phí'],
    travel: ['Xem & giữ phòng', 'Check-in online', 'Ví voucher'],
    realestate: ['Duyệt căn hộ', 'Đặt cọc giữ chỗ', 'Theo dõi tiến độ'],
    finance: ['Tra cứu hợp đồng', 'Tính lãi nhanh', 'Nộp phí online'],
    manufacture: ['Cổng đặt hàng cho đại lý', 'Tra công nợ', 'Theo dõi giao hàng'],
    service: ['Đặt dịch vụ', 'Theo dõi tiến độ', 'Thanh toán'],
  },
  zbs: {
    default: ['Xác nhận đơn hàng', 'Nhắc lịch hẹn', 'Thông báo thanh toán', 'OTP đăng nhập'],
  },
  loyalty: {
    default: ['Thẻ thành viên điện tử', 'Tích điểm bằng QR', 'Đổi điểm lấy quà', 'Voucher sinh nhật'],
  },
  zaloai: {
    default: ['Trả lời câu hỏi lặp lại', 'Gợi ý sản phẩm', 'Chuyển máy cho nhân viên khi cần'],
  },
}

function useCasesFor(solutionId, industry) {
  const table = USE_CASES[solutionId]
  return table[industry] ?? table.default ?? []
}

export const SOLUTIONS = [
  /* ----------------------------------------------------------------- */
  {
    id: 'oa',
    name: 'Zalo Official Account (OA)',
    tagline: 'Kênh chính danh để khách nhắn tin, đặt hàng và được chăm sóc ngay trong Zalo.',
    base: 40,
    estimate: { setupWeeks: '1 – 2 tuần', costRange: 'Từ 0đ (gói Dùng thử)' },
    cta: 'Xem hướng dẫn tạo OA',
    rules: [
      {
        points: 18,
        when: (i) => has(i.goals, 'care'),
        reason:
          'Bạn muốn giảm tải tư vấn — OA gom toàn bộ tin nhắn khách về một hộp thư, nhiều nhân viên trả lời song song được.',
      },
      {
        points: 14,
        when: (i) => has(i.goals, 'brand'),
        reason:
          'OA là tài khoản chính danh có dấu tích xác thực, khách tìm đúng tên bạn trên Zalo thay vì gặp trang giả mạo.',
      },
      {
        points: 12,
        when: (i) => has(i.currentChannels, 'facebook') || has(i.currentChannels, 'offline') || has(i.currentChannels, 'none'),
        reason:
          'Hiện khách đang nhắn bạn ở kênh ngoài Zalo hoặc chỉ tới trực tiếp cửa hàng — OA đưa hội thoại về nơi 100% khách Việt đang dùng hằng ngày.',
      },
      {
        points: 10,
        when: (i) => has(i.goals, 'notify'),
        reason: 'Gửi được thông báo cho toàn bộ người quan tâm OA mà không cần biết số điện thoại.',
      },
      {
        points: 8,
        when: (i) => has(i.goals, 'order'),
        reason: 'Khách đặt hàng, đặt lịch ngay trong hội thoại, đơn không bị rơi giữa các kênh.',
      },
      {
        points: 8,
        when: (i) => has(i.goals, 'data'),
        reason: 'MiniCRM có sẵn trong OA lưu lại thông tin và lịch sử trao đổi của từng khách.',
      },
      {
        points: 6,
        when: (i) => has(i.goals, 'loyalty'),
        reason: 'Danh sách người quan tâm OA chính là tệp khách cũ để bạn chăm sóc lại về sau.',
      },
      {
        points: 8,
        when: (i) => oneOf(i.companySize, ['micro', 'small']),
        reason:
          'Đội nhỏ vẫn vận hành được: OA có sẵn phân công hội thoại và trả lời nhanh, không cần thuê thêm người.',
      },
      {
        points: 10,
        when: (i) => oneOf(i.industry, ['health', 'education', 'realestate', 'finance']),
        reason:
          'Ngành của bạn khách thường hỏi rất kỹ trước khi quyết định — cần một kênh tư vấn 1-1 đủ tin cậy.',
      },
      {
        points: -15,
        when: (i) => has(i.currentChannels, 'zalo_oa'),
        reason: null,
        note: 'Bạn đã có OA sẵn — việc cần làm là tối ưu lại phần đang có (bộ câu trả lời, phân công trực chat), không phải tạo mới.',
      },
    ],
  },

  /* ----------------------------------------------------------------- */
  {
    id: 'miniapp',
    name: 'Zalo Mini App',
    tagline: 'Ứng dụng chạy thẳng trong Zalo, khách dùng ngay không cần tải app.',
    base: 30,
    estimate: { setupWeeks: '3 – 6 tuần', costRange: '15 – 80 triệu' },
    cta: 'Xem mẫu Mini App cùng ngành',
    rules: [
      {
        points: 20,
        when: (i) => has(i.goals, 'order'),
        reason:
          'Khách tự chọn và đặt trong Mini App, không phải nhắn tin rồi chờ nhân viên trả lời — giờ cao điểm không bị nghẽn.',
      },
      {
        points: 16,
        when: (i) => has(i.goals, 'loyalty'),
        reason:
          'Thẻ thành viên, tích điểm, đổi quà chạy trực tiếp trong Zalo — khách không cần cài thêm app hay mang thẻ giấy.',
      },
      {
        points: 14,
        when: (i) => has(i.goals, 'sales'),
        reason: 'Có sẵn thanh toán trong Zalo nên khách chốt đơn liền mạch, ít bỏ giỏ hàng.',
      },
      {
        points: 10,
        when: (i) => oneOf(i.industry, ['fnb', 'retail', 'beauty', 'travel', 'health']),
        reason:
          'Đây là nhóm ngành Zalo định vị rõ cho Mini App: đặt chỗ, đặt lịch, tích điểm, thanh toán.',
      },
      {
        points: 8,
        when: (i) => has(i.currentChannels, 'ecom') || has(i.currentChannels, 'website'),
        reason:
          'Bạn đã quen bán online — Mini App là kênh của riêng bạn, không mất phí sàn và giữ được dữ liệu khách.',
      },
      {
        points: 8,
        when: (i) => oneOf(i.companySize, ['medium', 'large']),
        reason: 'Quy mô của bạn đủ để một kênh tự phục vụ giúp giảm đáng kể tải cho nhân viên.',
      },
      {
        points: 6,
        when: (i) => has(i.goals, 'data'),
        reason: 'Mọi hành vi đặt hàng đều là dữ liệu của bạn, dùng lại được cho các đợt bán sau.',
      },
      {
        points: -12,
        when: (i) => oneOf(i.budget, ['b1']) || (i.budget === 'b0' && i.companySize === 'micro'),
        reason: null,
        note: 'Mini App cần một khoản đầu tư ban đầu. Với ngân sách hiện tại, nên chạy OA trước cho chắc rồi mở rộng sau.',
      },
    ],
  },

  /* ----------------------------------------------------------------- */
  {
    id: 'zbs',
    name: 'ZBS Template Message',
    tagline: 'Tin nhắn theo mẫu gửi tới số điện thoại khách: xác nhận đơn, nhắc lịch, OTP.',
    base: 26,
    estimate: { setupWeeks: '1 tuần', costRange: 'Trả theo tin đã gửi' },
    cta: 'Xem các mẫu tin được duyệt',
    rules: [
      {
        points: 22,
        when: (i) => has(i.goals, 'notify'),
        reason:
          'Đúng nhu cầu tự động gửi thông báo: xác nhận đơn, nhắc lịch, báo thanh toán đi tới đúng số điện thoại khách.',
      },
      {
        points: 12,
        when: (i) => has(i.goals, 'care'),
        reason: 'Giảm số cuộc gọi nhắc lịch thủ công của nhân viên.',
      },
      {
        points: 12,
        when: (i) => oneOf(i.industry, ['health', 'education', 'finance', 'travel', 'realestate']),
        reason: 'Ngành của bạn phụ thuộc nhiều vào việc khách nhớ đúng lịch hẹn và kỳ thanh toán.',
      },
      {
        points: 8,
        when: (i) => has(i.currentChannels, 'pos') || has(i.currentChannels, 'ecom'),
        reason: 'Nối được với hệ thống bán hàng đang dùng để tin nhắn tự bắn ra theo trạng thái đơn.',
      },
      {
        points: 8,
        when: (i) => oneOf(i.monthlyRevenue, ['r2', 'r3']),
        reason: 'Lượng đơn của bạn đủ lớn để việc tự động hoá thông báo tiết kiệm rõ rệt.',
      },
      {
        points: -8,
        when: (i) => !has(i.goals, 'notify') && !has(i.goals, 'care'),
        reason: null,
        note: 'Mục tiêu bạn nêu chưa liên quan tới việc gửi thông báo, nên phần này chưa gấp.',
      },
    ],
  },

  /* ----------------------------------------------------------------- */
  {
    id: 'loyalty',
    name: 'QR + Loyalty trên Zalo',
    tagline: 'Định danh khách tại cửa hàng bằng QR, tích điểm và kéo khách quay lại.',
    base: 24,
    estimate: { setupWeeks: '2 – 4 tuần', costRange: '10 – 40 triệu' },
    cta: 'Xem cách triển khai loyalty',
    rules: [
      {
        points: 22,
        when: (i) => has(i.goals, 'loyalty'),
        reason: 'Đúng mục tiêu giữ chân khách cũ — chi phí thấp hơn nhiều so với tìm khách mới.',
      },
      {
        points: 12,
        when: (i) => oneOf(i.industry, ['fnb', 'retail', 'beauty', 'health']),
        reason: 'Ngành của bạn có khách quay lại thường xuyên, tích điểm phát huy hiệu quả rõ nhất.',
      },
      {
        points: 10,
        when: (i) => has(i.currentChannels, 'offline') || has(i.currentChannels, 'pos'),
        reason:
          'Khách đã tới trực tiếp cửa hàng — quét QR tại quầy là cách nhẹ nhất để biến họ thành khách có dữ liệu.',
      },
      {
        points: 10,
        when: (i) => has(i.goals, 'data'),
        reason: 'Mỗi lần quét QR là một lần bạn biết thêm khách nào mua gì, bao lâu quay lại.',
      },
      {
        points: 8,
        when: (i) => has(i.goals, 'sales'),
        reason: 'Voucher và ưu đãi sinh nhật là lý do cụ thể để khách cũ mua thêm.',
      },
    ],
  },

  /* ----------------------------------------------------------------- */
  {
    id: 'zaloai',
    name: 'Zalo AI / Chatbot',
    tagline: 'Trả lời tự động các câu hỏi lặp lại, chuyển cho nhân viên khi vượt khả năng.',
    base: 34,
    estimate: { setupWeeks: '2 – 5 tuần', costRange: 'Theo lượng hội thoại' },
    cta: 'Tìm hiểu Zalo AI',
    rules: [
      {
        points: 18,
        when: (i) => has(i.goals, 'care'),
        reason: 'Phần lớn câu hỏi của khách là lặp lại — để bot xử lý, nhân viên tập trung ca khó.',
      },
      {
        points: 14,
        when: (i) => oneOf(i.companySize, ['medium', 'large']),
        reason: 'Với quy mô của bạn, lượng hội thoại đủ lớn để tự động hoá tạo ra khác biệt.',
      },
      {
        points: 12,
        when: (i) => oneOf(i.monthlyRevenue, ['r2', 'r3']),
        reason: 'Doanh thu ở mức này thường đi kèm lượng tin nhắn vượt khả năng trả lời tay.',
      },
      {
        points: 10,
        when: (i) => has(i.goals, 'cost'),
        reason: 'Giảm số nhân sự phải trực chat ngoài giờ.',
      },
      {
        points: -14,
        when: (i) => i.companySize === 'micro',
        reason: null,
        note: 'Với quy mô dưới 10 người, lượng hội thoại thường chưa đủ nhiều để cần tới chatbot riêng — trả lời tay vẫn kịp.',
      },
    ],
  },
]

export { useCasesFor }
