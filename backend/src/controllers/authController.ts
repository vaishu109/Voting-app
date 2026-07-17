import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import { generateOTP, verifyOTP } from '../utils/otp';

const JWT_SECRET = process.env.JWT_SECRET || 'securevote_super_secret_jwt_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'securevote_super_secret_refresh_jwt_key_54321';

// Helper to generate a unique Voter ID: SV-YYYYY (5 random uppercase alphanumeric/numbers)
function generateVoterID(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'SV-';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const voterID = generateVoterID();

    // Check if it's the first registered user. If so, default to Admin
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'Admin' : (role || 'Voter');

    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString(); // Email verification code

    const user = new User({
      name,
      email,
      phone,
      voterID,
      passwordHash,
      role: assignedRole,
      verified: false,
      verificationToken
    });

    await user.save();

    // Log the action
    await new AuditLog({
      action: 'USER_REGISTERED',
      user: user.email,
      role: user.role,
      ipAddress: req.ip || '127.0.0.1',
      details: `Registered with Voter ID: ${user.voterID}`
    }).save();

    console.log(`[DEV EMAIL BYPASS] Verification token for ${user.email}: ${verificationToken}`);

    res.status(201).json({
      message: 'Registration successful! Verification email sent (simulated).',
      voterID: user.voterID,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.verified) {
      return res.status(400).json({ message: 'User is already verified.' });
    }

    if (user.verificationToken !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    await new AuditLog({
      action: 'USER_EMAIL_VERIFIED',
      user: user.email,
      role: user.role,
      ipAddress: req.ip || '127.0.0.1',
      details: 'Account successfully verified.'
    }).save();

    res.json({ message: 'Account verified successfully! You can now log in.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { voterID, password } = req.body;

    if (!voterID || !password) {
      return res.status(400).json({ message: 'Voter ID and password are required.' });
    }

    const user = await User.findOne({ voterID });
    if (!user) {
      return res.status(401).json({ message: 'Invalid Voter ID or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Voter ID or password.' });
    }

    if (!user.verified) {
      // Re-trigger verification code just in case
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationToken = verificationToken;
      await user.save();
      console.log(`[DEV EMAIL BYPASS] Re-sent verification token for ${user.email}: ${verificationToken}`);

      return res.status(403).json({
        message: 'Account not verified. Verification code has been sent (simulated).',
        unverified: true,
        email: user.email
      });
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      const otp = generateOTP(user.email);
      return res.json({
        message: 'Two-Factor Authentication required.',
        require2FA: true,
        email: user.email
      });
    }

    // Standard JWT generation
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await new AuditLog({
      action: 'USER_LOGIN_SUCCESS',
      user: user.email,
      role: user.role,
      ipAddress: req.ip || '127.0.0.1'
    }).save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        voterID: user.voterID,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verify2FALogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and OTP code are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isOTPValid = verifyOTP(email, code);
    if (!isOTPValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // JWT generation
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await new AuditLog({
      action: 'USER_2FA_LOGIN_SUCCESS',
      user: user.email,
      role: user.role,
      ipAddress: req.ip || '127.0.0.1'
    }).save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        voterID: user.voterID,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    jwt.verify(token, JWT_REFRESH_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired refresh token.' });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In stateless JWT, logout is usually managed client-side, but we can log the event.
    const { email } = req.body;
    if (email) {
      const user = await User.findOne({ email });
      await new AuditLog({
        action: 'USER_LOGOUT',
        user: email,
        role: user?.role || 'unknown',
        ipAddress: req.ip || '127.0.0.1'
      }).save();
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email.' });
    }

    // Set 6-digit reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    console.log(`[DEV EMAIL BYPASS] Reset password token for ${email}: ${resetToken}`);

    res.json({ message: 'Password reset code sent to email (simulated).' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await new AuditLog({
      action: 'USER_PASSWORD_RESET_SUCCESS',
      user: user.email,
      role: user.role,
      ipAddress: req.ip || '127.0.0.1'
    }).save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    next(error);
  }
};

export const toggle2FA = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();

    await new AuditLog({
      action: `USER_2FA_${user.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}`,
      user: user.email,
      role: user.role,
      ipAddress: req.ip || '127.0.0.1'
    }).save();

    res.json({
      message: `Two-Factor Authentication ${user.twoFactorEnabled ? 'enabled' : 'disabled'} successfully.`,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    next(error);
  }
};
