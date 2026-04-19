import nodemailer from "nodemailer";
import config from "../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.email.user,
    pass: config.email.appPassword,
  },
});

function buildOtpHtml(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F3F0EE;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="background:#FFFFFF;border-radius:24px;overflow:hidden;
               box-shadow:rgba(0,0,0,0.08) 0px 24px 48px 0px;">

        <!-- Header -->
        <tr>
          <td style="background:#141413;padding:32px 40px;">
            <p style="margin:0;color:#F3F0EE;font-size:22px;font-weight:600;letter-spacing:-0.4px;">
              🛍️ E-Commerce
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.52px;
                      text-transform:uppercase;color:#F37338;">
              • XÁC THỰC TÀI KHOẢN
            </p>
            <h1 style="margin:0 0 16px;font-size:28px;font-weight:600;
                        letter-spacing:-0.56px;color:#141413;line-height:1.2;">
              Mã OTP của bạn
            </h1>
            <p style="margin:0 0 32px;font-size:15px;color:#696969;line-height:1.6;">
              Dùng mã bên dưới để hoàn tất đăng ký tài khoản. Mã có hiệu lực trong
              <strong style="color:#141413;">5 phút</strong>.
            </p>

            <!-- OTP Box -->
            <div style="background:#F3F0EE;border-radius:16px;padding:24px;
                        text-align:center;margin-bottom:32px;">
              <p style="margin:0;font-size:48px;font-weight:700;letter-spacing:12px;
                         color:#141413;font-family:'Courier New',monospace;">
                ${otp}
              </p>
            </div>

            <p style="margin:0 0 8px;font-size:13px;color:#696969;line-height:1.6;">
              Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.
              Tài khoản sẽ không được tạo nếu không có mã OTP hợp lệ.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid rgba(20,20,19,0.08);padding:20px 40px;">
            <p style="margin:0;font-size:12px;color:#D1CDC7;">
              © ${new Date().getFullYear()} E-Commerce Platform. Mã chỉ dùng một lần và hết hạn sau 5 phút.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const emailService = {
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await transporter.sendMail({
      from: `"E-Commerce" <${config.email.user}>`,
      to,
      subject: `[E-Commerce] Mã OTP xác thực của bạn: ${otp}`,
      html: buildOtpHtml(otp),
    });
  },

  async verifyConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      return true;
    } catch {
      return false;
    }
  },
};

export default emailService;
