import cron from "node-cron";
import app from "./app";
import config from "./config/env";
import prisma from "./config/prisma";

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📦 Môi trường: ${config.env}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1\n`);

  // Cron job: dọn OTP hết hạn mỗi 5 phút
  cron.schedule("*/5 * * * *", async () => {
    const { count } = await prisma.otpCode.deleteMany({
      where: { expired_at: { lt: new Date() } },
    });
    if (count > 0) {
      console.log(`🧹 Đã xoá ${count} OTP hết hạn`);
    }
  });
});
