import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforfarmerassistancesystem123!';

// Mock storage for active OTPs (mobile -> OTP)
const otpStore: Record<string, string> = {};

// Generate a random 6 digit OTP or fallback '123456'
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    // Generate simulated OTP
    const otp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[mobile] = otp;

    console.log(`[SIMULATED Firebase OTP] OTP for ${mobile} is: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully (Simulated)',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Hide OTP in production
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

    const storedOtp = otpStore[mobile];
    
    // In dev, bypass OTP checks with 123456 or match the store
    const isMockBypass = process.env.NODE_ENV === 'development' && otp === '123456';
    const isVerified = isMockBypass || (storedOtp && storedOtp === otp);

    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clean up OTP store
    delete otpStore[mobile];

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

    // User exists, issue token
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
    const { name, mobile, state, district, village, farmSize, primaryCrop, language } = req.body;

    if (!name || !mobile || !state || !district || !village) {
      return res.status(400).json({ success: false, message: 'Missing required profile fields' });
    }

    let user = await User.findOne({ mobile });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this mobile number' });
    }

    // Check if first user, make admin, otherwise user
    const totalUsers = await User.countDocuments({});
    const role = totalUsers === 0 ? 'admin' : 'user';

    user = new User({
      name,
      mobile,
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
