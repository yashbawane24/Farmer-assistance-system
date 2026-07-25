import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import Otp from '../models/Otp';
import OtpRequestLog from '../models/OtpRequestLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendSMS, sendEmailOTP } from '../utils/otpSender';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforfarmerassistancesystem123!';

// Helper: validate standard 10-digit Indian phone number
const validatePhoneNumber = (mobile: string): boolean => {
  const regex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return regex.test(mobile);
};

// Helper: generate cryptographically secure 6-digit OTP
const generateNumericOTP = (): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits[crypto.randomInt(0, 10)];
  }
  return otp;
};

// Helper: hash OTP with SHA256
const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { mobile, email } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    if (!validatePhoneNumber(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please enter a valid 10-digit mobile number.'
      });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Rate Limiting: Max 5 OTP requests per hour per phone number
    const hourlyCount = await OtpRequestLog.countDocuments({
      mobile,
      requestedAt: { $gte: oneHourAgo }
    });

    if (hourlyCount >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Maximum 5 requests per hour. Please try again later.'
      });
    }

    // Cooldown: 60-second cooldown before requesting another OTP
    const latestLog = await OtpRequestLog.findOne({ mobile }).sort({ requestedAt: -1 });
    if (latestLog) {
      const timePassed = now.getTime() - latestLog.requestedAt.getTime();
      if (timePassed < 60 * 1000) {
        const secondsLeft = Math.ceil((60 * 1000 - timePassed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting another OTP.`,
          cooldownRemaining: secondsLeft
        });
      }
    }

    // Create a request log entry
    await new OtpRequestLog({ mobile, requestedAt: now }).save();

    // Generate OTP
    const otp = generateNumericOTP();
    const hashedOtp = hashOTP(otp);

    // Delivery Flow: Twilio SMS (Primary) -> Email (Fallback) -> Developer Terminal Log (Fallback)
    let delivered = false;
    let deliveryMethod = 'sms';

    // Attempt Twilio SMS
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      delivered = await sendSMS(mobile, `Your Smart Farmer System verification code is: ${otp}. Valid for 5 minutes.`);
    }

    // Attempt Email fallback if SMS is not configured or fails
    if (!delivered) {
      const user = await User.findOne({ mobile });
      const emailToUse = email || user?.email;
      if (emailToUse) {
        delivered = await sendEmailOTP(emailToUse, otp);
        deliveryMethod = 'email';
      }
    }

    // If both failed or are unconfigured, print to terminal console for local development testing
    if (!delivered) {
      console.log('\n=============================================================');
      console.log(`[OTP DEVELOPMENT BACKEND LOG] Generated OTP for ${mobile} is: ${otp}`);
      console.log('=============================================================\n');
      delivered = true;
      deliveryMethod = 'console';
    }

    // Save/Upsert hashed OTP in the database with 5-minute expiry
    await Otp.deleteMany({ mobile });
    await new Otp({
      mobile,
      otpHash: hashedOtp,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes expiry
    }).save();

    res.status(200).json({
      success: true,
      message: deliveryMethod === 'console'
        ? 'OTP generated (logged to server console in development)'
        : `OTP sent successfully via ${deliveryMethod}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
    }

    const now = new Date();
    const storedOtp = await Otp.findOne({ mobile });

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: 'OTP has expired or was not requested.' });
    }

    // Expiry check
    if (storedOtp.expiresAt < now) {
      await Otp.deleteOne({ mobile });
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    // Too many verification attempts check (Limit to 5)
    if (storedOtp.attempts >= 5) {
      await Otp.deleteOne({ mobile });
      return res.status(429).json({ success: false, message: 'Too many incorrect OTP attempts. Please request a new OTP.' });
    }

    // Hash comparison
    const inputHash = hashOTP(otp);
    if (storedOtp.otpHash !== inputHash) {
      storedOtp.attempts += 1;
      await storedOtp.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
    }

    // Successful verification: delete OTP
    await Otp.deleteOne({ mobile });

    // Check if user exists
    const user = await User.findOne({ mobile });

    if (!user) {
      // User needs to sign up (register profile)
      return res.status(200).json({
        success: true,
        isRegistered: false,
        message: 'OTP verified. Profile registration required.'
      });
    }

    // User exists, issue JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      success: true,
      isRegistered: true,
      token,
      user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, mobile, email, state, district, village, farmSize, primaryCrop, language } = req.body;

    if (!name || !mobile || !state || !district || !village) {
      return res.status(400).json({ success: false, message: 'Missing required profile fields' });
    }

    let user = await User.findOne({ mobile });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this mobile number' });
    }

    if (email) {
      const emailUser = await User.findOne({ email });
      if (emailUser) {
        return res.status(400).json({ success: false, message: 'User already exists with this email address' });
      }
    }

    // Check if first user, make admin, otherwise user
    const totalUsers = await User.countDocuments({});
    const role = totalUsers === 0 ? 'admin' : 'user';

    user = new User({
      name,
      mobile,
      email: email || undefined,
      state,
      district,
      village,
      farmSize: farmSize ? parseFloat(farmSize) : undefined,
      primaryCrop,
      language: language || 'en',
      role
    });

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const fieldsToUpdate = [
      'name', 'state', 'district', 'village', 'farmSize', 'primaryCrop', 'language', 'profilePicture'
    ];

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        (user as any)[field] = req.body[field];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { type, id } = req.body; // type: 'scheme' or 'marketPrice'
    if (!type || !id) {
      return res.status(400).json({ success: false, message: 'Type and ID are required' });
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const bookmarkList = type === 'scheme' ? user.bookmarks.schemes : user.bookmarks.marketPrices;
    const index = bookmarkList.indexOf(id);

    if (index > -1) {
      bookmarkList.splice(index, 1);
    } else {
      bookmarkList.push(id);
    }

    await user.save();

    res.status(200).json({
      success: true,
      bookmarks: user.bookmarks,
      message: index > -1 ? 'Bookmark removed' : 'Bookmark added'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
