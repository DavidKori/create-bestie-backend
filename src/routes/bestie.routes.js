// routes/bestie.routes.js
import express from 'express';
import { 
  createBestie,
  getBesties,
  getBestieById,
  getBestieByCode,
  updateBestie,
  deleteBestie,
  togglePublishBestie,
  addGalleryImage,
  removeGalleryImage,
  updateSongDedication,
  updatePlaylistItem,
  addPlaylistItem,
  removePlaylistItem,
  uploadPlaylistAudio,
  answerQuestion,
  submitMessage
} from '../controllers/bestie.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin routes (protected)
router.post('/', protect, createBestie);
router.get('/', protect, getBesties);
router.get('/:id', protect, getBestieById);
router.put('/:id', protect, updateBestie);
router.delete('/:id', protect, deleteBestie);
router.post('/:id/publish', protect, togglePublishBestie);
router.post('/:id/gallery', protect, addGalleryImage);
router.delete('/:id/gallery', protect, removeGalleryImage);
router.put('/:id/song', protect, updateSongDedication);
router.put('/:id/playlist/:index', protect, updatePlaylistItem);
// Add these routes:
router.post('/:id/playlist', protect, addPlaylistItem);
router.delete('/:id/playlist/:index', protect, removePlaylistItem);
router.put('/:id/playlist/:index', protect, updatePlaylistItem); // Metadata only
router.post('/:id/playlist/:index/audio', protect, uploadPlaylistAudio); // Audio upload only

// Public route (no auth required)
router.get('/public/:secretCode', getBestieByCode);
router.post('/public/:secretCode/answer', answerQuestion);
router.post('/public/:secretCode/message', submitMessage);

export default router;





