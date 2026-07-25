import twilio from 'twilio';
import nodemailer from 'nodemailer';

/**
 * Sends a real SMS via Twilio Messages API.
 * @param to Phone number to send to.
 * @param body SMS content.
 * @returns Promise<boolean> indicating successful delivery request.
 */
export const sendSMS = async (to: string, body: string): Promise<boolean> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[OTP SMS Service] Missing Twilio configuration. SMS will not be sent.');
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);
    
    // Format to +91 (India) if it is a 10-digit number and has no prefix
    let formattedTo = to;
    if (!to.startsWith('+')) {
      if (to.length === 10) {
        formattedTo = `+91${to}`;
      } else {
        formattedTo = `+${to}`;
      }
    }

    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo
    });

    console.log(`[OTP SMS Service] SMS sent successfully to ${formattedTo}. Message SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('[OTP SMS Service] Failed to send SMS via Twilio:', error.message || error);
    return false;
  }
};

/**
 * Sends an OTP email fallback via Nodemailer SMTP.
 * @param toEmail Recipient email address.
 * @param otp The generated numeric OTP.
 * @returns Promise<boolean> indicating successful email delivery.
 */
export const sendEmailOTP = async (toEmail: string, otp: string): Promise<boolean> => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || '"Smart Farmer System" <noreply@gmail.com>';

  if (!user || !pass) {
    console.warn('[OTP Email Service] Missing SMTP credentials (EMAIL_USER/EMAIL_PASS). Email will not be sent.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    });

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'Smart Farmer System - OTP Verification Code',
      text: `Your Smart Farmer System verification code is: ${otp}. It is valid for 5 minutes. Please do not share it with anyone.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 30px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 40px;">🌱</span>
            <h2 style="color: #16a34a; margin: 10px 0 0 0; font-size: 22px; font-weight: 700;">Smart Farmer System</h2>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 15px 0;">Hello,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">Please use the following verification code to log in to your Smart Farmer account. This code is valid for <strong>5 minutes</strong>.</p>
          <div style="text-align: center; margin: 25px 0;">
            <div style="display: inline-block; letter-spacing: 6px; font-size: 32px; font-weight: 800; color: #0f172a; background-color: #f8fafc; padding: 14px 28px; border-radius: 12px; border: 1px dashed #cbd5e1; user-select: all;">
              ${otp}
            </div>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">If you did not request this verification code, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">© 2026 Smart Farmer Assistance System. All rights reserved.</p>
        </div>
      `
    });

    console.log(`[OTP Email Service] OTP email sent successfully to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error('[OTP Email Service] Failed to send email via SMTP:', error.message || error);
    return false;
  }
};
