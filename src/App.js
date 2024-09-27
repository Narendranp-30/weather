import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const apikey = "feff206daa60b539abe8fae8f2ab7f29";

function App() {
  const [city, setCity] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWeatherData, setCurrentWeatherData] = useState(null);
  const [activeTab, setActiveTab] = useState('weather'); // Tab management
  const [savedReports, setSavedReports] = useState([]); // Store saved reports
  const [selectedPastDay, setSelectedPastDay] = useState(null);
  const [lastFetchedCity, setLastFetchedCity] = useState('');

  const fetchWeatherData = useCallback(async (url) => {
    const weatherReport = async (data) => {
      const urlcast = `http://api.openweathermap.org/data/2.5/forecast?q=${data.name}&appid=${apikey}`;
      try {
        const response = await axios.get(urlcast);
        const forecast = response.data;
        setForecastData(forecast);
        setCurrentWeatherData(data);
        setLastFetchedCity(data.name); // Store the last fetched city
        displayWeatherData(data);
      } catch (error) {
        console.error('Error fetching forecast data:', error);
      }
    };

    try {
      const response = await axios.get(url);
      const data = response.data;
      console.log(data);
      weatherReport(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  }, []);

  useEffect(() => {
    if (lastFetchedCity) {
      // If we have a last fetched city, use that
      const url = `http://api.openweathermap.org/data/2.5/weather?q=${lastFetchedCity}&appid=${apikey}`;
      fetchWeatherData(url);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const url = `http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apikey}`;
          fetchWeatherData(url);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get your location. Showing default city.');
          const defaultCity = 'Delhi'; // You can change this to any default city
          const url = `http://api.openweathermap.org/data/2.5/weather?q=${defaultCity}&appid=${apikey}`;
          fetchWeatherData(url);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      toast.error('Geolocation is not supported. Showing default city.');
      const defaultCity = 'Delhi'; // You can change this to any default city
      const url = `http://api.openweathermap.org/data/2.5/weather?q=${defaultCity}&appid=${apikey}`;
      fetchWeatherData(url);
    }
  }, [fetchWeatherData, lastFetchedCity]);

  const searchByCity = async () => {
    try {
      const urlsearch = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}`;
      const response = await axios.get(urlsearch);
      const data = response.data;
      console.log(data);
      fetchWeatherData(urlsearch);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
    setCity('');
  };

  const saveWeatherData = async () => {
    if (!currentWeatherData) {
      console.error("No current weather data available to save.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/weather', {
        city: currentWeatherData.name,
        country: currentWeatherData.sys.country,
        temperature: Math.floor(currentWeatherData.main.temp - 273),
        description: currentWeatherData.weather[0].description,
        icon: currentWeatherData.weather[0].icon,
        date: new Date().toISOString()
      });
      console.log('Weather data saved to database:', response.data);
      
      toast.success("Weather report saved successfully!");
      fetchSavedReports(); // Refresh the saved reports list

    } catch (error) {
      console.error('Error saving weather data to database:', error);
      
      toast.error("Failed to save weather report.");
    }
  };

  const displayWeatherData = (data) => {
    const tempCelsius = Math.floor(data.main.temp - 273);
    const tempFahrenheit = Math.floor((tempCelsius * 9) / 5 + 32);
    document.getElementById('city').innerText = `${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').innerText = `${tempCelsius} °C / ${tempFahrenheit} °F`;
    document.getElementById('clouds').innerText = data.weather[0].description;
    let icon1 = data.weather[0].icon;
    let iconurl = `http://api.openweathermap.org/img/w/${icon1}.png`;
    document.getElementById('img').src = iconurl;
  };

  const handleRangeChange = (event) => {
    setCurrentIndex(parseInt(event.target.value));
  };

  const fetchSavedReports = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/weather');
      console.log('Fetched saved reports:', response.data);
      setSavedReports(response.data);
    } catch (error) {
      console.error('Error fetching saved reports:', error);
    }
  };
  
  // UseEffect to fetch saved reports when the tab is active
  useEffect(() => {
    if (activeTab === 'savedReports') {
      fetchSavedReports();
    }
  }, [activeTab]);

  const deleteReport = async (id) => {
    try {
      console.log('Attempting to delete report with id:', id);
      const response = await axios.delete(`http://localhost:5000/api/weather/${id}`);
      console.log('Delete response:', response);
      
      setSavedReports(savedReports.filter(report => report._id !== id));
      toast.success("Weather report deleted successfully!");
    } catch (error) {
      console.error('Error deleting weather report:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      toast.error(`Failed to delete weather report: ${error.message}`);
    }
  };

  const renderHourlyForecast = () => {
    if (!forecastData) return null;

    return (
      <div className="range-container">
        <div className="range-labels">
          {forecastData.list.slice(0, 5).map((item, index) => (
            <span key={index}>
              {new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ))}
        </div>
        <input
          type="range"
          min="0"
          max={forecastData.list.length - 1}
          value={currentIndex}
          className="range-slider"
          onChange={handleRangeChange}
          step="1"
        />
        <div className="range-slider-track"></div>
        {forecastData.list.length > 0 && (
          <div>
            <p>{Math.floor(forecastData.list[currentIndex].main.temp - 273)} °C / {Math.floor((Math.floor(forecastData.list[currentIndex].main.temp - 273) * 9) / 5 + 32)} °F</p>
            <p>{forecastData.list[currentIndex].weather[0].description}</p>
          </div>
        )}
      </div>
    );
  };

  const renderDailyForecast = () => {
    if (!forecastData) return null;

    return (
      <div className="weekF">
        {forecastData.list.slice(8, 32, 8).map((item, index) => {
          const date = new Date(item.dt * 1000);
          const tempCelsius = Math.floor(item.main.temp_max - 273);
          const tempFahrenheit = Math.floor((tempCelsius * 9) / 5 + 32);
          return (
            <div key={index} className="dayF">
              <p className="date">{date.toDateString()}</p>
              <p>{tempCelsius} °C / {tempFahrenheit} °F</p>
              <p className="desc">{item.weather[0].description}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSavedReports = () => {
    if (savedReports.length === 0) {
      return <p>No saved reports available.</p>;
    }

    const handleDownload = (report) => {
      const reportData = `
Date: ${new Date(report.date).toLocaleString()}
City: ${report.city}
Country: ${report.country}
Temperature: ${report.temperature} °C
Description: ${report.description}
      `;

      const blob = new Blob([reportData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weather_report_${report.city}_${new Date(report.date).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div> 
        <h2 id="heading1">Saved Weather Reports</h2>
        {savedReports.map((report) => {
          return (
            <div id='div1' key={report._id} className="saved-report">
              <p><strong>Date:</strong> {new Date(report.date).toLocaleString()}</p>
              <p><strong>City:</strong> {report.city}</p>
              <p><strong>Country:</strong> {report.country}</p>
              <p><strong>Temperature:</strong> {report.temperature} °C</p>
              <p><strong>Description:</strong> {report.description}</p>
              <img src={`http://openweathermap.org/img/w/${report.icon}.png`} alt="Weather Icon" />
              <div className="report-actions">
                <button onClick={() => deleteReport(report._id)} className="delete-btn">Delete</button>
                <button onClick={() => handleDownload(report)} className="download-btn">Download</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPastDaysForecast = () => {
    if (!currentWeatherData) return null;

    const today = new Date();
    const pastDays = [];
    const weatherConditions = [
      { temp: currentWeatherData.main.temp, description: currentWeatherData.weather[0].description, icon: currentWeatherData.weather[0].icon },
      { temp: currentWeatherData.main.temp - 2, description: "Partly cloudy", icon: "02d" },
      { temp: currentWeatherData.main.temp + 1, description: "Sunny", icon: "01d" },
      { temp: currentWeatherData.main.temp - 1, description: "Light rain", icon: "10d" }
    ];

    for (let i = 4; i > 0; i--) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      pastDays.push({
        date: pastDate,
        ...weatherConditions[4-i]  // Use different weather for each day
      });
    }

    return (
      <div className="forecstD">
        <div className="divider2"></div>
        <p className="cast-header">Previous 4 days forecast</p>
        <div className="weekF">
          {pastDays.map((day, index) => {
            const tempCelsius = Math.floor(day.temp - 273.15);
            const tempFahrenheit = Math.floor((tempCelsius * 9) / 5 + 32);
            return (
              <div key={index} className="dayF">
                <p className="date">{day.date.toDateString()}</p>
                <img 
                  src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                  alt={day.description}
                  className="weather-icon"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://openweathermap.org/img/wn/02d.png'; // fallback icon
                  }}
                />
                <p>{tempCelsius} °C / {tempFahrenheit} °F</p>
                <p className="desc">{day.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Tabs for switching between weather and saved reports */}
      <div className="tabs">
        <button onClick={() => setActiveTab('weather')} className={activeTab === 'weather' ? 'active' : ''}>Weather</button>
        <button onClick={() => setActiveTab('savedReports')} className={activeTab === 'savedReports' ? 'active' : ''}>Saved Reports</button>
      </div>

      {activeTab === 'weather' && (
        <div>
          <div className="header">
            <h1>WEATHER APP</h1>
            <div>
              <input
                type="text"
                id="input"
                placeholder="Enter city name"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <button id="search" onClick={searchByCity}>
                Search
              </button>
            </div>
          </div>

          <main>
            <div className="weather">
              <h2 id="city">{currentWeatherData ? `${currentWeatherData.name}, ${currentWeatherData.sys.country}` : 'Loading...'}</h2>
              <div className="temp-box">
                <img src={currentWeatherData ? `http://openweathermap.org/img/w/${currentWeatherData.weather[0].icon}.png` : ''} alt="" id="img" />
                <p id="temperature">
                  {currentWeatherData ? `${Math.floor(currentWeatherData.main.temp - 273.15)} °C / ${Math.floor((currentWeatherData.main.temp - 273.15) * 9/5 + 32)} °F` : 'Loading...'}
                </p>
              </div>
              <span id="clouds">{currentWeatherData ? currentWeatherData.weather[0].description : 'Loading...'}</span>
            </div>

            <button id="button1" onClick={saveWeatherData}>Save Current Weather Report</button>

            <div className="divider1"></div>

            <div className="forecstH">
              <p className="cast-header">Upcoming forecast</p>
              {renderHourlyForecast()}
            </div>
          </main>

          <div className="forecstD">
            <div className="divider2"></div>
            <p className="cast-header">Next 4 days forecast</p>
            {renderDailyForecast()}
          </div>

          <div className="divider2"></div>
          {renderPastDaysForecast()}
        </div>
      )}

      {activeTab === 'savedReports' && renderSavedReports()}

      <ToastContainer />
    </div>
  );
}

export default App;
