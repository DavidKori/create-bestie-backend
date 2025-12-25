import mongoose from "mongoose";
import { env } from "process";

/**
 * Connect to MongoDB
 * Make sure to set MONGO_URI in your .env file
 */
const connectDB = () => {
  try {
     mongoose.connect(process.env.MONGO_URI).then(()=> console.log('connected to db successfully !')).catch(err=>console.log(err));

  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
