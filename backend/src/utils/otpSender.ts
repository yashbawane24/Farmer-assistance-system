import nodemailer from 'nodemailer';

/**
 * Sends a real verification OTP email using Gmail SMTP via Nodemailer.
 * @param toEmail Recipient email address.
 * @param otp The generated 6-digit OTP.
 * @returns Promise<boolean> indicating successful delivery.
 */
export const sendEmailOTP = async (toEmail: string, otp: string): Promise<boolean> => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error('[Gmail SMTP Service] Missing EMAIL_USER or EMAIL_PASS environment variables.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });

    await transporter.sendMail({
      from: `"Smart Farmer Assistance System" <${user}>`,
      to: toEmail,
      subject: 'Your Verification Code',
      text: `Your Smart Farmer Assistance System verification code is: ${otp}. It is valid for 5 minutes. Please do not share it with anyone.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 30px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 40px;">🌱</span>
            <h2 style="color: #16a34a; margin: 10px 0 0 0; font-size: 22px; font-weight: 700;">Smart Farmer Assistance System</h2>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 15px 0;">Hello,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">Your verification code for accessing the Smart Farmer Assistance System is shown below. This code is valid for <strong>5 minutes</strong>.</p>
          <div style="text-align: center; margin: 25px 0;">
            <div style="display: inline-block; letter-spacing: 6px; font-size: 32px; font-weight: 800; color: #0f172a; background-color: #f8fafc; padding: 14px 28px; border-radius: 12px; border: 1px dashed #cbd5e1; user-select: all;">
              ${otp}
            </div>
          </div>
          <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin: 15px 0 0 0;">⚠️ Security Notice: Do NOT share this code with anyone.</p>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 10px 0 0 0;">If you did not request this code, you can safely ignore this message.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">© 2026 Smart Farmer Assistance System. All rights reserved.</p>
        </div>
      `
    });

    console.log(`[Gmail SMTP Service] OTP email delivered successfully to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error('[Gmail SMTP Service] Email delivery failure:', error.message || error);
    return false;
  }
};
