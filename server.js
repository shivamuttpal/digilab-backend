const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const PORT = process.env.PORT || 3001;
dotenv.config();

// Connect to MongoDB (Make sure MongoDB is running) 


mongoose.connect(`${process.env.DBURL}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Body parser middleware
app.use(bodyParser.json());
app.use(cors());


const emailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

const Email = mongoose.model('Email', emailSchema);


// Define MongoDB Schema for Settings
const settingsSchema = new mongoose.Schema({
  logoUrl: String,
  buttonText: String,
  userEmail: String,
});

const Settings = mongoose.model('Settings', settingsSchema);

// Initialize data only if the database is empty
const initializeData = async () => {
  try {
    const existingSettingsCount = await Settings.countDocuments();

    if (existingSettingsCount === 0) {
      await Settings.create({
        logoUrl: 'https://example.com/logo.png',
        buttonText: 'Click me!',
        userEmail: 'admin@gmail.com',
      });
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

initializeData();

// Routes
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.find({});
    res.json(settings);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { logoUrl, buttonText, userEmail } = req.body;

    // Check if userEmail is "admin@gmail.com"
    if (userEmail !== 'admin@gmail.com') {
      return res.status(403).json({ error: 'Permission denied. Only admin@gmail.com can update settings.' });
    }

    // Find the existing settings based on userEmail
    const existingSettings = await Settings.findOne({ userEmail });

    if (!existingSettings) {
      return res.status(404).json({ error: 'Settings not found for the provided userEmail.' });
    }

    // Update the existing settings with the new values
    existingSettings.logoUrl = logoUrl || existingSettings.logoUrl;
    existingSettings.buttonText = buttonText || existingSettings.buttonText;

    // Save the updated settings
    const updatedSettings = await existingSettings.save();

    res.json(updatedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/api/emails', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email already exists
    const existingEmail = await Email.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Create a new email record
    const newEmail = await Email.create({ email });

    res.json(newEmail);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// New GET route for fetching all emails
app.get('/api/emails', async (req, res) => {
  try {
    const emails = await Email.find({});
    res.json(emails);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
