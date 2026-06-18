import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env');
  }

  // Helps avoid deprecation warnings in Mongoose
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err?.message || err);
    throw err;
  }
};
