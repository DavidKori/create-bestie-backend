import express from "express";
import { signup, login } from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Admin signup
 * @access  Public
 */
router.post("/signup", signup);

/**
 * @route   POST /api/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post("/login", login);

export default router;
