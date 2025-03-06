const express = require('express');
const connectDB = require('./config/db');
const app = express();

// Connect to Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applicant', require('./routes/applicant'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applicant', require('./routes/applicant'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applicant', require('./routes/applicant'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api', require('./routes/home'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));