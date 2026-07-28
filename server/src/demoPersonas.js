/**
 * Bo ho so mau de demo va de kiem tra engine.
 *
 * Moi ho so viet theo giong SME that: ke van de cu the, co so lieu, khong dung
 * tu marketing. Phan `painPoint` chinh la thu dien vao o "Van de dang quan tam".
 *
 * Bo nay co chu dich phu ca dai:
 *   - Nganh trong ICP uu tien va nganh ngoai ICP
 *   - Buying intent tu "moi tim hieu" toi "can bao gia"
 *   - Co ho so du diem nhung BI CHAN o cong SQL candidate
 *   - Co ho so gan nhu trong thong tin, de thay engine gan co thay vi doan
 */

/**
 * Ky vong cho eval (`npm run eval`). Tach rieng khoi ho so de xem duoc ca ma
 * tran mot lan, va de thay ngay khi mot thay doi rule lam lech nhieu ca.
 *
 * Chi assert QUYET DINH (phan loai, giai phap dan dau, co bi chan cong khong),
 * KHONG assert diem chinh xac. Ly do: tinh chinh trong so vai diem la viec binh
 * thuong; doi ket luan moi la viec dang bao dong.
 *
 * `guards` ghi ro tung ca dang bao ve dieu gi — khi mot ca fail thi doc dong do
 * truoc, no cho biet nen sua rule hay nen sua ky vong.
 */
export const EXPECTATIONS = {
  cafe: {
    classification: 'SQL_CANDIDATE',
    topSolution: 'oa',
    gateBlocked: false,
    guards: 'Ca chuẩn: quán nhỏ cần chăm sóc khách → OA đứng đầu, đủ điều kiện bàn giao.',
  },
  thoitrang: {
    classification: 'SQL_CANDIDATE',
    topSolution: 'miniapp',
    gateBlocked: false,
    guards: 'Đã bán sàn và muốn giữ dữ liệu khách → Mini App phải thắng OA.',
  },
  nhakhoa: {
    classification: 'SQL_CANDIDATE',
    topSolution: 'oa',
    gateBlocked: false,
    guards: 'Ngành y tế cần nhắc lịch → OA đứng đầu, ZBS phải xếp cao (thứ 2).',
  },
  trungtam: {
    classification: 'MQL',
    topSolution: 'oa',
    gateBlocked: true,
    guards: 'Đủ điểm nhưng chỉ đang so sánh → phải bị chặn ở cổng SQL candidate.',
  },
  homestay: {
    classification: 'MQL',
    topSolution: 'miniapp',
    gateBlocked: false,
    guards: 'Cần khách tự giữ chỗ → Mini App đứng đầu dù quy mô rất nhỏ.',
  },
  daily: {
    classification: 'SQL_CANDIDATE',
    topSolution: 'miniapp',
    gateBlocked: false,
    guards: 'Đã có OA sẵn → OA phải bị trừ điểm và tụt xuống, Mini App lên đầu.',
  },
  taphoa: {
    classification: 'LEAD',
    topSolution: 'oa',
    gateBlocked: false,
    guards:
      'Sàn cho MQL: 44 điểm nhưng vấn đề quá chung nên phải giữ ở Lead, không đẩy vào nurture.',
  },
  spa: {
    classification: 'MQL',
    topSolution: 'oa',
    gateBlocked: true,
    guards: 'Never List điều 10: 73 điểm vẫn không được lên SQL candidate khi chưa có hành động bán hàng.',
  },
}

export const DEMO_PERSONAS = [
  {
    key: 'cafe',
    title: 'Quán cà phê nhỏ — bỏ sót đơn đặt bàn',
    input: {
      fullName: 'Nguyễn Thị Lá',
      companyName: 'Quán cà phê Lá',
      email: 'la@cafela.vn',
      phone: '0905123456',
      region: 'south',
      industry: 'fnb',
      companySize: 'micro',
      monthlyRevenue: 'r1',
      currentChannels: ['facebook', 'offline'],
      goals: ['care', 'loyalty', 'order'],
      budget: 'b2',
      timeline: 't3',
      buyingIntent: 'callback',
      decisionRole: 'owner',
      painPoint:
        'Khách quen hay đặt bàn qua tin nhắn Facebook nhưng bên em bỏ sót nhiều, tới giờ cao điểm không ai trả lời. Em cũng muốn có thẻ tích điểm cho khách quay lại mà chưa biết làm kiểu gì cho gọn.',
    },
  },

  {
    key: 'thoitrang',
    title: 'Shop thời trang — muốn thoát phí sàn',
    input: {
      fullName: 'Đỗ Quỳnh Chi',
      companyName: 'Shop Chi Boutique',
      email: 'chi@chiboutique.vn',
      phone: '0908222333',
      region: 'south',
      industry: 'retail',
      companySize: 'small',
      monthlyRevenue: 'r2',
      currentChannels: ['facebook', 'ecom', 'tiktok'],
      goals: ['sales', 'loyalty', 'data'],
      budget: 'b3',
      timeline: 't2',
      buyingIntent: 'quote',
      decisionRole: 'owner',
      painPoint:
        'Shop bán chủ yếu trên Shopee và TikTok, mỗi tháng khoảng 1200 đơn nhưng phí sàn với phí quảng cáo ăn gần 28% doanh thu. Vấn đề lớn hơn là em không giữ được thông tin khách, sàn không cho, nên không chăm sóc lại được ai. Muốn có kênh của riêng mình.',
    },
  },

  {
    key: 'nhakhoa',
    title: 'Phòng khám nha khoa — khách quên lịch hẹn',
    input: {
      fullName: 'BS. Trần Hoàng Nam',
      companyName: 'Nha khoa Hoàng Nam',
      email: 'contact@nkhoangnam.vn',
      phone: '0912888777',
      region: 'north',
      industry: 'health',
      companySize: 'small',
      monthlyRevenue: 'r2',
      currentChannels: ['facebook', 'website', 'pos'],
      goals: ['notify', 'care', 'order'],
      budget: 'b3',
      timeline: 't2',
      buyingIntent: 'demo',
      decisionRole: 'owner',
      painPoint:
        'Phòng khám có 6 ghế, mỗi ngày khoảng 40 lượt hẹn nhưng tỉ lệ khách quên không tới tầm 18%, lễ tân phải gọi nhắc từng người rất mất thời gian. Muốn khách tự đặt lịch và hệ thống tự nhắn nhắc trước một ngày.',
    },
  },

  {
    key: 'trungtam',
    title: 'Trung tâm tiếng Anh — liên lạc phụ huynh',
    input: {
      fullName: 'Lê Minh Thu',
      companyName: 'Trung tâm Anh ngữ BrightPath',
      email: 'thu@brightpath.edu.vn',
      phone: '0933444555',
      region: 'central',
      industry: 'education',
      companySize: 'medium',
      monthlyRevenue: 'r2',
      currentChannels: ['facebook', 'website'],
      goals: ['notify', 'care', 'cost'],
      budget: 'b2',
      timeline: 't1',
      buyingIntent: 'comparing',
      decisionRole: 'manager',
      painPoint:
        'Trung tâm có 3 cơ sở, gần 800 học viên. Hiện giáo vụ nhắn Zalo cá nhân cho từng phụ huynh để báo điểm danh, báo học phí, đổi lịch học — 4 bạn giáo vụ làm không xuể và hay sót. Cần một kênh chính thức thay cho Zalo cá nhân của nhân viên.',
    },
  },

  {
    key: 'homestay',
    title: 'Homestay — khách hỏi phòng lẻ tẻ nhiều kênh',
    input: {
      fullName: 'Phan Anh Tuấn',
      companyName: 'Homestay Đồi Thông',
      email: 'tuan@doithong.vn',
      phone: '0966111222',
      region: 'central',
      industry: 'travel',
      companySize: 'micro',
      monthlyRevenue: 'r1',
      currentChannels: ['facebook', 'ecom'],
      goals: ['order', 'sales'],
      budget: 'b1',
      timeline: 't1',
      buyingIntent: 'exploring',
      decisionRole: 'owner',
      painPoint:
        'Nhà em có 8 phòng, khách hỏi qua Facebook, Booking, với gọi điện, nhiều lúc trùng phòng phải xin lỗi khách. Muốn khách xem được phòng trống rồi tự giữ chỗ.',
    },
  },

  {
    key: 'daily',
    title: 'Nhà phân phối — đại lý đặt hàng ghi tay',
    input: {
      fullName: 'Lê Văn Bình',
      companyName: 'Xưởng may Bình Minh',
      email: 'binh@binhminhgarment.com.vn',
      phone: '0938777666',
      region: 'south',
      industry: 'manufacture',
      companySize: 'small',
      monthlyRevenue: 'r2',
      currentChannels: ['website', 'pos', 'zalo_oa'],
      goals: ['order', 'notify', 'cost', 'data'],
      budget: 'b3',
      timeline: 't2',
      buyingIntent: 'quote',
      decisionRole: 'owner',
      painPoint:
        'Xưởng có gần 40 đại lý đặt hàng qua điện thoại và Zalo cá nhân của nhân viên, đơn ghi tay nên hay sai số lượng. Cần một cổng để đại lý tự đặt và tự tra công nợ, đồng thời tự động nhắn xác nhận đơn.',
    },
  },

  {
    key: 'taphoa',
    title: 'Tạp hoá — chưa có kênh số nào (ca điểm thấp)',
    input: {
      fullName: 'Võ Thị Hạnh',
      companyName: 'Tạp hoá Hạnh',
      email: 'hanh.taphoa@gmail.com',
      phone: '0977000111',
      region: 'south',
      industry: 'retail',
      companySize: 'micro',
      monthlyRevenue: 'r0',
      currentChannels: ['offline'],
      goals: ['sales'],
      budget: 'b0',
      timeline: 't0',
      buyingIntent: 'exploring',
      decisionRole: 'owner',
      painPoint: 'Nghe nói bán trên Zalo được, muốn tìm hiểu xem sao.',
    },
  },

  {
    key: 'spa',
    title: 'Chuỗi spa — đủ điểm nhưng đang so sánh nhà cung cấp',
    input: {
      fullName: 'Phạm Hương',
      companyName: 'Spa Hương Sen',
      email: 'huong@spahuongsen.vn',
      phone: '0977456123',
      region: 'central',
      industry: 'beauty',
      companySize: 'small',
      monthlyRevenue: 'r1',
      currentChannels: ['facebook', 'pos'],
      goals: ['care', 'loyalty', 'order'],
      budget: 'b1',
      timeline: 't1',
      buyingIntent: 'comparing',
      decisionRole: 'manager',
      painPoint:
        'Spa có 3 chi nhánh, khách đặt lịch qua điện thoại và Facebook nên hay trùng giờ giữa các cơ sở. Muốn khách tự chọn được giờ trống và nhớ lịch của mình, nhưng năm nay ngân sách còn hạn chế.',
    },
  },
]
