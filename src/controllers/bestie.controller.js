import Bestie from "../models/Bestie.js";

/**
 * CREATE BESTIE
 */
export const createBestie = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.nickname) {
      return res.status(400).json({ 
        success: false,
        message: "Name and nickname are required" 
      });
    }

    // Check if nickname is already taken by this admin
    const existingBestie = await Bestie.findOne({ 
      adminId: req.admin._id, 
      nickname: req.body.nickname 
    });
    
    if (existingBestie) {
      return res.status(400).json({ 
        success: false,
        message: "Nickname already exists for your account" 
      });
    }

    // Create bestie with initial data
    const bestie = await Bestie.create({
      adminId: req.admin._id,
      name: req.body.name,
      nickname: req.body.nickname,
      messages: req.body.messages || ["", ""],
      playlist: req.body.playlist || [],
      jokes: req.body.jokes || [],
      reasons: req.body.reasons || [],
      questions: req.body.questions || [],
      // Files will be handled separately through upload routes
      songDedication: req.body.songDedication || "",
      galleryImages: req.body.galleryImages || [],
      isPublished: req.body.isPublished || false
    });

    res.status(201).json({
      success: true,
      message: "Bestie created successfully",
      bestie: {
        _id: bestie._id,
        name: bestie.name,
        nickname: bestie.nickname,
        secretCode: bestie.secretCode,
        isPublished: bestie.isPublished,
        createdAt: bestie.createdAt
      }
    });
  } catch (err) {
    console.error('Create bestie error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to create bestie" 
    });
  }
};

/**
 * GET ALL BESTIES (ADMIN)
 */
export const getBesties = async (req, res) => {
  try {
    const besties = await Bestie.find({ adminId: req.admin._id })
      .select('-galleryImages -playlist -messages -jokes -questions -reasons -playlistFiles')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      besties,
      count: besties.length
    });
  } catch (err) {
    console.error('Get besties error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch besties" 
    });
  }
};

/**
 * GET BESTIE BY ID (ADMIN)
 */
export const getBestieById = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    res.json({
      success: true,
      bestie
    });
  } catch (err) {
    console.error('Get bestie by ID error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch bestie" 
    });
  }
};

/**
 * GET BESTIE BY SECRET CODE (PUBLIC)
 */
/**
 * GET BESTIE BY SECRET CODE (PUBLIC) with Admin/Creator info
 */
export const getBestieByCode = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      secretCode: req.params.secretCode,
      isPublished: true,
    }).populate('adminId', 'name profilePhoto'); // Populate admin info

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found or not published" 
      });
    }

    // Return all public data
    const publicBestie = {
      _id: bestie._id,
      name: bestie.name,
      nickname: bestie.nickname,
      secretCode: bestie.secretCode,
      songDedication: bestie.songDedication,
      songDedicationData: bestie.songDedicationData,
      messages: bestie.messages,
      galleryImages: bestie.galleryImages,
      playlist: bestie.playlist,
      jokes: bestie.jokes,
      questions: bestie.questions,
      reasons: bestie.reasons,
      createdAt: bestie.createdAt,
      // Admin/Creator info
      creator: {
        id: bestie.adminId._id,
        name: bestie.adminId.name,
        profilePhoto: bestie.adminId.profilePhoto
      }
    };

    res.json({
      success: true,
      bestie: publicBestie
    });
  } catch (err) {
    console.error('Get bestie by code error:', err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};
/**
 * UPDATE BESTIE
 */
export const updateBestie = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    // Check if updating nickname to an existing one
    if (req.body.nickname && req.body.nickname !== bestie.nickname) {
      const existingNickname = await Bestie.findOne({
        adminId: req.admin._id,
        nickname: req.body.nickname,
        _id: { $ne: bestie._id }
      });
      
      if (existingNickname) {
        return res.status(400).json({ 
          success: false,
          message: "Nickname already exists for your account" 
        });
      }
    }

    // Update fields
    const updatableFields = [
      'name', 'nickname', 'messages', 'playlist', 'jokes', 
      'questions', 'reasons', 'songDedication', 'isPublished'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        bestie[field] = req.body[field];
      }
    });

    // Handle song dedication data if provided
    if (req.body.songDedicationData) {
      bestie.songDedicationData = {
        ...bestie.songDedicationData,
        ...req.body.songDedicationData,
        updatedAt: new Date()
      };
    }

    // Update gallery images if provided
    if (req.body.galleryImages) {
      bestie.galleryImages = req.body.galleryImages;
    }

    await bestie.save();

    res.json({
      success: true,
      message: "Bestie updated successfully",
      bestie: {
        _id: bestie._id,
        name: bestie.name,
        nickname: bestie.nickname,
        secretCode: bestie.secretCode,
        isPublished: bestie.isPublished,
        updatedAt: bestie.updatedAt
      }
    });
  } catch (err) {
    console.error('Update bestie error:', err);
    res.status(500).json({ 
      success: false,
      message: "Update failed" 
    });
  }
};

/**
 * DELETE BESTIE
 */
export const deleteBestie = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    // Note: Cloudinary files are not deleted automatically
    // You might want to add a cleanup function for Cloudinary files
    // This would require storing publicIds for all uploaded files

    await bestie.deleteOne();
    
    res.json({ 
      success: true,
      message: "Bestie deleted successfully" 
    });
  } catch (err) {
    console.error('Delete bestie error:', err);
    res.status(500).json({ 
      success: false,
      message: "Delete failed" 
    });
  }
};

/**
 * TOGGLE PUBLISH
 */
export const togglePublishBestie = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    bestie.isPublished = !bestie.isPublished;
    await bestie.save();

    res.json({
      success: true,
      message: bestie.isPublished 
        ? "Bestie published successfully" 
        : "Bestie unpublished successfully",
      isPublished: bestie.isPublished,
      secretCode: bestie.secretCode
    });
  } catch (err) {
    console.error('Toggle publish error:', err);
    res.status(500).json({ 
      success: false,
      message: "Publish toggle failed" 
    });
  }
};

/**
 * ADD GALLERY IMAGE
 */
export const addGalleryImage = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    if (!req.body.image) {
      return res.status(400).json({ 
        success: false,
        message: "Image data is required" 
      });
    }

    const newImage = {
      url: req.body.image.url,
      publicId: req.body.image.publicId,
      format: req.body.image.format,
      size: req.body.image.size,
      filename: req.body.image.filename,
      uploadedAt: new Date()
    };

    bestie.galleryImages.push(newImage);
    await bestie.save();

    res.json({
      success: true,
      message: "Gallery image added successfully",
      image: newImage,
      galleryCount: bestie.galleryImages.length
    });
  } catch (err) {
    console.error('Add gallery image error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to add gallery image" 
    });
  }
};

/**
 * REMOVE GALLERY IMAGE
 */
export const removeGalleryImage = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ 
        success: false,
        message: "Public ID is required" 
      });
    }

    const initialLength = bestie.galleryImages.length;
    bestie.galleryImages = bestie.galleryImages.filter(
      img => img.publicId !== publicId
    );

    if (bestie.galleryImages.length === initialLength) {
      return res.status(404).json({ 
        success: false,
        message: "Image not found in gallery" 
      });
    }

    await bestie.save();

    // Note: You might want to delete from Cloudinary here
    // cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: "Gallery image removed successfully",
      galleryCount: bestie.galleryImages.length
    });
  } catch (err) {
    console.error('Remove gallery image error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to remove gallery image" 
    });
  }
};

/**
 * UPDATE SONG DEDICATION
 */
export const updateSongDedication = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    const { url, publicId, resourceType, duration, size, format, filename } = req.body;

    bestie.songDedication = url;
    bestie.songDedicationData = {
      url,
      publicId,
      resourceType,
      duration,
      size,
      format,
      filename,
      uploadedAt: new Date()
    };

    await bestie.save();

    res.json({
      success: true,
      message: "Song dedication updated successfully",
      songDedication: bestie.songDedication
    });
  } catch (err) {
    console.error('Update song dedication error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update song dedication" 
    });
  }
};




/**
 * ADD PLAYLIST ITEM (Audio Upload + Metadata)
 */
export const addPlaylistItem = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    const { title, artist, link, audioUrl, publicId, format, size, duration, filename } = req.body;

    const newPlaylistItem = {
      title: title || "Untitled Song",
      artist: artist || "Unknown Artist",
      link: link || "",
      audioUrl: audioUrl || "",
      publicId: publicId || "",
      format: format || "",
      size: size || 0,
      duration: duration || 0,
      filename: filename || "",
      uploadedAt: new Date()
    };

    bestie.playlist.push(newPlaylistItem);
    await bestie.save();

    res.json({
      success: true,
      message: "Playlist item added successfully",
      playlistItem: newPlaylistItem,
      playlistCount: bestie.playlist.length
    });
  } catch (err) {
    console.error('Add playlist item error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to add playlist item" 
    });
  }
};

/**
 * REMOVE PLAYLIST ITEM
 */
export const removePlaylistItem = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    const { index } = req.params;
    const itemIndex = parseInt(index);

    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= bestie.playlist.length) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid playlist index" 
      });
    }

    const removedItem = bestie.playlist[itemIndex];
    
    // Optional: Delete from Cloudinary
    // if (removedItem.publicId) {
    //   await cloudinary.uploader.destroy(removedItem.publicId);
    // }

    bestie.playlist.splice(itemIndex, 1);
    await bestie.save();

    res.json({
      success: true,
      message: "Playlist item removed successfully",
      removedItem,
      playlistCount: bestie.playlist.length
    });
  } catch (err) {
    console.error('Remove playlist item error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to remove playlist item" 
    });
  }
};

/**
 * UPDATE PLAYLIST ITEM (Metadata only - not audio file)
 */
export const updatePlaylistItem = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    const { index } = req.params;
    const itemIndex = parseInt(index);
    const { title, artist, link } = req.body;

    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= bestie.playlist.length) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid playlist index" 
      });
    }

    // Update only metadata fields
    if (title !== undefined) bestie.playlist[itemIndex].title = title;
    if (artist !== undefined) bestie.playlist[itemIndex].artist = artist;
    if (link !== undefined) bestie.playlist[itemIndex].link = link;

    await bestie.save();

    res.json({
      success: true,
      message: "Playlist item updated successfully",
      playlistItem: bestie.playlist[itemIndex]
    });
  } catch (err) {
    console.error('Update playlist item error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to update playlist item" 
    });
  }
};

/**
 * UPLOAD PLAYLIST AUDIO (Separate function for audio upload only)
 */
export const uploadPlaylistAudio = async (req, res) => {
  try {
    const bestie = await Bestie.findOne({
      _id: req.params.id,
      adminId: req.admin._id,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found" 
      });
    }

    const { index } = req.params;
    const itemIndex = parseInt(index);
    const { audioUrl, publicId, format, size, duration, filename } = req.body;

    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= bestie.playlist.length) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid playlist index" 
      });
    }

    if (!audioUrl) {
      return res.status(400).json({ 
        success: false,
        message: "Audio URL is required" 
      });
    }

    // Update audio file fields
    bestie.playlist[itemIndex].audioUrl = audioUrl;
    bestie.playlist[itemIndex].publicId = publicId || bestie.playlist[itemIndex].publicId;
    bestie.playlist[itemIndex].format = format || bestie.playlist[itemIndex].format;
    bestie.playlist[itemIndex].size = size || bestie.playlist[itemIndex].size;
    bestie.playlist[itemIndex].duration = duration || bestie.playlist[itemIndex].duration;
    bestie.playlist[itemIndex].filename = filename || bestie.playlist[itemIndex].filename;
    bestie.playlist[itemIndex].uploadedAt = new Date();

    await bestie.save();

    res.json({
      success: true,
      message: "Playlist audio uploaded successfully",
      playlistItem: bestie.playlist[itemIndex]
    });
  } catch (err) {
    console.error('Upload playlist audio error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to upload playlist audio" 
    });
  }
};



/**
 * ANSWER QUESTION (Bestie answering admin's questions)
 */
export const answerQuestion = async (req, res) => {
  try {
    const { secretCode } = req.params;
    const { questionIndex, answer } = req.body;

    if (questionIndex === undefined || !answer) {
      return res.status(400).json({ 
        success: false,
        message: "Question index and answer are required" 
      });
    }

    // Find bestie by secret code (no auth needed for public)
    const bestie = await Bestie.findOne({
      secretCode: secretCode,
      isPublished: true,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found or not published" 
      });
    }

    // Validate question index
    if (questionIndex < 0 || questionIndex >= bestie.questions.length) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid question index" 
      });
    }

    // Update the answer
    bestie.questions[questionIndex].answer = answer;
    await bestie.save();

    res.json({
      success: true,
      message: "Answer submitted successfully!",
      data: {
        question: bestie.questions[questionIndex],
        index: questionIndex
      }
    });
  } catch (err) {
    console.error('Answer question error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to submit answer" 
    });
  }
};

/**
 * SUBMIT MESSAGE (Bestie can leave a message)
 */
export const submitMessage = async (req, res) => {
  try {
    const { secretCode } = req.params;
    const { messageIndex, message } = req.body;

    if (messageIndex === undefined || !message) {
      return res.status(400).json({ 
        success: false,
        message: "Message index and content are required" 
      });
    }

    const bestie = await Bestie.findOne({
      secretCode: secretCode,
      isPublished: true,
    });

    if (!bestie) {
      return res.status(404).json({ 
        success: false,
        message: "Bestie not found or not published" 
      });
    }

    // Validate message index
    if (messageIndex < 0 || messageIndex >= bestie.messages.length) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid message index" 
      });
    }

    // Update the message
    bestie.messages[messageIndex] = message;
    await bestie.save();

    res.json({
      success: true,
      message: "Message submitted successfully!",
      data: {
        message: message,
        index: messageIndex
      }
    });
  } catch (err) {
    console.error('Submit message error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to submit message" 
    });
  }
};



