import { INDUSTRY_NAME } from './scoring.js'
import { LlmError, complete, isConfigured, modelName } from './llm.js'

/**
 * Sinh "cau mo dau goi y cho account" — field cuoi trong ban ban giao 19 muc
 * cua tai lieu.
 *
 * Day la CHO DUY NHAT trong app dung LLM, va phan cong rat ro:
 *   - Rule engine  -> tinh diem, phan loai, chon giai phap  (tat dinh)
 *   - LLM          -> chi dien dat lai thanh mot cau nguoi doc duoc
 *
 * Model KHONG duoc: dat ra con so, neu gia, bia san pham. Neu model chet hoac
 * chua co key thi roi ve mau dung san — demo khong bao gio hien loi.
 */

const SYSTEM = `Bạn viết giúp chuyên viên bán hàng của Zalo một câu mở đầu để liên hệ doanh nghiệp.

YÊU CẦU:
- Tiếng Việt, 2-3 câu, dưới 400 ký tự. Giọng chuyên nghiệp nhưng không sáo.
- Gọi khách là "anh/chị", chuyên viên tự gọi là "em".
- Phải nhắc lại ĐÚNG vấn đề khách đã nêu, bằng từ ngữ của chính khách, để khách thấy được lắng nghe.
- Nêu tên giải pháp được đề xuất và một lý do ngắn gắn với vấn đề đó.
- Kết bằng một đề nghị cụ thể: xin một buổi trao đổi ngắn.

TUYỆT ĐỐI KHÔNG:
- Không viết bất kỳ CHỮ SỐ nào trong câu. Không giá, không phần trăm, không điểm,
  không thời gian triển khai, không cả số phút. Cần nói thời lượng thì viết bằng chữ.
- Không nhắc tới điểm qualification hay phân loại lead. Đó là dữ liệu nội bộ, khách không được biết.
- Không bịa thông tin ngoài dữ liệu được cung cấp: không tên quận, không số liệu, không tên sản phẩm khác.
- Không cam kết tính năng hay hứa hẹn kết quả.

Chỉ trả về đúng câu mở đầu. Không thêm lời dẫn, không thêm dấu ngoặc kép.`

function buildUserPrompt(lead) {
  const industry = INDUSTRY_NAME[lead.industry] ?? 'doanh nghiệp'
  return [
    `Doanh nghiệp: ${lead.companyName}`,
    `Người liên hệ: ${lead.contactName}`,
    `Ngành: ${industry}`,
    `Vấn đề khách đã nêu (nguyên văn): "${lead.painPoint}"`,
    `Giải pháp được đề xuất: ${lead.topSolution}`,
  ].join('\n')
}

/**
 * Cat mo ta van de thanh mot menh de gon de nhet vao giua cau mau.
 * Luon ha chu dau ve chu thuong — nam giua cau nen de hoa se doc thanh
 * "dang Khach quen hay dat ban...".
 */
function shortenPain(painPoint) {
  let s = String(painPoint || '')
    .split(/[.!?\n]/)[0]
    .trim()
  if (!s) return 'gặp một số vướng mắc trong việc chăm sóc khách hàng'

  if (s.length > 90) s = s.slice(0, 90).replace(/\s+\S*$/, '') + '…'
  return s.charAt(0).toLowerCase() + s.slice(1)
}

/** Ban du phong: khong goi model, dung duoc ngay, khong bao gio loi. */
export function templateOpeningLine(lead) {
  return (
    `Chào anh/chị ${lead.contactName}, em là chuyên viên bên Zalo for Business. ` +
    `Em nhận được thông tin ${lead.companyName} đang ${shortenPain(lead.painPoint)}. ` +
    `Với tình trạng này thì ${lead.topSolution} là hướng em nghĩ sẽ giải quyết được — ` +
    `anh/chị dành cho em một buổi trao đổi ngắn trong tuần này được không ạ?`
  )
}

/**
 * Tra ve { text, source, model, tokens }.
 *   source = 'llm'      -> model viet
 *   source = 'template' -> roi ve mau, kem `reason` giai thich vi sao
 */
export async function generateOpeningLine(lead) {
  if (!isConfigured()) {
    return {
      text: templateOpeningLine(lead),
      source: 'template',
      reason: 'Chưa cấu hình FPT_API_KEY nên dùng mẫu dựng sẵn.',
      model: null,
      tokens: null,
    }
  }

  try {
    const { text, model, tokens } = await complete({
      system: SYSTEM,
      user: buildUserPrompt(lead),
      maxTokens: 300,
      temperature: 0.5,
    })

    // Model doi khi bo cau tra loi trong dau nhay du da dan khong duoc
    const cleaned = text.replace(/^["'“”]+|["'“”]+$/g, '').trim()

    // Chan lai o tang code: neu model lo nhet con so vao thi khong dung.
    // Never List dieu 5 - khong con so chi phi nao ra ngoai.
    if (/\d/.test(cleaned)) {
      return {
        text: templateOpeningLine(lead),
        source: 'template',
        reason: 'Model chèn con số vào câu mở đầu nên đã loại, dùng mẫu dựng sẵn.',
        model,
        tokens,
      }
    }

    return { text: cleaned, source: 'llm', model, tokens }
  } catch (e) {
    if (!(e instanceof LlmError)) throw e
    return {
      text: templateOpeningLine(lead),
      source: 'template',
      reason: `Model ${modelName()} lỗi: ${e.message}`,
      model: null,
      tokens: null,
    }
  }
}
