import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import bcrypt from 'bcryptjs';

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone, profilePhoto } = req.body;
    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    await new AuditLog({
      action: 'USER_PROFILE_UPDATED',
      user: user.email,
      role: user.role,
      ipAddress: req.ip || '127.0.0.1',
      details: 'Updated profile details.'
    }).save();

    res.json({
      message: 'Profile updated successfully.',
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

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required.' });
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid current password.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await new AuditLog({
      action: 'USER_PASSWORD_CHANGED',
      user: user.email,
      role: user.role,
      ipAddress: req.ip || '127.0.0.1'
    }).save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Admin operations on users
export const getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUserVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, verified } = req.body;

    if (userId === req.user?.id) {
      return res.status(400).json({ message: 'Cannot modify your own status.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.verified = verified;
    await user.save();

    await new AuditLog({
      action: `ADMIN_USER_VERIFIED_SET`,
      user: req.user?.email || 'admin',
      role: 'Admin',
      ipAddress: req.ip || '127.0.0.1',
      details: `Set verified = ${verified} for voter ${user.email}`
    }).save();

    res.json({ message: 'User verification status updated.', user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const email = user.email;
    await User.findByIdAndDelete(id);

    await new AuditLog({
      action: 'ADMIN_USER_DELETED',
      user: req.user?.email || 'admin',
      role: 'Admin',
      ipAddress: req.ip || '127.0.0.1',
      details: `Deleted user: ${email}`
    }).save();

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
