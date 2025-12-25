

// backend/src/routes/upload.routes.js
import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import Admin from '../models/Admin.js';
import Bestie from '../models/Bestie.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/avi', 'video/x-msvideo',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Upload to Cloudinary utility
const uploadToCloudinary = async (fileBuffer, mimeType, folder, publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folder,
        public_id: publicId,
        overwrite: false,
        timeout: 60000
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
};

// 1. Upload Profile Photo (Admin)

// backend/src/routes/upload.routes.js - Updated Profile Upload Section
router.post('/admin/profile',protect, upload.single('file'), async (req, res) => {
  try {

    // 1. Validate request
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const adminId = req.admin._id;
    console.log(req.body)
    if (!adminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin ID is required' 
      });
    }

    // 2. Find admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // 3. Delete old photo from Cloudinary if exists
    if (admin.profilePhotoPublicId) {
      try {
        await cloudinary.uploader.destroy(admin.profilePhotoPublicId);
      } catch (cloudinaryError) {
        console.warn('Failed to delete old Cloudinary image:', cloudinaryError);
        // Continue anyway - we don't want to block the upload
      }
    }

    // 4. Upload new photo to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      'bestiespace/admin/profile'
    );

    // 5. Update admin in database
    admin.profilePhoto = result.secure_url;
    admin.profilePhotoPublicId = result.public_id;
    await admin.save();

    // 6. Return success response
    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        profilePhoto: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          profilePhoto: admin.profilePhoto,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Profile upload error:', error);
    
    if (error.message.includes('File size too large')) {
      return res.status(400).json({ 
        success: false, 
        message: 'File size exceeds 100MB limit' 
      });
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type. Only image files are allowed.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update profile photo' 
    });
  }
});

// 2. Upload Gallery Photos (Bestie)
router.post('/besties/gallery', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { bestieId } = req.body;
    if (!bestieId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bestie ID is required' 
      });
    }

    // Find bestie
    const bestie = await Bestie.findById(bestieId);
    if (!bestie) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bestie not found' 
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      `bestiespace/gallery/${bestieId}`
    );

    // Create gallery image object
    const galleryImage = {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      uploadedAt: new Date(),
      filename: req.file.originalname
    };

    // Add to bestie's galleryImages array
    bestie.galleryImages.push(galleryImage);
    await bestie.save();

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      galleryImageId: galleryImage._id,
      bestie: {
        id: bestie._id,
        name: bestie.name,
        galleryCount: bestie.galleryImages.length
      },
      message: 'Gallery photo uploaded and saved successfully'
    });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload gallery photo'
    });
  }
});

// 3. Upload Dedicated Song (Video/Audio)
router.post('/besties/song', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { bestieId } = req.body;
    if (!bestieId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bestie ID is required' 
      });
    }

    // Find bestie
    const bestie = await Bestie.findById(bestieId);
    if (!bestie) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bestie not found' 
      });
    }

    // Determine resource type
    let resourceType = 'auto';
    if (req.file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (req.file.mimetype.startsWith('audio/')) {
      resourceType = 'video';
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: `bestiespace/songs/${bestieId}`,
          timeout: 120000
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      const stream = Readable.from(req.file.buffer);
      stream.pipe(uploadStream);
    });

    // Update bestie with song dedication
    const songData = {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      duration: result.duration,
      size: result.bytes,
      format: result.format,
      uploadedAt: new Date(),
      filename: req.file.originalname
    };

    bestie.songDedication = songData.url;
    bestie.songDedicationData = songData;
    await bestie.save();

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      duration: result.duration,
      bytes: result.bytes,
      format: result.format,
      bestie: {
        id: bestie._id,
        name: bestie.name,
        songDedication: bestie.songDedication
      },
      message: 'Song uploaded and saved successfully'
    });
  } catch (error) {
    console.error('Song upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload song'
    });
  }
});

// 4. Upload Playlist Audio
// router.post('/besties/playlist', upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'No file uploaded' 
//       });
//     }

//     const { bestieId, songIndex } = req.body;
//     if (!bestieId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Bestie ID is required' 
//       });
//     }

//     // Find bestie
//     const bestie = await Bestie.findById(bestieId);
//     if (!bestie) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Bestie not found' 
//       });
//     }

//     // Generate unique public ID
//     const publicId = songIndex !== undefined 
//       ? `playlist_${bestieId}_${songIndex}_${Date.now()}`
//       : null;

//     // Upload to Cloudinary
//     const result = await uploadToCloudinary(
//       req.file.buffer,
//       req.file.mimetype,
//       `bestiespace/playlist/${bestieId}`,
//       publicId
//     );

//     // Create playlist item
//     const playlistItem = {
//       audioUrl: result.secure_url,
//       publicId: result.public_id,
//       format: result.format,
//       size: result.bytes,
//       duration: result.duration,
//       uploadedAt: new Date(),
//       filename: req.file.originalname
//     };

//     if (songIndex !== undefined) {
//         const index = parseInt(songIndex);
//       // Update existing playlist item
//       if (bestie.playlist[index]) {
//         bestie.playlist[index] = {
//           ...bestie.playlist[index],
//           ...playlistItem
//         };
//       }
//     } else {
//       // Add new playlist item
//       bestie.playlist.push(playlistItem);
//     }

//     await bestie.save();

//     res.json({
//       success: true,
//       url: result.secure_url,
//       publicId: result.public_id,
//       format: result.format,
//       bytes: result.bytes,
//       duration: result.duration,
//       playlistItem: playlistItem,
//       bestie: {
//         id: bestie._id,
//         name: bestie.name,
//         playlistCount: bestie.playlist.length
//       },
//       message: 'Playlist audio uploaded and saved successfully'
//     });
//   } catch (error) {
//     console.error('Playlist upload error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message || 'Failed to upload playlist audio'
//     });
//   }
// });

// backend/src/routes/upload.routes.js - Playlist upload section
router.post('/besties/playlist', upload.single('file'), async (req, res) => {
  try {
    // 1. Validate request
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { bestieId, songIndex, title, artist, link } = req.body;
    
    if (!bestieId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bestie ID is required' 
      });
    }

    // 2. Check if bestie exists
    const bestie = await Bestie.findById(bestieId);
    if (!bestie) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bestie not found' 
      });
    }

    // 3. Upload to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `bestiespace/playlist/${bestieId}`,
      resource_type: 'video', // Cloudinary treats audio as video
      public_id: songIndex !== undefined 
        ? `playlist_${bestieId}_${songIndex}_${Date.now()}`
        : undefined,
      overwrite: false,
      timeout: 120000
    });

    // 4. Create playlist item object
    const playlistItem = {
      title: title || (songIndex !== undefined && bestie.playlist[songIndex]?.title) || "New Song",
      artist: artist || (songIndex !== undefined && bestie.playlist[songIndex]?.artist) || "",
      link: link || (songIndex !== undefined && bestie.playlist[songIndex]?.link) || "",
      audioUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      duration: result.duration || 0,
      filename: req.file.originalname,
      uploadedAt: new Date()
    };

    // 5. Save to database
    if (songIndex !== undefined && songIndex !== '') {
      // Update existing playlist item
      const index = parseInt(songIndex);
      
      if (index >= 0 && index < bestie.playlist.length) {
        // Update existing item
        bestie.playlist[index] = {
          ...bestie.playlist[index],
          ...playlistItem
        };
      } else {
        // Invalid index, add as new item
        bestie.playlist.push(playlistItem);
      }
    } else {
      // Add new playlist item
      bestie.playlist.push(playlistItem);
    }

    // 6. Save changes
    await bestie.save();

    // 7. Get the updated item
    const updatedIndex = songIndex !== undefined && songIndex !== '' 
      ? parseInt(songIndex) 
      : bestie.playlist.length - 1;
    const savedItem = bestie.playlist[updatedIndex];

    // 8. Return success response
    res.json({
      success: true,
      message: 'Playlist audio uploaded and saved successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration,
        playlistItem: savedItem,
        index: updatedIndex,
        bestie: {
          id: bestie._id,
          name: bestie.name,
          playlistCount: bestie.playlist.length
        }
      }
    });
  } catch (error) {
    console.error('Playlist upload error:', error);
    
    // Handle specific errors
    if (error.message.includes('File size too large')) {
      return res.status(400).json({ 
        success: false, 
        message: 'File size exceeds 100MB limit' 
      });
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type. Only audio files are allowed.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload playlist audio' 
    });
  }
});

// Multer error handling
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
});

export default router;