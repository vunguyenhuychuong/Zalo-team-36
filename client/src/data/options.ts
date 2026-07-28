/**
 * Bo cau hoi Man 1. Moi option co `value` (khoa dung cho scoring) va `label` (hien thi).
 * Them/bot option o day thi phai cap nhat rule tuong ung ben server/src/scoring.js.
 */

export interface Option {
  value: string
  label: string
}

export const REGIONS: Option[] = [
  { value: 'north', label: 'Miền Bắc' },
  { value: 'central', label: 'Miền Trung' },
  { value: 'south', label: 'Miền Nam' },
  { value: 'nationwide', label: 'Toàn quốc' },
]

export const INDUSTRIES: Option[] = [
  { value: 'fnb', label: 'F&B — Nhà hàng, quán cà phê, trà sữa' },
  { value: 'retail', label: 'Bán lẻ — Thời trang, mỹ phẩm, tạp hoá' },
  { value: 'beauty', label: 'Làm đẹp — Spa, salon, nail' },
  { value: 'health', label: 'Y tế — Phòng khám, nha khoa, hiệu thuốc' },
  { value: 'education', label: 'Giáo dục — Trung tâm, trường học' },
  { value: 'travel', label: 'Du lịch — Khách sạn, homestay, tour' },
  { value: 'realestate', label: 'Bất động sản' },
  { value: 'finance', label: 'Tài chính — Bảo hiểm, cho vay' },
  { value: 'manufacture', label: 'Sản xuất — Phân phối B2B' },
  { value: 'service', label: 'Dịch vụ khác' },
]

export const COMPANY_SIZES: Option[] = [
  { value: 'micro', label: 'Dưới 10 nhân sự' },
  { value: 'small', label: '10 – 49 nhân sự' },
  { value: 'medium', label: '50 – 199 nhân sự' },
  { value: 'large', label: 'Từ 200 nhân sự' },
]

export const REVENUES: Option[] = [
  { value: 'r0', label: 'Dưới 100 triệu / tháng' },
  { value: 'r1', label: '100 – 500 triệu / tháng' },
  { value: 'r2', label: '500 triệu – 2 tỷ / tháng' },
  { value: 'r3', label: 'Trên 2 tỷ / tháng' },
  { value: 'unknown', label: 'Chưa muốn tiết lộ' },
]

export const CHANNELS: Option[] = [
  { value: 'facebook', label: 'Facebook / Instagram' },
  { value: 'tiktok', label: 'TikTok Shop' },
  { value: 'ecom', label: 'Shopee / Lazada / Tiki' },
  { value: 'website', label: 'Website riêng' },
  { value: 'zalo_oa', label: 'Zalo OA (đã có)' },
  { value: 'pos', label: 'Phần mềm bán hàng / POS' },
  { value: 'offline', label: 'Chỉ bán tại cửa hàng' },
  { value: 'none', label: 'Chưa có kênh số nào' },
]

export const GOALS: Option[] = [
  { value: 'sales', label: 'Tăng doanh số online' },
  { value: 'care', label: 'Chăm sóc khách hàng, giảm tải tư vấn' },
  { value: 'loyalty', label: 'Giữ chân khách cũ, tích điểm' },
  { value: 'order', label: 'Cho khách đặt hàng / đặt lịch' },
  { value: 'notify', label: 'Tự động gửi thông báo, nhắc lịch' },
  { value: 'cost', label: 'Giảm chi phí vận hành' },
  { value: 'brand', label: 'Xây kênh chính danh, tăng uy tín' },
  { value: 'data', label: 'Thu thập dữ liệu khách hàng' },
]

export const BUDGETS: Option[] = [
  { value: 'b0', label: 'Chưa xác định' },
  { value: 'b1', label: 'Dưới 10 triệu' },
  { value: 'b2', label: '10 – 50 triệu' },
  { value: 'b3', label: '50 – 200 triệu' },
  { value: 'b4', label: 'Trên 200 triệu' },
]

export const TIMELINES: Option[] = [
  { value: 't0', label: 'Đang tìm hiểu, chưa có kế hoạch' },
  { value: 't1', label: 'Trong 3 – 6 tháng tới' },
  { value: 't2', label: 'Trong 1 – 3 tháng tới' },
  { value: 't3', label: 'Ngay trong tháng này' },
]

/**
 * Buying intent — thanh phan 20 diem trong mo hinh qualification.
 * Doc coi day la truong BAT BUOC: thieu thi khong cham diem co y nghia duoc.
 */
export const BUYING_INTENTS: Option[] = [
  { value: 'exploring', label: 'Mới tìm hiểu, chưa có kế hoạch gì' },
  { value: 'comparing', label: 'Đang so sánh với nhà cung cấp khác' },
  { value: 'demo', label: 'Muốn xem demo sản phẩm' },
  { value: 'quote', label: 'Cần báo giá cụ thể' },
  { value: 'callback', label: 'Muốn chuyên viên Zalo gọi lại' },
]

/**
 * Vai tro nguoi tra loi — thanh phan 10 diem.
 * Doc xep vao nhom "nen co": thieu van ban giao duoc nhung phai gan co
 * "thong tin con thieu".
 */
export const DECISION_ROLES: Option[] = [
  { value: 'owner', label: 'Chủ doanh nghiệp — tôi quyết định' },
  { value: 'manager', label: 'Quản lý — tôi tham gia quyết định' },
  { value: 'staff', label: 'Nhân viên — tôi được giao tìm hiểu' },
]

/** Tra label tu value - dung khi render lai o man ket qua va dashboard. */
export function labelOf(list: Option[], value: string): string {
  return list.find((o) => o.value === value)?.label ?? value
}
