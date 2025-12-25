
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

/**
 * GET ADMIN PROFILE
 */
export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        profilePhoto: admin.profilePhoto,
        profilePhotoPublicId: admin.profilePhotoPublicId,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

/**
 * UPDATE ADMIN PROFILE (Name and Email are READ-ONLY, only photo updates via upload route)
 */
export const updateProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Note: Name and email cannot be changed through this endpoint
    // Only update profile photo if uploaded via separate upload route
    
    // If no file was uploaded, just return current profile
    if (!req.file) {
      return res.json({
        success: true,
        message: 'No changes made to profile',
        data: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          profilePhoto: admin.profilePhoto,
          profilePhotoPublicId: admin.profilePhotoPublicId,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      });
    }

    res.json({
      success: true,
      message: 'Profile photo should be updated via /upload/admin/profile endpoint',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        profilePhoto: admin.profilePhoto,
        profilePhotoPublicId: admin.profilePhotoPublicId
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * UPDATE PASSWORD
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const admin = await Admin.findById(req.admin._id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isPasswordValid = await admin.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
};

/**
 * UPDATE ADMIN DETAILS (Only if needed in future)
 */
export const updateAdminDetails = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Note: Name and email cannot be changed for security reasons
    // This endpoint is kept for future extensions if needed
    
    res.json({
      success: true,
      message: 'Admin details cannot be modified',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        profilePhoto: admin.profilePhoto,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Update admin details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin details'
    });
  }
};