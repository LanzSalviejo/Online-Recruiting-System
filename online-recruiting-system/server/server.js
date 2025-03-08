const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const app = express();

// Connect to Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applicant', require('./routes/applicant'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/profile', require('./routes/profile')); 
app.use('/api/screening', require('./routes/screening'));
app.use('/api/matching', require('./routes/matching'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api', require('./routes/home'));
// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));