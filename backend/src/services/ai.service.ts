import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError } from "../middlewares/error.middleware";
import config from "../config/env";

const MODEL = "gemini-3-flash-preview";

async function generateContent(prompt: string): Promise<string> {
  if (!config.gemini.apiKey) {
    throw new AppError("Tính năng AI chưa được cấu hình", 503);
  }

  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err: any) {
    const msg: string = err?.message ?? "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
      throw new AppError("Dịch vụ AI đang bận, vui lòng thử lại sau ít phút", 503);
    }
    if (msg.includes("API_KEY") || msg.includes("401") || msg.includes("403")) {
      throw new AppError("Cấu hình AI không hợp lệ, vui lòng liên hệ quản trị viên", 503);
    }
    throw new AppError("Không thể tạo nội dung lúc này, vui lòng thử lại", 503);
  }
}

export const aiService = {
  async suggestShopDescription(shopName: string, categories?: string[]): Promise<string> {
    const categoryLine =
      categories && categories.length > 0
        ? `Shop kinh doanh các danh mục: ${categories.join(", ")}.`
        : "";

    const prompt = `Viết đoạn mô tả shop bằng tiếng Việt cho shop tên "${shopName}". ${categoryLine}
Yêu cầu:
- Độ dài từ 20 đến 200 ký tự.
- Tự nhiên, hấp dẫn, phù hợp với nền tảng thương mại điện tử.
- Chỉ trả về đoạn mô tả, không thêm tiêu đề hay giải thích.`;

    return generateContent(prompt);
  },
};
