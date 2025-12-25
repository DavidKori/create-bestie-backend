import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import bestieRoutes from "./routes/bestie.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import uploadRoutes from "./routes/upload.routes.js";



dotenv.config();

const app = express();

// Middleware
// app.use(cors({
//   origin: ['https://davidkori.github.io',
//      'https://davidkori.github.io/create-bestie.com',
//     'https://davidkori.github.io/bestie.com'], // No trailing slashes or paths
//   credentials: true
// }))
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorHandler);

// __dirname fix for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files statically
//app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/upload", uploadRoutes);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/besties", bestieRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Bestie App API is running");
});
app.use("/api/admin", adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'BestieSpace Upload Service'
  });
});


// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  //   console.log('Upload endpoints available at:');
  // console.log('  POST /api/upload/admin/profile');
  // console.log('  POST /api/upload/besties/gallery');
  // console.log('  POST /api/upload/besties/song');
  // console.log('  POST /api/upload/besties/playlist');
});
