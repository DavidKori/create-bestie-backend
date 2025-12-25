// backend/test-cloudinary.js
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('Testing Cloudinary configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key exists:', !!process.env.CLOUDINARY_API_KEY);
console.log('API Secret exists:', !!process.env.CLOUDINARY_API_SECRET);

// Test connection
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('Cloudinary connection failed:', error.message);
    console.error('Please check your .env file and Cloudinary credentials');
  } else {
    console.log('Cloudinary connection successful!');
    console.log('Status:', result.status);
  }
});