const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Local MongoDB connection URI
const MONGODB_URI = 'mongodb://localhost:27017/weatherforecast';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());

// Create a Mongoose model for weather data
const WeatherData = mongoose.model('WeatherData', {
  city: String,
  country: String,
  temperature: Number,
  description: String,
  icon: String,
  date: { type: Date, default: Date.now } // Add date field
});

// Route to handle storing weather data
app.post('/api/weather', async (req, res) => {
  try {
    const { city, country, temperature, description, icon, date } = req.body;
    const weatherData = new WeatherData({
      city,
      country,
      temperature,
      description,
      icon,
      date // Add this line
    });
    await weatherData.save();
    res.status(201).json(weatherData);
  } catch (error) {
    console.error('Error saving weather data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to handle fetching saved weather data
app.get('/api/weather', async (req, res) => {
  try {
    const weatherReports = await WeatherData.find().sort({ date: -1 }); // Fetch all saved reports sorted by date (newest first)
    res.json(weatherReports);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Route to handle deleting weather data
app.delete('/api/weather/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await WeatherData.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Weather report not found' });
    }
    
    res.json({ message: 'Weather report deleted successfully' });
  } catch (error) {
    console.error('Error deleting weather data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

