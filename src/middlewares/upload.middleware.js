import multer from "multer";
import path from "path";
import fs from "fs";

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "/uploads/others";

    if (file.fieldname === "songDedication") folder = "uploads/video";
    else if (file.fieldname === "galleryImages") folder = "uploads/gallery";
    else if (file.fieldname === "playlistFiles") folder = "uploads/songs";
    else if (file.fieldname === "profilePhoto") folder = "uploads/admin";

    // Ensure folder exists
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    cb(null, folder);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + "-" + file.originalname.replace(/\s+/g, "-")
    );
  },
});

export const upload = multer({ storage });
