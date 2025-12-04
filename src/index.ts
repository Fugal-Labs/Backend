import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { connectDB } from './db/index.js';

const port = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log('Server startup failed:', err);
    process.exit(1);
  });
