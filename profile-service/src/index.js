const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const studentProfileRoutes = require('./routes/studentProfile');

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/auth-db';

app.use(cors());
app.use(express.json());

app.use('/profile/student', studentProfileRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'profile-service' });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Profile Service connected to MongoDB (Users DB)');
    app.listen(PORT, () => {
      console.log(`Profile Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
