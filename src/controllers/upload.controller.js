import cloudinary from "../config/cloudinary.js";

/**
 * Generic uploader
 */
const uploadToCloudinary = async (file, folder, resourceType) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: resourceType, // image | video | auto
  });

  return result.secure_url;
};

/**
 * Upload Gallery Image
 */
export const uploadGalleryPhoto = async (req, res) => {
  const url = await uploadToCloudinary(
    req.file,
    "bestie/gallery",
    "image"
  );
  res.json({ url });
};

/**
 * Upload Admin Profile Photo
 */
export const uploadProfilePhoto = async (req, res) => {
  const url = await uploadToCloudinary(
    req.file,
    "admin/profile",
    "image"
  );
  res.json({ url });
};

/**
 * Upload Playlist Audio
 */
export const uploadPlaylistAudio = async (req, res) => {
  const url = await uploadToCloudinary(
    req.file,
    "bestie/playlist",
    "video" // Cloudinary treats audio as video
  );
  res.json({ url });
};

/**
 * Upload Dedicated Song (Video or Audio)
 */
export const uploadDedicatedSong = async (req, res) => {
  const url = await uploadToCloudinary(
    req.file,
    "bestie/song",
    "video"
  );
  res.json({ url });
};
