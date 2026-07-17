import mongoose from 'mongoose';

export const connectDB = async () => {
  const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/securevote';
  try {
    await mongoose.connect(dbUri);
    console.log('MongoDB Connected successfully to:', dbUri);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.error('Please ensure MongoDB is running or run via Docker: "docker-compose up -d"');
    process.exit(1);
  }
};
