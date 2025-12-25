
import express from "express";
import { 
  getProfile, 
  updateProfile, 
  updatePassword,
  updateAdminDetails 
} from "../controllers/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * GET admin profile
 */
router.get("/profile", getProfile);

/**
 * UPDATE admin profile (name/email read-only, photo via separate upload)
 */
router.put("/profile", updateProfile);

/**
 * UPDATE password
 */
router.put("/password", updatePassword);

/**
 * UPDATE admin details (for future use)
 */
router.put("/details", updateAdminDetails);

export default router;