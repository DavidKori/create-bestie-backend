
// backend/src/models/Bestie.js
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const BestieSchema = new mongoose.Schema({
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Admin", 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  nickname: { 
    type: String, 
    required: true 
  },
  secretCode: { 
    type: String, 
    unique: true 
  },
  
  // Song Dedication
  songDedication: { 
    type: String,
    default: ""
  },
  songDedicationData: {
    url: String,
    publicId: String,
    resourceType: String,
    duration: Number,
    size: Number,
    format: String,
    uploadedAt: Date,
    filename: String
  },
  
  // Messages
  messages: { 
    type: [String], 
    default: ["", ""] 
  },
  
  // Gallery Images
  galleryImages: [{
    url: String,
    publicId: String,
    format: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    filename: String
  }],
  
  // Playlist
  playlist: [{
    title: String,
    artist: String,
    link: String,
    audioUrl: String,
    publicId: String,
    format: String,
    size: Number,
    duration: Number,
    uploadedAt: { type: Date, default: Date.now },
    filename: String
  }],
  
  // Other fields
  playlistFiles: { type: [String], default: [] },
  jokes: { type: [String], default: [] },
  questions: { 
    type: [{
      question: String,
      answer: { type: String, default: "" }
    }], 
    default: [] 
  },
  reasons: { type: [String], default: [] },
  isPublished: { type: Boolean, default: false },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Pre-save hook to generate secret code if not exists
BestieSchema.pre('save', function() {
  if (!this.secretCode) {

    this.secretCode = `bestie_${nanoid(10)}`;
  }
 ;
});

// Update the updatedAt timestamp - FIXED VERSION
BestieSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
  // No next() needed for findOneAndUpdate
});

const Bestie = mongoose.model('Bestie', BestieSchema);
export default Bestie;