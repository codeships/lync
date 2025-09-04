import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;


  // 🔴 Suggestion: Add more context to this error (e.g., which env file is missing)
  if (!uri) throw new Error(uri);

  // ✅ This ris fine – helps avoid deprecation warnings in Mongoose
  mongoose.set('strictQuery', true);
  
  // 🔴 Improvement: Wrap the connection in try/catch to handle DB connection errors gracefully
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};
