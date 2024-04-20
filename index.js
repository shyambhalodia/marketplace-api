const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Consider adding CORS for cross-origin requests
require('dotenv').config();

const providerRoutes = require('./routes/providers');
const serviceRoutes = require('./routes/services');
const { initializeDatabase } = require('./config/db.config');

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port

app.use(cors()); // Enable CORS if needed
app.use(bodyParser.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/providers', providerRoutes);
app.use('/services', serviceRoutes);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
